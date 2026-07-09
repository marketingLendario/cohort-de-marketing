/**
 * Tipos de domínio (subset relevante para a fundação 1.2). O modelo lógico vive
 * em arch §4 / `supabase/schemas/` (SOT) — não inventar campos além dele.
 */

/** Um spoke = um `workspace` (eixo de tenancy — ADR-DB-TENANCY-MODEL). */
export interface Spoke {
  id: string;
  name: string;
}

/** Status do wizard de campanha (enum `ads_campaign_status` no SOT). */
export type AdsCampaignStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'live'
  | 'paused'
  | 'archived';

/** Tabela raiz `ads_campaigns` (RLS por `workspace_id`, mecanismo #3). */
export interface AdsCampaign {
  id: string;
  workspace_id: string;
  /** Projeto raiz. Opcional durante a compatibilidade com campanhas legadas. */
  project_id?: string;
  name: string;
  status: AdsCampaignStatus;
  step_current: number;
  created_at: string;
}
