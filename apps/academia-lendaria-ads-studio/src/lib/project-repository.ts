import { supabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CampaignPlanRevision,
  MarketingProject,
  ProjectArtifact,
  ProjectBriefData,
  ProjectBriefRevision,
  SkillRun,
  WeeklyPanel,
} from '@/lib/project-domain';
import { PROJECT_BRIEF_SCHEMA_VERSION } from '@/lib/project-domain';

/**
 * Repository Supabase do domínio unificado do Marketing Studio (STORY-8.W1.1).
 *
 * Uma única fronteira de persistência para projetos, revisões de briefing,
 * artefatos, skill runs, planos de campanha e painéis semanais. Substitui o
 * `localStorage` como SOT (gate 1 do EPIC-8) para que um projeto reabra em outra
 * sessão com a mesma revisão e os mesmos artefatos (gate 2).
 *
 * Princípios (ACs):
 *  - AC2: a conversão `snake_case <-> camelCase` é EXPLÍCITA e vive só nos
 *    mappers deste arquivo; `service_role` NUNCA aparece — o cliente é o wrapper
 *    RLS-aware (`@/lib/supabase`), que roda sob o JWT do usuário.
 *  - AC3: escritas versionadas usam optimistic concurrency. O próximo `revision`
 *    é inserido contra o `unique(..., revision)` do schema; uma escrita
 *    concorrente com a mesma revisão colide (Postgres 23505) e retorna
 *    `RevisionConflictError` — a revisão concorrente NÃO é sobrescrita.
 *  - AC4: toda query carrega `workspace_id` e depende da RLS; o isolamento NÃO
 *    é reimplementado no cliente — o `workspace_id` é só o contexto do spoke
 *    ativo, e a RLS (`private.is_workspace_member`) faz o filtro no backend.
 */

// ---------------------------------------------------------------------------
// Erros tipados
// ---------------------------------------------------------------------------

export type RepositoryErrorCode = 'conflict' | 'not_found' | 'forbidden' | 'unknown';

/** Erro base do repository. `code` permite ao chamador reagir sem parsear string. */
export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly entity: string;
  readonly cause?: unknown;

  constructor(code: RepositoryErrorCode, entity: string, message: string, cause?: unknown) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.entity = entity;
    this.cause = cause;
  }
}

/**
 * Conflito de concorrência otimista (AC3): outra sessão já gravou esta revisão.
 * O chamador deve reler a revisão atual, reconstruir sobre ela e tentar de novo.
 */
export class RevisionConflictError extends RepositoryError {
  constructor(entity: string, cause?: unknown) {
    super(
      'conflict',
      entity,
      `Revisão concorrente de ${entity}: outra sessão já gravou esta versão. Releia a revisão atual antes de tentar novamente.`,
      cause,
    );
    this.name = 'RevisionConflictError';
  }
}

/** A RLS negou a operação — o usuário não é membro do workspace alvo. */
export class RepositoryForbiddenError extends RepositoryError {
  constructor(entity: string, cause?: unknown) {
    super('forbidden', entity, `Acesso negado a ${entity} pela RLS (workspace fora da associação do usuário).`, cause);
    this.name = 'RepositoryForbiddenError';
  }
}

/** Forma mínima de um erro do PostgREST/supabase-js (o campo `code` é o SQLSTATE). */
interface PostgrestLikeError {
  code?: string;
  message?: string;
  details?: string | null;
}

const UNIQUE_VIOLATION = '23505';
const INSUFFICIENT_PRIVILEGE = '42501';
const CHECK_VIOLATION = '23514';
const NO_ROWS_SINGLE = 'PGRST116';

