import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Icon } from '@/lib/lendaria-ds';
import type { CampaignPlanRevision } from '@/lib/project-domain';
import {
  creativeAssetUrl,
  manifestFromProposal,
  promoteCreativeBatch,
  type CreativePromotionResponse,
} from '@/lib/creative-factory-runtime';
import {
  cancelSkillRun,
  observeSkillRun,
  retrySkillRun,
  startSkillRun,
  type SkillRunStepView,
} from '@/lib/skill-runtime';

const ARCHETYPES = [
  ['dark_editorial', 'Editorial escuro'],
  ['light_clean', 'Clean claro'],
  ['person_authority', 'Autoridade'],
  ['mockup_product', 'Mockup'],
  ['ugc_native', 'UGC nativo'],
  ['didactic_compare', 'Comparativo'],
] as const;

const PERSONAS = [
  ['alan-nicolas', 'Alan Nicolas'],
  ['fran-martins', 'Fran Martins'],
  ['erica-souza', 'Erica Souza'],
  ['rafael-costa', 'Rafael Costa'],
  ['bruno-gentil', 'Bruno Gentil'],
] as const;

type CreativeArchetype = (typeof ARCHETYPES)[number][0];
type CreativeFormat = 'feed' | 'story' | 'square';
type CreativePersona = (typeof PERSONAS)[number][0];

