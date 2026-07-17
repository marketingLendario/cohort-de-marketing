const PUBLIC_STATES = Object.freeze([
  'available',
  'recommended',
  'almost',
  'blocked',
  'not_applicable',
  'done',
]);

const SELECTABLE_STATES = new Set(['available', 'recommended', 'almost', 'blocked']);
const SUPPORTED_CONTRACTS = Object.freeze({
  refs: 'skill-readiness-contract-refs-v1',
  rules: '0.1.0',
  projectBrief: '1.0.0',
  artifactIndex: 'artifact-index-v1',
});
const PROJECT_BRIEF_STATUSES = new Set(['draft', 'active', 'superseded']);
const SENSITIVE_PATH_TOKENS = new Set([
  'credential', 'credentials', 'credencial', 'credenciais', 'env', 'password', 'passwords',
  'private', 'privado', 'secret', 'secrets', 'segredo', 'segredos', 'senha', 'senhas',
  'token', 'tokens',
]);

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
const sortedStrings = (values) => [...new Set(values)].sort();
const sameSet = (left, right) => JSON.stringify(sortedStrings(left)) === JSON.stringify(sortedStrings(right));
const exactKeys = (value, expected) => isRecord(value)
  && Object.keys(value).sort().join('|') === [...expected].sort().join('|');

function safeIdentifierList(values) {
  return Array.isArray(values)
    && values.every((value) => typeof value === 'string' && value.length > 0)
    && new Set(values).size === values.length;
}

function isSafePortablePath(value) {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= 512
    && !value.startsWith('/')
    && !/^[A-Za-z]:[\\/]/.test(value)
    && !value.includes('\\')
    && !/[\u0000-\u001F\u007F-\u009F]/u.test(value)
    && value.split('/').every((segment) => segment && segment !== '.' && segment !== '..'
      && !segment.toLowerCase().split(/[._-]+/).some((token) => SENSITIVE_PATH_TOKENS.has(token)));
}

function validateContractRefs(contractRefs, rules) {
  if (!exactKeys(contractRefs, [
    'schemaVersion',
    'rulesSchemaVersion',
    'projectBriefSchemaVersion',
    'artifactIndexSchemaVersion',
    'artifactTypes',
    'skills',
  ])
    || contractRefs.schemaVersion !== SUPPORTED_CONTRACTS.refs
    || contractRefs.rulesSchemaVersion !== SUPPORTED_CONTRACTS.rules
    || contractRefs.projectBriefSchemaVersion !== SUPPORTED_CONTRACTS.projectBrief
    || contractRefs.artifactIndexSchemaVersion !== SUPPORTED_CONTRACTS.artifactIndex
    || !isRecord(contractRefs.skills)
    || !safeIdentifierList(contractRefs.artifactTypes)) {
    fail('INVALID_CONTRACT_REFS', 'As referências do contrato público estão ausentes ou em versão não suportada.');
  }
  if (!sameSet(Object.keys(contractRefs.skills), Object.keys(rules.skills))) {
    fail('INVALID_CONTRACT_REFS', 'As referências públicas divergem das skills declaradas.');
  }
  for (const [skillId, refs] of Object.entries(contractRefs.skills)) {
    if (!exactKeys(refs, ['requiredFields', 'requiredArtifacts', 'anyOfLabels', 'recommended'])
      || ![refs.requiredFields, refs.requiredArtifacts, refs.anyOfLabels, refs.recommended].every(safeIdentifierList)) {
      fail('INVALID_CONTRACT_REFS', `As referências públicas de ${skillId} são inválidas.`);
    }
  }
}

function validateRules(rules, contractRefs) {
  if (!isRecord(rules) || rules.schemaVersion !== SUPPORTED_CONTRACTS.rules
    || !Array.isArray(rules.states) || !isRecord(rules.skills)
    || !sameSet(rules.states, PUBLIC_STATES)) {
    fail('INVALID_READINESS_RULES', 'As regras não correspondem ao contrato público suportado.');
  }
  validateContractRefs(contractRefs, rules);
  for (const [skillId, rule] of Object.entries(rules.skills)) {
    if (!isRecord(rule)) fail('INVALID_READINESS_RULES', `A regra de ${skillId} está ausente.`);
    if (rule.command !== `/${skillId}`) {
      fail('INVALID_SKILL_COMMAND', `O comando canônico de ${skillId} não corresponde ao ID.`);
    }
    if (!Number.isSafeInteger(rule.priority) || rule.priority < 0) {
      fail('INVALID_SKILL_PRIORITY', `A prioridade declarada de ${skillId} é inválida.`);
    }
    if (typeof rule.recommendationEligible !== 'boolean') {
      fail('INVALID_RECOMMENDATION_POLICY', `A elegibilidade do recomendador para ${skillId} não é explícita.`);
    }
    const refs = contractRefs.skills[skillId];
    const declared = {
      requiredFields: rule.requiredFields || [],
      requiredArtifacts: rule.requiredArtifacts || [],
      anyOfLabels: (rule.anyOf || []).map((group) => group?.label),
      recommended: [...(rule.recommendedFields || []), ...(rule.recommendedArtifacts || [])],
    };
    for (const key of Object.keys(declared)) {
      if (!safeIdentifierList(declared[key]) || !sameSet(declared[key], refs[key])) {
        fail('INVALID_CONTRACT_REFS', `A regra de ${skillId} diverge das referências públicas em ${key}.`);
      }
    }
  }
}

