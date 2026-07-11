import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CREATIVE_BRIEF,
  approvedHookCount,
  generateDemoHooks,
  isBriefReadyForFactory,
  updateHook,
} from '@/lib/creative-brief';

describe('creative-brief', () => {
  it('gera hooks demo editáveis a partir dos ângulos ativos', () => {
    const hooks = generateDemoHooks(DEFAULT_CREATIVE_BRIEF);

    expect(hooks).toHaveLength(4);
    expect(hooks[0].headline).toMatch(/executar/i);
    expect(hooks[0].approved).toBe(false);
  });

  it('conta hooks aprovados e exige headline preenchida para fábrica', () => {
    const hooks = generateDemoHooks(DEFAULT_CREATIVE_BRIEF);
    const brief = { ...DEFAULT_CREATIVE_BRIEF, hooks };
    const approved = updateHook(brief, hooks[0].id, { approved: true });

    expect(approvedHookCount(approved)).toBe(1);
    expect(isBriefReadyForFactory(approved)).toBe(true);
  });

  it('não considera pronto quando não há hook aprovado', () => {
    const brief = { ...DEFAULT_CREATIVE_BRIEF, hooks: generateDemoHooks(DEFAULT_CREATIVE_BRIEF) };

    expect(isBriefReadyForFactory(brief)).toBe(false);
  });
});
