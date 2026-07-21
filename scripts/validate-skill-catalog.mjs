import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const loadJson = (relativePath) => JSON.parse(readFileSync(join(root, relativePath), 'utf8'));
const catalog = loadJson('data/skill-catalog.json');
const rules = loadJson('data/skill-unlock-rules.json');
const executionMatrix = loadJson('data/skill-execution-matrix.json');
const documentPackContracts = loadJson('data/document-pack-contracts.json');
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

function collectFiles(directory, prefix = '') {
  const files = new Map();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '__pycache__' || entry.name.endsWith('.pyc')) continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [path, hash] of collectFiles(absolute, relative)) files.set(path, hash);
    } else if (entry.isFile()) {
      files.set(relative, sha256(readFileSync(absolute)));
    }
  }
  return files;
}

assert(catalog.schemaVersion === '1.0.0', 'catalog schemaVersion must be 1.0.0');
assert(Array.isArray(catalog.skills), 'catalog.skills must be an array');
assert(catalog.skills.length > 0, 'catalog must contain at least one skill');
assert(executionMatrix.schemaVersion === '1.0.0', 'execution matrix schemaVersion must be 1.0.0');
assert(Array.isArray(executionMatrix.skills), 'execution matrix skills must be an array');
assert(documentPackContracts.schemaVersion === '2.0.0', 'document pack schemaVersion must be 2.0.0');
assert(Array.isArray(documentPackContracts.contracts), 'document pack contracts must be an array');

