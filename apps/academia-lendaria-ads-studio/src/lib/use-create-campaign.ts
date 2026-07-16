import { useCallback, useState } from 'react';
import { evaluateCampaignReadiness, toReadinessBlockedError } from '@/lib/campaign-readiness';
import { createDemoCampaign, DEMO_AUTH_ENABLED } from '@/lib/demo-mode';
import { projectRepository } from '@/lib/project-repository';
import { supabase } from '@/lib/supabase';
import {
  buildCampaignCreateRpcParams,
  mapCampaignCreateRpcResponse,
  type CampaignCreateDraft,
} from '../../shared/campaign-create';
import type { AdsCampaign } from '@/lib/types';

/**
 * Cria uma campanha em rascunho e entra no wizard (AC2 — STORY-AL-ADS-1.4).
 *
 * NÃO inventa métricas nem campos: o draft nasce só com nome + status + step.
 * CPA/ROAS/gasto vêm ao vivo no Epic 5 (FR33). O wizard de 8 passos é das
 * stories 1.5+; aqui a responsabilidade termina ao criar o draft e devolver
 * o `step_current` para o caller navegar.
 *
 * Preflight `campaign.create` (AC4 — STORY-12.W1.1): quando um `projectId` é
 * informado, o mesmo contrato `campaign-readiness.v1` usado pelo
 * briefing/jornada é consultado ANTES de qualquer chamada de rede. Bloqueado →
 * `READINESS_BLOCKED`, `null`, zero mutação.
 *
 * Enforcement transacional/idempotente (STORY-12.W4.1 — fecha o "side door"
 * documentado nos Dev Notes da 12.W1.1/12.W4.2): esta função NUNCA MAIS insere
 * direto em `ads_campaigns`. Toda criação real (com ou sem `projectId`) chama
 * `campaign_create_readiness_rpc` (STORY-12.W4.2) — a MESMA fronteira
 * transacional/idempotente que a rota legada `campaigns/$campaignId/$step`, o
 * dashboard legado (`dashboard.tsx`) e a jornada de projeto
 * (`project-campaigns.tsx`) agora compartilham. `campaign.create` exige um
 * projeto real (regra estrutural do ADR-002 — `structuralCreateResult`):
 * quando `projectId` não é informado, o preflight local já produz
 * `PROJECT_NOT_FOUND` bloqueado sem round-trip de rede — não existe mais um
 * atalho que insira uma campanha órfã sem preflight algum. Um bypass direto do
 * client (chamando a RPC sem passar por este hook) ainda cai na MESMA
 * fronteira: a RPC reforça `is_workspace_member` para o papel `authenticated`
 * (AC3 — STORY-12.W4.2), então um bypass nunca grava linha parcial nem escapa
 * do isolamento por workspace.
 */
export interface UseCreateCampaignResult {
  creating: boolean;
  error: string | null;
  /**
   * Cria o draft no spoke informado. Resolve com a campanha criada (inclui
   * `step_current` para o caller rotear ao passo do wizard) ou `null` em erro
   * (inclusive quando o preflight de prontidão bloqueia a criação, ou quando o
   * servidor rejeita por conflito de idempotência, obsolescência do snapshot
   * ou autorização).
   */
  createCampaign: (workspaceId: string, name: string, projectId?: string) => Promise<AdsCampaign | null>;
}

function toAdsCampaign(draft: CampaignCreateDraft): AdsCampaign {
  return {
    id: draft.id,
    workspace_id: draft.workspaceId,
    ...(draft.projectId ? { project_id: draft.projectId } : {}),
    name: draft.name,
    status: draft.status as AdsCampaign['status'],
    step_current: draft.stepCurrent,
    created_at: draft.createdAt,
  };
}

/** Nunca a mensagem crua do erro — evita vazar detalhe de infraestrutura na UI. */
const GENERIC_CREATE_ERROR = 'Não foi possível criar a campanha agora. Tente novamente.';

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

      let expectedProjectName: string | null = null;

      if (projectId) {
        const [project, brief, artifacts, runs] = await Promise.all([
          projectRepository.getProject(workspaceId, projectId),
          projectRepository.getActiveBrief(workspaceId, projectId),
          projectRepository.listArtifacts(workspaceId, projectId),
          projectRepository.listSkillRuns(workspaceId, projectId),
        ]);
        const snapshot = evaluateCampaignReadiness('campaign.create', { project, brief, artifacts, runs });
        if (snapshot.state === 'blocked') {
          setCreating(false);
          setError(toReadinessBlockedError(snapshot).message);
          return null;
        }
        expectedProjectName = project?.name ?? null;
      } else {
        // Sem projeto para avaliar: `campaign.create` é estruturalmente
        // bloqueada por contrato (ADR-002 — `structuralCreateResult` trata
        // ausência de projeto como `PROJECT_NOT_FOUND`). Zero round-trip de
        // rede, zero mutação — fecha o atalho legado sem preflight algum
        // (Dev Notes da 12.W1.1/12.W4.1).
        const snapshot = evaluateCampaignReadiness('campaign.create', {
          project: null,
          brief: null,
          artifacts: [],
          runs: [],
        });
        setCreating(false);
        setError(toReadinessBlockedError(snapshot).message);
        return null;
      }

      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `create-${workspaceId}-${projectId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const { data, error: rpcError } = await supabase.rpc(
        'campaign_create_readiness_rpc',
        buildCampaignCreateRpcParams({ workspaceId, projectId, name, idempotencyKey, expectedProjectName }),
      );

      let result;
      try {
        result = mapCampaignCreateRpcResponse(data, rpcError);
      } catch (mappingError) {
        setCreating(false);
        setError(GENERIC_CREATE_ERROR);
        // Diagnóstico de dev; a mensagem exposta na UI acima já está sanitizada.
        console.error('[use-create-campaign] campaign_create_readiness_rpc failed', mappingError);
        return null;
      }

      setCreating(false);
      if (!result.ok) {
        setError(result.message);
        return null;
      }
      return toAdsCampaign(result.campaign);
    },
    [],
  );

  return { creating, error, createCampaign };
}
