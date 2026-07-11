import { useEffect, useMemo, useState, type DragEvent, type KeyboardEvent } from 'react';
import { Badge, Button, Icon, Input, Label } from '@/lib/lendaria-ds';
import {
  AUDIENCE_OPTIONS,
  OBJECTIVE_LABELS,
  addAdToAdset,
  addAdset,
  adNodeName,
  adsetNodeName,
  campaignNodeName,
  defaultCampaignStructure,
  moveAdset,
  removeAdset,
  summarizeStructure,
  type AdsetNode,
  type BudgetMode,
  type CampaignObjective,
  type CampaignStructureState,
} from '@/lib/campaign-structure';
import {
  getDemoCampaign,
  getDemoCampaignStructure,
  getDemoFunnelSelection,
  saveDemoCampaignStructure,
  updateDemoCampaignStep,
} from '@/lib/demo-mode';

const OBJECTIVES = Object.entries(OBJECTIVE_LABELS) as Array<[CampaignObjective, string]>;
const BUDGET_MODES: BudgetMode[] = ['CBO', 'ABO'];

function campaignDisplayName(productName: string) {
  return `[CAMPANHA] ${productName} · AL`;
}

function adsetDisplayName(productName: string, adset: AdsetNode) {
  return `[ADSET] ${adset.audience} · ${productName}`;
}

function adDisplayName(productName: string, adset: AdsetNode, adIndex: number) {
  return `[AD] ${productName} · ${adset.audience} · ${String(adIndex + 1).padStart(2, '0')}`;
}

