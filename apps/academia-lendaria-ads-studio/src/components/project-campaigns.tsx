import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button, Icon } from '@/lib/lendaria-ds';
import { DEMO_AUTH_ENABLED, getDemoCampaigns } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import { useCreateCampaign } from '@/lib/use-create-campaign';
import { createInitialCampaignPlan } from '@/lib/campaign-plan';
import { buildCampaignReadinessContext, evaluateCampaignReadiness } from '@/lib/campaign-readiness';
import { CampaignReadinessPanel } from '@/components/campaign-readiness-panel';
import { activeBriefFor, useProjectStore } from '@/stores/project-store';
import type { AdsCampaign } from '@/lib/types';

export function ProjectCampaigns({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const project = useProjectStore((state) => state.projects.find((candidate) => candidate.id === projectId));
  const projects = useProjectStore((state) => state.projects);
  const revisions = useProjectStore((state) => state.briefRevisions);
  const brief = activeBriefFor(projectId, revisions);
  const allArtifacts = useProjectStore((state) => state.artifacts);
  const allRuns = useProjectStore((state) => state.skillRuns);
  const upsertPlan = useProjectStore((state) => state.upsertCampaignPlan);
  const allPlans = useProjectStore((state) => state.campaignPlans);
  const plans = allPlans.filter((plan) => plan.projectId === projectId);
  const [campaigns, setCampaigns] = useState<AdsCampaign[]>([]);
  const [name, setName] = useState('');
  const [creatingForm, setCreatingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { createCampaign, creating, error } = useCreateCampaign();

  useEffect(() => {
    if (!project) return;
    if (DEMO_AUTH_ENABLED) {
      setCampaigns(getDemoCampaigns(project.workspaceId).filter((campaign) => !campaign.project_id || campaign.project_id === projectId));
      setLoading(false);
      return;
    }
    void supabase
      .from('ads_campaigns')
      .select('id, workspace_id, project_id, name, status, step_current, created_at')
      .eq('workspace_id', project.workspaceId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCampaigns((data ?? []) as AdsCampaign[]);
        setLoading(false);
      });
  }, [project, projectId]);

  if (!project || !brief) return null;
  const workspaceId = project.workspaceId;
  const activeBrief = brief;

  /**
   * Preflight de UI de `campaign.create` (STORY-12.W2.1 — AC4). O ÚNICO
   * bloqueador real do draft mínimo, por invariante do ADR-002 ("Campanha
   * bloqueada para campaign.create não gera ads_campaigns, campaign_plan nem
   * run; bloqueios das capabilities posteriores mantêm o draft mínimo válido,
   * mas impedem a etapa correspondente" — daí o painel abaixo, não este botão,
   * listar as lacunas de tracking/brief/estrutura). `useCreateCampaign` já
   * reforça este mesmo preflight no momento do insert (12.W1.1); aqui o botão
   * fica desabilitado ANTES da tentativa, para o operador nunca ver um CTA
   * habilitado que resultaria em erro.
   */
  const campaignCreateReadiness = evaluateCampaignReadiness(
    'campaign.create',
    buildCampaignReadinessContext(projectId, { projects, briefRevisions: revisions, artifacts: allArtifacts, skillRuns: allRuns }),
  );
  const createBlocked = campaignCreateReadiness.state === 'blocked';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (createBlocked) return;
    const campaignName = name.trim();
    if (!campaignName) return;
    const campaign = await createCampaign(workspaceId, campaignName, projectId);
    if (!campaign) return;
    upsertPlan(createInitialCampaignPlan(projectId, campaign.id, activeBrief));
    setCampaigns((current) => [campaign, ...current]);
    navigate({
      to: '/projects/$projectId/campaigns/$campaignId/$stageId',
      params: { projectId, campaignId: campaign.id, stageId: 'foundations' },
    });
  }

  return (
    <div className="asx-page cms-page">
      <div className="asx-page-head">
        <div>
          <div className="asx-page-head__eyebrow">Ads Studio · {project.slug}</div>
          <h1 className="asx-page-head__title">Campanhas do <em>projeto</em></h1>
        </div>
        <Button onClick={() => setCreatingForm((value) => !value)} disabled={createBlocked && !creatingForm}>
          <Icon name={creatingForm ? 'xmark' : 'plus'} size={13} /> {creatingForm ? 'Cancelar' : 'Nova campanha'}
        </Button>
      </div>

      <CampaignReadinessPanel projectId={projectId} />

      {creatingForm ? (
        <form className="cms-new-campaign" onSubmit={submit}>
          <label><span>Nome da campanha</span><input className="al-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Validação A3 - Julho" autoFocus /></label>
          <div className="cms-inheritance-note"><Icon name="link" size={14} /><span>Oferta, público, voz e destino serão herdados da revisão {brief.revision} do briefing.</span></div>
          {createBlocked ? (
            <div className="cms-inline-error">
              {campaignCreateReadiness.blocking[0]?.label ?? 'Projeto incompleto para criar campanha.'}
            </div>
          ) : null}
          <Button type="submit" disabled={creating || !name.trim() || createBlocked}>{creating ? 'Criando...' : 'Criar campanha'}</Button>
        </form>
      ) : null}

      {error ? <div className="cms-inline-error">{error}</div> : null}

      <section className="cms-campaign-table" aria-label="Campanhas">
        <div className="cms-campaign-table__head"><span>Campanha</span><span>Etapa</span><span>Status</span><span /></div>
        {loading ? <div className="cms-empty-state">Carregando campanhas...</div> : campaigns.length ? campaigns.map((campaign) => {
          const plan = plans.find((candidate) => candidate.campaignId === campaign.id);
          const stage = plan?.manualSubmission.status === 'confirmed_by_human'
            ? 'Em operação'
            : plan?.structure ? 'Subida manual' : plan?.finalists.length ? 'Estrutura' : 'Preparação';
          return (
            <Link
              key={campaign.id}
              to="/projects/$projectId/campaigns/$campaignId/$stageId"
              params={{ projectId, campaignId: campaign.id, stageId: 'foundations' }}
              className="cms-campaign-table__row"
            >
              <span><strong>{campaign.name}</strong><small>{new Date(campaign.created_at).toLocaleDateString('pt-BR')}</small></span>
              <span>{stage}</span>
              <span className={`cms-campaign-status is-${campaign.status}`}>{campaign.status}</span>
              <Icon name="nav-arrow-right" size={14} />
            </Link>
          );
        }) : <div className="cms-empty-state">Nenhuma campanha neste projeto.</div>}
      </section>
    </div>
  );
}
