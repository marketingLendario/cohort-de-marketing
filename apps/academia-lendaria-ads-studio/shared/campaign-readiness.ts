/**
 * Contrato `campaign-readiness.v1` (STORY-12.W1.1 / ADR-002).
 *
 * Módulo puro e agnóstico de ambiente — consumível tanto pelo browser
 * (`src/lib/campaign-readiness.ts`) quanto por um futuro consumidor server-side
 * (enforcement previsto para 12.W4.2/12.W4.1, ADR-002 §Decisão item 2). Não
 * importa nada de `@/generated/*`, `@supabase/*`, `node:*` nem globals de DOM —
 * recebe como entrada dados já resolvidos pelo chamador (evaluations de skill
 * já computadas por `evaluateProjectSkills`, dados estruturais do projeto e um
 * "seed" textual para o fingerprint) e devolve um snapshot serializável.
 *
 * Reuso deliberado (Dev Notes da story): a matriz de requisitos NÃO é
 * duplicada aqui. Cada capability aponta para uma skill de `data/skill-unlock-rules.json`
 * (via `evaluateProjectSkills`, que já resolve campos/artefatos/ordem) ou é
 * `structural` (hoje só `campaign.create`, que não é uma skill).
 */

// ---------------------------------------------------------------------------
// Contrato público (ADR-002 §Contrato de prontidão)
// ---------------------------------------------------------------------------

export type CampaignReadinessState = 'blocked' | 'ready_with_warnings' | 'ready';

export type CampaignCapability =
  | 'campaign.create'
  | 'campaign.tracking'
  | 'campaign.brief'
  | 'campaign.structure'
  | 'campaign.measure'
  | 'campaign.diagnose';

export const CAMPAIGN_CAPABILITIES: readonly CampaignCapability[] = [
  'campaign.create',
  'campaign.tracking',
  'campaign.brief',
  'campaign.structure',
  'campaign.measure',
  'campaign.diagnose',
];

export interface CampaignReadinessBlockingEntry {
  code: string;
  label: string;
  source: 'briefing' | 'artifact' | 'skill' | 'tracking';
  field?: string;
  artifactType?: string;
  action: { kind: 'inline' | 'briefing' | 'journey'; target: string };
}

export interface CampaignReadinessNote {
  code: string;
  label: string;
  source: string;
}

export interface CampaignReadinessSnapshot {
  contractVersion: 'campaign-readiness.v1';
  target: CampaignCapability;
  state: CampaignReadinessState;
  capability: { allowed: boolean; label: string; skillId?: string };
  blocking: CampaignReadinessBlockingEntry[];
  warnings: CampaignReadinessNote[];
  satisfied: CampaignReadinessNote[];
  nextAction: { label: string; target: string } | null;
  inputFingerprint: string;
  sourceRevision: number | null;
  computedAt: string;
}

/** Contrato de erro compartilhado (ADR-002 §Observabilidade e erros; usável por browser e, na W4, pelo server). */
export type CampaignReadinessErrorCode = 'READINESS_BLOCKED' | 'STALE_READINESS';

export interface CampaignReadinessError {
  code: CampaignReadinessErrorCode;
  message: string;
  target: CampaignCapability;
  blocking: CampaignReadinessBlockingEntry[];
}

// ---------------------------------------------------------------------------
// Mapeamento declarativo (cópia versionada de data/campaign-readiness-capabilities.json)
// ---------------------------------------------------------------------------
//
// A fonte canônica é o arquivo JSON no repo (ADR-002: "o Studio consome uma
// cópia versionada e valida a versão"). `shared/campaign-readiness.test.ts`
// lê o JSON do disco e verifica deep-equality contra a cópia abaixo — drift
// vira teste vermelho, sem precisar do generator de `scripts/` (fora do
// file_scope desta story).

export type CampaignCapabilityKind = 'structural' | 'skill';

