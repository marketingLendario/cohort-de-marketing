import { SALES_PAGE_SECTIONS } from './sales-page-validator.js';

export function validSalesPageFixture(overrides: { extraHead?: string; sectionOrder?: readonly string[] } = {}): string {
  const sections = (overrides.sectionOrder ?? SALES_PAGE_SECTIONS).map((section) => {
    if (section === 'vsl') return '<section data-section="vsl"><div>Apresentação</div><a href="roteiro-vsl.html">Ver roteiro do vídeo</a></section>';
    if (section === 'primary-cta') return '<section data-section="primary-cta"><a href="#checkout">Começar</a></section>';
    if (section === 'checkout') return '<section id="checkout" data-section="checkout"><form action="https://example.test/checkout"><input name="name"><input name="email"><input name="phone"><button>Enviar</button></form></section>';
    if (section === 'final-cta') return '<section data-section="final-cta"><a href="#checkout">Começar agora</a></section>';
    return `<section data-section="${section}"><h2>${section}</h2><p>Conteúdo verificável.</p></section>`;
  }).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">${overrides.extraHead ?? ''}<!-- Meta Pixel [PLUG: SEU_PIXEL_ID] | GTM [PLUG: GTM-XXXXXXX] --></head><body><main data-page-contract="sales-page-v1">${sections}</main><script>const events=['PageView','ViewContent','Lead','chegou_na_oferta'];window.dataLayer=events;</script></body></html>`;
}
