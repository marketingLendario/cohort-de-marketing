import { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Icon, Progress } from '@/lib/lendaria-ds';
import {
  cancelSkillRun,
  computeSkillRunProgress,
  isTerminalSkillRun,
  observeSkillRun,
  retrySkillRun,
  type EventSourceFactory,
  type SkillRunDonePayload,
  type SkillRunStatus,
  type SkillRunView,
} from '@/lib/skill-runtime';
import { classifyRunError, type CampaignRunClassifiedError } from '@/lib/campaign-run-errors';

/**
 * Campaign run status panel (STORY-12.W3.1 AC1/AC2).
 *
 * Extends the existing `skill-runtime` observation contract (`observeSkillRun`
 * — SSE with polling fallback, reattaches by `jobId` so a reload resumes the
 * SAME run) instead of the plain `executeLocalSkill` + generic error string
 * previously used by `TrafficCampaignWorkspace`. Shows: terminal/non-terminal
 * state, current phase, last event, timestamp, and a progress indicator that
 * is determinate ONLY when every observed step belongs to the runner's known
 * 3-phase contract (`computeSkillRunProgress`) — never a fabricated ETA or
 * percentage (Dev Notes).
 *
 * Errors (both the readiness preflight the caller ran before starting, and a
 * terminal run outcome) are classified by `campaign-run-errors.ts` into ONE
 * envelope: human message, action, redacted correlation id, and whether a
 * retry is safe (AC2).
 */

const STATUS_LABEL: Record<SkillRunStatus, string> = {
  queued: 'Na fila',
  running: 'Em execução',
  succeeded: 'Concluída',
  failed: 'Falhou',
  cancelled: 'Cancelada',
};

const STATUS_BADGE_VARIANT: Record<SkillRunStatus, 'info' | 'success' | 'destructive'> = {
  queued: 'info',
  running: 'info',
  succeeded: 'success',
  failed: 'destructive',
  cancelled: 'destructive',
};

const DEFAULT_STALLED_AFTER_MS = 20_000;

export interface CampaignRunStatusProps {
  /** The active durable run to observe, or `null` when nothing has started yet. */
  jobId: string | null;
  /** Human label of the skill being run (e.g. "Briefista", "Estruturador"). */
  skillLabel: string;
  /**
   * A classified error computed by the CALLER before a run even started (the
   * `READINESS_BLOCKED`/`STALE_READINESS` preflight — AC2). Takes precedence
   * over any run observation since there is no `jobId` to observe yet.
   */
  preflightError?: CampaignRunClassifiedError | null;
  /** Invoked when the operator presses the action button of a `preflightError`. */
  onRetryPreflight?: () => void;
  /** Invoked once the observed run reaches a successful terminal state. */
  onDone?: (payload: SkillRunDonePayload) => void;
  /** Invoked after the operator cancels an in-flight run. */
  onCancelled?: () => void;
  /**
   * Called right before an in-place retry actually fires `retrySkillRun`
   * (AC4 — "retry não reusa snapshot obsoleto"). Return `false` to block the
   * retry; the caller is expected to surface why (e.g. re-render
   * `preflightError` with `STALE_READINESS`) instead. Always allowed when
   * omitted (backward compatible).
   */
  onBeforeRetry?: () => boolean;
  /** Test seam — injected EventSource factory (defaults to the global one). */
  eventSourceFactory?: EventSourceFactory | null;
  /** Test seam — polling cadence for the fallback path. */
  pollIntervalMs?: number;
  /** How long without a new event (while non-terminal) before showing "stalled" (AC1/AC5). */
  stalledAfterMs?: number;
  /** Test seam — injectable clock. */
  now?: () => number;
}

