import type { Session } from '@supabase/supabase-js';
import type { AdsCampaign, Spoke } from '@/lib/types';
import type { CampaignStructureState } from '@/lib/campaign-structure';
import type { CampaignPublicationState } from '@/lib/campaign-publication';
import type { CreativeBriefState } from '@/lib/creative-brief';
import type { CreativeFactoryState } from '@/lib/creative-factory';
import type { FunnelSelectionState } from '@/lib/funnel-selection';
import type { PerformanceMonitorState } from '@/lib/performance-monitor';
import type { TrackingAuditState } from '@/lib/tracking-audit';
import type { UnitEconomicsForm } from '@/stores/unit-economics-store';
import { DEMO_PROJECT_ID } from '@/stores/project-store';

export const DEMO_AUTH_ENABLED = import.meta.env.MODE !== 'test' && import.meta.env.VITE_DEMO_AUTH === 'true';
export const TRAFFIC_SIMULATION_ENABLED = import.meta.env.VITE_TRAFFIC_SIMULATION === 'true';
export const DEMO_EMAIL = 'demo@academialendaria.local';
export const DEMO_PASSWORD = 'adsfactory';
export const DEMO_SPOKE_ID = 'demo-spoke-academia-lendaria';

const AUTH_KEY = 'al-ads-studio.demo-auth';
const CAMPAIGNS_KEY = 'al-ads-studio.demo-campaigns';
const ECONOMICS_KEY = 'al-ads-studio.demo-unit-economics';
const FUNNEL_KEY = 'al-ads-studio.demo-funnel-selection';
const STRUCTURE_KEY = 'al-ads-studio.demo-campaign-structure';
const BRIEF_KEY = 'al-ads-studio.demo-creative-brief';
const CREATIVE_FACTORY_KEY = 'al-ads-studio.demo-creative-factory';
const TRACKING_KEY = 'al-ads-studio.demo-tracking-audit';
const PUBLICATION_KEY = 'al-ads-studio.demo-campaign-publication';
const MONITOR_KEY = 'al-ads-studio.demo-performance-monitor';
export const DEMO_AUTH_EVENT = 'al-ads-studio:demo-auth';

export const DEMO_SPOKES: Spoke[] = [
  { id: DEMO_SPOKE_ID, name: 'Academia Lendária Demo' },
];

const DEFAULT_CAMPAIGNS: AdsCampaign[] = [
  {
    id: 'demo-campaign-001',
    workspace_id: DEMO_SPOKE_ID,
    project_id: DEMO_PROJECT_ID,
    name: 'Campanha demo - Máquina de Receita',
    status: 'draft',
    step_current: 1,
    created_at: '2026-07-09T12:00:00.000Z',
  },
];

function storage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

function emitAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DEMO_AUTH_EVENT));
  }
}

export function isDemoSignedIn(): boolean {
  if (!DEMO_AUTH_ENABLED) return false;
  return storage()?.getItem(AUTH_KEY) === 'signed-in';
}

export function signInDemo(email: string, password: string): boolean {
  if (!DEMO_AUTH_ENABLED) return false;
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) return false;
  storage()?.setItem(AUTH_KEY, 'signed-in');
  emitAuthChange();
  return true;
}

export function signOutDemo() {
  storage()?.removeItem(AUTH_KEY);
  emitAuthChange();
}

export function getDemoSession(): Session | null {
  if (!isDemoSignedIn()) return null;
  return {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: 'demo-user-academia-lendaria',
      app_metadata: {},
      user_metadata: { name: 'Operador Demo' },
      aud: 'authenticated',
      created_at: '2026-07-09T12:00:00.000Z',
      email: DEMO_EMAIL,
    },
  } as unknown as Session;
}

function readJson<T>(key: string, fallback: T): T {
  const raw = storage()?.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  storage()?.setItem(key, JSON.stringify(value));
}

export function getDemoCampaigns(workspaceId: string): AdsCampaign[] {
  return readJson(CAMPAIGNS_KEY, DEFAULT_CAMPAIGNS).filter((campaign) => campaign.workspace_id === workspaceId);
}

export function createDemoCampaign(workspaceId: string, name: string, projectId = DEMO_PROJECT_ID): AdsCampaign {
  const campaigns = readJson(CAMPAIGNS_KEY, DEFAULT_CAMPAIGNS);
  const draft: AdsCampaign = {
    id: `demo-campaign-${Date.now()}`,
    workspace_id: workspaceId,
    project_id: projectId,
    name,
    status: 'draft',
    step_current: 1,
    created_at: new Date().toISOString(),
  };
  writeJson(CAMPAIGNS_KEY, [draft, ...campaigns]);
  return draft;
}

export function getDemoCampaign(campaignId: string): AdsCampaign | null {
  const campaigns = readJson(CAMPAIGNS_KEY, DEFAULT_CAMPAIGNS);
  return campaigns.find((campaign) => campaign.id === campaignId) ?? null;
}

export function updateDemoCampaignName(campaignId: string, name: string): AdsCampaign | null {
  const campaigns = readJson(CAMPAIGNS_KEY, DEFAULT_CAMPAIGNS);
  let updated: AdsCampaign | null = null;
  const next = campaigns.map((campaign) => {
    if (campaign.id !== campaignId) return campaign;
    updated = { ...campaign, name };
    return updated;
  });
  if (!updated) {
    updated = {
      id: campaignId,
      workspace_id: DEMO_SPOKE_ID,
      project_id: DEMO_PROJECT_ID,
      name,
      status: 'draft',
      step_current: 1,
      created_at: new Date().toISOString(),
    };
    writeJson(CAMPAIGNS_KEY, [updated, ...campaigns]);
    return updated;
  }
  writeJson(CAMPAIGNS_KEY, next);
  return updated;
}

