export type TrackingEventName = 'PageView' | 'ViewContent' | 'Lead' | 'InitiateCheckout' | 'Purchase';

export interface TrackingAuditState {
  pixel: string;
  domain: string;
  events: Record<TrackingEventName, boolean>;
  audit: 'idle' | 'running' | 'done';
  progress: number;
  purchaseBroken: boolean;
  emq: number;
}

export const TRACKING_EVENTS: TrackingEventName[] = [
  'PageView',
  'ViewContent',
  'Lead',
  'InitiateCheckout',
  'Purchase',
];

export const TRACKING_VARIANCE = [
  { event: 'Lead', meta: 312, backend: 318, delta: '-1,9%' },
  { event: 'InitiateCheckout', meta: 142, backend: 147, delta: '-3,4%' },
  { event: 'Purchase', meta: 41, backend: 43, delta: '-4,7%' },
];

export function defaultTrackingAuditState(): TrackingAuditState {
  return {
    pixel: 'btn-pixel-8842197',
    domain: 'lp.academialendaria.ai/mentoria',
    events: {
      PageView: true,
      ViewContent: true,
      Lead: true,
      InitiateCheckout: true,
      Purchase: true,
    },
    audit: 'idle',
    progress: 0,
    purchaseBroken: true,
    emq: 0,
  };
}

export function finishTrackingAudit(state: TrackingAuditState): TrackingAuditState {
  const criticalEventsEnabled = state.events.Purchase && state.events.Lead;
  const approved = criticalEventsEnabled && !state.purchaseBroken;
  return { ...state, audit: 'done', progress: 100, emq: approved ? 7.8 : 4.1 };
}

export function isTrackingApproved(state: TrackingAuditState | null): boolean {
  return Boolean(
    state &&
      state.audit === 'done' &&
      !state.purchaseBroken &&
      state.events.Purchase &&
      state.events.Lead,
  );
}
