#!/usr/bin/env node
/**
 * services/meta-ads/index.js — Meta Ads CLI multi-spoke wrapper (read-only).
 *
 * Usage:
 *   node services/meta-ads/index.js --list-spokes
 *   node services/meta-ads/index.js --check --spoke=<slug>
 *
 * Examples:
 *   node services/meta-ads/index.js --list-spokes
 *   node services/meta-ads/index.js --check --spoke=natalia-tanaka
 *
 * Only the named operations above are exposed. Arbitrary meta CLI commands are
 * never forwarded: the sole process this wrapper ever spawns is
 * `meta auth status`. Read-only insights collection lives in insights-runner.js.
 *
 * Story: STORY-152.2
 */

'use strict';

const { spawnSync } = require('node:child_process');
const {
  resolveSpoke,
  listAvailableSpokes,
  maskSecret,
  SUPPORTED_SPOKES,
} = require('./spoke-resolver');

const META_BIN = 'meta';
const AUTH_STATUS_ARGS = ['auth', 'status'];
const DEFAULT_TIMEOUT_MS = 30_000;
const EXIT_USAGE = 2;

/** Slug shape accepted before any resolution; resolveSpoke owns the allowlist. */
const SPOKE_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function timeoutMs() {
  const parsed = Number.parseInt(process.env.META_ADS_TIMEOUT_MS || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function usageText() {
  return [
    'Usage:',
    '  node services/meta-ads/index.js --list-spokes',
    '  node services/meta-ads/index.js --check --spoke=<slug>',
    '',
    `Supported spokes: ${SUPPORTED_SPOKES.join(', ')}`,
    '',
    'Operations:',
    '  --list-spokes                   List spokes with .env.{slug} present',
    '  --check --spoke=<slug>          Validate token + scopes (runs `meta auth status`)',
    '  -h, --help                      Show this help',
    '',
    'This adapter is read-only: it exposes no other meta CLI command.',
    'For insights snapshots use: node services/meta-ads/insights-runner.js --spoke=<slug>',
    '',
  ].join('\n');
}

function fail(error) {
  return { ok: false, error };
}

/**
 * Parse argv into one named read-only operation. Pure: no I/O, no spawn.
 *
 * @returns {{ok: true, command: 'help'|'list-spokes'|'check', spoke: string|null}
 *          | {ok: false, error: string}}
 */
function parseArgs(argv) {
  let command = null;
  let spoke = null;

  const setCommand = (next) => {
    if (command !== null && command !== next) {
      return fail(`Conflicting operations: '${command}' and '${next}'. Run one operation at a time.`);
    }
    command = next;
    return null;
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    let conflict = null;

    if (a === '-h' || a === '--help') {
      conflict = setCommand('help');
    } else if (a === '--list-spokes') {
      conflict = setCommand('list-spokes');
    } else if (a === '--check') {
      conflict = setCommand('check');
    } else if (a === '--spoke' || a.startsWith('--spoke=')) {
      if (spoke !== null) {
        return fail('--spoke was given more than once.');
      }
      const value = a === '--spoke' ? argv[++i] : a.slice('--spoke='.length);
      if (!value || value.startsWith('-')) {
        return fail('--spoke requires a slug, e.g. --spoke=natalia-tanaka');
      }
      if (!SPOKE_PATTERN.test(value)) {
        return fail(`Invalid spoke slug '${value}'. Expected lowercase letters, digits and dashes.`);
      }
      spoke = value;
    } else {
      return fail(
        `Unknown argument '${a}'. This adapter only accepts --list-spokes, --check --spoke=<slug> and --help. ` +
          'Arbitrary meta CLI commands are not available.'
      );
    }

    if (conflict) return conflict;
  }

  if (command === null) {
    return fail(
      spoke
        ? `No operation given for spoke '${spoke}'. Use --check --spoke=${spoke}.`
        : 'No operation given.'
    );
  }
  if (command === 'check' && !spoke) {
    return fail('--check requires --spoke=<slug>');
  }
  if (command !== 'check' && spoke) {
    return fail(`--spoke is only valid with --check, not with --${command}.`);
  }

  return { ok: true, command, spoke };
}

function cmdListSpokes(stdout) {
  const available = listAvailableSpokes();
  stdout.write('Available spokes (with .env.{slug} present):\n');
  for (const s of SUPPORTED_SPOKES) {
    const present = available.includes(s);
    stdout.write(`  ${present ? '✓' : '·'} ${s}${present ? '' : '  (no env file)'}\n`);
  }
  stdout.write(`\nTotal ready: ${available.length}/${SUPPORTED_SPOKES.length}\n`);
  return 0;
}

function cmdCheck(spoke, { spawn, resolve, stdout, stderr }) {
  let resolved;
  try {
    resolved = resolve(spoke);
  } catch (e) {
    stderr.write(`Error: ${e.message}\n`);
    return EXIT_USAGE;
  }

  stdout.write(`Spoke: ${resolved.spoke}\n`);
  stdout.write(`Source: ${resolved.source}\n`);
  stdout.write(`\nResolved CLI env (masked):\n`);
  for (const [k, v] of Object.entries(resolved.env)) {
    stdout.write(`  ${k}=${maskSecret(v)}\n`);
  }

  if (resolved.missing.length > 0) {
    stderr.write(`\nMISSING required vars: ${resolved.missing.join(', ')}\n`);
    return EXIT_USAGE;
  }

  stdout.write(`\nInvoking 'meta auth status' for live validation...\n`);
  const result = spawn(META_BIN, AUTH_STATUS_ARGS, {
    env: { ...process.env, ...resolved.env },
    stdio: 'pipe',
    encoding: 'utf8',
    timeout: timeoutMs(),
  });

  if (result.error) {
    stderr.write(`\nFailed to invoke '${META_BIN}': ${result.error.message}\n`);
    stderr.write(`Is the meta-ads CLI installed? Run: pip install meta-ads\n`);
    return EXIT_USAGE;
  }

  const out = scrubSecrets(result.stdout || '', resolved.env);
  const err = scrubSecrets(result.stderr || '', resolved.env);
  if (out) stdout.write(out);
  if (err) stderr.write(err);

  if (result.status !== 0) {
    stderr.write(`\nmeta auth status exited with code ${result.status}\n`);
    return result.status || 1;
  }

  stdout.write(`\nOK — spoke '${spoke}' is ready.\n`);
  return 0;
}

/**
 * Belt-and-suspenders: even if the CLI accidentally echoed the token, we redact
 * before forwarding output. This is a defense-in-depth for STORY-152.2 AC4.
 */
function scrubSecrets(text, env) {
  if (!text) return text;
  let scrubbed = text;
  for (const v of Object.values(env)) {
    if (v && typeof v === 'string' && v.length >= 16) {
      const re = new RegExp(escapeRegex(v), 'g');
      scrubbed = scrubbed.replace(re, '[REDACTED]');

      // `meta auth status` can echo a shortened token rather than the full
      // value. Remove the common prefix/suffix form too, so logs never expose
      // a useful token fragment.
      const prefix = v.slice(0, 8);
      const suffix = v.slice(-4);
      const partial = new RegExp(
        `${escapeRegex(prefix)}[^\\s\\r\\n]{0,64}${escapeRegex(suffix)}`,
        'g',
      );
      scrubbed = scrubbed.replace(partial, '[REDACTED]');
      scrubbed = scrubbed.replace(new RegExp(escapeRegex(prefix), 'g'), '[REDACTED]');
      scrubbed = scrubbed.replace(new RegExp(escapeRegex(suffix), 'g'), '[REDACTED]');
    }
  }
  return scrubbed;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Execute one parsed operation and return the process exit code.
 * `spawn` and `resolve` are injectable so tests can prove that rejected input
 * never reaches the meta CLI, without touching real credentials.
 */
function run(argv, deps = {}) {
  const {
    spawn = spawnSync,
    resolve = resolveSpoke,
    stdout = process.stdout,
    stderr = process.stderr,
  } = deps;

  const parsed = parseArgs(argv);
  if (!parsed.ok) {
    stderr.write(`Error: ${parsed.error}\n`);
    stdout.write(usageText());
    return EXIT_USAGE;
  }

  if (parsed.command === 'help') {
    stdout.write(usageText());
    return 0;
  }
  if (parsed.command === 'list-spokes') {
    return cmdListSpokes(stdout);
  }
  return cmdCheck(parsed.spoke, { spawn, resolve, stdout, stderr });
}

if (require.main === module) {
  process.exitCode = run(process.argv.slice(2));
}

module.exports = { parseArgs, run, scrubSecrets, usageText };