/** Traduz um erro do supabase-js para a hierarquia tipada do repository. */
export function toRepositoryError(error: PostgrestLikeError, entity: string): RepositoryError {
  switch (error.code) {
    case UNIQUE_VIOLATION:
      return new RevisionConflictError(entity, error);
    case INSUFFICIENT_PRIVILEGE:
      return new RepositoryForbiddenError(entity, error);
    case NO_ROWS_SINGLE:
      return new RepositoryError('not_found', entity, `${entity} não encontrado.`, error);
    case CHECK_VIOLATION:
      return new RepositoryError('unknown', entity, error.message ?? `Violação de constraint em ${entity}.`, error);
    default:
      return new RepositoryError('unknown', entity, error.message ?? `Falha ao acessar ${entity}.`, error);
  }
}

// ---------------------------------------------------------------------------
// Linhas do banco (snake_case) — o formato bruto que a RLS entrega
// ---------------------------------------------------------------------------

interface MarketingProjectRow {
  id: string;
  workspace_id: string;
  slug: string;
  name: string;
  status: 'active' | 'archived';
  active_brief_revision_id: string | null;
  created_at: string;
  updated_at: string;
}

interface BriefRevisionRow {
  id: string;
  workspace_id: string;
  project_id: string;
  revision: number;
  schema_version: string;
  status: 'draft' | 'active' | 'superseded';
  data: ProjectBriefData;
  field_sources: ProjectBriefRevision['fieldSources'];
  created_at: string;
  updated_at: string;
}

interface ArtifactRow {
  id: string;
  workspace_id: string;
  project_id: string;
  artifact_type: string;
  title: string;
  path: string | null;
  format: ProjectArtifact['format'];
  state: ProjectArtifact['state'];
  verification: ProjectArtifact['verification'];
  source: ProjectArtifact['source'];
  content: string | null;
  content_hash: string | null;
  skill_run_id: string | null;
  created_at: string;
  updated_at: string;
}

