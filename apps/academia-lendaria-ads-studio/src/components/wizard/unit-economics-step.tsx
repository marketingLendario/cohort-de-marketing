import { useEffect, useState } from 'react';
import type { Health } from '@/lib/ads-economics';
import { advanceCampaignToStep } from '@/lib/campaign-advance';
import { loadCampaignName, saveCampaignName } from '@/lib/campaign-name';
import { Button, Icon, Input, Label } from '@/lib/lendaria-ds';
import { loadUnitEconomics, saveUnitEconomics } from '@/lib/unit-economics-db';
import { useSpokeStore } from '@/stores/spoke-store';
import { EMPTY_FORM, useUnitEconomicsStore } from '@/stores/unit-economics-store';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const NUM = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

const HEALTH_META: Record<
  Health,
  {
    tone: 'success' | 'warning' | 'destructive';
    label: string;
    title: string;
    description: string;
    icon: string;
  }
> = {
  green: {
    tone: 'success',
    label: 'Saudável',
    title: 'Viabilidade aprovada',
    description: 'Economia fecha. Você pode avançar para o funil.',
    icon: 'check-circle',
  },
  yellow: {
    tone: 'warning',
    label: 'Atenção',
    title: 'Viável com cautela',
    description: 'LTV:CAC entre 1 e 3. A margem de erro ainda é estreita.',
    icon: 'warning-triangle',
  },
  red: {
    tone: 'destructive',
    label: 'Inviável',
    title: 'Avanço bloqueado',
    description: 'O LTV:CAC está abaixo do mínimo de 1,0.',
    icon: 'lock',
  },
};

interface NumberFieldProps {
  id: string;
  label?: string;
  ariaLabel?: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  compact?: boolean;
}

