import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button, Icon } from '@/lib/lendaria-ds';
import { DEMO_AUTH_ENABLED, getDemoCampaign } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import type { AdsCampaign } from '@/lib/types';
import { canStructureCampaign, createInitialCampaignPlan, TRACKING_CHECKS, updateTrackingCheck } from '@/lib/campaign-plan';
import { getPath, type CampaignPlanRevision } from '@/lib/project-domain';
import { startSkillRun, type SkillRunDonePayload } from '@/lib/skill-runtime';
import {
  buildCampaignReadinessContext,
  campaignReadinessRouteHint,
  evaluateCampaignReadiness,
  type CampaignCapability,
  type CampaignReadinessSnapshot,
} from '@/lib/campaign-readiness';
import {
  classifyReadinessBlocked,
  classifyStaleReadiness,
  isCampaignReadinessSnapshotStale,
  type CampaignRunClassifiedError,
} from '@/lib/campaign-run-errors';
import { activeBriefFor, useProjectStore } from '@/stores/project-store';
import { TrafficSimulationBanner } from '@/components/traffic-simulation-banner';
import { CampaignRunStatus } from '@/components/campaign-run-status';

/**
 * Local-only run bookkeeping (STORY-12.W3.1 AC3 — "reaparece após
 * reload/restart"). The durable source of truth is always the skill-run job
 * journal (server/jobs); this is only the pointer that lets a browser reload
 * on THIS page re-attach `observeSkillRun` to the SAME `jobId` instead of
 * losing track of an in-flight run. Losing it (private browsing, storage
 * disabled) degrades gracefully — the operator just sees "Gerar" again.
 */
function runStorageKey(campaignId: string, skillId: 'briefista' | 'estruturador'): string {
  return `cms-campaign-run:${campaignId}:${skillId}`;
}

function readPersistedJobId(campaignId: string, skillId: 'briefista' | 'estruturador'): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(runStorageKey(campaignId, skillId));
  } catch {
    return null;
  }
}

function persistJobId(campaignId: string, skillId: 'briefista' | 'estruturador', jobId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (jobId) window.localStorage.setItem(runStorageKey(campaignId, skillId), jobId);
    else window.localStorage.removeItem(runStorageKey(campaignId, skillId));
  } catch {
    // Storage unavailable — the observation still works for this tab; only
    // the reload-resume convenience is lost (never a functional failure).
  }
}

const STAGES = [
  { id: 'foundations', label: 'Fundamentos', icon: 'database' },
  { id: 'tracking', label: 'Zelador', icon: 'shield-check' },
  { id: 'briefista', label: 'Briefista', icon: 'spark' },
  { id: 'curation', label: 'Curadoria', icon: 'check-circle' },
  { id: 'structure', label: 'Estrutura', icon: 'network' },
  { id: 'submission', label: 'Subida manual', icon: 'upload' },
  { id: 'metrics', label: 'Leitura', icon: 'stats-up-square' },
  { id: 'diagnosis', label: 'Alavanca', icon: 'flash' },
] as const;

type StageId = (typeof STAGES)[number]['id'];

function stageAvailable(stage: StageId, plan: CampaignPlanRevision): boolean {
  if (stage === 'foundations') return true;
  if (stage === 'tracking') return plan.budget.daily >= 20;
  if (stage === 'briefista') return ['OK', 'PARCIAL'].includes(plan.tracking.status);
  if (stage === 'curation') return ['OK', 'PARCIAL'].includes(plan.tracking.status);
  if (stage === 'structure') return canStructureCampaign(plan);
  if (stage === 'submission') return Boolean(plan.structure);
  return plan.manualSubmission.status === 'confirmed_by_human';
}