function formatTimestamp(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

function lastEventMessage(view: SkillRunView | null): string {
  if (!view) return 'Aguardando o runner iniciar.';
  const lastLog = view.logs.at(-1);
  if (lastLog) return lastLog.message;
  const lastStep = view.steps.at(-1);
  if (lastStep) return lastStep.label;
  return 'Aguardando o runner iniciar.';
}

export function CampaignRunStatus({
  jobId,
  skillLabel,
  preflightError = null,
  onRetryPreflight,
  onDone,
  onCancelled,
  onBeforeRetry,
  eventSourceFactory,
  pollIntervalMs,
  stalledAfterMs = DEFAULT_STALLED_AFTER_MS,
  now = Date.now,
}: CampaignRunStatusProps) {
  const [view, setView] = useState<SkillRunView | null>(null);
  const [classifiedError, setClassifiedError] = useState<CampaignRunClassifiedError | null>(null);
  const [lastEventAt, setLastEventAt] = useState<number>(now());
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [resubscribeToken, setResubscribeToken] = useState(0);
  const [, forceTick] = useState(0);
  const attemptRef = useRef(1);

  useEffect(() => {
    if (!jobId) {
      setView(null);
      setClassifiedError(null);
      return;
    }
    setClassifiedError(null);
    setLastEventAt(now());
    const unsubscribe = observeSkillRun(
      jobId,
      {
        onSnapshot: (snapshot) => {
          setView(snapshot);
          attemptRef.current = snapshot.attempt;
          setLastEventAt(now());
          if (snapshot.status === 'succeeded' && snapshot.proposal && snapshot.skillHash && snapshot.model) {
            onDone?.({ jobId: snapshot.jobId, proposal: snapshot.proposal, skillHash: snapshot.skillHash, model: snapshot.model });
          }
        },
        onProgress: (payload) => {
          setLastEventAt(now());
          setView((current) => {
            if (!current) return current;
            const steps = payload.step
              ? (() => {
                  const next = [...current.steps];
                  const idx = next.findIndex((step) => step.id === payload.step!.id);
                  if (idx >= 0) next[idx] = payload.step!;
                  else next.push(payload.step!);
                  return next;
                })()
              : current.steps;
            const logs = payload.log ? [...current.logs, payload.log] : current.logs;
            return { ...current, status: payload.status, attempt: payload.attempt, steps, logs, updatedAt: payload.timestamp };
          });
        },
        onDone: (payload) => {
          setLastEventAt(now());
          onDone?.(payload);
        },
        onError: (error, status) => {
          setLastEventAt(now());
          if (status === 'cancelled') onCancelled?.();
          setClassifiedError(classifyRunError({ jobId, attempt: attemptRef.current, status, error }));
        },
      },
      { pollIntervalMs, eventSourceFactory },
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, resubscribeToken]);

  // Force a re-render every second while a run is non-terminal so the elapsed
  // "since last event" text (and the stalled indicator) stay live even when NO
  // new event arrives — that silence is exactly what "stalled" means (AC5).
  useEffect(() => {
    if (!jobId || !view || isTerminalSkillRun(view.status)) return;
    const timer = setInterval(() => forceTick((tick) => tick + 1), 1000);
    return () => clearInterval(timer);
  }, [jobId, view]);

  async function handleCancel() {
    if (!jobId || cancelling) return;
    setCancelling(true);
    try {
      await cancelSkillRun(jobId);
    } catch {
      // The terminal `error` SSE/poll frame (or a future snapshot) is the
      // durable source of truth — a transient cancel-request failure here is
      // not swallowed silently, but there is nothing actionable to add.
    } finally {
      setCancelling(false);
    }
  }

  async function handleRetryRun() {
    if (!jobId || retrying) return;
    if (onBeforeRetry && !onBeforeRetry()) return;
    setRetrying(true);
    try {
      await retrySkillRun(jobId);
      setClassifiedError(null);
      setView(null);
      setResubscribeToken((token) => token + 1);
    } catch (error) {
      setClassifiedError(
        classifyRunError({
          jobId,
          attempt: attemptRef.current,
          status: 'failed',
          error: { reason: error instanceof Error ? error.message : 'Não foi possível reiniciar a execução.', capabilityUnavailable: false },
        }),
      );
    } finally {
      setRetrying(false);
    }
  }

  if (preflightError) {
    return (
      <section className="cms-campaign-run-status cms-campaign-run-status--preflight" data-testid="campaign-run-status" data-run-code={preflightError.code}>
        <Alert variant="destructive" data-testid="campaign-run-status-error">
          <strong>{preflightError.message}</strong>
          <p className="cms-campaign-run-status__correlation">Referência de suporte: {preflightError.correlationId}</p>
          {onRetryPreflight ? (
            <Button size="sm" onClick={onRetryPreflight} data-testid="campaign-run-status-preflight-action">
              <Icon name="refresh" size={12} /> {preflightError.action.label}
            </Button>
          ) : null}
        </Alert>
      </section>
    );
  }

  if (!jobId) return null;

  const terminal = view ? isTerminalSkillRun(view.status) : false;
  const stalled = !terminal && view !== null && now() - lastEventAt > stalledAfterMs;
  const progress = computeSkillRunProgress(view?.steps ?? []);
  const status = view?.status ?? 'queued';

  return (
    <section className="cms-campaign-run-status" data-testid="campaign-run-status" data-run-status={status} data-run-terminal={String(terminal)}>
      <div className="cms-campaign-run-status__head">
        <Badge variant={STATUS_BADGE_VARIANT[status]} data-testid="campaign-run-status-badge">
          {STATUS_LABEL[status]}
        </Badge>
        <span className="cms-campaign-run-status__skill">{skillLabel}</span>
        <span className="cms-campaign-run-status__timestamp" data-testid="campaign-run-status-timestamp">
          {formatTimestamp(view?.updatedAt)}
        </span>
      </div>

      <p className="cms-campaign-run-status__phase" data-testid="campaign-run-status-phase">
        {progress.currentPhaseLabel ?? 'Preparando execução...'}
      </p>

      <p className="cms-campaign-run-status__last-event" data-testid="campaign-run-status-last-event">
        {lastEventMessage(view)}
      </p>

      {progress.determinate ? (
        <div data-testid="campaign-run-status-progress" data-progress-mode="determinate">
          <Progress value={progress.completed} max={progress.total} />
          <span className="cms-campaign-run-status__progress-label">
            Fase {progress.completed} de {progress.total}
          </span>
        </div>
      ) : !terminal ? (
        <div data-testid="campaign-run-status-progress" data-progress-mode="indeterminate" className="cms-campaign-run-status__progress-indeterminate" aria-live="polite">
          <span className="cms-loader" aria-hidden="true" /> Executando — sem estimativa de tempo.
        </div>
      ) : null}

      {stalled ? (
        <p className="cms-campaign-run-status__stalled" data-testid="campaign-run-status-stalled" role="status">
          <Icon name="warning-triangle" size={12} /> Sem atualização recente do runner. Ainda em execução — o job continua sendo observado.
        </p>
      ) : null}

      {!terminal ? (
        <Button variant="outline" size="sm" onClick={() => void handleCancel()} disabled={cancelling} data-testid="campaign-run-status-cancel-button">
          <Icon name="xmark" size={12} /> {cancelling ? 'Cancelando...' : 'Cancelar execução'}
        </Button>
      ) : null}

      {classifiedError ? (
        <Alert variant="destructive" data-testid="campaign-run-status-error" data-run-code={classifiedError.code}>
          <strong>{classifiedError.message}</strong>
          <p className="cms-campaign-run-status__correlation">Referência de suporte: {classifiedError.correlationId}</p>
          {classifiedError.retrySafe ? (
            <Button size="sm" onClick={() => void handleRetryRun()} disabled={retrying} data-testid="campaign-run-status-retry-button">
              <Icon name="refresh" size={12} /> {retrying ? 'Reiniciando...' : classifiedError.action.label}
            </Button>
          ) : null}
        </Alert>
      ) : null}
    </section>
  );
}
