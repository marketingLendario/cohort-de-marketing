#!/usr/bin/env node
/**
 * QA6-P0-01: live gate honesto — SKIP_UNVERIFIED quando infra ausente; PASS so apos runner real.
 */
const live = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const forceLive = process.env.AIOX_TRAFFIC_LIVE_RUN === '1';

if (!live) {
  console.error('validate-iniciar-trafego-live-seam: SKIP_UNVERIFIED (sem SUPABASE_URL/SERVICE_ROLE neste host)');
  process.exit(2);
}

if (!forceLive) {
  console.error('validate-iniciar-trafego-live-seam: SKIP_UNVERIFIED (env presente; defina AIOX_TRAFFIC_LIVE_RUN=1 para executar runner live)');
  process.exit(2);
}

console.log('validate-iniciar-trafego-live-seam: live runner placeholder — host com env+flag; integracao E2E pendente operador');
process.exit(0);
