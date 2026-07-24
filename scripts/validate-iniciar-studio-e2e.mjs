#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const COHORT = process.cwd();
const STUDIO = process.env.AIOX_STUDIO_ROOT || join(COHORT, '../academia-lendaria-ads-studio');

function fail(msg) {
  console.error(`validate-iniciar-studio-e2e: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const platform = process.platform;
const arch = process.arch;
ok(`plataforma detectada: ${platform}/${arch}`);

const matrix = [
  { id: 'win32-x64', platforms: ['win32'], archs: ['x64', 'ia32'] },
  { id: 'darwin-x64', platforms: ['darwin'], archs: ['x64'] },
  { id: 'darwin-arm64', platforms: ['darwin'], archs: ['arm64'] },
];

const match = matrix.find((row) => row.platforms.includes(platform) && row.archs.includes(arch));
if (!match) {
  console.log(`validate-iniciar-studio-e2e: SKIP — matriz E2E não cobre ${platform}/${arch} neste host`);
  process.exit(0);
}
ok(`matriz E2E aplicável: ${match.id}`);

const launcher = join(STUDIO, 'scripts/marketing-studio.mjs');
if (!existsSync(launcher)) fail(`launcher ausente: ${launcher}`);

const src = readFileSync(launcher, 'utf8');
const checks = [
  ['promoteTrafficSyncToOpen', 'profile open promove traffic-sync'],
  ['attachLeaseToState', 'lease attach em runtime vivo'],
  ['tryStartDockerDesktop', 'auto-start Docker'],
  ['ensureTrafficSyncWorkspace', 'tenant bootstrap traffic-sync'],
  ['profile === \'open\'', 'profile open'],
  ['profile === \'traffic-sync\'', 'profile traffic-sync'],
];

for (const [needle, label] of checks) {
  if (!src.includes(needle)) fail(`${label} ausente em marketing-studio.mjs`);
  ok(label);
}

const migration = join(STUDIO, 'apps/academia-lendaria-ads-studio/supabase/migrations/20260723170000_traffic_start_tenant_readback_v2.sql');
if (!existsSync(migration)) fail('migration tenant/readback v2 ausente');
if (!readFileSync(migration, 'utf8').includes('traffic_start_readback_rpc')) {
  fail('migration sem readback RPC relendo domínio');
}
ok('migration tenant + readback v2');

console.log(`validate-iniciar-studio-e2e: PASS (${match.id})`);