export function TrafficCampaignWorkspace({ projectId, campaignId, stageId }: { projectId: string; campaignId: string; stageId: string }) {
  const navigate = useNavigate();
  const revisions = useProjectStore((state) => state.briefRevisions);
  const brief = activeBriefFor(projectId, revisions);
  const project = useProjectStore((state) => state.projects.find((candidate) => candidate.id === projectId));
  const projects = useProjectStore((state) => state.projects);
  const artifacts = useProjectStore((state) => state.artifacts);
  const skillRuns = useProjectStore((state) => state.skillRuns);
  const plans = useProjectStore((state) => state.campaignPlans);
  const upsertPlan = useProjectStore((state) => state.upsertCampaignPlan);
  const addArtifact = useProjectStore((state) => state.addArtifact);
  const [campaign, setCampaign] = useState<AdsCampaign | null>(() => getDemoCampaign(campaignId));
  const plan = plans.find((candidate) => candidate.campaignId === campaignId);
  const currentStage = (STAGES.some((stage) => stage.id === stageId) ? stageId : 'foundations') as StageId;
  const [proposal, setProposal] = useState<{ skillId: 'briefista' | 'estruturador'; value: SkillRunDonePayload['proposal']; hash: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [draftFinalist, setDraftFinalist] = useState({ hook: '', copy: '', format: 'reels-9x16' as 'feed' | 'reels-9x16' });

  // STORY-12.W3.1: durable, observable run tracking per skill (AC1-AC4).
  const [runJobIds, setRunJobIds] = useState<Record<'briefista' | 'estruturador', string | null>>(() => ({
    briefista: readPersistedJobId(campaignId, 'briefista'),
    estruturador: readPersistedJobId(campaignId, 'estruturador'),
  }));
  const [preflightErrors, setPreflightErrors] = useState<Record<'briefista' | 'estruturador', CampaignRunClassifiedError | null>>({
    briefista: null,
    estruturador: null,
  });
  // The readiness snapshot captured at the moment each run STARTED (AC4 —
  // compared against a fresh evaluation before an in-place retry is allowed
  // to fire, so a retry never blindly reuses a since-gone-stale go-ahead).
  const startedSnapshotsRef = useRef<Record<'briefista' | 'estruturador', CampaignReadinessSnapshot | null>>({
    briefista: null,
    estruturador: null,
  });

  function readinessContext() {
    return buildCampaignReadinessContext(projectId, { projects, briefRevisions: revisions, artifacts, skillRuns });
  }

  function capabilityFor(skillId: 'briefista' | 'estruturador'): CampaignCapability {
    return skillId === 'briefista' ? 'campaign.brief' : 'campaign.structure';
  }

  useEffect(() => {
    if (DEMO_AUTH_ENABLED) {
      setCampaign(getDemoCampaign(campaignId));
      return;
    }
    let active = true;
    void supabase
      .from('ads_campaigns')
      .select('id, workspace_id, project_id, name, status, step_current, created_at')
      .eq('id', campaignId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setCampaign((data as AdsCampaign | null) ?? null);
      });
    return () => { active = false; };
  }, [campaignId]);

  useEffect(() => {
    if (!plan && brief) upsertPlan(createInitialCampaignPlan(projectId, campaignId, brief));
  }, [brief, campaignId, plan, projectId, upsertPlan]);

  const inherited = useMemo<Array<[string, unknown]>>(() => brief ? [
    ['Oferta', getPath(brief.data, 'offer.name').value],
    ['Preço', getPath(brief.data, 'offer.exactPrice').value ? `R$ ${Number(getPath(brief.data, 'offer.exactPrice').value).toLocaleString('pt-BR')}` : 'Não informado'],
    ['Público', getPath(brief.data, 'market.targetAudience').value],
    ['Temperatura', getPath(brief.data, 'market.trafficTemperature').value],
    ['Voz', getPath(brief.data, 'project.voice').value],
    ['Destino', getPath(brief.data, 'channels.primaryCtaUrl').value],
  ] : [], [brief]);

  if (!project || !brief || !plan) {
    return <div className="asx-page cms-page"><div className="cms-empty-state">Preparando campanha...</div></div>;
  }
  const activePlan = plan;
  const activeBrief = brief;
  const workspaceId = project.workspaceId;

  function save(patch: Partial<CampaignPlanRevision>) {
    upsertPlan({ ...activePlan, ...patch, id: activePlan.id, updatedAt: new Date().toISOString() });
  }

  function go(stage: StageId) {
    if (!stageAvailable(stage, activePlan)) return;
    navigate({ to: '/projects/$projectId/campaigns/$campaignId/$stageId', params: { projectId, campaignId, stageId: stage } });
  }

  /** Clears the run being tracked for a skill (terminal handoff or a stale-blocked retry). */
  function clearRun(skillId: 'briefista' | 'estruturador') {
    setRunJobIds((prevIds) => ({ ...prevIds, [skillId]: null }));
    persistJobId(campaignId, skillId, null);
    startedSnapshotsRef.current[skillId] = null;
  }

  async function runSkill(skillId: 'briefista' | 'estruturador') {
    setRuntimeError(null);
    const capability = capabilityFor(skillId);
    const snapshot = evaluateCampaignReadiness(capability, readinessContext());
    if (snapshot.state === 'blocked') {
      setPreflightErrors((prevErrors) => ({ ...prevErrors, [skillId]: classifyReadinessBlocked(snapshot) }));
      return;
    }
    setPreflightErrors((prevErrors) => ({ ...prevErrors, [skillId]: null }));
    startedSnapshotsRef.current[skillId] = snapshot;
    setRunning(true);
    try {
      const result = await startSkillRun(skillId, {
        projectId,
        brief: activeBrief.data as unknown as Record<string, unknown>,
        context: { campaignPlan: activePlan },
        operatorInput: skillId === 'briefista'
          ? 'Gere a bateria para os ângulos do CampaignPlan. Não escolha finalistas.'
          : 'Monte o default sagrado usando somente os finalistas curados. Não publique.',
      });
      setRunJobIds((prevIds) => ({ ...prevIds, [skillId]: result.jobId }));
      persistJobId(campaignId, skillId, result.jobId);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : 'Falha no runner local.');
    } finally {
      setRunning(false);
    }
  }

  /** AC4 — before an in-place retry fires, prove the readiness snapshot has not gone stale since the run started. */
  function beforeRetry(skillId: 'briefista' | 'estruturador'): boolean {
    const started = startedSnapshotsRef.current[skillId];
    if (!started) return true;
    const capability = capabilityFor(skillId);
    const fresh = evaluateCampaignReadiness(capability, readinessContext());
    if (isCampaignReadinessSnapshotStale(started, fresh)) {
      setPreflightErrors((prevErrors) => ({ ...prevErrors, [skillId]: classifyStaleReadiness(capability, fresh) }));
      clearRun(skillId);
      return false;
    }
    return true;
  }

  function retryPreflight(skillId: 'briefista' | 'estruturador') {
    const classified = preflightErrors[skillId];
    if (!classified) return;
    if (classified.action.kind === 'inline') {
      // STALE_READINESS — just clear the notice; the operator retries via "Gerar".
      setPreflightErrors((prevErrors) => ({ ...prevErrors, [skillId]: null }));
      return;
    }
    const hint = campaignReadinessRouteHint({
      kind: classified.action.kind as 'briefing' | 'journey',
      target: classified.action.target ?? '',
    });
    if (hint.kind === 'projects') navigate({ to: '/projects' });
    else if (hint.kind === 'briefing') navigate({ to: '/projects/$projectId/briefing/$sectionId', params: { projectId, sectionId: hint.sectionId } });
    else navigate({ to: '/projects/$projectId/journey', params: { projectId } });
  }

  function handleRunDone(skillId: 'briefista' | 'estruturador', payload: SkillRunDonePayload) {
    setProposal({ skillId, value: payload.proposal, hash: payload.skillHash });
  }

  function approveProposal() {
    if (!proposal) return;
    const artifactType = proposal.skillId === 'briefista' ? 'trafficCreativeBattery' : 'trafficCampaignPlan';
    const artifactId = addArtifact({
      workspaceId,
      projectId,
      artifactType,
      title: proposal.skillId === 'briefista' ? 'Bateria criativa' : 'Estrutura da campanha',
      path: `generated/squad-trafego/${campaignId}/${proposal.skillId}.md`,
      format: 'markdown',
      state: 'confirmed',
      verification: 'confirmed',
      source: 'skill_run',
      hash: proposal.hash,
      content: proposal.value.resultMarkdown,
    });
    if (proposal.skillId === 'estruturador') {
      save({ structure: { artifactId, markdown: proposal.value.resultMarkdown }, manualSubmission: { status: 'ready' } });
    }
    clearRun(proposal.skillId);
    setProposal(null);
  }

  function confirmTracking() {
    if (!['OK', 'PARCIAL'].includes(activePlan.tracking.status)) return;
    const artifactId = addArtifact({
      workspaceId,
      projectId,
      artifactType: 'trafficTrackingAudit',
      title: 'Auditoria do Zelador',
      path: `generated/squad-trafego/${campaignId}/tracking-audit.json`,
      format: 'json',
      state: 'confirmed',
      verification: 'confirmed',
      source: 'skill_run',
      content: JSON.stringify(activePlan.tracking, null, 2),
    });
    save({ tracking: { ...activePlan.tracking, auditArtifactId: artifactId } });
  }

  function addFinalist(event: React.FormEvent) {
    event.preventDefault();
    if (!draftFinalist.hook.trim() || !draftFinalist.copy.trim() || activePlan.finalists.length >= 3) return;
    const finalist = {
      id: `finalist-${Date.now()}`,
      angleId: activePlan.angles[0]?.id ?? 'angle-1',
      hook: draftFinalist.hook.trim(),
      copy: draftFinalist.copy.trim(),
      format: draftFinalist.format,
      selectedByHuman: true as const,
    };
    save({ finalists: [...activePlan.finalists, finalist] });
    setDraftFinalist({ hook: '', copy: '', format: 'reels-9x16' });
  }

  const content = currentStage === 'foundations' ? (
    <section className="cms-campaign-stage">
      <div className="cms-stage-intro"><span className="cms-kicker">Revisão {brief.revision} do briefing</span><h2>Fundamentos herdados</h2><p>Valores de projeto permanecem ligados à fonte. Orçamento e objetivo pertencem a esta campanha.</p></div>
      <div className="cms-inherited-grid">
        {inherited.map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{String(value ?? 'Não informado')}</strong><small>Herdado do briefing</small></div>)}
      </div>
      <div className="cms-campaign-form-grid">
        <label><span>Objetivo</span><select className="al-input" value={plan.objective} onChange={(event) => save({ objective: event.target.value as 'sales' | 'leads' })}><option value="sales">Vendas</option><option value="leads">Cadastro</option></select></label>
        <label><span>Verba diária</span><input className="al-input" type="number" min={20} value={plan.budget.daily} onChange={(event) => save({ budget: { ...plan.budget, daily: Number(event.target.value) } })} /></label>
        <label><span>Período</span><input className="al-input" type="number" min={1} value={plan.budget.periodDays} onChange={(event) => save({ budget: { ...plan.budget, periodDays: Number(event.target.value) } })} /></label>
      </div>
      {plan.budget.daily < 20 ? <div className="cms-inline-error">O Estruturador bloqueia campanhas abaixo de R$20 por dia.</div> : null}
    </section>
  ) : currentStage === 'tracking' ? (
    <section className="cms-campaign-stage">
      <div className="cms-stage-intro"><span className="cms-kicker">Gate bloqueante</span><h2>Checklist do Zelador</h2><p>Cada item precisa de uma confirmação literal do que você viu na Meta ou na ferramenta de diagnóstico.</p></div>
      <div className="cms-tracking-checks">
        {TRACKING_CHECKS.map((check) => {
          const current = plan.tracking.checks[check.id];
          return (
            <div key={check.id} className="cms-tracking-check">
              <div><strong>{check.label}</strong><span>{check.critical ? 'Crítico' : 'Recomendado'}</span></div>
              <div className="cms-yes-no"><button type="button" className={current?.value === true ? 'is-yes' : ''} onClick={() => upsertPlan(updateTrackingCheck(plan, check.id, { value: true }))}>Sim</button><button type="button" className={current?.value === false ? 'is-no' : ''} onClick={() => upsertPlan(updateTrackingCheck(plan, check.id, { value: false }))}>Não</button></div>
              <input className="al-input" value={current?.evidence ?? ''} onChange={(event) => upsertPlan(updateTrackingCheck(plan, check.id, { evidence: event.target.value }))} placeholder="O que apareceu na tela?" />
            </div>
          );
        })}
      </div>
      <div className={`cms-gate-status is-${plan.tracking.status.toLowerCase()}`}><span>Status do gate</span><strong>{plan.tracking.status}</strong></div>
      <Button onClick={confirmTracking} disabled={!['OK', 'PARCIAL'].includes(plan.tracking.status) || Boolean(plan.tracking.auditArtifactId)}><Icon name="check" size={13} /> {plan.tracking.auditArtifactId ? 'Auditoria registrada' : 'Confirmar auditoria'}</Button>
    </section>
  ) : currentStage === 'briefista' ? (
    <section className="cms-campaign-stage">
      <div className="cms-stage-intro"><span className="cms-kicker">Geração com revisão</span><h2>Bateria do Briefista</h2><p>Os ângulos vêm do projeto. A skill gera opções; a escolha final continua humana.</p></div>
      <div className="cms-angle-list">{plan.angles.map((angle) => <div key={angle.id}><strong>{angle.name}</strong><span>Consciência {angle.awarenessLevel} · {angle.source}</span></div>)}</div>
      <Button onClick={() => void runSkill('briefista')} disabled={running || Boolean(runJobIds.briefista)}><Icon name="spark" size={13} /> {running ? 'Gerando...' : 'Gerar bateria'}</Button>
      <CampaignRunStatus
        jobId={runJobIds.briefista}
        skillLabel="Briefista"
        preflightError={preflightErrors.briefista}
        onRetryPreflight={() => retryPreflight('briefista')}
        onDone={(payload) => handleRunDone('briefista', payload)}
        onBeforeRetry={() => beforeRetry('briefista')}
      />
    </section>
  ) : currentStage === 'curation' ? (
    <section className="cms-campaign-stage">
      <div className="cms-stage-intro"><span className="cms-kicker">Decisão humana</span><h2>Curadoria de finalistas</h2><p>Escolha de dois a três criativos. O Estruturador não recebe itens fora desta lista.</p></div>
      <div className="cms-finalist-list">{plan.finalists.map((finalist, index) => <div key={finalist.id}><span>{index + 1}</span><div><strong>{finalist.hook}</strong><small>{finalist.format}</small></div><button type="button" className="asx-square-action" onClick={() => save({ finalists: plan.finalists.filter((item) => item.id !== finalist.id) })} title="Remover" aria-label="Remover"><Icon name="trash" size={13} /></button></div>)}</div>
      <form className="cms-finalist-form" onSubmit={addFinalist}><label><span>Hook</span><input className="al-input" value={draftFinalist.hook} onChange={(event) => setDraftFinalist({ ...draftFinalist, hook: event.target.value })} /></label><label><span>Copy</span><textarea className="al-input" value={draftFinalist.copy} onChange={(event) => setDraftFinalist({ ...draftFinalist, copy: event.target.value })} /></label><label><span>Formato</span><select className="al-input" value={draftFinalist.format} onChange={(event) => setDraftFinalist({ ...draftFinalist, format: event.target.value as typeof draftFinalist.format })}><option value="reels-9x16">Reels 9:16</option><option value="feed">Feed</option></select></label><Button type="submit" disabled={plan.finalists.length >= 3 || !draftFinalist.hook || !draftFinalist.copy}>Adicionar finalista</Button></form>
      <div className={`cms-gate-status ${plan.finalists.length >= 2 ? 'is-ok' : 'is-pending'}`}><span>Curadoria</span><strong>{plan.finalists.length}/3 finalistas</strong></div>
    </section>
  ) : currentStage === 'structure' ? (
    <section className="cms-campaign-stage">
      <div className="cms-stage-intro"><span className="cms-kicker">Default sagrado</span><h2>Estrutura da campanha</h2><p>Uma campanha, um conjunto e os finalistas curados. Nenhuma publicação será executada.</p></div>
      <div className="cms-structure-summary"><div><span>Tipo</span><strong>{plan.objective === 'sales' ? 'Vendas' : 'Cadastro'}</strong></div><div><span>Público</span><strong>Amplo/frio + Advantage+</strong></div><div><span>Criativos</span><strong>{plan.finalists.length}</strong></div><div><span>Verba</span><strong>R$ {plan.budget.daily}/dia</strong></div></div>
      <Button onClick={() => void runSkill('estruturador')} disabled={running || Boolean(runJobIds.estruturador) || !canStructureCampaign(plan)}><Icon name="network" size={13} /> {running ? 'Estruturando...' : 'Gerar plano campo a campo'}</Button>
      <CampaignRunStatus
        jobId={runJobIds.estruturador}
        skillLabel="Estruturador"
        preflightError={preflightErrors.estruturador}
        onRetryPreflight={() => retryPreflight('estruturador')}
        onDone={(payload) => handleRunDone('estruturador', payload)}
        onBeforeRetry={() => beforeRetry('estruturador')}
      />
    </section>
  ) : currentStage === 'submission' ? (
    <section className="cms-campaign-stage">
      <div className="cms-stage-intro"><span className="cms-kicker">Ação exclusiva do operador</span><h2>Subida manual</h2><p>Revise a estrutura, replique no Gerenciador de Anúncios e confirme somente depois de clicar em Publicar.</p></div>
      <div className="cms-manual-checklist"><span><Icon name="check" size={13} /> Estrutura aprovada</span><span><Icon name="check" size={13} /> Tracking confirmado</span><span><Icon name="check" size={13} /> {plan.finalists.length} criativos finalistas</span><span><Icon name="lock" size={13} /> Nenhuma mutação automática disponível</span></div>
      <Button onClick={() => save({ manualSubmission: { status: 'confirmed_by_human', confirmedAt: new Date().toISOString(), confirmedBy: 'operador' } })} disabled={plan.manualSubmission.status === 'confirmed_by_human'}><Icon name="check" size={13} /> {plan.manualSubmission.status === 'confirmed_by_human' ? 'Publicação humana registrada' : 'Confirmar que publiquei na Meta'}</Button>
    </section>
  ) : (
    <section className="cms-campaign-stage">
      <div className="cms-stage-intro"><span className="cms-kicker">Operação semanal</span><h2>{currentStage === 'metrics' ? 'Leitura de métricas' : 'Próxima alavanca'}</h2><p>Este trabalho acontece na semana ativa para preservar a história de cada ciclo.</p></div>
      <Link to="/projects/$projectId/weeks" params={{ projectId }} className="al-btn al-btn--primary">Abrir operação semanal <Icon name="nav-arrow-right" size={13} /></Link>
    </section>
  );

  return (
    <div className="asx-page cms-page cms-campaign-workspace">
      <div className="asx-page-head"><div><div className="asx-page-head__eyebrow">Campanha · {campaign?.name ?? campaignId}</div><h1 className="asx-page-head__title">Operação de <em>tráfego</em></h1></div><span className="cms-campaign-pill"><span>{plan.manualSubmission.status}</span></span></div>
      <TrafficSimulationBanner />
      <nav className="cms-campaign-stages" aria-label="Etapas da campanha">{STAGES.map((stage, index) => { const available = stageAvailable(stage.id, plan); return <button key={stage.id} type="button" className={`${stage.id === currentStage ? 'is-active' : ''} ${!available ? 'is-locked' : ''}`} disabled={!available} onClick={() => go(stage.id)}><span>{available ? index + 1 : <Icon name="lock" size={10} />}</span><strong>{stage.label}</strong></button>; })}</nav>
      {runtimeError ? <div className="cms-inline-error">{runtimeError}</div> : null}
      {proposal ? <section className="cms-campaign-proposal"><span className="cms-kicker">Proposta da skill</span><h2>{proposal.value.summary}</h2><pre>{proposal.value.resultMarkdown}</pre><div><Button onClick={approveProposal}><Icon name="check" size={13} /> Aprovar proposta</Button><Button variant="outline" onClick={() => setProposal(null)}>Rejeitar</Button></div></section> : content}
      <div className="cms-campaign-stage-nav">{STAGES.findIndex((stage) => stage.id === currentStage) > 0 ? <button type="button" onClick={() => go(STAGES[STAGES.findIndex((stage) => stage.id === currentStage) - 1]!.id)}><Icon name="nav-arrow-left" size={13} /> Voltar</button> : <span />}{STAGES.findIndex((stage) => stage.id === currentStage) < STAGES.length - 1 ? <button type="button" disabled={!stageAvailable(STAGES[STAGES.findIndex((stage) => stage.id === currentStage) + 1]!.id, plan)} onClick={() => go(STAGES[STAGES.findIndex((stage) => stage.id === currentStage) + 1]!.id)}>Avançar <Icon name="nav-arrow-right" size={13} /></button> : null}</div>
    </div>
  );
}
