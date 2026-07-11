import {
  DEMO_AUTH_ENABLED,
  getDemoCampaign,
  updateDemoCampaignName,
} from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';

export async function loadCampaignName(
  campaignId: string,
): Promise<{ name: string; error: string | null }> {
  if (DEMO_AUTH_ENABLED) {
    return { name: getDemoCampaign(campaignId)?.name ?? 'Nova campanha', error: null };
  }

  const { data, error } = await supabase
    .from('ads_campaigns')
    .select('name')
    .eq('id', campaignId)
    .maybeSingle();

  return {
    name: typeof data?.name === 'string' ? data.name : 'Nova campanha',
    error: error?.message ?? null,
  };
}

export async function saveCampaignName(
  campaignId: string,
  name: string,
): Promise<{ error: string | null }> {
  const normalizedName = name.trim() || 'Nova campanha';
  if (DEMO_AUTH_ENABLED) {
    const updated = updateDemoCampaignName(campaignId, normalizedName);
    return { error: updated ? null : 'Campanha demo não encontrada.' };
  }

  const { error } = await supabase
    .from('ads_campaigns')
    .update({ name: normalizedName })
    .eq('id', campaignId);
  return { error: error?.message ?? null };
}
