/**
 * BFF (Backend-for-Frontend) — orchestration layer (STORY-AL-ADS-1.3).
 *
 * Boundary Axiom (Constitution Art. VII / arch §1.1, §8): este BFF é ONLINE.
 * Ele ORQUESTRA skills LOCAL (via worker dedicado) e o adapter `services/meta-ads`,
 * mas NUNCA embute a lógica dessas skills e NUNCA guarda secrets no host público
 * (`.claude/rules/devops-escalation-ceiling.md`, NFR10).
 *
 * 1.3 entrega: contrato tRPC `jobs.*` (arch §6.2), o dispatcher L0-L3 (arch §2.2),
 * o esqueleto do worker dedicado sobre `@sinkra/job-*`, o canal SSE de progresso
 * + polling tRPC de fallback, e degradação graciosa (NFR9). Os job types `ads-*`
 * (L2) e o gate L0 (`@sinkra/ads-economics`) ganham implementação em 1.5/1.6 e
 * nos épicos 2-5.
 *
 * Montagem do servidor: `buildApp()` em `./app.ts`; entrypoint em `./start.ts`.
 */

// --- Public re-exports (orchestration surface) ---
export { buildApp } from './app.js'
export type { BuildAppOptions } from './app.js'
export { appRouter } from './trpc/router.js'
export type { AppRouter } from './trpc/router.js'
export { dispatch, layerForType } from './orchestration/dispatcher.js'
export { metaAdsCheck, isMetaAdsAdapterAvailable } from './orchestration/l1-meta-ads.js'
export { revalidateUnitEconomics } from './orchestration/l0-deterministic.js'
export { MetaCliPublisher } from './publisher/ad-publisher.js'
export { getWorkerHealth, WORKER_JOB_TYPES } from './worker/index.js'
export { createInMemoryJobStore } from './jobs/store.js'
export type { AdsJobEvent } from './jobs/events.js'
export type { AdsJobType, AdsJobRecord, JobView } from './jobs/types.js'

export interface BffHealth {
  status: 'ok'
  surface: 'bff'
  boundary: 'ONLINE'
}

/** Health-check do BFF — contrato leve de liveness (composto em `/health`). */
export function getBffHealth(): BffHealth {
  return {
    status: 'ok',
    surface: 'bff',
    boundary: 'ONLINE',
  }
}