export function RealCreativeFactory(props: {
  projectId: string;
  workspaceId: string;
  campaignId: string;
  brief: Record<string, unknown>;
  plan: CampaignPlanRevision;
  onSave: (patch: Partial<CampaignPlanRevision>) => void;
  onPromoted: (response: CreativePromotionResponse) => string;
}) {
  const [formats, setFormats] = useState<CreativeFormat[]>(['feed', 'story']);
  const [archetypes, setArchetypes] = useState<CreativeArchetype[]>(['dark_editorial', 'didactic_compare']);
  const [variants, setVariants] = useState(1);
  const [personas, setPersonas] = useState<CreativePersona[]>(['alan-nicolas']);
  const [steps, setSteps] = useState<SkillRunStepView[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(props.plan.creativeFactory?.error ?? null);
  const factory = props.plan.creativeFactory;
  const factoryRef = useRef(factory);
  const onSaveRef = useRef(props.onSave);
  const jobId = factory?.jobId;
  const factoryStatus = factory?.status;

  useEffect(() => {
    factoryRef.current = factory;
    onSaveRef.current = props.onSave;
  }, [factory, props.onSave]);

  useEffect(() => {
    if (!jobId || !factoryStatus || !['queued', 'running'].includes(factoryStatus)) return;
    setBusy(true);
    return observeSkillRun(jobId, {
      onSnapshot: (view) => {
        setSteps(view.steps);
        const current = factoryRef.current;
        if (current && view.status === 'running' && current.status !== 'running') {
          onSaveRef.current({ creativeFactory: { ...current, status: 'running' } });
        }
      },
      onProgress: (progress) => {
        if (progress.step) setSteps((current) => [...current.filter((step) => step.id !== progress.step!.id), progress.step!]);
      },
      onDone: (done) => {
        try {
          const manifest = manifestFromProposal(done.proposal);
          onSaveRef.current({
            creativeFactory: {
              jobId: done.jobId,
              batchId: manifest.batchId,
              status: 'review',
              manifest,
              selectedItemIds: [],
            },
          });
          setError(null);
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : 'Manifesto criativo inválido.';
          const current = factoryRef.current;
          if (current) onSaveRef.current({ creativeFactory: { ...current, status: 'failed', error: message } });
          setError(message);
        } finally {
          setBusy(false);
        }
      },
      onError: (failure) => {
        const current = factoryRef.current;
        if (current) onSaveRef.current({ creativeFactory: { ...current, status: 'failed', error: failure.reason } });
        setError(failure.reason);
        setBusy(false);
      },
    });
  }, [jobId, factoryStatus]);

  const selected = useMemo(() => new Set(factory?.selectedItemIds ?? []), [factory?.selectedItemIds]);

  function toggleFormat(format: CreativeFormat) {
    setFormats((current) => current.includes(format) ? current.filter((item) => item !== format) : [...current, format]);
  }

  function toggleArchetype(archetype: CreativeArchetype) {
    setArchetypes((current) => current.includes(archetype) ? current.filter((item) => item !== archetype) : [...current, archetype]);
  }

  function togglePersona(persona: CreativePersona) {
    setPersonas((current) => current.includes(persona) ? current.filter((item) => item !== persona) : [...current, persona]);
  }

  async function generate() {
    if (formats.length === 0 || archetypes.length === 0 || props.plan.finalists.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const started = await startSkillRun('ads-creative-factory', {
        workspaceId: props.workspaceId,
        projectId: props.projectId,
        brief: props.brief,
        context: {
          creativeFactory: {
            campaignId: props.campaignId,
            formats,
            archetypes,
            variants,
            personas: archetypes.some((archetype) => archetype === 'person_authority' || archetype === 'ugc_native') ? personas : [],
            cta: 'Saiba mais',
            linkDescription: 'Conheça a Academia Lendária',
            finalists: props.plan.finalists,
          },
        },
        operatorInput: 'Gere as peças visuais e legendas dos finalistas curados. Não publique na Meta.',
      });
      props.onSave({ creativeFactory: { jobId: started.jobId, status: 'queued', selectedItemIds: [] } });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Não foi possível iniciar a geração.';
      setBusy(false);
      setError(message);
    }
  }

  async function cancel() {
    if (!factory?.jobId) return;
    await cancelSkillRun(factory.jobId);
  }

  async function retry() {
    if (!factory?.jobId) return;
    setBusy(true);
    setError(null);
    await retrySkillRun(factory.jobId);
    props.onSave({ creativeFactory: { ...factory, status: 'queued', error: undefined } });
  }

  function toggleItem(itemId: string) {
    if (!factory) return;
    const next = new Set(factory.selectedItemIds);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    props.onSave({ creativeFactory: { ...factory, selectedItemIds: [...next] } });
  }

  async function promote() {
    if (!factory?.batchId || factory.selectedItemIds.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const response = await promoteCreativeBatch({
        batchId: factory.batchId,
        projectId: props.projectId,
        selectedItemIds: factory.selectedItemIds,
      });
      const artifactId = props.onPromoted(response);
      props.onSave({
        creativeFactory: { ...factory, status: 'approved', artifactId },
        manualSubmission: { status: 'ready' },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível promover os criativos.');
    } finally {
      setBusy(false);
    }
  }

  if (!factory?.manifest) {
    return (
      <section className="cms-campaign-stage">
        <div className="cms-stage-intro"><span className="cms-kicker">Creative Factory real</span><h2>Gerar imagens e legendas</h2><p>Escolha a cobertura do lote. Cada peça passa pelo gate automático e depois pela sua revisão.</p></div>
        <div className="cms-factory-controls">
          <fieldset><legend>Formatos</legend><div>{(['feed', 'story', 'square'] as const).map((format) => <label key={format}><input type="checkbox" checked={formats.includes(format)} onChange={() => toggleFormat(format)} /> <span>{format}</span></label>)}</div></fieldset>
          <fieldset><legend>Arquétipos</legend><div>{ARCHETYPES.map(([id, label]) => {
            const requiresAuthorization = id === 'person_authority' || id === 'ugc_native';
            return <label key={id} title={requiresAuthorization ? 'Exige foto registrada e autorização verificável.' : undefined}><input type="checkbox" disabled={requiresAuthorization} checked={archetypes.includes(id)} onChange={() => toggleArchetype(id)} /> <span>{label}{requiresAuthorization ? ' (requer autorização)' : ''}</span></label>;
          })}</div></fieldset>
          <fieldset disabled><legend>Personas registradas</legend><div>{PERSONAS.map(([id, label]) => <label key={id}><input type="checkbox" checked={personas.includes(id)} onChange={() => togglePersona(id)} /> <span>{label}</span></label>)}</div></fieldset>
          <label><span>Variações por arquétipo</span><select className="al-input" value={variants} onChange={(event) => setVariants(Number(event.target.value))}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></label>
        </div>
        {steps.length > 0 ? <div className="cms-factory-progress">{steps.map((step) => <span key={step.id} className={`is-${step.status}`}><Icon name={step.status === 'done' ? 'check' : 'refresh'} size={13} /> {step.label}</span>)}</div> : null}
        {error ? <div className="cms-inline-error">{error}</div> : null}
        <div className="cms-factory-actions">
          {factory?.status === 'failed' ? <Button onClick={() => void retry()} disabled={busy}><Icon name="refresh" size={13} /> Tentar novamente</Button> : <Button onClick={() => void generate()} disabled={busy || formats.length === 0 || archetypes.length === 0}><Icon name="spark" size={13} /> {busy ? 'Gerando...' : 'Gerar lote real'}</Button>}
          {busy && factory?.jobId ? <Button variant="outline" onClick={() => void cancel()}>Cancelar</Button> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="cms-campaign-stage">
      <div className="cms-stage-intro"><span className="cms-kicker">Revisão humana</span><h2>{factory.manifest.items.length} criativos gerados</h2><p>Itens sinalizados pelo gate ficam bloqueados. Selecione apenas o que realmente deve entrar no pacote final.</p></div>
      <div className="cms-factory-grid">
        {factory.manifest.items.map((item) => {
          const ready = item.status === 'ready';
          const primary = item.assets[0]!;
          return <article key={item.id} className={`cms-factory-card ${ready ? '' : 'is-flagged'} ${selected.has(item.id) ? 'is-selected' : ''}`}>
            <div className="cms-factory-media" style={{ aspectRatio: `${primary.width}/${primary.height}` }}><img src={creativeAssetUrl(factory.manifest!.batchId, primary.id)} alt={item.headline} /></div>
            <div className="cms-factory-card-body"><div><span>{item.archetype.replaceAll('_', ' ')}</span><strong>{ready ? 'Gate aprovado' : 'Revisão necessária'}</strong></div><h3>{item.headline}</h3><p>{item.caption}</p><dl><div><dt>CTA</dt><dd>{item.cta}</dd></div><div><dt>Link</dt><dd>{item.linkDescription}</dd></div></dl><small>{item.assets.map((asset) => `${asset.format} ${asset.width}×${asset.height}`).join(' · ')}</small><label className="cms-factory-select"><input type="checkbox" disabled={!ready || factory.status === 'approved'} checked={selected.has(item.id)} onChange={() => toggleItem(item.id)} /><span>{selected.has(item.id) ? 'Selecionado' : 'Aprovar para o pacote'}</span></label></div>
          </article>;
        })}
      </div>
      {error ? <div className="cms-inline-error">{error}</div> : null}
      <div className="cms-factory-actions"><Button onClick={() => void promote()} disabled={busy || selected.size === 0 || factory.status === 'approved'}><Icon name="check" size={13} /> {factory.status === 'approved' ? 'Pacote aprovado' : `Promover ${selected.size} selecionado(s)`}</Button>{factory.status === 'review' ? <Button variant="outline" onClick={() => void generate()} disabled={busy}><Icon name="refresh" size={13} /> Gerar nova versão</Button> : null}</div>
    </section>
  );
}