function NumberField({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  prefix,
  suffix,
  step,
  min,
  max,
  compact = false,
}: NumberFieldProps) {
  return (
    <div className="asx-ue-field">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className={`asx-unit-input${compact ? ' asx-unit-input--compact' : ''}`}>
        {prefix && <span className="asx-unit-input__prefix">{prefix}</span>}
        <Input
          id={id}
          aria-label={ariaLabel}
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          step={step ?? 'any'}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
          className="asx-unit-input__control"
        />
        {suffix && <span className="asx-unit-input__suffix">{suffix}</span>}
      </div>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string;
  hint: string;
}

function Metric({ label, value, hint }: MetricProps) {
  return (
    <div className="asx-ue-metric" title={hint}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export interface UnitEconomicsStepProps {
  campaignId: string;
  onAdvanced?: (targetStep: number) => void;
}

export function UnitEconomicsStep({ campaignId, onAdvanced }: UnitEconomicsStepProps) {
  const activeSpokeId = useSpokeStore((state) => state.activeSpokeId);
  const {
    form,
    metrics,
    hydrate,
    setField,
    setOrderBump,
    addUpsell,
    setUpsell,
    removeUpsell,
    markPersisted,
  } = useUnitEconomicsStore();

  const [productName, setProductName] = useState('Nova campanha');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([loadUnitEconomics(campaignId), loadCampaignName(campaignId)]).then(
      ([economicsResult, campaignResult]) => {
        if (!mounted) return;
        const nextError = economicsResult.error ?? campaignResult.error;
        if (nextError) setError(nextError);
        hydrate(
          campaignId,
          economicsResult.form ?? EMPTY_FORM,
          Boolean(economicsResult.form),
        );
        setProductName(campaignResult.name);
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
    };
  }, [campaignId, hydrate]);

  async function persistCurrentForm(): Promise<boolean> {
    if (!activeSpokeId) {
      setError('Selecione um spoke ativo antes de salvar.');
      return false;
    }

    setSaving(true);
    setError(null);
    const [economicsResult, campaignResult] = await Promise.all([
      saveUnitEconomics(form, campaignId, activeSpokeId),
      saveCampaignName(campaignId, productName),
    ]);
    const nextError = economicsResult.error ?? campaignResult.error;
    if (nextError) setError(nextError);
    else markPersisted();
    setSaving(false);
    return !nextError;
  }

  async function handleSave() {
    await persistCurrentForm();
  }

  async function handleAdvance() {
    const saved = await persistCurrentForm();
    if (!saved) return;

    setAdvancing(true);
    setError(null);
    const result = await advanceCampaignToStep({ campaignId, targetStep: 2, form });
    setAdvancing(false);

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível avançar a campanha.');
      return;
    }

    onAdvanced?.(result.stepCurrent ?? 2);
  }

  if (loading) {
    return (
      <div className="asx-loading-line" role="status">
        <Icon name="refresh-double" size={14} className="asx-recalc" />
        Carregando economia da campanha…
      </div>
    );
  }

  const health = HEALTH_META[metrics.health];
  const viable = metrics.ltvCac >= 1;
  const metricRows = [
    { label: 'CAC', value: BRL.format(metrics.cac), hint: 'Custo de aquisição = verba / clientes mês' },
    { label: 'LTV', value: BRL.format(metrics.ltv), hint: 'Valor do cliente ao longo da vida útil' },
    {
      label: 'Payback',
      value: metrics.paybackMonths > 0 ? `${NUM.format(metrics.paybackMonths)} meses` : '—',
      hint: 'Tempo para recuperar o CAC',
    },
    { label: 'Max CPA', value: BRL.format(metrics.maxCpa), hint: 'Maior CPA aceito pelo motor econômico' },
    {
      label: 'Break-even ROAS',
      value: Number.isFinite(metrics.breakevenRoas) ? `${NUM.format(metrics.breakevenRoas)}x` : '—',
      hint: 'ROAS mínimo para empatar, dada a margem',
    },
    { label: 'AOV', value: BRL.format(metrics.aov), hint: 'Ticket médio com bump e upsells' },
  ];

  return (
    <div className="asx-ue">
      <p className="asx-ue__intro">
        Sem economia que fecha, não há campanha: o gate trava o avanço se o LTV:CAC ficar abaixo de 1.
      </p>

      <div className="asx-ue__grid">
        <div className="asx-ue__form">
          <section className="asx-group" aria-labelledby="ue-product-title">
            <div className="asx-group__head" id="ue-product-title">
              <Icon name="box-iso" size={14} color="var(--primary)" />
              Produto
            </div>
            <div className="asx-fields">
              <div className="asx-ue-field">
                <Label htmlFor="ue-product-name">Nome do produto</Label>
                <Input
                  id="ue-product-name"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Ex.: Mentoria de Tráfego"
                />
              </div>
              <div className="asx-ue-fields-2">
                <NumberField
                  id="ue-price"
                  label="Preço"
                  prefix="R$"
                  value={form.productPriceReais}
                  onChange={(value) => setField('productPriceReais', value)}
                  min={0}
                />
                <NumberField
                  id="ue-customers"
                  label="Clientes / mês"
                  value={form.customersMonthly}
                  onChange={(value) => setField('customersMonthly', value)}
                  min={0}
                  step={1}
                />
              </div>
            </div>
          </section>

          <section className="asx-group" aria-labelledby="ue-margin-title">
            <div className="asx-group__head" id="ue-margin-title">
              <Icon name="percentage" size={14} color="var(--primary)" />
              Margem &amp; verba
            </div>
            <div className="asx-fields asx-fields--loose">
              <div className="asx-ue-slider">
                <div className="asx-ue-slider__label">
                  <Label htmlFor="ue-margin">Margem bruta</Label>
                  <span>{NUM.format(form.grossMarginPct)}%</span>
                </div>
                <input
                  id="ue-margin"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={form.grossMarginPct}
                  onChange={(event) => setField('grossMarginPct', Number(event.target.value))}
                  className="asx-range"
                />
              </div>
              <NumberField
                id="ue-spend"
                label="Verba de anúncio / mês"
                prefix="R$"
                value={form.adSpendMonthlyReais}
                onChange={(value) => setField('adSpendMonthlyReais', value)}
                min={0}
              />
            </div>
          </section>

          <section className="asx-group" aria-labelledby="ue-retention-title">
            <div className="asx-group__head" id="ue-retention-title">
              <Icon name="refresh-circle" size={14} color="var(--primary)" />
              Retenção &amp; valor
            </div>
            <div className="asx-ue-fields-2">
              <NumberField
                id="ue-repeat"
                label="Recompras na vida útil"
                suffix="vezes"
                value={form.repeatPurchaseRate}
                onChange={(value) => setField('repeatPurchaseRate', value)}
                min={0}
              />
              <NumberField
                id="ue-lifespan"
                label="Vida útil do cliente"
                suffix="meses"
                value={form.avgCustomerLifespanMonths}
                onChange={(value) => setField('avgCustomerLifespanMonths', value)}
                min={0}
              />
            </div>
          </section>

          <section className="asx-group" aria-labelledby="ue-increments-title">
            <div className="asx-group__head" id="ue-increments-title">
              <Icon name="plus-circle" size={14} color="var(--primary)" />
              Incrementos
            </div>
            <div className="asx-fields">
              <div className="asx-ue-field">
                <Label>Order bump · preço &amp; adesão</Label>
                <div className="asx-ue-fields-2">
                  <NumberField
                    id="ue-bump-price"
                    ariaLabel="Preço do order bump"
                    prefix="R$"
                    value={form.orderBump.priceReais}
                    onChange={(value) => setOrderBump('priceReais', value)}
                    min={0}
                  />
                  <NumberField
                    id="ue-bump-rate"
                    ariaLabel="Adesão do order bump"
                    suffix="% adesão"
                    value={form.orderBump.ratePct}
                    onChange={(value) => setOrderBump('ratePct', value)}
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="asx-ue-upsells">
                <div className="asx-ue-upsells__head">
                  <Label>Upsells</Label>
                  <button type="button" className="asx-text-action" onClick={addUpsell}>
                    <Icon name="plus" size={13} />
                    Adicionar
                  </button>
                </div>

                {form.upsells.length === 0 && (
                  <p className="asx-ue-upsells__empty">Nenhum upsell adicionado.</p>
                )}

                <div className="asx-ue-upsells__list">
                  {form.upsells.map((upsell, index) => (
                    <div className="asx-ue-upsell" key={index}>
                      <Input
                        value={upsell.name ?? ''}
                        onChange={(event) => setUpsell(index, 'name', event.target.value)}
                        placeholder="Nome do upsell"
                        aria-label={`Nome do upsell ${index + 1}`}
                      />
                      <NumberField
                        id={`ue-upsell-price-${index}`}
                        ariaLabel={`Preço do upsell ${index + 1}`}
                        prefix="R$"
                        value={upsell.priceReais}
                        onChange={(value) => setUpsell(index, 'priceReais', value)}
                        min={0}
                        compact
                      />
                      <NumberField
                        id={`ue-upsell-rate-${index}`}
                        ariaLabel={`Adesão do upsell ${index + 1}`}
                        suffix="%"
                        value={upsell.ratePct}
                        onChange={(value) => setUpsell(index, 'ratePct', value)}
                        min={0}
                        max={100}
                        compact
                      />
                      <button
                        type="button"
                        className="asx-square-action asx-square-action--compact"
                        onClick={() => removeUpsell(index)}
                        aria-label={`Remover upsell ${index + 1}`}
                        title="Remover"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="asx-ue__results">
          <section className="asx-ue-result" aria-label="Resultado da viabilidade">
            <div className="asx-ue-result__top">
              <span className={`asx-health-pill asx-health-pill--${health.tone}`} data-testid="health-badge">
                <span />
                {health.label}
              </span>
              {(saving || advancing) && (
                <span className="asx-ue-result__status asx-recalc">
                  {advancing ? 'avançando…' : 'salvando…'}
                </span>
              )}
            </div>

            <div className="asx-ue-result__hero">
              <span>LTV : CAC</span>
              <div>
                <strong className={`asx-ue-result__ratio asx-ue-result__ratio--${health.tone}`}>
                  {NUM.format(metrics.ltvCac)}
                </strong>
                <small>alvo ≥ 3,0</small>
              </div>
            </div>

            <div className="asx-ue-metrics">
              {metricRows.map((metric) => (
                <Metric key={metric.label} {...metric} />
              ))}
            </div>

            <div className={`asx-gate-banner asx-gate-banner--${health.tone}`}>
              <div>
                <Icon name={health.icon} size={15} />
                <strong>{health.title}</strong>
              </div>
              <p>{health.description}</p>
              {metrics.health === 'red' && (
                <em>Aumente o preço, a retenção ou reduza o CAC para liberar.</em>
              )}
            </div>

            <div className="asx-ue-result__monitor-note">
              <Icon name="radar" size={14} color="var(--info)" />
              <p>
                Estes limites alimentam o <strong>Monitor</strong> (passo 8): CPA alvo{' '}
                <span>{BRL.format(metrics.maxCpa)}</span> · ROAS mín{' '}
                <span>
                  {Number.isFinite(metrics.breakevenRoas)
                    ? `${NUM.format(metrics.breakevenRoas)}x`
                    : '—'}
                </span>
                .
              </p>
            </div>
          </section>

          {error && (
            <div className="asx-brief__error" role="alert">
              <Icon name="warning-circle" size={14} />
              {error}
            </div>
          )}
        </aside>
      </div>

      <div className="asx-action-bar">
        <Button variant="ghost" onClick={handleSave} disabled={saving || advancing}>
          {saving && !advancing ? 'Salvando…' : 'Salvar rascunho'}
        </Button>
        <Button
          disabled={!viable || saving || advancing}
          title={viable ? undefined : 'LTV:CAC < 1 — campanha inviável'}
          onClick={handleAdvance}
        >
          {advancing ? 'Avançando…' : 'Avançar para Funil'}
          <Icon name="arrow-right" size={15} />
        </Button>
      </div>
    </div>
  );
}
