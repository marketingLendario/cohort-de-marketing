import { readFile } from 'node:fs/promises'

export type SystemReadinessStatus = 'ready' | 'degraded' | 'blocked'

export interface SystemReadinessCheck {
  id: string
  label: string
  status: SystemReadinessStatus
  detail: string
  recovery?: string
  required: boolean
}

export interface SystemReadinessSnapshot {
  status: SystemReadinessStatus
  checkedAt: string
  source: 'launcher' | 'manual'
  appUrl?: string
  checks: SystemReadinessCheck[]
}

const VALID_STATUSES = new Set<SystemReadinessStatus>(['ready', 'degraded', 'blocked'])
const SENSITIVE_VALUE = /(?:sk-[A-Za-z0-9_-]{12,}|sb_(?:secret|publishable)_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|postgres(?:ql)?:\/\/[^\s@]+@)/g

function safeText(value: unknown, fallback: string, maxLength = 320): string {
  if (typeof value !== 'string') return fallback
  const sanitized = value.replace(SENSITIVE_VALUE, '[REDACTED]').trim()
  return (sanitized || fallback).slice(0, maxLength)
}

function statusOf(value: unknown, fallback: SystemReadinessStatus): SystemReadinessStatus {
  return typeof value === 'string' && VALID_STATUSES.has(value as SystemReadinessStatus)
    ? value as SystemReadinessStatus
    : fallback
}

export function aggregateReadiness(checks: SystemReadinessCheck[]): SystemReadinessStatus {
  if (checks.some((check) => check.required && check.status === 'blocked')) return 'blocked'
  if (checks.some((check) => check.status !== 'ready')) return 'degraded'
  return 'ready'
}

export function manualReadinessSnapshot(now = new Date().toISOString()): SystemReadinessSnapshot {
  return {
    status: 'degraded',
    checkedAt: now,
    source: 'manual',
    checks: [{
      id: 'launcher',
      label: 'Inicialização assistida',
      status: 'degraded',
      detail: 'O app foi iniciado sem o diagnóstico completo do launcher.',
      recovery: 'Na raiz do projeto, rode: node scripts/marketing-studio.mjs start',
      required: false,
    }],
  }
}

export function parseReadinessSnapshot(value: unknown, now = new Date().toISOString()): SystemReadinessSnapshot {
  if (!value || typeof value !== 'object') return manualReadinessSnapshot(now)
  const record = value as Record<string, unknown>
  const checks = (Array.isArray(record.checks) ? record.checks : [])
    .filter((candidate): candidate is Record<string, unknown> => Boolean(candidate) && typeof candidate === 'object')
    .slice(0, 24)
    .map((candidate, index): SystemReadinessCheck => ({
      id: safeText(candidate.id, `check-${index + 1}`, 64),
      label: safeText(candidate.label, 'Verificação local', 100),
      status: statusOf(candidate.status, 'degraded'),
      detail: safeText(candidate.detail, 'Sem detalhes disponíveis.'),
      ...(typeof candidate.recovery === 'string'
        ? { recovery: safeText(candidate.recovery, 'Rode o diagnóstico novamente.') }
        : {}),
      required: candidate.required === true,
    }))
  if (checks.length === 0) return manualReadinessSnapshot(now)
  const rawAppUrl = typeof record.appUrl === 'string' ? record.appUrl.trim() : ''
  const appUrl = /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(rawAppUrl) ? rawAppUrl : undefined
  return {
    status: aggregateReadiness(checks),
    checkedAt: safeText(record.checkedAt, now, 64),
    source: record.source === 'launcher' ? 'launcher' : 'manual',
    ...(appUrl ? { appUrl } : {}),
    checks,
  }
}

export async function readReadinessSnapshot(filePath?: string): Promise<SystemReadinessSnapshot> {
  if (!filePath) return manualReadinessSnapshot()
  try {
    return parseReadinessSnapshot(JSON.parse(await readFile(filePath, 'utf8')))
  } catch {
    return manualReadinessSnapshot()
  }
}
