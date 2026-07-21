import { createHash } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';
import {
  LocalSkillRunAbortError,
  type LocalSkillRunner,
  type LocalSkillRunInput,
  type LocalSkillRunOptions,
  type LocalSkillRunResult,
  type SkillProposal,
} from '../local-skill-runner.js';
import { sanitizeCodexEnv } from '../local-runner-security.js';
import { parseDesignTokens, type DesignTokens } from '../brand-design/preview.js';

export const CREATIVE_FACTORY_SKILL_ID = 'ads-creative-factory';

/** Slug canônico do projeto Academia Lendária (único com fallback de marca empacotada). */
export const ACADEMIA_BRAND_SLUG = 'academia-lendaria';

export const creativeFormatSchema = z.enum(['feed', 'story', 'square']);
export const creativeArchetypeSchema = z.enum([
  'dark_editorial',
  'light_clean',
  'person_authority',
  'mockup_product',
  'ugc_native',
  'didactic_compare',
]);

const creativePersonaSchema = z.enum(['alan-nicolas', 'fran-martins', 'erica-souza', 'rafael-costa', 'bruno-gentil']);

export const likenessAuthorizationSchema = z.object({
  persona: creativePersonaSchema,
  photoSha256: z.string().regex(/^[a-f0-9]{64}$/),
  consentReference: z.string().trim().min(8).max(500),
}).strict();

export const creativeFactoryContextSchema = z.object({
  campaignId: z.string().min(1).max(120),
  productionSkillId: z.enum(['ads-creative-factory', 'criativos-funil', 'mockup-produto-funil']).default('ads-creative-factory'),
  formats: z.array(creativeFormatSchema).min(1).max(3),
  archetypes: z.array(creativeArchetypeSchema).min(1).max(6),
  variants: z.number().int().min(1).max(3).default(1),
  personas: z.array(creativePersonaSchema).max(5).default([]),
  likenessAuthorizations: z.array(likenessAuthorizationSchema).max(5).default([]),
  cta: z.string().trim().min(1).max(80),
  linkDescription: z.string().trim().max(180).optional(),
  finalists: z.array(z.object({
    id: z.string().min(1).max(120),
    hook: z.string().trim().min(1).max(240),
    copy: z.string().trim().min(1).max(10_000),
    format: z.enum(['feed', 'reels-9x16']),
  })).min(1).max(6),
}).strict();

export type CreativeFactoryContext = z.infer<typeof creativeFactoryContextSchema>;
export type CreativeFormat = z.infer<typeof creativeFormatSchema>;

export interface CreativeFactoryAsset {
  id: string;
  format: CreativeFormat;
  width: number;
  height: number;
  sha256: string;
  bytes: number;
}

export interface CreativeFactoryItem {
  id: string;
  status: 'ready' | 'flagged';
  archetype: string;
  headline: string;
  caption: string;
  linkDescription: string;
  cta: string;
  promptSanitized: string;
  promptSha256: string;
  gate: Record<string, unknown>;
  review: Record<string, unknown>;
  assets: CreativeFactoryAsset[];
}

export interface CreativeFactoryPublicManifest {
  schemaVersion: '1.0.0';
  batchId: string;
  projectId: string;
  campaignId: string;
  productionSkillId: 'ads-creative-factory' | 'criativos-funil' | 'mockup-produto-funil';
  status: 'ready_for_review';
  createdAt: string;
  items: CreativeFactoryItem[];
}

interface RawManifestItem extends Record<string, unknown> {
  id?: string;
  status?: string;
  archetype?: string;
  headline?: string;
  caption?: string;
  link_description?: string;
  cta?: string;
  final?: string;
  formats?: unknown;
  gate?: Record<string, unknown>;
  review?: Record<string, unknown>;
  error?: string;
}

interface RawManifest {
  hooks?: RawManifestItem[];
}

interface ProcessExecution {
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
  killGraceMs: number;
  signal?: AbortSignal;
}

type ProcessExecutor = (execution: ProcessExecution) => Promise<void>;

function safeSegment(value: string, fallback: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72);
  return normalized || fallback;
}

function sha256(buffer: Buffer | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}

