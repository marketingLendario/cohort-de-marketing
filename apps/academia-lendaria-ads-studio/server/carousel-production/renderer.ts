/**
 * Renderer local seguro para carrosséis de conteúdo-funil.
 *
 * Recebe um HTML autocontido com 1–20 elementos `[data-carousel-slide]`/`.slide`
 * e um slug de lote confinado; devolve um manifesto público (somente caminhos
 * relativos, sha256, bytes e dimensões) e os buffers correspondentes — slides
 * PNG 1080x1350, galeria `index.html` autocontida e um ZIP determinístico.
 *
 * Garantias de segurança/privacidade:
 *  - nenhum caminho absoluto no manifesto (guarda explícita);
 *  - buffers devolvidos separadamente ao caller (o renderer não persiste nada);
 *  - slug validado contra traversal/absolutos antes de qualquer trabalho;
 *  - sem rede no navegador (DNS mapeado para NOTFOUND + interceptação de rotas);
 *  - timeout e cancelamento cooperativo via AbortSignal;
 *  - limite total de bytes (30MB por padrão) verificado incrementalmente.
 *
 * O passo de captura é injetável (`options.renderer`): o default usa o Chromium
 * do Playwright já instalado; os testes injetam um renderer determinístico para
 * exercitar toda a orquestração sem navegador.
 */

import { createHash } from 'node:crypto';
import {
  assertCarouselPng,
  CAROUSEL_SLIDE_HEIGHT,
  CAROUSEL_SLIDE_WIDTH,
} from './png.js';
import { createDeterministicZip } from './zip.js';
import { buildGalleryHtml, type GallerySlide } from './gallery.js';

export const MIN_SLIDES = 1;
export const MAX_SLIDES = 20;
export const DEFAULT_TIMEOUT_MS = 120_000;
export const DEFAULT_MAX_TOTAL_BYTES = 30 * 1024 * 1024;
export const GALLERY_PATH = 'index.html';
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;

/** Erro de cancelamento; `aborted === true` para compatibilidade com o host. */
export class CarouselRenderAbortError extends Error {
  readonly aborted = true as const;
  constructor(message = 'Renderização do carrossel cancelada.') {
    super(message);
    this.name = 'CarouselRenderAbortError';
  }
}

export interface CarouselManifestSlide {
  index: number;
  path: string;
  sha256: string;
  bytes: number;
  width: number;
  height: number;
}

export interface CarouselManifestFile {
  path: string;
  sha256: string;
  bytes: number;
}

export interface CarouselPublicManifest {
  schemaVersion: '1.0.0';
  batchSlug: string;
  slideCount: number;
  /** Soma dos bytes dos PNGs dos slides (não inclui galeria/ZIP derivados). */
  totalBytes: number;
  slides: CarouselManifestSlide[];
  gallery: CarouselManifestFile;
  archive: CarouselManifestFile;
}

export interface CarouselRenderedFile {
  path: string;
  content: Buffer;
  sha256: string;
  bytes: number;
}

export interface CarouselRenderResult {
  manifest: CarouselPublicManifest;
  files: CarouselRenderedFile[];
}

export interface CarouselLogLine {
  level: 'info' | 'warn' | 'error';
  message: string;
}

/** Requisição passada ao passo de captura injetável. */
export interface SlideRenderRequest {
  html: string;
  batchSlug: string;
  minSlides: number;
  maxSlides: number;
  width: number;
  height: number;
  timeoutMs: number;
  signal?: AbortSignal;
  onLog?: (line: CarouselLogLine) => void;
}

/** Devolve um PNG por slide, na ordem do documento. */
export type SlideRenderer = (request: SlideRenderRequest) => Promise<Buffer[]>;

export interface CarouselRenderOptions {
  renderer?: SlideRenderer;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxTotalBytes?: number;
  minSlides?: number;
  maxSlides?: number;
  onStep?: (step: { id: string; label: string; status: 'running' | 'done' }) => void;
  onLog?: (line: CarouselLogLine) => void;
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new CarouselRenderAbortError();
}

function positiveInt(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Parâmetro numérico do renderer deve ser inteiro positivo.');
  }
  return value;
}

