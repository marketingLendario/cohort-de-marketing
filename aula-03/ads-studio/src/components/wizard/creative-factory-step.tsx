import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Button, Icon } from '@/lib/lendaria-ds';
import {
  CREATIVE_ARCHETYPE_META,
  CREATIVE_FORMAT_META,
  CREATIVE_PERSONAS,
  assignCreativeToSlot,
  buildCreativeBatch,
  clearCreativeSlot,
  creativeBatchTotal,
  defaultCreativeFactoryState,
  selectedCreativeArchetypes,
  selectedCreativeFormats,
  summarizeCreativeFactory,
  updateCreative,
  type CreativeArchetype,
  type CreativeFactoryState,
  type CreativeFormat,
  type CreativeItem,
  type CreativePersona,
} from '@/lib/creative-factory';
import {
  getDemoCreativeFactory,
  saveDemoCreativeFactory,
  updateDemoCampaignStep,
} from '@/lib/demo-mode';

const FORMAT_KEYS = Object.keys(CREATIVE_FORMAT_META) as CreativeFormat[];
const ARCHETYPE_KEYS = Object.keys(CREATIVE_ARCHETYPE_META) as CreativeArchetype[];

interface CreativeFactoryStepProps {
  campaignId: string;
  onBack?: () => void;
  onAdvanced?: (targetStep: number) => void;
}

function ConfigChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`asx-factory-chip${active ? ' asx-factory-chip--active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CreativeCard({
  creative,
  assigned,
  onApprove,
  onRegenerate,
  onDiscard,
  onAssign,
  onDragStart,
}: {
  creative: CreativeItem;
  assigned: boolean;
  onApprove: () => void;
  onRegenerate: () => void;
  onDiscard: () => void;
  onAssign: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
}) {
  return (
    <article
      className={`asx-creative-card${creative.approved ? ' asx-creative-card--approved' : ''}`}
      draggable={creative.approved}
      onDragStart={onDragStart}
    >
      <div className="asx-creative-card__media">
        <img src={creative.image} alt={creative.hook} />
        <span className={`asx-creative-gate asx-creative-gate--${creative.gate ? 'ok' : 'warning'}`}>
          {creative.gate ? 'gate ok' : 'ai-slop'}
        </span>
        {assigned && (
          <span className="asx-creative-assigned">
            <Icon name="check" size={11} /> slot
          </span>
        )}
      </div>
      <div className="asx-creative-card__meta">
        <span>{CREATIVE_FORMAT_META[creative.format].label}</span>
        <span>{CREATIVE_ARCHETYPE_META[creative.archetype]}</span>
      </div>
      <div className="asx-creative-card__actions">
        <button
          type="button"
          className={creative.approved ? 'is-approved' : ''}
          aria-label={creative.approved ? 'Criativo aprovado' : 'Aprovar'}
          title={creative.approved ? 'Criativo aprovado' : 'Aprovar'}
          onClick={onApprove}
        >
          <Icon name="check" size={13} />
        </button>
        <button type="button" aria-label="Regenerar" title="Regenerar" onClick={onRegenerate}>
          <Icon name="refresh-double" size={13} className={creative.status === 'regenerating' ? 'asx-recalc' : ''} />
        </button>
        <button type="button" aria-label="Descartar" title="Descartar" onClick={onDiscard}>
          <Icon name="trash" size={13} />
        </button>
        {creative.approved && (
          <button type="button" aria-label="Atribuir a slot" title="Atribuir a slot" onClick={onAssign}>
            <Icon name="frame" size={13} />
          </button>
        )}
      </div>
    </article>
  );
}

export function CreativeFactoryStep({ campaignId, onBack, onAdvanced }: CreativeFactoryStepProps) {
  const [state, setState] = useState<CreativeFactoryState>(() => defaultCreativeFactoryState());
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const generationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const regenerateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = getDemoCreativeFactory(campaignId);
    if (saved?.generation === 'generating') {
      const creatives = buildCreativeBatch(saved);
      setState({ ...saved, generation: 'done', progress: creatives.length, creatives });
    } else {
      setState(saved ?? defaultCreativeFactoryState());
    }
    return () => {
      if (generationTimer.current) clearInterval(generationTimer.current);
      if (regenerateTimer.current) clearTimeout(regenerateTimer.current);
    };
  }, [campaignId]);

  const summary = useMemo(() => summarizeCreativeFactory(state), [state]);
  const selectedFormats = useMemo(() => selectedCreativeFormats(state), [state]);
  const selectedArchetypes = useMemo(() => selectedCreativeArchetypes(state), [state]);
  const liveCreatives = state.creatives.filter((creative) => creative.status !== 'discarded');
  const assignedCreativeIds = new Set(state.slots.flatMap((slot) => (slot.filled ? [slot.filled] : [])));
  const groups = Array.from(new Set(liveCreatives.map((creative) => creative.hookIndex))).map((hookIndex) => ({
    hookIndex,
    hook: liveCreatives.find((creative) => creative.hookIndex === hookIndex)?.hook ?? '',
    creatives: liveCreatives.filter((creative) => creative.hookIndex === hookIndex),
  }));

  function commit(next: CreativeFactoryState) {
    setState(next);
    saveDemoCreativeFactory(campaignId, next);
  }

  function toggleFormat(format: CreativeFormat) {
    commit({ ...state, formats: { ...state.formats, [format]: !state.formats[format] } });
  }

  function toggleArchetype(archetype: CreativeArchetype) {
    commit({ ...state, archetypes: { ...state.archetypes, [archetype]: !state.archetypes[archetype] } });
  }

  function togglePersona(persona: CreativePersona) {
    commit({ ...state, personas: { ...state.personas, [persona]: !state.personas[persona] } });
  }

  function handleGenerate() {
    const target = buildCreativeBatch(state);
    if (!target.length) return;
    if (generationTimer.current) clearInterval(generationTimer.current);
    const start = { ...state, view: 'gallery' as const, generation: 'generating' as const, progress: 0, creatives: [] };
    commit(start);
    let progress = 0;
    generationTimer.current = setInterval(() => {
      progress += 1;
      setState((current) => {
        const done = progress >= target.length;
        const next = {
          ...current,
          generation: done ? ('done' as const) : ('generating' as const),
          progress,
          creatives: target.slice(0, progress),
        };
        if (done) {
          if (generationTimer.current) clearInterval(generationTimer.current);
          generationTimer.current = null;
          saveDemoCreativeFactory(campaignId, next);
        }
        return next;
      });
    }, 120);
  }

  function handleApprove(creativeId: string) {
    commit(updateCreative(state, creativeId, { approved: true, status: 'approved' }));
  }

  function handleRegenerate(creativeId: string) {
    const regenerating = updateCreative(state, creativeId, { status: 'regenerating' });
    commit(regenerating);
    if (regenerateTimer.current) clearTimeout(regenerateTimer.current);
    regenerateTimer.current = setTimeout(() => {
      setState((current) => {
        const next = updateCreative(current, creativeId, { status: 'generated', gate: true });
        saveDemoCreativeFactory(campaignId, next);
        return next;
      });
    }, 700);
  }

  function handleAssign(creativeId: string, slotId: string) {
    commit(assignCreativeToSlot(state, creativeId, slotId));
    setAssignFor(null);
  }

  function handleDrop(event: DragEvent<HTMLElement>, slotId: string) {
    event.preventDefault();
    if (dragId) handleAssign(dragId, slotId);
    setDragId(null);
  }

  function handleBack() {
    if (state.view === 'gallery') {
      commit({ ...state, view: 'config' });
      return;
    }
    onBack?.();
  }

  function handleNext() {
    saveDemoCreativeFactory(campaignId, state);
    updateDemoCampaignStep(campaignId, 6);
    onAdvanced?.(6);
  }

  return (
    <div className="asx-factory">
      <div className="asx-factory-toolbar">
        <div className="asx-factory-tabs" role="tablist" aria-label="Modo da fábrica">
          <button
            type="button"
            role="tab"
            aria-selected={state.view === 'config'}
            className={state.view === 'config' ? 'is-active' : ''}
            onClick={() => commit({ ...state, view: 'config' })}
          >
            Configuração
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={state.view === 'gallery'}
            className={state.view === 'gallery' ? 'is-active' : ''}
            onClick={() => commit({ ...state, view: 'gallery' })}
          >
            Galeria
          </button>
        </div>
        {state.view === 'gallery' && (
          <span className="asx-factory-slot-count">{summary.filled}/{summary.slots} slots preenchidos</span>
        )}
      </div>

      {state.view === 'config' ? (
        <div className="asx-factory-config-layout">
          <div className="asx-factory-config">
            <section className="asx-group">
              <div className="asx-group__head">
                <Icon name="crop" size={14} color="var(--primary)" /> Formatos
              </div>
              <div className="asx-factory-chips">
                {FORMAT_KEYS.map((format) => (
                  <ConfigChip key={format} active={state.formats[format]} onClick={() => toggleFormat(format)}>
                    <span>{CREATIVE_FORMAT_META[format].ratio}</span> {CREATIVE_FORMAT_META[format].label}
                  </ConfigChip>
                ))}
              </div>
            </section>

            <section className="asx-group">
              <div className="asx-group__head">
                <Icon name="light-bulb" size={14} color="var(--primary)" /> Arquétipos
              </div>
              <div className="asx-factory-chips">
                {ARCHETYPE_KEYS.map((archetype) => (
                  <ConfigChip
                    key={archetype}
                    active={state.archetypes[archetype]}
                    onClick={() => toggleArchetype(archetype)}
                  >
                    {CREATIVE_ARCHETYPE_META[archetype]}
                  </ConfigChip>
                ))}
              </div>
            </section>

            <section className="asx-group">
              <div className="asx-group__head asx-factory-persona-head">
                <Icon name="group" size={14} color="var(--primary)" />
                Personas
                <em>fotos reais de experts, nunca rosto sintético</em>
              </div>
              <div className="asx-factory-personas">
                {CREATIVE_PERSONAS.map((persona) => {
                  const initials = persona.name.split(' ').map((part) => part[0]).join('').slice(0, 2);
                  const active = state.personas[persona.key];
                  return (
                    <button
                      type="button"
                      key={persona.key}
                      className={active ? 'is-active' : ''}
                      aria-pressed={active}
                      onClick={() => togglePersona(persona.key)}
                    >
                      <span style={{ background: persona.color }}>{initials}</span>
                      <strong>{persona.name}</strong>
                      <small>{persona.role}</small>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="asx-group asx-factory-options">
              <div>
                <span>Variantes por hook</span>
                <div className="asx-factory-stepper">
                  <button type="button" aria-label="Diminuir variantes" onClick={() => commit({ ...state, variants: Math.max(1, state.variants - 1) })}>
                    <Icon name="minus" size={13} />
                  </button>
                  <strong>{state.variants}</strong>
                  <button type="button" aria-label="Aumentar variantes" onClick={() => commit({ ...state, variants: Math.min(6, state.variants + 1) })}>
                    <Icon name="plus" size={13} />
                  </button>
                </div>
              </div>
              <div>
                <span>Fonte da copy</span>
                <div className="asx-factory-source">
                  {(['will-binder', 'inline'] as const).map((source) => (
                    <button
                      type="button"
                      key={source}
                      className={state.copySource === source ? 'is-active' : ''}
                      aria-pressed={state.copySource === source}
                      onClick={() => commit({ ...state, copySource: source })}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>
              <div className="asx-factory-brand">
                <span>Brand-pack</span>
                <strong>Academia Lendária</strong>
                <small>herdado · lock</small>
              </div>
            </section>
          </div>

          <aside className="asx-factory-summary">
            <div className="asx-factory-summary__title">Resumo do lote</div>
            <strong>{creativeBatchTotal(state)}</strong>
            <em>peças serão geradas</em>
            <div className="asx-factory-summary__rows">
              <div><span>Hooks</span><strong>4</strong></div>
              <div><span>Arquétipos</span><strong>{selectedArchetypes.length}</strong></div>
              <div><span>Variantes</span><strong>{state.variants}</strong></div>
              <div><span>Formatos</span><strong>{selectedFormats.length}</strong></div>
            </div>
            <Button disabled={!selectedFormats.length || !selectedArchetypes.length} onClick={handleGenerate}>
              <Icon name="sparks" size={15} /> Gerar criativos
            </Button>
            <p>Produção assíncrona. Você revisa cada peça na galeria.</p>
          </aside>
        </div>
      ) : (
        <div className="asx-factory-gallery-layout">
          <div className="asx-factory-gallery">
            <div className="asx-factory-gallery__status">
              {state.generation === 'generating' ? (
                <>
                  <Icon name="sparks" size={14} className="asx-recalc" />
                  Gerando criativos… <strong>{state.progress} / {creativeBatchTotal(state)}</strong>
                </>
              ) : (
                <>{summary.approved} aprovadas · {summary.generated} geradas</>
              )}
            </div>
            {groups.map((group) => (
              <section className="asx-creative-group" key={group.hookIndex}>
                <div className="asx-creative-group__head">
                  <span>Hook {String(group.hookIndex + 1).padStart(2, '0')}</span>
                  <strong>{group.hook}</strong>
                </div>
                <div className="asx-creative-grid">
                  {group.creatives.map((creative) => (
                    <CreativeCard
                      key={creative.id}
                      creative={creative}
                      assigned={assignedCreativeIds.has(creative.id)}
                      onApprove={() => handleApprove(creative.id)}
                      onRegenerate={() => handleRegenerate(creative.id)}
                      onDiscard={() => commit(updateCreative(state, creative.id, { status: 'discarded', approved: false }))}
                      onAssign={() => setAssignFor(creative.id)}
                      onDragStart={() => setDragId(creative.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="asx-factory-slots">
            <div className="asx-factory-slots__head">
              <span>Ad slots</span>
              <strong>{summary.filled}/{summary.slots}</strong>
            </div>
            <div className="asx-factory-slot-list">
              {state.slots.map((slot) => {
                const creative = state.creatives.find((item) => item.id === slot.filled);
                return (
                  <div
                    key={slot.id}
                    className={`asx-factory-slot${creative ? ' is-filled' : ''}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, slot.id)}
                  >
                    <span className="asx-factory-slot__thumb">
                      {creative ? <img src={creative.image} alt="" /> : <Icon name="frame" size={14} />}
                    </span>
                    <div>
                      <strong>{slot.label}</strong>
                      <small>{slot.sub}</small>
                    </div>
                    {creative && (
                      <button type="button" aria-label="Limpar slot" title="Limpar slot" onClick={() => commit(clearCreativeSlot(state, slot.id))}>
                        <Icon name="xmark" size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p>Arraste uma peça aprovada para um slot, ou use atribuir a slot.</p>
          </aside>
        </div>
      )}

      <div className="asx-action-bar asx-factory-actions">
        <Button variant="ghost" onClick={handleBack}>
          <Icon name="arrow-left" size={15} /> Voltar
        </Button>
        <Button onClick={handleNext}>
          Avançar para Tracking <Icon name="arrow-right" size={15} />
        </Button>
      </div>

      {assignFor && (
        <div className="asx-factory-modal" role="presentation" onMouseDown={() => setAssignFor(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="assign-slot-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="asx-factory-modal__head">
              <h2 id="assign-slot-title">Atribuir a slot</h2>
              <button type="button" aria-label="Fechar" onClick={() => setAssignFor(null)}><Icon name="xmark" size={17} /></button>
            </div>
            <p>Escolha um ad slot vazio para a peça aprovada.</p>
            <div className="asx-factory-modal__slots">
              {state.slots.filter((slot) => !slot.filled).map((slot) => (
                <button type="button" key={slot.id} onClick={() => handleAssign(assignFor, slot.id)}>
                  <Icon name="frame" size={15} color="var(--primary)" />
                  <span><strong>{slot.label}</strong><small>{slot.sub}</small></span>
                </button>
              ))}
              {state.slots.every((slot) => slot.filled) && <em>Todos os slots já estão preenchidos.</em>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