export interface CampaignCapabilityRule {
  label: string;
  kind: CampaignCapabilityKind;
  skillId?: string;
}

export type CampaignCapabilityMap = Record<CampaignCapability, CampaignCapabilityRule>;

export const CAMPAIGN_READINESS_CAPABILITIES_VERSION = '0.1.0';

export const CAMPAIGN_READINESS_CAPABILITIES: CampaignCapabilityMap = {
  'campaign.create': { label: 'Criar campanha', kind: 'structural' },
  'campaign.tracking': { label: 'Tracking da campanha', kind: 'skill', skillId: 'zelador' },
  'campaign.brief': { label: 'Briefing de criativos', kind: 'skill', skillId: 'briefista' },
  'campaign.structure': { label: 'Estrutura da campanha', kind: 'skill', skillId: 'estruturador' },
  'campaign.measure': { label: 'Leitura de métricas', kind: 'skill', skillId: 'leitor-de-metricas' },
  'campaign.diagnose': { label: 'Diagnóstico da campanha', kind: 'skill', skillId: 'diagnosticador' },
};

/**
 * Verifica que um subconjunto de skill ids (as capabilities mapeadas) não tem
 * ciclo nos edges de dependência declarados (AC1 — "mapeamento declarativo sem
 * ciclo"). Reutiliza os edges já existentes do skill catalog em vez de inventar
 * um segundo grafo: a ordem entre as 6 capabilities já é imposta pelos
 * `requiredArtifacts` de cada skill (ex.: `estruturador` exige os artefatos
 * primários de `zelador` e `briefista`) e testada em `readiness.test.ts`
 * ("keeps the traffic dependency order in the graph"). Esta função é o
 * verificador genérico e testável de ciclo, exposto para que
 * `shared/campaign-readiness.test.ts` prove tanto o caso saudável quanto um
 * fixture sintético cíclico.
 */
export function assertAcyclicSkillGraph(
  skillIds: readonly string[],
  edges: ReadonlyArray<{ from: string; to: string; type?: string }>,
): void {
  const relevant = new Set(skillIds);
  const outgoing = new Map<string, string[]>(skillIds.map((id) => [id, [] as string[]]));
  for (const edge of edges) {
    if (edge.type && edge.type !== 'dependency') continue;
    if (!relevant.has(edge.from) || !relevant.has(edge.to)) continue;
    outgoing.get(edge.from)?.push(edge.to);
  }
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>(skillIds.map((id) => [id, WHITE]));
  const stack: string[] = [];

  function visit(node: string): void {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of outgoing.get(node) ?? []) {
      const state = color.get(next) ?? WHITE;
      if (state === GRAY) {
        const cyclePath = [...stack.slice(stack.indexOf(next)), next].join(' -> ');
        throw new Error(`campaign-readiness-capabilities: ciclo detectado no grafo de skills (${cyclePath}).`);
      }
      if (state === WHITE) visit(next);
    }
    stack.pop();
    color.set(node, BLACK);
  }

  for (const id of skillIds) {
    if (color.get(id) === WHITE) visit(id);
  }
}

// ---------------------------------------------------------------------------
// Entrada mínima de skill evaluation (estruturalmente compatível com
// `SkillEvaluation` de `src/lib/readiness.ts` — sem importar o módulo, para
// manter este arquivo livre do alias `@/` que o projeto server não resolve).
// ---------------------------------------------------------------------------

export type CampaignReadinessSourceState = 'ready' | 'recommended' | 'almost' | 'locked' | 'not_applicable';

export interface CapabilitySkillInput {
  skillId: string;
  readiness: CampaignReadinessSourceState;
  missingFields: readonly string[];
  missingArtifacts: readonly string[];
  missingAlternatives: readonly string[];
  recommendedMissing: readonly string[];
}

