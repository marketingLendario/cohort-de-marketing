// STORY-151.5 (D7/D8 fix): executors.model + workspaces.default_model do not
// exist in the real schema (SOT 2026-05-16). Model resolution now uses
// executors.subagent_type to pick an LLM model string, falling back to the
// system default. The old workspaceModel path is removed entirely (D8).
//
// Lifted verbatim from `apps/squad-engine/src/agent/model-resolver.ts`
// (STORY-AL-ADS-0c.4 — pure phase of `@sinkra/agent-host`). No infra deps.

// STORY-151.7 live-proof: OpenRouter (STORY-151.4 Opção C, fetchLLM direct)
// rejects bare Anthropic IDs ("claude-sonnet-4-5 is not a valid model ID",
// 400). The default MUST be the provider-prefixed OpenRouter slug — aligned
// to this file's own SUBAGENT_TYPE_TO_MODEL 'claude-sonnet' entry (No-Invention).
const SYSTEM_DEFAULT_MODEL = 'anthropic/claude-sonnet-4-5'

// Map from executor.subagent_type values (as stored in the DB) to LLM model
// strings understood by OpenRouter. Extend as new executor types are added.
const SUBAGENT_TYPE_TO_MODEL: Record<string, string> = {
  'claude-opus': 'anthropic/claude-opus-4',
  'claude-sonnet': 'anthropic/claude-sonnet-4-5',
  'claude-haiku': 'anthropic/claude-haiku-4-5',
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
}

export interface ModelResolutionContext {
  taskModel?: string | null
  // D7 fix: was agentModel (from executors.model — missing). Now subagentType
  // (from executors.subagent_type — exists) drives model resolution.
  subagentType?: string | null
  // D8 fix: workspaceModel (from workspaces.default_model — missing) removed.
}

/**
 * Resolves LLM model per hierarchy:
 *   Task override > subagent_type mapping > system default.
 *
 * workspaceModel was removed in STORY-151.5 D8 (workspaces.default_model does
 * not exist in the schema).
 */
export function resolveModel(ctx: ModelResolutionContext): string {
  if (ctx.taskModel) return ctx.taskModel
  if (ctx.subagentType) {
    return SUBAGENT_TYPE_TO_MODEL[ctx.subagentType] ?? SYSTEM_DEFAULT_MODEL
  }
  return SYSTEM_DEFAULT_MODEL
}

export { SYSTEM_DEFAULT_MODEL }
