import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/lib/lendaria-ds';
import {
  fetchSystemReadiness,
  UNAVAILABLE_READINESS,
  type SystemReadinessSnapshot,
  type SystemReadinessStatus,
} from '@/lib/system-readiness';

const STATUS_LABELS: Record<SystemReadinessStatus, string> = {
  ready: 'Ambiente pronto',
  degraded: 'Ambiente degradado',
  blocked: 'Ambiente bloqueado',
};

const STATUS_ICONS: Record<SystemReadinessStatus, string> = {
  ready: 'check-circle',
  degraded: 'warning-circle',
  blocked: 'cancel',
};

export function SystemReadiness() {
  const [snapshot, setSnapshot] = useState<SystemReadinessSnapshot>(UNAVAILABLE_READINESS);
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const panelId = useId();

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setRefreshing(true);
    try {
      setSnapshot(await fetchSystemReadiness(signal));
    } catch {
      if (!signal?.aborted) setSnapshot(UNAVAILABLE_READINESS);
    } finally {
      if (!signal?.aborted) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const interval = window.setInterval(() => void refresh(controller.signal), 15_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const focusFrame = window.requestAnimationFrame(() => panelRef.current?.focus());
    const closeAndRestoreFocus = () => {
      setOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        closeAndRestoreFocus();
      }
      if (event instanceof MouseEvent && !rootRef.current?.contains(event.target as Node)) closeAndRestoreFocus();
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const label = STATUS_LABELS[snapshot.status];

  return (
    <div className="cms-system-readiness" ref={rootRef}>
      <button
        ref={triggerRef}
        className={`asx-iconbtn cms-system-readiness__trigger is-${snapshot.status}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
        title={label}
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
      >
        <Icon name="server" size={16} />
        <span aria-hidden="true" />
      </button>

      {open ? (
        <section
          ref={panelRef}
          className="cms-system-readiness__panel"
          id={panelId}
          role="dialog"
          aria-label="Diagnóstico do ambiente"
          aria-modal="false"
          tabIndex={-1}
        >
          <div className="cms-system-readiness__head">
            <div>
              <span className={`cms-system-readiness__summary is-${snapshot.status}`}>
                <Icon name={STATUS_ICONS[snapshot.status]} size={14} />
                {label}
              </span>
              <p>{snapshot.source === 'launcher' ? 'Inicialização assistida' : 'Inicialização manual'}</p>
            </div>
            <button
              className="asx-iconbtn cms-system-readiness__refresh"
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              title="Verificar novamente"
              aria-label="Verificar novamente"
            >
              <Icon name="refresh-double" size={14} />
            </button>
          </div>

          <div className="cms-system-readiness__checks">
            {snapshot.checks.map((check) => (
              <div className={`cms-system-readiness__check is-${check.status}`} key={check.id}>
                <Icon name={STATUS_ICONS[check.status]} size={14} />
                <div>
                  <strong>{check.label}</strong>
                  <span>{check.detail}</span>
                  {check.recovery && check.status !== 'ready' ? <p>{check.recovery}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
