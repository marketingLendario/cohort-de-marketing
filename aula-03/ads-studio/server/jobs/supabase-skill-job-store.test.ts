import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseSkillRunJobStore } from './supabase-skill-job-store.js'
import type { SkillRunJobRecord } from './types.js'

/**
 * Regressão do guard atômico de `startRetry` (QA-W2B1-01).
 *
 * O adapter Supabase faz o retry como um compare-and-swap de estado terminal: o
 * UPDATE carrega `.in('status', ['succeeded','failed','cancelled'])`, então dois
 * retries concorrentes (double-click / POST duplicado) que leem AMBOS o job ainda
 * terminal só produzem UM vencedor — o perdedor bate em zero linhas e devolve
 * `undefined` (o endpoint então responde 409, sem agendar um segundo Codex).
 *
 * O fake abaixo cobre exatamente as duas formas de query que `startRetry` usa
 * (read: select→eq→maybeSingle; guarded update: update→eq→in→select→maybeSingle)
 * e — crucialmente — avalia o `.in('status')` contra o estado VIVO no momento do
 * UPDATE, com um yield de microtask nos terminais para que ambas as leituras
 * entreguem o snapshot terminal ANTES de qualquer escrita comprometer o guard.
 */

type Row = Record<string, unknown>
type Filter = { op: 'eq' | 'in'; col: string; val: unknown }

class FakeQuery {
  private mode: 'select' | 'update' | 'insert' | null = null
  private payload: Row = {}
  private readonly filters: Filter[] = []
  private readonly rows: Map<string, Row>

  constructor(rows: Map<string, Row>) {
    this.rows = rows
  }

  select(): this {
    if (this.mode === null) this.mode = 'select'
    return this
  }
  update(payload: Row): this {
    this.mode = 'update'
    this.payload = payload
    return this
  }
  eq(col: string, val: unknown): this {
    this.filters.push({ op: 'eq', col, val })
    return this
  }
  in(col: string, val: unknown[]): this {
    this.filters.push({ op: 'in', col, val })
    return this
  }

  private matches(row: Row): boolean {
    return this.filters.every((filter) =>
      filter.op === 'eq' ? row[filter.col] === filter.val : (filter.val as unknown[]).includes(row[filter.col]),
    )
  }

  private find(): Row | undefined {
    for (const row of this.rows.values()) if (this.matches(row)) return row
    return undefined
  }

  async maybeSingle(): Promise<{ data: Row | null; error: null }> {
    // Yield: garante que as duas LEITURAS concorrentes resolvam (ambas terminal)
    // antes de qualquer UPDATE avaliar o guard `.in('status')` contra o estado vivo.
    await Promise.resolve()
    if (this.mode === 'update') {
      const target = this.find()
      if (!target) return { data: null, error: null }
      Object.assign(target, this.payload)
      return { data: { ...target }, error: null }
    }
    const found = this.find()
    return { data: found ? { ...found } : null, error: null }
  }
}

function createFakeSupabase(rows: Map<string, Row>): SupabaseClient {
  return { from: () => new FakeQuery(rows) } as unknown as SupabaseClient
}

const TS = '2026-07-09T12:00:00.000Z'

function seedTerminalRow(status: 'failed' | 'succeeded' | 'cancelled'): Map<string, Row> {
  const rows = new Map<string, Row>()
  rows.set('job-1', {
    id: 'job-1',
    workspace_id: 'ws-1',
    project_id: 'project-1',
    skill_id: 'offerbook',
    skill_hash: 'hash-1',
    status,
    attempt: 1,
    attempts: [{ attempt: 1, status, startedAt: TS, endedAt: TS }],
    steps: [{ id: 'codex', label: 'Executar Codex CLI', status: 'failed', timestamp: TS }],
    logs: [],
    input: { projectId: 'project-1', brief: {} },
    proposal: null,
    model: null,
    error: status === 'failed' ? { reason: 'boom', capabilityUnavailable: false } : null,
    lease_owner: null,
    lease_expires_at: null,
    created_at: TS,
    updated_at: TS,
  })
  return rows
}

describe('supabase skill-run job store — atomic retry guard (QA-W2B1-01)', () => {
  it('two concurrent retries of a terminal job yield exactly one queued attempt; the loser is undefined', async () => {
    const rows = seedTerminalRow('failed')
    const store = createSupabaseSkillRunJobStore(createFakeSupabase(rows), { now: () => TS })

    const [a, b] = await Promise.all([store.startRetry('job-1'), store.startRetry('job-1')])

    const winners = [a, b].filter((result): result is SkillRunJobRecord => result !== undefined)
    const losers = [a, b].filter((result) => result === undefined)
    // Exatamente um vencedor (agenda 1 run) e um perdedor (→ 409, sem duplicar).
    expect(winners).toHaveLength(1)
    expect(losers).toHaveLength(1)

    // O vencedor abriu a tentativa #2 em `queued`; o perdedor não reagendou nada.
    expect(winners[0]?.status).toBe('queued')
    expect(winners[0]?.attempt).toBe(2)

    // A linha persistida reflete exatamente UM retry (queued, tentativa 2).
    const persisted = rows.get('job-1')!
    expect(persisted.status).toBe('queued')
    expect(persisted.attempt).toBe(2)
  })

  it('a retry of an already-retried (now queued) job is rejected (undefined)', async () => {
    const rows = seedTerminalRow('failed')
    const store = createSupabaseSkillRunJobStore(createFakeSupabase(rows), { now: () => TS })

    const first = await store.startRetry('job-1')
    expect(first?.status).toBe('queued')

    // Segundo retry sequencial: o job já não é terminal → guard rejeita.
    const second = await store.startRetry('job-1')
    expect(second).toBeUndefined()
  })

  it('startRetry of a missing job returns undefined', async () => {
    const store = createSupabaseSkillRunJobStore(createFakeSupabase(new Map()), { now: () => TS })
    expect(await store.startRetry('nope')).toBeUndefined()
  })
})
