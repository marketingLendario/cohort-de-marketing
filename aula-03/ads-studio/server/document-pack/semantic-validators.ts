import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

interface DomElement {
  textContent: string | null;
  getAttribute(name: string): string | null;
  querySelector(selector: string): DomElement | null;
  querySelectorAll(selector: string): ArrayLike<DomElement>;
}

interface DomDocument extends DomElement {
  body: DomElement;
  doctype: { name: string } | null;
}

interface JsdomInstance {
  window: { document: DomDocument };
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

  const copyText = document.querySelector('[data-copy-text], pre, blockquote, textarea, [data-message]');
  const copyValue = copyText ? (copyText.getAttribute('value') ?? copyText.textContent ?? '').trim() : '';
  if (!copyValue) findings.push(finding('message.text', 'texto copiável ausente ou vazio', '[data-copy-text], pre, blockquote, textarea, [data-message]'));

  const scripts = all(document, 'script:not([src])').map((script) => script.textContent ?? '').join('\n');
  const inlineHandler = copyButton?.getAttribute('onclick') ?? '';
  if (copyButton && !/(?:clipboard\.writeText|execCommand\s*\(\s*['"]copy|select\s*\()/.test(`${scripts}\n${inlineHandler}`)) {
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

function collectionIndexValidator(document: DomDocument, html: string): FindingInput[] {
  const findings = semanticPageFindings(document);
  const links = all(document, 'a[href]');
  if (links.length === 0) {
    findings.push(finding('collection.links', 'índice sem links para os itens da coleção', 'a[href]'));
  } else {
    const invalidLinks = links.map((link) => link.getAttribute('href') ?? '').filter((href) => !isRelativeDocumentLink(href));
    if (invalidLinks.length > 0) {
      findings.push(finding('collection.relative-links', `links não relativos ou não HTML: ${invalidLinks.join(', ')}`, 'a[href]'));
    }
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

  return PROFILE_VALIDATORS[profileId](document, html).map((item) => ({
    profileId,
    severity: 'error' as const,
    ...item,
  }));
}

export function assertSemanticDocument(profileId: SemanticValidationProfileId, html: string): void {
  const findings = validateSemanticDocument(profileId, html);
  if (findings.length > 0) throw new SemanticValidationError(profileId, findings);
}
