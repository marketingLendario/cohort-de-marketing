import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { SkillProposal } from './local-skill-runner.js';
import type { ProjectStatusResult } from './project-status/service.js';
import type { EnvironmentBootstrapSnapshot } from './environment-bootstrap/service.js';

const PENDING_SKILL_HASH = 'pending:local-runner';
const TERMINAL_JOB_STATES = new Set(['succeeded', 'failed', 'cancelled']);

const cliInputSchema = z.object({
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  brief: z.record(z.string(), z.unknown()),
  context: z.record(z.string(), z.unknown()).optional(),
  operatorInput: z.string().optional(),
  elicitationParentRunId: z.string().min(1).optional(),
}).strict();

interface SkillJobView {
  jobId: string;
  skillId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  proposal: SkillProposal | null;
  skillHash: string | null;
  model: string | null;
  error: { reason: string } | null;
}

interface ApprovalPlanView {
  skillRunId: string;
  proposalHash: string;
  proposalRevision: number;
  files: Array<{ path: string; format: string; hashAfter: string }>;
}

interface ApprovalRecordView {
  state: string;
  outcome: string | null;
  proposalHash: string;
  proposalRevision: number;
  plan: Array<{
    path: string;
    format: string;
    content: string;
    contentEncoding?: 'utf8' | 'base64';
    contentHash: string | null;
  }>;
}

export interface SkillCliDatabase {
  readRun(input: { workspaceId: string; runId: string }): Promise<{ proposal: SkillProposal | null }>;
  createRun(input: {
    workspaceId: string;
    projectId: string;
    skillId: string;
    jobId: string;
    elicitationParentRunId?: string;
  }): Promise<string>;
  completeRun(input: { workspaceId: string; runId: string; proposal: SkillProposal; skillHash: string }): Promise<void>;
  failRun(input: { workspaceId: string; runId: string; status: 'failed' | 'cancelled'; error: string | null }): Promise<void>;
  supersedeRun(input: { workspaceId: string; parentRunId: string; continuationRunId: string }): Promise<void>;
  restartRun(input: { workspaceId: string; runId: string }): Promise<void>;
}

export interface SkillCliBackend {
  start(skillId: string, input: z.infer<typeof cliInputSchema>): Promise<{ jobId: string }>;
  get(jobId: string): Promise<SkillJobView>;
  cancel(jobId: string): Promise<void>;
  retry(jobId: string): Promise<void>;
  plan(skillRunId: string, artifacts: SkillProposal['artifacts']): Promise<ApprovalPlanView>;
  approve(input: {
    skillRunId: string;
    proposalHash: string;
    proposalRevision: number;
    artifacts: SkillProposal['artifacts'];
  }): Promise<ApprovalRecordView>;
  reject(input: {
    skillRunId: string;
    proposalHash: string;
    proposalRevision: number;
  }): Promise<ApprovalRecordView>;
}

export interface SkillCliResult {
  schemaVersion: '1.0.0';
  surface: 'cli';
  skillId: string;
  jobId: string;
  skillRunId: string;
  status: 'needs_input' | 'needs_review' | 'done';
  model: string;
  skillHash: string;
  proposal: SkillProposal;
  approval?: {
    state: string;
    outcome: string | null;
    proposalHash: string;
    proposalRevision: number;
    files: Array<{ path: string; format: string; contentHash: string | null }>;
  };
}

export interface ProjectStatusCliResult {
  schemaVersion: '1.0.0';
  surface: 'cli';
  skillId: 'status-funil';
  status: 'done';
  result: ProjectStatusResult;
}

export async function readProjectStatusFromCli(options: {
  baseUrl: string;
  token: string;
  projectId: string;
  fetchImpl?: typeof fetch;
}): Promise<ProjectStatusCliResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(
    `${options.baseUrl.replace(/\/$/, '')}/api/local/projects/${encodeURIComponent(options.projectId)}/status`,
    { headers: { 'x-local-runner-token': options.token } },
  );
  const result = await readJsonResponse<ProjectStatusResult>(response);
  return { schemaVersion: '1.0.0', surface: 'cli', skillId: 'status-funil', status: 'done', result };
}

