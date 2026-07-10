import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
  DEFAULT_LOCAL_RUNNER_LIMITS,
  resolveLocalRunnerLimits,
  sanitizeCodexEnv,
} from './local-runner-security.js';

export interface SkillProposalArtifact {
  artifactType: string;
  title: string;
  path: string;
  format: 'markdown' | 'json' | 'yaml' | 'html';
  content: string;
}

export interface SkillProposal {
  summary: string;
  resultMarkdown: string;
  artifacts: SkillProposalArtifact[];
  fields: Array<{ key: string; value: string }>;
  questions: string[];
  warnings: string[];
}

export interface LocalSkillRunInput {
  projectId: string;
  brief: Record<string, unknown>;
  context?: Record<string, unknown>;
  operatorInput?: string;
}

export interface LocalSkillRunResult {
  skillId: string;
  skillHash: string;
  model: string;
  proposal: SkillProposal;
}

/** Coarse progress phase reported by the runner (mapped to a journal step). */
export interface LocalSkillRunStep {
  id: string;
  label: string;
  status: 'running' | 'done';
}

/**
 * Runtime options for a durable async run (STORY-8.W2.2). All optional so the
 * synchronous W1.2 call site and the tests keep working unchanged.
 */
export interface LocalSkillRunOptions {
  /**
   * Cancels the run (AC4). Aborting propagates a SIGTERM→SIGKILL to the Codex
   * child, cleans temporaries and rejects with an aborted error.
   */
  signal?: AbortSignal;
  /** Progress phase callback (drives the observable timeline). */
  onStep?: (step: LocalSkillRunStep) => void;
  /** Scrubbed log-line callback (never carries secrets). */
  onLog?: (line: { level: 'info' | 'warn' | 'error'; message: string }) => void;
}

export interface LocalSkillRunner {
  run(
    skillId: string,
    input: LocalSkillRunInput,
    options?: LocalSkillRunOptions,
  ): Promise<LocalSkillRunResult>;
}

/** Error raised when a run is cancelled via its AbortSignal (AC4). */
export class LocalSkillRunAbortError extends Error {
  readonly aborted = true as const;
  constructor(message = 'Execução da skill cancelada.') {
    super(message);
    this.name = 'LocalSkillRunAbortError';
  }
}

export function isLocalSkillRunAbortError(error: unknown): error is LocalSkillRunAbortError {
  return error instanceof LocalSkillRunAbortError || (error instanceof Error && (error as { aborted?: boolean }).aborted === true);
}

interface CatalogSkill {
  id: string;
  title: string;
  description: string;
  skillPath: string;
  primaryArtifacts: string[];
  guard: string;
}

interface SkillCatalog {
  skills: CatalogSkill[];
}

interface CodexExecution {
  args: string[];
  prompt: string;
  cwd: string;
  outputPath: string;
  timeoutMs: number;
  /** Janela entre SIGTERM e SIGKILL no kill escalonado (AC5). */
  killGraceMs: number;
  /** Ambiente já sanitizado (sem OPENAI_API_KEY / CODEX_API_KEY — AC4). */
  env: NodeJS.ProcessEnv;
  /** Cancela a execução propagando SIGTERM→SIGKILL ao processo filho (AC5/STORY-8.W2.2). */
  signal?: AbortSignal;
}

type CodexExecutor = (execution: CodexExecution) => Promise<void>;

export const skillProposalSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'resultMarkdown', 'artifacts', 'fields', 'questions', 'warnings'],
  properties: {
    summary: { type: 'string' },
    resultMarkdown: { type: 'string' },
    artifacts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['artifactType', 'title', 'path', 'format', 'content'],
        properties: {
          artifactType: { type: 'string' },
          title: { type: 'string' },
          path: { type: 'string' },
          format: { type: 'string', enum: ['markdown', 'json', 'yaml', 'html'] },
          content: { type: 'string' },
        },
      },
    },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'value'],
        properties: {
          key: { type: 'string' },
          value: { type: 'string' },
        },
      },
    },
    questions: { type: 'array', items: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } },
  },
} as const;

