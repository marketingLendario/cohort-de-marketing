#!/usr/bin/env node
import { ensureTrafficSyncRuntime, openProject, releaseRuntime } from './lib/iniciar-studio/coordinator.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0];
const args = Object.fromEntries(
  argv.slice(1).map((a) => {
    const raw = a.replace(/^--/, '');
    const eq = raw.indexOf('=');
    if (eq === -1) return [raw, true];
    return [raw.slice(0, eq), raw.slice(eq + 1)];
  }),
);

function emit(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function projectPath(required = true) {
  const p = String(args.project ?? args.p ?? '');
  if (!p && required) throw new Error('--project=projetos/{slug} obrigatorio');
  return p;
}

try {
  if (cmd === 'ensure') {
    const purpose = String(args.purpose ?? 'traffic-sync');
    if (purpose !== 'traffic-sync') throw new Error('ensure suporta purpose=traffic-sync');
    const projectRoot = projectPath(true);
    const intent = {
      schemaVersion: '1.0.0',
      purpose,
      projectRoot,
      handoffPath: String(args.intent ?? args['handoff-path'] ?? ''),
      proposalId: String(args['proposal-id'] ?? args.proposalId ?? ''),
      proposalHash: String(args['proposal-hash'] ?? args.proposalHash ?? ''),
      runId: String(args['run-id'] ?? args.runId ?? ''),
    };
    const result = await ensureTrafficSyncRuntime(projectRoot, intent);
    emit({ ok: true, ...result });
    process.exit(0);
  }

  if (cmd === 'open') {
    const leaseId = String(args.lease ?? args['lease-id'] ?? '');
    const deepLink = String(args['deep-link'] ?? args.deepLink ?? '');
    if (!leaseId || !deepLink) throw new Error('--lease e --deep-link obrigatorios');
    const result = await openProject(projectPath(), { leaseId, deepLink });
    emit(result);
    process.exit(0);
  }

  if (cmd === 'release') {
    const leaseId = String(args.lease ?? args['lease-id'] ?? '');
    const result = await releaseRuntime(projectPath(), { leaseId });
    emit(result);
    process.exit(0);
  }

  console.error(`Uso:
  node scripts/iniciar-studio.mjs ensure --purpose=traffic-sync --project=... --intent=... --proposal-id=... --proposal-hash=... [--json]
  node scripts/iniciar-studio.mjs open --project=... --lease=<id> --deep-link=<url>
  node scripts/iniciar-studio.mjs release --project=... --lease=<id>`);
  process.exit(1);
} catch (e) {
  emit({ ok: false, error: e.message });
  process.exit(1);
}