export async function readEnvironmentBootstrapFromCli(options: {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
}): Promise<{ schemaVersion: '1.0.0'; surface: 'cli'; skillId: 'comecar'; status: 'done'; result: EnvironmentBootstrapSnapshot }> {
  const response = await (options.fetchImpl ?? fetch)(
    `${options.baseUrl.replace(/\/$/, '')}/api/local/environment-bootstrap`,
    { headers: { 'x-local-runner-token': options.token } },
  );
  const result = await readJsonResponse<EnvironmentBootstrapSnapshot>(response);
  return { schemaVersion: '1.0.0', surface: 'cli', skillId: 'comecar', status: 'done', result };
}

export async function approveSkillRunFromCli(input: {
  skillRunId: string;
  proposal: SkillProposal;
}, backend: SkillCliBackend): Promise<NonNullable<SkillCliResult['approval']>> {
  if (input.proposal.questions.length > 0) throw new Error('A proposta ainda possui decisões pendentes e não pode ser aprovada.');
  if (input.proposal.artifacts.length === 0) throw new Error('A proposta não possui artefatos para aprovação.');
  const plan = await backend.plan(input.skillRunId, input.proposal.artifacts);
  const approval = await backend.approve({
    skillRunId: input.skillRunId,
    proposalHash: plan.proposalHash,
    proposalRevision: plan.proposalRevision,
    artifacts: input.proposal.artifacts,
  });
  return {
    state: approval.state,
    outcome: approval.outcome,
    proposalHash: approval.proposalHash,
    proposalRevision: approval.proposalRevision,
    files: approval.plan.map((entry) => ({
      path: entry.path,
      format: entry.format,
      contentHash: entry.contentHash,
    })),
  };
}

export async function rejectSkillRunFromCli(input: {
  skillRunId: string;
  proposal: SkillProposal;
}, backend: SkillCliBackend): Promise<NonNullable<SkillCliResult['approval']>> {
  const plan = await backend.plan(input.skillRunId, input.proposal.artifacts);
  const approval = await backend.reject({
    skillRunId: input.skillRunId, proposalHash: plan.proposalHash, proposalRevision: plan.proposalRevision,
  });
  return {
    state: approval.state, outcome: approval.outcome, proposalHash: approval.proposalHash,
    proposalRevision: approval.proposalRevision,
    files: approval.plan.map((entry) => ({ path: entry.path, format: entry.format, contentHash: entry.contentHash })),
  };
}

export async function cancelSkillFromCli(input: {
  workspaceId: string;
  skillRunId: string;
  jobId: string;
}, deps: { backend: SkillCliBackend; database: SkillCliDatabase }): Promise<void> {
  await deps.backend.cancel(input.jobId);
  await deps.database.failRun({
    workspaceId: input.workspaceId, runId: input.skillRunId, status: 'cancelled', error: 'Cancelado pelo operador no CLI.',
  });
}

async function waitForTerminalJob(backend: SkillCliBackend, jobId: string, timeoutMs: number, pollIntervalMs: number): Promise<SkillJobView | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const job = await backend.get(jobId);
    if (TERMINAL_JOB_STATES.has(job.status)) return job;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, pollIntervalMs));
  }
  return null;
}

