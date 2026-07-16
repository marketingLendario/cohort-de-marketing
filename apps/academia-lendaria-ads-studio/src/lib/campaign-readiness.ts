import { skillCatalog, skillUnlockRules } from '@/generated/skill-catalog';
import { evaluateProjectSkills } from '@/lib/readiness';
import type { MarketingProject, ProjectArtifact, ProjectBriefRevision, SkillRun } from '@/lib/project-domain';
import { activeBriefFor } from '@/stores/project-store';
import {
  assertAcyclicSkillGraph,
  CAMPAIGN_READINESS_CAPABILITIES,
  CAMPAIGN_READINESS_CAPABILITIES_VERSION,
  computeCampaignReadiness as computeCampaignReadinessPure,
  stableHash,
  toReadinessBlockedError,
  type CampaignCapability,
  type CampaignReadinessBlockingEntry,
  type CampaignReadinessError,
  type CampaignReadinessSnapshot,
} from '../../shared/campaign-readiness';

export type {
  CampaignCapability,
  CampaignCapabilityKind,
  CampaignCapabilityRule,
  CampaignReadinessBlockingEntry,
  CampaignReadinessError,
  CampaignReadinessErrorCode,
  CampaignReadinessNote,
  CampaignReadinessSnapshot,
  CampaignReadinessState,
} from '../../shared/campaign-readiness';
export {
  CAMPAIGN_CAPABILITIES,
  CAMPAIGN_READINESS_CAPABILITIES,
  isSnapshotStale,
  toReadinessBlockedError,
  toStaleReadinessError,
} from '../../shared/campaign-readiness';

/**
 * Wiring browser-only do contrato `campaign-readiness.v1` (STORY-12.W1.1).
 *
 * Reusa `evaluateProjectSkills` (única fonte de verdade da matriz — Dev Notes
 * da story: "A story não deve criar uma segunda matriz de requisitos") e
 * delega a decisão por capability para `shared/campaign-readiness.ts`, que é
 * o mesmo módulo consumível por um futuro enforcement server-side (W4).
 */

let acyclicChecked = false;

/** Verifica uma vez por sessão que o mapeamento capability -> skill não introduz ciclo (AC1). */
function ensureAcyclicOnce(): void {
  if (acyclicChecked) return;
  const skillIds = Object.values(CAMPAIGN_READINESS_CAPABILITIES)
    .map((rule) => rule.skillId)
    .filter((id): id is string => Boolean(id));
  assertAcyclicSkillGraph(skillIds, skillCatalog.edges);
  acyclicChecked = true;
}

export interface CampaignReadinessContext {
  project: MarketingProject | null;
  brief: ProjectBriefRevision | null;
  artifacts: ProjectArtifact[];
  runs: SkillRun[];
}