export interface ComputeCampaignReadinessInput {
  target: CampaignCapability;
  /** Todas as skill evaluations do projeto (saída de `evaluateProjectSkills`) — reuso, não recomputação. */
  skillEvaluations: readonly CapabilitySkillInput[];
  /** Só relevante para `campaign.create` (regra estrutural — ADR-002). */
  project: { exists: boolean; name: string | null };
  /** `capabilities` opcional — permite injetar um mapeamento alternativo em testes; default = mapa embutido. */
  capabilities?: CampaignCapabilityMap;
  sourceRevision: number | null;
  /** Seed textual já assemblada pelo chamador (projeto + brief + artifact index + hash das unlock rules). */
  fingerprintSeed: string;
  now?: string;
}

// ---------------------------------------------------------------------------
// Hash puro determinístico (FNV-1a 32-bit) — só para detectar mudança de
// input, não é criptográfico. Funciona idêntico em browser e Node (sem
// depender de `node:crypto`/`crypto.subtle`), o que é exatamente a
// propriedade exigida por "consumível por browser e server" (AC5).
// ---------------------------------------------------------------------------

export function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// Avaliação de capability
// ---------------------------------------------------------------------------

function findSkillEvaluation(
  skillId: string,
  evaluations: readonly CapabilitySkillInput[],
): CapabilitySkillInput {
  const found = evaluations.find((evaluation) => evaluation.skillId === skillId);
  if (!found) {
    throw new Error(`campaign-readiness: skill "${skillId}" referenciada pelo mapeamento não foi avaliada.`);
  }
  return found;
}

function structuralCreateResult(project: { exists: boolean; name: string | null }): {
  state: CampaignReadinessState;
  blocking: CampaignReadinessBlockingEntry[];
  satisfied: CampaignReadinessNote[];
} {
  const blocking: CampaignReadinessBlockingEntry[] = [];
  if (!project.exists) {
    blocking.push({
      code: 'PROJECT_NOT_FOUND',
      label: 'Projeto ativo não encontrado.',
      source: 'briefing',
      action: { kind: 'journey', target: 'project.select' },
    });
  } else if (!project.name || !project.name.trim()) {
    blocking.push({
      code: 'PROJECT_NAME_INVALID',
      label: 'Projeto sem nome válido.',
      source: 'briefing',
      field: 'project.name',
      action: { kind: 'briefing', target: 'project.name' },
    });
  }
  const satisfied: CampaignReadinessNote[] = blocking.length === 0
    ? [{ code: 'PROJECT_ACTIVE', label: 'Projeto ativo e com nome válido.', source: 'briefing' }]
    : [];
  return { state: blocking.length === 0 ? 'ready' : 'blocked', blocking, satisfied };
}

function skillCapabilityResult(evaluation: CapabilitySkillInput): {
  state: CampaignReadinessState;
  blocking: CampaignReadinessBlockingEntry[];
  warnings: CampaignReadinessNote[];
  satisfied: CampaignReadinessNote[];
} {
  if (evaluation.readiness === 'not_applicable') {
    return {
      state: 'ready',
      blocking: [],
      warnings: [],
      satisfied: [{ code: 'NOT_APPLICABLE', label: 'Etapa não aplicável a este projeto.', source: 'skill' }],
    };
  }

  const blocking: CampaignReadinessBlockingEntry[] = [
    ...evaluation.missingFields.map((field): CampaignReadinessBlockingEntry => ({
      code: 'FIELD_MISSING',
      label: `Campo pendente no briefing: ${field}`,
      source: 'briefing',
      field,
      action: { kind: 'briefing', target: field },
    })),
    ...evaluation.missingArtifacts.map((artifactType): CampaignReadinessBlockingEntry => ({
      code: 'ARTIFACT_MISSING',
      label: `Artefato pendente: ${artifactType}`,
      source: 'artifact',
      artifactType,
      action: { kind: 'journey', target: artifactType },
    })),
    ...evaluation.missingAlternatives.map((label): CampaignReadinessBlockingEntry => ({
      code: 'ALTERNATIVE_UNMET',
      label: `Caminho alternativo não satisfeito: ${label}`,
      source: 'briefing',
      action: { kind: 'briefing', target: label },
    })),
  ];

  const warnings: CampaignReadinessNote[] = evaluation.recommendedMissing.map((item) => ({
    code: 'RECOMMENDED_MISSING',
    label: `Recomendado, ainda pendente: ${item}`,
    source: 'skill',
  }));

  const state: CampaignReadinessState = blocking.length > 0
    ? 'blocked'
    : warnings.length > 0
      ? 'ready_with_warnings'
      : 'ready';

  const satisfied: CampaignReadinessNote[] = blocking.length === 0
    ? [{ code: 'SKILL_READY', label: `Etapa "${evaluation.skillId}" liberada.`, source: 'skill' }]
    : [];

  return { state, blocking, warnings, satisfied };
}

