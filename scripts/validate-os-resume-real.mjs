#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const win32 = readFileSync(join(ROOT, 'scripts/lib/iniciar-studio/platform/win32.mjs'), 'utf8');
const darwin = readFileSync(join(ROOT, 'scripts/lib/iniciar-studio/platform/darwin.mjs'), 'utf8');

function fail(msg) {
  console.error(`validate-os-resume-real: FAIL — ${msg}`);
  process.exit(1);
}

if (!win32.includes("spawnSync('schtasks'")) fail('win32.mjs deve invocar schtasks');
if (!darwin.includes("spawnSync('launchctl'")) fail('darwin.mjs deve invocar launchctl');
if (!darwin.includes('LaunchAgents')) fail('darwin.mjs deve materializar plist em LaunchAgents');

console.log('validate-os-resume-real: PASS');