/** AC2: fingerprint cobre projeto, revisão do briefing, artifact index e versão/hash das unlock rules. */
function fingerprintSeed(context: CampaignReadinessContext): string {
  const artifactIndex = [...context.artifacts]
    .map((artifact) => ({
      id: artifact.id,
      type: artifact.artifactType,
      state: artifact.state,
      verification: artifact.verification,
      updatedAt: artifact.updatedAt,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify({
    projectId: context.project?.id ?? null,
    briefId: context.brief?.id ?? null,
    briefRevision: context.brief?.revision ?? null,
    artifactIndex,
    unlockRulesVersion: skillUnlockRules.schemaVersion,
    unlockRulesHash: stableHash(JSON.stringify(skillUnlockRules)),
    capabilitiesVersion: CAMPAIGN_READINESS_CAPABILITIES_VERSION,
  });
}

/**
 * Avalia `campaign-readiness.v1` para uma capability (AC1: cada capability é
 * avaliada separadamente). Quando não há briefing ativo, capabilities
 * skill-based ficam `blocked` por falta de briefing — sem chamar
 * `evaluateProjectSkills` sobre um brief inexistente e sem fabricar uma
 * evaluation vazia como se fosse "pronta".
 */
export function evaluateCampaignReadiness(
  target: CampaignCapability,
  context: CampaignReadinessContext,
): CampaignReadinessSnapshot {
  ensureAcyclicOnce();
  const rule = CAMPAIGN_READINESS_CAPABILITIES[target];
  const seed = fingerprintSeed(context);

  if (rule.kind === 'skill' && !context.brief) {
    return {
      contractVersion: 'campaign-readiness.v1',
      target,
      state: 'blocked',
      capability: { allowed: false, label: rule.label, ...(rule.skillId ? { skillId: rule.skillId } : {}) },
      blocking: [{
        code: 'BRIEF_MISSING',
        label: 'O projeto ainda não tem um briefing ativo.',
        source: 'briefing',
        action: { kind: 'briefing', target: 'project' },
      }],
      warnings: [],
      satisfied: [],
      nextAction: { label: 'Preencher o briefing do projeto', target: 'project' },
      inputFingerprint: stableHash(seed),
      sourceRevision: null,
      computedAt: new Date().toISOString(),
    };
  }

  const skillEvaluations = context.brief
    ? evaluateProjectSkills(context.brief, context.artifacts, context.runs)
    : [];

  return computeCampaignReadinessPure({
    target,
    skillEvaluations,
    project: { exists: Boolean(context.project), name: context.project?.name ?? null },
    sourceRevision: context.brief?.revision ?? null,
    fingerprintSeed: seed,
  });
}

/** Atalho para o preflight de `campaign.create` (AC4 — `useCreateCampaign`). */
export function readinessBlockedErrorFor(
  target: CampaignCapability,
  context: CampaignReadinessContext,
): CampaignReadinessError | null {
  const snapshot = evaluateCampaignReadiness(target, context);
  return snapshot.state === 'blocked' ? toReadinessBlockedError(snapshot) : null;
}

// ---------------------------------------------------------------------------
// Consumo por UI (STORY-12.W2.1) — único ponto que monta o contexto e
// interpreta a ação de bloqueio, para que `UnifiedShell`, `ProjectOverview` e
// `ProjectCampaigns`/`CampaignReadinessPanel` nunca divirjam (AC2: mesmo
// `inputFingerprint`/`capability`/`nextAction.target` para a mesma revisão).
// ---------------------------------------------------------------------------

export interface CampaignReadinessStoreSlices {
  projects: MarketingProject[];
  briefRevisions: ProjectBriefRevision[];
  artifacts: ProjectArtifact[];
  skillRuns: SkillRun[];
}

/**
 * Filtra as quatro fatias do store por `projectId` exatamente uma vez (AC2).
 * `UnifiedShell`, `ProjectOverview` e `ProjectCampaigns`/`CampaignReadinessPanel`
 * chamam esta função em vez de reimplementar `.find`/`activeBriefFor`/`.filter`
 * cada um à sua maneira — divergência de filtro é exatamente a classe de bug
 * que o teste de AC2 existe para pegar.
 */
export function buildCampaignReadinessContext(
  projectId: string,
  store: CampaignReadinessStoreSlices,
): CampaignReadinessContext {
  return {
    project: store.projects.find((candidate) => candidate.id === projectId) ?? null,
    brief: activeBriefFor(projectId, store.briefRevisions),
    artifacts: store.artifacts.filter((artifact) => artifact.projectId === projectId),
    runs: store.skillRuns.filter((run) => run.projectId === projectId),
  };
}

/**
 * Dica de rota agnóstica de TanStack Router para uma ação de bloqueio
 * (AC1/AC3). A tipagem de rotas do TanStack exige literais em `<Link to="...">`,
 * então cada consumidor ainda escreve seu próprio JSX de navegação — mas todos
 * decidem QUAL rota a partir desta única função, nunca duplicando a
 * interpretação "para onde eu levo o operador" em condicionais locais.
 */
export type CampaignReadinessRouteHint =
  | { kind: 'projects' }
  | { kind: 'briefing'; sectionId: string }
  | { kind: 'journey' };

export function campaignReadinessRouteHint(
  action: CampaignReadinessBlockingEntry['action'] | null | undefined,
): CampaignReadinessRouteHint {
  if (!action) return { kind: 'journey' };
  if (action.target === 'project.select') return { kind: 'projects' };
  if (action.kind === 'briefing') return { kind: 'briefing', sectionId: action.target.split('.')[0] || 'project' };
  return { kind: 'journey' };
}

const CAMPAIGN_READINESS_SOURCE_LABELS: Record<CampaignReadinessBlockingEntry['source'], string> = {
  briefing: 'Briefing',
  artifact: 'Artefato',
  skill: 'Etapa',
  tracking: 'Tracking',
};

/** Rótulo humano da fonte de uma lacuna (AC3 — "cada lacuna com fonte"). */
export function campaignReadinessSourceLabel(source: CampaignReadinessBlockingEntry['source']): string {
  return CAMPAIGN_READINESS_SOURCE_LABELS[source] ?? source;
}