async function authorizedPersonaPhoto(skillRoot: string, authorization: z.infer<typeof likenessAuthorizationSchema>): Promise<void> {
  const personas = parseYaml(await readFile(resolve(skillRoot, 'data/personas.yaml'), 'utf8')) as {
    personas?: Record<string, { photos_dir?: string }>;
  };
  const photoDir = personas.personas?.[authorization.persona]?.photos_dir;
  if (!photoDir) throw new Error(`Persona ${authorization.persona} não possui diretório de fotos registrado.`);
  const directory = resolve(skillRoot, photoDir);
  const names = await readdir(directory).catch(() => []);
  const hashes = await Promise.all(names.map(async (name) => sha256(await readFile(resolve(directory, name)))));
  if (!hashes.includes(authorization.photoSha256)) {
    throw new Error(`A foto autorizada de ${authorization.persona} não corresponde a um asset registrado.`);
  }
}

async function assertLikenessAuthorizations(
  skillRoot: string,
  context: CreativeFactoryContext,
): Promise<void> {
  const requiresPerson = context.archetypes.some((archetype) => ['person_authority', 'ugc_native'].includes(archetype));
  if (!requiresPerson) return;
  if (context.personas.length === 0) throw new Error('Arquétipo com pessoa exige ao menos uma persona autorizada.');
  for (const persona of context.personas) {
    const authorization = context.likenessAuthorizations.find((candidate) => candidate.persona === persona);
    if (!authorization) throw new Error(`Persona ${persona} exige foto e autorização explícita.`);
    await authorizedPersonaPhoto(skillRoot, authorization);
  }
}

export function sanitizePublicDiagnostics(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value)) return '[redacted-path]';
    return value.slice(0, 500);
  }
  if (Array.isArray(value)) return value.slice(0, 40).map((entry) => sanitizePublicDiagnostics(entry, depth + 1));
  if (typeof value !== 'object') return String(value).slice(0, 200);
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !/(^|_)(?:path|img|image|final|ref|source)(?:$|_)/i.test(key))
    .slice(0, 80)
    .map(([key, entry]) => [key, sanitizePublicDiagnostics(entry, depth + 1)]));
}

