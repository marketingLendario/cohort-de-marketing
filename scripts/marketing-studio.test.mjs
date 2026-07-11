import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  aggregateReadiness,
  codexCliEnvironment,
  isOwnedCommand,
  loadRepoEnvironment,
  parseCli,
  redact,
  runtimePaths,
  windowsTaskkillArgs,
} from './marketing-studio.mjs';

test('parseCli exposes one-command defaults and custom isolated ports', () => {
  assert.deepEqual(parseCli([]), {
    command: 'start',
    webPort: 5177,
    bffPort: 3002,
    openBrowser: true,
    install: true,
  });
  assert.deepEqual(parseCli(['check', '--web-port', '5188', '--bff-port', '3308', '--no-browser', '--no-install']), {
    command: 'check',
    webPort: 5188,
    bffPort: 3308,
    openBrowser: false,
    install: false,
  });
  assert.throws(() => parseCli(['start', '--web-port', '3002', '--bff-port', '3002']), /diferentes/);
});

test('aggregateReadiness blocks only required blockers and preserves degradation', () => {
  assert.equal(aggregateReadiness([
    { status: 'ready', required: true },
    { status: 'degraded', required: false },
  ]), 'degraded');
  assert.equal(aggregateReadiness([
    { status: 'blocked', required: false },
    { status: 'ready', required: true },
  ]), 'blocked');
  assert.equal(aggregateReadiness([{ status: 'blocked', required: true }]), 'blocked');
});

test('redact removes API/JWT/database secret shapes from recovery output', () => {
  const value = redact('sk-abcdefghijklmnopqrstuvwxyz sb_secret_abcdefghijklmnopqrstuvwxyz eyJabcdefghijklmnopqrstuvwxyz.pqrstuvwxyz.xyzxyzxyz postgresql://user:pass@localhost/db');
  assert.equal(value.includes('sk-'), false);
  assert.equal(value.includes('sb_secret_'), false);
  assert.equal(value.includes('eyJ'), false);
  assert.equal(value.includes('user:pass'), false);
});

test('shutdown ownership requires both the repo root and an expected process marker', () => {
  const root = '/tmp/cohort-marketing';
  assert.equal(isOwnedCommand(`node ${root}/apps/studio/node_modules/vite/bin/vite.js`, root), true);
  assert.equal(isOwnedCommand('node /tmp/other/node_modules/vite/bin/vite.js', root), false);
  assert.equal(isOwnedCommand(`node ${root}-other/apps/studio/node_modules/vite/bin/vite.js`, root), false);
  assert.equal(isOwnedCommand(`node ${root}/scripts/unrelated.mjs`, root), false);
});

test('runtime paths are stable per checkout and do not live inside the repo', () => {
  assert.deepEqual(runtimePaths('/tmp/a'), runtimePaths('/tmp/a'));
  assert.notDeepEqual(runtimePaths('/tmp/a'), runtimePaths('/tmp/b'));
  assert.equal(runtimePaths('/tmp/a').state.startsWith('/tmp/a'), false);
});

test('Codex preflight never inherits API keys and preserves session paths', () => {
  const env = codexCliEnvironment({ PATH: '/bin', HOME: '/tmp/home', OPENAI_API_KEY: 'forbidden', CODEX_API_KEY: 'forbidden' });
  assert.deepEqual(env, { PATH: '/bin', HOME: '/tmp/home' });
});

test('loads optional launcher ports from the repository .env', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'marketing-studio-env-'));
  const previousWeb = process.env.MARKETING_STUDIO_WEB_PORT;
  const previousBff = process.env.MARKETING_STUDIO_BFF_PORT;
  delete process.env.MARKETING_STUDIO_WEB_PORT;
  delete process.env.MARKETING_STUDIO_BFF_PORT;
  try {
    await writeFile(resolve(directory, '.env'), 'MARKETING_STUDIO_WEB_PORT=5199\nMARKETING_STUDIO_BFF_PORT=3399\n');
    loadRepoEnvironment(directory);
    assert.deepEqual(parseCli(['start', '--no-browser']), {
      command: 'start',
      webPort: 5199,
      bffPort: 3399,
      openBrowser: false,
      install: true,
    });
  } finally {
    if (previousWeb === undefined) delete process.env.MARKETING_STUDIO_WEB_PORT;
    else process.env.MARKETING_STUDIO_WEB_PORT = previousWeb;
    if (previousBff === undefined) delete process.env.MARKETING_STUDIO_BFF_PORT;
    else process.env.MARKETING_STUDIO_BFF_PORT = previousBff;
    await rm(directory, { recursive: true, force: true });
  }
});

test('Windows shutdown targets the complete process tree', () => {
  assert.deepEqual(windowsTaskkillArgs(123), ['/PID', '123', '/T']);
  assert.deepEqual(windowsTaskkillArgs(123, true), ['/PID', '123', '/T', '/F']);
});
