const PUBLIC_STATES = Object.freeze([
  'available',
  'recommended',
  'almost',
  'blocked',
  'not_applicable',
  'done',
]);

const SELECTABLE_STATES = new Set(['available', 'recommended', 'almost', 'blocked']);
const STATE_PRIORITY = Object.freeze({ available: 0, recommended: 1, almost: 2, blocked: 3 });

export class SkillReadinessError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SkillReadinessError';
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new SkillReadinessError(code, message);
};

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const sortedStrings = (values) => [...new Set([...values].filter((value) => typeof value === 'string' && value))].sort();
const sameSet = (left, right) => JSON.stringify(sortedStrings(left)) === JSON.stringify(sortedStrings(right));

function valueAt(document, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => value?.[key], document);
}

function filled(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.values(value).some(filled);
  return value !== undefined && value !== null && value !== '' && value !== false && value !== 0;
}

function validateInputs(rules, evaluatedSkills) {
  if (!isRecord(rules) || !Array.isArray(rules.states) || !isRecord(rules.skills)
    || !sameSet(rules.states, PUBLIC_STATES)) {
    fail('INVALID_READINESS_RULES', 'As regras não declaram exatamente os seis estados públicos.');
  }
  if (!Array.isArray(evaluatedSkills) || evaluatedSkills.length === 0) {
    fail('INVALID_SKILL_EVALUATION', 'A avaliação de skills está ausente ou vazia.');
  }

  for (const [skillId, rule] of Object.entries(rules.skills)) {
    if (!isRecord(rule) || typeof rule.command !== 'string' || !rule.command.startsWith('/')) {
      fail('INVALID_READINESS_RULES', `A regra de ${skillId} está ausente ou malformada.`);
    }
    if (!Number.isSafeInteger(rule.priority) || rule.priority < 0) {
      fail('INVALID_SKILL_PRIORITY', `A prioridade declarada de ${skillId} é inválida.`);
    }
    if (typeof rule.recommendationEligible !== 'boolean') {
      fail('INVALID_RECOMMENDATION_POLICY', `A elegibilidade do recomendador para ${skillId} não é explícita.`);
    }
  }

  const seen = new Set();
  for (const item of evaluatedSkills) {
    if (!isRecord(item) || typeof item.skillId !== 'string' || seen.has(item.skillId)
      || !Object.hasOwn(rules.skills, item.skillId)) {
      fail('INVALID_SKILL_EVALUATION', 'A avaliação contém skill ausente, desconhecida ou duplicada.');
    }
    seen.add(item.skillId);
    if (!PUBLIC_STATES.includes(item.state)) {
      fail('INVALID_SKILL_STATE', `A skill ${item.skillId} retornou um estado desconhecido.`);
    }
    for (const key of ['missingFields', 'missingArtifacts', 'missingAnyOf', 'recommendedMissing']) {
      if (!Array.isArray(item[key]) || item[key].some((value) => typeof value !== 'string')) {
        fail('INVALID_SKILL_EVALUATION', `A avaliação de ${item.skillId} não declara ${key} corretamente.`);
      }
    }
  }
  if (!sameSet(seen, Object.keys(rules.skills))) {
    fail('INVALID_SKILL_EVALUATION', 'Regras e avaliações divergem na lista de skills.');
  }
}

function evidenceSummary(projectBrief, artifactIndex) {
  const briefStatus = ['draft', 'complete', 'final', 'ready'].includes(projectBrief?.status)
    ? projectBrief.status
    : 'unknown';
  const summary = artifactIndex?.summary;
  const safeCount = (value) => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  return {
    projectBrief: {
      present: isRecord(projectBrief),
      schemaVersion: typeof projectBrief?.schemaVersion === 'string' ? projectBrief.schemaVersion : 'unknown',
      status: briefStatus,
    },
    artifactIndex: {
      present: isRecord(artifactIndex),
      schemaVersion: typeof artifactIndex?.schemaVersion === 'string' ? artifactIndex.schemaVersion : 'unknown',
      total: safeCount(summary?.total),
      confirmed: safeCount(summary?.confirmed),
      pendingConfirmation: safeCount(summary?.pendingConfirmation),
    },
  };
}

function confirmedArtifactTypes(artifactIndex) {
  return new Set((artifactIndex?.entries || [])
    .filter((entry) => entry?.confirmationStatus === 'confirmed' && typeof entry?.artifactType === 'string')
    .map((entry) => entry.artifactType));
}