export function updateDemoCampaignStep(campaignId: string, targetStep: number): AdsCampaign | null {
  const campaigns = readJson(CAMPAIGNS_KEY, DEFAULT_CAMPAIGNS);
  let updated: AdsCampaign | null = null;
  const next = campaigns.map((campaign) => {
    if (campaign.id !== campaignId) return campaign;
    updated = { ...campaign, step_current: targetStep };
    return updated;
  });
  if (!updated) {
    updated = {
      id: campaignId,
      workspace_id: DEMO_SPOKE_ID,
      project_id: DEMO_PROJECT_ID,
      name: 'Campanha demo retomada',
      status: 'draft',
      step_current: targetStep,
      created_at: new Date().toISOString(),
    };
    writeJson(CAMPAIGNS_KEY, [updated, ...campaigns]);
    return updated;
  }
  writeJson(CAMPAIGNS_KEY, next);
  return updated;
}

export function getDemoUnitEconomics(campaignId: string): UnitEconomicsForm | null {
  const rows = readJson<Record<string, UnitEconomicsForm>>(ECONOMICS_KEY, {});
  return rows[campaignId] ?? null;
}

export function saveDemoUnitEconomics(campaignId: string, form: UnitEconomicsForm) {
  const rows = readJson<Record<string, UnitEconomicsForm>>(ECONOMICS_KEY, {});
  writeJson(ECONOMICS_KEY, { ...rows, [campaignId]: form });
}

export function getDemoFunnelSelection(campaignId: string): FunnelSelectionState | null {
  const rows = readJson<Record<string, FunnelSelectionState>>(FUNNEL_KEY, {});
  return rows[campaignId] ?? null;
}

export function saveDemoFunnelSelection(campaignId: string, state: FunnelSelectionState) {
  const rows = readJson<Record<string, FunnelSelectionState>>(FUNNEL_KEY, {});
  writeJson(FUNNEL_KEY, { ...rows, [campaignId]: state });
}

export function getDemoCampaignStructure(campaignId: string): CampaignStructureState | null {
  const rows = readJson<Record<string, CampaignStructureState>>(STRUCTURE_KEY, {});
  return rows[campaignId] ?? null;
}

export function saveDemoCampaignStructure(campaignId: string, state: CampaignStructureState) {
  const rows = readJson<Record<string, CampaignStructureState>>(STRUCTURE_KEY, {});
  writeJson(STRUCTURE_KEY, { ...rows, [campaignId]: state });
}

export function getDemoCreativeBrief(campaignId: string): CreativeBriefState | null {
  const rows = readJson<Record<string, CreativeBriefState>>(BRIEF_KEY, {});
  return rows[campaignId] ?? null;
}

export function saveDemoCreativeBrief(campaignId: string, state: CreativeBriefState) {
  const rows = readJson<Record<string, CreativeBriefState>>(BRIEF_KEY, {});
  writeJson(BRIEF_KEY, { ...rows, [campaignId]: state });
}

export function getDemoCreativeFactory(campaignId: string): CreativeFactoryState | null {
  const rows = readJson<Record<string, CreativeFactoryState>>(CREATIVE_FACTORY_KEY, {});
  return rows[campaignId] ?? null;
}

export function saveDemoCreativeFactory(campaignId: string, state: CreativeFactoryState) {
  const rows = readJson<Record<string, CreativeFactoryState>>(CREATIVE_FACTORY_KEY, {});
  writeJson(CREATIVE_FACTORY_KEY, { ...rows, [campaignId]: state });
}

export function getDemoTrackingAudit(campaignId: string): TrackingAuditState | null {
  const rows = readJson<Record<string, TrackingAuditState>>(TRACKING_KEY, {});
  return rows[campaignId] ?? null;
}

export function saveDemoTrackingAudit(campaignId: string, state: TrackingAuditState) {
  const rows = readJson<Record<string, TrackingAuditState>>(TRACKING_KEY, {});
  writeJson(TRACKING_KEY, { ...rows, [campaignId]: state });
}

export function getDemoCampaignPublication(campaignId: string): CampaignPublicationState | null {
  const rows = readJson<Record<string, CampaignPublicationState>>(PUBLICATION_KEY, {});
  return rows[campaignId] ?? null;
}

export function saveDemoCampaignPublication(campaignId: string, state: CampaignPublicationState) {
  const rows = readJson<Record<string, CampaignPublicationState>>(PUBLICATION_KEY, {});
  writeJson(PUBLICATION_KEY, { ...rows, [campaignId]: state });
}

export function getDemoPerformanceMonitor(campaignId: string): PerformanceMonitorState | null {
  const rows = readJson<Record<string, PerformanceMonitorState>>(MONITOR_KEY, {});
  return rows[campaignId] ?? null;
}

export function saveDemoPerformanceMonitor(campaignId: string, state: PerformanceMonitorState) {
  const rows = readJson<Record<string, PerformanceMonitorState>>(MONITOR_KEY, {});
  writeJson(MONITOR_KEY, { ...rows, [campaignId]: state });
}
