import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

interface DomElement {
  textContent: string | null;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  appendChild(child: DomElement): DomElement;
  querySelector(selector: string): DomElement | null;
  querySelectorAll(selector: string): ArrayLike<DomElement>;
}

interface DomDocument extends DomElement {
  body: DomElement;
  doctype: { name: string } | null;
  createElement(tagName: string): DomElement;
}

interface JsdomInstance {
  window: {
    document: DomDocument;
    getComputedStyle(element: DomElement): { width: string; height: string };
  };
  serialize(): string;
}

type JsdomConstructor = new (html: string) => JsdomInstance;
const { JSDOM } = require('jsdom') as { JSDOM: JsdomConstructor };

export const OWNER_DOCUMENT_V1 = {
  id: 'owner-document-v1',
  description: 'Documento principal autocontido, semântico e navegável pelo Book.',
} as const;

export const LEAD_PAGE_V1 = {
  id: 'lead-page-v1',
  description: 'Página de captação autocontida com CTA e formulário utilizável.',
} as const;

export const VIDEO_SCRIPT_V1 = {
  id: 'video-script-v1',
  description: 'Roteiro de vídeo em uma página semântica e navegável.',
} as const;

export const QUIZ_APP_V1 = {
  id: 'quiz-app-v1',
  description: 'Quiz autocontido com entrada, resultado e persistência local.',
} as const;

export const MESSAGE_COPY_V1 = {
  id: 'message-copy-v1',
  description: 'Mensagem legível com uma ação funcional de cópia.',
} as const;

export const COLLECTION_INDEX_V1 = {
  id: 'collection-index-v1',
  description: 'Índice HTML do Book com links relativos e sem Markdown exposto.',
} as const;

export const SEMANTIC_VALIDATION_PROFILES = {
  [OWNER_DOCUMENT_V1.id]: OWNER_DOCUMENT_V1,
  [LEAD_PAGE_V1.id]: LEAD_PAGE_V1,
  [VIDEO_SCRIPT_V1.id]: VIDEO_SCRIPT_V1,
  [QUIZ_APP_V1.id]: QUIZ_APP_V1,
  [MESSAGE_COPY_V1.id]: MESSAGE_COPY_V1,
  [COLLECTION_INDEX_V1.id]: COLLECTION_INDEX_V1,
} as const;

export type SemanticValidationProfileId = keyof typeof SEMANTIC_VALIDATION_PROFILES;

export interface SemanticValidationFinding {
  profileId: SemanticValidationProfileId;
  code: string;
  severity: 'error';
  message: string;
  selector?: string;
}

export class SemanticValidationError extends Error {
  readonly findings: readonly SemanticValidationFinding[];

  constructor(profileId: SemanticValidationProfileId, findings: readonly SemanticValidationFinding[]) {
    super(`Validação semântica ${profileId} reprovada: ${findings.map((finding) => `[${finding.code}] ${finding.message}`).join('; ')}`);
    this.name = 'SemanticValidationError';
    this.findings = findings;
  }
}

type FindingInput = Omit<SemanticValidationFinding, 'profileId' | 'severity'>;
type ProfileValidator = (document: DomDocument, html: string) => FindingInput[];

function all(root: DomElement, selector: string): DomElement[] {
  return Array.from(root.querySelectorAll(selector));
}

function finding(code: string, message: string, selector?: string): FindingInput {
  return selector ? { code, message, selector } : { code, message };
}

