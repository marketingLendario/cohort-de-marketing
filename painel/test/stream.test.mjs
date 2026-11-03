import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLinha } from '../lib/stream.mjs';

const l = (o) => JSON.stringify(o);

test('init devolve sessionId', () => {
  assert.deepEqual(parseLinha(l({ type: 'system', subtype: 'init', session_id: 's1' })),
    [{ tipo: 'init', sessionId: 's1' }]);
});

test('assistant com texto e ferramenta gera dois eventos', () => {
  const evs = parseLinha(l({ type: 'assistant', message: { content: [
    { type: 'text', text: 'ola' },
    { type: 'tool_use', name: 'Write', input: { file_path: 'a.md' } },
  ] } }));
  assert.deepEqual(evs, [
    { tipo: 'texto', texto: 'ola' },
    { tipo: 'ferramenta', nome: 'Write', entrada: { file_path: 'a.md' } },
  ]);
});

test('AskUserQuestion vira pergunta', () => {
  const perguntas = [{ question: 'Qual?', options: [{ label: 'A' }] }];
  const evs = parseLinha(l({ type: 'assistant', message: { content: [
    { type: 'tool_use', name: 'AskUserQuestion', input: { questions: perguntas } },
  ] } }));
  assert.deepEqual(evs, [{ tipo: 'pergunta', perguntas }]);
});

test('result de sucesso e de erro', () => {
  const ok = parseLinha(l({ type: 'result', subtype: 'success', is_error: false,
    result: 'feito', session_id: 's1', total_cost_usd: 0.09 }));
  assert.deepEqual(ok, [{ tipo: 'resultado', ok: true, texto: 'feito', sessionId: 's1',
    custoUsd: 0.09, negacoes: [] }]);
  const erro = parseLinha(l({ type: 'result', subtype: 'error_during_execution',
    is_error: true, result: 'quebrou', session_id: 's1' }));
  assert.equal(erro[0].ok, false);
  assert.equal(erro[0].custoUsd, null);
});

test('ignora hooks, rate limit, lixo e linhas vazias', () => {
  assert.deepEqual(parseLinha(l({ type: 'system', subtype: 'hook_started' })), []);
  assert.deepEqual(parseLinha(l({ type: 'rate_limit_event' })), []);
  assert.deepEqual(parseLinha('nao e json'), []);
  assert.deepEqual(parseLinha(''), []);
});
