/**
 * tRPC initialization (mirrors `apps/squad-engine/src/trpc/trpc.ts` — REUSE of
 * topology, arch §9). Isolated to avoid circular imports (router ↔ procedures).
 *
 * STORY-AL-ADS-1.3 (AC8).
 */
import { initTRPC } from '@trpc/server'
import type { TRPCContext } from './context.js'

export const t = initTRPC.context<TRPCContext>().create()

export const router = t.router
export const publicProcedure = t.procedure
