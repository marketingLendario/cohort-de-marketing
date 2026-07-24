#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessProject,
  buildProposal,
  parseApprovalText,
  readPanelBlocks,
  buildStagedPanelContent,
  hashPanelContent,
  writeCanonicalPanel,
} from './lib/iniciar-trafego-gates.mjs';
import { ensureManifest, readManifest } from './lib/iniciar-trafego/project-context.mjs';
import { resolvePublishedUrl, persistSyncReceipt, verifyAndWriteDeployment, PageVerifyError } from './lib/iniciar-trafego/page-verifier.mjs';
import {
  assessmentHash,
  assertProposalSeedReady,
  loadProposal,
  persistApproval,
  persistProposal,
  loadLatestApproval,
  loadLatestProposal,
} from './lib/iniciar-trafego/proposal-store.mjs';
import {
  buildResumeHint,
  ensureRunState,
  loadRunState,
  markPanelValidated,
  markPanelWritten,
  resolveResumeAction,
  transitionRunState,
} from './lib/iniciar-trafego/run-state.mjs';
import { studioConnectionConfig } from './lib/iniciar-trafego/studio-connection.mjs';
import { syncTrafficStart, readbackTrafficStart } from './lib/iniciar-trafego/studio-sync-client.mjs';
import { compareReadbackToHandoff } from './lib/iniciar-trafego/readback-compare.mjs';
import { discoverProjects, resolveProjectFromArgs } from './lib/iniciar-trafego/project-discovery.mjs';
import { loadRegistry, registerProject } from './lib/iniciar-trafego/project-registry.mjs';
import { resolveArtifactBindings } from './lib/iniciar-trafego/artifact-resolution.mjs';
import { openProject, releaseRuntime } from './lib/iniciar-studio/coordinator.mjs';
import { loadLease } from './lib/iniciar-studio/runtime-lease.mjs';
import { removeResumeIntent } from './lib/iniciar-studio/platform/index.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const cmd = argv[0];
const args = Object.fromEntries(
  argv.slice(1).map((a) => {
    const raw = a.replace(/^--/, '');
    const eq = raw.indexOf('=');
    if (eq === -1) return [raw, true];
    return [raw.slice(0, eq), raw.slice(eq + 1)];
  }),
);

function usage() {
  console.error(`Uso:
  node scripts/iniciar-trafego.mjs discover [--json]
  node scripts/iniciar-trafego.mjs select --project=projetos/{slug} [--json]
  node scripts/iniciar-trafego.mjs start --project=projetos/{slug} [--json]
  node scripts/iniciar-trafego.mjs set-page-url --project=... --url=https://...
  node scripts/iniciar-trafego.mjs propose --project=... [--stdin-json]
  node scripts/iniciar-trafego.mjs approve --project=... --proposal-id=... --approval-text="..."
  node scripts/iniciar-trafego.mjs resume --project=... [--execute] [--hint-only]
  node scripts/iniciar-trafego.mjs open --project=... [--decline]
  node scripts/iniciar-trafego.mjs status --project=...`);
  process.exit(1);
}

function projectPath() {
  const raw = String(args.project ?? args.p ?? '').trim();
  if (!raw) {
    const resolution = resolveProjectFromArgs({
      cohortRoot: ROOT,
      cwd: process.cwd(),
      registry: loadRegistry(ROOT),
    });
    if (resolution.mode === 'select') {
      emit({
        ok: false,
        code: resolution.code,
        question: 'Escolha o projeto:',
        choices: resolution.choices,
      });
      process.exit(2);
    }
    return resolution.root;
  }
  if (!raw) throw new Error('Projeto invalido — use --project=projetos/{slug}');
  const p = resolve(raw);
  if (!existsSync(p)) throw new Error('Projeto invalido — use --project=projetos/{slug}');
  return p;
}

