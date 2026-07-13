/**
 * index.test.js — read-only boundary of the Meta Ads wrapper.
 *
 * The wrapper exposes only named read-only operations (--help, --list-spokes,
 * --check --spoke=<slug>). Anything else must fail closed with exit 2 and never
 * reach the meta CLI. These tests inject a fake spawn to prove zero invocations.
 *
 * Plan: 004 — enforce read-only Meta adapter boundary
 */

'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { parseArgs, run, scrubSecrets } = require('./index');

const EXIT_USAGE = 2;

/** Collects writes so tests never touch the real stdout/stderr. */
function sink() {
  const chunks = [];
  return {
    write(text) {
      chunks.push(text);
      return true;
    },
    text() {
      return chunks.join('');
    },
  };
}

/** Fake spawn that records every call and never launches a process. */
function spySpawn(result = { status: 0, stdout: '', stderr: '' }) {
  const calls = [];
  const fn = (bin, args, options) => {
    calls.push({ bin, args, options });
    return result;
  };
  fn.calls = calls;
  return fn;
}

/** Fake resolver with placeholder values — no real .env file is ever read. */
function fakeResolver(spoke) {
  return {
    spoke,
    source: `/tmp/.env.${spoke}`,
    env: { ACCESS_TOKEN: 'FAKE_TOKEN_0000000000000000', AD_ACCOUNT_ID: 'act_000' },
    missing: [],
  };
}

function runIsolated(argv, { spawn, resolve = fakeResolver } = {}) {
  const stdout = sink();
  const stderr = sink();
  const spawnFn = spawn || spySpawn();
  const code = run(argv, { spawn: spawnFn, resolve, stdout, stderr });
  return { code, stdout: stdout.text(), stderr: stderr.text(), spawn: spawnFn };
}

test('accepts help', () => {
  for (const argv of [['--help'], ['-h']]) {
    const parsed = parseArgs(argv);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.command, 'help');
  }
});

test('accepts --list-spokes', () => {
  const parsed = parseArgs(['--list-spokes']);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.command, 'list-spokes');
});

test('accepts --check with a spoke in both flag forms', () => {
  for (const argv of [
    ['--check', '--spoke=natalia-tanaka'],
    ['--spoke', 'natalia-tanaka', '--check'],
  ]) {
    const parsed = parseArgs(argv);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.command, 'check');
    assert.equal(parsed.spoke, 'natalia-tanaka');
  }
});

test('rejects --check without a spoke', () => {
  const parsed = parseArgs(['--check']);
  assert.equal(parsed.ok, false);
  assert.match(parsed.error, /--spoke/);
});

test('rejects operational arguments that used to be passed through', () => {
  const forbidden = [
    ['--spoke=natalia-tanaka', 'ads', 'campaign', 'list'],
    ['--spoke=natalia-tanaka', 'ads', 'adset', 'list'],
    ['--spoke=natalia-tanaka', 'ads', 'campaign', 'update', '--status', 'PAUSED'],
    ['--spoke=natalia-tanaka', 'ads', 'insights', 'get', '--date-preset', 'last_7d'],
    ['ads', 'campaign', 'list'],
    ['--unknown-flag'],
  ];

  for (const argv of forbidden) {
    const parsed = parseArgs(argv);
    assert.equal(parsed.ok, false, `expected rejection for: ${argv.join(' ')}`);

    const { code, spawn } = runIsolated(argv);
    assert.equal(code, EXIT_USAGE, `expected exit 2 for: ${argv.join(' ')}`);
    assert.equal(spawn.calls.length, 0, `expected zero spawn for: ${argv.join(' ')}`);
  }
});

