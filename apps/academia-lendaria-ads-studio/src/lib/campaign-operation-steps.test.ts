import { describe, expect, it } from 'vitest';
import {
  advancePublication,
  defaultCampaignPublicationState,
  retryPublication,
  startPublication,
} from '@/lib/campaign-publication';
import {
  assignCreativeToSlot,
  buildCreativeBatch,
  defaultCreativeFactoryState,
  summarizeCreativeFactory,
  updateCreative,
} from '@/lib/creative-factory';
import {
  defaultPerformanceMonitorState,
  resolveApprovalQueue,
} from '@/lib/performance-monitor';
import {
  defaultTrackingAuditState,
  finishTrackingAudit,
  isTrackingApproved,
} from '@/lib/tracking-audit';

describe('campaign operation steps', () => {
  it('gera, aprova e encaixa um criativo', () => {
    const initial = defaultCreativeFactoryState();
    const creatives = buildCreativeBatch(initial);
    const generated = { ...initial, creatives, generation: 'done' as const, progress: creatives.length };
    const approved = updateCreative(generated, creatives[0].id, { approved: true, status: 'approved' });
    const assigned = assignCreativeToSlot(approved, creatives[0].id, 's1');

    expect(creatives).toHaveLength(15);
    expect(summarizeCreativeFactory(assigned)).toMatchObject({ approved: 1, filled: 1, slots: 6 });
  });

  it('aprova tracking apenas quando Purchase está íntegro', () => {
    const broken = finishTrackingAudit(defaultTrackingAuditState());
    const healthy = finishTrackingAudit({ ...defaultTrackingAuditState(), purchaseBroken: false });

    expect(isTrackingApproved(broken)).toBe(false);
    expect(healthy.emq).toBe(7.8);
    expect(isTrackingApproved(healthy)).toBe(true);
  });

  it('recupera publicação após falha parcial', () => {
    let state = startPublication({ ...defaultCampaignPublicationState(), scenario: 'partial' });
    while (state.status === 'publishing') state = advancePublication(state);

    expect(state.status).toBe('partial');
    state = retryPublication(state);
    while (state.status === 'publishing') state = advancePublication(state);
    expect(state.status).toBe('done');
  });

  it('registra decisão humana ao resolver a fila', () => {
    const state = defaultPerformanceMonitorState();
    const resolved = resolveApprovalQueue(state, 'q1', true);

    expect(resolved.queue).toHaveLength(0);
    expect(resolved.decisions[0]).toMatchObject({ expert: 'humano', kind: 'scale' });
  });
});
