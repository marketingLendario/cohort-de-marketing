import { Link } from '@tanstack/react-router';
import { Icon } from '@/lib/lendaria-ds';
import {
  buildCampaignReadinessContext,
  CAMPAIGN_CAPABILITIES,
  campaignReadinessRouteHint,
  campaignReadinessSourceLabel,
  evaluateCampaignReadiness,
  type CampaignReadinessBlockingEntry,
  type CampaignReadinessSnapshot,
} from '@/lib/campaign-readiness';
import { useProjectStore } from '@/stores/project-store';

/**
 * Painel de prontidão de campanha (STORY-12.W2.1 — AC3).
 *
 * Consome o snapshot `campaign-readiness.v1` da W1 (`shared/campaign-readiness.ts`
 * + wiring em `src/lib/campaign-readiness.ts`) — não inventa uma segunda matriz
 * de regras. Avalia as 6 capabilities (`CAMPAIGN_CAPABILITIES`) e lista, para
 * cada uma, as lacunas com fonte/impacto/ação (AC3). Não guarda o snapshot em
 * estado local: recomputa a cada render a partir do store, então concluir uma
 * ação (preencher um campo do briefing, rodar uma skill) atualiza o painel sem
 * exigir navegação manual de ida e volta — a mudança no store já dispara o
 * re-render (mesmo princípio de `ProjectOverview`/`ProjectCampaigns`).
 */

export interface CampaignReadinessPanelProps {
  projectId: string;
}

const CAPABILITY_STATE_LABEL: Record<CampaignReadinessSnapshot['state'], string> = {
  blocked: 'Bloqueada',
  ready_with_warnings: 'Pronta com ressalvas',
  ready: 'Pronta',
};

const CAPABILITY_STATE_DOT: Record<CampaignReadinessSnapshot['state'], string> = {
  blocked: 'locked',
  ready_with_warnings: 'recommended',
  ready: 'ready',
};

function ReadinessActionLink({
  projectId,
  action,
  label,
}: {
  projectId: string;
  action: CampaignReadinessBlockingEntry['action'];
  label: string;
}) {
  const hint = campaignReadinessRouteHint(action);
  if (hint.kind === 'projects') {
    return (
      <Link to="/projects" className="cms-readiness-panel__gap-action">
        {label}
        <Icon name="nav-arrow-right" size={11} />
      </Link>
    );
  }
  if (hint.kind === 'briefing') {
    return (
      <Link
        to="/projects/$projectId/briefing/$sectionId"
        params={{ projectId, sectionId: hint.sectionId }}
        className="cms-readiness-panel__gap-action"
      >
        {label}
        <Icon name="nav-arrow-right" size={11} />
      </Link>
    );
  }
  return (
    <Link to="/projects/$projectId/journey" params={{ projectId }} className="cms-readiness-panel__gap-action">
      {label}
      <Icon name="nav-arrow-right" size={11} />
    </Link>
  );
}