export async function retrySkillFromCli(input: {
  workspaceId: string;
  skillRunId: string;
  jobId: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}, deps: { backend: SkillCliBackend; database: SkillCliDatabase }): Promise<SkillCliResult> {
  await deps.backend.retry(input.jobId);
  try {
    await deps.database.restartRun({ workspaceId: input.workspaceId, runId: input.skillRunId });
  } catch (error) {
    await deps.backend.cancel(input.jobId).catch(() => undefined);
    throw error;
  }
  const job = await waitForTerminalJob(deps.backend, input.jobId, input.timeoutMs ?? 15 * 60_000, input.pollIntervalMs ?? 750);
  if (!job) {
    await deps.backend.cancel(input.jobId).catch(() => undefined);
    await deps.database.failRun({ workspaceId: input.workspaceId, runId: input.skillRunId, status: 'cancelled', error: 'Tempo limite do retry CLI excedido.' });
    throw new Error('A repetição excedeu o tempo limite.');
  }
  if (job.status !== 'succeeded' || !job.proposal || !job.skillHash) {
    const status = job.status === 'cancelled' ? 'cancelled' : 'failed';
    const reason = job.error?.reason ?? `Runner terminou em ${job.status}.`;
    await deps.database.failRun({ workspaceId: input.workspaceId, runId: input.skillRunId, status, error: reason });
    throw new Error(reason);
  }
  await deps.database.completeRun({ workspaceId: input.workspaceId, runId: input.skillRunId, proposal: job.proposal, skillHash: job.skillHash });
  return {
    schemaVersion: '1.0.0', surface: 'cli', skillId: job.skillId, jobId: input.jobId, skillRunId: input.skillRunId,
    status: job.proposal.questions.length > 0 ? 'needs_input' : 'needs_review', model: job.model ?? 'codex-cli-default', skillHash: job.skillHash, proposal: job.proposal,
  };
}

export async function executeSkillFromCli(input: {
  skillId: string;
  payload: z.infer<typeof cliInputSchema>;
  approve: boolean;
  pollIntervalMs?: number;
  timeoutMs?: number;
}, deps: { backend: SkillCliBackend; database: SkillCliDatabase }): Promise<SkillCliResult> {
  const payload = cliInputSchema.parse(input.payload);
  let executionPayload = payload;
  if (payload.elicitationParentRunId) {
    const parent = await deps.database.readRun({ workspaceId: payload.workspaceId, runId: payload.elicitationParentRunId });
    if (!parent.proposal) throw new Error('O checkpoint pai não possui proposta disponível para continuação.');
    const existing = Array.isArray(payload.context?.artifacts) ? payload.context.artifacts : [];
    const checkpoint = parent.proposal.artifacts.map((artifact) => ({
      artifactType: artifact.artifactType,
      title: artifact.title,
      path: artifact.path,
      content: artifact.content,
    }));
    const artifacts = [...existing, ...checkpoint].filter((artifact, index, collection) => {
      if (!artifact || typeof artifact !== 'object') return false;
      const record = artifact as Record<string, unknown>;
      return collection.findIndex((candidate) => {
        if (!candidate || typeof candidate !== 'object') return false;
        const comparison = candidate as Record<string, unknown>;
        return comparison.artifactType === record.artifactType && comparison.path === record.path;
      }) === index;
    });
    executionPayload = { ...payload, context: { ...payload.context, artifacts } };
  }
  const started = await deps.backend.start(input.skillId, executionPayload);
  let skillRunId: string;
  try {
    skillRunId = await deps.database.createRun({
      workspaceId: payload.workspaceId,
      projectId: payload.projectId,
      skillId: input.skillId,
      jobId: started.jobId,
      elicitationParentRunId: payload.elicitationParentRunId,
    });
  } catch (error) {
    await deps.backend.cancel(started.jobId).catch(() => undefined);
    throw error;
  }
  if (payload.elicitationParentRunId) {
    try {
      await deps.database.supersedeRun({
        workspaceId: payload.workspaceId,
        parentRunId: payload.elicitationParentRunId,
        continuationRunId: skillRunId,
      });
    } catch (error) {
      await deps.backend.cancel(started.jobId).catch(() => undefined);
      await deps.database.failRun({
        workspaceId: payload.workspaceId,
        runId: skillRunId,
        status: 'cancelled',
        error: 'A continuação não pôde ser vinculada ao checkpoint anterior.',
      }).catch(() => undefined);
      throw error;
    }
  }

  const timeoutMs = input.timeoutMs ?? 15 * 60_000;
  const job = await waitForTerminalJob(deps.backend, started.jobId, timeoutMs, input.pollIntervalMs ?? 750);
  if (!job) {
    await deps.backend.cancel(started.jobId).catch(() => undefined);
    await deps.database.failRun({ workspaceId: payload.workspaceId, runId: skillRunId, status: 'cancelled', error: 'Tempo limite do CLI excedido.' });
    throw new Error(`A execução excedeu ${Math.round(timeoutMs / 1000)} segundos.`);
  }
  if (job.status !== 'succeeded' || !job.proposal || !job.skillHash) {
    const status = job.status === 'cancelled' ? 'cancelled' : 'failed';
    const reason = job.error?.reason ?? `Runner terminou em ${job.status}.`;
    await deps.database.failRun({ workspaceId: payload.workspaceId, runId: skillRunId, status, error: reason });
    throw new Error(reason);
  }

  await deps.database.completeRun({
    workspaceId: payload.workspaceId,
    runId: skillRunId,
    proposal: job.proposal,
    skillHash: job.skillHash,
  });
  const base: SkillCliResult = {
    schemaVersion: '1.0.0',
    surface: 'cli',
    skillId: input.skillId,
    jobId: started.jobId,
    skillRunId,
    status: job.proposal.questions.length > 0 ? 'needs_input' : 'needs_review',
    model: job.model ?? 'codex-cli-default',
    skillHash: job.skillHash,
    proposal: job.proposal,
  };
  if (job.proposal.questions.length > 0 || !input.approve) return base;

  const approval = await approveSkillRunFromCli({ skillRunId, proposal: job.proposal }, deps.backend);
  return {
    ...base,
    status: 'done',
    approval,
  };
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as { message?: string } & T;
  if (!response.ok) throw new Error(payload.message ?? `BFF respondeu ${response.status}.`);
  return payload;
}

