import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '../../..');
const repoRoot = resolve(appRoot, '..', '..');
const projectSlug = 'story-8-w3-1-traffic-pilot';
const projectRoot = resolve(repoRoot, 'projetos', projectSlug);

export const TRAFFIC_PILOT = Object.freeze({
  email: 'traffic-pilot-8-w3-1@fixture.local',
  password: 'TrafficPilot8W31!fixture',
  workspaceId: '81000000-0000-0000-0000-000000000031',
  projectId: '82000000-0000-0000-0000-000000000031',
  briefId: '83000000-0000-0000-0000-000000000031',
  campaignId: '84000000-0000-0000-0000-000000000031',
  copyArtifactId: '85000000-0000-0000-0000-000000000031',
  projectSlug,
  projectName: 'Piloto real do Squad de Tráfego · Story 8.W3.1',
  campaignName: 'Validação A3 · fixture isolada',
  bffUrl: 'http://127.0.0.1:3302',
  webUrl: 'http://127.0.0.1:5178',
  boundaryToken: 'traffic-pilot-story-8-w3-1-boundary',
});

const COPY_CONTENT = `# Copy e insumos da Aula 2 — fixture do piloto

Projeto: ${TRAFFIC_PILOT.projectName}
Oferta: Pacote Método OFTR para gestores de tráfego
Preço literal: R$ 1.200
Página: https://fixture.local/oferta

## Ângulos validados na Aula 2

1. "Seu tráfego não escala porque falta estrutura" — consciente_do_problema
2. "A rotina que transforma dados em uma decisão semanal" — consciente_da_solucao
3. "O erro que trava sua campanha" — nível ausente de propósito; o Briefista deve recusar este ângulo.

## Prova e voz

Voz de marca, sem promessa de performance garantida. O piloto usa dados literais fornecidos pelo operador e não publica na Meta.
`;

const PANEL_REFERENCE = [
  'versao: "1.0.0"', 'aula: "A3 — Tráfego (Método O.F.T.R.)"', 'insumos_a2:',
  '  angulos:', '    - nome: "Seu tráfego não escala porque falta estrutura"', '      nivel_consciencia: "consciente_do_problema"',
  '    - nome: "A rotina que transforma dados em uma decisão semanal"', '      nivel_consciencia: "consciente_da_solucao"',
  '    - nome: "O erro que trava sua campanha"', '      nivel_consciencia: ""', '  pagina_url: "https://fixture.local/oferta"',
  '  ticket: 1200', '  margem_pct: 0.55', '',
].join('\n');

function sha256(value) { return createHash('sha256').update(value, 'utf8').digest('hex'); }

