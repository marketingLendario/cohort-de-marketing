/**
 * L3 — Headless fallback layer — STUB + ENVIRONMENT GUARD (NOT ACTIVE).
 *
 * arch §2.2 L3 / deploy-topology §2: skills that exist ONLY as Claude Code
 * skills (LOCAL, in the repo) and have not yet been ported to a deterministic
 * job type. These would run via `claude -p` headless in a CONTROLLED environment
 * (worker with the repo mounted) — the point of HIGHEST tension with
 * `devops-escalation-ceiling.md`.
 *
 * DECISION (deploy-topology §2, V1 — Gage): **MVP has NO L3 headless in
 * production.** Running `claude -p` + repo + Anthropic credentials in a
 * persistent VPS container VIOLATES the escalation ceiling and MUST be escalated
 * to Pedro before any implementation. This module therefore HARD-GUARDS L3: it
 * is disabled unless an explicit, controlled-environment opt-in flag is set, and
 * it NEVER runs in `NODE_ENV=production`.
 *
 * STORY-AL-ADS-1.3 (AC6 — L3 stub + guard, do NOT activate).
 */

export interface L3Result {
  layer: 'L3'
  ok: false
  reason: string
  capabilityUnavailable: true
}

/**
 * Whether L3 headless is permitted in the current environment. Returns `true`
 * ONLY when `ADS_STUDIO_L3_HEADLESS=1` AND `NODE_ENV !== 'production'`. The
 * production host (Coolify `dockerimage`) never sets the flag and is always
 * `production`, so this is always `false` there (deploy-topology §2).
 */
export function isL3HeadlessAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.ADS_STUDIO_L3_HEADLESS === '1' && env.NODE_ENV !== 'production'
}

/**
 * L3 dispatch STUB. Always returns a treatable unavailability state in 1.3 —
 * the guard prevents any real `claude -p` invocation. When a genuinely L3-only
 * capability appears, the rule is to PORT it to an L2 job type (deploy-topology
 * §2: "toda skill L3 recorrente DEVE ser portada a um job type"), not to enable
 * this path in prod.
 */
export function dispatchHeadless(skill: string): L3Result {
  return {
    layer: 'L3',
    ok: false,
    reason: isL3HeadlessAllowed()
      ? `L3 headless for '${skill}' is not implemented in the 1.3 skeleton — port to an L2 job type (deploy-topology §2).`
      : `L3 headless is disabled in this environment (escalation ceiling). '${skill}' must be ported to an L2 job type.`,
    capabilityUnavailable: true,
  }
}
