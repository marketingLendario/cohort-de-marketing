import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const loadJson = (relativePath) => JSON.parse(readFileSync(join(root, relativePath), 'utf8'));
const catalog = loadJson('data/skill-catalog.json');
const rules = loadJson('data/skill-unlock-rules.json');
const briefSchema = loadJson('data/project-brief.schema.json');
const sourceLock = loadJson('.claude/skills/_shared/squad-trafego/source-lock.json');
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function collectSchemaPaths(schema) {
  const paths = new Set();
  function walk(definition, prefix = '') {
    for (const [key, child] of Object.entries(definition.properties ?? {})) {
      const path = prefix ? `${prefix}.${key}` : key;
      paths.add(path);
      walk(child, path);
    }
  }
  walk(schema);
  return paths;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function listTree(root, relative = '') {
  return readdirSync(join(root, relative), { withFileTypes: true })
    .flatMap((entry) => {
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      return entry.isDirectory() ? listTree(root, child) : [child];
    })
    .sort();
}

assert(catalog.schemaVersion === '1.0.0', 'catalog schemaVersion must be 1.0.0');
assert(Array.isArray(catalog.skills), 'catalog.skills must be an array');
assert(catalog.skills.length === 31, `catalog must contain 31 skills, found ${catalog.skills.length}`);

const ids = catalog.skills.map((skill) => skill.id);
assert(new Set(ids).size === ids.length, 'catalog contains duplicate skill ids');

const ruleIds = Object.keys(rules.skills);
for (const id of ids) assert(ruleIds.includes(id), `missing unlock rule for ${id}`);
for (const id of ruleIds) assert(ids.includes(id), `unlock rule without catalog skill: ${id}`);

const schemaPaths = collectSchemaPaths(briefSchema);
for (const [skillId, rule] of Object.entries(rules.skills)) {
  for (const key of ['requiredFields', 'recommendedFields']) {
    for (const field of rule[key] ?? []) {
      assert(schemaPaths.has(field), `${skillId}.${key} references unknown field ${field}`);
    }
  }
  for (const group of rule.anyOf ?? []) {
    for (const field of group.fields ?? []) {
      assert(schemaPaths.has(field), `${skillId}.anyOf references unknown field ${field}`);
    }
  }
  for (const condition of rule.notApplicableWhen ?? []) {
    assert(schemaPaths.has(condition.field), `${skillId}.notApplicableWhen references unknown field ${condition.field}`);
  }
  for (const artifact of [
    ...(rule.primaryArtifacts ?? []),
    ...(rule.requiredArtifacts ?? []),
    ...(rule.recommendedArtifacts ?? []),
  ]) {
    assert(Boolean(rules.artifactGlobs[artifact]), `${skillId} references unknown artifact ${artifact}`);
  }
}

for (const skill of catalog.skills) {
  const canonicalPath = join(root, skill.skillPath);
  const mirrorPath = join(root, skill.skillPath.replace(/^\.claude\/skills/, '.agents/skills'));
  assert(existsSync(canonicalPath), `missing canonical skill file ${skill.skillPath}`);
  assert(existsSync(mirrorPath), `missing mirror skill file for ${skill.id}`);
  if (!existsSync(canonicalPath) || !existsSync(mirrorPath)) continue;
  const canonical = readFileSync(canonicalPath);
  const mirror = readFileSync(mirrorPath);
  assert(canonical.equals(mirror), `mirror differs for ${skill.id}`);
  const frontmatterName = canonical.toString('utf8').match(/^---[\s\S]*?^name:\s*([^\n]+)$/m)?.[1]?.trim();
  assert(frontmatterName === skill.id, `${skill.id} frontmatter name is ${frontmatterName ?? 'missing'}`);
  assert(skill.command === `/${skill.id}`, `${skill.id} command must be /${skill.id}`);
  assert(skill.execution?.requiresHumanReview === true, `${skill.id} must require human review`);
  if (skill.execution?.mirrorTree) {
    const canonicalRoot = dirname(canonicalPath);
    const mirrorRoot = dirname(mirrorPath);
    const canonicalFiles = listTree(canonicalRoot);
    const mirrorFiles = listTree(mirrorRoot);
    assert(JSON.stringify(canonicalFiles) === JSON.stringify(mirrorFiles), `mirror tree differs for ${skill.id}`);
    for (const relative of canonicalFiles) {
      if (!mirrorFiles.includes(relative)) continue;
      assert(
        readFileSync(join(canonicalRoot, relative)).equals(readFileSync(join(mirrorRoot, relative))),
        `mirror file differs for ${skill.id}: ${relative}`,
      );
    }
  }
  if (skill.id === 'ads-creative-factory') {
    const skillRoot = dirname(canonicalPath);
    const releaseManifest = JSON.parse(readFileSync(join(skillRoot, 'source-manifest.json'), 'utf8'));
    assert(releaseManifest.publication?.verdict === 'PASS', 'ads-creative-factory release verdict must be PASS');
    assert(releaseManifest.releaseVersion === '2.2.0', 'ads-creative-factory release version must be 2.2.0');
    const allowedPaths = [...(releaseManifest.allowList ?? [])].sort();
    const releasedPaths = [...(releaseManifest.files ?? []).map((file) => file.path)].sort();
    assert(new Set(allowedPaths).size === allowedPaths.length, 'ads-creative-factory allow-list contains duplicates');
    assert(new Set(releasedPaths).size === releasedPaths.length, 'ads-creative-factory release files contain duplicates');
    assert(
      JSON.stringify(allowedPaths) === JSON.stringify(releasedPaths),
      'ads-creative-factory allow-list and release files must match exactly',
    );
    for (const file of releaseManifest.files ?? []) {
      const releasedPath = join(skillRoot, file.path);
      assert(existsSync(releasedPath), `ads-creative-factory released file missing: ${file.path}`);
      if (existsSync(releasedPath)) {
        assert(sha256(readFileSync(releasedPath)) === file.sha256, `ads-creative-factory hash drift: ${file.path}`);
      }
    }
  }
}

for (const edge of catalog.edges) {
  assert(ids.includes(edge.from), `edge source does not exist: ${edge.from}`);
  assert(ids.includes(edge.to), `edge target does not exist: ${edge.to}`);
  assert(edge.from !== edge.to, `self edge is not allowed: ${edge.from}`);
}

const dependencyAdjacency = new Map(ids.map((id) => [id, []]));
for (const edge of catalog.edges.filter((candidate) => candidate.type === 'dependency')) {
  dependencyAdjacency.get(edge.from)?.push(edge.to);
}
const visiting = new Set();
const visited = new Set();
function visit(id, stack = []) {
  if (visiting.has(id)) {
    errors.push(`dependency cycle: ${[...stack, id].join(' -> ')}`);
    return;
  }
  if (visited.has(id)) return;
  visiting.add(id);
  for (const next of dependencyAdjacency.get(id) ?? []) visit(next, [...stack, id]);
  visiting.delete(id);
  visited.add(id);
}
for (const id of ids) visit(id);

for (const [relativePath, expectedHash] of Object.entries(sourceLock.files)) {
  const filePath = join(root, '.claude/skills', relativePath);
  assert(existsSync(filePath), `source-lock file missing: ${relativePath}`);
  if (existsSync(filePath)) {
    assert(sha256(readFileSync(filePath)) === expectedHash, `source-lock hash drift: ${relativePath}`);
  }
}

if (errors.length) {
  console.error(`Skill catalog validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Skill catalog OK: ${catalog.skills.length} skills, ${catalog.edges.length} edges, canonical mirror verified.`);
