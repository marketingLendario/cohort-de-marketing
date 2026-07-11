import { describe, expect, it } from 'vitest';
import { formatBriefValidationIssues } from '@/components/project-briefing';

describe('ProjectBriefing importação', () => {
  it('apresenta os campos inválidos sem reduzir o diagnóstico a erro genérico', () => {
    expect(formatBriefValidationIssues([
      { path: 'project.slug', message: 'é obrigatório.' },
      { path: 'artifacts.offerbook', message: 'deve ser booleano.' },
    ])).toBe('Briefing inválido: project.slug (é obrigatório.); artifacts.offerbook (deve ser booleano.)');
  });
});
