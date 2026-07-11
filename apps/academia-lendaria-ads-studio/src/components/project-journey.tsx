import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button, Icon } from '@/lib/lendaria-ds';
import { skillCatalog } from '@/generated/skill-catalog';
import { evaluateProjectSkills, nextProjectAction, type SkillEvaluation } from '@/lib/readiness';
import { activeBriefFor, useProjectStore } from '@/stores/project-store';
import { buildTrafficPanelContext } from '@/lib/traffic-panel';
import { trafficApprovalBlockReason, trafficWorkflowBlockReason } from '@/lib/traffic-workflow';
import { TrafficSimulationBanner } from '@/components/traffic-simulation-banner';
import type { ProjectArtifact, SkillRun } from '@/lib/project-domain';
import { useOptionalProjectWorkspaceActions } from '@/components/project-hydration-boundary';
import { toCacheRunPatch, type PersistSkillRunStartInput } from '@/hooks/use-project-workspace';
import type { UpdateSkillRunInput } from '@/lib/project-repository';
import { ArtifactApprovalReview } from '@/components/artifact-approval-review';
import {
  buildInvalidations,
  decideArtifactApproval,
  makeIdempotencyKey,
  planArtifactApproval,
  resolveApprovalArtifacts,
  type ApprovalArtifactInput,
  type ApprovalPlan,
} from '@/lib/artifact-approval';
import {
  cancelSkillRun,
  isSkillProposal,
  observeSkillRun,
  retrySkillRun,
  startSkillRun,
  type SkillProposal,
  type SkillRunView,
} from '@/lib/skill-runtime';

/** The backend jobId lives inside the local run's inputSnapshot (survives reload). */
function jobIdOf(run: SkillRun): string | undefined {
  const value = (run.inputSnapshot as { jobId?: unknown } | undefined)?.jobId;
  return typeof value === 'string' ? value : undefined;
}

/** The step currently in flight (or the latest reported), for the progress line. */
function currentStepLabel(view: SkillRunView | undefined): string | null {
  if (!view || view.steps.length === 0) return null;
  const running = [...view.steps].reverse().find((step) => step.status === 'running');
  return (running ?? view.steps[view.steps.length - 1]).label;
}

type ViewMode = 'flow' | 'grid';

const STATE_LABELS: Record<string, string> = {
  ready: 'Pronta',
  recommended: 'Pronta com ressalvas',
  almost: 'Quase pronta',
  locked: 'Bloqueada',
  not_applicable: 'Não se aplica',
  running: 'Em execução',
  needs_review: 'Aguardando revisão',
  done: 'Concluída',
  stale: 'Desatualizada',
  failed: 'Falhou',
  idle: 'Não iniciada',
};

function stateFor(evaluation: SkillEvaluation) {
  return evaluation.lifecycle === 'idle' ? evaluation.readiness : evaluation.lifecycle;
}

function SkillNode({
  evaluation,
  selected,
  onSelect,
}: {
  evaluation: SkillEvaluation;
  selected: boolean;
  onSelect: () => void;
}) {
  const skill = skillCatalog.skills.find((candidate) => candidate.id === evaluation.skillId);
  const state = stateFor(evaluation);
  return (
    <button type="button" className={`cms-skill-node is-${state} ${selected ? 'is-selected' : ''}`} onClick={onSelect}>
      <span className={`cms-state-dot is-${state}`} />
      <span className="cms-skill-node__copy">
        <strong>{skill?.title}</strong>
        <small>{STATE_LABELS[state]}</small>
      </span>
      {evaluation.lifecycle === 'done' ? <Icon name="check" size={13} /> : <Icon name="nav-arrow-right" size={13} />}
    </button>
  );
}

