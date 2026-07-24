import { createHash } from 'node:crypto';
import { NIVEL_ENUM, parseFunilNivel, parseTicketAndMargin } from '../iniciar-trafego-gates.mjs';
import { readBoundFile, resolveArtifactBindings } from './artifact-resolution.mjs';
import { readManifest } from './project-context.mjs';

export const CONVERSION_MODES = new Set(['direct_checkout', 'application_call', 'lead_capture']);

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function excerpt(text, pattern) {
  if (!text) return null;
  const match = text.match(pattern);
  return match?.[0]?.trim() ?? text.split(/\r?\n/).find((line) => line.trim())?.trim() ?? null;
}

export function detectConversionMode(funilText, offerbookText = '') {
  const blob = `${funilText ?? ''}\n${offerbookText ?? ''}`.toLowerCase();
  if (/\b(aplica[cç][aã]o|call de qualifica|venda consultiva|webin[aá]rio)\b/.test(blob)
    && /\bnunca checkout direto\b/.test(blob)) return 'application_call';
  if (/\bcheckout direto\b|\bcheckout r\$\s*\d|\bpay\.hotmart\b|\bvenda direta\b/.test(blob)) return 'direct_checkout';
  if (/\blead capture\b|\bformul[aá]rio de lead\b/.test(blob)) return 'lead_capture';
  if (/\bcheckout\b/.test(blob) && !/\baplica[cç][aã]o\b/.test(blob)) return 'direct_checkout';
  return 'application_call';
}

function fieldEvidence(bindings, key, value, locator, sourceText = null) {
  const binding = bindings[key];
  if (!binding || binding.status !== 'bound') return null;
  return {
    value,
    sourceArtifactId: binding.artifactId,
    sourcePath: binding.path,
    sourceHash: binding.sha256,
    locator: {
      type: 'text',
      value: locator || excerpt(sourceText, /.+/),
    },
  };
}

function sourceHashes(bindings) {
  return Object.fromEntries(
    Object.entries(bindings)
      .filter(([, binding]) => binding.status === 'bound')
      .map(([key, binding]) => [key, binding.sha256]),
  );
}

function validateSemanticReceipt(receipt, hashes) {
  if (!receipt) return null;
  if (receipt.approved !== true || !Array.isArray(receipt.fields)) {
    throw new Error('SEMANTIC_RECEIPT_NOT_APPROVED');
  }
  for (const field of receipt.fields) {
    if (!field.field || !field.sourceArtifactId || !field.sourceHash || !field.locator) {
      throw new Error('SEMANTIC_RECEIPT_EVIDENCE_MISSING');
    }
    if (!Object.values(hashes).includes(field.sourceHash)) {
      throw new Error(`SEMANTIC_RECEIPT_STALE:${field.field}`);
    }
  }
  return {
    ...receipt,
    receiptHash: hash(JSON.stringify(receipt)),
  };
}

export function buildCanonicalInput(projectRoot, input = {}) {
  const resolution = input.resolution ?? resolveArtifactBindings(projectRoot);
  const manifest = readManifest(projectRoot);
  const avatarText = readBoundFile(projectRoot, resolution.bindings, 'avatar');
  const offerbookText = readBoundFile(projectRoot, resolution.bindings, 'offerbook');
  const copyText = readBoundFile(projectRoot, resolution.bindings, 'copy');
  const funnelText = readBoundFile(projectRoot, resolution.bindings, 'funnel');
  const designText = readBoundFile(projectRoot, resolution.bindings, 'design');
  const pageText = readBoundFile(projectRoot, resolution.bindings, 'salesPage');
  const awareness = parseFunilNivel(funnelText);
  const economicsParsed = parseTicketAndMargin(offerbookText);
  const conversionMode = detectConversionMode(funnelText, offerbookText);
  const hashes = sourceHashes(resolution.bindings);
  const semanticReceipt = validateSemanticReceipt(input.semanticReceipt, hashes);

  const fields = {
    profile: fieldEvidence(resolution.bindings, 'avatar', null, 'documento de perfil/avatar', avatarText),
    avatar: fieldEvidence(resolution.bindings, 'avatar', excerpt(avatarText, /^#\s+.+$/m), excerpt(avatarText, /^#\s+.+$/m), avatarText),
    offer: fieldEvidence(resolution.bindings, 'offerbook', excerpt(offerbookText, /^#\s+.+$/m), excerpt(offerbookText, /^#\s+.+$/m), offerbookText),
    awareness: fieldEvidence(
      resolution.bindings,
      'funnel',
      awareness,
      excerpt(funnelText, /N[ií]vel\s*4[^\r\n]*/i),
      funnelText,
    ),
    conversionMode: fieldEvidence(
      resolution.bindings,
      'funnel',
      conversionMode,
      excerpt(funnelText, /(aplica[cç][aã]o|checkout|lead capture)[^\r\n]*/i),
      funnelText,
    ),
    funnel: fieldEvidence(resolution.bindings, 'funnel', excerpt(funnelText, /^#\s+.+$/m), excerpt(funnelText, /^#\s+.+$/m), funnelText),
    copyAngles: fieldEvidence(
      resolution.bindings,
      'copy',
      (copyText?.match(/^#\s+(.+)$/gm) ?? []).slice(0, 4).map((line) => line.replace(/^#\s+/, '')),
      'headings H1',
      copyText,
    ),
    design: fieldEvidence(resolution.bindings, 'design', excerpt(designText, /^#\s+.+$/m), excerpt(designText, /^#\s+.+$/m), designText),
    page: fieldEvidence(resolution.bindings, 'salesPage', resolution.bindings.salesPage?.path ?? null, 'arquivo HTML', pageText),
    ticket: fieldEvidence(
      resolution.bindings,
      'offerbook',
      economicsParsed.ticket,
      excerpt(offerbookText, /R\$\s*[\d.]+(?:,\d{2})?/),
      offerbookText,
    ),
    marginPct: economicsParsed.margem_pct == null
      ? null
      : fieldEvidence(
        resolution.bindings,
        'offerbook',
        economicsParsed.margem_pct,
        excerpt(offerbookText, /margem[^\r\n]*/i),
        offerbookText,
      ),
  };

  const previousHashes = input.previousCanonical?.sourceHashes ?? null;
  const stale = previousHashes
    ? JSON.stringify(previousHashes) !== JSON.stringify(hashes)
    : false;
  const canonical = {
    schemaVersion: '2.0.0',
    project: {
      projectId: manifest?.projectId ?? null,
      slug: manifest?.slug ?? projectRoot.split(/[/\\]/).pop(),
      projectRoot,
    },
    conversionMode,
    fields,
    economics: {
      ticket: economicsParsed.ticket,
      margem_pct: economicsParsed.margem_pct,
      valid: economicsParsed.valid,
    },
    bindings: resolution.bindings,
    sourceHashes: hashes,
    semanticReceipt,
    stale,
    staleReason: stale ? 'SOURCE_HASH_CHANGED' : null,
  };
  canonical.canonicalHash = hash(JSON.stringify(canonical));
  if (awareness && !NIVEL_ENUM.has(awareness)) canonical.errors = [`nivel_consciencia invalido: ${awareness}`];
  return { canonical, resolution, manifest };
}

export function dryRunProposalReady(assessment, buildProposalFn) {
  try {
    buildProposalFn(assessment);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
