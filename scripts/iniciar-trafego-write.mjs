#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const proposalId = process.argv.find((a) => a.startsWith('--proposal-id=') || a.startsWith('--proposalId='));
const approval = process.argv.find((a) => a.startsWith('--approval='));
const project = process.argv.find((a) => a.startsWith('--project='));

if (!project || !approval) {
  console.error('Uso: node scripts/iniciar-trafego-write.mjs --project=projetos/{slug} --proposal-id=<id> --approval="<texto>"');
  process.exit(1);
}
if (!proposalId) {
  console.error('FAIL: --proposal-id obrigatorio — proposta persistida deve ser aprovada, nao reconstruida');
  process.exit(1);
}

const r = spawnSync(process.execPath, ['scripts/iniciar-trafego.mjs', 'approve', ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
