import { describe, expect, it } from 'vitest';
import {
  assertSemanticDocument,
  COLLECTION_INDEX_V1,
  LEAD_PAGE_V1,
  MESSAGE_COPY_V1,
  OWNER_DOCUMENT_V1,
  QUIZ_APP_V1,
  SemanticValidationError,
  SEMANTIC_VALIDATION_PROFILES,
  validateSemanticDocument,
  VIDEO_SCRIPT_V1,
} from './semantic-validators.js';

function documentHtml(body: string, head = ''): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head><body>${body}</body></html>`;
}

describe('document-pack v2 semantic validators', () => {
  it('exports the six stable validation profiles', () => {
    expect(Object.keys(SEMANTIC_VALIDATION_PROFILES)).toEqual([
      OWNER_DOCUMENT_V1.id,
      LEAD_PAGE_V1.id,
      VIDEO_SCRIPT_V1.id,
      QUIZ_APP_V1.id,
      MESSAGE_COPY_V1.id,
      COLLECTION_INDEX_V1.id,
    ]);
  });

  it('accepts an owner document with embedded resources and Book navigation', () => {
    const html = documentHtml('<main><h1>Plano do funil</h1><p>Conteúdo final.</p><a href="../index.html">Voltar ao Book</a></main>', '<style>body{font-family:sans-serif}</style>');
    expect(validateSemanticDocument(OWNER_DOCUMENT_V1.id, html)).toEqual([]);
    expect(() => assertSemanticDocument(OWNER_DOCUMENT_V1.id, html)).not.toThrow();
  });

  it('returns structured owner-document findings and exposes them on assertion errors', () => {
    const findings = validateSemanticDocument(OWNER_DOCUMENT_V1.id, '<html><head><link rel="stylesheet" href="brand.css"></head><body><h2>Sem estrutura</h2></body></html>');
    expect(findings.map(({ code }) => code)).toEqual([
      'self-contained.stylesheet',
      'page.main',
      'page.h1',
      'owner.book-navigation',
    ]);
    try {
      assertSemanticDocument(OWNER_DOCUMENT_V1.id, '<p>Inválido</p>');
      throw new Error('assert deveria reprovar');
    } catch (error) {
      expect(error).toBeInstanceOf(SemanticValidationError);
      expect((error as SemanticValidationError).findings.every((item) => item.profileId === OWNER_DOCUMENT_V1.id)).toBe(true);
    }
  });

  it('accepts a self-contained lead page with CTA and usable form', () => {
    const html = documentHtml('<main><h1>Receba o plano</h1><form action="/lead" method="post"><label>E-mail <input name="email" type="email"></label><button type="submit" data-cta>Quero participar</button></form></main>');
    expect(validateSemanticDocument(LEAD_PAGE_V1.id, html)).toEqual([]);
  });

  it('rejects an incomplete lead page and visible review jargon', () => {
    const html = '<html><head><script src="app.js"></script></head><body><p>[PENDENTE: revisar] versão preliminar</p><button>Talvez</button></body></html>';
    expect(validateSemanticDocument(LEAD_PAGE_V1.id, html).map(({ code }) => code)).toEqual([
      'self-contained.script',
      'lead.doctype',
      'lead.viewport',
      'lead.cta',
      'lead.form',
      'lead.review-jargon',
    ]);
  });

  it('accepts an accessible video script with navigation to its page', () => {
    const html = documentHtml('<main><h1>Roteiro da aula</h1><article data-video-script><h2>Abertura</h2><p>Apresente o problema e a promessa.</p></article><a href="vsl.html">Voltar para a página do vídeo</a></main>');
    expect(validateSemanticDocument(VIDEO_SCRIPT_V1.id, html)).toEqual([]);
  });

  it('rejects a video script without semantic script content or page navigation', () => {
    expect(validateSemanticDocument(VIDEO_SCRIPT_V1.id, documentHtml('<main><h1>Vídeo</h1><div>Notas soltas</div></main>')).map(({ code }) => code)).toEqual([
      'video.script',
      'video.page-navigation',
    ]);
  });

  it('accepts a self-contained quiz with inputs, result and local persistence', () => {
    const html = documentHtml(`<main><h1>Diagnóstico</h1><form id="quiz"><fieldset><legend>Seu momento</legend><label><input type="radio" name="fase" value="inicio"> Início</label></fieldset><button type="submit">Ver resultado</button></form><output id="resultado" aria-live="polite"></output></main><script>const saved=localStorage.getItem('quiz');document.querySelector('#quiz').addEventListener('submit',()=>localStorage.setItem('quiz','inicio'));</script>`);
    expect(validateSemanticDocument(QUIZ_APP_V1.id, html)).toEqual([]);
  });

  it('rejects an externalized quiz without inputs, result or persistence', () => {
    const findings = validateSemanticDocument(QUIZ_APP_V1.id, documentHtml('<form><button type="button">Avançar</button></form><script src="quiz.js"></script>'));
    expect(findings.map(({ code }) => code)).toEqual([
      'self-contained.script',
      'quiz.input',
      'quiz.submit',
      'quiz.result',
      'quiz.persistence',
    ]);
  });

  it('accepts a message with text and a functional copy button', () => {
    const html = documentHtml(`<main><h1>Mensagem 1</h1><p id="mensagem" data-copy-text>Olá, posso enviar os detalhes?</p><button type="button" data-copy-target="#mensagem">Copiar mensagem</button></main><script>document.querySelector('button').addEventListener('click',()=>navigator.clipboard.writeText(document.querySelector('#mensagem').textContent));</script>`);
    expect(validateSemanticDocument(MESSAGE_COPY_V1.id, html)).toEqual([]);
  });

  it('rejects a message without copyable text and copy behavior', () => {
    const findings = validateSemanticDocument(MESSAGE_COPY_V1.id, documentHtml('<button type="button">Copiar</button><p>Texto fora do contrato</p>'));
    expect(findings.map(({ code }) => code)).toEqual(['message.text', 'message.copy-handler']);
  });

  it('accepts a collection index with relative HTML links and rendered copy', () => {
    const html = documentHtml('<main><h1>Trilhas de e-mail</h1><nav aria-label="Itens"><a href="trilha-1-email-1.html">Boas-vindas</a><a href="v2/trilha-2-email-1.html?preview=1">Nutrição</a></nav></main>');
    expect(validateSemanticDocument(COLLECTION_INDEX_V1.id, html)).toEqual([]);
  });

  it('rejects external or root links and Markdown leaked into the Book', () => {
    const html = documentHtml(`<main><h1>Mensagens</h1><p>**Rascunho** [abrir](mensagem.md)</p><a href="https://example.com/mensagem.html">Externo</a><a href="/mensagem.html">Raiz</a></main>`);
    expect(validateSemanticDocument(COLLECTION_INDEX_V1.id, html).map(({ code }) => code)).toEqual([
      'collection.relative-links',
      'collection.markdown',
    ]);
    expect(() => assertSemanticDocument(COLLECTION_INDEX_V1.id, html)).toThrow(/collection\.relative-links.*collection\.markdown/);
  });
});
