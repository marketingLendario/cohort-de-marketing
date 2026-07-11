/**
 * spoke-resolver.js — maps Downloads/apps/.env.{spoke} vars to Meta Ads CLI env.
 *
 * The meta-ads CLI (v1.0.1) reads these env vars by default:
 *   ACCESS_TOKEN         — System User access token
 *   AD_ACCOUNT_ID        — must be prefixed with 'act_'
 *   BUSINESS_ID          — Business Manager ID (used by dataset commands)
 *
 * In our setup, each spoke stores credentials under prefix {SPOKE_UPPER}_META_*
 * inside Downloads/apps/.env.{spoke}. This module reads that file and produces
 * the env object the CLI expects.
 *
 * Story: STORY-152.2
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SPOKE_ENV_DIR = path.join(os.homedir(), 'Downloads', 'apps');

const SUPPORTED_SPOKES = [
  'natalia-tanaka',
  'aiox',
  'allfluence',
  'bilhon',
  'academia-lendaria',
  'bianca-costa',
];

/**
 * Read a .env file and return key/value object.
 * No interpolation, no shell-style expansion. Lines starting with '#' or blank are skipped.
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const result = {};
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    result[key] = value;
  }
  return result;
}

function spokeEnvPath(spoke) {
  return path.join(SPOKE_ENV_DIR, `.env.${spoke}`);
}

function spokePrefix(spoke) {
  return spoke.toUpperCase().replace(/-/g, '_');
}

/**
 * Resolve env vars for a given spoke into the format the meta-ads CLI expects.
 *
 * @param {string} spoke - slug like 'natalia-tanaka'
 * @returns {{env: object, missing: string[], spoke: string, source: string}}
 */
function resolveSpoke(spoke) {
  if (!SUPPORTED_SPOKES.includes(spoke)) {
    const err = new Error(
      `Unknown spoke '${spoke}'. Supported: ${SUPPORTED_SPOKES.join(', ')}`
    );
    err.code = 'UNKNOWN_SPOKE';
    throw err;
  }

  const filePath = spokeEnvPath(spoke);
  const parsed = parseEnvFile(filePath);
  if (parsed === null) {
    const err = new Error(
      `Spoke '${spoke}' env file not found: ${filePath}\n` +
      `Run the spoke onboarding playbook: docs/migration/META-ADS-SPOKE-ONBOARDING-PLAYBOOK.md`
    );
    err.code = 'ENV_FILE_MISSING';
    throw err;
  }

  const prefix = spokePrefix(spoke);
  const required = {
    ACCESS_TOKEN: `${prefix}_META_ACCESS_TOKEN`,
    AD_ACCOUNT_ID: `${prefix}_META_AD_ACCOUNT_ID`,
  };
  const optional = {
    BUSINESS_ID: `${prefix}_META_BUSINESS_MANAGER_ID`,
  };

  const env = {};
  const missing = [];

  for (const [cliVar, fileVar] of Object.entries(required)) {
    if (!parsed[fileVar]) {
      missing.push(fileVar);
    } else {
      env[cliVar] = parsed[fileVar];
    }
  }
  for (const [cliVar, fileVar] of Object.entries(optional)) {
    if (parsed[fileVar]) {
      env[cliVar] = parsed[fileVar];
    }
  }

  if (env.AD_ACCOUNT_ID && !env.AD_ACCOUNT_ID.startsWith('act_')) {
    env.AD_ACCOUNT_ID = `act_${env.AD_ACCOUNT_ID}`;
  }

  return { env, missing, spoke, source: filePath };
}

/**
 * Mask a secret for safe display. Shows first 6 chars + length.
 */
function maskSecret(value) {
  if (!value || typeof value !== 'string') return '<empty>';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 6)}***(len=${value.length})`;
}

/**
 * List spokes that have an .env.{slug} file present locally.
 */
function listAvailableSpokes() {
  return SUPPORTED_SPOKES.filter((s) => fs.existsSync(spokeEnvPath(s)));
}

module.exports = {
  SPOKE_ENV_DIR,
  SUPPORTED_SPOKES,
  resolveSpoke,
  maskSecret,
  listAvailableSpokes,
  spokeEnvPath,
  spokePrefix,
  parseEnvFile,
};