/** Valida e confina o slug do lote; a única forma de derivar nomes de arquivo. */
export function assertBatchSlug(slug: string): string {
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) {
    throw new Error(
      'Slug de lote inválido: use 1–63 caracteres [a-z0-9-] iniciando por alfanumérico, sem barra, ponto ou traversal.',
    );
  }
  return slug;
}

/** Detecta qualquer string com aparência de caminho absoluto em uma estrutura. */
export function containsAbsolutePath(value: unknown): boolean {
  if (typeof value === 'string') return value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value);
  if (Array.isArray(value)) return value.some(containsAbsolutePath);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(containsAbsolutePath);
  }
  return false;
}

/**
 * Passo de captura padrão: renderiza cada slide com o Chromium do Playwright,
 * offline, e devolve um PNG por elemento. Importado sob demanda para que a
 * orquestração (e os testes com renderer injetado) não carreguem o navegador.
 */
export const playwrightSlideRenderer: SlideRenderer = async (request) => {
  throwIfAborted(request.signal);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--no-first-run',
      '--no-default-browser-check',
      '--host-resolver-rules=MAP * ~NOTFOUND',
    ],
  });
  const onAbort = (): void => {
    browser.close().catch(() => undefined);
  };
  request.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const context = await browser.newContext({
      viewport: { width: request.width, height: request.height },
      deviceScaleFactor: 1,
      colorScheme: 'dark',
      javaScriptEnabled: false,
      serviceWorkers: 'block',
    });
    // Sem rede: só data:/blob:/about: passam; o resto é abortado.
    await context.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) {
        route.continue().catch(() => undefined);
      } else {
        route.abort().catch(() => undefined);
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(request.timeoutMs);
    await page.setContent(request.html, { waitUntil: 'load', timeout: request.timeoutMs });

    const locator = page.locator('[data-carousel-slide], .slide');
    const count = await locator.count();
    if (count < request.minSlides) {
      throw new Error(
        `Carrossel sem slides: use elementos [data-carousel-slide] ou .slide (mínimo ${request.minSlides}).`,
      );
    }
    if (count > request.maxSlides) {
      throw new Error(`Carrossel com ${count} slides excede o máximo de ${request.maxSlides}.`);
    }

    const buffers: Buffer[] = [];
    for (let i = 0; i < count; i += 1) {
      throwIfAborted(request.signal);
      const buffer = await locator.nth(i).screenshot({
        type: 'png',
        animations: 'disabled',
        timeout: request.timeoutMs,
      });
      buffers.push(buffer);
    }
    return buffers;
  } catch (error) {
    if (request.signal?.aborted) throw new CarouselRenderAbortError();
    throw error;
  } finally {
    request.signal?.removeEventListener('abort', onAbort);
    await browser.close().catch(() => undefined);
  }
};

/**
 * Orquestra a produção do lote: captura → validação de PNG → montagem de galeria
 * e ZIP determinístico → manifesto público + buffers. Nunca toca o disco.
 */
