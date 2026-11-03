import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarToken, tokenValido, hostPermitido } from '../lib/auth.mjs';

test('token tem 48 hex e é aleatório', () => {
  const a = criarToken();
  assert.match(a, /^[0-9a-f]{48}$/);
  assert.notEqual(a, criarToken());
});

test('tokenValido compara com segurança', () => {
  const t = criarToken();
  assert.equal(tokenValido(t, t), true);
  assert.equal(tokenValido(t, t.slice(1)), false);
  assert.equal(tokenValido(t, 'x'.repeat(48)), false);
  assert.equal(tokenValido(t, undefined), false);
  assert.equal(tokenValido(t, null), false);
});

test('hostPermitido só aceita loopback com a porta certa', () => {
  assert.equal(hostPermitido('127.0.0.1:4747', 4747), true);
  assert.equal(hostPermitido('localhost:4747', 4747), true);
  assert.equal(hostPermitido('evil.com', 4747), false);
  assert.equal(hostPermitido('127.0.0.1:9999', 4747), false);
  assert.equal(hostPermitido(undefined, 4747), false);
});