export function createHttpSkillCliBackend(options: {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
}): SkillCliBackend {
  const fetchImpl = options.fetchImpl ?? fetch;
  const authHeaders = { 'x-local-runner-token': options.token };
  const headers = { 'content-type': 'application/json', ...authHeaders };
  const url = (path: string) => `${options.baseUrl.replace(/\/$/, '')}${path}`;
  return {
    async start(skillId, input) {
      return readJsonResponse(await fetchImpl(url(`/api/local/skills/${encodeURIComponent(skillId)}/run`), {
        method: 'POST', headers, body: JSON.stringify(input),
      }));
    },
    async get(jobId) {
      return readJsonResponse(await fetchImpl(url(`/api/local/skill-runs/${encodeURIComponent(jobId)}`), { headers: authHeaders }));
    },
    async cancel(jobId) {
      await readJsonResponse(await fetchImpl(url(`/api/local/skill-runs/${encodeURIComponent(jobId)}/cancel`), { method: 'POST', headers: authHeaders }));
    },
    async retry(jobId) {
      await readJsonResponse(await fetchImpl(url(`/api/local/skill-runs/${encodeURIComponent(jobId)}/retry`), { method: 'POST', headers: authHeaders }));
    },
    async plan(skillRunId, artifacts) {
      return readJsonResponse(await fetchImpl(url('/api/local/artifact-approvals/plan'), {
        method: 'POST', headers, body: JSON.stringify({ skillRunId, artifacts }),
      }));
    },
    async approve(input) {
      return readJsonResponse(await fetchImpl(url('/api/local/artifact-approvals'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          skillRunId: input.skillRunId,
          decision: 'approve',
          expectedProposalHash: input.proposalHash,
          expectedProposalRevision: input.proposalRevision,
          idempotencyKey: `${input.skillRunId}:${input.proposalHash}:approve`,
          artifacts: input.artifacts,
        }),
      }));
    },
    async reject(input) {
      return readJsonResponse(await fetchImpl(url('/api/local/artifact-approvals'), {
        method: 'POST', headers,
        body: JSON.stringify({
          skillRunId: input.skillRunId, decision: 'reject', expectedProposalHash: input.proposalHash,
          expectedProposalRevision: input.proposalRevision,
          idempotencyKey: `${input.skillRunId}:${input.proposalHash}:reject`,
        }),
      }));
    },
  };
}