/**
 * Calcula o snapshot `campaign-readiness.v1` para uma única capability
 * (AC1 — cada capability é avaliada separadamente). Não recomputa a matriz de
 * skills: recebe `skillEvaluations` já prontas (saída de `evaluateProjectSkills`).
 */
export function computeCampaignReadiness(input: ComputeCampaignReadinessInput): CampaignReadinessSnapshot {
  const capabilities = input.capabilities ?? CAMPAIGN_READINESS_CAPABILITIES;
  const rule = capabilities[input.target];
  if (!rule) {
    throw new Error(`campaign-readiness: capability desconhecida "${input.target}".`);
  }

  const now = input.now ?? new Date().toISOString();

  const result = rule.kind === 'structural'
    ? { ...structuralCreateResult(input.project), warnings: [] as CampaignReadinessNote[] }
    : skillCapabilityResult(findSkillEvaluation(rule.skillId as string, input.skillEvaluations));

  const nextAction = result.blocking.length > 0
    ? { label: result.blocking[0].label, target: result.blocking[0].action.target }
    : rule.kind === 'skill' && result.state === 'ready_with_warnings'
      ? { label: `Rodar ${rule.skillId}`, target: rule.skillId as string }
      : null;

  return {
    contractVersion: 'campaign-readiness.v1',
    target: input.target,
    state: result.state,
    capability: {
      allowed: result.state !== 'blocked',
      label: rule.label,
      ...(rule.skillId ? { skillId: rule.skillId } : {}),
    },
    blocking: result.blocking,
    warnings: result.warnings,
    satisfied: result.satisfied,
    nextAction,
    inputFingerprint: stableHash(input.fingerprintSeed),
    sourceRevision: input.sourceRevision,
    computedAt: now,
  };
}

/** Constrói o erro serializável `READINESS_BLOCKED` a partir de um snapshot bloqueado. */
export function toReadinessBlockedError(snapshot: CampaignReadinessSnapshot): CampaignReadinessError {
  return {
    code: 'READINESS_BLOCKED',
    message: `${snapshot.capability.label}: bloqueado por ${snapshot.blocking.length} pendência(s).`,
    target: snapshot.target,
    blocking: snapshot.blocking,
  };
}

/**
 * Detecta snapshot obsoleto (ADR-002: "sourceRevision permite detectar
 * snapshot obsoleto antes de executar"). Compara a identidade do snapshot
 * anterior contra os valores atuais; `computedAt` nunca entra nessa
 * comparação (AC2 — computedAt é informativo).
 */
export function isSnapshotStale(
  snapshot: CampaignReadinessSnapshot,
  current: { sourceRevision: number | null; fingerprintSeed: string },
): boolean {
  if (snapshot.sourceRevision !== current.sourceRevision) return true;
  return snapshot.inputFingerprint !== stableHash(current.fingerprintSeed);
}

export function toStaleReadinessError(target: CampaignCapability): CampaignReadinessError {
  return {
    code: 'STALE_READINESS',
    message: 'O snapshot de prontidão ficou obsoleto — releia antes de executar.',
    target,
    blocking: [],
  };
}
