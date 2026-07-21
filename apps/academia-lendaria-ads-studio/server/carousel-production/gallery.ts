/**
 * Gera a galeria `index.html` autocontida do lote de carrossel.
 *
 * "Autocontida" significa: nenhuma referência de rede (sem CDN, sem fontes
 * externas), todos os slides embutidos como data-URI base64 e um botão de
 * download por slide (mais um para o ZIP, também embutido). Abre offline em
 * qualquer navegador. É puramente derivada dos bytes de entrada — sem relógio,
 * sem aleatoriedade — logo, determinística.
 */

export interface GallerySlide {
  index: number;
  /** Caminho relativo (ex.: `slides/slide-01.png`), usado como nome de download. */
  path: string;
  png: Buffer;
  width: number;
  height: number;
}

export interface GalleryInput {
  batchSlug: string;
  slides: GallerySlide[];
  archive: {
    /** Caminho relativo do ZIP (ex.: `lote.zip`). */
    path: string;
    content: Buffer;
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function dataUri(mime: string, content: Buffer): string {
  return `data:${mime};base64,${content.toString('base64')}`;
}

/** Nome de arquivo sugerido no atributo `download`, sem diretórios. */
function downloadName(path: string): string {
  return path.split('/').pop() ?? path;
}

const STYLE = [
  '*{box-sizing:border-box}',
  'body{margin:0;background:#0f0f0f;color:#f5f5f4;font-family:Arial,Helvetica,sans-serif}',
  '.wrap{max-width:1160px;margin:0 auto;padding:32px 20px}',
  'h1{font-size:20px;margin:0 0 4px}',
  'p.lead{margin:0 0 24px;color:#a3a3a3;font-size:14px}',
  '.bar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:24px}',
  '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}',
  'figure{margin:0;background:#1c1c1c;border:1px solid #2e2e2e;border-radius:10px;overflow:hidden}',
  'img{display:block;width:100%;height:auto;background:#000}',
  'figcaption{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 14px}',
  '.meta{font-size:12px;color:#a3a3a3}',
  'a.btn{display:inline-block;padding:8px 14px;border-radius:8px;background:#f5f5f4;color:#0f0f0f;',
  'text-decoration:none;font-size:13px;font-weight:600}',
  'a.btn.ghost{background:transparent;color:#f5f5f4;border:1px solid #3f3f3f}',
  '@media(max-width:520px){.grid{grid-template-columns:1fr}}',
].join('');

/** Monta o HTML completo da galeria como string determinística. */
export function buildGalleryHtml(input: GalleryInput): string {
  const title = escapeHtml(input.batchSlug);
  const archiveName = escapeHtml(downloadName(input.archive.path));
  const archiveHref = dataUri('application/zip', input.archive.content);

  const cards = input.slides
    .map((slide) => {
      const name = escapeHtml(downloadName(slide.path));
      const href = dataUri('image/png', slide.png);
      const label = String(slide.index).padStart(2, '0');
      return [
        '<figure>',
        `<img src="${href}" alt="Slide ${label}" width="${slide.width}" height="${slide.height}">`,
        '<figcaption>',
        `<span class="meta">Slide ${label} · ${slide.width}×${slide.height}</span>`,
        `<a class="btn" download="${name}" href="${href}">Baixar</a>`,
        '</figcaption>',
        '</figure>',
      ].join('');
    })
    .join('');

  return [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>Carrossel · ${title}</title>`,
    `<style>${STYLE}</style>`,
    '</head>',
    '<body>',
    '<main class="wrap">',
    `<h1>Carrossel · ${title}</h1>`,
    `<p class="lead">${input.slides.length} slide(s) 1080×1350 · galeria offline autocontida</p>`,
    '<div class="bar">',
    `<a class="btn" download="${archiveName}" href="${archiveHref}">Baixar tudo (ZIP)</a>`,
    '<span class="meta">Cada card tem seu próprio botão de download.</span>',
    '</div>',
    `<div class="grid">${cards}</div>`,
    '</main>',
    '</body>',
    '</html>',
  ].join('');
}