function satisfiedPaths(rule, projectBrief, artifactIndex) {
  const briefData = projectBrief?.data || {};
  const artifacts = confirmedArtifactTypes(artifactIndex);
  const groupMatches = (group) => {
    if (!isRecord(group)) return false;
    if (group.matches && Object.entries(group.matches).some(([field, expected]) => {
      const value = valueAt(briefData, field);
      return Array.isArray(expected) ? !expected.includes(value) : value !== expected;
    })) return false;
    return (group.fields || []).every((field) => filled(valueAt(briefData, field)))
      && (group.artifacts || []).every((artifact) => artifacts.has(artifact));
  };
  return sortedStrings((rule.anyOf || []).filter(groupMatches).map((group) => group.label));
}

function requirementSummary(item, rule, projectBrief, artifactIndex) {
  const missingFields = sortedStrings(item.missingFields);
  const missingArtifacts = sortedStrings(item.missingArtifacts);
  return {
    metRequirements: {
      fields: sortedStrings((rule.requiredFields || []).filter((field) => !missingFields.includes(field))),
      artifacts: sortedStrings((rule.requiredArtifacts || []).filter((artifact) => !missingArtifacts.includes(artifact))),
      paths: satisfiedPaths(rule, projectBrief, artifactIndex),
    },
    missingRequirements: {
      fields: missingFields,
      artifacts: missingArtifacts,
      paths: sortedStrings(item.missingAnyOf),
      recommended: sortedStrings(item.recommendedMissing),
    },
  };
}

function readableReason(item, rule, missingRequirements) {
  const hardMissing = missingRequirements.fields.length
    + missingRequirements.artifacts.length
    + missingRequirements.paths.length;
  const recommendedMissing = missingRequirements.recommended.length;
  const base = `Próxima skill: ${rule.command} (estado ${item.state}, prioridade ${rule.priority}).`;
  if (hardMissing > 0) {
    return `${base} Faltam ${hardMissing} requisitos obrigatórios declarados; abra o detalhe para resolvê-los.`;
  }
  if (recommendedMissing > 0) {
    return `${base} Requisitos obrigatórios atendidos; ${recommendedMissing} recomendações de qualidade seguem pendentes.`;
  }
  return `${base} Todos os requisitos declarados estão atendidos.`;
}

function terminalState(evaluatedSkills, rules) {
  const eligibleStates = evaluatedSkills
    .filter((item) => rules.skills[item.skillId].recommendationEligible)
    .map((item) => item.state);
  if (eligibleStates.includes('blocked')) return 'blocked';
  if (eligibleStates.includes('done')) return 'done';
  if (eligibleStates.length > 0 && eligibleStates.every((state) => state === 'not_applicable')) return 'not_applicable';
  return 'done';
}

export function decideNextSkill({
  rules,
  evaluatedSkills,
  projectBrief = null,
  artifactIndex = null,
}) {
  validateInputs(rules, evaluatedSkills);
  const candidates = evaluatedSkills
    .filter((item) => rules.skills[item.skillId].recommendationEligible && SELECTABLE_STATES.has(item.state))
    .map((item) => ({ item, rule: rules.skills[item.skillId] }))
    .sort((left, right) => left.rule.priority - right.rule.priority
      || STATE_PRIORITY[left.item.state] - STATE_PRIORITY[right.item.state]
      || left.item.skillId.localeCompare(right.item.skillId));

  const selected = candidates[0] || null;
  const base = {
    schemaVersion: 'skill-readiness-decision-v1',
    state: selected?.item.state || terminalState(evaluatedSkills, rules),
    nextSkill: selected ? {
      id: selected.item.skillId,
      command: selected.rule.command,
      state: selected.item.state,
      priority: selected.rule.priority,
    } : null,
  };
  const requirements = selected
    ? requirementSummary(selected.item, selected.rule, projectBrief, artifactIndex)
    : {
      metRequirements: { fields: [], artifacts: [], paths: [] },
      missingRequirements: { fields: [], artifacts: [], paths: [], recommended: [] },
    };
  return {
    ...base,
    ...requirements,
    evidence: evidenceSummary(projectBrief, artifactIndex),
    reason: selected
      ? readableReason(selected.item, selected.rule, requirements.missingRequirements)
      : 'Nenhuma próxima skill elegível: a rota está concluída, não aplicável ou bloqueada pelas regras declaradas.',
  };
}

export const SKILL_READINESS_STATES = PUBLIC_STATES;