test('rejects ambiguous combinations', () => {
  const ambiguous = [
    ['--list-spokes', '--check', '--spoke=natalia-tanaka'],
    ['--list-spokes', '--spoke=natalia-tanaka'],
    ['--help', '--check', '--spoke=natalia-tanaka'],
    ['--check', '--spoke=natalia-tanaka', 'auth', 'status'],
    ['--spoke=natalia-tanaka'],
    ['--check', '--spoke=natalia-tanaka', '--spoke=aiox'],
    ['--check', '--spoke='],
    ['--check', '--spoke', '--list-spokes'],
    [],
  ];

  for (const argv of ambiguous) {
    const parsed = parseArgs(argv);
    assert.equal(parsed.ok, false, `expected rejection for: ${argv.join(' ') || '<empty>'}`);

    const { code, spawn } = runIsolated(argv);
    assert.equal(code, EXIT_USAGE, `expected exit 2 for: ${argv.join(' ') || '<empty>'}`);
    assert.equal(spawn.calls.length, 0, `expected zero spawn for: ${argv.join(' ') || '<empty>'}`);
  }
});

test('rejects malformed spoke slugs before any spawn', () => {
  for (const argv of [
    ['--check', '--spoke=../../etc/passwd'],
    ['--check', '--spoke=Natalia Tanaka'],
    ['--check', '--spoke=natalia;rm'],
  ]) {
    const parsed = parseArgs(argv);
    assert.equal(parsed.ok, false, `expected rejection for: ${argv.join(' ')}`);

    const { code, spawn } = runIsolated(argv);
    assert.equal(code, EXIT_USAGE);
    assert.equal(spawn.calls.length, 0);
  }
});

test('unknown spoke fails closed before spawn', () => {
  const { code, spawn } = runIsolated(['--check', '--spoke=spoke-inexistente'], {
    resolve: (spoke) => {
      const err = new Error(`Unknown spoke '${spoke}'.`);
      err.code = 'UNKNOWN_SPOKE';
      throw err;
    },
  });

  assert.equal(code, EXIT_USAGE);
  assert.equal(spawn.calls.length, 0);
});

test('help exits 0 without spawning and never advertises pass-through', () => {
  const { code, stdout, spawn } = runIsolated(['--help']);

  assert.equal(code, 0);
  assert.equal(spawn.calls.length, 0);
  assert.doesNotMatch(stdout, /pass-?through/i);
  assert.doesNotMatch(stdout, /meta-cli args|meta-ads-cli args/i);
  assert.match(stdout, /--list-spokes/);
  assert.match(stdout, /--check --spoke=/);
});

test('check spawns only the read-only "meta auth status" command', () => {
  const spawn = spySpawn({ status: 0, stdout: 'Authenticated\n', stderr: '' });
  const { code } = runIsolated(['--check', '--spoke=natalia-tanaka'], { spawn });

  assert.equal(code, 0);
  assert.equal(spawn.calls.length, 1);
  assert.equal(spawn.calls[0].bin, 'meta');
  assert.deepEqual(spawn.calls[0].args, ['auth', 'status']);
});

test('check fails closed when required vars are missing, without spawning', () => {
  const { code, spawn } = runIsolated(['--check', '--spoke=natalia-tanaka'], {
    resolve: (spoke) => ({
      spoke,
      source: `/tmp/.env.${spoke}`,
      env: {},
      missing: ['NATALIA_TANAKA_META_ACCESS_TOKEN'],
    }),
  });

  assert.equal(code, EXIT_USAGE);
  assert.equal(spawn.calls.length, 0);
});

test('scrubs full and shortened token echoes', () => {
  const token = 'EAAVHyhr' + 'x'.repeat(190) + 'ZDZD';
  const output = scrubSecrets(`full=${token}\nshort=EAAVHyhr...ZDZD`, { ACCESS_TOKEN: token });

  assert.equal(output, 'full=[REDACTED]\nshort=[REDACTED]');
  assert.doesNotMatch(output, /EAAVHyhr|ZDZD/);
});

test('check output is scrubbed before reaching the terminal', () => {
  const token = 'FAKE_TOKEN_0000000000000000';
  const spawn = spySpawn({ status: 0, stdout: `Authenticated (token: ${token})\n`, stderr: '' });
  const { code, stdout } = runIsolated(['--check', '--spoke=natalia-tanaka'], { spawn });

  assert.equal(code, 0);
  assert.doesNotMatch(stdout, /FAKE_TOKEN_0000000000000000/);
  assert.match(stdout, /\[REDACTED\]/);
});
