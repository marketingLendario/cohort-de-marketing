export type SystemReadinessStatus = 'ready' | 'degraded' | 'blocked';

export interface SystemReadinessCheck {
  id: string;
  label: string;
  status: SystemReadinessStatus;
  detail: string;
  recovery?: string;
  required: boolean;
  recoveryActionId?: 'sync-skill-mirror' | 'git-pull-fast-forward' | 'configure-apify';
}

export interface SystemReadinessSnapshot {
  status: SystemReadinessStatus;
  checkedAt: string;
  source: 'launcher' | 'manual';
  appUrl?: string;
  diagnosisHash?: string;
  starts?: Array<{ id: 'aula-1' | 'aula-2'; label: string; nextCommand: '/avatar-funil' | '/design-md' }>;
  checks: SystemReadinessCheck[];
}

export const UNAVAILABLE_READINESS: SystemReadinessSnapshot = {
  status: 'degraded',
  checkedAt: '',
  source: 'manual',
  checks: [{
    id: 'readiness-api',
    label: 'Diagnóstico local',
    status: 'degraded',
    detail: 'O diagnóstico do ambiente não respondeu.',
    recovery: 'Rode novamente: node scripts/marketing-studio.mjs start',
    required: false,
  }],
};

export async function fetchSystemReadiness(signal?: AbortSignal): Promise<SystemReadinessSnapshot> {
  const response = await fetch('/api/local/environment-bootstrap', { signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`Readiness respondeu ${response.status}.`);
  return await response.json() as SystemReadinessSnapshot;
}

export async function recoverSystemReadiness(input: {
  actionId: 'sync-skill-mirror' | 'git-pull-fast-forward' | 'configure-apify';
  expectedDiagnosisHash: string;
  value?: string;
}): Promise<SystemReadinessSnapshot> {
  const response = await fetch('/api/local/environment-bootstrap/recover', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...input, consent: true }),
  });
  if (!response.ok) throw new Error(`Recuperação respondeu ${response.status}.`);
  return await response.json() as SystemReadinessSnapshot;
}
