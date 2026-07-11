/**
 * Root tRPC router for the Ads Studio BFF.
 *
 * Currently exposes the `jobs.*` orchestration contract (arch §6.2). Future
 * stories add `campaigns.*`, `economics.*` (L0 gate), etc.
 *
 * STORY-AL-ADS-1.3 (AC8).
 */
import { router } from './trpc.js'
import { jobsRouter } from './routers/jobs.router.js'
import { campaignsRouter } from './routers/campaigns.router.js'

export const appRouter = router({
  jobs: jobsRouter,
  campaign: campaignsRouter,
})

export type AppRouter = typeof appRouter
