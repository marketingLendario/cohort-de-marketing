#!/usr/bin/env node
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { registerResumeIntent } from './lib/iniciar-studio/platform/index.mjs';

const ROOT = process.cwd();
const STUDIO = process.env.AIOX_STUDIO_ROOT || join(ROOT, '../academia-lendaria-ads-studio');

function fail(msg) {
  console.error(`validate-iniciar-trafego-qa3-fixes: FAIL — ${msg}`);
  process.exit(1);
}

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

const migration = readFileSync(join(
  STUDIO,
  'apps/academia-lendaria-ads-studio/supabase/migrations/20260723170000_traffic_start_tenant_readback_v2.sql',
), 'utf8');
const ue = migration.slice(migration.indexOf('insert into public.ads_unit_economics'));
if (ue.includes('updated_at = now()') || ue.includes('returning id into v_ue_id')) {
  fail('migration ads_unit_economics ainda invalida');
}
if (!read('scripts/iniciar-trafego.mjs').includes('beforePost')) fail('stale pos-ensure ausente');
if (!read('scripts/iniciar-trafego.mjs').includes('markPanelWritten(project,')) fail('panelHash estado ausente');
if (read('scripts/iniciar-studio.mjs').includes('process.cwd()')) fail('ensure cwd fallback presente');
if (!read('scripts/lib/iniciar-studio/coordinator.mjs').includes("'--no-open'")) fail('open duplicado no launcher');
if (!read('scripts/lib/iniciar-trafego/run-state.mjs').includes("STALE: 'propose'")) fail('RESUME STALE ausente');
if (!read('.claude/skills/iniciar-trafego/SKILL.md').includes('OPEN_DECISION')) fail('skill OPEN_DECISION ausente');

const tmp = mkdtempSync(join(tmpdir(), 'resume-test-'));
try {
  const { writeInstallIntent } = await import('./lib/iniciar-studio/install-intent-store.mjs');
  writeInstallIntent(tmp, { purpose: 'traffic-sync', projectRoot: tmp });
  const result = await registerResumeIntent(tmp, { purpose: 'traffic-sync', testOnly: true });
  if (!result?.path || !existsSync(result.path)) {
    fail('resume task nao persistido');
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log('validate-iniciar-trafego-qa3-fixes: PASS');