export async function createSupabaseSkillCliDatabase(options: {
  url: string;
  anonKey: string;
  email: string;
  password: string;
}): Promise<SkillCliDatabase> {
  const client = createClient(options.url, options.anonKey, { auth: { persistSession: false } });
  const { error: authError } = await client.auth.signInWithPassword({ email: options.email, password: options.password });
  if (authError) throw new Error(`Login do CLI falhou: ${authError.message}`);
  return {
    async readRun(input) {
      const { data, error } = await client.from('skill_runs').select('proposal')
        .eq('workspace_id', input.workspaceId).eq('id', input.runId).maybeSingle();
      if (error) throw new Error(`Não foi possível ler o checkpoint do CLI: ${error.message}`);
      return { proposal: data?.proposal ? data.proposal as SkillProposal : null };
    },
    async createRun(input) {
      const { data, error } = await client.from('skill_runs').insert({
        workspace_id: input.workspaceId,
        project_id: input.projectId,
        skill_id: input.skillId,
        skill_hash: PENDING_SKILL_HASH,
        status: 'running',
        input_snapshot: {
          jobId: input.jobId,
          surface: 'cli',
          ...(input.elicitationParentRunId ? { elicitationParentRunId: input.elicitationParentRunId } : {}),
        },
      }).select('id').single();
      if (error || !data) throw new Error(`Não foi possível registrar o run do CLI: ${error?.message ?? 'sem retorno'}`);
      return String(data.id);
    },
    async completeRun(input) {
      const { error } = await client.from('skill_runs').update({
        status: 'needs_review', proposal: input.proposal, skill_hash: input.skillHash,
      }).eq('workspace_id', input.workspaceId).eq('id', input.runId);
      if (error) throw new Error(`Não foi possível registrar a proposta do CLI: ${error.message}`);
    },
    async failRun(input) {
      const { error } = await client.from('skill_runs').update({
        status: input.status, error: input.error,
      }).eq('workspace_id', input.workspaceId).eq('id', input.runId);
      if (error) throw new Error(`Não foi possível registrar a falha do CLI: ${error.message}`);
    },
    async supersedeRun(input) {
      const { error } = await client.rpc('supersede_skill_run_checkpoint', {
        p_workspace_id: input.workspaceId,
        p_parent_run_id: input.parentRunId,
        p_continuation_run_id: input.continuationRunId,
      });
      if (error) throw new Error(`Não foi possível vincular a continuação do CLI: ${error.message}`);
    },
    async restartRun(input) {
      const { error } = await client.from('skill_runs').update({ status: 'running', error: null })
        .eq('workspace_id', input.workspaceId).eq('id', input.runId);
      if (error) throw new Error(`Não foi possível reiniciar o run do CLI: ${error.message}`);
    },
  };
}

type ParsedArgs =
  | { command: 'run'; skillId: string; inputPath: string; outputPath?: string }
  | { command: 'approve-run'; skillRunId: string; proposalPath: string; outputPath?: string }
  | { command: 'retry-run'; skillRunId: string; jobId: string; workspaceId: string; outputPath?: string }
  | { command: 'status'; projectId: string; outputPath?: string }
  | { command: 'setup'; outputPath?: string }
  | { command: 'cancel-run'; skillRunId: string; jobId: string; workspaceId: string; outputPath?: string }
  | { command: 'reject-run'; skillRunId: string; proposalPath: string; outputPath?: string }
  | { command: 'run-status'; jobId: string; outputPath?: string };

