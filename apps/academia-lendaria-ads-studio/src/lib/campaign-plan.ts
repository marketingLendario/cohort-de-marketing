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

export function createInitialCampaignPlan(
  projectId: string,
  campaignId: string,
  brief: ProjectBriefRevision,
  now = new Date().toISOString(),
): CampaignPlanRevision {
  const awareness = Number(getPath(brief.data, 'market.awarenessLevel').value ?? 2);
  const pain = String(getPath(brief.data, 'market.dominantPain').value ?? 'Ângulo principal do projeto');
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
    budget: { daily: 30, periodDays: 7, currency: 'BRL' },
    angles: [{ id: 'angle-1', name: pain, awarenessLevel: Number.isFinite(awareness) ? awareness : 2, source: 'brief' }],
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

