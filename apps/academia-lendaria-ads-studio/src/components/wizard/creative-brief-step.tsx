import { useEffect, useRef, useState } from 'react';
import {
  ANGLE_KEYS,
  ANGLE_LABELS,
  DEFAULT_CREATIVE_BRIEF,
  approvedHookCount,
  createEmptyHook,
  generateDemoHooks,
  isBriefReadyForFactory,
  updateHook,
  type CreativeBriefState,
  type CreativeHook,
} from '@/lib/creative-brief';
import {
  getDemoCreativeBrief,
  saveDemoCreativeBrief,
  updateDemoCampaignStep,
} from '@/lib/demo-mode';
import { Button, Icon, Input, Label, Textarea } from '@/lib/lendaria-ds';

const GENERATED_HOOK_COUNT = 4;

export interface CreativeBriefStepProps {
  campaignId: string;
  onBack?: () => void;
  onAdvanced?: (targetStep: number) => void;
}

export function CreativeBriefStep({ campaignId, onBack, onAdvanced }: CreativeBriefStepProps) {
  const [brief, setBrief] = useState<CreativeBriefState>(DEFAULT_CREATIVE_BRIEF);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const savedBrief = getDemoCreativeBrief(campaignId);
    setBrief(savedBrief ?? DEFAULT_CREATIVE_BRIEF);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [campaignId]);

  const approvedCount = approvedHookCount(brief);
  const ready = isBriefReadyForFactory(brief);
  const generating = brief.generationStatus === 'generating';
  const pendingHookCount = generating
    ? Math.max(0, GENERATED_HOOK_COUNT - brief.hooks.length)
    : 0;
  const brandName = brief.brandVoice.split(' · ')[0] || 'Academia Lendária';

  function update(next: CreativeBriefState) {
    setBrief(next);
    saveDemoCreativeBrief(campaignId, next);
    setError(null);
  }

  function setField<K extends keyof CreativeBriefState>(key: K, value: CreativeBriefState[K]) {
    update({ ...brief, [key]: value });
  }

  function generateHooks() {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    const hooks = generateDemoHooks(brief);
    const generatingBrief: CreativeBriefState = {
      ...brief,
      hooks: [],
      generationStatus: 'generating',
      generationProgress: 0,
    };
    setBrief(generatingBrief);
    saveDemoCreativeBrief(campaignId, generatingBrief);
    setError(null);

    let progress = 0;
    intervalRef.current = window.setInterval(() => {
      progress += 1;
      setBrief((current) => {
        const next: CreativeBriefState = {
          ...current,
          hooks: hooks.slice(0, progress),
          generationProgress: progress,
          generationStatus: progress >= hooks.length ? 'done' : 'generating',
        };
        saveDemoCreativeBrief(campaignId, next);
        return next;
      });
      if (progress >= hooks.length && intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 220);
  }

  function updateHookField(hookId: string, patch: Partial<Omit<CreativeHook, 'id'>>) {
    update(updateHook(brief, hookId, patch));
  }

  function addHook() {
    update({ ...brief, hooks: [...brief.hooks, createEmptyHook()], generationStatus: 'done' });
  }

  function removeHook(hookId: string) {
    update({ ...brief, hooks: brief.hooks.filter((hook) => hook.id !== hookId) });
  }

  function handleNext() {
    if (!ready) {
      setError('Aprove pelo menos um hook com headline antes de avançar.');
      return;
    }
    saveDemoCreativeBrief(campaignId, brief);
    updateDemoCampaignStep(campaignId, 5);
    onAdvanced?.(5);
  }

  return (
    <div className="asx-brief">
      <div className="asx-brief__grid">
        <div className="asx-brief__column">
          <section className="asx-group" aria-labelledby="brief-audience-title">
            <div className="asx-group__head" id="brief-audience-title">
              <Icon name="user-love" size={14} color="var(--primary)" />
              ICP &amp; público
            </div>

            <div className="asx-fields">
              <div className="asx-field">
                <Label htmlFor="brief-pains">Dores</Label>
                <Textarea
                  id="brief-pains"
                  value={brief.pains}
                  onChange={(event) => setField('pains', event.target.value)}
                  className="asx-field__textarea"
                />
              </div>

              <div className="asx-field">
                <Label htmlFor="brief-desires">Desejos</Label>
                <Textarea
                  id="brief-desires"
                  value={brief.desires}
                  onChange={(event) => setField('desires', event.target.value)}
                  className="asx-field__textarea"
                />
              </div>

              <div className="asx-field">
                <Label htmlFor="brief-audience">Descrição do público</Label>
                <Textarea
                  id="brief-audience"
                  value={brief.audienceDescription}
                  onChange={(event) => setField('audienceDescription', event.target.value)}
                  className="asx-field__textarea asx-field__textarea--compact"
                />
              </div>
            </div>
          </section>

          <section className="asx-group" aria-labelledby="brief-angles-title">
            <div className="asx-group__head" id="brief-angles-title">
              <Icon name="compass" size={14} color="var(--primary)" />
              Ângulos a testar
            </div>

            <div className="asx-angle-list">
              {ANGLE_KEYS.map((angle) => (
                <button
                  key={angle}
                  type="button"
                  aria-pressed={brief.angles[angle]}
                  onClick={() =>
                    setField('angles', { ...brief.angles, [angle]: !brief.angles[angle] })
                  }
                  className={`asx-chip${brief.angles[angle] ? ' asx-chip--active' : ''}`}
                >
                  {ANGLE_LABELS[angle]}
                </button>
              ))}
            </div>

            <div className="asx-brand-voice">
              <span className="asx-brand-voice__label">Tom de voz</span>
              <div className="asx-brand-voice__control">
                <Icon name="lock" size={12} color="var(--muted-foreground)" />
                <span className="asx-brand-voice__name">{brandName}</span>
                <span className="asx-brand-voice__source">do brand-pack</span>
              </div>
            </div>
          </section>
        </div>

        <section className="asx-group asx-hooks" aria-labelledby="brief-hooks-title">
          <div className="asx-hooks__head">
            <div className="asx-group__head asx-group__head--inline" id="brief-hooks-title">
              <Icon name="chat-lines" size={14} color="var(--primary)" />
              Hooks
              {brief.hooks.length > 0 && (
                <span className="asx-hooks__count">{approvedCount} aprovados</span>
              )}
            </div>
            <Button variant="outline" onClick={generateHooks} disabled={generating}>
              <Icon name="sparks" size={14} />
              {generating ? 'Gerando' : 'Gerar com IA'}
            </Button>
          </div>

          {brief.hooks.length === 0 && !generating && (
            <div className="asx-hooks__empty">
              <Icon name="sparks" size={26} color="var(--muted-foreground)" />
              <p>Nenhum hook ainda</p>
              <span>Gere a partir do ICP + ângulos, ou adicione manualmente.</span>
            </div>
          )}

          {generating && (
            <div className="asx-hooks__generating" role="status" aria-live="polite">
              <Icon name="sparks" size={14} color="var(--primary)" className="asx-recalc" />
              <span>
                Gerando hooks via will-binder… {brief.generationProgress}/{GENERATED_HOOK_COUNT}
              </span>
            </div>
          )}

          <div className="asx-hook-list">
            {brief.hooks.map((hook) => (
              <article
                key={hook.id}
                className={`asx-hook-card${hook.approved ? ' asx-hook-card--approved' : ''}`}
              >
                <div className="asx-hook-card__top">
                  <div className="asx-hook-card__copy">
                    <Input
                      value={hook.headline}
                      onChange={(event) =>
                        updateHookField(hook.id, { headline: event.target.value })
                      }
                      aria-label="Headline do hook"
                      className="asx-hook-card__headline"
                    />
                    <Input
                      value={hook.sub}
                      onChange={(event) => updateHookField(hook.id, { sub: event.target.value })}
                      aria-label="Subheadline do hook"
                      className="asx-hook-card__sub"
                    />
                  </div>

                  <div className="asx-hook-card__actions">
                    <button
                      type="button"
                      onClick={() => updateHookField(hook.id, { approved: !hook.approved })}
                      className={`asx-square-action${hook.approved ? ' asx-square-action--approved' : ''}`}
                      aria-label={hook.approved ? 'Remover aprovação do hook' : 'Aprovar hook'}
                      title={hook.approved ? 'Remover aprovação' : 'Aprovar'}
                    >
                      <Icon name="check" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHook(hook.id)}
                      className="asx-square-action"
                      aria-label="Remover hook"
                      title="Remover"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>

                <div className="asx-hook-card__cta">
                  <span>CTA</span>
                  <Input
                    value={hook.cta}
                    onChange={(event) => updateHookField(hook.id, { cta: event.target.value })}
                    aria-label="CTA do hook"
                    className="asx-hook-card__cta-input"
                  />
                </div>
              </article>
            ))}

            {Array.from({ length: pendingHookCount }, (_, index) => (
              <div className="asx-hook-skeleton" aria-hidden="true" key={index}>
                <span />
                <span />
              </div>
            ))}
          </div>

          {brief.hooks.length > 0 && !generating && (
            <button type="button" onClick={addHook} className="asx-text-action">
              <Icon name="plus" size={13} />
              Adicionar hook
            </button>
          )}
        </section>
      </div>

      {error && (
        <div className="asx-brief__error" role="alert">
          <Icon name="warning-circle" size={14} />
          {error}
        </div>
      )}

      <div className="asx-action-bar">
        <Button variant="ghost" onClick={onBack}>
          <Icon name="arrow-left" size={15} />
          Voltar
        </Button>

        <div className="asx-action-bar__right">
          <Button onClick={handleNext} disabled={generating}>
            Avançar para Criativos
            <Icon name="arrow-right" size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
