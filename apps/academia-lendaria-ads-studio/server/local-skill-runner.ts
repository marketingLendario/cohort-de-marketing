import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
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

/**
 * Error raised when a run is killed for exceeding its ms budget (STORY-12.W3.1
 * AC2). Distinct from a manual cancel (`LocalSkillRunAbortError`) and from any
 * other runner failure so the worker/UI can classify `RUN_TIMEOUT` separately
 * from a generic `RUN_FAILED` instead of pattern-matching the message text.
 */
export class LocalSkillRunTimeoutError extends Error {
  readonly timedOut = true as const;
  constructor(message: string) {
    super(message);
    this.name = 'LocalSkillRunTimeoutError';
  }
}

export function isLocalSkillRunTimeoutError(error: unknown): error is LocalSkillRunTimeoutError {
  return error instanceof LocalSkillRunTimeoutError || (error instanceof Error && (error as { timedOut?: boolean }).timedOut === true);
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

interface TrafficMetricSignal {
  metrica?: unknown;
  valor?: unknown;
  selo?: unknown;
}

const CANONICAL_TRAFFIC_METRICS = ['CTR', 'CPM', 'CPA', 'ROAS', 'frequência', 'alcance'] as const;

const TRAFFIC_METRIC_ALIASES: Record<(typeof CANONICAL_TRAFFIC_METRICS)[number], string[]> = {
  CTR: ['CTR'],
  CPM: ['CPM'],
  CPA: ['CPA'],
  ROAS: ['ROAS'],
  frequência: ['frequência', 'frequency'],
  alcance: ['alcance', 'reach'],
};

function normalizeForComparison(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function canonicalTrafficMetric(value: string): (typeof CANONICAL_TRAFFIC_METRICS)[number] | undefined {
  const normalized = normalizeForComparison(value);
  return CANONICAL_TRAFFIC_METRICS.find((metric) =>
    TRAFFIC_METRIC_ALIASES[metric].some((alias) => normalizeForComparison(alias) === normalized),
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectTrafficMetricSignals(value: unknown, output: TrafficMetricSignal[] = []): TrafficMetricSignal[] {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectTrafficMetricSignals(entry, output));
    return output;
  }
  if (!value || typeof value !== 'object') return output;
  const record = value as Record<string, unknown>;
  if ('metrica' in record && ('valor' in record || 'selo' in record)) output.push(record);
  Object.values(record).forEach((entry) => collectTrafficMetricSignals(entry, output));
  return output;
}

function parseStructuredContent(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return parseYaml(content);
  }
}

/** Metrics explicitly marked as unavailable by the canonical Leitor artifact. */
export function unavailableTrafficMetrics(context: Record<string, unknown> | undefined): string[] {
  const artifacts = Array.isArray(context?.artifacts) ? context.artifacts : [];
  const metrics = new Set<string>();
  for (const candidate of artifacts) {
    if (!candidate || typeof candidate !== 'object') continue;
    const artifact = candidate as Record<string, unknown>;
    if (artifact.artifactType !== 'trafficMetricReading' || typeof artifact.content !== 'string') continue;
    try {
      const signals = collectTrafficMetricSignals(parseStructuredContent(artifact.content));
      const suppliedMetrics = new Set<string>();
      for (const signal of signals) {
        if (typeof signal.metrica !== 'string') continue;
        const seal = typeof signal.selo === 'string' ? normalizeForComparison(signal.selo).replace(/[_-]+/g, ' ') : '';
        const name = signal.metrica.trim();
        const canonicalName = canonicalTrafficMetric(name);
        const comparableName = canonicalName ? normalizeForComparison(canonicalName) : normalizeForComparison(name);
        if (signal.valor == null || seal.includes('nao fornecido')) metrics.add(canonicalName ?? name);
        else suppliedMetrics.add(comparableName);
      }
      // The Leitor contract says absent named fields are "não fornecido". If a
      // model omits one of the canonical derived metrics instead of emitting a
      // null signal, the Diagnosticador must still treat it as unavailable.
      for (const metric of CANONICAL_TRAFFIC_METRICS) {
        const normalizedMetric = normalizeForComparison(metric);
        const alreadyUnavailable = [...metrics].some((candidateMetric) => normalizeForComparison(candidateMetric) === normalizedMetric);
        if (!suppliedMetrics.has(normalizedMetric) && !alreadyUnavailable) metrics.add(metric);
      }
    } catch {
      // A malformed upstream artifact is already visible to the model, but it
      // cannot establish a deterministic unavailable-metric contract.
    }
  }
  return [...metrics];
}

function collectProposalStrings(value: unknown, depth = 0): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (depth < 3 && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
      try {
        return collectProposalStrings(JSON.parse(trimmed), depth + 1);
      } catch {
        return [value];
      }
    }
    if (depth < 3 && trimmed.includes('\n') && trimmed.includes(':')) {
      try {
        const parsed = parseYaml(trimmed);
        if (parsed && typeof parsed === 'object') return collectProposalStrings(parsed, depth + 1);
      } catch {
        // Keep the original text so the guard can still inspect it.
      }
    }
    return [value];
  }
  if (Array.isArray(value)) return value.flatMap((entry) => collectProposalStrings(entry, depth));
  if (value && typeof value === 'object') return Object.values(value).flatMap((entry) => collectProposalStrings(entry, depth));
  return [];
}

