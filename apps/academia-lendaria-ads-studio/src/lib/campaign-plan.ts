import { getPath, type CampaignPlanRevision, type ProjectBriefRevision } from '@/lib/project-domain';

export const TRACKING_CHECKS = [
  { id: 'bmActive', label: 'Business Manager ativo', critical: true },
  { id: 'adAccountActive', label: 'Conta de anúncios ativa', critical: true },
  { id: 'pixelFiring', label: 'Pixel disparando', critical: true },
  { id: 'capiActive', label: 'CAPI ativo', critical: true },
  { id: 'purchaseDeduplicated', label: 'Compra deduplicada', critical: true },
  { id: 'domainVerified', label: 'Domínio verificado', critical: false },
  { id: 'paymentApproved', label: 'Pagamento aprovado', critical: true },
] as const;

export function trackingStatus(checks: CampaignPlanRevision['tracking']['checks']): CampaignPlanRevision['tracking']['status'] {
  const critical = TRACKING_CHECKS.filter((check) => check.critical);
  if (critical.some((check) => checks[check.id]?.value !== true || !checks[check.id]?.evidence.trim())) return 'CRITICO';
  if (checks.domainVerified?.value !== true || !checks.domainVerified?.evidence.trim()) return 'PARCIAL';
  return 'OK';
}

/**
 * Cria o plano inicial de uma campanha SEM fabricar dados (AC3 — STORY-12.W1.1).
 *
 * `awareness`/`dor` (o primeiro ângulo) só são preenchidos quando o brief tem
 * um `market.dominantPain` e um `market.awarenessLevel` genuinamente
 * fornecidos — nunca um placeholder ("Ângulo principal do projeto") nem um
 * nível de consciência assumido (`?? 2`). Sem os dois, `angles` permanece
 * vazio: o dado ausente permanece ausente, e o ângulo real nasce quando
 * `campaign.brief`/`campaign.tracking` liberarem a etapa (readiness contract
 * em `src/lib/campaign-readiness.ts`).
 *
 * `budget` continua um objeto obrigatório (o tipo `CampaignPlanRevision` e os
 * consumidores existentes — `traffic-campaign-workspace.tsx`, fora do
 * file_scope desta story — leem `plan.budget.daily` sem checagem de nulidade),
 * mas o valor inicial é `{ daily: 0, periodDays: 1 }`: um sentinela
 * inequivocamente "não preenchido", nunca um número plausível como 30/dia que
 * poderia passar por dado real. `canStructureCampaign` já exige
 * `budget.daily >= 20`, então esse sentinela mantém a etapa corretamente
 * bloqueada até um humano digitar a verba real (W2/W4 UX).
 */
export function createInitialCampaignPlan(
  projectId: string,
  campaignId: string,
  brief: ProjectBriefRevision,
  now = new Date().toISOString(),
): CampaignPlanRevision {
  const awarenessLookup = getPath(brief.data, 'market.awarenessLevel');
  const painLookup = getPath(brief.data, 'market.dominantPain');
  const hasAwareness = awarenessLookup.exists && typeof awarenessLookup.value === 'number' && Number.isFinite(awarenessLookup.value);
  const hasPain = painLookup.exists && typeof painLookup.value === 'string' && painLookup.value.trim().length > 0;
  const landingPageUrl = getPath(brief.data, 'channels.primaryCtaUrl').value;
  const checks = Object.fromEntries(
    TRACKING_CHECKS.map((check) => [check.id, { value: null, evidence: '', critical: check.critical }]),
  );
  return {
    schemaVersion: '1.0.0',
    id: `campaign-plan-${campaignId}-1`,
    projectId,
    campaignId,
    revision: 1,
    sourceBrief: { id: brief.id, revision: brief.revision },
    platform: 'meta',
    objective: 'sales',
    ...(typeof landingPageUrl === 'string' && landingPageUrl ? { landingPageUrl } : {}),
    budget: { daily: 0, periodDays: 1, currency: 'BRL' },
    angles: hasPain && hasAwareness
      ? [{ id: 'angle-1', name: String(painLookup.value), awarenessLevel: Number(awarenessLookup.value), source: 'brief' }]
      : [],
    finalists: [],
    tracking: { status: 'PENDING', criticalItemsConfirmed: false, checks },
    structure: null,
    manualSubmission: { status: 'not_ready' },
    overrides: {},
    updatedAt: now,
  };
}

export function updateTrackingCheck(
  plan: CampaignPlanRevision,
  checkId: string,
  patch: Partial<CampaignPlanRevision['tracking']['checks'][string]>,
  now = new Date().toISOString(),
): CampaignPlanRevision {
  const checks = {
    ...plan.tracking.checks,
    [checkId]: { ...plan.tracking.checks[checkId], ...patch },
  };
  const status = trackingStatus(checks);
  return {
    ...plan,
    tracking: {
      ...plan.tracking,
      checks,
      status,
      criticalItemsConfirmed: !TRACKING_CHECKS.filter((check) => check.critical)
        .some((check) => checks[check.id]?.value !== true || !checks[check.id]?.evidence.trim()),
    },
    updatedAt: now,
  };
}

export function canStructureCampaign(plan: CampaignPlanRevision): boolean {
  return plan.tracking.status !== 'CRITICO'
    && plan.tracking.status !== 'PENDING'
    && plan.finalists.length >= 2
    && plan.finalists.length <= 3
    && plan.budget.daily >= 20;
}