function defaultCodexExecutor(codexPath: string): CodexExecutor {
  return ({ args, prompt, cwd, timeoutMs, killGraceMs, env, signal }) => new Promise((resolvePromise, reject) => {
    // Cancelamento antes mesmo do spawn (AC4): não inicia o processo filho.
    if (signal?.aborted) {
      reject(new LocalSkillRunAbortError());
      return;
    }
    // Ambiente já sanitizado (AC4): sem chaves OpenAI/Codex no processo filho.
    const child = spawn(codexPath, args, {
      cwd,
      env,
      stdio: ['pipe', 'ignore', 'pipe'],
    });
    let stderr = '';
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    let aborted = false;
    // Kill escalonado (AC5): SIGTERM na expiração, SIGKILL após a janela de graça.
    const escalateKill = () => {
      child.kill('SIGTERM');
      killTimer = setTimeout(() => child.kill('SIGKILL'), killGraceMs);
    };
    const timer = setTimeout(() => {
      escalateKill();
      reject(new Error(`Codex CLI excedeu o limite de ${Math.round(timeoutMs / 1000)} segundos.`));
    }, timeoutMs);
    // Cancelamento em voo (AC4/STORY-8.W2.2): mesmo kill escalonado do timeout.
    const onAbort = () => {
      aborted = true;
      escalateKill();
      reject(new LocalSkillRunAbortError());
    };
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    const clearTimers = () => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      if (signal) signal.removeEventListener('abort', onAbort);
    };

    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < 64_000) stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimers();
      if (aborted) return;
      reject(new Error(`Não foi possível iniciar o Codex CLI: ${error.message}`));
    });
    child.on('close', (code, closeSignal) => {
      clearTimers();
      if (aborted) return;
      if (code === 0) resolvePromise();
      else reject(new Error(`Codex CLI falhou (${closeSignal ?? `exit ${code}`}): ${stderr.trim() || 'sem detalhes'}`));
    });
    child.stdin.end(prompt);
  });
}

export class CodexCliLocalSkillRunner implements LocalSkillRunner {
  private readonly repoRoot: string;
  private readonly model?: string;
  private readonly timeoutMs: number;
  private readonly killGraceMs: number;
  private readonly execute: CodexExecutor;

  constructor(options: {
    repoRoot: string;
    codexPath?: string;
    model?: string;
    timeoutMs?: number;
    killGraceMs?: number;
    execute?: CodexExecutor;
  }) {
    this.repoRoot = options.repoRoot;
    this.model = options.model;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_LOCAL_RUNNER_LIMITS.timeoutMs;
    this.killGraceMs = options.killGraceMs ?? DEFAULT_LOCAL_RUNNER_LIMITS.killGraceMs;
    this.execute = options.execute ?? defaultCodexExecutor(options.codexPath ?? 'codex');
  }

