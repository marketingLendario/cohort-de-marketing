/**
 * Renderer local seguro para carrosséis de conteúdo-funil.
 *
 * Ponto de entrada público do módulo: veja `renderer.ts` para a orquestração e
 * as garantias de segurança/privacidade.
 */

export {
  renderCarouselBatch,
  playwrightSlideRenderer,
  assertBatchSlug,
  containsAbsolutePath,
  CarouselRenderAbortError,
  MIN_SLIDES,
  MAX_SLIDES,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_TOTAL_BYTES,
  GALLERY_PATH,
  type CarouselRenderOptions,
  type CarouselRenderResult,
  type CarouselRenderedFile,
  type CarouselPublicManifest,
  type CarouselManifestSlide,
  type CarouselManifestFile,
  type CarouselLogLine,
  type SlideRenderer,
  type SlideRenderRequest,
} from './renderer.js';

export {
  PNG_SIGNATURE,
  CAROUSEL_SLIDE_WIDTH,
  CAROUSEL_SLIDE_HEIGHT,
  readPngDimensions,
  assertCarouselPng,
  type PngDimensions,
} from './png.js';

export {
  createDeterministicZip,
  readDeterministicZip,
  crc32,
  type DeterministicZipEntry,
} from './zip.js';

export { buildGalleryHtml, type GalleryInput, type GallerySlide } from './gallery.js';