const ids = catalog.skills.map((skill) => skill.id);
assert(new Set(ids).size === ids.length, 'catalog contains duplicate skill ids');
const executionIds = executionMatrix.skills.map((skill) => skill.id);
assert(new Set(executionIds).size === executionIds.length, 'execution matrix contains duplicate skill ids');
for (const id of ids) assert(executionIds.includes(id), `execution matrix missing skill ${id}`);
for (const id of executionIds) assert(ids.includes(id), `execution matrix references unknown skill ${id}`);
for (const skill of executionMatrix.skills) {
  assert(['specialized', 'generic_proposal', 'native_partial'].includes(skill.panelMode), `${skill.id} has invalid panelMode`);
  assert(['full_e2e', 'partial', 'proposal_only'].includes(skill.parity), `${skill.id} has invalid parity`);
  assert(typeof skill.adapter === 'string' && skill.adapter.length > 0, `${skill.id} must declare an adapter`);
  assert(Array.isArray(skill.missingCapabilities), `${skill.id}.missingCapabilities must be an array`);
  assert(Array.isArray(skill.evidence), `${skill.id}.evidence must be an array`);
  if (skill.parity === 'full_e2e') {
    assert(skill.panelMode === 'specialized', `${skill.id} full_e2e must use a specialized panel mode`);
    assert(skill.missingCapabilities.length === 0, `${skill.id} full_e2e cannot have missing capabilities`);
    assert(skill.evidence.length > 0, `${skill.id} full_e2e must have evidence`);
  } else {
    assert(skill.missingCapabilities.length > 0, `${skill.id} non-full parity must explain missing capabilities`);
  }
}
const documentContractIds = documentPackContracts.contracts.map((contract) => contract.skillId);
assert(new Set(documentContractIds).size === documentContractIds.length, 'document pack contains duplicate skill contracts');
for (const contract of documentPackContracts.contracts) {
  const skill = catalog.skills.find((candidate) => candidate.id === contract.skillId);
  const execution = executionMatrix.skills.find((candidate) => candidate.id === contract.skillId);
  assert(Boolean(skill), `document pack references unknown skill ${contract.skillId}`);
  assert(['document-pack', 'brand-design'].includes(execution?.adapter), `${contract.skillId} document pack requires a contract-capable adapter`);
  assert(['v-suffix', 'version-directory'].includes(contract.versioning), `${contract.skillId} must preserve canonical immutable versions`);
  assert(['owner-document', 'funnel-page-pack', 'interactive-pack', 'message-collection', 'dynamic-library', 'brand-system'].includes(contract.contractGroup), `${contract.skillId} has invalid contractGroup`);
  assert(contract.bookEntry && typeof contract.bookEntry.path === 'string', `${contract.skillId} must declare bookEntry`);
  const outputs = [...(contract.requiredTextOutputs ?? []), ...(contract.optionalTextOutputs ?? []), ...(contract.derivedOutputs ?? [])];
  const paths = outputs.map((output) => output.path);
  assert(new Set(paths).size === paths.length, `${contract.skillId} document pack contains duplicate paths`);
  for (const path of paths) {
    assert(typeof path === 'string' && !path.startsWith('/') && !path.includes('..') && !path.includes('\\'), `${contract.skillId} has unsafe output path ${path}`);
    assert(skill?.outputs.includes(path), `${contract.skillId} catalog does not declare document output ${path}`);
  }
  for (const output of [...(contract.requiredTextOutputs ?? []), ...(contract.optionalTextOutputs ?? [])]) {
    assert(['markdown', 'html', 'json', 'yaml'].includes(output.format), `${contract.skillId} has unsupported text format ${output.format}`);
    assert(output.validationProfile === undefined || ['sales-page-v1', 'owner-document-v1', 'lead-page-v1', 'video-script-v1', 'quiz-app-v1', 'message-copy-v1', 'collection-index-v1'].includes(output.validationProfile), `${contract.skillId} has unsupported validation profile ${output.validationProfile}`);
    if (output.validationProfile === 'sales-page-v1') {
      assert(output.format === 'html', `${contract.skillId} sales-page-v1 validation requires html`);
    }
  }
  for (const collection of contract.requiredCollections ?? []) {
    assert(Number.isInteger(collection.minItems) && collection.minItems > 0, `${contract.skillId} collection ${collection.pathPattern} needs positive minItems`);
    assert(typeof collection.pathPattern === 'string' && !collection.pathPattern.startsWith('/') && !collection.pathPattern.includes('..') && !collection.pathPattern.includes('\\'), `${contract.skillId} has unsafe collection pattern ${collection.pathPattern}`);
    assert(skill?.outputs.includes(collection.pathPattern), `${contract.skillId} catalog does not declare collection ${collection.pathPattern}`);
    assert(collection.validationProfile === undefined || ['message-copy-v1', 'owner-document-v1', 'collection-index-v1'].includes(collection.validationProfile), `${contract.skillId} has unsupported collection validation profile ${collection.validationProfile}`);
  }
  for (const group of contract.requiredAnyOf ?? []) {
    assert(Array.isArray(group) && group.length > 1, `${contract.skillId} requiredAnyOf needs alternatives`);
    for (const path of group) assert(paths.includes(path), `${contract.skillId} requiredAnyOf references unknown path ${path}`);
  }
  const carouselGalleryPaths = (contract.carouselOutputs ?? []).map((output) => output.galleryPath);
  assert(paths.includes(contract.bookEntry.path) || carouselGalleryPaths.includes(contract.bookEntry.path), `${contract.skillId} bookEntry references unknown path ${contract.bookEntry.path}`);
  for (const output of contract.derivedOutputs ?? []) {
    assert(paths.includes(output.sourcePath), `${contract.skillId} derived output ${output.path} has unknown source ${output.sourcePath}`);
    assert(['chromium-pdf', 'offerbook-docx'].includes(output.renderer), `${contract.skillId} has unsupported renderer ${output.renderer}`);
  }
  for (const output of contract.derivedCollectionOutputs ?? []) {
    assert((contract.requiredCollections ?? []).some((collection) => collection.pathPattern === output.sourcePattern), `${contract.skillId} derived collection references unknown source ${output.sourcePattern}`);
    assert(output.renderer === 'chromium-pdf' && output.outputExtension === '.pdf', `${contract.skillId} has unsupported derived collection renderer`);
  }
  for (const output of contract.carouselOutputs ?? []) {
    assert(paths.includes(output.sourcePath), `${contract.skillId} carousel references unknown source ${output.sourcePath}`);
    assert(typeof output.galleryPath === 'string' && !output.galleryPath.startsWith('/') && !output.galleryPath.includes('..') && !output.galleryPath.includes('\\'), `${contract.skillId} has unsafe carousel gallery path`);
    assert(typeof output.versionRoot === 'string' && !output.versionRoot.startsWith('/') && !output.versionRoot.includes('..') && !output.versionRoot.includes('\\'), `${contract.skillId} has unsafe carousel version root`);
    assert(skill?.outputs.includes(output.galleryPath), `${contract.skillId} catalog does not declare carousel gallery ${output.galleryPath}`);
  }
}
for (const skill of executionMatrix.skills.filter((entry) => entry.adapter === 'document-pack')) {
  assert(documentContractIds.includes(skill.id), `document-pack adapter missing contract for ${skill.id}`);
}

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
  const canonicalTree = collectFiles(dirname(canonicalPath));
  const mirrorTree = collectFiles(dirname(mirrorPath));
  assert(JSON.stringify([...canonicalTree]) === JSON.stringify([...mirrorTree]), `mirror tree differs for ${skill.id}`);
  const frontmatterName = canonical.toString('utf8').match(/^---[\s\S]*?^name:\s*([^\n]+)$/m)?.[1]?.trim();
  assert(frontmatterName === skill.id, `${skill.id} frontmatter name is ${frontmatterName ?? 'missing'}`);
  assert(skill.command === `/${skill.id}`, `${skill.id} command must be /${skill.id}`);
  assert(skill.execution?.requiresHumanReview === true, `${skill.id} must require human review`);
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

const fullParity = executionMatrix.skills.filter((skill) => skill.parity === 'full_e2e').length;
console.log(`Skill catalog OK: ${catalog.skills.length} skills, ${catalog.edges.length} edges, ${fullParity} full-parity, canonical mirror verified.`);
