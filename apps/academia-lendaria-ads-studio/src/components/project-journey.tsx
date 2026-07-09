import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button, Icon } from '@/lib/lendaria-ds';
import { skillCatalog } from '@/generated/skill-catalog';
import { evaluateProjectSkills, nextProjectAction, type SkillEvaluation } from '@/lib/readiness';
import { activeBriefFor, useProjectStore } from '@/stores/project-store';
import { executeLocalSkill, isSkillProposal } from '@/lib/skill-runtime';

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
  const [viewMode, setViewMode] = useState<ViewMode>('flow');
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('all');
  const [executing, setExecuting] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [operatorInput, setOperatorInput] = useState('');

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
  const briefData = brief.data as unknown as Record<string, unknown>;
  const activeSkill = selectedSkill;

  const selectedState = stateFor(selectedEvaluation);
  const sectionId = selectedEvaluation.missingFields[0]?.split('.')[0] ?? 'project';
  const latestRun = [...runs]
    .filter((run) => run.skillId === selectedEvaluation.skillId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  async function executeRun() {
    setRuntimeError(null);
    setExecuting(true);
    const runId = startRun(projectId, selectedEvaluation.skillId, {
      briefRevisionId,
      artifactIds: artifacts.filter((artifact) => artifact.verification === 'confirmed').map((artifact) => artifact.id),
    });
    updateRun(runId, { status: 'running' });
    try {
      const result = await executeLocalSkill(selectedEvaluation.skillId, {
        projectId,
        brief: briefData,
        context: {
          artifacts: artifacts.filter((artifact) => artifact.verification === 'confirmed').map((artifact) => ({
            artifactType: artifact.artifactType,
            title: artifact.title,
            path: artifact.path,
            content: artifact.content,
          })),
        },
        operatorInput: operatorInput.trim() || undefined,
      });
      updateRun(runId, {
        status: 'needs_review',
        skillHash: result.skillHash,
        proposal: result.proposal as unknown as Record<string, unknown>,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao executar a skill.';
      updateRun(runId, { status: 'failed', error: message });
      setRuntimeError(message);
    } finally {
      setExecuting(false);
    }
  }

  function approveProposal() {
    if (!latestRun || !isSkillProposal(latestRun.proposal)) return;
    const proposals = latestRun.proposal.artifacts.length
      ? latestRun.proposal.artifacts
      : activeSkill.primaryArtifacts.length
        ? [{
            artifactType: activeSkill.primaryArtifacts[0]!,
            title: activeSkill.title,
            path: `generated/${activeSkill.id}/${latestRun.id}.md`,
            format: 'markdown' as const,
            content: latestRun.proposal.resultMarkdown,
          }]
        : [];
    for (const proposal of proposals) {
      addArtifact({
        workspaceId: latestRun.workspaceId,
        projectId,
        artifactType: proposal.artifactType,
        title: proposal.title,
        path: proposal.path,
        format: proposal.format,
        state: 'confirmed',
        verification: 'confirmed',
        source: 'skill_run',
        skillRunId: latestRun.id,
        content: proposal.content,
      });
    }
    updateRun(latestRun.id, { status: 'done' });
  }

  function rejectProposal() {
    if (!latestRun) return;
    updateRun(latestRun.id, { status: 'cancelled' });
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
            </div>
          ) : null}

          {latestRun?.status === 'needs_review' && isSkillProposal(latestRun.proposal) ? (
            <div className="cms-proposal-review">
              <strong>Proposta para revisão</strong>
              <p>{latestRun.proposal.summary}</p>
              {latestRun.proposal.warnings.map((warning) => <span key={warning}>{warning}</span>)}
              <div>
                <Button size="sm" onClick={approveProposal}><Icon name="check" size={12} /> Aprovar</Button>
                <Button size="sm" variant="outline" onClick={rejectProposal}>Rejeitar</Button>
              </div>
            </div>
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
