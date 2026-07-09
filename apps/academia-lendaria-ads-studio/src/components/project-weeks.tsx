import { useMemo, useRef, useState } from 'react';
import { parse, stringify } from 'yaml';
import { Button, Icon } from '@/lib/lendaria-ds';
import { getDemoCampaigns } from '@/lib/demo-mode';
import { executeLocalSkill, type SkillProposal } from '@/lib/skill-runtime';
import {
  applyDiagnosis,
  confirmLiteralReading,
  createWeeklyPanel,
  decideWeeklyLever,
  updateWeeklyMetric,
} from '@/lib/weekly-panel';
import { activeBriefFor, useProjectStore } from '@/stores/project-store';
import type { WeeklyPanel } from '@/lib/project-domain';

function diagnosisFromProposal(proposal: SkillProposal): NonNullable<WeeklyPanel['diagnosis']> {
  const fields = Object.fromEntries(proposal.fields.map((field) => [field.key.toLowerCase(), field.value]));
  return {
    hypothesis: fields.hypothesis || fields.hipotese || '',
    singleLever: fields.singlelever || fields.alavanca_unica || fields.alavanca || '',
    successCriterion: fields.successcriterion || fields.criterio_sucesso || '',
    reversalCriterion: fields.reversalcriterion || fields.criterio_reversao || '',
    circuitBreakerTriggered: ['true', 'sim', 'yes'].includes((fields.circuitbreakertriggered || fields.circuit_breaker || '').toLowerCase()),
  };
}

