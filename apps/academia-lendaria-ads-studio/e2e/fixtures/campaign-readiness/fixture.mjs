import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

/**
 * Fixture do piloto "Pedro" (STORY-12.W5.1 — E2E integrado do gate de
 * campanhas). Modelada explicitamente em `e2e/fixtures/traffic-pilot/fixture.mjs`
 * (STORY-8.W3.1): mesmo padrão de seed real via `service_role` contra o
 * Supabase LOCAL (nunca contra um projeto remoto), mesma convenção de limpeza
 * idempotente antes/depois, mesmo estilo de conteúdo de fixture manualmente
 * autorado (o precedente do próprio `COPY_CONTENT`/`PANEL_REFERENCE` daquele
 * arquivo já estabelece que fixture content escrito à mão é a convenção aceita
 * neste repo — não é "fabricação" no sentido que a story proíbe).
 *
 * Proveniência real x seed direto (ver Dev Notes da story para a decisão
 * completa):
 *  - `empty`/`warning`: dados semeados diretamente (linhas reais no Postgres
 *    local, sob RLS real, avaliadas pelo motor de prontidão REAL do app em
 *    runtime — nunca uma segunda implementação da matriz) porque provam o
 *    CONTRATO (`campaign-readiness.v1`) contra um backend real, não uma
 *    execução de skill.
 *  - `ready`: o artefato `copy` (entrada legítima, não produzida por nenhuma
 *    skill deste catálogo) é semeado; a bateria do Briefista (`trafficCreativeBattery`)
 *    NASCE de uma execução REAL do Codex CLI durante o próprio teste — é essa
 *    execução, não o seed, que prova fase/progresso/erro/retry/cancelamento/
 *    estado terminal (AC2).
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '../../..');
const repoRoot = resolve(appRoot, '..', '..');

const emptySlug = 'story-12-w5-1-pilot-empty';
const warningSlug = 'story-12-w5-1-pilot-warning';
const readySlug = 'story-12-w5-1-pilot-ready';

export const CAMPAIGN_READINESS_PILOT = Object.freeze({
  email: 'campaign-readiness-pilot-12-w5-1@fixture.local',
  password: 'CampaignPilot12W51!fixture',
  workspaceId: '90510000-0000-0000-0000-000000000000',
  emptyProjectId: '90510000-0000-0000-0000-000000000e01',
  warningProjectId: '90510000-0000-0000-0000-000000000a01',
  readyProjectId: '90510000-0000-0000-0000-000000000da1',
  warningBriefId: '90510000-0000-0000-0000-00000000ba01',
  readyBriefId: '90510000-0000-0000-0000-00000000bda1',
  warningCampaignId: '90510000-0000-0000-0000-00000000ca01',
  emptySlug,
  warningSlug,
  readySlug,
  emptyProjectName: '',
  warningProjectName: 'Piloto de prontidão · aviso · 12.W5.1',
  readyProjectName: 'Piloto de prontidão · pronto · 12.W5.1',
  warningCampaignName: 'Campanha fixture · warning · 12.W5.1',
  bffUrl: 'http://127.0.0.1:3303',
  webUrl: 'http://127.0.0.1:5179',
  boundaryToken: 'campaign-readiness-pilot-12-w5-1-boundary',
});

const READY_COPY_CONTENT = `# Copy e ângulos — piloto de prontidão (STORY-12.W5.1)

Projeto: ${CAMPAIGN_READINESS_PILOT.readyProjectName}
Oferta: Auditoria de prontidão de campanha
Preço literal: R$ 900
Página: https://fixture.local/pronto

## Ângulos

1. "Sua campanha só sobe quando está realmente pronta" — consciente_do_problema
2. "O gate que impede campanha órfã" — consciente_da_solucao

## Prova e voz

Voz de marca, sem promessa de performance garantida. O piloto usa dados
literais fornecidos pelo operador e não publica na Meta.
`;

const WARNING_ARTIFACT_CONTENT = {
  copy: `# Copy — piloto de prontidão (warning)\n\nOferta: Auditoria de prontidão de campanha\nPágina: https://fixture.local/warning\n`,
  trafficTrackingAudit: [
    'zelador:',
    '  status_geral: "PARCIAL"',
    '  bm_ativo: true',
    '  conta_anuncios_ativa: true',
    '  pixel_disparando: true',
    '  capi_ativo: true',
    '  compra_deduplicada: true',
    '  dominio_verificado: false',
    '  pagamento_aprovado: true',
    '',
  ].join('\n'),
  trafficCreativeBattery: '# Bateria criativa (fixture warning)\n\n1. Hook: "Pare de subir campanha sem gate." — feed\n2. Hook: "O checklist que falta na sua conta." — reels-9x16\n',
  trafficCampaignPlan: '# Estrutura da campanha (fixture warning)\n\nTipo: Vendas\nPúblico: Amplo/frio + Advantage+\nVerba: R$ 30/dia\n',
  trafficMetricReading: [
    'leitor:',
    '  sinais:',
    '    - metrica: "cpa"',
    '      valor: 42.5',
    '      selo: "real"',
    '    - metrica: "roas"',
    '      valor: 2.1',
    '      selo: "real"',
    '',
  ].join('\n'),
  funnel: '# Funil (fixture warning)\n\nFormato recomendado: webinário\nDestino de fechamento: checkout\n',
  salesPage: '# Página de vendas (fixture warning)\n\nHeadline: "Sua campanha, auditada antes de subir."\n',
  offerbook: '# Offerbook (fixture warning)\n\nOferta: Auditoria de prontidão de campanha\nPreço: R$ 900\n',
};

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

async function removeExistingUser(admin) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Não foi possível listar usuários da fixture: ${JSON.stringify(error)}`);
  const existing = data.users.find((user) => user.email === CAMPAIGN_READINESS_PILOT.email);
  if (existing) {
    const result = await admin.auth.admin.deleteUser(existing.id);
    if (result.error) throw new Error(`Não foi possível remover usuário anterior: ${result.error.message}`);
  }
}

async function deleteFixtureRows(admin) {
  const workspace = CAMPAIGN_READINESS_PILOT.workspaceId;
  const tables = [
    ['artifact_approval_outbox', 'workspace_id'],
    ['human_decisions', 'workspace_id'],
    ['skill_run_jobs', 'workspace_id'],
    ['skill_runs', 'workspace_id'],
    ['campaign_plan_revisions', 'workspace_id'],
    ['ads_campaigns', 'workspace_id'],
    ['project_artifacts', 'workspace_id'],
    ['project_brief_revisions', 'workspace_id'],
    ['marketing_projects', 'workspace_id'],
    ['workspace_members', 'workspace_id'],
    ['workspaces', 'id'],
  ];
  for (const [table, column] of tables) {
    const { error } = await admin.from(table).delete().eq(column, workspace);
    if (error && !['PGRST205', '42P01'].includes(error.code)) {
      throw new Error(`Falha limpando ${table}: ${JSON.stringify(error)}`);
    }
  }
}

async function writeProjectFiles(slug, files) {
  const projectRoot = resolve(repoRoot, 'projetos', slug);
  await rm(projectRoot, { recursive: true, force: true });
  await mkdir(projectRoot, { recursive: true });
  for (const [path, content] of Object.entries(files)) {
    const target = resolve(projectRoot, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  return projectRoot;
}

function readyBriefData() {
  return {
    schemaVersion: '0.1.0',
    meta: { createdAt: '2026-07-16T09:00:00.000Z', updatedAt: '2026-07-16T09:00:00.000Z', completionStatus: 'ready_for_campaign_readiness_pilot' },
    project: {
      slug: CAMPAIGN_READINESS_PILOT.readySlug,
      name: CAMPAIGN_READINESS_PILOT.readyProjectName,
      currentStage: 'trafego',
      voice: 'marca',
      regulatedNiche: 'nao',
    },
    market: {
      awarenessLevel: 'consciente_do_problema',
      dominantPain: 'Não sabe se o projeto está realmente pronto antes de subir uma campanha real.',
      avatarSummary: 'Operador que já foi pego por uma campanha subida sem checklist completo.',
      trafficTemperature: 'frio',
      trafficSource: 'pago',
    },
    offer: {
      name: 'Auditoria de prontidão de campanha',
      exactPrice: 900,
      proofAssets: ['copy.md'],
    },
    channels: {
      primaryCtaUrl: 'https://fixture.local/pronto',
      thankYouPageUrl: 'https://fixture.local/pronto/obrigado',
      adFormats: ['reels 9:16', 'feed'],
    },
    data: {
      dataSourceNotes: 'Fixture isolada (STORY-12.W5.1): números literais fornecidos pelo operador.',
    },
    funnel: { primaryPage: 'https://fixture.local/pronto' },
    integrations: { metaStatus: 'recommend_only' },
  };
}

function warningBriefData() {
  const data = readyBriefData();
  data.project.slug = CAMPAIGN_READINESS_PILOT.warningSlug;
  data.project.name = CAMPAIGN_READINESS_PILOT.warningProjectName;
  data.market.trafficTemperature = 'morno';
  // Único campo recomendado deliberadamente ausente (AC — fixture "warning"):
  // afeta só `leitor-de-metricas`/`diagnosticador` (recommendedFields), sem
  // bloquear nenhuma capability — overallState vira `ready_with_warnings`.
  delete data.data.dataSourceNotes;
  data.data = { ...data.data };
  return data;
}

export async function createCampaignReadinessFixture() {
  const { execFileSync } = await import('node:child_process');
  const raw = execFileSync('supabase', ['status', '-o', 'json'], { cwd: appRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const status = JSON.parse(raw);
  const config = { url: status.API_URL, anonKey: status.ANON_KEY, serviceRoleKey: status.SERVICE_ROLE_KEY };
  const admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } });

  await deleteFixtureRows(admin);
  await removeExistingUser(admin);

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email: CAMPAIGN_READINESS_PILOT.email,
    password: CAMPAIGN_READINESS_PILOT.password,
    email_confirm: true,
  });
  if (userError || !userData.user) throw new Error(`Falha criando usuário da fixture: ${userError?.message ?? 'sem usuário'}`);

  const now = '2026-07-16T09:00:00.000Z';
  const { error: workspaceError } = await admin.from('workspaces').insert({ id: CAMPAIGN_READINESS_PILOT.workspaceId, name: 'Workspace fixture · Story 12.W5.1', created_at: now });
  if (workspaceError) throw new Error(`Falha criando workspace: ${workspaceError.message}`);
  const { error: memberError } = await admin.from('workspace_members').insert({ workspace_id: CAMPAIGN_READINESS_PILOT.workspaceId, user_id: userData.user.id, role: 'owner', created_at: now });
  if (memberError) throw new Error(`Falha vinculando usuário: ${memberError.message}`);

  // --- Projeto "empty" (AC1) — nome em branco, briefing recém-criado -------
  // (mesmo formato de `emptyBriefData()` em `use-project-workspace.ts`: um
  // projeto sem `active_brief_revision_id` NUNCA entra no snapshot da UI —
  // "transação interrompida", nunca selecionável — então mesmo o cenário
  // "vazio" precisa do brief mínimo que `createProject()` sempre cria
  // atomicamente com o projeto; o campo que fica vazio de propósito aqui é
  // `project.name`, não o brief inteiro).
  const { error: emptyProjectError } = await admin.from('marketing_projects').insert({
    id: CAMPAIGN_READINESS_PILOT.emptyProjectId,
    workspace_id: CAMPAIGN_READINESS_PILOT.workspaceId,
    slug: emptySlug,
    name: CAMPAIGN_READINESS_PILOT.emptyProjectName,
    status: 'active',
    created_at: now,
    updated_at: now,
  });
  if (emptyProjectError) throw new Error(`Falha criando projeto empty: ${emptyProjectError.message}`);
  const emptyBriefId = '90510000-0000-0000-0000-00000000be01';
  const { error: emptyBriefError } = await admin.from('project_brief_revisions').insert({
    id: emptyBriefId,
    workspace_id: CAMPAIGN_READINESS_PILOT.workspaceId,
    project_id: CAMPAIGN_READINESS_PILOT.emptyProjectId,
    revision: 1,
    schema_version: '1.0.0',
    status: 'active',
    data: {
      schemaVersion: '0.1.0',
      meta: { createdAt: now, updatedAt: now, completionStatus: 'draft' },
      project: { slug: emptySlug, name: CAMPAIGN_READINESS_PILOT.emptyProjectName },
      market: {},
      offer: {},
      brand: {},
      funnel: {},
      channels: {},
      data: {},
      integrations: {},
      fieldMeta: {},
    },
    field_sources: {},
    created_at: now,
    updated_at: now,
  });
  if (emptyBriefError) throw new Error(`Falha criando briefing empty: ${emptyBriefError.message}`);
  const { error: emptyProjectUpdateError } = await admin.from('marketing_projects').update({ active_brief_revision_id: emptyBriefId }).eq('id', CAMPAIGN_READINESS_PILOT.emptyProjectId);
  if (emptyProjectUpdateError) throw new Error(`Falha ligando briefing empty: ${emptyProjectUpdateError.message}`);

  // --- Projeto "warning" (checklist com ready_with_warnings) ---------------
  const { error: warningProjectError } = await admin.from('marketing_projects').insert({
    id: CAMPAIGN_READINESS_PILOT.warningProjectId,
    workspace_id: CAMPAIGN_READINESS_PILOT.workspaceId,
    slug: warningSlug,
    name: CAMPAIGN_READINESS_PILOT.warningProjectName,
    status: 'active',
    created_at: now,
    updated_at: now,
  });
  if (warningProjectError) throw new Error(`Falha criando projeto warning: ${warningProjectError.message}`);

  const warningBrief = warningBriefData();
  const { error: warningBriefError } = await admin.from('project_brief_revisions').insert({
    id: CAMPAIGN_READINESS_PILOT.warningBriefId,
    workspace_id: CAMPAIGN_READINESS_PILOT.workspaceId,
    project_id: CAMPAIGN_READINESS_PILOT.warningProjectId,
    revision: 1,
    schema_version: '1.0.0',
    status: 'active',
    data: warningBrief,
    field_sources: {},
    created_at: now,
    updated_at: now,
  });
  if (warningBriefError) throw new Error(`Falha criando briefing warning: ${warningBriefError.message}`);
  const { error: warningProjectUpdateError } = await admin.from('marketing_projects').update({ active_brief_revision_id: CAMPAIGN_READINESS_PILOT.warningBriefId }).eq('id', CAMPAIGN_READINESS_PILOT.warningProjectId);
  if (warningProjectUpdateError) throw new Error(`Falha ligando briefing warning: ${warningProjectUpdateError.message}`);

  const warningArtifactPaths = {
    copy: 'copy.md',
    trafficTrackingAudit: 'generated/tracking-audit.yaml',
    trafficCreativeBattery: 'generated/creative-battery.md',
    trafficCampaignPlan: 'generated/campaign-plan.md',
    trafficMetricReading: 'generated/metric-reading.yaml',
    funnel: 'funnel.md',
    salesPage: 'pagina-vendas.md',
    offerbook: 'offerbook.md',
  };
  let warningIndex = 1;
  for (const [artifactType, path] of Object.entries(warningArtifactPaths)) {
    const content = WARNING_ARTIFACT_CONTENT[artifactType];
    const artifactId = `90510000-0000-0000-0000-0000000010${String(warningIndex).padStart(2, '0')}`;
    warningIndex += 1;
    const { error: artifactError } = await admin.from('project_artifacts').insert({
      id: artifactId,
      workspace_id: CAMPAIGN_READINESS_PILOT.workspaceId,
      project_id: CAMPAIGN_READINESS_PILOT.warningProjectId,
      artifact_type: artifactType,
      title: `Fixture ${artifactType}`,
      path,
      format: path.endsWith('.yaml') ? 'yaml' : 'markdown',
      state: 'confirmed',
      verification: 'confirmed',
      source: 'filesystem',
      content,
      content_hash: sha256(content),
      created_at: now,
      updated_at: now,
    });
    if (artifactError) throw new Error(`Falha criando artefato warning ${artifactType}: ${artifactError.message}`);
  }

  // Uma campanha existente no projeto warning — usada pelo cenário de rota
  // legada (AC3: `campaigns/$campaignId/$step` deve ponte-ar para o workspace
  // unificado quando a campanha já tem `project_id`).
  const { error: warningCampaignError } = await admin.from('ads_campaigns').insert({
    id: CAMPAIGN_READINESS_PILOT.warningCampaignId,
    workspace_id: CAMPAIGN_READINESS_PILOT.workspaceId,
    project_id: CAMPAIGN_READINESS_PILOT.warningProjectId,
    name: CAMPAIGN_READINESS_PILOT.warningCampaignName,
    status: 'draft',
    step_current: 1,
    created_at: now,
  });
  if (warningCampaignError) throw new Error(`Falha criando campanha warning: ${warningCampaignError.message}`);

  await writeProjectFiles(warningSlug, {
    'copy.md': WARNING_ARTIFACT_CONTENT.copy,
    'generated/tracking-audit.yaml': WARNING_ARTIFACT_CONTENT.trafficTrackingAudit,
    'generated/creative-battery.md': WARNING_ARTIFACT_CONTENT.trafficCreativeBattery,
    'generated/campaign-plan.md': WARNING_ARTIFACT_CONTENT.trafficCampaignPlan,
    'generated/metric-reading.yaml': WARNING_ARTIFACT_CONTENT.trafficMetricReading,
    'funnel.md': WARNING_ARTIFACT_CONTENT.funnel,
    'pagina-vendas.md': WARNING_ARTIFACT_CONTENT.salesPage,
    'offerbook.md': WARNING_ARTIFACT_CONTENT.offerbook,
  });

  // --- Projeto "ready" (AC2/AC3/AC4 — piloto ao vivo) ----------------------
  const { error: readyProjectError } = await admin.from('marketing_projects').insert({
    id: CAMPAIGN_READINESS_PILOT.readyProjectId,
    workspace_id: CAMPAIGN_READINESS_PILOT.workspaceId,
    slug: readySlug,
    name: CAMPAIGN_READINESS_PILOT.readyProjectName,
    status: 'active',
    created_at: now,
    updated_at: now,
  });
  if (readyProjectError) throw new Error(`Falha criando projeto ready: ${readyProjectError.message}`);

  const readyBrief = readyBriefData();
  const { error: readyBriefError } = await admin.from('project_brief_revisions').insert({
    id: CAMPAIGN_READINESS_PILOT.readyBriefId,
    workspace_id: CAMPAIGN_READINESS_PILOT.workspaceId,
    project_id: CAMPAIGN_READINESS_PILOT.readyProjectId,
    revision: 1,
    schema_version: '1.0.0',
    status: 'active',
    data: readyBrief,
    field_sources: {},
    created_at: now,
    updated_at: now,
  });
  if (readyBriefError) throw new Error(`Falha criando briefing ready: ${readyBriefError.message}`);
  const { error: readyProjectUpdateError } = await admin.from('marketing_projects').update({ active_brief_revision_id: CAMPAIGN_READINESS_PILOT.readyBriefId }).eq('id', CAMPAIGN_READINESS_PILOT.readyProjectId);
  if (readyProjectUpdateError) throw new Error(`Falha ligando briefing ready: ${readyProjectUpdateError.message}`);

  const readyCopyArtifactId = '90510000-0000-0000-0000-000000002001';
  const { error: readyCopyError } = await admin.from('project_artifacts').insert({
    id: readyCopyArtifactId,
    workspace_id: CAMPAIGN_READINESS_PILOT.workspaceId,
    project_id: CAMPAIGN_READINESS_PILOT.readyProjectId,
    artifact_type: 'copy',
    title: 'Copy e ângulos — piloto ready',
    path: 'copy.md',
    format: 'markdown',
    state: 'confirmed',
    verification: 'confirmed',
    source: 'filesystem',
    content: READY_COPY_CONTENT,
    content_hash: sha256(READY_COPY_CONTENT),
    created_at: now,
    updated_at: now,
  });
  if (readyCopyError) throw new Error(`Falha criando artefato copy ready: ${readyCopyError.message}`);

  const readyProjectRoot = await writeProjectFiles(readySlug, { 'copy.md': READY_COPY_CONTENT });

  return {
    ...CAMPAIGN_READINESS_PILOT,
    appRoot,
    repoRoot,
    config,
    admin,
    userId: userData.user.id,
    readyProjectRoot,
    async latestJob(projectId, skillId) {
      const { data, error } = await admin.from('skill_run_jobs').select('*').eq('project_id', projectId).eq('skill_id', skillId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw new Error(`Falha lendo job ${skillId}: ${JSON.stringify(error)}`);
      return data;
    },
    async waitForLatestJob(projectId, skillId, predicate, timeoutMs = 60_000) {
      const deadline = Date.now() + timeoutMs;
      let last = null;
      while (Date.now() < deadline) {
        last = await this.latestJob(projectId, skillId);
        if (last && predicate(last)) return last;
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
      }
      throw new Error(`Timeout aguardando job ${skillId}; último estado: ${JSON.stringify(last)}`);
    },
    async campaignsFor(projectId) {
      const { data, error } = await admin.from('ads_campaigns').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (error) throw new Error(`Falha lendo campanhas: ${error.message}`);
      return data ?? [];
    },
    async campaignCountFor(workspaceId) {
      const { count, error } = await admin.from('ads_campaigns').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
      if (error) throw new Error(`Falha contando campanhas: ${error.message}`);
      return count ?? 0;
    },
    /**
     * Semeia, via `service_role`, um plano de campanha PRONTO (verba R$50 +
     * checklist do Zelador com todos os itens confirmados → status OK) para uma
     * campanha recém-criada in-app. Motivo (STORY-12.W5.1): a edição in-app do
     * plano (verba + 6 checks) passa por um autosave DEBOUNCED com multi-revisão
     * (STORY-8.W2.1, fora do `file_scope`) cuja corrida intermitentemente perde
     * updates — flakiness incompatível com uma prova de encerramento. O CONTRATO
     * (chegar ao briefista com o plano pronto) é semeado direto no Postgres
     * LOCAL, exatamente como os projetos empty/warning semeiam brief/artefatos;
     * a criação da campanha em si continua REAL (RPC transacional, AC2) e a
     * execução do Briefista continua AO VIVO. `revision` fica alta (100) para
     * suplantar qualquer revisão inicial (verba 0) que o app tenha persistido
     * antes deste seed. `tracking.auditArtifactId` fica AUSENTE de propósito: é
     * a confirmação da auditoria (na UI, sob o run cancelado) que adiciona o
     * artefato `trafficTrackingAudit` e torna o snapshot obsoleto (STALE).
     */
    async seedReadyCampaignPlan(campaignId) {
      const evidence = 'Confirmado literalmente pelo operador no piloto fixture.';
      const checkIds = ['bmActive', 'adAccountActive', 'pixelFiring', 'capiActive', 'purchaseDeduplicated', 'domainVerified', 'paymentApproved'];
      const criticalIds = new Set(['bmActive', 'adAccountActive', 'pixelFiring', 'capiActive', 'purchaseDeduplicated', 'paymentApproved']);
      const checks = Object.fromEntries(checkIds.map((id) => [id, { value: true, evidence, critical: criticalIds.has(id) }]));
      const planData = {
        schemaVersion: '1.0.0',
        id: `campaign-plan-${campaignId}-100`,
        projectId: CAMPAIGN_READINESS_PILOT.readyProjectId,
        campaignId,
        revision: 100,
        sourceBrief: { id: CAMPAIGN_READINESS_PILOT.readyBriefId, revision: 1 },
        platform: 'meta',
        objective: 'sales',
        landingPageUrl: 'https://fixture.local/pronto',
        budget: { daily: 50, periodDays: 1, currency: 'BRL' },
        angles: [],
        finalists: [],
        tracking: { status: 'OK', criticalItemsConfirmed: true, checks },
        structure: null,
        manualSubmission: { status: 'not_ready' },
        overrides: {},
        updatedAt: '2026-07-16T09:00:00.000Z',
      };
      await admin.from('campaign_plan_revisions').delete().eq('campaign_id', campaignId);
      const { error } = await admin.from('campaign_plan_revisions').insert({
        workspace_id: CAMPAIGN_READINESS_PILOT.workspaceId,
        project_id: CAMPAIGN_READINESS_PILOT.readyProjectId,
        campaign_id: campaignId,
        revision: 100,
        schema_version: '1.0.0',
        data: planData,
      });
      if (error) throw new Error(`Falha semeando plano da campanha ready: ${error.message}`);
    },
    async cleanup() {
      await deleteFixtureRows(admin);
      await admin.auth.admin.deleteUser(userData.user.id);
      await rm(resolve(repoRoot, 'projetos', warningSlug), { recursive: true, force: true });
      await rm(resolve(repoRoot, 'projetos', readySlug), { recursive: true, force: true });
    },
  };
}
