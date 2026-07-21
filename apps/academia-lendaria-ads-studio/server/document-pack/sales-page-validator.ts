export const SALES_PAGE_SECTIONS = [
  'hero',
  'vsl',
  'primary-cta',
  'mechanism',
  'offer',
  'pricing',
  'proof',
  'benefits',
  'bonuses',
  'guarantee',
  'urgency',
  'faq',
  'checkout',
  'final-cta',
  'footer',
] as const;

const REQUIRED_EVENTS = ['PageView', 'ViewContent', 'Lead', 'chegou_na_oferta'] as const;
const FORBIDDEN_VISIBLE_JARGON = ['Big Idea', 'mecanismo único', 'ancoragem', 'stack de valor', 'prova social', 'escassez', 'OTO', 'upsell'] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function visibleText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function attributeValues(html: string, attribute: string): string[] {
  const values: string[] = [];
  const pattern = new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, 'gi');
  for (const match of html.matchAll(pattern)) values.push(match[1]);
  return values;
}

export function validateSalesPageHtml(html: string): void {
  const errors: string[] = [];
  if (!/data-page-contract\s*=\s*["']sales-page-v1["']/i.test(html)) {
    errors.push('marcador data-page-contract="sales-page-v1" ausente');
  }
  const sections = attributeValues(html, 'data-section');
  const required = [...SALES_PAGE_SECTIONS];
  const observed = sections.filter((section) => required.includes(section as (typeof SALES_PAGE_SECTIONS)[number]));
  if (JSON.stringify(observed) !== JSON.stringify(required)) {
    errors.push(`seções obrigatórias fora da ordem canônica (${required.join(' > ')})`);
  }
  if (/<a\b[^>]*href\s*=\s*["']#["']/i.test(html)) errors.push('CTA com href="#"');
  if (!/<form\b[^>]*action\s*=\s*["'][^"']+["']/i.test(html)) errors.push('formulário sem action');
  for (const field of ['name', 'email', 'phone']) {
    if (!new RegExp(`<input\\b[^>]*name\\s*=\\s*["']${field}["']`, 'i').test(html)) errors.push(`campo ${field} ausente`);
  }
  for (const event of REQUIRED_EVENTS) if (!html.includes(event)) errors.push(`evento ${event} ausente`);
  if (!html.includes('[PLUG: SEU_PIXEL_ID]') || !html.includes('[PLUG: GTM-XXXXXXX]')) {
    errors.push('snippets comentados de Pixel/GTM ausentes');
  }
  if (!/Ver roteiro do v[ií]deo/i.test(visibleText(html))) errors.push('link para o roteiro do vídeo ausente');
  const text = visibleText(html).toLocaleLowerCase('pt-BR');
  for (const jargon of FORBIDDEN_VISIBLE_JARGON) {
    const normalized = jargon.toLocaleLowerCase('pt-BR');
    const word = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(normalized)}($|[^\\p{L}\\p{N}])`, 'u');
    if (word.test(text)) errors.push(`jargão interno visível: ${jargon}`);
  }
  if (/<link\b[^>]*rel\s*=\s*["']stylesheet["']/i.test(html)) errors.push('stylesheet externo não permitido');
  const localAssets = attributeValues(html, '(?:src|href)').filter((value) =>
    /^(?!#|data:|https?:|mailto:|tel:|javascript:)[^\s]+\.(?:css|js|png|jpe?g|webp|svg|woff2?|ttf)(?:[?#].*)?$/i.test(value));
  if (localAssets.length > 0) errors.push(`assets locais não incorporados: ${localAssets.join(', ')}`);
  if (errors.length > 0) throw new Error(`Página de vendas reprovada: ${errors.join('; ')}.`);
}