function localSupabaseConfig() {
  const raw = execFileSync('supabase', ['status', '-o', 'json'], { cwd: appRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const status = JSON.parse(raw);
  return { url: status.API_URL, anonKey: status.ANON_KEY, serviceRoleKey: status.SERVICE_ROLE_KEY };
}

function dbQuery(sql) {
  execFileSync('supabase', ['db', 'query', '--local', '--output', 'json', sql], { cwd: appRoot, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
}

async function removeExistingUser(admin) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Não foi possível listar usuários da fixture: ${JSON.stringify(error)}`);
  const existing = data.users.find((user) => user.email === TRAFFIC_PILOT.email);
  if (existing) { const result = await admin.auth.admin.deleteUser(existing.id); if (result.error) throw new Error(`Não foi possível remover usuário anterior: ${result.error.message}`); }
}

async function ensureCampaignTable(admin) {
  const probe = await admin.from('ads_campaigns').select('id').limit(1);
  if (!probe.error) {
    dbQuery('grant select, insert, update, delete on public.ads_campaigns to service_role');
    return false;
  }
  if (probe.error.code === '42501' || /permission denied for table ads_campaigns/i.test(probe.error.message)) {
    dbQuery('grant select, insert, update, delete on public.ads_campaigns to service_role');
    return false;
  }
  if (probe.error.code !== 'PGRST205') throw new Error(`Tabela ads_campaigns indisponível: ${probe.error.message}`);
  for (const statement of [
    `create table if not exists public.ads_campaigns (id uuid primary key, workspace_id uuid not null references public.workspaces(id) on delete cascade, project_id uuid references public.marketing_projects(id) on delete set null, name text not null, status text not null check (status in ('draft', 'in_review', 'approved', 'live', 'paused', 'archived')), step_current integer not null default 1 check (step_current > 0), created_at timestamptz not null default now())`,
    'alter table public.ads_campaigns enable row level security',
    'drop policy if exists "workspace members manage fixture campaigns" on public.ads_campaigns',
    'create policy "workspace members manage fixture campaigns" on public.ads_campaigns for all to authenticated using ((select private.is_workspace_member(workspace_id))) with check ((select private.is_workspace_member(workspace_id)))',
    'grant select, insert, update, delete on public.ads_campaigns to authenticated',
    'grant select, insert, update, delete on public.ads_campaigns to service_role',
    "notify pgrst, 'reload schema'",
  ]) dbQuery(statement);
  return true;
}

async function deleteFixtureRows(admin) {
  const workspace = TRAFFIC_PILOT.workspaceId;
  const tables = [['artifact_approval_outbox', 'workspace_id'], ['human_decisions', 'workspace_id'], ['ads_weekly_panel_events', 'workspace_id'], ['ads_weekly_panels', 'workspace_id'], ['campaign_plan_revisions', 'workspace_id'], ['project_artifacts', 'workspace_id'], ['skill_runs', 'workspace_id'], ['skill_run_jobs', 'workspace_id'], ['project_brief_revisions', 'workspace_id'], ['marketing_projects', 'workspace_id'], ['workspace_members', 'workspace_id'], ['workspaces', 'id']];
  for (const [table, column] of tables) { const { error } = await admin.from(table).delete().eq(column, workspace); if (error && !['PGRST205', '42P01'].includes(error.code)) throw new Error(`Falha limpando ${table}: ${JSON.stringify(error)}`); }
  const { error: campaignError } = await admin.from('ads_campaigns').delete().eq('id', TRAFFIC_PILOT.campaignId);
  if (campaignError && !['PGRST205', '42P01'].includes(campaignError.code)) throw new Error(`Falha limpando campanha fixture: ${campaignError.message}`);
}

export async function createTrafficPilotFixture() {
  const config = localSupabaseConfig();
  const admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } });
  const campaignTableCreated = await ensureCampaignTable(admin);
  await deleteFixtureRows(admin); await removeExistingUser(admin); await rm(projectRoot, { recursive: true, force: true });
  await mkdir(projectRoot, { recursive: true }); await writeFile(resolve(projectRoot, 'copy.md'), COPY_CONTENT, 'utf8'); await writeFile(resolve(projectRoot, 'PAINEL-DA-SEMANA.yaml'), PANEL_REFERENCE, 'utf8');
  const { data: userData, error: userError } = await admin.auth.admin.createUser({ email: TRAFFIC_PILOT.email, password: TRAFFIC_PILOT.password, email_confirm: true });
  if (userError || !userData.user) throw new Error(`Falha criando usuário da fixture: ${userError?.message ?? 'sem usuário'}`);
  const now = '2026-07-10T09:00:00.000Z';
  const brief = { schemaVersion: '0.1.0', meta: { createdAt: now, updatedAt: now, completionStatus: 'ready_for_traffic_pilot' }, project: { slug: TRAFFIC_PILOT.projectSlug, name: TRAFFIC_PILOT.projectName, currentStage: 'aula3-trafego', voice: 'marca' }, market: { awarenessLevel: 'consciente_do_problema', dominantPain: 'Gestores não sabem qual alavanca mover sem inventar leitura dos números.', trafficTemperature: 'frio', trafficSource: 'pago', avatarSummary: 'Gestor iniciante que precisa de rigor operacional e decisão humana.', angles: [{ name: 'Seu tráfego não escala porque falta estrutura', awarenessLevel: 'consciente_do_problema' }, { name: 'A rotina que transforma dados em uma decisão semanal', awarenessLevel: 'consciente_da_solucao' }, { name: 'O erro que trava sua campanha', awarenessLevel: '' }] }, offer: { name: 'Método OFTR para gestores de tráfego', exactPrice: 1200, proofAssets: ['copy.md'] }, channels: { primaryCtaUrl: 'https://fixture.local/oferta', adFormats: ['reels 9:16', 'feed'] }, data: { dataSourceNotes: 'Fixture isolada: números literais fornecidos pelo operador; alcance e janela ausentes.', aula2: { angulos: [] } }, funnel: { primaryPage: 'https://fixture.local/oferta' }, integrations: { metaStatus: 'recommend_only' } };
  const { error: workspaceError } = await admin.from('workspaces').insert({ id: TRAFFIC_PILOT.workspaceId, name: 'Workspace fixture · Story 8.W3.1', created_at: now }); if (workspaceError) throw new Error(`Falha criando workspace: ${workspaceError.message}`);
  const { error: memberError } = await admin.from('workspace_members').insert({ workspace_id: TRAFFIC_PILOT.workspaceId, user_id: userData.user.id, role: 'owner', created_at: now }); if (memberError) throw new Error(`Falha vinculando usuário: ${memberError.message}`);
  const { error: projectError } = await admin.from('marketing_projects').insert({ id: TRAFFIC_PILOT.projectId, workspace_id: TRAFFIC_PILOT.workspaceId, slug: TRAFFIC_PILOT.projectSlug, name: TRAFFIC_PILOT.projectName, status: 'active', created_at: now, updated_at: now }); if (projectError) throw new Error(`Falha criando projeto: ${projectError.message}`);
  const { error: briefError } = await admin.from('project_brief_revisions').insert({ id: TRAFFIC_PILOT.briefId, workspace_id: TRAFFIC_PILOT.workspaceId, project_id: TRAFFIC_PILOT.projectId, revision: 1, schema_version: '1.0.0', status: 'active', data: brief, field_sources: {}, created_at: now, updated_at: now }); if (briefError) throw new Error(`Falha criando briefing: ${briefError.message}`);
  const { error: projectUpdateError } = await admin.from('marketing_projects').update({ active_brief_revision_id: TRAFFIC_PILOT.briefId }).eq('id', TRAFFIC_PILOT.projectId); if (projectUpdateError) throw new Error(`Falha ligando briefing: ${projectUpdateError.message}`);
  const { error: campaignError } = await admin.from('ads_campaigns').insert({ id: TRAFFIC_PILOT.campaignId, workspace_id: TRAFFIC_PILOT.workspaceId, project_id: TRAFFIC_PILOT.projectId, name: TRAFFIC_PILOT.campaignName, status: 'draft', step_current: 1, created_at: now }); if (campaignError) throw new Error(`Falha criando campanha: ${campaignError.message}`);
  const { error: artifactError } = await admin.from('project_artifacts').insert({ id: TRAFFIC_PILOT.copyArtifactId, workspace_id: TRAFFIC_PILOT.workspaceId, project_id: TRAFFIC_PILOT.projectId, artifact_type: 'copy', title: 'Copy e ângulos da Aula 2', path: 'copy.md', format: 'markdown', state: 'confirmed', verification: 'confirmed', source: 'filesystem', content: COPY_CONTENT, content_hash: sha256(COPY_CONTENT), created_at: now, updated_at: now }); if (artifactError) throw new Error(`Falha criando artefato copy: ${artifactError.message}`);

  return { ...TRAFFIC_PILOT, appRoot, repoRoot, projectRoot, config, admin, userId: userData.user.id, campaignTableCreated,
    async latestSkillRun(skillId) { const { data, error } = await admin.from('skill_runs').select('*').eq('project_id', TRAFFIC_PILOT.projectId).eq('skill_id', skillId).order('created_at', { ascending: false }).limit(1).maybeSingle(); if (error) throw new Error(`Falha lendo skill_run ${skillId}: ${JSON.stringify(error)}`); return data; },
    async waitForLatestSkillRun(skillId, predicate, timeoutMs = 30_000) { const deadline = Date.now() + timeoutMs; let last = null; while (Date.now() < deadline) { last = await this.latestSkillRun(skillId); if (last && predicate(last)) return last; await new Promise((resolvePromise) => setTimeout(resolvePromise, 250)); } throw new Error(`Timeout aguardando skill_run ${skillId}; último estado: ${JSON.stringify(last)}`); },
    async approvalFor(runId) { const { data, error } = await admin.from('artifact_approval_outbox').select('*').eq('skill_run_id', runId).order('created_at', { ascending: false }); if (error) throw new Error(`Falha lendo aprovação: ${JSON.stringify(error)}`); return data ?? []; },
    async artifactsFor(runId) { const { data, error } = await admin.from('project_artifacts').select('*').eq('skill_run_id', runId).order('created_at', { ascending: false }); if (error) throw new Error(`Falha lendo artefatos: ${JSON.stringify(error)}`); return data ?? []; },
    async latestJob(skillId) { const { data, error } = await admin.from('skill_run_jobs').select('*').eq('project_id', TRAFFIC_PILOT.projectId).eq('skill_id', skillId).order('created_at', { ascending: false }).limit(1).maybeSingle(); if (error) throw new Error(`Falha lendo job ${skillId}: ${JSON.stringify(error)}`); return data; },
    async waitForLatestJob(skillId, predicate, timeoutMs = 10 * 60 * 1000) { const deadline = Date.now() + timeoutMs; let last = null; while (Date.now() < deadline) { last = await this.latestJob(skillId); if (last && predicate(last)) return last; await new Promise((resolvePromise) => setTimeout(resolvePromise, 250)); } throw new Error(`Timeout aguardando job ${skillId}; último estado: ${JSON.stringify(last)}`); },
    async jobsFor() { const { data, error } = await admin.from('skill_run_jobs').select('id, skill_id, status, attempt, attempts, steps, logs, input, updated_at').eq('project_id', TRAFFIC_PILOT.projectId).order('created_at', { ascending: true }); if (error) throw new Error(`Falha lendo jobs: ${error.message}`); return data ?? []; },
    async campaign() { const { data, error } = await admin.from('ads_campaigns').select('*').eq('id', TRAFFIC_PILOT.campaignId).maybeSingle(); if (error) throw new Error(`Falha lendo campanha: ${error.message}`); return data; },
    async cleanup() { await deleteFixtureRows(admin); await admin.auth.admin.deleteUser(userData.user.id); await rm(projectRoot, { recursive: true, force: true }); if (campaignTableCreated) dbQuery('drop table if exists public.ads_campaigns'); },
  };
}

export { COPY_CONTENT, PANEL_REFERENCE, projectRoot };
