const MAX_ANSWER_CHARS = 4_000;

export function pendingElicitationQuestions(questions: string[]): string[] {
  return questions.map((question) => question.trim()).filter(Boolean).slice(0, 10);
}

export function buildElicitationContinuation(input: {
  skillId: string;
  priorSummary: string;
  questions: string[];
  answers: string[];
}): string {
  const questions = pendingElicitationQuestions(input.questions);
  if (questions.length === 0 || questions.length !== input.answers.length) {
    throw new Error('A continuação precisa responder todas as perguntas pendentes.');
  }
  const pairs = questions.map((question, index) => {
    const answer = input.answers[index]?.trim().slice(0, MAX_ANSWER_CHARS) ?? '';
    if (!answer) throw new Error(`Responda: ${question}`);
    return `${index + 1}. ${question}\nResposta: ${answer}`;
  });
  return [
    `CONTINUAÇÃO DE ELICITAÇÃO DA SKILL ${input.skillId}.`,
    `Resumo do checkpoint anterior: ${input.priorSummary.trim().slice(0, 2_000) || 'sem resumo'}.`,
    'Use as respostas abaixo como decisões explícitas do operador. Não repita perguntas já respondidas.',
    ...pairs,
    'Se ainda faltar uma decisão indispensável, retorne somente as novas perguntas. Caso contrário, produza o pack final completo.',
  ].join('\n\n');
}
