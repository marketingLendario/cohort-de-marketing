import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Precedência determinística por tipo canônico (Phase 2 handoff). */
export const ARTIFACT_RULES = [
  {
    key: 'avatar',
    label: 'avatar',
    guide: '/avatar-funil',
    patterns: ['avatar.md', 'relatorio-avatar.md', 'pesquisa-avatar-*/relatorio-avatar.md'],
  },
  {
    key: 'offerbook',
    label: 'offerbook',
    guide: '/offerbook',
    patterns: ['offerbook.md', 'offerbook-*.md'],
  },
  { key: 'copy', label: 'copy.md', guide: '/copy-funil', patterns: ['copy.md'] },
  { key: 'funnel', label: 'funil.md', guide: '/metodo-funil', patterns: ['funil.md'] },
  { key: 'design', label: 'DESIGN.md', guide: '/design-md', patterns: ['DESIGN.md'] },
  { key: 'salesPage', label: 'pagina/index.html', guide: '/pagina-vendas-funil', patterns: ['pagina/index.html'] },
];

function hashFile(path) {
  if (!existsSync(path)) return '';
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function globToRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

function listRelativeFiles(projectRoot, prefix = '') {
  const out = [];
  const dir = prefix ? join(projectRoot, prefix) : projectRoot;
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listRelativeFiles(projectRoot, rel));
    else out.push(rel.replace(/\\/g, '/'));
  }
  return out;
}

function matchPattern(files, pattern) {
  const re = globToRegex(pattern.replace(/\\/g, '/'));
  return files.filter((f) => re.test(f));
}

export function resolveArtifactBindings(projectRoot) {
  const files = listRelativeFiles(projectRoot);
  const bindings = {};
  const ambiguous = [];
  const entries = [];

  for (const rule of ARTIFACT_RULES) {
    let selectedPattern = null;
    let matches = [];
    for (const pattern of rule.patterns) {
      const tierMatches = [...new Set(matchPattern(files, pattern))].sort();
      if (tierMatches.length === 0) continue;
      selectedPattern = pattern;
      matches = tierMatches;
      break;
    }
    if (matches.length === 0) {
      bindings[rule.key] = { status: 'missing', guide: rule.guide, label: rule.label };
      continue;
    }
    if (matches.length > 1) {
      ambiguous.push({ key: rule.key, matches });
      bindings[rule.key] = {
        status: 'ambiguous',
        matches,
        rule: selectedPattern,
        code: 'AMBIGUOUS_ARTIFACT',
        guide: rule.guide,
        label: rule.label,
      };
      continue;
    }
    const rel = matches[0];
    const abs = join(projectRoot, rel);
    const sha256 = hashFile(abs);
    const sizeBytes = existsSync(abs) ? readFileSync(abs).length : 0;
    const artifactId = `art_${createHash('sha256').update(`${rule.key}\n${rel}\n${sha256}`).digest('hex').slice(0, 16)}`;
    const binding = {
      status: 'bound',
      artifactId,
      artifactType: rule.key,
      path: rel,
      hash: sha256,
      sha256,
      size: sizeBytes,
      sizeBytes,
      rule: selectedPattern,
      origin: { kind: 'precedence-rule', rule: selectedPattern },
      confirmationStatus: 'confirmed',
      guide: rule.guide,
      label: rule.label,
    };
    bindings[rule.key] = binding;
    entries.push(binding);
  }

  return {
    schemaVersion: '1.0.0',
    projectRoot,
    artifactIndex: {
      schemaVersion: 'artifact-index-v1',
      projectRoot,
      entries,
      summary: {
        total: entries.length,
        confirmed: entries.length,
        ambiguous: ambiguous.length,
      },
    },
    bindings,
    ambiguous,
    missingKeys: Object.entries(bindings).filter(([, v]) => v.status === 'missing').map(([k]) => k),
    blocksAll: Object.values(bindings).some((v) => v.status !== 'bound'),
  };
}

export function readBoundFile(projectRoot, bindings, key) {
  const b = bindings?.[key];
  if (!b || b.status !== 'bound' || !b.path) return null;
  const p = join(projectRoot, b.path);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

export function missingArtifactsFromBindings(resolution) {
  return ARTIFACT_RULES.filter((r) => resolution.bindings[r.key]?.status !== 'bound').map((r) => ({
    key: r.key,
    path: r.patterns[0],
    guide: r.guide,
    label: r.label,
    status: resolution.bindings[r.key]?.status ?? 'missing',
  }));
}
