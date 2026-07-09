import { computeUnitEconomics } from '@/lib/ads-economics';
import { DEMO_AUTH_ENABLED, updateDemoCampaignStep } from '@/lib/demo-mode';
import { toEconomicsInputs, type UnitEconomicsForm } from '@/stores/unit-economics-store';

export interface AdvanceCampaignArgs {
  campaignId: string;
  targetStep: number;
  form: UnitEconomicsForm;
}

export interface AdvanceCampaignResult {
  ok: boolean;
  stepCurrent?: number;
  ltvCac?: number;
  error?: string;
}

function formatRatio(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
}

export function advanceDemoCampaignToStep({
  campaignId,
  targetStep,
  form,
}: AdvanceCampaignArgs): AdvanceCampaignResult {
  if (targetStep <= 1) {
    return { ok: true, stepCurrent: targetStep };
  }

  const metrics = computeUnitEconomics(toEconomicsInputs(form));
  if (metrics.ltvCac < 1) {
    return {
      ok: false,
      ltvCac: metrics.ltvCac,
      error: `LTV:CAC ${formatRatio(metrics.ltvCac)} < 1. Ajuste a oferta antes de avançar.`,
    };
  }

  const updated = updateDemoCampaignStep(campaignId, targetStep);
  if (!updated) {
    return { ok: false, ltvCac: metrics.ltvCac, error: 'Campanha demo não encontrada.' };
  }

  return { ok: true, stepCurrent: updated.step_current, ltvCac: metrics.ltvCac };
}

export async function advanceCampaignToStep(args: AdvanceCampaignArgs): Promise<AdvanceCampaignResult> {
  if (DEMO_AUTH_ENABLED) {
    return advanceDemoCampaignToStep(args);
  }

  return {
    ok: false,
    error: 'Avanço via BFF ainda não está conectado neste ambiente.',
  };
}