function SegmentButton({
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
      className={`asx-structure-segment${active ? ' asx-structure-segment--active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function NumberInput({
  id,
  value,
  onChange,
  suffix,
  compact = false,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  compact?: boolean;
}) {
  return (
    <div className={`asx-unit-input${compact ? ' asx-unit-input--compact' : ''}`}>
      <span className="asx-unit-input__prefix">R$</span>
      <Input
        id={id}
        className="asx-unit-input__control"
        type="number"
        min={0}
        inputMode="decimal"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
      />
      {suffix && <span className="asx-unit-input__suffix">{suffix}</span>}
    </div>
  );
}

export interface CampaignStructureStepProps {
  campaignId: string;
  onBack?: () => void;
  onAdvanced?: (targetStep: number) => void;
}

export function CampaignStructureStep({ campaignId, onBack, onAdvanced }: CampaignStructureStepProps) {
  const [state, setState] = useState<CampaignStructureState>(() => defaultCampaignStructure());
  const [saved, setSaved] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    const savedStructure = getDemoCampaignStructure(campaignId);
    if (savedStructure) {
      setState(savedStructure);
      setSaved(true);
      return;
    }

    const funnel = getDemoFunnelSelection(campaignId);
    const productName = funnel?.form.productType || 'Produto';
    setState(defaultCampaignStructure(productName));
    setSaved(false);
  }, [campaignId]);

  const summary = useMemo(() => summarizeStructure(state), [state]);
  const productDisplayName = useMemo(() => {
    const campaignName = getDemoCampaign(campaignId)?.name.trim();
    const source = campaignName && campaignName !== 'Nova campanha' ? campaignName : state.productName;
    return source.split(/\s+/).slice(0, 2).join(' ');
  }, [campaignId, state.productName]);

  function update(next: CampaignStructureState) {
    setState(next);
    setSaved(false);
  }

  function setField<K extends keyof CampaignStructureState>(key: K, value: CampaignStructureState[K]) {
    update({ ...state, [key]: value });
  }

  function updateAdset(adsetId: string, updater: (adset: AdsetNode) => AdsetNode) {
    update({
      ...state,
      adsets: state.adsets.map((adset) => (adset.id === adsetId ? updater(adset) : adset)),
    });
  }

  function moveDraggedAdset(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const currentIndex = state.adsets.findIndex((adset) => adset.id === draggingId);
    const targetIndex = state.adsets.findIndex((adset) => adset.id === targetId);
    if (currentIndex < 0 || targetIndex < 0) return;

    const direction: -1 | 1 = currentIndex < targetIndex ? 1 : -1;
    let next = state;
    for (let index = 0; index < Math.abs(targetIndex - currentIndex); index += 1) {
      next = moveAdset(next, draggingId, direction);
    }
    update(next);
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, adsetId: string) {
    setDraggingId(adsetId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', adsetId);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    moveDraggedAdset(targetId);
    setDraggingId(null);
  }

  function handleMoveKey(event: KeyboardEvent<HTMLButtonElement>, adsetId: string) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    update(moveAdset(state, adsetId, event.key === 'ArrowUp' ? -1 : 1));
  }

  function handleSave() {
    saveDemoCampaignStructure(campaignId, state);
    setSaved(true);
  }

  function handleNext() {
    saveDemoCampaignStructure(campaignId, state);
    updateDemoCampaignStep(campaignId, 4);
    setSaved(true);
    onAdvanced?.(4);
  }

  return (
    <div className="asx-structure">
      <section className="asx-group asx-structure-config" aria-label="Configuração da estrutura">
        <div className="asx-structure-config__row">
          <div className="asx-structure-config__field">
            <Label>Objetivo</Label>
            <div className="asx-structure-segments">
              {OBJECTIVES.map(([value, label]) => (
                <SegmentButton
                  key={value}
                  active={state.objective === value}
                  onClick={() => setField('objective', value)}
                >
                  {label}
                </SegmentButton>
              ))}
            </div>
          </div>

          <div className="asx-structure-config__field asx-structure-config__budget">
            <Label>Orçamento</Label>
            <div className="asx-structure-budget-inputs">
              <NumberInput
                id="structure-budget-total"
                value={state.budgetTotalReais}
                onChange={(value) => setField('budgetTotalReais', value)}
                suffix="total"
              />
              <NumberInput
                id="structure-budget-daily"
                value={state.budgetDailyReais}
                onChange={(value) => setField('budgetDailyReais', value)}
                suffix="/dia"
              />
            </div>
          </div>

          <div className="asx-structure-config__field">
            <Label>Distribuição</Label>
            <div className="asx-structure-segments">
              {BUDGET_MODES.map((mode) => (
                <SegmentButton
                  key={mode}
                  active={state.budgetMode === mode}
                  onClick={() => setField('budgetMode', mode)}
                >
                  {mode}
                </SegmentButton>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="asx-structure-layout">
        <section className="asx-structure-tree" aria-label="Árvore da campanha">
          <div className="asx-structure-campaign">
            <span className="asx-structure-campaign__icon">
              <Icon name="megaphone" size={16} color="var(--primary)" />
            </span>
            <div className="asx-structure-node-copy">
              <strong title={campaignNodeName(state)}>{campaignDisplayName(productDisplayName)}</strong>
              <span>
                {state.objective} · {state.budgetMode}
                {state.budgetMode === 'CBO' ? ' · budget na campanha' : ' · budget por adset'}
              </span>
            </div>
          </div>

          <div className="asx-structure-adsets">
            {state.adsets.map((adset, index) => (
              <article
                key={adset.id}
                className={`asx-structure-adset${draggingId === adset.id ? ' asx-structure-adset--dragging' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(event) => handleDrop(event, adset.id)}
              >
                <div className="asx-structure-adset__head">
                  <button
                    type="button"
                    className="asx-structure-drag"
                    draggable
                    aria-label={`Reordenar ${adsetNodeName(state, adset)}`}
                    title="Arraste para reordenar; use as setas para mover"
                    onDragStart={(event) => handleDragStart(event, adset.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onKeyDown={(event) => handleMoveKey(event, adset.id)}
                  >
                    <Icon name="drag-hand-gesture" size={15} />
                  </button>

                  <button
                    type="button"
                    className="asx-structure-collapse"
                    aria-label={adset.collapsed ? 'Expandir adset' : 'Recolher adset'}
                    aria-expanded={!adset.collapsed}
                    onClick={() =>
                      updateAdset(adset.id, (current) => ({ ...current, collapsed: !current.collapsed }))
                    }
                  >
                    <Icon name={adset.collapsed ? 'nav-arrow-down' : 'nav-arrow-up'} size={15} />
                  </button>

                  <div className="asx-structure-node-copy asx-structure-adset__copy">
                    <strong title={adsetNodeName(state, adset)}>
                      {adsetDisplayName(productDisplayName, adset)}
                    </strong>
                    <div className="asx-structure-adset__detail">
                      <Input
                        value={adset.detail}
                        aria-label={`Detalhe do público ${index + 1}`}
                        onChange={(event) =>
                          updateAdset(adset.id, (current) => ({ ...current, detail: event.target.value }))
                        }
                      />
                      <span>· {adset.ads.length} {adset.ads.length === 1 ? 'ad' : 'ads'}</span>
                    </div>
                  </div>

                  <div className="asx-structure-segments asx-structure-audiences">
                    {AUDIENCE_OPTIONS.map((audience) => (
                      <SegmentButton
                        key={audience}
                        active={adset.audience === audience}
                        onClick={() => updateAdset(adset.id, (current) => ({ ...current, audience }))}
                      >
                        {audience}
                      </SegmentButton>
                    ))}
                  </div>

                  {state.budgetMode === 'ABO' && (
                    <div className="asx-structure-adset__budget">
                      <NumberInput
                        id={`budget-${adset.id}`}
                        value={adset.budgetReais}
                        compact
                        onChange={(value) =>
                          updateAdset(adset.id, (current) => ({ ...current, budgetReais: value }))
                        }
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    className="asx-structure-remove"
                    disabled={state.adsets.length <= 1}
                    aria-label="Remover adset"
                    title="Remover adset"
                    onClick={() => update(removeAdset(state, adset.id))}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>

                {!adset.collapsed && (
                  <div className="asx-structure-ads">
                    {adset.ads.map((ad, adIndex) => (
                      <div className="asx-structure-ad-slot" key={ad.id}>
                        <Icon name="frame" size={16} color="var(--muted-foreground)" />
                        <div className="asx-structure-node-copy">
                          <strong title={adNodeName(state, adset, adIndex)}>
                            {adDisplayName(productDisplayName, adset, adIndex)}
                          </strong>
                          <span>arraste um criativo aprovado</span>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="asx-structure-text-action"
                      onClick={() => update(addAdToAdset(state, adset.id))}
                    >
                      <Icon name="plus" size={13} />
                      Adicionar ad
                    </button>
                  </div>
                )}
              </article>
            ))}

            <button
              type="button"
              className="asx-structure-add-adset"
              onClick={() => update(addAdset(state))}
            >
              <Icon name="plus" size={14} />
              Adicionar adset
            </button>
          </div>
        </section>

        <aside className="asx-structure-summary" aria-labelledby="structure-summary-title">
          <div className="asx-structure-summary__inner">
            <div className="asx-structure-summary__title" id="structure-summary-title">
              Resumo da árvore
            </div>
            <div className="asx-structure-summary__grid">
              {[
                ['Adsets', summary.adsets],
                ['Ads', summary.ads],
                ['Slots vazios', summary.emptySlots],
                [state.budgetMode === 'CBO' ? 'Budget (CBO)' : 'Budget alocado', summary.budgetLabel],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="asx-structure-summary__note">
              <Icon name="frame" size={14} color="var(--primary)" />
              <p>
                Os slots vazios serão preenchidos na <strong>Fábrica de criativos</strong> (passo 5).
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="asx-action-bar asx-structure-actions">
        <Button variant="ghost" onClick={onBack}>
          <Icon name="arrow-left" size={15} />
          Voltar
        </Button>
        <div className="asx-action-bar__right">
          {saved && <Badge variant="success">Estrutura salva</Badge>}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Salvar estrutura"
            title="Salvar estrutura"
            onClick={handleSave}
          >
            <Icon name="floppy-disk" size={15} />
          </Button>
          <Button onClick={handleNext}>
            Avançar para Briefing
            <Icon name="arrow-right" size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
