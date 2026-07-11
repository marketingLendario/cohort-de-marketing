import { useCallback, useState } from 'react';
import { createDemoCampaign, DEMO_AUTH_ENABLED } from '@/lib/demo-mode';
import { supabase } from '@/lib/supabase';
import type { AdsCampaign } from '@/lib/types';

/**
 * Cria uma campanha em rascunho e entra no wizard (AC2 — STORY-AL-ADS-1.4).
 *
 * Insere um registro `ads_campaigns` com `status='draft'` e `step_current=1`
 * (estado retomável — FR37, fundamentado em 1.6). A inserção roda sob a
 * identidade do usuário: a RLS exige que `workspace_id` seja um spoke do qual
 * ele é membro (mecanismo #3), então o front nunca burla o isolamento — só
 * passa o `workspace_id` do spoke ativo.
 *
 * NÃO inventa métricas nem campos: o draft nasce só com nome + status + step.
 * CPA/ROAS/gasto vêm ao vivo no Epic 5 (FR33). O wizard de 8 passos é das
 * stories 1.5+; aqui a responsabilidade termina ao criar o draft e devolver
 * o `step_current` para o caller navegar.
 */
export interface UseCreateCampaignResult {
  creating: boolean;
  error: string | null;
  /**
   * Cria o draft no spoke informado. Resolve com a campanha criada (inclui
   * `step_current` para o caller rotear ao passo do wizard) ou `null` em erro.
   */
  createCampaign: (workspaceId: string, name: string, projectId?: string) => Promise<AdsCampaign | null>;
}

export function useCreateCampaign(): UseCreateCampaignResult {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = useCallback(
    async (workspaceId: string, name: string, projectId?: string): Promise<AdsCampaign | null> => {
      setCreating(true);
      setError(null);
      if (DEMO_AUTH_ENABLED) {
        const draft = createDemoCampaign(workspaceId, name, projectId);
        setCreating(false);
        return draft;
      }
      const { data, error: err } = await supabase
        .from('ads_campaigns')
        .insert({ workspace_id: workspaceId, ...(projectId ? { project_id: projectId } : {}), name, status: 'draft', step_current: 1 })
        .select('id, workspace_id, project_id, name, status, step_current, created_at')
        .single();

      setCreating(false);
      if (err) {
        setError(err.message);
        return null;
      }
      return data as AdsCampaign;
    },
    [],
  );

  return { creating, error, createCampaign };
}