interface SkillRunRow {
  id: string;
  workspace_id: string;
  project_id: string;
  skill_id: string;
  skill_hash: string;
  status: SkillRun['status'];
  input_snapshot: Record<string, unknown>;
  proposal: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignPlanRow {
  id: string;
  workspace_id: string;
  project_id: string;
  campaign_id: string;
  revision: number;
  schema_version: string;
  data: CampaignPlanRevision;
  created_at: string;
  updated_at: string;
}

interface WeeklyPanelRow {
  id: string;
  workspace_id: string;
  project_id: string;
  campaign_id: string;
  week_start: string;
  revision: number;
  schema_version: string;
  status: WeeklyPanel['status'];
  data: WeeklyPanel;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Mappers snake_case -> camelCase (AC2) — a fronteira EXPLÍCITA e única
// ---------------------------------------------------------------------------

export function rowToProject(row: MarketingProjectRow): MarketingProject {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    // DB permite null (projeto novo antes do 1º briefing); o domínio usa '' como
    // sentinela de "sem revisão ativa".
    activeBriefRevisionId: row.active_brief_revision_id ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToBriefRevision(row: BriefRevisionRow): ProjectBriefRevision {
  return {
    schemaVersion: PROJECT_BRIEF_SCHEMA_VERSION,
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    revision: row.revision,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    data: row.data,
    fieldSources: row.field_sources ?? {},
  };
}

export function rowToArtifact(row: ArtifactRow): ProjectArtifact {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    artifactType: row.artifact_type,
    title: row.title,
    path: row.path ?? '',
    format: row.format,
    state: row.state,
    verification: row.verification,
    source: row.source,
    ...(row.content_hash ? { hash: row.content_hash } : {}),
    ...(row.content != null ? { content: row.content } : {}),
    ...(row.skill_run_id ? { skillRunId: row.skill_run_id } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToSkillRun(row: SkillRunRow): SkillRun {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    skillId: row.skill_id,
    status: row.status,
    skillHash: row.skill_hash,
    inputSnapshot: row.input_snapshot ?? {},
    ...(row.proposal != null ? { proposal: row.proposal } : {}),
    ...(row.error != null ? { error: row.error } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Planos de campanha e painéis semanais guardam o objeto de domínio inteiro no
// jsonb `data`; as colunas snake denormalizadas existem para RLS/índices. O
// mapper reconcilia a identidade a partir das colunas autoritativas da linha.
export function rowToCampaignPlan(row: CampaignPlanRow): CampaignPlanRevision {
  return {
    ...row.data,
    id: row.id,
    projectId: row.project_id,
    campaignId: row.campaign_id,
    revision: row.revision,
  };
}

export function rowToWeeklyPanel(row: WeeklyPanelRow): WeeklyPanel {
  return {
    ...row.data,
    id: row.id,
    projectId: row.project_id,
    campaignId: row.campaign_id,
    weekStart: row.week_start,
    revision: row.revision,
    status: row.status,
  };
}

// ---------------------------------------------------------------------------
// Inputs de escrita (camelCase) -> linhas (snake_case)
// ---------------------------------------------------------------------------

export interface CreateProjectInput {
  workspaceId: string;
  slug: string;
  name: string;
  status?: MarketingProject['status'];
}

export interface UpdateProjectInput {
  name?: string;
  status?: MarketingProject['status'];
  activeBriefRevisionId?: string | null;
}

export interface CreateBriefRevisionInput {
  workspaceId: string;
  projectId: string;
  revision: number;
  status: ProjectBriefRevision['status'];
  data: ProjectBriefData;
  fieldSources?: ProjectBriefRevision['fieldSources'];
}

export interface UpsertArtifactInput {
  id?: string;
  workspaceId: string;
  projectId: string;
  artifactType: string;
  title: string;
  path?: string;
  format: ProjectArtifact['format'];
  state: ProjectArtifact['state'];
  verification: ProjectArtifact['verification'];
  source: ProjectArtifact['source'];
  content?: string;
  hash?: string;
  skillRunId?: string;
}

export interface CreateSkillRunInput {
  workspaceId: string;
  projectId: string;
  skillId: string;
  skillHash: string;
  status: SkillRun['status'];
  inputSnapshot?: Record<string, unknown>;
}

export interface UpdateSkillRunInput {
  status?: SkillRun['status'];
  proposal?: Record<string, unknown>;
  error?: string | null;
}

export interface CreateCampaignPlanInput {
  workspaceId: string;
  projectId: string;
  campaignId: string;
  revision: number;
  data: CampaignPlanRevision;
}

export interface CreateWeeklyPanelInput {
  workspaceId: string;
  projectId: string;
  campaignId: string;
  weekStart: string;
  revision: number;
  status: WeeklyPanel['status'];
  data: WeeklyPanel;
}

export function projectInsert(input: CreateProjectInput): Record<string, unknown> {
  return {
    workspace_id: input.workspaceId,
    slug: input.slug,
    name: input.name,
    status: input.status ?? 'active',
  };
}

export function projectUpdate(input: UpdateProjectInput): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.status !== undefined) patch.status = input.status;
  if (input.activeBriefRevisionId !== undefined) patch.active_brief_revision_id = input.activeBriefRevisionId;
  return patch;
}

export function briefRevisionInsert(input: CreateBriefRevisionInput): Record<string, unknown> {
  return {
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    revision: input.revision,
    status: input.status,
    data: input.data,
    field_sources: input.fieldSources ?? {},
  };
}

export function artifactUpsert(input: UpsertArtifactInput): Record<string, unknown> {
  return {
    ...(input.id ? { id: input.id } : {}),
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    artifact_type: input.artifactType,
    title: input.title,
    path: input.path ?? null,
    format: input.format,
    state: input.state,
    verification: input.verification,
    source: input.source,
    content: input.content ?? null,
    content_hash: input.hash ?? null,
    skill_run_id: input.skillRunId ?? null,
  };
}

export function skillRunInsert(input: CreateSkillRunInput): Record<string, unknown> {
  return {
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    skill_id: input.skillId,
    skill_hash: input.skillHash,
    status: input.status,
    input_snapshot: input.inputSnapshot ?? {},
  };
}

export function skillRunUpdate(input: UpdateSkillRunInput): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (input.status !== undefined) patch.status = input.status;
  if (input.proposal !== undefined) patch.proposal = input.proposal;
  if (input.error !== undefined) patch.error = input.error;
  return patch;
}

export function campaignPlanInsert(input: CreateCampaignPlanInput): Record<string, unknown> {
  return {
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    campaign_id: input.campaignId,
    revision: input.revision,
    data: input.data,
  };
}

export function weeklyPanelInsert(input: CreateWeeklyPanelInput): Record<string, unknown> {
  return {
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    campaign_id: input.campaignId,
    week_start: input.weekStart,
    revision: input.revision,
    status: input.status,
    data: input.data,
  };
}

// ---------------------------------------------------------------------------
// Interface do repository (AC1) — 6 grupos de entidade do domínio unificado
// ---------------------------------------------------------------------------

export interface ProjectRepository {
  // Projetos
  listProjects(workspaceId: string): Promise<MarketingProject[]>;
  getProject(workspaceId: string, id: string): Promise<MarketingProject | null>;
  getProjectBySlug(workspaceId: string, slug: string): Promise<MarketingProject | null>;
  createProject(input: CreateProjectInput): Promise<MarketingProject>;
  updateProject(workspaceId: string, id: string, patch: UpdateProjectInput): Promise<MarketingProject>;

  // Revisões de briefing (versionadas — OCC)
  listBriefRevisions(workspaceId: string, projectId: string): Promise<ProjectBriefRevision[]>;
  getActiveBrief(workspaceId: string, projectId: string): Promise<ProjectBriefRevision | null>;
  createBriefRevision(input: CreateBriefRevisionInput): Promise<ProjectBriefRevision>;

  // Artefatos
  listArtifacts(workspaceId: string, projectId: string): Promise<ProjectArtifact[]>;
  upsertArtifact(input: UpsertArtifactInput): Promise<ProjectArtifact>;

  // Skill runs
  listSkillRuns(workspaceId: string, projectId: string): Promise<SkillRun[]>;
  createSkillRun(input: CreateSkillRunInput): Promise<SkillRun>;
  updateSkillRun(workspaceId: string, id: string, patch: UpdateSkillRunInput): Promise<SkillRun>;

  // Planos de campanha (versionados — OCC)
  listCampaignPlanRevisions(workspaceId: string, campaignId: string): Promise<CampaignPlanRevision[]>;
  getLatestCampaignPlan(workspaceId: string, campaignId: string): Promise<CampaignPlanRevision | null>;
  createCampaignPlanRevision(input: CreateCampaignPlanInput): Promise<CampaignPlanRevision>;

  // Painéis semanais (versionados — OCC)
  listWeeklyPanels(workspaceId: string, campaignId: string): Promise<WeeklyPanel[]>;
  getLatestWeeklyPanel(workspaceId: string, campaignId: string, weekStart: string): Promise<WeeklyPanel | null>;
  createWeeklyPanelRevision(input: CreateWeeklyPanelInput): Promise<WeeklyPanel>;
}

// ---------------------------------------------------------------------------
// Adapter Supabase
// ---------------------------------------------------------------------------

const PROJECT_COLS =
  'id, workspace_id, slug, name, status, active_brief_revision_id, created_at, updated_at';
const BRIEF_COLS =
  'id, workspace_id, project_id, revision, schema_version, status, data, field_sources, created_at, updated_at';
const ARTIFACT_COLS =
  'id, workspace_id, project_id, artifact_type, title, path, format, state, verification, source, content, content_hash, skill_run_id, created_at, updated_at';
const SKILL_RUN_COLS =
  'id, workspace_id, project_id, skill_id, skill_hash, status, input_snapshot, proposal, error, created_at, updated_at';
const CAMPAIGN_PLAN_COLS =
  'id, workspace_id, project_id, campaign_id, revision, schema_version, data, created_at, updated_at';
const WEEKLY_PANEL_COLS =
  'id, workspace_id, project_id, campaign_id, week_start, revision, schema_version, status, data, created_at, updated_at';

/**
 * Cria o adapter Supabase do repository. O cliente é injetável (default: o
 * singleton RLS-aware `@/lib/supabase`) para permitir testes com um duplo.
 */
export function createSupabaseProjectRepository(client: SupabaseClient = supabase): ProjectRepository {
  return {
    // ---- Projetos ----
    async listProjects(workspaceId) {
      const { data, error } = await client
        .from('marketing_projects')
        .select(PROJECT_COLS)
        .eq('workspace_id', workspaceId)
        .order('name');
      if (error) throw toRepositoryError(error, 'marketing_projects');
      return (data as MarketingProjectRow[] | null ?? []).map(rowToProject);
    },

    async getProject(workspaceId, id) {
      const { data, error } = await client
        .from('marketing_projects')
        .select(PROJECT_COLS)
        .eq('workspace_id', workspaceId)
        .eq('id', id)
        .maybeSingle();
      if (error) throw toRepositoryError(error, 'marketing_projects');
      return data ? rowToProject(data as MarketingProjectRow) : null;
    },

    async getProjectBySlug(workspaceId, slug) {
      const { data, error } = await client
        .from('marketing_projects')
        .select(PROJECT_COLS)
        .eq('workspace_id', workspaceId)
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw toRepositoryError(error, 'marketing_projects');
      return data ? rowToProject(data as MarketingProjectRow) : null;
    },

    async createProject(input) {
      const { data, error } = await client
        .from('marketing_projects')
        .insert(projectInsert(input))
        .select(PROJECT_COLS)
        .single();
      if (error) throw toRepositoryError(error, 'marketing_projects');
      return rowToProject(data as MarketingProjectRow);
    },

    async updateProject(workspaceId, id, patch) {
      const { data, error } = await client
        .from('marketing_projects')
        .update(projectUpdate(patch))
        .eq('workspace_id', workspaceId)
        .eq('id', id)
        .select(PROJECT_COLS)
        .single();
      if (error) throw toRepositoryError(error, 'marketing_projects');
      return rowToProject(data as MarketingProjectRow);
    },

    // ---- Revisões de briefing ----
    async listBriefRevisions(workspaceId, projectId) {
      const { data, error } = await client
        .from('project_brief_revisions')
        .select(BRIEF_COLS)
        .eq('workspace_id', workspaceId)
        .eq('project_id', projectId)
        .order('revision', { ascending: false });
      if (error) throw toRepositoryError(error, 'project_brief_revisions');
      return (data as BriefRevisionRow[] | null ?? []).map(rowToBriefRevision);
    },

    async getActiveBrief(workspaceId, projectId) {
      const { data, error } = await client
        .from('project_brief_revisions')
        .select(BRIEF_COLS)
        .eq('workspace_id', workspaceId)
        .eq('project_id', projectId)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw toRepositoryError(error, 'project_brief_revisions');
      return data ? rowToBriefRevision(data as BriefRevisionRow) : null;
    },

    async createBriefRevision(input) {
      const { data, error } = await client
        .from('project_brief_revisions')
        .insert(briefRevisionInsert(input))
        .select(BRIEF_COLS)
        .single();
      if (error) throw toRepositoryError(error, 'project_brief_revisions');
      return rowToBriefRevision(data as BriefRevisionRow);
    },

    // ---- Artefatos ----
    async listArtifacts(workspaceId, projectId) {
      const { data, error } = await client
        .from('project_artifacts')
        .select(ARTIFACT_COLS)
        .eq('workspace_id', workspaceId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw toRepositoryError(error, 'project_artifacts');
      return (data as ArtifactRow[] | null ?? []).map(rowToArtifact);
    },

    async upsertArtifact(input) {
      const { data, error } = await client
        .from('project_artifacts')
        .upsert(artifactUpsert(input))
        .select(ARTIFACT_COLS)
        .single();
      if (error) throw toRepositoryError(error, 'project_artifacts');
      return rowToArtifact(data as ArtifactRow);
    },

    // ---- Skill runs ----
    async listSkillRuns(workspaceId, projectId) {
      const { data, error } = await client
        .from('skill_runs')
        .select(SKILL_RUN_COLS)
        .eq('workspace_id', workspaceId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw toRepositoryError(error, 'skill_runs');
      return (data as SkillRunRow[] | null ?? []).map(rowToSkillRun);
    },

    async createSkillRun(input) {
      const { data, error } = await client
        .from('skill_runs')
        .insert(skillRunInsert(input))
        .select(SKILL_RUN_COLS)
        .single();
      if (error) throw toRepositoryError(error, 'skill_runs');
      return rowToSkillRun(data as SkillRunRow);
    },

    async updateSkillRun(workspaceId, id, patch) {
      const { data, error } = await client
        .from('skill_runs')
        .update(skillRunUpdate(patch))
        .eq('workspace_id', workspaceId)
        .eq('id', id)
        .select(SKILL_RUN_COLS)
        .single();
      if (error) throw toRepositoryError(error, 'skill_runs');
      return rowToSkillRun(data as SkillRunRow);
    },

    // ---- Planos de campanha ----
    async listCampaignPlanRevisions(workspaceId, campaignId) {
      const { data, error } = await client
        .from('campaign_plan_revisions')
        .select(CAMPAIGN_PLAN_COLS)
        .eq('workspace_id', workspaceId)
        .eq('campaign_id', campaignId)
        .order('revision', { ascending: false });
      if (error) throw toRepositoryError(error, 'campaign_plan_revisions');
      return (data as CampaignPlanRow[] | null ?? []).map(rowToCampaignPlan);
    },

    async getLatestCampaignPlan(workspaceId, campaignId) {
      const { data, error } = await client
        .from('campaign_plan_revisions')
        .select(CAMPAIGN_PLAN_COLS)
        .eq('workspace_id', workspaceId)
        .eq('campaign_id', campaignId)
        .order('revision', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw toRepositoryError(error, 'campaign_plan_revisions');
      return data ? rowToCampaignPlan(data as CampaignPlanRow) : null;
    },

    async createCampaignPlanRevision(input) {
      const { data, error } = await client
        .from('campaign_plan_revisions')
        .insert(campaignPlanInsert(input))
        .select(CAMPAIGN_PLAN_COLS)
        .single();
      if (error) throw toRepositoryError(error, 'campaign_plan_revisions');
      return rowToCampaignPlan(data as CampaignPlanRow);
    },

    // ---- Painéis semanais ----
    async listWeeklyPanels(workspaceId, campaignId) {
      const { data, error } = await client
        .from('ads_weekly_panels')
        .select(WEEKLY_PANEL_COLS)
        .eq('workspace_id', workspaceId)
        .eq('campaign_id', campaignId)
        .order('week_start', { ascending: false })
        .order('revision', { ascending: false });
      if (error) throw toRepositoryError(error, 'ads_weekly_panels');
      return (data as WeeklyPanelRow[] | null ?? []).map(rowToWeeklyPanel);
    },

    async getLatestWeeklyPanel(workspaceId, campaignId, weekStart) {
      const { data, error } = await client
        .from('ads_weekly_panels')
        .select(WEEKLY_PANEL_COLS)
        .eq('workspace_id', workspaceId)
        .eq('campaign_id', campaignId)
        .eq('week_start', weekStart)
        .order('revision', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw toRepositoryError(error, 'ads_weekly_panels');
      return data ? rowToWeeklyPanel(data as WeeklyPanelRow) : null;
    },

    async createWeeklyPanelRevision(input) {
      const { data, error } = await client
        .from('ads_weekly_panels')
        .insert(weeklyPanelInsert(input))
        .select(WEEKLY_PANEL_COLS)
        .single();
      if (error) throw toRepositoryError(error, 'ads_weekly_panels');
      return rowToWeeklyPanel(data as WeeklyPanelRow);
    },
  };
}

/** Instância padrão do repository (cliente RLS-aware do singleton). */
export const projectRepository = createSupabaseProjectRepository();
