import { describe, expect, it } from 'vitest';
import { skillCatalog, skillExecutionMatrix } from '@/generated/skill-catalog';
import { capabilityGapLabel, executionParityForSkill, panelActionLabel, SKILL_PARITY_LABELS } from './skill-execution-parity';

describe('skill execution parity', () => {
  it('covers every catalog skill exactly once', () => {
    expect(skillExecutionMatrix.skills).toHaveLength(skillCatalog.skills.length);
    expect(new Set(skillExecutionMatrix.skills.map((entry) => entry.id)).size).toBe(skillCatalog.skills.length);
  });

  it('keeps the ten deeply validated skills at full parity', () => {
    const full = skillExecutionMatrix.skills.filter((entry) => entry.parity === 'full_e2e').map((entry) => entry.id);
    expect(full).toEqual([
      'offerbook',
      'copy-funil',
      'pagina-vendas-funil',
      'mockup-produto-funil',
      'zelador',
      'briefista',
      'estruturador',
      'leitor-de-metricas',
      'diagnosticador',
      'ads-creative-factory',
    ]);
    for (const id of full) expect(executionParityForSkill(id).missingCapabilities).toEqual([]);
  });

  it('uses honest action labels for specialized and partial skills', () => {
    expect(panelActionLabel(executionParityForSkill('offerbook').parity)).toBe('Executar skill');
    expect(capabilityGapLabel('Book reconciliation')).toBe('Atualização atômica do Book do Funil.');
    expect(SKILL_PARITY_LABELS[executionParityForSkill('comecar').parity]).toBe('Cobertura nativa parcial');
    expect(panelActionLabel(executionParityForSkill('comecar').parity)).toBe('Executar etapa guiada');
    expect(panelActionLabel(executionParityForSkill('ads-creative-factory').parity)).toBe('Executar skill');
  });
});
