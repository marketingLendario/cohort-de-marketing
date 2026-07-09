import { skillCatalog, skillUnlockRules } from '@/generated/skill-catalog';
import { getPath, type ProjectArtifact, type ProjectBriefRevision, type SkillRun } from '@/lib/project-domain';

export type ReadinessState = 'ready' | 'recommended' | 'almost' | 'locked' | 'not_applicable';
export type SkillLifecycle = 'idle' | 'running' | 'needs_review' | 'done' | 'stale' | 'failed';

export interface SkillEvaluation {
  skillId: string;
  readiness: ReadinessState;
  lifecycle: SkillLifecycle;
  missingFields: string[];
  missingArtifacts: string[];
  missingAlternatives: string[];
  recommendedMissing: string[];
  reason?: string;
  action: 'fill_field' | 'open_artifact' | 'run' | 'review' | 'resume' | 'open_result' | 'none';
}

type UnlockRule = (typeof skillUnlockRules.skills)[keyof typeof skillUnlockRules.skills];

function conditionMatches(brief: ProjectBriefRevision, condition: { field: string; equals?: unknown; in?: readonly unknown[] }) {
  const lookup = getPath(brief.data, condition.field);
  if (!lookup.exists) return false;
  if ('equals' in condition) return lookup.value === condition.equals;
  if (condition.in) return condition.in.includes(lookup.value);
  return false;
}

export function isProvided(brief: ProjectBriefRevision, path: string): boolean {
  const meta = brief.fieldSources[path];
  if (meta?.confirmation === 'not_applicable') return true;
  if (meta?.confirmation === 'pending') return false;
  const lookup = getPath(brief.data, path);
  if (!lookup.exists || lookup.value == null) return false;
  if (typeof lookup.value === 'string') return lookup.value.trim().length > 0;
  if (typeof lookup.value === 'number') return Number.isFinite(lookup.value);
  if (typeof lookup.value === 'boolean') return true;
  if (Array.isArray(lookup.value)) return lookup.value.length > 0;
  if (typeof lookup.value === 'object') return Object.keys(lookup.value).length > 0;
  return false;
}

function confirmedArtifactTypes(artifacts: ProjectArtifact[]): Set<string> {
  return new Set(
    artifacts
      .filter((artifact) => artifact.verification === 'confirmed' && artifact.state !== 'example' && artifact.state !== 'stale')
      .map((artifact) => artifact.artifactType),
  );
}