export function CampaignReadinessPanel({ projectId }: CampaignReadinessPanelProps) {
  const project = useProjectStore((state) => state.projects.find((candidate) => candidate.id === projectId));
  const projects = useProjectStore((state) => state.projects);
  const briefRevisions = useProjectStore((state) => state.briefRevisions);
  const artifacts = useProjectStore((state) => state.artifacts);
  const skillRuns = useProjectStore((state) => state.skillRuns);

  if (!project) {
    return (
      <section
        className="cms-readiness-panel is-loading"
        data-testid="campaign-readiness-panel"
        data-panel-state="loading"
        aria-live="polite"
      >
        <span className="cms-loader" aria-hidden="true" />
        <p>Carregando o projeto...</p>
      </section>
    );
  }

  const context = buildCampaignReadinessContext(projectId, { projects, briefRevisions, artifacts, skillRuns });

  if (!context.brief) {
    return (
      <section className="cms-readiness-panel is-empty" data-testid="campaign-readiness-panel" data-panel-state="empty">
        <Icon name="edit-pencil" size={20} />
        <h2>Comece pelo briefing</h2>
        <p>Preencha o briefing do projeto para ver o que falta para criar e operar uma campanha.</p>
        <Link
          to="/projects/$projectId/briefing/$sectionId"
          params={{ projectId, sectionId: 'project' }}
          className="al-btn al-btn--primary al-btn--size-sm"
        >
          Preencher o briefing
          <Icon name="nav-arrow-right" size={12} />
        </Link>
      </section>
    );
  }

  let snapshots: CampaignReadinessSnapshot[];
  try {
    snapshots = CAMPAIGN_CAPABILITIES.map((target) => evaluateCampaignReadiness(target, context));
  } catch (evaluationError) {
    console.error('campaign-readiness-panel: falha ao calcular a prontidão da campanha.', evaluationError);
    return (
      <section className="cms-readiness-panel is-error" data-testid="campaign-readiness-panel" data-panel-state="error">
        <Icon name="warning-triangle" size={20} />
        <h2>Não foi possível calcular a prontidão da campanha</h2>
        <p>Recarregue a página. Se o problema continuar, avise o suporte da turma.</p>
      </section>
    );
  }

  const createSnapshot = snapshots.find((snapshot) => snapshot.target === 'campaign.create') ?? snapshots[0]!;
  const blockedCount = snapshots.filter((snapshot) => snapshot.state === 'blocked').length;
  const warningCount = snapshots.filter((snapshot) => snapshot.state === 'ready_with_warnings').length;
  const overallState: CampaignReadinessSnapshot['state'] = blockedCount > 0
    ? 'blocked'
    : warningCount > 0
      ? 'ready_with_warnings'
      : 'ready';

  return (
    <section
      className={`cms-readiness-panel is-${overallState}`}
      data-testid="campaign-readiness-panel"
      data-panel-state={overallState}
      data-fingerprint={createSnapshot.inputFingerprint}
      data-capability-allowed={String(createSnapshot.capability.allowed)}
      data-next-action-target={createSnapshot.nextAction?.target ?? ''}
      aria-label="Prontidão da campanha"
    >
      <div className="cms-readiness-panel__head">
        <div>
          <span className="cms-kicker">Prontidão</span>
          <h2>
            {overallState === 'ready'
              ? 'Tudo pronto para operar'
              : overallState === 'ready_with_warnings'
                ? 'Pronta com ressalvas'
                : 'Ainda faltam alguns passos'}
          </h2>
        </div>
        <span className={`cms-readiness-panel__summary is-${overallState}`}>
          {blockedCount > 0
            ? `${blockedCount} bloqueio(s)`
            : warningCount > 0
              ? `${warningCount} ressalva(s)`
              : 'Pronta'}
        </span>
      </div>

      <ul className="cms-readiness-panel__list">
        {snapshots.map((snapshot) => (
          <li
            key={snapshot.target}
            className={`cms-readiness-panel__capability is-${snapshot.state}`}
            data-testid={`campaign-readiness-capability-${snapshot.target}`}
          >
            <div className="cms-readiness-panel__capability-head">
              <span className={`cms-state-dot is-${CAPABILITY_STATE_DOT[snapshot.state]}`} />
              <strong>{snapshot.capability.label}</strong>
              <span className="cms-readiness-panel__capability-state">{CAPABILITY_STATE_LABEL[snapshot.state]}</span>
            </div>

            {snapshot.blocking.length > 0 ? (
              <ul className="cms-readiness-panel__gaps">
                {snapshot.blocking.map((entry) => (
                  <li key={entry.code} className="cms-readiness-panel__gap">
                    <span className="cms-readiness-panel__gap-source">{campaignReadinessSourceLabel(entry.source)}</span>
                    <span className="cms-readiness-panel__gap-label">{entry.label}</span>
                    <ReadinessActionLink projectId={projectId} action={entry.action} label="Corrigir" />
                  </li>
                ))}
              </ul>
            ) : null}

            {snapshot.warnings.length > 0 ? (
              <ul className="cms-readiness-panel__warnings">
                {snapshot.warnings.map((warning) => (
                  <li key={warning.code}>{warning.label}</li>
                ))}
              </ul>
            ) : null}

            {snapshot.blocking.length === 0 && snapshot.warnings.length === 0 ? (
              <p className="cms-readiness-panel__ready-note">
                <Icon name="check-circle" size={13} /> Sem pendências.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
