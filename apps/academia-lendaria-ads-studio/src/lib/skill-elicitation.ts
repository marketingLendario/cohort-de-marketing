const MAX_ANSWER_CHARS = 4_000;
const MAX_HISTORY_CHARS = 128_000;

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

export function appendElicitationHistory(previous: unknown, current: string): string {
  const prior = typeof previous === 'string' ? previous.trim() : '';
  const next = current.trim();
  const history = [prior, next].filter(Boolean).join('\n\n--- NOVA RODADA DE ELICITAÇÃO ---\n\n');
  if (history.length > MAX_HISTORY_CHARS) {
    throw new Error('O histórico de elicitação excedeu o limite seguro. Consolide as respostas em uma nova execução.');
  }
  return history;
}