function pngDimensions(buffer: Buffer): { width: number; height: number } {
  const signature = '89504e470d0a1a0a';
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('Creative Factory produziu um asset que não é PNG válido.');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function normalizeFormatEntries(item: RawManifestItem): Array<{ format: CreativeFormat; path: string }> {
  const entries: Array<{ format: CreativeFormat; path: string }> = [];
  if (item.formats && !Array.isArray(item.formats) && typeof item.formats === 'object') {
    for (const [format, path] of Object.entries(item.formats)) {
      const parsed = creativeFormatSchema.safeParse(format);
      if (parsed.success && typeof path === 'string') entries.push({ format: parsed.data, path });
    }
  } else if (Array.isArray(item.formats)) {
    for (const candidate of item.formats) {
      if (!candidate || typeof candidate !== 'object') continue;
      const record = candidate as Record<string, unknown>;
      const parsed = creativeFormatSchema.safeParse(record.target);
      if (parsed.success && typeof record.path === 'string') entries.push({ format: parsed.data, path: record.path });
    }
  }
  if (entries.length === 0 && typeof item.final === 'string') entries.push({ format: 'feed', path: item.final });
  return entries;
}

async function assertInside(root: string, candidate: string): Promise<string> {
  const realRoot = await realpath(root);
  const realCandidate = await realpath(candidate);
  if (realCandidate !== realRoot && !realCandidate.startsWith(`${realRoot}${sep}`)) {
    throw new Error('Creative Factory tentou referenciar asset fora do lote confinado.');
  }
  return realCandidate;
}

function terminateTree(child: ChildProcess, signal: NodeJS.Signals): void {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(child.pid), '/T', ...(signal === 'SIGKILL' ? ['/F'] : [])], { stdio: 'ignore' });
    return;
  }
  try {
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

function defaultProcessExecutor(): ProcessExecutor {
  return ({ command, args, cwd, env, timeoutMs, killGraceMs, signal }) => new Promise((resolvePromise, reject) => {
    if (signal?.aborted) return reject(new LocalSkillRunAbortError());
    const child = spawn(command, args, {
      cwd,
      env,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    const finish = (error?: Error, preserveKillTimer = false) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (killTimer && !preserveKillTimer) clearTimeout(killTimer);
      signal?.removeEventListener('abort', onAbort);
      if (error) reject(error);
      else resolvePromise();
    };
    const stop = (error: Error) => {
      terminateTree(child, 'SIGTERM');
      killTimer = setTimeout(() => terminateTree(child, 'SIGKILL'), killGraceMs);
      killTimer.unref?.();
      finish(error, true);
    };
    const timer = setTimeout(() => stop(new Error(`Creative Factory excedeu ${Math.round(timeoutMs / 1000)} segundos.`)), timeoutMs);
    const onAbort = () => stop(new LocalSkillRunAbortError('Geração de criativos cancelada.'));
    signal?.addEventListener('abort', onAbort, { once: true });
    child.stdout?.on('data', (chunk: Buffer) => { if (stdout.length < 64_000) stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk: Buffer) => { if (stderr.length < 64_000) stderr += chunk.toString(); });
    child.once('error', (error) => finish(new Error(`Não foi possível iniciar a Creative Factory: ${error.message}`)));
    child.once('close', (code, closeSignal) => {
      if (settled) return;
      if (code === 0) finish();
      else finish(new Error(`Creative Factory falhou (${closeSignal ?? `exit ${code}`}): ${(stderr || stdout).trim().slice(-2000) || 'sem detalhes'}`));
    });
  });
}

// --------------------------------------------------------------------------- #
// Marca por projeto: DESIGN.md confirmado → brand pack temporário confinado.
// Sem DESIGN, só o próprio projeto Academia Lendária cai no pack empacotado;
// os demais falham fechado (nunca herdam a identidade de outra marca).
// --------------------------------------------------------------------------- #

const PNG_SIGNATURE = '89504e470d0a1a0a';
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Formatos do Meta — universais a qualquer marca (só a identidade muda). */
const META_FORMATS = {
  feed: { aspect: '4:5', w: 1080, h: 1350 },
  story: { aspect: '9:16', w: 1080, h: 1920 },
  square: { aspect: '1:1', w: 1080, h: 1080 },
  safe_zone: {
    story: { top_pct: 14, bottom_pct: 20 },
    feed: { top_pct: 6, bottom_pct: 6 },
    square: { top_pct: 6, bottom_pct: 6 },
  },
} as const;

// Guardas de marca reutilizáveis — já neutras (não citam nenhuma marca específica).
const BRAND_NEUTRAL_LOGO_GUARD =
  'CRITICAL: Do NOT render any brand name, wordmark, logo, signature, watermark or company ' +
  'name anywhere in the image. Leave a reserved empty safe zone so the real brand logo can be ' +
  'composited in afterwards.';
const BRAND_NEUTRAL_NEGATIVE =
  'stock-photo people, smiling business stock photos, emoji, generic rainbow gradients, ' +
  'glassmorphism, frosted glass cards, cluttered layout, low-contrast muddy text, misspelled ' +
  'text, broken letters, watermark, signature, extra fingers.';

function normalizeBrandSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const slug = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || null;
}

function hexOrFallback(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR.test(value.trim()) ? value.trim().toLowerCase() : fallback;
}

/** Detecta o DESIGN.md confirmado em context.artifacts sem confiar em ordem ou índice. */
function findDesignArtifactContent(context: Record<string, unknown> | undefined): string | null {
  const artifacts = Array.isArray(context?.artifacts) ? context!.artifacts : [];
  for (const candidate of artifacts) {
    if (!candidate || typeof candidate !== 'object') continue;
    const artifact = candidate as { artifactType?: unknown; format?: unknown; path?: unknown; content?: unknown };
    if (typeof artifact.content !== 'string' || artifact.content.trim().length === 0) continue;
    const isMarkdown = artifact.format === 'markdown' || artifact.format === undefined;
    const looksLikeDesign = artifact.artifactType === 'design'
      || (typeof artifact.path === 'string' && /(?:^|\/)DESIGN\.md$/i.test(artifact.path));
    if (isMarkdown && looksLikeDesign) return artifact.content;
  }
  return null;
}

function isAcademiaProject(input: LocalSkillRunInput, academiaProjectId: string | undefined): boolean {
  if (academiaProjectId && input.projectId === academiaProjectId) return true;
  const brief = (input.brief ?? {}) as Record<string, unknown>;
  const project = (brief.project ?? {}) as Record<string, unknown>;
  const context = (input.context ?? {}) as Record<string, unknown>;
  const markers = [context.brandId, context.brandSlug, brief.brandId, brief.slug, project.brandId, project.slug];
  return markers.some((marker) => normalizeBrandSlug(marker) === ACADEMIA_BRAND_SLUG);
}

/** Cabeçalho de prompt derivado da identidade — mantém `{aspect}` literal p/ o Python preencher. */
function buildPromptHeader(name: string, surface: string, text: string, accent: string, display: string, body: string): string {
  return [
    `Premium editorial advertising creative for the brand "${name}", {aspect} aspect ratio.`,
    `Background surface color ${surface}, primary text color ${text}. Use ${accent} as the single decisive accent color, kept restrained rather than scattered.`,
    `Typography: an elegant display face in the spirit of "${display}" for the single load-bearing emphasis word, and a clean modern body face in the spirit of "${body}" for the rest.`,
    'ASYMMETRIC editorial composition with intentional tension and generous negative space; keep ALL elements fully inside the frame with no cropped shapes at the edges.',
    'All text in Brazilian Portuguese, razor-sharp and perfectly spelled with correct accents.',
  ].join(' ');
}

/** Traduz os tokens validados do DESIGN.md num brand-pack completo (chaves que o Python lê). */
function buildBrandPack(tokens: DesignTokens, brandId: string): Record<string, unknown> {
  const colors = tokens.colors;
  const surface = hexOrFallback(colors.surface ?? colors.background ?? colors.bg, '#0b0b0d');
  const text = hexOrFallback(colors.text ?? colors.foreground, '#f4f2ee');
  const accent = hexOrFallback(colors.primary ?? colors.accent ?? colors['accent-warm'], '#c9b298');
  const ink = hexOrFallback(colors['text-strong'] ?? colors.ink ?? colors['cream-ink'], '#141414');
  const display = tokens.typography.display;
  const body = tokens.typography.body;
  return {
    id: brandId,
    name: tokens.name,
    palette: {
      bg_deep: hexOrFallback(colors['bg-deep'] ?? colors.background, surface),
      surface,
      card: hexOrFallback(colors['surface-elevated'] ?? colors.card, surface),
      text,
      text_muted: hexOrFallback(colors['text-muted'], accent),
      gold: accent,
      gold_bright: hexOrFallback(colors['accent-strong'], accent),
      gold_deep: hexOrFallback(colors['accent-deep'], accent),
      cream: text,
      cream_ink: ink,
    },
    rules: {
      // Marca arbitrária: a cobertura de "gold" é específica da Academia, então não penaliza aqui.
      gold_ideal_accent_pct: 8,
      gold_max_coverage_pct: 100,
      gold_min_coverage_pct: 0,
      min_text_height_pct: 3.0,
      min_text_contrast: 4.5,
    },
    typography: {
      display_serif: display,
      body_sans: body,
      mono: body,
      emphasis_rule: 'destaque a única palavra de carga; nunca caixa-alta forçada',
    },
    aesthetic: `Identidade ${tokens.name}: composição editorial premium, hierarquia clara e respiro generoso.`,
    prompt_header: buildPromptHeader(tokens.name, surface, text, accent, display, body),
    logo_guard: BRAND_NEUTRAL_LOGO_GUARD,
    negative: BRAND_NEUTRAL_NEGATIVE,
    // Logo é opcional: sem asset, o Python pula a preparação de logo (source_dir fica repo-relativo).
    assets: { source_dir: 'assets/brand' } as Record<string, string>,
    founder: { name: '', face_refs_dir: `.creative-factory/${brandId}/faces`, refs_for_gen: 0 },
    formats: META_FORMATS,
  };
}

/** Logo opcional embutido no frontmatter como data URI PNG — 100% confinado, sem leitura de FS. */
function decodeOptionalLogo(tokens: DesignTokens): Buffer | null {
  const raw = (tokens as Record<string, unknown>).logo;
  const source = typeof raw === 'string'
    ? raw
    : raw && typeof raw === 'object'
      ? ((raw as Record<string, unknown>).data ?? (raw as Record<string, unknown>).src)
      : undefined;
  if (typeof source !== 'string') return null;
  const match = source.match(/^data:image\/png;base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  try {
    const buffer = Buffer.from(match[1]!.replace(/\s+/g, ''), 'base64');
    if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== PNG_SIGNATURE) return null;
    return buffer;
  } catch {
    return null;
  }
}

interface ResolvedBrand {
  slug: string;
  /** Pack empacotado (fallback Academia): caminho estável e versionado no repositório. */
  bundledPackPath: string | null;
  /** Pack derivado do DESIGN.md: dict materializado no batch, nunca fora dele. */
  pack: Record<string, unknown> | null;
  logo: Buffer | null;
}

/**
 * Resolve a fonte de identidade da marca ANTES de qualquer escrita em disco:
 *   1. DESIGN.md confirmado em context.artifacts → pack temporário por batch.
 *   2. Sem DESIGN, só o próprio projeto Academia Lendária → pack empacotado.
 *   3. Qualquer outro projeto sem DESIGN → falha fechado.
 */
function resolveBrandSource(
  input: LocalSkillRunInput,
  skillRoot: string,
  academiaProjectId: string | undefined,
): ResolvedBrand {
  const designContent = findDesignArtifactContent(input.context);
  if (designContent) {
    const tokens = parseDesignTokens(designContent); // valida frontmatter (cores, fontes) ou lança
    const slug = safeSegment(tokens.name, 'marca');
    return { slug, bundledPackPath: null, pack: buildBrandPack(tokens, slug), logo: decodeOptionalLogo(tokens) };
  }
  if (isAcademiaProject(input, academiaProjectId)) {
    return {
      slug: ACADEMIA_BRAND_SLUG,
      bundledPackPath: resolve(skillRoot, `brand/${ACADEMIA_BRAND_SLUG}.yaml`),
      pack: null,
      logo: null,
    };
  }
  throw new Error(
    'A Creative Factory exige um DESIGN.md aprovado deste projeto antes de gerar criativos. ' +
    'Rode a skill design-md e aprove a identidade; o fallback de marca empacotada é exclusivo da Academia Lendária.',
  );
}

export class CreativeFactoryLocalRunner implements LocalSkillRunner {
  private readonly repoRoot: string;
  private readonly runtimeRoot: string;
  private readonly pythonPath: string;
  private readonly timeoutMs: number;
  private readonly killGraceMs: number;
  private readonly execute: ProcessExecutor;
  /** projectId autorizado a usar o pack empacotado da Academia sem DESIGN. */
  private readonly academiaProjectId: string | undefined;

  constructor(options: {
    repoRoot: string;
    runtimeRoot?: string;
    pythonPath?: string;
    timeoutMs?: number;
    killGraceMs?: number;
    execute?: ProcessExecutor;
    academiaProjectId?: string;
  }) {
    this.repoRoot = options.repoRoot;
    this.runtimeRoot = options.runtimeRoot ?? resolve(tmpdir(), `marketing-studio-creative-${sha256(options.repoRoot).slice(0, 12)}`);
    this.pythonPath = options.pythonPath ?? 'python3';
    this.timeoutMs = options.timeoutMs ?? 30 * 60 * 1000;
    this.killGraceMs = options.killGraceMs ?? 8_000;
    this.execute = options.execute ?? defaultProcessExecutor();
    this.academiaProjectId = options.academiaProjectId ?? process.env.MARKETING_STUDIO_ACADEMIA_PROJECT_ID ?? undefined;
  }

  async run(skillId: string, input: LocalSkillRunInput, options: LocalSkillRunOptions = {}): Promise<LocalSkillRunResult> {
    if (skillId !== CREATIVE_FACTORY_SKILL_ID) throw new Error(`Runner criativo não atende ${skillId}.`);
    const jobId = options.jobId;
    if (!jobId || !/^[a-f0-9-]{16,64}$/i.test(jobId)) throw new Error('Creative Factory exige jobId durável válido.');
    const batchId = options.attempt && options.attempt > 1 ? `${jobId}-a${options.attempt}` : jobId;
    const context = creativeFactoryContextSchema.parse(input.context?.creativeFactory);
    const skillRoot = resolve(this.repoRoot, '.claude/skills/ads-creative-factory');
    await assertLikenessAuthorizations(skillRoot, context);
    // Resolve a identidade ANTES de tocar o disco: fail-closed não deixa rastro de batch.
    const brand = resolveBrandSource(input, skillRoot, this.academiaProjectId);
    const instructions = await readFile(resolve(skillRoot, 'SKILL.md'), 'utf8');
    const batchRoot = resolve(this.runtimeRoot, batchId);
    const outputRoot = resolve(batchRoot, 'output');
    const assetRoot = resolve(batchRoot, 'assets');
    const campaignSlug = `batch-${safeSegment(batchId, 'creative')}`;
    const campaignPath = resolve(batchRoot, 'campaign.yaml');
    await rm(batchRoot, { recursive: true, force: true });
    await mkdir(assetRoot, { recursive: true });

    // Materializa o brand pack confinado ao batch (DESIGN) ou aponta ao pack empacotado (Academia).
    let brandPackPath: string;
    if (brand.pack) {
      const brandDir = resolve(batchRoot, 'brand');
      await mkdir(brandDir, { recursive: true });
      if (brand.logo) {
        const brandAssets = resolve(brandDir, 'assets');
        await mkdir(brandAssets, { recursive: true });
        await writeFile(resolve(brandAssets, 'logo.png'), brand.logo);
        brand.pack.assets = { source_dir: brandAssets, logo_full_src: 'logo.png', logo_icon_src: 'logo.png' };
      }
      brandPackPath = resolve(brandDir, `${brand.slug}.yaml`);
      await writeFile(brandPackPath, stringifyYaml(brand.pack), 'utf8');
    } else {
      brandPackPath = brand.bundledPackPath!;
    }

    const mechanisms = ['visual_metaphor_object', 'listicle_number', 'authority_founder', 'system_network', 'bold_question', 'comparative_split'];
    const campaign = {
      campaign: campaignSlug,
      brand_id: brand.slug,
      params: {
        primary_axis: 'archetype',
        variants_per_hook: context.variants * context.archetypes.length,
        base_format: context.formats[0],
        formats: [...new Set(context.formats)],
        archetypes: [...new Set(context.archetypes)],
        personas: context.personas.length ? context.personas : ['alan-nicolas'],
        concurrency: Math.min(3, context.archetypes.length),
        promote_anchors: false,
      },
      hooks: context.finalists.map((finalist, index) => ({
        id: safeSegment(finalist.id, `finalist-${index + 1}`),
        mechanism: mechanisms[index % mechanisms.length],
        eyebrow: 'ANÚNCIO · CURADORIA HUMANA',
        headline: finalist.hook,
        emphasis_word: finalist.hook.trim().split(/\s+/).at(-1)?.replace(/[^\p{L}\p{N}]/gu, '') ?? '',
        sub: finalist.copy.slice(0, 220),
        cta: context.cta,
        caption: finalist.copy,
        link_description: context.linkDescription ?? context.cta,
      })),
    };
    await writeFile(campaignPath, stringifyYaml(campaign), 'utf8');

    try {
      options.onStep?.({ id: 'prepare', label: 'Preparar lote criativo', status: 'done' });
      options.onStep?.({ id: 'generate', label: 'Gerar imagens com Codex', status: 'running' });
      options.onLog?.({ level: 'info', message: `Gerando lote ${batchId.slice(0, 8)} com ${context.archetypes.length} arquétipos.` });
      const env = sanitizeCodexEnv(process.env);
      env.ACF_OUT_DIR = outputRoot;
      // Path do brand pack (nunca vai ao manifesto/prompt público); o Python o carrega explicitamente.
      env.ACF_BRAND_PACK = brandPackPath;
      env.ACF_CODEX_TIMEOUT = String(Math.min(900, Math.floor(this.timeoutMs / 1000)));
      env.ACF_CODEX_RETRIES = '2';
      env.ACF_CONCURRENCY = String(Math.min(3, context.archetypes.length));
      env.CLAUDE_PROJECT_DIR = this.repoRoot;
      await this.execute({
        command: this.pythonPath,
        args: [resolve(skillRoot, 'scripts/factory.py'), campaignPath],
        cwd: skillRoot,
        env,
        timeoutMs: this.timeoutMs,
        killGraceMs: this.killGraceMs,
        signal: options.signal,
      });
      options.onStep?.({ id: 'generate', label: 'Gerar imagens com Codex', status: 'done' });
      options.onStep?.({ id: 'manifest', label: 'Validar imagens e legendas', status: 'running' });

      const rawManifestPath = resolve(outputRoot, campaignSlug, 'manifest.json');
      const raw = JSON.parse(await readFile(rawManifestPath, 'utf8')) as RawManifest;
      const items: CreativeFactoryItem[] = [];
      for (const [index, item] of (raw.hooks ?? []).entries()) {
        const id = safeSegment(String(item.id ?? `creative-${index + 1}`), `creative-${index + 1}`);
        const assets: CreativeFactoryAsset[] = [];
        for (const entry of normalizeFormatEntries(item)) {
          const source = await assertInside(resolve(outputRoot, campaignSlug), entry.path);
          const buffer = await readFile(source);
          const dimensions = pngDimensions(buffer);
          const assetId = safeSegment(`${id}-${entry.format}`, `asset-${index + 1}`);
          await copyFile(source, resolve(assetRoot, `${assetId}.png`));
          assets.push({ id: assetId, format: entry.format, ...dimensions, sha256: sha256(buffer), bytes: buffer.length });
        }
        if (assets.length === 0) continue;
        const promptSanitized = [
          `brand=${brand.slug}`,
          `archetype=${String(item.archetype ?? 'unknown')}`,
          `headline=${String(item.headline ?? '').replace(/[\r\n]+/g, ' ').slice(0, 240)}`,
          `formats=${assets.map((asset) => asset.format).join(',')}`,
        ].join('; ');
        items.push({
          id,
          status: item.status === 'OK' ? 'ready' : 'flagged',
          archetype: String(item.archetype ?? 'unknown'),
          headline: String(item.headline ?? ''),
          caption: String(item.caption ?? ''),
          linkDescription: String(item.link_description ?? ''),
          cta: String(item.cta ?? context.cta),
          promptSanitized,
          promptSha256: sha256(promptSanitized),
          gate: sanitizePublicDiagnostics(item.gate ?? {}) as Record<string, unknown>,
          review: sanitizePublicDiagnostics(item.review ?? {}) as Record<string, unknown>,
          assets,
        });
      }
      if (items.length === 0) {
        const causes = (raw.hooks ?? []).slice(0, 4).map((item) => {
          const status = String(item.status ?? 'UNKNOWN').replace(/[^A-Z0-9_-]/gi, '').slice(0, 48);
          const reason = String(item.error ?? 'sem detalhe').replace(/[\r\n]+/g, ' ').slice(0, 280);
          return `${status}: ${reason}`;
        });
        throw new Error(`Creative Factory não produziu PNG revisável${causes.length ? ` (${causes.join(' | ')})` : ''}.`);
      }
      const manifest: CreativeFactoryPublicManifest = {
        schemaVersion: '1.0.0',
        batchId,
        projectId: input.projectId,
        campaignId: context.campaignId,
        productionSkillId: context.productionSkillId,
        status: 'ready_for_review',
        createdAt: new Date().toISOString(),
        items,
      };
      const manifestContent = JSON.stringify(manifest, null, 2);
      await writeFile(resolve(batchRoot, 'manifest.json'), manifestContent, 'utf8');
      options.onStep?.({ id: 'manifest', label: 'Validar imagens e legendas', status: 'done' });
      const proposal: SkillProposal = {
        summary: `${items.length} criativos prontos para revisão humana.`,
        resultMarkdown: `# Lote criativo\n\n${items.length} peças geradas. Aprove somente os itens que passaram por sua revisão visual.`,
        artifacts: [{
          artifactType: 'creativeFactoryBatch',
          title: 'Lote da Creative Factory',
          path: `criativos/factory/${safeSegment(context.campaignId, 'campaign')}/${batchId}/manifest.json`,
          format: 'json',
          content: manifestContent,
        }],
        fields: [
          { key: 'batchId', value: batchId },
          { key: 'generatedItems', value: String(items.length) },
        ],
        questions: ['Quais peças devem entrar no pacote aprovado?'],
        warnings: items.some((item) => item.status === 'flagged') ? ['Há peças sinalizadas pelo gate visual; elas começam desmarcadas.'] : [],
      };
      return {
        skillId,
        skillHash: sha256(instructions),
        model: 'codex-cli-image-gen',
        proposal,
      };
    } catch (error) {
      await rm(batchRoot, { recursive: true, force: true });
      throw error;
    }
  }
}