function accessibleName(element: DomElement): string {
  return [element.getAttribute('aria-label'), element.getAttribute('title'), element.getAttribute('value'), element.textContent]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function visibleText(html: string, preserveLines = false): string {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
  return preserveLines ? text.replace(/[ \t]+/g, ' ') : text.replace(/\s+/g, ' ').trim();
}

function isEmbeddedUrl(value: string): boolean {
  return /^(?:data:|blob:|about:blank|#)/i.test(value.trim());
}

function selfContainedFindings(document: DomDocument, html: string): FindingInput[] {
  const findings: FindingInput[] = [];
  const externalStyles = all(document, 'link[rel~="stylesheet"][href]');
  if (externalStyles.length > 0) {
    findings.push(finding('self-contained.stylesheet', 'stylesheet externo ou local não incorporado', 'link[rel~="stylesheet"]'));
  }

  const externalScripts = all(document, 'script[src]');
  if (externalScripts.length > 0) {
    findings.push(finding('self-contained.script', 'script externo ou local não incorporado', 'script[src]'));
  }

  const assetSelectors = ['img[src]', 'source[src]', 'video[src]', 'audio[src]', 'iframe[src]'];
  const looseAssets = assetSelectors.flatMap((selector) => all(document, selector))
    .map((element) => element.getAttribute('src') ?? '')
    .filter((source) => source.length > 0 && !isEmbeddedUrl(source));
  if (looseAssets.length > 0) {
    findings.push(finding('self-contained.asset', `assets não incorporados: ${looseAssets.join(', ')}`, assetSelectors.join(', ')));
  }

  const cssUrls = [...html.matchAll(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi)]
    .map((match) => match[2])
    .filter((source) => !isEmbeddedUrl(source));
  if (cssUrls.length > 0) {
    findings.push(finding('self-contained.css-url', `recursos CSS não incorporados: ${cssUrls.join(', ')}`));
  }
  return findings;
}

function activeContentFindings(document: DomDocument): FindingInput[] {
  const findings: FindingInput[] = [];
  if (document.querySelector('meta[http-equiv="refresh" i]')) {
    findings.push(finding('security.meta-refresh', 'redirecionamento automático não permitido', 'meta[http-equiv="refresh"]'));
  }
  if (document.querySelector('iframe, object, embed')) {
    findings.push(finding('security.embedded-context', 'iframe, object ou embed não permitido', 'iframe, object, embed'));
  }
  const scripts = all(document, 'script:not([src])').map((script) => script.textContent ?? '').join('\n');
  const dangerousScript = /(?:\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(|\bEventSource\s*\(|\bsendBeacon\s*\(|\bwindow\.open\s*\(|\b(?:window|document)\.location\b|\blocation\.(?:href|assign|replace)\b|\beval\s*\(|\bnew\s+Function\s*\(|\bimport\s*\()/;
  if (dangerousScript.test(scripts)) {
    findings.push(finding('security.active-script', 'script inline contém rede, navegação dinâmica ou avaliação de código não permitida', 'script:not([src])'));
  }
  return findings;
}

export function assertSafeHtmlActiveContent(html: string): void {
  let document: DomDocument;
  try {
    document = new JSDOM(html).window.document;
  } catch {
    throw new Error('HTML não pôde ser interpretado para validação de segurança.');
  }
  const findings = activeContentFindings(document);
  if (findings.length > 0) {
    throw new Error(`HTML reprovado pelo gate de conteúdo ativo: ${findings.map((item) => `[${item.code}] ${item.message}`).join('; ')}`);
  }
}

export function assertCarouselHtmlDimensions(html: string, width = 1080, height = 1350): void {
  let dom: JsdomInstance;
  try {
    dom = new JSDOM(html);
  } catch {
    throw new Error('HTML do carrossel não pôde ser interpretado para validar dimensões.');
  }
  const slides = all(dom.window.document, '[data-carousel-slide], .slide');
  if (slides.length === 0 || slides.length > 20) {
    throw new Error(`Carrossel deve conter de 1 a 20 slides; recebido ${slides.length}.`);
  }
  for (const [index, slide] of slides.entries()) {
    const style = dom.window.getComputedStyle(slide);
    if (style.width !== `${width}px` || style.height !== `${height}px`) {
      throw new Error(
        `Slide ${index + 1} do carrossel usa ${style.width || 'largura indefinida'} x ${style.height || 'altura indefinida'}; esperado ${width}px x ${height}px no CSS computado.`,
      );
    }
  }
}

function semanticPageFindings(document: DomDocument): FindingInput[] {
  const findings: FindingInput[] = [];
  if (!document.querySelector('main')) findings.push(finding('page.main', 'elemento <main> ausente', 'main'));
  if (!document.querySelector('h1')) findings.push(finding('page.h1', 'título principal <h1> ausente', 'h1'));
  return findings;
}

function ownerDocumentValidator(document: DomDocument, html: string): FindingInput[] {
  const findings = [...selfContainedFindings(document, html), ...semanticPageFindings(document)];
  const bookNavigation = all(document, 'a[href], button').some((element) => {
    const href = element.getAttribute('href') ?? '';
    const action = element.getAttribute('data-action') ?? '';
    const onclick = element.getAttribute('onclick') ?? '';
    const name = accessibleName(element);
    return (/book|livro do funil|voltar|retornar/i.test(name) && /(?:^|\/)index\.html(?:[?#].*)?$/i.test(href))
      || (/voltar|retornar/i.test(name) && (/back/i.test(action) || /history\.back/i.test(onclick)));
  });
  if (!bookNavigation) {
    findings.push(finding('owner.book-navigation', 'navegação acessível de volta ao Book ausente', 'a[href], button'));
  }
  return findings;
}

const REVIEW_JARGON = [
  /\b(?:todo|lorem ipsum|rascunho|revis[aã]o interna|uso interno|vers[aã]o preliminar)\b/i,
  /\[(?:pendente|placeholder|revisar|inserir)[^\]]*\]/i,
];

function leadPageValidator(document: DomDocument, html: string): FindingInput[] {
  const findings = selfContainedFindings(document, html);
  if (document.doctype?.name.toLocaleLowerCase() !== 'html') {
    findings.push(finding('lead.doctype', 'doctype HTML ausente', '<!doctype html>'));
  }
  if (!document.querySelector('meta[name="viewport"][content]')) {
    findings.push(finding('lead.viewport', 'meta viewport ausente', 'meta[name="viewport"]'));
  }

  const cta = all(document, 'a[href], button, input[type="submit"]')
    .some((element) => element.getAttribute('data-cta') !== null
      || /\b(?:quero|come[cç]ar|inscrever|garantir|comprar|participar|enviar|cadastrar)\b/i.test(accessibleName(element)));
  if (!cta) findings.push(finding('lead.cta', 'CTA identificável e acessível ausente', 'a[href], button, input[type="submit"]'));

  const forms = all(document, 'form');
  const usableForm = forms.some((form) => form.querySelector('input, select, textarea') !== null
    && form.querySelector('button[type="submit"], input[type="submit"]') !== null);
  if (!usableForm) findings.push(finding('lead.form', 'formulário com campo e ação de envio ausente', 'form'));

  const text = visibleText(html);
  if (REVIEW_JARGON.some((pattern) => pattern.test(text))) {
    findings.push(finding('lead.review-jargon', 'jargão ou marcador de revisão visível ao público'));
  }
  return findings;
}

function videoScriptValidator(document: DomDocument): FindingInput[] {
  const findings = semanticPageFindings(document);
  const scriptContainer = document.querySelector('article, [data-video-script], [data-script], [aria-label*="roteiro" i]');
  if (!scriptContainer || !(scriptContainer.textContent ?? '').trim()) {
    findings.push(finding('video.script', 'roteiro legível em região semântica ausente', 'article, [data-video-script], [data-script]'));
  }

  const pageNavigation = all(document, 'a[href], button').some((element) => {
    const href = element.getAttribute('href') ?? '';
    return /\b(?:p[aá]gina|voltar|retornar|assistir|v[ií]deo)\b/i.test(accessibleName(element))
      && (/\.html(?:[?#].*)?$/i.test(href) || /history\.back/i.test(element.getAttribute('onclick') ?? ''));
  });
  if (!pageNavigation) {
    findings.push(finding('video.page-navigation', 'navegação acessível entre o roteiro e sua página ausente', 'a[href], button'));
  }
  return findings;
}

function quizAppValidator(document: DomDocument, html: string): FindingInput[] {
  const findings = selfContainedFindings(document, html);
  const form = document.querySelector('form');
  if (!form) {
    findings.push(finding('quiz.form', 'formulário do quiz ausente', 'form'));
  } else {
    if (!form.querySelector('input, select, textarea')) findings.push(finding('quiz.input', 'entrada do quiz ausente', 'form input, form select, form textarea'));
    if (!form.querySelector('button[type="submit"], input[type="submit"]')) findings.push(finding('quiz.submit', 'ação de conclusão do quiz ausente', 'form button[type="submit"]'));
  }
  if (!document.querySelector('output, [role="status"], [aria-live], #resultado, #result, [data-quiz-result]')) {
    findings.push(finding('quiz.result', 'região acessível de resultado ausente', 'output, [role="status"], [aria-live]'));
  }
  const scripts = all(document, 'script:not([src])').map((script) => script.textContent ?? '').join('\n');
  if (!/\b(?:localStorage|sessionStorage)\.(?:getItem|setItem)\s*\(/.test(scripts)) {
    findings.push(finding('quiz.persistence', 'persistência local do progresso ou resultado ausente', 'script'));
  }
  return findings;
}

function messageCopyValidator(document: DomDocument): FindingInput[] {
  const findings: FindingInput[] = [];
  const buttons = all(document, 'button, [role="button"]');
  const copyButton = buttons.find((element) => /copiar|copy/i.test(accessibleName(element))
    || element.getAttribute('data-copy-target') !== null
    || element.getAttribute('data-action') === 'copy');
  if (!copyButton) findings.push(finding('message.copy-button', 'botão de copiar acessível ausente', 'button, [role="button"]'));

  const scripts = all(document, 'script:not([src])').map((script) => script.textContent ?? '').join('\n');
  const inlineHandler = copyButton?.getAttribute('onclick') ?? '';
  const behavior = `${scripts}\n${inlineHandler}`;
  const explicitTarget = copyButton?.getAttribute('data-copy-target')
    ?? copyButton?.getAttribute('aria-controls');
  const scriptedTarget = behavior.match(/getElementById\s*\(\s*['"]([^'"]+)['"]\s*\)/)?.[1]
    ?? behavior.match(/querySelector\s*\(\s*['"]#([^'"]+)['"]\s*\)/)?.[1];
  const referencedCopyText = explicitTarget
    ? document.querySelector(explicitTarget.startsWith('#') ? explicitTarget : `#${explicitTarget}`)
    : scriptedTarget
      ? document.querySelector(`#${scriptedTarget}`)
      : null;
  const copyText = referencedCopyText
    ?? document.querySelector('[data-copy-text], pre, blockquote, textarea, [data-message]');
  const copyValue = copyText ? (copyText.getAttribute('value') ?? copyText.textContent ?? '').trim() : '';
  if (!copyValue) findings.push(finding('message.text', 'texto copiável ausente ou vazio', '[data-copy-text], pre, blockquote, textarea, [data-message]'));

  if (copyButton && !/(?:clipboard\.writeText|execCommand\s*\(\s*['"]copy|select\s*\()/.test(behavior)) {
    findings.push(finding('message.copy-handler', 'ação do botão não implementa cópia do texto', 'script, [onclick]'));
  }
  return findings;
}

function isRelativeDocumentLink(href: string): boolean {
  const value = href.trim();
  return value.length > 0
    && !/^(?:[a-z][a-z\d+.-]*:|\/\/|\/|#)/i.test(value)
    && /\.html?(?:[?#].*)?$/i.test(value);
}

function isSameDocumentAnchor(href: string): boolean {
  return /^#[^\s#]+$/.test(href.trim());
}

export function normalizeCollectionIndexLinks(
  html: string,
  indexPath: string,
  availableHtmlPaths: readonly string[],
): { html: string; changed: boolean } {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const indexDirectory = indexPath.includes('/') ? indexPath.slice(0, indexPath.lastIndexOf('/')) : '';
  const available = new Set(availableHtmlPaths.filter((path) => path !== indexPath));
  let changed = false;

  const resolveRelativePath = (href: string) => {
    const cleanHref = href.split(/[?#]/, 1)[0] ?? '';
    const segments = `${indexDirectory}/${cleanHref}`.split('/');
    const normalized: string[] = [];
    for (const segment of segments) {
      if (!segment || segment === '.') continue;
      if (segment === '..') normalized.pop();
      else normalized.push(segment);
    }
    return normalized.join('/');
  };
  const relativePath = (target: string) => {
    const from = indexDirectory.split('/').filter(Boolean);
    const to = target.split('/').filter(Boolean);
    while (from[0] && from[0] === to[0]) {
      from.shift();
      to.shift();
    }
    return `${'../'.repeat(from.length)}${to.join('/')}` || './';
  };

  for (const link of all(document, 'a[href]')) {
    const href = link.getAttribute('href') ?? '';
    if (isSameDocumentAnchor(href) || isRelativeDocumentLink(href)) continue;

    const htmlCandidate = href.replace(/\.md(?:[?#].*)?$/i, '.html');
    if (htmlCandidate !== href && available.has(resolveRelativePath(htmlCandidate))) {
      link.setAttribute('href', htmlCandidate);
    } else {
      link.removeAttribute('href');
    }
    changed = true;
  }

  const hasCollectionLink = all(document, 'a[href]')
    .some((link) => available.has(resolveRelativePath(link.getAttribute('href') ?? '')));
  if (!hasCollectionLink && available.size > 0) {
    const navigation = document.createElement('nav');
    navigation.setAttribute('aria-label', 'Itens da coleção');
    const list = document.createElement('ul');
    for (const target of [...available].sort()) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.setAttribute('href', relativePath(target));
      link.textContent = target.split('/').at(-1)?.replace(/\.html?$/i, '').replaceAll('-', ' ') || target;
      item.appendChild(link);
      list.appendChild(item);
    }
    navigation.appendChild(list);
    (document.querySelector('main') ?? document.body).appendChild(navigation);
    changed = true;
  }

  return { html: changed ? dom.serialize() : html, changed };
}

function collectionIndexValidator(document: DomDocument, html: string): FindingInput[] {
  const findings = semanticPageFindings(document);
  const links = all(document, 'a[href]');
  const hrefs = links.map((link) => link.getAttribute('href') ?? '');
  if (!hrefs.some(isRelativeDocumentLink)) {
    findings.push(finding('collection.links', 'índice sem links para os itens da coleção', 'a[href]'));
  }
  const invalidLinks = hrefs.filter((href) => !isRelativeDocumentLink(href) && !isSameDocumentAnchor(href));
  if (invalidLinks.length > 0) {
    findings.push(finding('collection.relative-links', `links não relativos ou não HTML: ${invalidLinks.join(', ')}`, 'a[href]'));
  }

  const text = visibleText(html, true);
  const markdownPatterns = [/(?:^|\n)\s{0,3}#{1,6}\s+\S/m, /\[[^\]]+\]\([^)]+\)/, /```/, /\*\*[^*]+\*\*/];
  if (markdownPatterns.some((pattern) => pattern.test(text))) {
    findings.push(finding('collection.markdown', 'sintaxe Markdown visível no índice do Book'));
  }
  return findings;
}

const PROFILE_VALIDATORS: Record<SemanticValidationProfileId, ProfileValidator> = {
  'owner-document-v1': ownerDocumentValidator,
  'lead-page-v1': leadPageValidator,
  'video-script-v1': videoScriptValidator,
  'quiz-app-v1': quizAppValidator,
  'message-copy-v1': messageCopyValidator,
  'collection-index-v1': collectionIndexValidator,
};

export function validateSemanticDocument(
  profileId: SemanticValidationProfileId,
  html: string,
): SemanticValidationFinding[] {
  let document: DomDocument;
  try {
    document = new JSDOM(html).window.document;
  } catch {
    return [{
      profileId,
      code: 'html.parse',
      severity: 'error',
      message: 'HTML não pôde ser interpretado',
    }];
  }

  return [...activeContentFindings(document), ...PROFILE_VALIDATORS[profileId](document, html)].map((item) => ({
    profileId,
    severity: 'error' as const,
    ...item,
  }));
}

export function assertSemanticDocument(profileId: SemanticValidationProfileId, html: string): void {
  const findings = validateSemanticDocument(profileId, html);
  if (findings.length > 0) throw new SemanticValidationError(profileId, findings);
}
