import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildProposal, proposalSourceHash } from '../iniciar-trafego-gates.mjs';
import { aioxDir, ensureRunDirs, newId, readJson, writeJson } from './project-context.mjs';

export function assessmentHash(assessment) {
  return createHash('sha256')
    .update(JSON.stringify({
      missing: assessment.missingArtifacts?.map((a) => a.key) ?? [],
      pageOk: assessment.pageOk,
      pixelOk: assessment.pixelOk,
      checkoutOk: assessment.checkoutOk,
      conversionMode: assessment.conversionMode,
      funilNivel: assessment.funilNivel,
      economics: assessment.economics,
      pendingCodes: assessment.pending?.map((item) => item.code) ?? [],
      canonicalHash: assessment.canonical?.canonicalHash,
      sourceHashes: assessment.canonical?.sourceHashes,
      sourceHash: proposalSourceHash(assessment),
    }))
    .digest('hex')
    .slice(0, 16);
}

export function assertProposalSeedReady(assessment) {
  const before = assessmentHash(assessment);
  const proposal = buildProposal(assessment);
  const after = assessmentHash(assessment);
  if (assessment.blocksProposal || before !== after || !proposal?.sourceHash) {
    throw new Error('PROPOSAL_SEED_READY recusado: dry-run/hash do assessment inválido');
  }
  return { proposal, assessmentHash: before };
}

export function proposalHash(proposal) {
  return createHash('sha256').update(JSON.stringify({
    schemaVersion: proposal.schemaVersion,
    projectId: proposal.projectId,
    assessmentHash: proposal.assessmentHash,
    sourceHashes: proposal.sourceHashes,
    canonicalInput: proposal.canonicalInput,
    conversionMode: proposal.conversionMode,
    insumosYaml: proposal.insumosYaml,
    angles: proposal.angles,
  })).digest('hex').slice(0, 16);
}

export function persistProposal(projectRoot, assessment, built) {
  ensureRunDirs(projectRoot);
  const proposalId = newId('prop');
  const canonicalHashes = assessment.canonical?.sourceHashes ?? {};
  const record = {
    schemaVersion: '1.0.0',
    proposalId,
    projectId: assessment.canonical?.project?.projectId,
    proposalHash: '',
    assessmentHash: assessmentHash(assessment),
    sourceHashes: {
      materials: proposalSourceHash(assessment),
      avatar: canonicalHashes.avatar,
      offerbook: canonicalHashes.offerbook,
      copy: canonicalHashes.copy,
      funil: canonicalHashes.funnel,
      design: canonicalHashes.design,
      page: canonicalHashes.salesPage,
    },
    canonicalInput: assessment.canonical,
    conversionMode: assessment.conversionMode,
    angles: built.angles,
    insumosYaml: built.insumosYaml,
    sourceHash: built.sourceHash,
    economics: assessment.economics,
    calcProvenance: 'ticket × margem_pct; roas_break_even = 1 / margem_pct',
    panelPatch: { sections: ['insumos_a2', 'projecao'] },
    studioHandoffDraft: {
      sourceProjectId: assessment.canonical?.project?.projectId,
      sourceProjectSlug: assessment.canonical?.project?.slug,
      panelPath: 'trafego/PAINEL-DA-SEMANA.yaml',
    },
    createdAt: new Date().toISOString(),
  };
  record.proposalHash = proposalHash(record);
  const path = join(aioxDir(projectRoot), 'proposals', `${proposalId}.json`);
  writeJson(path, record);
  return { path, record };
}

export function loadProposal(projectRoot, proposalId) {
  const path = join(aioxDir(projectRoot), 'proposals', `${proposalId}.json`);
  const record = readJson(path);
  if (!record) throw new Error(`Proposta nao encontrada: ${proposalId}`);
  return { path, record };
}

export function loadLatestProposal(projectRoot) {
  const dir = join(aioxDir(projectRoot), 'proposals');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (!files.length) return null;
  return files
    .map((file) => readJson(join(dir, file)))
    .filter(Boolean)
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))[0] ?? null;
}

export function loadLatestApproval(projectRoot, proposalId) {
  const path = join(aioxDir(projectRoot), 'approvals', `${proposalId}.json`);
  return readJson(path);
}

export function persistApproval(projectRoot, proposal, approvalText) {
  ensureRunDirs(projectRoot);
  const approval = {
    schemaVersion: '1.0.0',
    proposalId: proposal.proposalId,
    proposalHash: proposal.proposalHash,
    approvalText,
    approvedAt: new Date().toISOString(),
    actor: 'human',
    parserResult: {
      approved: true,
      normalizedText: String(approvalText).trim().toLowerCase(),
    },
  };
  const path = join(aioxDir(projectRoot), 'approvals', `${proposal.proposalId}.json`);
  writeJson(path, approval);
  return { path, approval };
}
