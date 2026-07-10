export type SystemReadinessStatus = 'ready' | 'degraded' | 'blocked';

export interface SystemReadinessCheck {
  id: string;
  label: string;
  status: SystemReadinessStatus;
  detail: string;
  recovery?: string;
  required: boolean;
}

export interface SystemReadinessSnapshot {
  status: SystemReadinessStatus;
  checkedAt: string;
  source: 'launcher' | 'manual';
  appUrl?: string;
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
  const response = await fetch('/api/local/readiness', { signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`Readiness respondeu ${response.status}.`);
  return await response.json() as SystemReadinessSnapshot;
}
