#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const STUDIO = process.env.AIOX_STUDIO_ROOT
  || join(process.cwd(), '../academia-lendaria-ads-studio');
const qa4Path = join(
  STUDIO,
  'apps/academia-lendaria-ads-studio/supabase/migrations/20260723190000_traffic_start_readback_qa4_fixes.sql',
);

function fail(msg) {
  console.error(`validate-traffic-start-migration-qa4: FAIL — ${msg}`);
  process.exit(1);
}

if (!existsSync(qa4Path)) fail(`migration QA4 ausente: ${qa4Path}`);
const sql = readFileSync(qa4Path, 'utf8');
if (!sql.includes('if v_margin <= 1')) fail('migration QA4 deve normalizar margem_pct fracao vs percentual');
if (sql.includes("margem_pct')::numeric, 0) * 100)")) fail('migration QA4 ainda usa margem_pct * 100 cego');
if (!sql.includes('v_project.slug')) fail('readback QA4 deve usar v_project.slug');
if (!sql.includes('v_ue.gross_margin_pct')) fail('readback QA4 deve ler gross_margin_pct da tabela');
if (!sql.includes('v_ue.product_price_cents')) fail('readback QA4 deve ler product_price_cents');
if (!sql.includes('artifactHash')) fail('readback QA4 deve expor artifactHash');
if (!sql.includes('campaignPlan')) fail('readback QA4 deve expor campaignPlan');
if (!sql.includes('entityVersions')) fail('readback QA4 deve expor entityVersions');

console.log('validate-traffic-start-migration-qa4: PASS');