export function ProjectWeeks({ projectId }: { projectId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const project = useProjectStore((state) => state.projects.find((candidate) => candidate.id === projectId));
  const revisions = useProjectStore((state) => state.briefRevisions);
  const brief = activeBriefFor(projectId, revisions);
  const allPanels = useProjectStore((state) => state.weeklyPanels);
  const panels = useMemo(() => allPanels.filter((panel) => panel.projectId === projectId), [allPanels, projectId]);
  const upsertPanel = useProjectStore((state) => state.upsertWeeklyPanel);
  const addArtifact = useProjectStore((state) => state.addArtifact);
  const [campaignId, setCampaignId] = useState('');
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(panels[0]?.id ?? null);
  const [proposal, setProposal] = useState<SkillProposal | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [humanAction, setHumanAction] = useState('');
  const campaigns = useMemo(() => project ? getDemoCampaigns(project.workspaceId).filter((campaign) => !campaign.project_id || campaign.project_id === projectId) : [], [project, projectId]);
  const effectiveCampaignId = campaignId || campaigns[0]?.id || '';
  const selected = panels.find((panel) => panel.id === selectedPanelId) ?? panels.find((panel) => panel.campaignId === effectiveCampaignId) ?? panels[0];

  if (!project || !brief) return null;
  const workspaceId = project.workspaceId;
  const briefData = brief.data as unknown as Record<string, unknown>;

  function createWeek() {
    if (!effectiveCampaignId) return;
    const panel = createWeeklyPanel(projectId, effectiveCampaignId);
    upsertPanel(panel);
    setSelectedPanelId(panel.id);
  }

  function saveMetric(name: string, patch: Parameters<typeof updateWeeklyMetric>[2]) {
    if (!selected) return;
    upsertPanel(updateWeeklyMetric(selected, name, patch));
  }

  function confirmReader() {
    if (!selected) return;
    const next = confirmLiteralReading(selected);
    upsertPanel(next);
    addArtifact({
      workspaceId,
      projectId,
      artifactType: 'trafficMetricReading',
      title: `Leitura ${selected.weekStart}`,
      path: `generated/squad-trafego/${selected.campaignId}/${selected.weekStart}/metric-reading.yaml`,
      format: 'yaml',
      state: 'confirmed',
      verification: 'confirmed',
      source: 'skill_run',
      content: stringify({ metrics: next.metrics, reader: next.reader }),
    });
  }

  async function runDiagnosis() {
    if (!selected || selected.status === 'draft') return;
    setError(null);
    setRunning(true);
    try {
      const result = await executeLocalSkill('diagnosticador', {
        projectId,
        brief: briefData,
        context: { weeklyPanel: selected },
        operatorInput: 'Retorne exatamente uma alavanca. Em fields use as chaves hypothesis, singleLever, successCriterion, reversalCriterion e circuitBreakerTriggered.',
      });
      setProposal(result.proposal);
    } catch (runtimeError) {
      setError(runtimeError instanceof Error ? runtimeError.message : 'Falha ao rodar o Diagnosticador.');
    } finally {
      setRunning(false);
    }
  }

  function approveDiagnosis() {
    if (!selected || !proposal) return;
    try {
      const diagnosis = diagnosisFromProposal(proposal);
      const next = applyDiagnosis(selected, diagnosis);
      upsertPanel(next);
      addArtifact({
        workspaceId,
        projectId,
        artifactType: 'trafficDiagnosis',
        title: `Diagnóstico ${selected.weekStart}`,
        path: `generated/squad-trafego/${selected.campaignId}/${selected.weekStart}/diagnosis.md`,
        format: 'markdown',
        state: 'confirmed',
        verification: 'confirmed',
        source: 'skill_run',
        content: proposal.resultMarkdown,
      });
      setProposal(null);
    } catch (diagnosisError) {
      setError(diagnosisError instanceof Error ? diagnosisError.message : 'Diagnóstico incompleto.');
    }
  }

  function decide(status: 'approved' | 'rejected') {
    if (!selected || !humanAction.trim()) return;
    upsertPanel(decideWeeklyLever(selected, status, humanAction.trim()));
  }

  function exportPanel() {
    if (!selected) return;
    const blob = new Blob([stringify(selected)], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `PAINEL-DA-SEMANA-${selected.weekStart}.yaml`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importPanel(file: File) {
    setError(null);
    try {
      const parsed = parse(await file.text()) as WeeklyPanel;
      if (parsed.schemaVersion !== '1.0.0' || !parsed.id || !Array.isArray(parsed.metrics)) throw new Error('Painel YAML incompatível.');
      upsertPanel({ ...parsed, projectId });
      setSelectedPanelId(parsed.id);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Não foi possível importar o painel.');
    }
  }

  return (
    <div className="asx-page cms-page cms-weeks-page">
      <div className="asx-page-head">
        <div><div className="asx-page-head__eyebrow">Operação semanal</div><h1 className="asx-page-head__title">Painel da <em>semana</em></h1></div>
        <div className="cms-page-actions">
          <input ref={inputRef} className="sr-only" type="file" accept=".yaml,.yml,text/yaml" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importPanel(file); event.currentTarget.value = ''; }} />
          <button className="asx-iconbtn" type="button" onClick={() => inputRef.current?.click()} title="Importar YAML" aria-label="Importar YAML"><Icon name="upload" size={14} /></button>
          <button className="asx-iconbtn" type="button" onClick={exportPanel} disabled={!selected} title="Exportar YAML" aria-label="Exportar YAML"><Icon name="download" size={14} /></button>
        </div>
      </div>

      {error ? <div className="cms-inline-error">{error}</div> : null}

      <div className="cms-week-toolbar">
        <label><span>Campanha</span><select className="al-input" value={effectiveCampaignId} onChange={(event) => { setCampaignId(event.target.value); const panel = panels.find((candidate) => candidate.campaignId === event.target.value); setSelectedPanelId(panel?.id ?? null); }}>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label>
        <label><span>Semana</span><select className="al-input" value={selected?.id ?? ''} onChange={(event) => setSelectedPanelId(event.target.value)}><option value="">Nenhuma semana</option>{panels.filter((panel) => panel.campaignId === effectiveCampaignId).map((panel) => <option key={panel.id} value={panel.id}>{new Date(`${panel.weekStart}T12:00:00`).toLocaleDateString('pt-BR')}</option>)}</select></label>
        <Button onClick={createWeek} disabled={!effectiveCampaignId}><Icon name="plus" size={13} /> Nova semana</Button>
      </div>

      {selected ? (
        <>
          <section className="cms-week-section">
            <div className="cms-section__head"><div><span className="cms-kicker">Leitor de Métricas</span><h2>Valores literais confirmados</h2></div><span className={`cms-week-status is-${selected.status}`}>{selected.status}</span></div>
            <div className="cms-metrics-table">
              <div className="cms-metrics-head"><span>Métrica</span><span>Valor</span><span>Selo</span><span>Fonte</span><span>Confirmado</span></div>
              {selected.metrics.map((metric) => (
                <div key={metric.name} className="cms-metric-row">
                  <strong>{metric.name}</strong>
                  <input className="al-input" type="number" step="any" value={metric.value ?? ''} disabled={metric.seal === 'nao_fornecido'} onChange={(event) => saveMetric(metric.name, { value: event.target.value === '' ? null : Number(event.target.value) })} />
                  <select className="al-input" value={metric.seal} onChange={(event) => saveMetric(metric.name, { seal: event.target.value as typeof metric.seal })}><option value="nao_fornecido">Não fornecido</option><option value="Real">Real</option><option value="Estimado">Estimado</option></select>
                  <input className="al-input" value={metric.source} disabled={metric.seal === 'nao_fornecido'} onChange={(event) => saveMetric(metric.name, { source: event.target.value })} placeholder="Meta, checkout, CRM" />
                  <label className="cms-confirm-metric"><input type="checkbox" checked={metric.confirmedByHuman} disabled={metric.seal === 'nao_fornecido'} onChange={(event) => saveMetric(metric.name, { confirmedByHuman: event.target.checked })} /><span>Sim</span></label>
                  {metric.name === 'ROAS' ? <label className="cms-cash-confirm"><input type="checkbox" checked={metric.cashConfirmed ?? false} onChange={(event) => saveMetric(metric.name, { cashConfirmed: event.target.checked })} /><span>Venda confirmada no caixa</span></label> : null}
                </div>
              ))}
            </div>
            <div className="cms-reader-note"><Icon name="shield-check" size={14} /><span>{selected.reader.note}</span></div>
            <Button onClick={confirmReader}><Icon name="check" size={13} /> Confirmar leitura literal</Button>
          </section>

          <section className="cms-week-section">
            <div className="cms-section__head"><div><span className="cms-kicker">Diagnosticador</span><h2>Uma alavanca por vez</h2></div></div>
            {proposal ? <div className="cms-week-proposal"><strong>{proposal.summary}</strong><pre>{proposal.resultMarkdown}</pre><div><Button onClick={approveDiagnosis}>Usar como diagnóstico</Button><Button variant="outline" onClick={() => setProposal(null)}>Rejeitar</Button></div></div> : selected.diagnosis ? <div className="cms-diagnosis-grid"><div><span>Hipótese</span><strong>{selected.diagnosis.hypothesis}</strong></div><div><span>Alavanca única</span><strong>{selected.diagnosis.singleLever}</strong></div><div><span>Critério de sucesso</span><strong>{selected.diagnosis.successCriterion}</strong></div><div><span>Critério de reversão</span><strong>{selected.diagnosis.reversalCriterion}</strong></div></div> : <Button onClick={() => void runDiagnosis()} disabled={running || selected.status === 'draft'}><Icon name="flash" size={13} /> {running ? 'Diagnosticando...' : 'Rodar Diagnosticador'}</Button>}

            {selected.diagnosis ? <div className="cms-decision-box"><label><span>Ação/observação do operador</span><input className="al-input" value={humanAction} onChange={(event) => setHumanAction(event.target.value)} /></label><div><Button onClick={() => decide('approved')} disabled={!humanAction.trim()}>Aprovar alavanca</Button><Button variant="outline" onClick={() => decide('rejected')} disabled={!humanAction.trim()}>Rejeitar</Button></div>{selected.decision.status !== 'pending' ? <p>Decisão registrada: <strong>{selected.decision.status}</strong></p> : null}</div> : null}
          </section>

          <section className="cms-week-section">
            <div className="cms-section__head"><div><span className="cms-kicker">Histórico append-only</span><h2>Eventos da semana</h2></div><span>{selected.events.length} eventos</span></div>
            <div className="cms-event-list">{selected.events.map((event) => <div key={event.id}><span>{new Date(event.createdAt).toLocaleString('pt-BR')}</span><strong>{event.type}</strong><small>{event.actor}</small></div>)}</div>
          </section>
        </>
      ) : <div className="cms-empty-state">Crie a primeira semana para iniciar a leitura.</div>}
    </div>
  );
}