export function ProjectJourney({ projectId }: { projectId: string }) {
  const revisions = useProjectStore((state) => state.briefRevisions);
  const brief = activeBriefFor(projectId, revisions);
  const allArtifacts = useProjectStore((state) => state.artifacts);
  const allRuns = useProjectStore((state) => state.skillRuns);
  const artifacts = useMemo(() => allArtifacts.filter((artifact) => artifact.projectId === projectId), [allArtifacts, projectId]);
  const runs = useMemo(() => allRuns.filter((run) => run.projectId === projectId), [allRuns, projectId]);
  const startRun = useProjectStore((state) => state.startSkillRun);
  const updateRun = useProjectStore((state) => state.updateSkillRun);
  const addArtifact = useProjectStore((state) => state.addArtifact);
  const upsertArtifact = useProjectStore((state) => state.upsertArtifact);
  // Seam opcional (QA-W2B1-02): dentro da boundary (modo real) as ações do
  // workspace persistem o skill run pelo repository; fora dela (demo/testes
  // isolados) é `null` e caímos no cache local — sem enfraquecer a persistência real.
  const workspaceActions = useOptionalProjectWorkspaceActions();
  const [viewMode, setViewMode] = useState<ViewMode>('flow');
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('all');
  const [executing, setExecuting] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [operatorInput, setOperatorInput] = useState('');
  // jobId com retry em voo — desabilita o botão Repetir (guard visual). O guard
  // duro (síncrono, contra double-click) vive em `retryInFlightRef`.
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const retryInFlightRef = useRef<Set<string>>(new Set());
  // Live progress projection per jobId (SSE/polling). Persisted status/proposal
  // live in the store; this is the ephemeral timeline rehydrated on reload.
  const [runViews, setRunViews] = useState<Record<string, SkillRunView>>({});
  const observedRef = useRef<Set<string>>(new Set());
  const unsubsRef = useRef<Map<string, () => void>>(new Map());

  // Início durável de um skill run: repository+cache em modo real (ações do
  // workspace presentes); só cache quando renderizado fora da boundary.
  const persistRunStart = useCallback(async (input: PersistSkillRunStartInput): Promise<SkillRun> => {
    if (workspaceActions) return workspaceActions.persistSkillRunStart(input);
    const runId = startRun(input.projectId, input.skillId, input.inputSnapshot);
    updateRun(runId, { status: 'running' });
    const run = useProjectStore.getState().skillRuns.find((candidate) => candidate.id === runId);
    if (!run) throw new Error('Skill run local não encontrado após criação.');
    return run;
  }, [workspaceActions, startRun, updateRun]);

  // Transição durável de um skill run: repository+cache em modo real; só cache
  // fora da boundary. Falha da escrita real é tratável (o journal do backend
  // permanece íntegro e a reidratação reconcilia), então é apenas superficializada.
  const persistRunUpdate = useCallback((runId: string, patch: UpdateSkillRunInput) => {
    if (workspaceActions) {
      void workspaceActions.persistSkillRunUpdate(runId, patch).catch((error: unknown) => {
        setRuntimeError(error instanceof Error ? error.message : 'Falha ao salvar o estado da execução.');
      });
    } else {
      updateRun(runId, toCacheRunPatch(patch));
    }
  }, [workspaceActions, updateRun]);

  const attach = useCallback((runId: string, jobId: string) => {
    if (observedRef.current.has(jobId)) return;
    observedRef.current.add(jobId);
    const release = () => {
      unsubsRef.current.get(jobId)?.();
      unsubsRef.current.delete(jobId);
      observedRef.current.delete(jobId);
    };
    const unsubscribe = observeSkillRun(jobId, {
      onSnapshot: (view) => setRunViews((prev) => ({ ...prev, [jobId]: view })),
      onProgress: (payload) => setRunViews((prev) => {
        const current = prev[jobId];
        if (!current) return prev;
        const steps = payload.step
          ? (() => {
              const idx = current.steps.findIndex((step) => step.id === payload.step!.id);
              const next = [...current.steps];
              if (idx >= 0) next[idx] = payload.step!;
              else next.push(payload.step!);
              return next;
            })()
          : current.steps;
        const logs = payload.log ? [...current.logs, payload.log] : current.logs;
        return { ...prev, [jobId]: { ...current, status: payload.status, attempt: payload.attempt, steps, logs } };
      }),
      onDone: ({ proposal, skillHash }) => {
        // Persiste a transição terminal com a proposta e o skillHash REAL
        // devolvido pelo journal durável (QA-W2B1-02).
        persistRunUpdate(runId, {
          status: 'needs_review',
          skillHash,
          proposal: proposal as unknown as Record<string, unknown>,
        });
        release();
      },
      onError: (error, status) => {
        persistRunUpdate(runId, { status: status === 'cancelled' ? 'cancelled' : 'failed', error: error.reason });
        release();
      },
    });
    unsubsRef.current.set(jobId, unsubscribe);
  }, [persistRunUpdate]);

  // Resume non-terminal runs by jobId — no dependency on the original request (AC6).
  useEffect(() => {
    for (const run of runs) {
      if (run.status === 'running' || run.status === 'queued') {
        const jobId = jobIdOf(run);
        if (jobId) attach(run.id, jobId);
      }
    }
  }, [runs, attach]);

  // Tear down every stream only on unmount.
  useEffect(() => {
    const unsubs = unsubsRef.current;
    return () => {
      for (const unsubscribe of unsubs.values()) unsubscribe();
      unsubs.clear();
    };
  }, []);

  const evaluations = useMemo(
    () => brief ? evaluateProjectSkills(brief, artifacts, runs) : [],
    [artifacts, brief, runs],
  );
  const next = nextProjectAction(evaluations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEvaluation = evaluations.find((evaluation) => evaluation.skillId === selectedId)
    ?? next
    ?? evaluations[0];
  const selectedSkill = skillCatalog.skills.find((skill) => skill.id === selectedEvaluation?.skillId);

  // Latest run of the selected skill (guarded so the hooks below stay above the
  // early return — rules of hooks). Drives the two-phase approval review.
  const latestRunForSelected = selectedEvaluation
    ? [...runs]
        .filter((run) => run.skillId === selectedEvaluation.skillId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
    : undefined;

  const [approvalPlan, setApprovalPlan] = useState<ApprovalPlan | null>(null);
  const [approvalPlanLoading, setApprovalPlanLoading] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const reviewRunId = latestRunForSelected?.status === 'needs_review' ? latestRunForSelected.id : undefined;
  const reviewRunRevision = latestRunForSelected?.proposalRevision;

  // Phase 1 (real mode): fetch the accurate filesystem plan for the proposal in
  // review. Demo mode (no workspace actions) skips the backend and reviews locally.
  useEffect(() => {
    if (!workspaceActions || !reviewRunId) {
      setApprovalPlan(null);
      return;
    }
    const run = latestRunForSelected;
    if (!run || !isSkillProposal(run.proposal)) {
      setApprovalPlan(null);
      return;
    }
    const skill = skillCatalog.skills.find((candidate) => candidate.id === run.skillId);
    const artifacts = resolveApprovalArtifacts(run.proposal, {
      artifactType: skill?.primaryArtifacts[0] ?? run.skillId,
      title: skill?.title ?? run.skillId,
      path: `generated/${run.skillId}/${run.id}.md`,
    });
    if (artifacts.length === 0) {
      setApprovalPlan(null);
      return;
    }
    let active = true;
    setApprovalPlanLoading(true);
    setApprovalError(null);
    planArtifactApproval({ skillRunId: run.id, artifacts })
      .then((result) => {
        if (active) setApprovalPlan(result);
      })
      .catch((error: unknown) => {
        if (active) {
          setApprovalPlan(null);
          setApprovalError(error instanceof Error ? error.message : 'Falha ao planejar a aprovação.');
        }
      })
      .finally(() => {
        if (active) setApprovalPlanLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the run identity + revision, not the recomputed object.
  }, [workspaceActions, reviewRunId, reviewRunRevision]);

  const phases = [...new Set(skillCatalog.skills.map((skill) => skill.phase))];
  const filtered = evaluations.filter((evaluation) => {
    const skill = skillCatalog.skills.find((candidate) => candidate.id === evaluation.skillId);
    const matchesQuery = !query.trim() || `${skill?.title} ${skill?.description}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesPhase = phase === 'all' || skill?.phase === phase;
    return matchesQuery && matchesPhase;
  });
  const grouped = phases
    .map((phaseName) => ({
      phase: phaseName,
      skills: filtered.filter((evaluation) => skillCatalog.skills.find((skill) => skill.id === evaluation.skillId)?.phase === phaseName),
    }))
    .filter((group) => group.skills.length > 0);

  if (!brief || !selectedEvaluation || !selectedSkill) return null;
  const briefRevisionId = brief.id;
  const briefWorkspaceId = brief.workspaceId;
  const briefData = brief.data as unknown as Record<string, unknown>;
  const activeSkill = selectedSkill;

  const selectedState = stateFor(selectedEvaluation);
  const sectionId = selectedEvaluation.missingFields[0]?.split('.')[0] ?? 'project';
  const latestRun = latestRunForSelected;
  const latestJobId = latestRun ? jobIdOf(latestRun) : undefined;
  const latestLiveView = latestJobId ? runViews[latestJobId] : undefined;

  // Two-phase approval review data (AC1): the exact artifacts the human approves
  // + the downstream artifacts this decision would invalidate (client graph).
  const reviewProposal = latestRun && isSkillProposal(latestRun.proposal) ? latestRun.proposal : null;
  const reviewArtifacts: ApprovalArtifactInput[] = reviewProposal
    ? resolveApprovalArtifacts(reviewProposal, {
        artifactType: activeSkill.primaryArtifacts[0] ?? activeSkill.id,
        title: activeSkill.title,
        path: `generated/${activeSkill.id}/${latestRun!.id}.md`,
      })
    : [];
  const invalidations = latestRun ? buildInvalidations(latestRun.skillId, artifacts) : [];

  async function executeRun() {
    setRuntimeError(null);
    setExecuting(true);
    try {
      const confirmedArtifacts = artifacts.filter((artifact) => artifact.verification === 'confirmed');
      const workflowBlock = trafficWorkflowBlockReason(selectedEvaluation.skillId, confirmedArtifacts);
      if (workflowBlock) {
        setRuntimeError(workflowBlock);
        return;
      }
      const trafficPanel = buildTrafficPanelContext(confirmedArtifacts);
      // Persist + 202 first (AC1): we get a durable jobId before the long run.
      const start = await startSkillRun(selectedEvaluation.skillId, {
        workspaceId: briefWorkspaceId,
        projectId,
        brief: briefData,
        context: {
          artifacts: confirmedArtifacts.map((artifact) => ({
            artifactType: artifact.artifactType,
            title: artifact.title,
            path: artifact.path,
            content: artifact.content,
          })),
          trafficPanel,
        },
        operatorInput: operatorInput.trim() || undefined,
      });
      // Pointer durável da UI (QA-W2B1-02): grava o skill run pelo repository
      // carregando o jobId, ANTES de reatar. Se o pointer falhar, o job de
      // backend já é durável → compensa cancelando-o para não deixar órfão rodando.
      let run: SkillRun;
      try {
        run = await persistRunStart({
          projectId,
          skillId: selectedEvaluation.skillId,
          inputSnapshot: {
            briefRevisionId,
            artifactIds: confirmedArtifacts.map((artifact) => artifact.id),
            jobId: start.jobId,
          },
        });
      } catch {
        try {
          await cancelSkillRun(start.jobId);
        } catch {
          // best-effort: o journal registra o cancelamento; nada a recuperar aqui.
        }
        throw new Error('Não foi possível registrar a execução para retomada. A execução foi cancelada; tente de novo.');
      }
      attach(run.id, start.jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao executar a skill.';
      setRuntimeError(message);
    } finally {
      setExecuting(false);
    }
  }

  async function cancelRun(run: SkillRun) {
    const jobId = jobIdOf(run);
    if (!jobId) return;
    setRuntimeError(null);
    try {
      await cancelSkillRun(jobId);
      persistRunUpdate(run.id, { status: 'cancelled', error: null });
      unsubsRef.current.get(jobId)?.();
      unsubsRef.current.delete(jobId);
      observedRef.current.delete(jobId);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : 'Falha ao cancelar a execução.');
    }
  }

  async function retryRun(run: SkillRun) {
    const jobId = jobIdOf(run);
    if (!jobId) return;
    // Guard duro síncrono (QA-W2B1-01): um double-click não pode emitir dois
    // POST /retry concorrentes deste cliente. O `retryInFlightRef` fecha a janela
    // antes de qualquer re-render; `retryingJobId` desabilita o botão.
    if (retryInFlightRef.current.has(jobId)) return;
    retryInFlightRef.current.add(jobId);
    setRetryingJobId(jobId);
    setRuntimeError(null);
    try {
      await retrySkillRun(jobId);
      persistRunUpdate(run.id, { status: 'running', error: null });
      observedRef.current.delete(jobId);
      unsubsRef.current.get(jobId)?.();
      unsubsRef.current.delete(jobId);
      attach(run.id, jobId);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : 'Falha ao repetir a execução.');
    } finally {
      retryInFlightRef.current.delete(jobId);
      setRetryingJobId((current) => (current === jobId ? null : current));
    }
  }

  // Phase 2 — approve. Real mode routes the whole transaction through the BFF
  // saga (materialize + DB + audit, one proposal hash across surfaces), then
  // mirrors the authoritative result into the cache. Demo mode materializes
  // locally (cache-only), keeping the same UX.
  async function approveProposal() {
    const run = latestRun;
    if (!run || !reviewProposal || reviewArtifacts.length === 0) return;
    const workflowBlock = trafficApprovalBlockReason(run.skillId, [...artifacts, ...reviewArtifacts]);
    if (workflowBlock) {
      setApprovalError(workflowBlock);
      return;
    }
    setApprovalError(null);
    setApprovalBusy(true);
    try {
      if (workspaceActions) {
        if (!approvalPlan) throw new Error('O plano de aprovação ainda está carregando.');
        const record = await decideArtifactApproval({
          skillRunId: run.id,
          decision: 'approve',
          expectedProposalHash: approvalPlan.proposalHash,
          expectedProposalRevision: approvalPlan.proposalRevision,
          idempotencyKey: makeIdempotencyKey(run.id, approvalPlan.proposalHash, 'approve'),
          artifacts: reviewArtifacts,
        });
        // The BFF is the SOT and already persisted; mirror it into the cache.
        const now = new Date().toISOString();
        for (const entry of record.plan) {
          upsertArtifact({
            id: entry.artifactId,
            workspaceId: run.workspaceId,
            projectId,
            artifactType: entry.artifactType,
            title: entry.title,
            path: entry.path,
            format: entry.format as ProjectArtifact['format'],
            state: 'confirmed',
            verification: 'confirmed',
            source: 'skill_run',
            skillRunId: run.id,
            ...(entry.contentHash ? { hash: entry.contentHash } : {}),
            content: entry.content,
            createdAt: now,
            updatedAt: now,
          }, false);
        }
        updateRun(run.id, { status: 'done', proposalHash: record.proposalHash });
      } else {
        for (const artifact of reviewArtifacts) {
          addArtifact({
            workspaceId: run.workspaceId,
            projectId,
            artifactType: artifact.artifactType,
            title: artifact.title,
            path: artifact.path,
            format: artifact.format as ProjectArtifact['format'],
            state: 'confirmed',
            verification: 'confirmed',
            source: 'skill_run',
            skillRunId: run.id,
            content: artifact.content,
          });
        }
        updateRun(run.id, { status: 'done' });
      }
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : 'Falha ao aprovar a proposta.');
    } finally {
      setApprovalBusy(false);
    }
  }

  // Phase 2 — reject. Persists the decision (skill_run → cancelled) WITHOUT
  // writing any file (AC5). Real mode records it through the BFF; demo cache-only.
  async function rejectProposal() {
    const run = latestRun;
    // Guard against a stale/non-`needs_review` run (P3-02): the button is
    // already gated by the UI, but a decision must never be issued outside it.
    if (!run || run.status !== 'needs_review') return;
    setApprovalError(null);
    setApprovalBusy(true);
    try {
      if (workspaceActions) {
        if (!approvalPlan) throw new Error('O plano de aprovação ainda está carregando.');
        await decideArtifactApproval({
          skillRunId: run.id,
          decision: 'reject',
          expectedProposalHash: approvalPlan.proposalHash,
          expectedProposalRevision: approvalPlan.proposalRevision,
          idempotencyKey: makeIdempotencyKey(run.id, approvalPlan.proposalHash, 'reject'),
        });
      }
      // Cache reflection only AFTER the real-mode decision is persisted (or in
      // demo mode, where there is no backend to persist against) — the cache
      // must never claim `cancelled` before the BFF confirms it (P3-02).
      updateRun(run.id, { status: 'cancelled' });
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : 'Falha ao rejeitar a proposta.');
    } finally {
      setApprovalBusy(false);
    }
  }

  // Editing creates a NEW proposal revision (AC5): bumping the revision + hash
  // invalidates any stale in-flight approval that still carries the old ones.
  async function editProposal(edited: ApprovalArtifactInput[]) {
    const run = latestRun;
    if (!run || !reviewProposal) return;
    setApprovalError(null);
    setApprovalBusy(true);
    try {
      const editedProposal: SkillProposal = {
        ...reviewProposal,
        artifacts: edited.map((artifact) => ({
          artifactType: artifact.artifactType,
          title: artifact.title,
          path: artifact.path,
          format: artifact.format,
          content: artifact.content,
        })),
      };
      const nextRevision = (run.proposalRevision ?? 1) + 1;
      if (workspaceActions) {
        const nextPlan = await planArtifactApproval({ skillRunId: run.id, artifacts: edited });
        await workspaceActions.persistSkillRunUpdate(run.id, {
          proposal: editedProposal as unknown as Record<string, unknown>,
          proposalHash: nextPlan.proposalHash,
          proposalRevision: nextRevision,
          expectedProposalRevision: run.proposalRevision ?? 1,
        });
        // The persisted revision is the new authoritative one for the approval gate.
        setApprovalPlan({ ...nextPlan, proposalRevision: nextRevision });
      } else {
        updateRun(run.id, {
          proposal: editedProposal as unknown as Record<string, unknown>,
          proposalRevision: nextRevision,
        } as Partial<SkillRun>);
      }
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : 'Falha ao editar a proposta.');
    } finally {
      setApprovalBusy(false);
    }
  }

  return (
    <div className="asx-page cms-page cms-journey-page">
      <div className="asx-page-head">
        <div>
          <div className="asx-page-head__eyebrow">Jornada · 30 skills</div>
          <h1 className="asx-page-head__title">Mapa do <em>trabalho</em></h1>
        </div>
        <div className="cms-segmented" aria-label="Visualização">
          <button type="button" className={viewMode === 'flow' ? 'is-active' : ''} onClick={() => setViewMode('flow')} title="Fluxo" aria-label="Fluxo">
            <Icon name="network" size={15} />
          </button>
          <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => setViewMode('grid')} title="Grade" aria-label="Grade">
            <Icon name="view-grid" size={15} />
          </button>
        </div>
      </div>

      <TrafficSimulationBanner />

      <div className="cms-journey-toolbar">
        <label className="cms-search-control">
          <Icon name="search" size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar skill" />
        </label>
        <select className="al-input" value={phase} onChange={(event) => setPhase(event.target.value)} aria-label="Filtrar por fase">
          <option value="all">Todas as fases</option>
          {phases.map((phaseName) => <option key={phaseName} value={phaseName}>{phaseName}</option>)}
        </select>
        <div className="cms-journey-summary">
          <span><i className="cms-state-dot is-done" />{evaluations.filter((item) => item.lifecycle === 'done').length} concluídas</span>
          <span><i className="cms-state-dot is-ready" />{evaluations.filter((item) => item.lifecycle === 'idle' && ['ready', 'recommended'].includes(item.readiness)).length} prontas</span>
          <span><i className="cms-state-dot is-locked" />{evaluations.filter((item) => item.readiness === 'locked').length} bloqueadas</span>
        </div>
      </div>

      <div className="cms-journey-layout">
        <section className={`cms-skill-map is-${viewMode}`} aria-label="Mapa de skills">
          {viewMode === 'flow' ? grouped.map((group, groupIndex) => (
            <div key={group.phase} className="cms-skill-phase">
              <div className="cms-skill-phase__head">
                <span>{String(groupIndex + 1).padStart(2, '0')}</span>
                <div><strong>{group.phase}</strong><small>{group.skills.length} skills</small></div>
              </div>
              <div className="cms-skill-phase__nodes">
                {group.skills.map((evaluation) => (
                  <SkillNode
                    key={evaluation.skillId}
                    evaluation={evaluation}
                    selected={selectedEvaluation.skillId === evaluation.skillId}
                    onSelect={() => setSelectedId(evaluation.skillId)}
                  />
                ))}
              </div>
            </div>
          )) : (
            <div className="cms-skill-grid">
              {filtered.map((evaluation) => (
                <SkillNode
                  key={evaluation.skillId}
                  evaluation={evaluation}
                  selected={selectedEvaluation.skillId === evaluation.skillId}
                  onSelect={() => setSelectedId(evaluation.skillId)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="cms-skill-detail">
          <div className="cms-skill-detail__status">
            <span className={`cms-state-dot is-${selectedState}`} />
            {STATE_LABELS[selectedState]}
          </div>
          <span className="cms-kicker">{selectedSkill.phase} · {selectedSkill.level}</span>
          <h2>{selectedSkill.title}</h2>
          <p>{selectedSkill.description}</p>

          {selectedSkill.guard ? (
            <div className="cms-skill-guard">
              <Icon name="shield-check" size={15} />
              <span>{selectedSkill.guard}</span>
            </div>
          ) : null}

          {selectedEvaluation.missingFields.length ? (
            <div className="cms-detail-block">
              <strong>Dados pendentes</strong>
              {selectedEvaluation.missingFields.slice(0, 5).map((path) => (
                <Link key={path} to="/projects/$projectId/briefing/$sectionId" params={{ projectId, sectionId: path.split('.')[0] ?? sectionId }}>
                  <Icon name="edit-pencil" size={12} /> {path.split('.').at(-1)}
                </Link>
              ))}
            </div>
          ) : null}

          {selectedEvaluation.missingArtifacts.length ? (
            <div className="cms-detail-block">
              <strong>Artefatos pendentes</strong>
              {selectedEvaluation.missingArtifacts.slice(0, 5).map((artifact) => (
                <Link key={artifact} to="/projects/$projectId/artifacts" params={{ projectId }}>
                  <Icon name="page" size={12} /> {artifact}
                </Link>
              ))}
            </div>
          ) : null}

          {latestRun ? (
            <div className="cms-run-status">
              <span>Execução</span>
              <strong>{STATE_LABELS[latestRun.status] ?? latestRun.status}</strong>
              {latestLiveView && (latestRun.status === 'running' || latestRun.status === 'queued') ? (
                <small className="cms-run-progress">
                  {currentStepLabel(latestLiveView) ?? 'Preparando execução'}
                  {latestLiveView.attempt > 1 ? ` · tentativa #${latestLiveView.attempt}` : ''}
                </small>
              ) : null}
            </div>
          ) : null}

          {latestRun && (latestRun.status === 'running' || latestRun.status === 'queued') && latestJobId ? (
            <div className="cms-run-controls">
              <Button size="sm" variant="outline" onClick={() => void cancelRun(latestRun)}>
                <Icon name="cancel" size={12} /> Cancelar
              </Button>
            </div>
          ) : null}

          {latestRun && (latestRun.status === 'failed' || latestRun.status === 'cancelled') && latestJobId ? (
            <div className="cms-run-controls">
              {latestRun.error ? <span className="cms-inline-error">{latestRun.error}</span> : null}
              <Button size="sm" variant="outline" disabled={retryingJobId === latestJobId} onClick={() => void retryRun(latestRun)}>
                <Icon name="refresh-double" size={12} /> Repetir
              </Button>
            </div>
          ) : null}

          {latestRun?.status === 'needs_review' && reviewProposal && reviewArtifacts.length ? (
            <ArtifactApprovalReview
              proposalSummary={reviewProposal.summary}
              artifacts={reviewArtifacts}
              workflowHint={latestRun.skillId === 'briefista'
                ? 'Curadoria humana: edite o Painel da Semana e registre 2 a 3 valores em finalistas_curados antes de aprovar.'
                : undefined}
              plan={approvalPlan}
              planLoading={approvalPlanLoading}
              proposalWarnings={reviewProposal.warnings}
              invalidations={invalidations}
              onApprove={() => void approveProposal()}
              onReject={() => void rejectProposal()}
              onEdit={(edited) => void editProposal(edited)}
              busy={approvalBusy || (!!workspaceActions && !approvalPlan)}
              error={approvalError}
            />
          ) : null}

          {runtimeError ? <div className="cms-inline-error cms-runtime-error">{runtimeError}</div> : null}

          <div className="cms-skill-detail__actions">
            {selectedEvaluation.action === 'fill_field' ? (
              <Link to="/projects/$projectId/briefing/$sectionId" params={{ projectId, sectionId }} className="al-btn al-btn--primary">
                Completar briefing <Icon name="nav-arrow-right" size={13} />
              </Link>
            ) : selectedEvaluation.action === 'open_artifact' || selectedEvaluation.action === 'open_result' ? (
              <Link to="/projects/$projectId/artifacts" params={{ projectId }} className="al-btn al-btn--primary">
                Abrir artefatos <Icon name="nav-arrow-right" size={13} />
              </Link>
            ) : (
              <>
                <label className="cms-operator-input">
                  <span>Contexto adicional</span>
                  <textarea value={operatorInput} onChange={(event) => setOperatorInput(event.target.value)} placeholder="Opcional: decisão, material ou pedido específico para esta execução." />
                </label>
                <Button onClick={() => void executeRun()} disabled={executing || latestRun?.status === 'running' || latestRun?.status === 'needs_review'}>
                  <Icon name={executing ? 'refresh-double' : 'play'} size={13} /> {executing ? 'Executando...' : 'Executar skill'}
                </Button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
