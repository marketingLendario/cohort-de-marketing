import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../web/markdown.js';

test('escapa HTML em qualquer posição', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n# <img onerror=x>');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;script&gt;/);
});

test('títulos, listas, ênfase e código', () => {
  const html = renderMarkdown('# Título\n\n- um\n- **dois**\n\ntexto com `cod` e *ênfase*');
  assert.match(html, /<h1>Título<\/h1>/);
  assert.match(html, /<ul><li>um<\/li><li><strong>dois<\/strong><\/li><\/ul>/);
  assert.match(html, /<code>cod<\/code>/);
  assert.match(html, /<em>ênfase<\/em>/);
});

test('bloco de código preserva e escapa o conteúdo', () => {
  const html = renderMarkdown('```\n<b>x</b>\n```');
  assert.match(html, /<pre><code>&lt;b&gt;x&lt;\/b&gt;<\/code><\/pre>/);
});

test('só links http(s) viram âncora', () => {
  assert.match(renderMarkdown('[ok](https://a.com/x)'), /<a href="https:\/\/a.com\/x" target="_blank" rel="noopener noreferrer">ok<\/a>/);
  assert.ok(!renderMarkdown('[mau](javascript:alert(1))').includes('<a '));
});

test('não entra em loop com linhas estranhas', () => {
  assert.doesNotThrow(() => renderMarkdown('#\n#hashtag\n- \n```\nsem fechar'));
});

test('conteúdo de code span não é reprocessado (globs em spans separados)', () => {
  const html = renderMarkdown('`*.md` e `*.js`');
  assert.match(html, /<p><code>\*\.md<\/code> e <code>\*\.js<\/code><\/p>/);
  assert.ok(!html.includes('<em>'));
});

test('link em markdown dentro de code span fica literal', () => {
  const html = renderMarkdown('`[x](https://a.com)`');
  assert.ok(!html.includes('<a '));
  assert.match(html, /<code>\[x\]\(https:\/\/a\.com\)<\/code>/);
});

test('asteriscos na URL não injetam em/strong no href', () => {
  const html = renderMarkdown('[v](https://a.com/*b*/x)');
  assert.match(html, /<a href="https:\/\/a\.com\/\*b\*\/x" [^>]*>v<\/a>/);
  assert.ok(!html.includes('<em>'));
});

test('negrito e itálico fora de code continuam funcionando', () => {
  const html = renderMarkdown('**forte** e *ênfase* com `*x*`');
  assert.match(html, /<strong>forte<\/strong> e <em>ênfase<\/em> com <code>\*x\*<\/code>/);
});
