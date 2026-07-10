import { Link } from '@tanstack/react-router';
import { Icon } from '@/lib/lendaria-ds';
import { skillCatalog } from '@/generated/skill-catalog';
import { evaluateProjectSkills, nextProjectAction } from '@/lib/readiness';
import { getDemoCampaigns } from '@/lib/demo-mode';
import { activeBriefFor, useProjectStore } from '@/stores/project-store';

const READINESS_LABELS = {
  ready: 'Pronta',
  recommended: 'Pronta com ressalvas',
  almost: 'Quase pronta',
  locked: 'Bloqueada',
  not_applicable: 'Não se aplica',
} as const;

function actionCopy(action: ReturnType<typeof nextProjectAction>) {
  if (!action) return 'Jornada concluída';
  if (action.action === 'review') return 'Revisar proposta';
  if (action.action === 'resume') return 'Acompanhar execução';
  if (action.action === 'open_result') return 'Abrir resultado';
  if (action.action === 'run') return 'Começar esta etapa';
  if (action.action === 'open_artifact') return 'Revisar material';
  return 'Completar informações';
}

function studentDescription(skillId: string | undefined, fallback: string | undefined) {
  if (skillId === 'comecar') return 'Vamos conferir o que já está pronto e indicar o primeiro passo do seu projeto.';
  return fallback
    ?.replace(/\bskills?\b/gi, 'etapas')
    .replace(/\b(?:Git|Apify|Node|YAML|CLI|API)\b/gi, 'ferramentas necessárias')
    ?? 'Abra esta etapa para ver a orientação e continuar.';
}

function studentMissingLabel(value: string | undefined) {
  if (!value) return undefined;
  const label = value.split('.').at(-1)?.replaceAll('_', ' ') ?? value;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function ProjectOverview({ projectId }: { projectId: string }) {
  const project = useProjectStore((state) => state.projects.find((candidate) => candidate.id === projectId));
  const revisions = useProjectStore((state) => state.briefRevisions);
  const allArtifacts = useProjectStore((state) => state.artifacts);
  const allRuns = useProjectStore((state) => state.skillRuns);
  const artifacts = allArtifacts.filter((artifact) => artifact.projectId === projectId);
  const runs = allRuns.filter((run) => run.projectId === projectId);
  const brief = activeBriefFor(projectId, revisions);
  if (!project || !brief) return null;

  const evaluations = evaluateProjectSkills(brief, artifacts, runs);
  const next = nextProjectAction(evaluations);
  const nextSkill = skillCatalog.skills.find((skill) => skill.id === next?.skillId);
  const done = evaluations.filter((evaluation) => evaluation.lifecycle === 'done').length;
  const ready = evaluations.filter((evaluation) => ['ready', 'recommended'].includes(evaluation.readiness) && evaluation.lifecycle === 'idle').length;
  const pendingReview = evaluations.filter((evaluation) => evaluation.lifecycle === 'needs_review').length;
  const campaigns = getDemoCampaigns(project.workspaceId).filter((campaign) => !campaign.project_id || campaign.project_id === projectId);
  const recentArtifacts = [...artifacts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);
  const missingLabel = studentMissingLabel(next?.missingFields[0] ?? next?.missingArtifacts[0] ?? next?.missingAlternatives[0]);

  const sectionId = next?.missingFields[0]?.split('.')[0] ?? 'project';
  const actionLink = !next ? null : next.action === 'fill_field' ? (
    <Link
      to="/projects/$projectId/briefing/$sectionId"
      params={{ projectId, sectionId }}
      className="al-btn al-btn--primary cms-action-link"
    >
      {actionCopy(next)}
      <Icon name="nav-arrow-right" size={14} />
    </Link>
  ) : next.action === 'open_result' || next.action === 'open_artifact' ? (
    <Link
      to="/projects/$projectId/artifacts"
      params={{ projectId }}
      className="al-btn al-btn--primary cms-action-link"
    >
      {actionCopy(next)}
      <Icon name="nav-arrow-right" size={14} />
    </Link>
  ) : (
    <Link
      to="/projects/$projectId/journey"
      params={{ projectId }}
      className="al-btn al-btn--primary cms-action-link"
    >
      {actionCopy(next)}
      <Icon name="nav-arrow-right" size={14} />
    </Link>
  );

  return (
    <div className="asx-page cms-page">
      <div className="asx-page-head">
        <div>
          <div className="asx-page-head__eyebrow">Visão geral · {project.slug}</div>
          <h1 className="asx-page-head__title">Próximo passo do <em>projeto</em></h1>
        </div>
        <span className="cms-live-status"><span /> Estado salvo</span>
      </div>

      <section className="cms-next-action">
        <div className="cms-next-action__marker"><Icon name="flash" size={19} /></div>
        <div className="cms-next-action__copy">
          <span className="cms-kicker">Ação recomendada</span>
          <h2>{nextSkill?.title ?? 'Tudo em dia'}</h2>
          <p>{studentDescription(nextSkill?.id, nextSkill?.description) ?? 'Não há pendências abertas neste projeto.'}</p>
          {missingLabel ? <span className="cms-next-action__reason">Falta resolver: {missingLabel}</span> : null}
        </div>
        {actionLink}
      </section>

      <section className="cms-stat-strip" aria-label="Resumo do projeto">
        <div><strong>{done}</strong><span>etapas concluídas</span></div>
        <div><strong>{ready}</strong><span>prontas para começar</span></div>
        <div><strong>{pendingReview}</strong><span>aguardando revisão</span></div>
        <div><strong>{campaigns.length}</strong><span>campanhas</span></div>
      </section>

      <div className="cms-overview-grid">
        <section className="cms-section">
          <div className="cms-section__head">
            <div>
              <span className="cms-kicker">Jornada</span>
              <h2>Estado das próximas etapas</h2>
            </div>
            <Link to="/projects/$projectId/journey" params={{ projectId }}>Ver jornada</Link>
          </div>
          <div className="cms-compact-list">
            {evaluations.filter((item) => item.lifecycle !== 'done' && item.readiness !== 'not_applicable').slice(0, 5).map((evaluation) => {
              const skill = skillCatalog.skills.find((candidate) => candidate.id === evaluation.skillId);
              return (
                <div key={evaluation.skillId} className="cms-compact-row">
                  <span className={`cms-state-dot is-${evaluation.lifecycle === 'idle' ? evaluation.readiness : evaluation.lifecycle}`} />
                  <div><strong>{skill?.title}</strong><span>{skill?.phase}</span></div>
                  <span>{evaluation.lifecycle === 'idle' ? READINESS_LABELS[evaluation.readiness] : evaluation.lifecycle.replace('_', ' ')}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="cms-section">
          <div className="cms-section__head">
            <div>
              <span className="cms-kicker">Fontes</span>
              <h2>Artefatos recentes</h2>
            </div>
            <Link to="/projects/$projectId/artifacts" params={{ projectId }}>Ver todos</Link>
          </div>
          <div className="cms-compact-list">
            {recentArtifacts.map((artifact) => (
              <div key={artifact.id} className="cms-compact-row">
                <span className="cms-file-icon"><Icon name="page" size={14} /></span>
                <div><strong>{artifact.title}</strong><span>{artifact.path || 'Aguardando caminho'}</span></div>
                <span>{artifact.verification === 'confirmed' ? 'Verificado' : 'Pendente'}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