function cmdDiscover() {
  const result = discoverProjects({ cohortRoot: resolve(String(args.root ?? ROOT)) });
  if (args.json !== false) emit(result);
  else {
    for (const c of result.candidates.filter((x) => !x.excluded)) {
      console.log(`${c.slug}\t${c.rootRelative}\tcompleteness=${(c.completeness ?? 0).toFixed(2)}`);
    }
  }
}

function cmdSelect() {
  const project = projectPath();
  const slug = project.split(/[/\\]/).pop();
  const bindings = resolveArtifactBindings(project);
  const manifest = ensureManifest(project, slug);
  registerProject(ROOT, project, {
    slug,
    rootRelative: relative(ROOT, project).replace(/\\/g, '/'),
    bindings: bindings.bindings,
  });
  ensureRunState(project, manifest.projectId);
  transitionRunState(project, {
    state: 'PROJECT_RESOLVED',
    note: 'projeto selecionado e registrado',
    projectRoot: project,
    resumableAction: 'start',
  });
  emit({
    ok: true,
    projectId: manifest.projectId,
    slug,
    projectRoot: project,
    bindings: bindings.bindings,
    missingKeys: bindings.missingKeys,
  });
}

function emit(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

async function cmdStart() {
  const project = projectPath();
  const manifest = ensureManifest(project, project.split(/[/\\]/).pop());
  const bindings = resolveArtifactBindings(project);
  registerProject(ROOT, project, {
    slug: manifest.slug,
    rootRelative: relative(ROOT, project).replace(/\\/g, '/'),
    bindings: bindings.bindings,
  });
  ensureRunState(project, manifest.projectId);
  transitionRunState(project, { state: 'ASSESSING', note: 'assessment iniciado' });
  const assessment = assessProject(project, ROOT);
  assessment.publishedUrl = resolvePublishedUrl(project, assessment);
  const seed = assessment.blocksProposal ? null : assertProposalSeedReady(assessment);
  const state = seed ? 'PROPOSAL_SEED_READY' : 'BLOCKED';
  const run = transitionRunState(project, {
    state,
    note: assessment.blocksProposal ? 'assessment bloqueou proposta' : 'seed pronto',
    hashes: { assessmentHash: seed?.assessmentHash ?? assessmentHash(assessment) },
    resumableAction: assessment.blocksProposal ? 'start' : 'propose',
  });
  const out = {
    ok: !assessment.blocksProposal,
    state: run.state,
    runId: run.runId,
    projectId: manifest.projectId,
    assessmentHash: seed?.assessmentHash ?? assessmentHash(assessment),
    resumableAction: run.resumableAction,
    assessment,
    pending: assessment.pending,
  };
  if (args.json !== false) emit(out);
  process.exit(assessment.blocksProposal ? 2 : 0);
}

async function cmdSetPageUrl() {
  const project = projectPath();
  const manifest = ensureManifest(project, project.split(/[/\\]/).pop());
  ensureRunState(project, manifest.projectId);
  const url = String(args.url ?? '');
  if (!url) throw new Error('--url=https://... obrigatorio');
  try {
    const assessment = assessProject(project, ROOT);
    const dep = await verifyAndWriteDeployment(project, url, {
      conversionMode: assessment.conversionMode,
      origin: 'set-page-url',
    });
    const run = transitionRunState(project, {
      state: 'INPUTS_READY',
      note: 'deployment verificado',
      resumableAction: 'start',
    });
    emit({ ok: true, state: run.state, deployment: dep, resumableAction: run.resumableAction });
  } catch (e) {
    if (e instanceof PageVerifyError) {
      transitionRunState(project, {
        state: e.code || 'BLOCKED',
        note: e.message,
        error: { code: e.code, message: e.message },
        resumableAction: 'set-page-url',
      });
      emit({ ok: false, code: e.code, error: e.message, details: e.details ?? null });
      process.exit(2);
    }
    throw e;
  }
}

function cmdPropose() {
  const project = projectPath();
  const manifest = ensureManifest(project, project.split(/[/\\]/).pop());
  ensureRunState(project, manifest.projectId);
  const assessment = assessProject(project, ROOT);
  assessment.publishedUrl = resolvePublishedUrl(project, assessment);
  if (assessment.blocksProposal) {
    transitionRunState(project, { state: 'BLOCKED', note: 'propose bloqueado', resumableAction: 'start' });
    emit({ ok: false, error: 'projeto incompleto', critical: assessment.critical });
    process.exit(2);
  }
  const built = buildProposal(assessment);
  const { record } = persistProposal(project, assessment, built);
  transitionRunState(project, {
    state: 'PROPOSAL_PERSISTED',
    note: 'proposta persistida',
    hashes: { proposalHash: record.proposalHash, assessmentHash: record.assessmentHash },
  });
  const run = transitionRunState(project, {
    state: 'AWAITING_APPROVAL',
    note: 'aguardando aprovacao humana',
    resumableAction: 'approve',
  });
  emit({
    ok: true,
    state: run.state,
    runId: run.runId,
    proposalId: record.proposalId,
    proposalHash: record.proposalHash,
    resumableAction: run.resumableAction,
    proposal: record,
  });
}

async function cmdApprove() {
  const project = projectPath();
  const proposalId = String(args['proposal-id'] ?? args.proposalId ?? '');
  const approvalText = String(args['approval-text'] ?? args.approvalText ?? '');
  if (!proposalId || !approvalText) throw new Error('--proposal-id e --approval-text obrigatorios');
  const parsed = parseApprovalText(approvalText);
  if (!parsed.approved) throw new Error('Aprovacao textual explicita obrigatoria');

  const manifest = ensureManifest(project, project.split(/[/\\]/).pop());
  ensureRunState(project, manifest.projectId);
  const { record } = loadProposal(project, proposalId);
  const assessment = assessProject(project, ROOT);
  assessment.publishedUrl = resolvePublishedUrl(project, assessment);
  if (assessmentHash(assessment) !== record.assessmentHash) {
    transitionRunState(project, {
      state: 'STALE',
      note: 'assessment drift',
      resumableAction: 'propose',
      error: { code: 'PROPOSAL_STALE', message: 'Fontes alteradas desde a proposta' },
    });
    throw new Error('Fontes alteradas desde a proposta — reproponha (STALE)');
  }

  persistApproval(project, record, approvalText);
  transitionRunState(project, {
    state: 'APPROVED',
    note: 'aprovacao humana registrada',
    hashes: { proposalHash: record.proposalHash },
  });

  transitionRunState(project, {
    state: 'STAGING',
    note: 'preparando handoff Studio',
    hashes: { proposalHash: record.proposalHash },
  });

  const staged = buildStagedPanelContent(project, ROOT, record);
  const panelHash = hashPanelContent(staged.content);

  const handoff = {
    schemaVersion: '1.0.0',
    sourceProjectId: manifest.projectId,
    sourceProjectSlug: manifest.slug,
    proposalId: record.proposalId,
    proposalHash: record.proposalHash,
    panelPath: 'trafego/PAINEL-DA-SEMANA.yaml',
    panelHash,
    panelContent: staged.content,
    angles: record.angles,
    insumosYaml: record.insumosYaml,
    economics: {
      ticket: assessment.economics.ticket,
      margem_pct: assessment.economics.margem_pct,
    },
    publishedUrl: assessment.publishedUrl,
    campaignPlan: { panelPath: 'trafego/PAINEL-DA-SEMANA.yaml', angles: record.angles },
  };

  transitionRunState(project, { state: 'STUDIO_SYNCING', note: 'sync Studio iniciado', lock: 'STUDIO_SYNCING' });

  const handoffPath = resolve(project, '.aiox', 'studio-handoff.json');
  let syncResult = null;
  let readback = null;
  let panelPath = null;
  try {
    syncResult = await syncTrafficStart(handoff, project, {
      runId: loadRunState(project)?.runId,
      handoffPath,
      beforePost: () => {
        const assessmentAfterEnsure = assessProject(project, ROOT);
        assessmentAfterEnsure.publishedUrl = resolvePublishedUrl(project, assessmentAfterEnsure);
        if (assessmentHash(assessmentAfterEnsure) !== record.assessmentHash) {
          transitionRunState(project, {
            state: 'STALE',
            note: 'assessment drift pos-ensure',
            lock: null,
            resumableAction: 'propose',
            error: { code: 'PROPOSAL_STALE', message: 'Fontes alteradas durante ensure Studio' },
          });
          throw new Error('Fontes alteradas durante bootstrap — reproponha (STALE)');
        }
      },
    });
    if (!syncResult?.receiptId) {
      transitionRunState(project, {
        state: 'STUDIO_SYNC_FAILED',
        note: 'sync sem receiptId',
        lock: null,
        resumableAction: 'approve',
        error: { code: 'STUDIO_SYNC_FAILED', message: 'Studio sync não retornou receiptId' },
      });
      emit({
        ok: false,
        panelPath,
        state: 'STUDIO_SYNC_FAILED',
        error: 'Studio sync não retornou receiptId',
        sync: syncResult,
      });
      process.exit(3);
    }
    const expectedReceipt = structuredClone(syncResult);
    handoff.receiptArtifactId = syncResult?.entities?.artifactIds?.[0]
      ?? syncResult?.receipt?.entities?.artifactIds?.[0];
    handoff.entityVersions = syncResult?.entityVersions
      ?? syncResult?.receipt?.entityVersions
      ?? null;
    if (!handoff.entityVersions) {
      transitionRunState(project, {
        state: 'STUDIO_READBACK_FAILED',
        note: 'sync sem entityVersions imutaveis',
        lock: null,
        resumableAction: 'approve',
        error: { code: 'STUDIO_SYNC_FAILED', message: 'Receipt nao retornou entityVersions esperadas' },
      });
      emit({ ok: false, state: 'STUDIO_READBACK_FAILED', error: 'Receipt sem entityVersions' });
      process.exit(3);
    }
    readback = await readbackTrafficStart(syncResult.receiptId);
    transitionRunState(project, { state: 'STUDIO_VERIFYING', note: 'readback fail-closed', lock: 'STUDIO_SYNCING' });
    const cmp = compareReadbackToHandoff(handoff, readback, expectedReceipt);
    if (!cmp.ok) {
      transitionRunState(project, {
        state: 'STUDIO_READBACK_FAILED',
        note: cmp.errors.join('; '),
        lock: null,
        resumableAction: 'approve',
        error: { code: 'STUDIO_READBACK_FAILED', message: cmp.errors.join('; ') },
      });
      emit({
        ok: false,
        state: 'STUDIO_READBACK_FAILED',
        error: cmp.errors.join('; '),
        sync: syncResult,
        readback,
      });
      process.exit(3);
    }
    if (!readback?.ok || readback?.schemaVersion !== '1.0.0' || !readback?.entities) {
      transitionRunState(project, {
        state: 'STUDIO_READBACK_FAILED',
        note: 'readback falhou',
        lock: null,
        resumableAction: 'approve',
        error: { code: 'STUDIO_READBACK_FAILED', message: readback?.message || readback?.code || 'readback invalido' },
      });
      emit({
        ok: false,
        state: 'STUDIO_READBACK_FAILED',
        error: readback?.message || readback?.code || 'readback não confirmou domínio materializado',
        sync: syncResult,
        readback,
      });
      process.exit(3);
    }
    panelPath = writeCanonicalPanel(project, handoff.panelPath, staged.content);
    const finalPanelHash = hashPanelContent(readFileSync(panelPath, 'utf8'));
    if (finalPanelHash !== panelHash) {
      transitionRunState(project, {
        state: 'STUDIO_READBACK_FAILED',
        note: 'finalPanelHash diverge do panelHash canonico',
        lock: null,
        resumableAction: 'approve',
        error: { code: 'PANEL_HASH_MISMATCH', message: 'Painel final diverge do hash canonico' },
      });
      emit({
        ok: false,
        state: 'STUDIO_READBACK_FAILED',
        error: 'Painel final diverge do hash canonico',
        sync: syncResult,
        readback,
      });
      process.exit(3);
    }
    markPanelWritten(project, finalPanelHash);
    readPanelBlocks(panelPath);
    markPanelValidated(project);
    persistSyncReceipt(project, { ...syncResult, readbackOk: true, deepLink: readback.deepLink });
  } catch (e) {
    transitionRunState(project, {
      state: 'STUDIO_SYNC_FAILED',
      note: e.message,
      lock: null,
      resumableAction: 'approve',
      error: { code: 'STUDIO_SYNC_FAILED', message: e.message },
    });
    emit({
      ok: false,
      panelPath,
      state: 'STUDIO_SYNC_FAILED',
      error: e.message,
      studioStatus: e.status ?? null,
      studioBody: e.body ?? null,
    });
    process.exit(3);
  }

  transitionRunState(project, {
    state: 'STUDIO_SYNCED',
    note: 'sync + readback confirmados',
    lock: null,
    hashes: { receiptId: syncResult.receiptId, deepLink: readback.deepLink },
    resumableAction: 'open',
  });
  const run = transitionRunState(project, {
    state: 'OPEN_DECISION',
    note: 'pergunta abrir Studio',
    resumableAction: 'open',
  });

  emit({
    ok: true,
    state: run.state,
    runId: run.runId,
    panelPath,
    proposalId: record.proposalId,
    sync: syncResult,
    readback,
    deepLink: readback?.deepLink ?? null,
    resumableAction: run.resumableAction,
    openQuestion: 'Quer abrir?',
  });
}

function cmdResume() {
  const project = projectPath();
  const manifest = ensureManifest(project, project.split(/[/\\]/).pop());
  const run = loadRunState(project) ?? ensureRunState(project, manifest.projectId);
  const action = run.resumableAction || resolveResumeAction(run.state);
  const hintOnly = args['hint-only'] === true || args.hintOnly === true || args['hint-only'] === 'true';
  const shouldExecute = args.execute !== false && args.execute !== 'false' && !hintOnly;

  if (!shouldExecute) {
    emit({
      ok: true,
      state: run.state,
      runId: run.runId,
      resumableAction: action,
      hint: buildResumeHint(project, action, {
        proposalId: args['proposal-id'] ?? args.proposalId ?? run.hashes?.proposalId,
      }),
      run,
    });
    return;
  }

  if (action === 'start') return cmdStart();
  if (action === 'propose') return cmdPropose();
  if (action === 'set-page-url') return cmdSetPageUrl();
  if (action === 'open') return cmdOpen();
  if (action === 'approve') {
    const proposalId = String(
      args['proposal-id'] ?? args.proposalId ?? run.hashes?.proposalId ?? loadLatestProposal(project)?.proposalId ?? '',
    );
    const approval = loadLatestApproval(project, proposalId);
    if (!proposalId || !approval?.approvalText) {
      emit({
        ok: false,
        state: run.state,
        error: 'Resume approve exige proposal-id e aprovacao persistida',
        resumableAction: action,
        hint: buildResumeHint(project, action, { proposalId }),
      });
      process.exit(2);
    }
    args['proposal-id'] = proposalId;
    args.proposalId = proposalId;
    args['approval-text'] = approval.approvalText;
    args.approvalText = approval.approvalText;
    return cmdApprove();
  }

  emit({
    ok: true,
    state: run.state,
    runId: run.runId,
    resumableAction: action,
    hint: buildResumeHint(project, action, { proposalId: run.hashes?.proposalId }),
    run,
    note: 'Nenhuma acao executavel automaticamente neste estado',
  });
}

async function openBrowser(url) {
  const platform = process.platform;
  if (platform === 'win32') {
    await new Promise((resolvePromise, reject) => {
      spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', windowsHide: true })
        .on('error', reject)
        .on('exit', () => resolvePromise());
    });
    return true;
  }
  const opener = platform === 'darwin' ? 'open' : 'xdg-open';
  await new Promise((resolvePromise, reject) => {
    spawn(opener, [url], { stdio: 'ignore' })
      .on('error', reject)
      .on('exit', () => resolvePromise());
  });
  return true;
}

function resolveStudioAppUrl() {
  const config = studioConnectionConfig();
  if (process.env.MARKETING_STUDIO_APP_URL) return process.env.MARKETING_STUDIO_APP_URL;
  if (config.stateFile && existsSync(config.stateFile)) {
    try {
      const state = JSON.parse(readFileSync(config.stateFile, 'utf8'));
      if (state?.appUrl) return state.appUrl;
      if (state?.webPort) return `http://127.0.0.1:${state.webPort}`;
    } catch {
      /* ignore */
    }
  }
  return process.env.MARKETING_STUDIO_URL || 'http://127.0.0.1:5173';
}

async function cmdOpen() {
  const project = projectPath();
  const run = loadRunState(project);
  const lease = loadLease(project);
  if (args.decline === true || args.decline === 'true') {
    if (!run || !['STUDIO_SYNCED', 'OPEN_DECISION'].includes(run.state)) {
      throw new Error(`decline-open só após sync (atual: ${run?.state ?? 'sem run'})`);
    }
    transitionRunState(project, { state: 'NOT_OPENED', note: 'operador recusou abrir Studio' });
    const next = transitionRunState(project, { state: 'READY_FOR_ZELADOR', note: 'handoff para zelador', resumableAction: null });
    await removeResumeIntent(project, lease ?? {});
    emit({ ok: true, state: next.state, runId: next.runId, opened: false, synchronized: true, leaseId: lease?.leaseId ?? null });
    return;
  }
  if (!run || !['STUDIO_SYNCED', 'OPEN_DECISION'].includes(run.state)) {
    throw new Error(`open só permitido após STUDIO_SYNCED (atual: ${run?.state ?? 'sem run'})`);
  }
  const deepLink = run.hashes?.deepLink;
  if (!deepLink) throw new Error('deep link verificado do projeto ausente — home genérica proibida');
  if (!lease?.leaseId) throw new Error('lease do Studio ausente — abertura recusada');
  const opened = await openProject(project, { leaseId: lease.leaseId, deepLink });
  transitionRunState(project, { state: 'OPENED', note: `browser aberto ${deepLink}` });
  const next = transitionRunState(project, { state: 'READY_FOR_ZELADOR', note: 'handoff para zelador', resumableAction: null });
  await removeResumeIntent(project, lease);
  emit({ ok: true, state: next.state, runId: next.runId, appUrl: deepLink, opened: true, openReceipt: opened.receipt });
}

function cmdStatus() {
  const project = projectPath();
  const manifest = readManifest(project);
  const assessment = assessProject(project, ROOT);
  const run = loadRunState(project);
  emit({
    ok: true,
    projectId: manifest?.projectId ?? null,
    assessmentHash: assessmentHash(assessment),
    blocksProposal: assessment.blocksProposal,
    runState: run?.state ?? null,
    runId: run?.runId ?? null,
    resumableAction: run?.resumableAction ?? null,
  });
}

try {
  if (cmd === 'discover') cmdDiscover();
  else if (cmd === 'select') cmdSelect();
  else if (cmd === 'start') await cmdStart();
  else if (cmd === 'set-page-url') await cmdSetPageUrl();
  else if (cmd === 'propose') cmdPropose();
  else if (cmd === 'approve') await cmdApprove();
  else if (cmd === 'resume') await cmdResume();
  else if (cmd === 'open') await cmdOpen();
  else if (cmd === 'status') cmdStatus();
  else usage();
} catch (e) {
  console.error(JSON.stringify({ ok: false, error: e.message }, null, 2));
  process.exit(1);
}