function parseArgs(argv: string[]): ParsedArgs {
  if (argv.includes('--setup')) {
    const outputIndex = argv.indexOf('--output');
    return { command: 'setup', outputPath: outputIndex >= 0 ? argv[outputIndex + 1] : undefined };
  }
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--') || !argv[index + 1]) throw new Error(`Argumento inválido: ${arg}`);
    values.set(arg, argv[index + 1]);
    index += 1;
  }
  const runStatusJobId = values.get('--run-status');
  if (runStatusJobId) return { command: 'run-status', jobId: runStatusJobId, outputPath: values.get('--output') };
  const cancelRunId = values.get('--cancel-run');
  if (cancelRunId) {
    const jobId = values.get('--job');
    const workspaceId = values.get('--workspace');
    if (!jobId || !workspaceId) throw new Error('Uso: --cancel-run <run-id> --job <job-id> --workspace <workspace-id>');
    return { command: 'cancel-run', skillRunId: cancelRunId, jobId, workspaceId, outputPath: values.get('--output') };
  }
  const rejectRunId = values.get('--reject-run');
  if (rejectRunId) {
    const proposal = values.get('--proposal');
    if (!proposal) throw new Error('Uso: --reject-run <run-id> --proposal <resultado-run.json>');
    return { command: 'reject-run', skillRunId: rejectRunId, proposalPath: proposal, outputPath: values.get('--output') };
  }
  const skillRunId = values.get('--approve-run');
  const proposalPath = values.get('--proposal');
  if (skillRunId || proposalPath) {
    if (!skillRunId || !proposalPath) throw new Error('Uso: npm run skill:cli -- --approve-run <run-id> --proposal <resultado-run.json> [--output <arquivo.json>]');
    return { command: 'approve-run', skillRunId, proposalPath, outputPath: values.get('--output') };
  }
  const retryRunId = values.get('--retry-run');
  if (retryRunId) {
    const jobId = values.get('--job');
    const workspaceId = values.get('--workspace');
    if (!jobId || !workspaceId) throw new Error('Uso: npm run skill:cli -- --retry-run <run-id> --job <job-id> --workspace <workspace-id> [--output <arquivo.json>]');
    return { command: 'retry-run', skillRunId: retryRunId, jobId, workspaceId, outputPath: values.get('--output') };
  }
  const statusProjectId = values.get('--status');
  if (statusProjectId) return { command: 'status', projectId: statusProjectId, outputPath: values.get('--output') };
  const skillId = values.get('--skill');
  const inputPath = values.get('--input');
  if (!skillId || !inputPath) throw new Error('Uso: npm run skill:cli -- --skill <id> --input <arquivo.json> [--output <arquivo.json>]');
  return { command: 'run', skillId, inputPath, outputPath: values.get('--output') };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const requiredEnv = args.command === 'run' || args.command === 'retry-run' || args.command === 'cancel-run'
    ? ['MARKETING_STUDIO_BFF_URL', 'LOCAL_SKILL_RUNNER_TOKEN', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'MARKETING_STUDIO_EMAIL', 'MARKETING_STUDIO_PASSWORD'] as const
    : ['MARKETING_STUDIO_BFF_URL', 'LOCAL_SKILL_RUNNER_TOKEN'] as const;
  for (const name of requiredEnv) if (!process.env[name]) throw new Error(`Variável obrigatória ausente: ${name}`);
  if (args.command === 'setup') {
    const result = await readEnvironmentBootstrapFromCli({
      baseUrl: process.env.MARKETING_STUDIO_BFF_URL!, token: process.env.LOCAL_SKILL_RUNNER_TOKEN!,
    });
    const serialized = `${JSON.stringify(result, null, 2)}\n`;
    if (args.outputPath) await writeFile(resolve(args.outputPath), serialized, 'utf8');
    else process.stdout.write(serialized);
    return;
  }
  if (args.command === 'status') {
    const result = await readProjectStatusFromCli({
      baseUrl: process.env.MARKETING_STUDIO_BFF_URL!, token: process.env.LOCAL_SKILL_RUNNER_TOKEN!, projectId: args.projectId,
    });
    const serialized = `${JSON.stringify(result, null, 2)}\n`;
    if (args.outputPath) await writeFile(resolve(args.outputPath), serialized, 'utf8');
    else process.stdout.write(serialized);
    return;
  }
  const backend = createHttpSkillCliBackend({
    baseUrl: process.env.MARKETING_STUDIO_BFF_URL!,
    token: process.env.LOCAL_SKILL_RUNNER_TOKEN!,
  });
  if (args.command === 'run-status') {
    const result = await backend.get(args.jobId);
    const serialized = `${JSON.stringify({ schemaVersion: '1.0.0', surface: 'cli', operation: 'run-status', result }, null, 2)}\n`;
    if (args.outputPath) await writeFile(resolve(args.outputPath), serialized, 'utf8'); else process.stdout.write(serialized);
    return;
  }
  if (args.command === 'cancel-run') {
    const database = await createSupabaseSkillCliDatabase({
      url: process.env.VITE_SUPABASE_URL!, anonKey: process.env.VITE_SUPABASE_ANON_KEY!,
      email: process.env.MARKETING_STUDIO_EMAIL!, password: process.env.MARKETING_STUDIO_PASSWORD!,
    });
    await cancelSkillFromCli({ workspaceId: args.workspaceId, skillRunId: args.skillRunId, jobId: args.jobId }, { backend, database });
    const serialized = `${JSON.stringify({ schemaVersion: '1.0.0', surface: 'cli', operation: 'cancel-run', status: 'cancelled', skillRunId: args.skillRunId, jobId: args.jobId }, null, 2)}\n`;
    if (args.outputPath) await writeFile(resolve(args.outputPath), serialized, 'utf8'); else process.stdout.write(serialized);
    return;
  }
  if (args.command === 'reject-run') {
    const prior = JSON.parse(await readFile(resolve(args.proposalPath), 'utf8')) as Partial<SkillCliResult>;
    if (!prior.proposal || prior.skillRunId !== args.skillRunId) throw new Error('Arquivo de proposta não corresponde ao run informado.');
    const approval = await rejectSkillRunFromCli({ skillRunId: args.skillRunId, proposal: prior.proposal }, backend);
    const serialized = `${JSON.stringify({ schemaVersion: '1.0.0', surface: 'cli', operation: 'reject-run', status: 'rejected', skillRunId: args.skillRunId, approval }, null, 2)}\n`;
    if (args.outputPath) await writeFile(resolve(args.outputPath), serialized, 'utf8'); else process.stdout.write(serialized);
    return;
  }
  if (args.command === 'approve-run') {
    const prior = JSON.parse(await readFile(resolve(args.proposalPath), 'utf8')) as Partial<SkillCliResult>;
    if (!prior.proposal || prior.skillRunId !== args.skillRunId) throw new Error('Arquivo de proposta não corresponde ao run informado.');
    const approval = await approveSkillRunFromCli({ skillRunId: args.skillRunId, proposal: prior.proposal }, backend);
    const serialized = `${JSON.stringify({ schemaVersion: '1.0.0', surface: 'cli', skillRunId: args.skillRunId, status: 'done', approval }, null, 2)}\n`;
    if (args.outputPath) await writeFile(resolve(args.outputPath), serialized, 'utf8');
    else process.stdout.write(serialized);
    return;
  }
  if (args.command === 'retry-run') {
    const database = await createSupabaseSkillCliDatabase({
      url: process.env.VITE_SUPABASE_URL!, anonKey: process.env.VITE_SUPABASE_ANON_KEY!,
      email: process.env.MARKETING_STUDIO_EMAIL!, password: process.env.MARKETING_STUDIO_PASSWORD!,
    });
    const result = await retrySkillFromCli({
      workspaceId: args.workspaceId, skillRunId: args.skillRunId, jobId: args.jobId,
    }, { backend, database });
    const serialized = `${JSON.stringify(result, null, 2)}\n`;
    if (args.outputPath) await writeFile(resolve(args.outputPath), serialized, 'utf8');
    else process.stdout.write(serialized);
    if (result.status === 'needs_input') process.exitCode = 3;
    return;
  }
  const payload = cliInputSchema.parse(JSON.parse(await readFile(resolve(args.inputPath), 'utf8')));
  const database = await createSupabaseSkillCliDatabase({
    url: process.env.VITE_SUPABASE_URL!,
    anonKey: process.env.VITE_SUPABASE_ANON_KEY!,
    email: process.env.MARKETING_STUDIO_EMAIL!,
    password: process.env.MARKETING_STUDIO_PASSWORD!,
  });
  const result = await executeSkillFromCli({ skillId: args.skillId, payload, approve: false }, {
    database,
    backend,
  });
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (args.outputPath) await writeFile(resolve(args.outputPath), serialized, 'utf8');
  else process.stdout.write(serialized);
  if (result.status === 'needs_input') process.exitCode = 3;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Falha inesperada no CLI.'}\n`);
    process.exitCode = 1;
  });
}
