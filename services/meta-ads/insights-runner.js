#!/usr/bin/env node
/**
 * insights-runner.js — pull Meta Ads insights for a spoke and persist as JSON.
 *
 * Usage:
 *   node services/meta-ads/insights-runner.js --spoke=<slug> [--date-preset=last_30d] [--out-dir=outputs/aiox-ads/<slug>]
 *
 * Defaults:
 *   --date-preset=last_30d
 *   --fields=spend,impressions,ctr,cpc,reach,clicks,frequency,cpm
 *   --out-dir=outputs/aiox-ads/<spoke>
 *
 * Story: STORY-152.3
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { resolveSpoke } = require('./spoke-resolver');
const { scrubSecrets } = require('./index');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_FIELDS = 'spend,impressions,ctr,cpc,reach,clicks,frequency,cpm';
const DEFAULT_DATE_PRESET = 'last_30d';
const DEFAULT_TIMEOUT_MS = 30_000;

function timeoutMs() {
  const parsed = Number.parseInt(process.env.META_ADS_TIMEOUT_MS || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function parseFlags(argv) {
  const out = {
    spoke: null,
    datePreset: DEFAULT_DATE_PRESET,
    fields: DEFAULT_FIELDS,
    outDir: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--spoke=')) out.spoke = a.slice('--spoke='.length);
    else if (a === '--spoke') out.spoke = argv[++i];
    else if (a.startsWith('--date-preset=')) out.datePreset = a.slice('--date-preset='.length);
    else if (a.startsWith('--fields=')) out.fields = a.slice('--fields='.length);
    else if (a.startsWith('--out-dir=')) out.outDir = a.slice('--out-dir='.length);
  }
  return out;
}

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function runMetaCommand(args, env) {
  const result = spawnSync('meta', args, {
    env: { ...process.env, ...env },
    stdio: 'pipe',
    encoding: 'utf8',
    timeout: timeoutMs(),
  });
  if (result.error) {
    throw new Error(`Failed to invoke 'meta': ${scrubSecrets(result.error.message, env)}`);
  }
  if (result.status !== 0) {
    throw new Error(`'meta ${args.join(' ')}' exited with code ${result.status}\n${scrubSecrets(result.stderr || '', env)}`);
  }
  return scrubSecrets(result.stdout || '', env);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function main() {
  const flags = parseFlags(process.argv.slice(2));
  if (!flags.spoke) {
    process.stderr.write('Error: --spoke=<slug> is required\n');
    process.exit(2);
  }

  const resolved = resolveSpoke(flags.spoke);
  if (resolved.missing.length > 0) {
    process.stderr.write(`Error: missing vars: ${resolved.missing.join(', ')}\n`);
    process.exit(2);
  }

  const outDir = flags.outDir || path.join(REPO_ROOT, 'outputs', 'aiox-ads', flags.spoke);
  ensureDir(outDir);
  const stamp = isoDate();

  process.stdout.write(`Pulling insights for spoke=${flags.spoke}, date-preset=${flags.datePreset}\n`);
  process.stdout.write(`Output directory: ${outDir}\n`);

  // 1. Insights (account-level)
  // Note: --output goes BEFORE 'ads' (flag of root `meta`, not subcommand)
  const insightsRaw = runMetaCommand(
    [
      '--output',
      'json',
      'ads',
      'insights',
      'get',
      '--date-preset',
      flags.datePreset,
      '--fields',
      flags.fields,
    ],
    resolved.env
  );
  const insightsParsed = tryParseJson(insightsRaw) || { raw: insightsRaw };
  const insightsFile = path.join(outDir, `insights-${stamp}.json`);
  writeJson(insightsFile, {
    spoke: flags.spoke,
    pulled_at: new Date().toISOString(),
    date_preset: flags.datePreset,
    fields: flags.fields.split(','),
    ad_account_id: resolved.env.AD_ACCOUNT_ID,
    data: insightsParsed,
  });
  process.stdout.write(`  ✓ ${path.relative(REPO_ROOT, insightsFile)}\n`);

  // 2. Campaigns snapshot
  const campaignsRaw = runMetaCommand(
    ['--output', 'json', 'ads', 'campaign', 'list'],
    resolved.env
  );
  const campaignsParsed = tryParseJson(campaignsRaw);
  const campaignsFile = path.join(outDir, `campaigns-${stamp}.json`);
  writeJson(campaignsFile, {
    spoke: flags.spoke,
    pulled_at: new Date().toISOString(),
    ad_account_id: resolved.env.AD_ACCOUNT_ID,
    campaigns: campaignsParsed !== null ? campaignsParsed : { raw: campaignsRaw },
  });
  process.stdout.write(`  ✓ ${path.relative(REPO_ROOT, campaignsFile)}\n`);

  // 3. Pages snapshot (no JSON pass-through; CLI returns table — keep raw)
  const pagesRaw = runMetaCommand(['ads', 'page', 'list'], resolved.env);
  const pagesFile = path.join(outDir, `pages-${stamp}.json`);
  writeJson(pagesFile, {
    spoke: flags.spoke,
    pulled_at: new Date().toISOString(),
    raw_table: pagesRaw,
  });
  process.stdout.write(`  ✓ ${path.relative(REPO_ROOT, pagesFile)}\n`);

  process.stdout.write(`\nDone. ${stamp} snapshot persisted.\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    process.stderr.write(`\nFAIL: ${e.message}\n`);
    process.exit(1);
  }
}
