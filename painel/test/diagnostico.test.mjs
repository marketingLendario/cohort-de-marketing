import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnosticar } from '../lib/diagnostico.mjs';

const exec = (respostas) => (bin, args, opts, cb) => {
  const r = respostas[args[0]];
  if (r instanceof Error) cb(r); else cb(null, r);
};

test('claude ausente gera problema com comando de instalação', async () => {
  const d = await diagnosticar({ execFileFn: exec({ '--version': new Error('ENOENT') }) });
  assert.equal(d.claudeInstalado, false);
  assert.equal(d.problemas[0].codigo, 'claude_ausente');
  assert.match(d.problemas[0].comando, /npm install -g @anthropic-ai\/claude-code/);
});

test('instalado e logado não tem problemas e não vaza e-mail', async () => {
  const d = await diagnosticar({ execFileFn: exec({
    '--version': '2.1.185 (Claude Code)\n',
    auth: JSON.stringify({ loggedIn: true, email: 'a@b.com' }),
  }) });
  assert.equal(d.claudeInstalado, true);
  assert.equal(d.versao, '2.1.185 (Claude Code)');
  assert.equal(d.logado, true);
  assert.deepEqual(d.problemas, []);
  assert.ok(!JSON.stringify(d).includes('a@b.com'));
});

test('sem login gera problema sem_login', async () => {
  const d = await diagnosticar({ execFileFn: exec({
    '--version': '2.1.185\n',
    auth: JSON.stringify({ loggedIn: false }),
  }) });
  assert.equal(d.logado, false);
  assert.equal(d.problemas[0].codigo, 'sem_login');
});

test('auth status ilegível deixa logado null sem derrubar', async () => {
  const d = await diagnosticar({ execFileFn: exec({
    '--version': '2.1.185\n',
    auth: new Error('comando desconhecido'),
  }) });
  assert.equal(d.logado, null);
  assert.deepEqual(d.problemas, []);
});