function diagnosticProposalStrings(proposal: SkillProposal): string[] {
  const { artifacts, ...proposalCopy } = proposal;
  const strings = collectProposalStrings(proposalCopy);

  for (const artifact of artifacts) {
    if (artifact.artifactType !== 'trafficDiagnosis') continue;
    try {
      const parsed = parseStructuredContent(artifact.content);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'diagnosticador' in parsed) {
        strings.push(...collectProposalStrings((parsed as Record<string, unknown>).diagnosticador));
        continue;
      }
    } catch {
      // Fall through and inspect the raw diagnostic artifact fail-closed.
    }
    strings.push(...collectProposalStrings(artifact.content));
  }

  return strings;
}

/**
 * Returns unavailable metrics that received a numeric value in the proposal.
 * Text such as "CTR não fornecido" remains valid; assignments, estimates and
 * derivations such as "CTR aproximado de 0,8%" fail closed.
 */
export function derivedUnavailableTrafficMetrics(proposal: SkillProposal, unavailableMetrics: string[]): string[] {
  const texts = diagnosticProposalStrings(proposal).map(normalizeForComparison);
  const numeric = '(?:r\\$\\s*)?\\d+(?:[.,]\\d+)*(?:\\s*[%x])?';
  return unavailableMetrics.filter((metric) => {
    const name = escapeRegExp(normalizeForComparison(metric));
    const connector = '(?:[:=]|(?:e|foi|foram|ficou|fica|esta|estava|seria)\\s+(?:de\\s+)?|(?:de|em|para|abaixo\\s+de|acima\\s+de)\\s*|(?:(?:aproximad|calculad|derivad|estimad|equival|result)\\w*\\s+de)\\s*)';
    const metricThenValue = new RegExp(`\\b${name}\\b(?:\\s+(?:alvo|meta|do|da|no|na|gerenciador|valor|media|metrica)){0,4}\\s*${connector}\\s*${numeric}`, 'i');
    const valueThenMetric = new RegExp(`${numeric}\\s*(?:de|para|em|no|na)?\\s*\\b${name}\\b`, 'i');
    return texts.some((text) => metricThenValue.test(text) || valueThenMetric.test(text));
  });
}

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
      reject(new LocalSkillRunTimeoutError(`Codex CLI excedeu o limite de ${Math.round(timeoutMs / 1000)} segundos.`));
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
    const unavailableMetrics = skillId === 'diagnosticador' ? unavailableTrafficMetrics(input.context) : [];
    const unavailableMetricGuard = unavailableMetrics.length > 0
      ? [
          `GUARDA LITERAL DO LEITOR: ${unavailableMetrics.join(', ')} estão marcadas como nao_fornecido.`,
          'Você pode dizer que essas métricas não foram fornecidas, mas não pode calcular, estimar, derivar nem mencionar qualquer valor numérico para elas.',
          'Baseie a alavanca somente nos valores literais e nos estados operacionais presentes nos artefatos.',
        ].join(' ')
      : '';
    const trafficPanelGuard = ['zelador', 'briefista', 'estruturador', 'leitor-de-metricas', 'diagnosticador'].includes(skillId)
      ? [
          'HANDOFF DO SQUAD: context.trafficPanel é a memória compartilhada canônica desta execução.',
          'Preserve as seções anteriores e acrescente somente a seção da skill atual, sem apagar dados literais já confirmados.',
          'A saída deve conter um único artefato YAML em PAINEL-DA-SEMANA.yaml quando a skill produzir artefato do squad.',
          'Não transforme o painel compartilhado em JSON nem troque seu caminho por um arquivo privado da skill.',
        ].join(' ')
      : '';
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
        unavailableMetricGuard,
        trafficPanelGuard,
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
      const derivedMetrics = derivedUnavailableTrafficMetrics(proposal, unavailableMetrics);
      if (derivedMetrics.length > 0) {
        throw new Error(
          `Diagnosticador derivou ${derivedMetrics.join(', ')}, marcado como não fornecido pelo Leitor. Rode novamente sem calcular métricas ausentes.`,
        );
      }
      const producedArtifactTypes = new Set(proposal.artifacts.map((artifact) => artifact.artifactType));
      const missingPrimaryArtifacts = skill.primaryArtifacts.filter((artifactType) => !producedArtifactTypes.has(artifactType));
      if (missingPrimaryArtifacts.length > 0) {
        throw new Error(
          `${skill.title} não produziu o artefato obrigatório ${missingPrimaryArtifacts.join(', ')}. ${proposal.summary}`,
        );
      }
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