function lifecycleFromRuns(skillId: string, runs: SkillRun[], primaryDone: boolean, hasPrimaryArtifacts: boolean): SkillLifecycle {
  const latest = runs
    .filter((run) => run.skillId === skillId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (latest?.status === 'running' || latest?.status === 'queued') return 'running';
  if (latest?.status === 'needs_review') return 'needs_review';
  if (latest?.status === 'failed') return 'failed';
  if (primaryDone || (latest?.status === 'done' && !hasPrimaryArtifacts)) return 'done';
  return 'idle';
}

function groupMatches(
  brief: ProjectBriefRevision,
  artifactTypes: Set<string>,
  group: { fields?: readonly string[]; artifacts?: readonly string[]; matches?: Readonly<Record<string, unknown>> },
): boolean {
  if (group.matches) {
    for (const [field, expected] of Object.entries(group.matches)) {
      if (getPath(brief.data, field).value !== expected) return false;
    }
  }
  return (group.fields ?? []).every((field) => isProvided(brief, field))
    && (group.artifacts ?? []).every((artifact) => artifactTypes.has(artifact));
}

export function evaluateSkill(
  skillId: string,
  brief: ProjectBriefRevision,
  artifacts: ProjectArtifact[],
  runs: SkillRun[],
): SkillEvaluation {
  const rule = skillUnlockRules.skills[skillId as keyof typeof skillUnlockRules.skills] as UnlockRule | undefined;
  if (!rule) throw new Error(`Skill sem regra de prontidão: ${skillId}`);
  const artifactTypes = confirmedArtifactTypes(artifacts);
  const notApplicable = ('notApplicableWhen' in rule ? rule.notApplicableWhen : undefined)
    ?.find((condition) => conditionMatches(brief, condition));
  if (notApplicable) {
    return {
      skillId,
      readiness: 'not_applicable',
      lifecycle: 'idle',
      missingFields: [],
      missingArtifacts: [],
      missingAlternatives: [],
      recommendedMissing: [],
      reason: notApplicable.reason,
      action: 'none',
    };
  }

  const primaryArtifacts = 'primaryArtifacts' in rule ? rule.primaryArtifacts : [];
  const primaryDone = primaryArtifacts.length > 0 && primaryArtifacts.every((artifact) => artifactTypes.has(artifact));
  const lifecycle = lifecycleFromRuns(skillId, runs, primaryDone, primaryArtifacts.length > 0);
  const requiredFields = 'requiredFields' in rule ? rule.requiredFields : [];
  const requiredArtifacts = 'requiredArtifacts' in rule ? rule.requiredArtifacts : [];
  const recommendedFields = 'recommendedFields' in rule ? rule.recommendedFields : [];
  const recommendedArtifacts = 'recommendedArtifacts' in rule ? rule.recommendedArtifacts : [];
  const alternatives = 'anyOf' in rule ? rule.anyOf : [];
  const missingFields = requiredFields.filter((field) => !isProvided(brief, field));
  const missingArtifacts = requiredArtifacts.filter((artifact) => !artifactTypes.has(artifact));
  const alternativeSatisfied = alternatives.length === 0
    || alternatives.some((group) => groupMatches(brief, artifactTypes, group));
  const missingAlternatives = alternativeSatisfied
    ? []
    : alternatives.map((group) => group.label ?? 'Caminho alternativo');
  const recommendedMissing = [
    ...recommendedFields.filter((field) => !isProvided(brief, field)),
    ...recommendedArtifacts.filter((artifact) => !artifactTypes.has(artifact)),
  ];
  const hardMissing = missingFields.length + missingArtifacts.length + missingAlternatives.length;
  const readiness: ReadinessState = hardMissing === 0
    ? recommendedMissing.length > 0 ? 'recommended' : 'ready'
    : hardMissing <= 2 ? 'almost' : 'locked';

  const action: SkillEvaluation['action'] = lifecycle === 'running'
    ? 'resume'
    : lifecycle === 'needs_review'
      ? 'review'
      : lifecycle === 'done'
        ? 'open_result'
        : missingFields.length > 0
          ? 'fill_field'
          : missingArtifacts.length > 0
            ? 'open_artifact'
            : readiness === 'ready' || readiness === 'recommended'
              ? 'run'
              : 'fill_field';

  return {
    skillId,
    readiness,
    lifecycle,
    missingFields,
    missingArtifacts,
    missingAlternatives,
    recommendedMissing,
    action,
  };
}

export function topologicalSkillIds(): string[] {
  const skills = [...skillCatalog.skills];
  const ids = new Set<string>(skills.map((skill) => skill.id));
  const incoming = new Map<string, number>(skills.map((skill) => [skill.id, 0]));
  const outgoing = new Map<string, string[]>(skills.map((skill) => [skill.id, [] as string[]]));
  for (const edge of skillCatalog.edges) {
    if (edge.type !== 'dependency' || !ids.has(edge.from) || !ids.has(edge.to)) continue;
    outgoing.get(edge.from)?.push(edge.to);
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
  }
  const byOrder = (a: string, b: string) => {
    const skillA = skills.find((skill) => skill.id === a);
    const skillB = skills.find((skill) => skill.id === b);
    return (skillA?.order ?? 0) - (skillB?.order ?? 0) || a.localeCompare(b);
  };
  const queue: string[] = skills.filter((skill) => incoming.get(skill.id) === 0).map((skill) => skill.id).sort(byOrder);
  const result: string[] = [];
  while (queue.length) {
    const id = queue.shift();
    if (!id) break;
    result.push(id);
    for (const next of outgoing.get(id) ?? []) {
      incoming.set(next, (incoming.get(next) ?? 1) - 1);
      if (incoming.get(next) === 0) queue.push(next);
    }
    queue.sort(byOrder);
  }
  return result.length === skills.length ? result : skills.sort((a, b) => a.order - b.order).map((skill) => skill.id);
}

export function evaluateProjectSkills(
  brief: ProjectBriefRevision,
  artifacts: ProjectArtifact[],
  runs: SkillRun[],
): SkillEvaluation[] {
  return topologicalSkillIds().map((skillId) => evaluateSkill(skillId, brief, artifacts, runs));
}

export function nextProjectAction(evaluations: SkillEvaluation[]): SkillEvaluation | null {
  return evaluations.find((item) => item.lifecycle === 'needs_review')
    ?? evaluations.find((item) => item.lifecycle === 'running')
    ?? evaluations.find((item) => item.lifecycle === 'failed')
    ?? evaluations.find((item) => item.lifecycle === 'idle' && (item.readiness === 'ready' || item.readiness === 'recommended'))
    ?? evaluations.find((item) => item.lifecycle === 'idle' && item.readiness === 'almost')
    ?? null;
}