function assertSubset(values, allowed, skillId, key) {
  if (!safeIdentifierList(values) || values.some((value) => !allowed.includes(value))) {
    fail('UNDECLARED_REQUIREMENT_REFERENCE', `A avaliação de ${skillId} contém referência não declarada em ${key}.`);
  }
}

function validateEvaluations(rules, contractRefs, evaluatedSkills) {
  if (!Array.isArray(evaluatedSkills) || evaluatedSkills.length === 0) {
    fail('INVALID_SKILL_EVALUATION', 'A avaliação de skills está ausente ou vazia.');
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
    const refs = contractRefs.skills[item.skillId];
    assertSubset(item.missingFields, refs.requiredFields, item.skillId, 'missingFields');
    assertSubset(item.missingArtifacts, refs.requiredArtifacts, item.skillId, 'missingArtifacts');
    assertSubset(item.missingAnyOf, refs.anyOfLabels, item.skillId, 'missingAnyOf');
    assertSubset(item.metAnyOf, refs.anyOfLabels, item.skillId, 'metAnyOf');
    assertSubset(item.recommendedMissing, refs.recommended, item.skillId, 'recommendedMissing');
  }
  if (!sameSet(seen, Object.keys(rules.skills))) {
    fail('INVALID_SKILL_EVALUATION', 'Regras e avaliações divergem na lista de skills.');
  }
}

function validateEvidence(projectBrief, artifactIndex, contractRefs) {
  if (projectBrief != null && (!isRecord(projectBrief)
    || projectBrief.schemaVersion !== SUPPORTED_CONTRACTS.projectBrief
    || !PROJECT_BRIEF_STATUSES.has(projectBrief.status)
    || !isRecord(projectBrief.data))) {
    fail('INVALID_PROJECT_BRIEF_VERSION', 'O ProjectBrief está ausente, malformado ou em versão não suportada.');
  }
  if (artifactIndex != null) {
    if (!isRecord(artifactIndex) || artifactIndex.schemaVersion !== SUPPORTED_CONTRACTS.artifactIndex) {
      fail('INVALID_ARTIFACT_INDEX_VERSION', 'O ArtifactIndex está ausente, malformado ou em versão não suportada.');
    }
    const summary = artifactIndex.summary;
    if (!isRecord(summary) || !Array.isArray(artifactIndex.entries)
      || !['total', 'confirmed', 'pendingConfirmation'].every((key) => Number.isSafeInteger(summary[key]) && summary[key] >= 0)
      || summary.total !== summary.confirmed + summary.pendingConfirmation
      || summary.total !== artifactIndex.entries.length) {
      fail('INVALID_ARTIFACT_INDEX', 'O resumo do ArtifactIndex é inconsistente.');
    }
    for (const entry of artifactIndex.entries) {
      if (!isRecord(entry) || !contractRefs.artifactTypes.includes(entry.artifactType)
        || !['confirmed', 'pending_confirmation'].includes(entry.confirmationStatus)
        || !isSafePortablePath(entry.path)) {
        fail('INVALID_ARTIFACT_INDEX', 'Uma entrada do ArtifactIndex não corresponde às categorias públicas.');
      }
    }
  }
}

function evidenceSummary(projectBrief, artifactIndex) {
  return {
    projectBrief: {
      present: projectBrief != null,
      contract: projectBrief == null ? 'none' : 'project-brief-v1',
      status: projectBrief == null ? 'not_present' : projectBrief.status,
    },
    artifactIndex: {
      present: artifactIndex != null,
      contract: artifactIndex == null ? 'none' : 'artifact-index-v1',
      total: artifactIndex?.summary?.total || 0,
      confirmed: artifactIndex?.summary?.confirmed || 0,
      pendingConfirmation: artifactIndex?.summary?.pendingConfirmation || 0,
    },
  };
}

function requirementSummary(item, rule) {
  return {
    metRequirements: {
      fields: sortedStrings((rule.requiredFields || []).filter((field) => !item.missingFields.includes(field))),
      artifacts: sortedStrings((rule.requiredArtifacts || []).filter((artifact) => !item.missingArtifacts.includes(artifact))),
      paths: sortedStrings(item.metAnyOf),
    },
    missingRequirements: {
      fields: sortedStrings(item.missingFields),
      artifacts: sortedStrings(item.missingArtifacts),
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
  contractRefs,
  evaluatedSkills,
  projectBrief = null,
  artifactIndex = null,
}) {
  validateRules(rules, contractRefs);
  validateEvaluations(rules, contractRefs, evaluatedSkills);
  validateEvidence(projectBrief, artifactIndex, contractRefs);
  const candidates = evaluatedSkills
    .filter((item) => rules.skills[item.skillId].recommendationEligible && SELECTABLE_STATES.has(item.state))
    .map((item) => ({ item, rule: rules.skills[item.skillId] }))
    .sort((left, right) => left.rule.priority - right.rule.priority
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
    ? requirementSummary(selected.item, selected.rule)
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
