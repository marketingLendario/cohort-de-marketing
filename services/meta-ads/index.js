#!/usr/bin/env node
/**
 * services/meta-ads/index.js — Meta Ads CLI multi-spoke wrapper.
 *
 * Usage:
 *   node services/meta-ads/index.js --list-spokes
 *   node services/meta-ads/index.js --check --spoke=<slug>
 *   node services/meta-ads/index.js --spoke=<slug> <meta-ads-cli args...>
 *
 * Examples:
 *   node services/meta-ads/index.js --list-spokes
 *   node services/meta-ads/index.js --check --spoke=natalia-tanaka
 *   node services/meta-ads/index.js --spoke=natalia-tanaka ads campaign list
 *   node services/meta-ads/index.js --spoke=natalia-tanaka ads insights get --date-preset last_30d
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
const DEFAULT_TIMEOUT_MS = 30_000;

function timeoutMs() {
  const parsed = Number.parseInt(process.env.META_ADS_TIMEOUT_MS || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function printUsage() {
  process.stdout.write(
    [
      'Usage:',
      '  node services/meta-ads/index.js --list-spokes',
      '  node services/meta-ads/index.js --check --spoke=<slug>',
      '  node services/meta-ads/index.js --spoke=<slug> <meta-cli args...>',
      '',
      `Supported spokes: ${SUPPORTED_SPOKES.join(', ')}`,
      '',
      'Examples:',
      '  --list-spokes                                  List spokes with .env.{slug} present',
      '  --check --spoke=natalia-tanaka                 Validate token + scopes for spoke',
      '  --spoke=natalia-tanaka ads campaign list       Pass-through to meta CLI',
      '',
    ].join('\n')
  );
}

function parseArgs(argv) {
  const out = { spoke: null, listSpokes: false, check: false, passthrough: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list-spokes') {
      out.listSpokes = true;
    } else if (a === '--check') {
      out.check = true;
    } else if (a === '-h' || a === '--help') {
      out.help = true;
    } else if (a.startsWith('--spoke=')) {
      out.spoke = a.slice('--spoke='.length);
    } else if (a === '--spoke') {
      out.spoke = argv[++i];
    } else {
      out.passthrough.push(a);
    }
  }
  return out;
}

function cmdListSpokes() {
  const available = listAvailableSpokes();
  process.stdout.write('Available spokes (with .env.{slug} present):\n');
  for (const s of SUPPORTED_SPOKES) {
    const present = available.includes(s);
    process.stdout.write(`  ${present ? '✓' : '·'} ${s}${present ? '' : '  (no env file)'}\n`);
  }
  process.stdout.write(`\nTotal ready: ${available.length}/${SUPPORTED_SPOKES.length}\n`);
}

function cmdCheck(spoke) {
  if (!spoke) {
    process.stderr.write('Error: --check requires --spoke=<slug>\n');
    process.exit(2);
  }

  let resolved;
  try {
    resolved = resolveSpoke(spoke);
  } catch (e) {
    process.stderr.write(`Error: ${e.message}\n`);
    process.exit(2);
  }

  process.stdout.write(`Spoke: ${resolved.spoke}\n`);
  process.stdout.write(`Source: ${resolved.source}\n`);
  process.stdout.write(`\nResolved CLI env (masked):\n`);
  for (const [k, v] of Object.entries(resolved.env)) {
    process.stdout.write(`  ${k}=${maskSecret(v)}\n`);
  }

  if (resolved.missing.length > 0) {
    process.stderr.write(`\nMISSING required vars: ${resolved.missing.join(', ')}\n`);
    process.exit(2);
  }

  process.stdout.write(`\nInvoking 'meta auth status' for live validation...\n`);
  const result = spawnSync(META_BIN, ['auth', 'status'], {
    env: { ...process.env, ...resolved.env },
    stdio: 'pipe',
    encoding: 'utf8',
    timeout: timeoutMs(),
  });

  if (result.error) {
    process.stderr.write(`\nFailed to invoke '${META_BIN}': ${result.error.message}\n`);
    process.stderr.write(`Is the meta-ads CLI installed? Run: pip install meta-ads\n`);
    process.exit(2);
  }

  const stdout = scrubSecrets(result.stdout || '', resolved.env);
  const stderr = scrubSecrets(result.stderr || '', resolved.env);
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  if (result.status !== 0) {
    process.stderr.write(`\nmeta auth status exited with code ${result.status}\n`);
    process.exit(result.status || 1);
  }

  process.stdout.write(`\nOK — spoke '${spoke}' is ready.\n`);
}

function cmdPassthrough(spoke, args) {
  if (!spoke) {
    process.stderr.write('Error: --spoke=<slug> required for pass-through invocation\n');
    printUsage();
    process.exit(2);
  }
  if (args.length === 0) {
    process.stderr.write('Error: pass-through args required (e.g. "ads campaign list")\n');
    process.exit(2);
  }

  let resolved;
  try {
    resolved = resolveSpoke(spoke);
  } catch (e) {
    process.stderr.write(`Error: ${e.message}\n`);
    process.exit(2);
  }
  if (resolved.missing.length > 0) {
    process.stderr.write(
      `Error: missing vars in ${resolved.source}: ${resolved.missing.join(', ')}\n`
    );
    process.exit(2);
  }

  const result = spawnSync(META_BIN, args, {
    env: { ...process.env, ...resolved.env },
    stdio: 'pipe',
    encoding: 'utf8',
    timeout: timeoutMs(),
  });

  if (result.error) {
    process.stderr.write(`Failed to invoke '${META_BIN}': ${result.error.message}\n`);
    process.exit(2);
  }

  const stdout = scrubSecrets(result.stdout || '', resolved.env);
  const stderr = scrubSecrets(result.stderr || '', resolved.env);
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  process.exit(result.status === null ? 1 : result.status);
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

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || (!args.listSpokes && !args.check && args.passthrough.length === 0 && !args.spoke)) {
    printUsage();
    process.exit(args.help ? 0 : 2);
  }
  if (args.listSpokes) {
    cmdListSpokes();
    return;
  }
  if (args.check) {
    cmdCheck(args.spoke);
    return;
  }
  cmdPassthrough(args.spoke, args.passthrough);
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, scrubSecrets };