export async function renderCarouselBatch(
  input: { html: string; batchSlug: string },
  options: CarouselRenderOptions = {},
): Promise<CarouselRenderResult> {
  const batchSlug = assertBatchSlug(input.batchSlug);
  if (typeof input.html !== 'string' || input.html.trim().length === 0) {
    throw new Error('HTML do carrossel vazio.');
  }
  const minSlides = positiveInt(options.minSlides, MIN_SLIDES);
  const maxSlides = positiveInt(options.maxSlides, MAX_SLIDES);
  if (maxSlides < minSlides || maxSlides > MAX_SLIDES) {
    throw new Error(`Faixa de slides inválida (${minSlides}–${maxSlides}); máximo suportado é ${MAX_SLIDES}.`);
  }
  const timeoutMs = positiveInt(options.timeoutMs, DEFAULT_TIMEOUT_MS);
  const maxTotalBytes = positiveInt(options.maxTotalBytes, DEFAULT_MAX_TOTAL_BYTES);
  const { signal } = options;
  const renderer = options.renderer ?? playwrightSlideRenderer;

  throwIfAborted(signal);
  options.onStep?.({ id: 'render', label: 'Renderizar slides', status: 'running' });
  options.onLog?.({ level: 'info', message: `Renderizando lote "${batchSlug}".` });
  const buffers = await renderer({
    html: input.html,
    batchSlug,
    minSlides,
    maxSlides,
    width: CAROUSEL_SLIDE_WIDTH,
    height: CAROUSEL_SLIDE_HEIGHT,
    timeoutMs,
    signal,
    onLog: options.onLog,
  });
  throwIfAborted(signal);

  if (!Array.isArray(buffers)) throw new Error('O renderer de slides não devolveu buffers.');
  if (buffers.length < minSlides || buffers.length > maxSlides) {
    throw new Error(
      `Carrossel deve ter entre ${minSlides} e ${maxSlides} slides; recebido ${buffers.length}.`,
    );
  }
  options.onStep?.({ id: 'render', label: 'Renderizar slides', status: 'done' });

  options.onStep?.({ id: 'validate', label: 'Validar PNGs', status: 'running' });
  const padWidth = Math.max(2, String(buffers.length).length);
  const slideFiles: CarouselRenderedFile[] = [];
  const manifestSlides: CarouselManifestSlide[] = [];
  const gallerySlides: GallerySlide[] = [];
  let totalBytes = 0;
  for (let i = 0; i < buffers.length; i += 1) {
    throwIfAborted(signal);
    const png = buffers[i]!;
    if (!Buffer.isBuffer(png)) throw new Error(`Slide ${i + 1} não é um Buffer PNG.`);
    const dimensions = assertCarouselPng(png);
    totalBytes += png.length;
    if (totalBytes > maxTotalBytes) {
      throw new Error(`Lote de carrossel excede o limite total de ${maxTotalBytes} bytes.`);
    }
    const index = i + 1;
    const path = `slides/slide-${String(index).padStart(padWidth, '0')}.png`;
    const digest = sha256(png);
    slideFiles.push({ path, content: png, sha256: digest, bytes: png.length });
    manifestSlides.push({ index, path, sha256: digest, bytes: png.length, ...dimensions });
    gallerySlides.push({ index, path, png, width: dimensions.width, height: dimensions.height });
  }
  options.onStep?.({ id: 'validate', label: 'Validar PNGs', status: 'done' });

  options.onStep?.({ id: 'package', label: 'Empacotar galeria e ZIP', status: 'running' });
  // O ZIP contém apenas os slides (subpasta `slides/` preservada). A galeria o
  // embute como data-URI para o botão "baixar tudo" — por isso o ZIP não pode
  // conter a própria galeria (evita dependência circular).
  const archivePath = `${batchSlug}.zip`;
  const archiveContent = createDeterministicZip(
    slideFiles.map((file) => ({ path: file.path, content: file.content })),
  );
  const galleryContent = Buffer.from(
    buildGalleryHtml({
      batchSlug,
      slides: gallerySlides,
      archive: { path: archivePath, content: archiveContent },
    }),
    'utf8',
  );
  options.onStep?.({ id: 'package', label: 'Empacotar galeria e ZIP', status: 'done' });

  const galleryFile: CarouselRenderedFile = {
    path: GALLERY_PATH,
    content: galleryContent,
    sha256: sha256(galleryContent),
    bytes: galleryContent.length,
  };
  const archiveFile: CarouselRenderedFile = {
    path: archivePath,
    content: archiveContent,
    sha256: sha256(archiveContent),
    bytes: archiveContent.length,
  };

  const manifest: CarouselPublicManifest = {
    schemaVersion: '1.0.0',
    batchSlug,
    slideCount: slideFiles.length,
    totalBytes,
    slides: manifestSlides,
    gallery: { path: galleryFile.path, sha256: galleryFile.sha256, bytes: galleryFile.bytes },
    archive: { path: archiveFile.path, sha256: archiveFile.sha256, bytes: archiveFile.bytes },
  };
  if (containsAbsolutePath(manifest)) {
    throw new Error('Manifesto de carrossel contém caminho absoluto e foi recusado.');
  }

  return { manifest, files: [...slideFiles, galleryFile, archiveFile] };
}