  async run(
    skillId: string,
    input: LocalSkillRunInput,
    options: LocalSkillRunOptions = {},
  ): Promise<LocalSkillRunResult> {
    const { signal, onStep, onLog } = options;
    const ensureLive = () => {
      if (signal?.aborted) throw new LocalSkillRunAbortError();
    };
    ensureLive();
    onStep?.({ id: 'resolve', label: 'Resolver skill canônica', status: 'running' });
    const catalog = JSON.parse(await readFile(resolve(this.repoRoot, 'data/skill-catalog.json'), 'utf8')) as SkillCatalog;
    const skill = catalog.skills.find((candidate) => candidate.id === skillId);
    if (!skill) throw new Error(`Skill não catalogada: ${skillId}`);
    const skillPath = resolve(this.repoRoot, skill.skillPath);
    const canonicalRoot = resolve(this.repoRoot, '.claude/skills');
    if (!skillPath.startsWith(`${canonicalRoot}/`)) throw new Error('Caminho de skill fora da raiz canônica.');
    const instructions = await readFile(skillPath, 'utf8');
    const skillHash = createHash('sha256').update(instructions).digest('hex');
    onStep?.({ id: 'resolve', label: 'Resolver skill canônica', status: 'done' });
    const primaryArtifacts = skill.primaryArtifacts.length ? skill.primaryArtifacts.join(', ') : 'nenhum artefato obrigatório';
    ensureLive();
    const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'cohort-codex-skill-'));
    const schemaPath = resolve(temporaryDirectory, 'proposal.schema.json');
    const outputPath = resolve(temporaryDirectory, 'proposal.json');

    try {
      await writeFile(schemaPath, JSON.stringify(skillProposalSchema, null, 2), 'utf8');
      const args = [
        'exec',
        '--ephemeral',
        '--sandbox',
        'read-only',
        '--cd',
        this.repoRoot,
        '--output-schema',
        schemaPath,
        '--output-last-message',
        outputPath,
      ];
      if (this.model) args.push('--model', this.model);
      args.push('-');

      const prompt = [
        'Você está executando uma skill canônica do Cohort de Marketing.',
        'Responda somente com o objeto JSON solicitado pelo schema de saída.',
        'Obedeça integralmente ao SKILL.md abaixo, inclusive gates, recusas e limites de autonomia.',
        'Não invente fatos ausentes. Toda saída é uma proposta para revisão humana.',
        'Não edite arquivos. Não publique, pause, escale ou altere campanhas na Meta.',
        `Tipos de artefato esperados no catálogo: ${primaryArtifacts}.`,
        skill.guard ? `Guarda de produto: ${skill.guard}` : '',
        '',
        '--- SKILL.md canônico ---',
        instructions,
        '',
        '--- Entrada estruturada ---',
        JSON.stringify({
          projectId: input.projectId,
          projectBrief: input.brief,
          context: input.context ?? {},
          operatorInput: input.operatorInput ?? 'Execute a skill com os dados disponíveis e registre lacunas sem inventar.',
        }),
      ].filter(Boolean).join('\n');

      onStep?.({ id: 'codex', label: 'Executar Codex CLI', status: 'running' });
      onLog?.({ level: 'info', message: `Executando skill "${skillId}" no sandbox read-only.` });
      await this.execute({
        args,
        prompt,
        cwd: this.repoRoot,
        outputPath,
        timeoutMs: this.timeoutMs,
        killGraceMs: this.killGraceMs,
        env: sanitizeCodexEnv(process.env),
        signal,
      });
      onStep?.({ id: 'codex', label: 'Executar Codex CLI', status: 'done' });
      onStep?.({ id: 'parse', label: 'Validar proposta estruturada', status: 'running' });
      const proposal = JSON.parse(await readFile(outputPath, 'utf8')) as SkillProposal;
      onStep?.({ id: 'parse', label: 'Validar proposta estruturada', status: 'done' });
      return {
        skillId,
        skillHash,
        model: this.model ?? 'codex-cli-default',
        proposal,
      };
    } finally {
      // Limpa temporários mesmo em cancelamento/timeout (AC4/AC5).
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }
}

export function createLocalSkillRunnerFromEnv(): LocalSkillRunner | null {
  if (process.env.LOCAL_SKILL_RUNNER_ENABLED !== 'true') return null;
  const repoRoot = process.env.COHORT_REPO_ROOT ?? resolve(process.cwd(), '../..');
  const limits = resolveLocalRunnerLimits();
  return new CodexCliLocalSkillRunner({
    repoRoot,
    codexPath: process.env.CODEX_CLI_PATH,
    model: process.env.CODEX_SKILL_MODEL,
    timeoutMs: limits.timeoutMs,
    killGraceMs: limits.killGraceMs,
  });
}
