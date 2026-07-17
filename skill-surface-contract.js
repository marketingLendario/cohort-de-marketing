(function publishSkillSurfaceContract(root) {
  'use strict';

  const CATALOG_VERSION = '1.0.0';
  const RULES_VERSION = '0.1.0';
  const PROJECT_BRIEF_VERSION = '1.0.0';
  const ARTIFACT_INDEX_VERSION = 'artifact-index-v1';
  const REQUIRED_FIELD_PATH_COUNT = 120;
  const REQUIRED_STATES = ['available', 'recommended', 'almost', 'blocked', 'not_applicable', 'done'];
  const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const SAFE_TYPE = /^[A-Za-z][A-Za-z0-9]*$/;
  const ENTRY_KEYS = [
    'artifactType',
    'path',
    'sha256',
    'sizeBytes',
    'origin',
    'confirmationStatus',
    'satisfiesCriticalRequirement',
  ];
  const SENSITIVE_REFERENCE_PATTERNS = [
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
    /\bsk-(?:live-|test-|proj-)?[A-Za-z0-9_-]{20,}\b/,
    /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/i,
    /\bglpat-[A-Za-z0-9_-]{20,}\b/i,
    /\bnpm_[A-Za-z0-9]{30,}\b/i,
    /\bpypi-[A-Za-z0-9_-]{20,}\b/i,
    /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/i,
    /\bAIza[A-Za-z0-9_-]{30,}\b/,
    /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/,
  ];
  const SENSITIVE_REFERENCE_TOKENS = new Set([
    'credential', 'credentials', 'credencial', 'credenciais', 'env', 'password', 'passwords',
    'private', 'privado', 'secret', 'secrets', 'segredo', 'segredos', 'senha', 'senhas',
    'token', 'tokens',
  ]);

  class SkillSurfaceContractError extends Error {
    constructor(code, message) {
      super(message);
      this.name = 'SkillSurfaceContractError';
      this.code = code;
    }
  }

  const fail = (code, message) => { throw new SkillSurfaceContractError(code, message); };
  const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  const sorted = (values) => [...values].sort();
  const sameSet = (left, right) => JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
  const exactKeys = (value, expected) => isRecord(value)
    && Object.keys(value).sort().join('|') === [...expected].sort().join('|');

  function isPortableArtifactPath(value) {
    return typeof value === 'string'
      && value.length > 0
      && !value.startsWith('/')
      && !/^[A-Za-z]:[\\/]/.test(value)
      && !value.includes('\\')
      && !/[\u0000-\u001F\u007F-\u009F]/u.test(value)
      && !value.split('/').some((part) => part === '' || part === '.' || part === '..');
  }

  function assertSafeReference(value) {
    if (SENSITIVE_REFERENCE_PATTERNS.some((pattern) => pattern.test(value))) {
      fail('INVALID_ARTIFACT_INDEX', 'Um path de artefato contém uma assinatura sensível.');
    }
  }

  function matchArtifactSegment(value, pattern) {
    if (typeof value !== 'string' || typeof pattern !== 'string' || value.includes('/') || pattern.includes('/')) return false;
    let previous = Array(pattern.length + 1).fill(false);
    previous[0] = true;
    for (let patternIndex = 1; patternIndex <= pattern.length; patternIndex += 1) {
      if (pattern[patternIndex - 1] === '*') previous[patternIndex] = previous[patternIndex - 1];
    }
    for (let valueIndex = 1; valueIndex <= value.length; valueIndex += 1) {
      const current = Array(pattern.length + 1).fill(false);
      for (let patternIndex = 1; patternIndex <= pattern.length; patternIndex += 1) {
        const token = pattern[patternIndex - 1];
        if (token === '*') current[patternIndex] = current[patternIndex - 1] || previous[patternIndex];
        else if (token === '?' || token === value[valueIndex - 1]) current[patternIndex] = previous[patternIndex - 1];
      }
      previous = current;
    }
    return previous[pattern.length];
  }

  function matchesArtifactGlob(relativePath, pattern) {
    if (!isPortableArtifactPath(relativePath) || !isPortableArtifactPath(pattern)
      || pattern.split('/').at(-1) === '**'
      || pattern.split('/').some((part) => part === '**' ? false : part.includes('**'))) return false;
    const valueSegments = relativePath.split('/');
    const patternSegments = pattern.split('/');
    const memo = new Map();
    function matches(valueIndex, patternIndex) {
      const key = `${valueIndex}:${patternIndex}`;
      if (memo.has(key)) return memo.get(key);
      let result;
      if (patternIndex === patternSegments.length) result = valueIndex === valueSegments.length;
      else if (patternSegments[patternIndex] === '**') {
        result = matches(valueIndex, patternIndex + 1)
          || (valueIndex < valueSegments.length && matches(valueIndex + 1, patternIndex));
      } else {
        result = valueIndex < valueSegments.length
          && matchArtifactSegment(valueSegments[valueIndex], patternSegments[patternIndex])
          && matches(valueIndex + 1, patternIndex + 1);
      }
      memo.set(key, result);
      return result;
    }
    return matches(0, 0);
  }

  function validateArtifactRules(rules) {
    if (!isRecord(rules) || !isRecord(rules.artifactGlobs)) {
      fail('INVALID_UNLOCK_RULES', 'As regras de artefatos são inválidas.');
    }
    for (const [artifactType, patterns] of Object.entries(rules.artifactGlobs)) {
      if (!SAFE_TYPE.test(artifactType) || !Array.isArray(patterns) || patterns.length === 0) {
        fail('INVALID_UNLOCK_RULES', 'Uma declaração de artefato é inválida.');
      }
      for (const pattern of patterns) {
        if (!isPortableArtifactPath(pattern)
          || pattern.split('/').at(-1) === '**'
          || pattern.split('/').some((part) => part === '**' ? false : part.includes('**'))) {
          fail('INVALID_UNLOCK_RULES', 'Um glob de artefato não é portátil ou confinado.');
        }
        assertSafeReference(pattern);
      }
    }
    if (!isRecord(rules.artifactIndex)
      || rules.artifactIndex.schemaVersion !== ARTIFACT_INDEX_VERSION
      || typeof rules.artifactIndex.confirmationRequiredByDefault !== 'boolean') {
      fail('INVALID_UNLOCK_RULES', 'A política do ArtifactIndex está ausente ou inválida.');
    }
    return rules.artifactGlobs;
  }

  function collectCanonicalFieldPaths(schema) {
    const fields = new Set();
    const walk = (prefix, definition) => {
      for (const [name, child] of Object.entries(definition.properties || {})) {
        const fieldPath = prefix ? `${prefix}.${name}` : name;
        fields.add(fieldPath);
        if (child?.type === 'object' && child.properties) walk(fieldPath, child);
      }
    };
    for (const [group, definition] of Object.entries(schema?.properties || {})) {
      if (definition?.type === 'object' && definition.properties) walk(group, definition);
    }
    return fields;
  }

  function portableReference(value, allowBackslash = false) {
    if (typeof value !== 'string' || value.length === 0 || value.length > 256) return false;
    const candidate = allowBackslash ? value.replaceAll('\\', '/') : value;
    if (!allowBackslash && value.includes('\\')) return false;
    if (candidate.startsWith('/') || /^[A-Za-z]:\//.test(candidate) || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(candidate)) return false;
    return candidate.split('/').every((segment) => segment && segment !== '.' && segment !== '..'
      && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment)
      && !segment.toLowerCase().split(/[._-]+/).some((token) => SENSITIVE_REFERENCE_TOKENS.has(token)));
  }

  function validDateTime(value) {
    if (typeof value !== 'string') return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/i.exec(value);
    if (!match) return false;
    const [, yearText, monthText, dayText, hourText, minuteText, secondText, , offsetHourText, offsetMinuteText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1]
      && Number(hourText) <= 23 && Number(minuteText) <= 59 && Number(secondText) <= 60
      && (!offsetHourText || (Number(offsetHourText) <= 23 && Number(offsetMinuteText) <= 59));
  }

  function typeMatches(value, type) {
    if (type === 'object') return isRecord(value);
    if (type === 'array') return Array.isArray(value);
    if (type === 'integer') return Number.isInteger(value);
    if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
    return typeof value === type;
  }

  function validateSchemaNode(value, definition, context, path = '$') {
    if (definition === false) return [`${path}: campo não permitido`];
    if (!isRecord(definition)) return [];
    const errors = [];
    if (definition.$ref) {
      const referenced = context.schemas.get(definition.$ref);
      if (!referenced) return [`${path}: referência de schema desconhecida`];
      errors.push(...validateSchemaNode(value, referenced, context, path));
    }
    if (definition.const !== undefined && value !== definition.const) errors.push(`${path}: valor deve ser ${definition.const}`);
    if (definition.enum && !definition.enum.includes(value)) errors.push(`${path}: valor fora do enum`);
    if (definition.type && !typeMatches(value, definition.type)) return [...errors, `${path}: tipo ${definition.type} esperado`];
    if (typeof value === 'string') {
      if (definition.minLength != null && value.length < definition.minLength) errors.push(`${path}: texto curto demais`);
      if (definition.maxLength != null && value.length > definition.maxLength) errors.push(`${path}: texto longo demais`);
      if (definition.pattern && !(new RegExp(definition.pattern)).test(value)) errors.push(`${path}: formato inválido`);
      if (definition.format === 'date-time' && !validDateTime(value)) errors.push(`${path}: data inválida`);
      if (definition.format === 'canonical-field-path' && !context.fieldPaths.has(value)) errors.push(`${path}: field path inválido`);
      if (definition.format === 'portable-artifact-reference' && !portableReference(value, false)) errors.push(`${path}: referência inválida`);
      if (definition.format === 'portable-legacy-source-path' && !portableReference(value, true)) errors.push(`${path}: referência legada inválida`);
    }
    if (typeof value === 'number') {
      if (definition.minimum != null && value < definition.minimum) errors.push(`${path}: abaixo do mínimo`);
      if (definition.maximum != null && value > definition.maximum) errors.push(`${path}: acima do máximo`);
    }
    if (Array.isArray(value)) {
      if (definition.minItems != null && value.length < definition.minItems) errors.push(`${path}: poucos itens`);
      if (definition.maxItems != null && value.length > definition.maxItems) errors.push(`${path}: itens demais`);
      value.forEach((item, index) => errors.push(...validateSchemaNode(item, definition.items || {}, context, `${path}[${index}]`)));
    }
    if (isRecord(value)) {
      for (const required of definition.required || []) {
        if (!Object.hasOwn(value, required)) errors.push(`${path}.${required}: obrigatório`);
      }
      for (const key of Object.keys(value)) {
        if (definition.propertyNames?.format === 'canonical-field-path' && !context.fieldPaths.has(key)) {
          errors.push(`${path}.${key}: nome de campo inválido`);
        }
        if (Object.hasOwn(definition.properties || {}, key)) {
          errors.push(...validateSchemaNode(value[key], definition.properties[key], context, `${path}.${key}`));
        } else if (definition.additionalProperties === false) {
          errors.push(`${path}.${key}: propriedade adicional não permitida`);
        } else if (isRecord(definition.additionalProperties)) {
          errors.push(...validateSchemaNode(value[key], definition.additionalProperties, context, `${path}.${key}`));
        }
      }
    }
    return errors;
  }

  function schemaContext(legacySchema, projectBriefSchema) {
    if (!isRecord(legacySchema) || !isRecord(projectBriefSchema)
      || legacySchema.properties?.schemaVersion?.const !== '0.1.0'
      || projectBriefSchema.properties?.schemaVersion?.const !== PROJECT_BRIEF_VERSION
      || projectBriefSchema.properties?.data?.$ref !== legacySchema.$id) {
      fail('INVALID_PROJECT_BRIEF_SCHEMA', 'Os schemas públicos do ProjectBrief estão ausentes, divergentes ou em versão não suportada.');
    }
    const fieldPaths = collectCanonicalFieldPaths(legacySchema);
    if (fieldPaths.size !== REQUIRED_FIELD_PATH_COUNT) {
      fail('INVALID_PROJECT_BRIEF_SCHEMA', 'O schema público não contém os 120 campos/grupos canônicos.');
    }
    return { fieldPaths, schemas: new Map([[legacySchema.$id, legacySchema], [projectBriefSchema.$id, projectBriefSchema]]) };
  }

  function validateProjectBrief(projectBrief, legacySchema, projectBriefSchema) {
    const context = schemaContext(legacySchema, projectBriefSchema);
    const errors = validateSchemaNode(projectBrief, projectBriefSchema, context);
    if (errors.length) fail('INVALID_PROJECT_BRIEF', `ProjectBrief v1 inválido: ${errors.slice(0, 3).join('; ')}`);
    return projectBrief;
  }

  function validateContracts({ catalog, rules, legacySchema, projectBriefSchema }) {
    if (!isRecord(catalog) || catalog.schemaVersion !== CATALOG_VERSION
      || !Array.isArray(catalog.skills) || catalog.skills.length === 0 || !Array.isArray(catalog.edges)) {
      fail('INVALID_SKILL_CATALOG', 'skill-catalog.json ausente, malformado ou em versão não suportada.');
    }
    if (!isRecord(rules) || rules.schemaVersion !== RULES_VERSION || !Array.isArray(rules.states)
      || !isRecord(rules.skills)) {
      fail('INVALID_UNLOCK_RULES', 'skill-unlock-rules.json ausente, malformado ou em versão não suportada.');
    }
    if (!sameSet(rules.states, REQUIRED_STATES)) {
      fail('INVALID_UNLOCK_RULES', 'skill-unlock-rules.json não declara exatamente os estados públicos.');
    }
    const artifactGlobs = validateArtifactRules(rules);
    const { fieldPaths } = schemaContext(legacySchema, projectBriefSchema);
    const ids = catalog.skills.map((skill) => skill?.id);
    if (ids.some((id) => typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(id)) || new Set(ids).size !== ids.length) {
      fail('INVALID_SKILL_ID', 'O catálogo contém ID de skill inválido ou duplicado.');
    }
    for (const skill of catalog.skills) {
      if (skill.command !== `/${skill.id}` || typeof skill.title !== 'string' || typeof skill.description !== 'string'
        || typeof skill.phase !== 'string' || typeof skill.phaseColor !== 'string' || !Number.isInteger(skill.order)
        || typeof skill.kind !== 'string' || typeof skill.level !== 'string' || !Array.isArray(skill.prerequisites)
        || !Array.isArray(skill.outputs) || !Array.isArray(skill.primaryArtifacts) || !Array.isArray(skill.feeds)
        || typeof skill.guard !== 'string' || typeof skill.artifactSummary !== 'string') {
        fail('INVALID_SKILL_CATALOG', 'Uma skill do catálogo está incompleta.');
      }
    }
    if (!sameSet(ids, Object.keys(rules.skills))) fail('SURFACE_ID_MISMATCH', 'Catálogo e regras divergem na lista de skills.');
    const artifactTypes = new Set(Object.keys(artifactGlobs));
    const assertFields = (skillId, values) => {
      if (!Array.isArray(values) || values.some((field) => typeof field !== 'string' || !field)) {
        fail('INVALID_UNLOCK_RULES', `Uma lista de campos de ${skillId} é inválida.`);
      }
      if (values.some((field) => !fieldPaths.has(field))) fail('RULE_ORPHAN_FIELD', 'Uma regra referencia campo inexistente no ProjectBrief.');
    };
    const assertArtifacts = (values) => {
      if (!Array.isArray(values)) fail('INVALID_UNLOCK_RULES', 'Uma lista de artefatos da regra é inválida.');
      if (values.some((artifact) => !artifactTypes.has(artifact))) fail('RULE_ORPHAN_ARTIFACT', 'Uma regra referencia artefato inexistente.');
    };
    const validScalar = (candidate) => ['string', 'number', 'boolean'].includes(typeof candidate)
      && (typeof candidate !== 'string' || candidate.trim().length > 0)
      && (typeof candidate !== 'number' || Number.isFinite(candidate));
    const validMatchValue = (value) => validScalar(value)
      || (Array.isArray(value) && value.length > 0 && value.every(validScalar));
    for (const [skillId, rule] of Object.entries(rules.skills)) {
      if (!isRecord(rule) || rule.command !== `/${skillId}`) fail('INVALID_UNLOCK_RULES', 'Uma regra de skill está ausente ou incompleta.');
      for (const key of ['primaryArtifacts', 'requiredArtifacts', 'recommendedArtifacts']) assertArtifacts(rule[key] || []);
      for (const key of ['requiredFields', 'recommendedFields']) assertFields(skillId, rule[key] || []);
      if ((Object.hasOwn(rule, 'anyOf') && (!Array.isArray(rule.anyOf) || rule.anyOf.length === 0))
        || (Object.hasOwn(rule, 'notApplicableWhen')
          && (!Array.isArray(rule.notApplicableWhen) || rule.notApplicableWhen.length === 0))) {
        fail('INVALID_UNLOCK_RULES', 'Uma condição declarada da regra deve ser uma lista não vazia.');
      }
      for (const group of rule.anyOf || []) {
        if (!isRecord(group) || typeof group.label !== 'string' || group.label.trim().length === 0
          || Object.keys(group).some((key) => !['label', 'fields', 'artifacts', 'matches'].includes(key))) {
          fail('INVALID_UNLOCK_RULES', 'Um grupo anyOf é inválido.');
        }
        const hasFields = Object.hasOwn(group, 'fields');
        const hasArtifacts = Object.hasOwn(group, 'artifacts');
        const hasMatches = Object.hasOwn(group, 'matches');
        if ((hasFields && (!Array.isArray(group.fields) || group.fields.length === 0))
          || (hasArtifacts && (!Array.isArray(group.artifacts) || group.artifacts.length === 0))
          || (hasMatches && (!isRecord(group.matches) || Object.keys(group.matches).length === 0))
          || (!hasFields && !hasArtifacts && !hasMatches)) {
          fail('INVALID_UNLOCK_RULES', 'Um grupo anyOf precisa declarar ao menos uma restrição efetiva.');
        }
        assertFields(skillId, group.fields || []);
        assertArtifacts(group.artifacts || []);
        if (hasMatches && Object.entries(group.matches).some(([field, expected]) => !fieldPaths.has(field) || !validMatchValue(expected))) {
          fail('RULE_ORPHAN_FIELD', 'Um grupo anyOf referencia match inexistente ou inválido.');
        }
      }
      for (const condition of rule.notApplicableWhen || []) {
        const hasEquals = isRecord(condition) && Object.hasOwn(condition, 'equals');
        const hasIn = isRecord(condition) && Object.hasOwn(condition, 'in');
        if (isRecord(condition) && typeof condition.field === 'string' && !fieldPaths.has(condition.field)) {
          fail('RULE_ORPHAN_FIELD', 'Uma condição notApplicableWhen referencia campo inexistente.');
        }
        if (!isRecord(condition) || !fieldPaths.has(condition.field)
          || typeof condition.reason !== 'string' || condition.reason.trim().length === 0
          || hasEquals === hasIn
          || (hasEquals && !validScalar(condition.equals))
          || (hasIn && (!Array.isArray(condition.in) || condition.in.length === 0 || !condition.in.every(validScalar)))
          || Object.keys(condition).some((key) => !['field', 'equals', 'in', 'reason'].includes(key))) {
          fail('INVALID_UNLOCK_RULES', 'Uma condição notApplicableWhen é inexistente, ambígua ou inválida.');
        }
      }
    }
    const idSet = new Set(ids);
    for (const edge of catalog.edges) {
      if (!isRecord(edge) || !idSet.has(edge.from) || !idSet.has(edge.to) || edge.from === edge.to
        || !['dependency', 'feedback', 'utility'].includes(edge.type)) {
        fail('CATALOG_ORPHAN_EDGE', 'O catálogo contém edge órfã ou inválida.');
      }
    }
    const skills = catalog.skills.map((skill) => ({
      ...skill,
      name: skill.title,
      type: skill.kind,
      guards: skill.guard,
      artifacts: skill.artifactSummary,
      rule: rules.skills[skill.id],
    }));
    return { catalog, rules, legacySchema, projectBriefSchema, skills, edges: catalog.edges.map((edge) => ({ ...edge })) };
  }

  function createReadinessContractRefs(inputs) {
    const contract = validateContracts(inputs);
    return Object.freeze({
      schemaVersion: 'skill-readiness-contract-refs-v1',
      rulesSchemaVersion: RULES_VERSION,
      projectBriefSchemaVersion: PROJECT_BRIEF_VERSION,
      artifactIndexSchemaVersion: ARTIFACT_INDEX_VERSION,
      artifactTypes: sorted(Object.keys(contract.rules.artifactGlobs)),
      skills: Object.fromEntries(contract.skills.map((skill) => [skill.id, Object.freeze({
        requiredFields: sorted(skill.rule.requiredFields || []),
        requiredArtifacts: sorted(skill.rule.requiredArtifacts || []),
        anyOfLabels: sorted((skill.rule.anyOf || []).map((group) => group.label)),
        recommended: sorted([
          ...(skill.rule.recommendedFields || []),
          ...(skill.rule.recommendedArtifacts || []),
        ]),
      })])),
    });
  }

  function validateArtifactIndex(artifactIndex, rules, projectBrief = null) {
    const globs = validateArtifactRules(rules);
    if (!exactKeys(artifactIndex, ['schemaVersion', 'project', 'rules', 'entries', 'summary'])
      || artifactIndex.schemaVersion !== ARTIFACT_INDEX_VERSION || !exactKeys(artifactIndex.project, ['slug'])
      || !SAFE_SLUG.test(artifactIndex.project.slug) || !exactKeys(artifactIndex.rules, ['schemaVersion', 'confirmationRequiredByDefault'])
      || artifactIndex.rules.schemaVersion !== String(rules.schemaVersion || 'unknown')
      || artifactIndex.rules.confirmationRequiredByDefault !== rules.artifactIndex.confirmationRequiredByDefault
      || !Array.isArray(artifactIndex.entries) || !exactKeys(artifactIndex.summary, ['total', 'confirmed', 'pendingConfirmation'])) {
      fail('INVALID_ARTIFACT_INDEX', 'O ArtifactIndex não corresponde ao contrato v1.');
    }
    const projectSlug = projectBrief?.data?.project?.slug;
    if (projectSlug && artifactIndex.project.slug !== projectSlug) fail('INVALID_ARTIFACT_INDEX', 'ArtifactIndex pertence a outro projeto.');
    const paths = new Set();
    for (const entry of artifactIndex.entries) {
      if (!exactKeys(entry, ENTRY_KEYS) || !SAFE_TYPE.test(entry.artifactType) || !Object.hasOwn(globs, entry.artifactType)
        || !isPortableArtifactPath(entry.path) || !/^[a-f0-9]{64}$/.test(entry.sha256)
        || !Number.isSafeInteger(entry.sizeBytes) || entry.sizeBytes < 0
        || !exactKeys(entry.origin, ['kind', 'rule', 'patterns']) || entry.origin.kind !== 'declared_glob'
        || entry.origin.rule !== `artifactGlobs.${entry.artifactType}` || !Array.isArray(entry.origin.patterns) || entry.origin.patterns.length === 0
        || !['confirmed', 'pending_confirmation'].includes(entry.confirmationStatus)
        || entry.satisfiesCriticalRequirement !== (entry.confirmationStatus === 'confirmed')) {
        fail('INVALID_ARTIFACT_INDEX', 'Uma entrada do ArtifactIndex é inválida.');
      }
      for (const reference of [entry.artifactType, entry.path, entry.origin.kind, entry.origin.rule, ...entry.origin.patterns]) assertSafeReference(reference);
      if (!entry.origin.patterns.every((pattern) => isPortableArtifactPath(pattern)
        && globs[entry.artifactType].includes(pattern) && matchesArtifactGlob(entry.path, pattern))) {
        fail('INVALID_ARTIFACT_INDEX', 'A proveniência de uma entrada não corresponde ao path indexado.');
      }
      if (paths.has(entry.path)) fail('INVALID_ARTIFACT_INDEX', 'O ArtifactIndex contém um path global duplicado.');
      paths.add(entry.path);
    }
    const confirmed = artifactIndex.entries.filter((entry) => entry.confirmationStatus === 'confirmed').length;
    if (artifactIndex.summary.total !== artifactIndex.entries.length || artifactIndex.summary.confirmed !== confirmed
      || artifactIndex.summary.pendingConfirmation !== artifactIndex.entries.length - confirmed) {
      fail('INVALID_ARTIFACT_INDEX', 'O resumo do ArtifactIndex é inconsistente.');
    }
    return artifactIndex;
  }

  function valueAt(document, dottedPath) {
    return dottedPath.split('.').reduce((value, key) => value?.[key], document);
  }

  function filled(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (isRecord(value)) return Object.values(value).some(filled);
    return value !== undefined && value !== null && value !== '' && value !== false && value !== 0;
  }

  function evaluateSkills({
    catalog,
    rules,
    legacySchema,
    projectBriefSchema,
    projectBrief = null,
    artifactIndex = null,
    allowPartialProjectBrief = false,
  }) {
    const contract = validateContracts({ catalog, rules, legacySchema, projectBriefSchema });
    if (projectBrief && Object.keys(projectBrief).length > 0
      && !(allowPartialProjectBrief && projectBrief.status === 'draft')) {
      validateProjectBrief(projectBrief, legacySchema, projectBriefSchema);
    }
    const briefData = projectBrief?.data || {};
    const artifacts = {};
    if (artifactIndex != null) {
      validateArtifactIndex(artifactIndex, rules, projectBrief);
      for (const entry of artifactIndex.entries) if (entry.confirmationStatus === 'confirmed') artifacts[entry.artifactType] = true;
    }
    const conditionMatches = (condition) => {
      const value = valueAt(briefData, condition.field);
      if (Object.hasOwn(condition, 'equals')) return value === condition.equals;
      if (Array.isArray(condition.in)) return condition.in.includes(value);
      return false;
    };
    const groupMatches = (group) => {
      if (group.matches && Object.entries(group.matches).some(([field, expected]) => {
        const value = valueAt(briefData, field);
        return Array.isArray(expected) ? !expected.includes(value) : value !== expected;
      })) return false;
      return (group.fields || []).every((field) => filled(valueAt(briefData, field)))
        && (group.artifacts || []).every((artifact) => Boolean(artifacts[artifact]));
    };
    return contract.skills.map((skill) => {
      const rule = skill.rule;
      const primaryDone = (rule.primaryArtifacts || []).length > 0 && rule.primaryArtifacts.every((artifact) => artifacts[artifact]);
      const notApplicable = (rule.notApplicableWhen || []).find(conditionMatches);
      if (notApplicable) return { skillId: skill.id, skill, rule, state: 'not_applicable', missingFields: [], missingArtifacts: [], missingAnyOf: [], metAnyOf: [], recommendedMissing: [], reason: notApplicable.reason };
      if (primaryDone) return { skillId: skill.id, skill, rule, state: 'done', missingFields: [], missingArtifacts: [], missingAnyOf: [], metAnyOf: [], recommendedMissing: [] };
      const missingFields = (rule.requiredFields || []).filter((field) => !filled(valueAt(briefData, field)));
      const missingArtifacts = (rule.requiredArtifacts || []).filter((artifact) => !artifacts[artifact]);
      const groups = rule.anyOf || [];
      const metAnyOf = groups.filter(groupMatches).map((group) => group.label);
      const missingAnyOf = groups.length === 0 || metAnyOf.length > 0 ? [] : groups.map((group) => group.label);
      const recommendedMissing = [
        ...(rule.recommendedFields || []).filter((field) => !filled(valueAt(briefData, field))),
        ...(rule.recommendedArtifacts || []).filter((artifact) => !artifacts[artifact]),
      ];
      const hardMissing = missingFields.length + missingArtifacts.length + missingAnyOf.length;
      let state = 'available';
      if (hardMissing > 0) state = hardMissing <= 2 ? 'almost' : 'blocked';
      else if (recommendedMissing.length > 0) state = 'recommended';
      return { skillId: skill.id, skill, rule, state, missingFields, missingArtifacts, missingAnyOf, metAnyOf, recommendedMissing };
    });
  }

  function buildLayout(skills, columns = 11) {
    return Object.fromEntries(skills.map((skill, index) => [skill.id, { col: index % columns, row: Math.floor(index / columns) * 2 }]));
  }

  root.SkillSurfaceContract = Object.freeze({
    SkillSurfaceContractError,
    collectCanonicalFieldPaths,
    isPortableArtifactPath,
    matchArtifactSegment,
    matchesArtifactGlob,
    validateArtifactRules,
    validateProjectBrief,
    validateContracts,
    createReadinessContractRefs,
    validateArtifactIndex,
    evaluateSkills,
    buildLayout,
  });
}(typeof window === 'object' ? window : globalThis));
