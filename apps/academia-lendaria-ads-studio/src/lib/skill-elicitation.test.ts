import { describe, expect, it } from 'vitest';
import { appendElicitationHistory, buildElicitationContinuation, pendingElicitationQuestions } from './skill-elicitation';

describe('skill elicitation continuation', () => {
  it('normalizes questions and creates an auditable continuation prompt', () => {
    const questions = pendingElicitationQuestions([' Qual é a oferta? ', '', 'Qual é o preço?']);
    expect(questions).toEqual(['Qual é a oferta?', 'Qual é o preço?']);
    expect(buildElicitationContinuation({
      skillId: 'offerbook',
      priorSummary: 'Faltam duas decisões.',
      questions,
      answers: ['Cohort de Marketing', 'R$ 2.000'],
    })).toContain('1. Qual é a oferta?\nResposta: Cohort de Marketing');
  });

  it('refuses an unanswered checkpoint', () => {
    expect(() => buildElicitationContinuation({
      skillId: 'offerbook',
      priorSummary: '',
      questions: ['Qual é a oferta?'],
      answers: [''],
    })).toThrow('Responda: Qual é a oferta?');
  });

  it('preserves prior answers across auditable continuation rounds', () => {
    const first = '1. Qual é a oferta?\nResposta: Cohort de Marketing';
    const second = '1. Qual é o preço?\nResposta: R$ 2.000';
    expect(appendElicitationHistory(first, second)).toContain(first);
    expect(appendElicitationHistory(first, second)).toContain(second);
  });
});
