import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/lib/lendaria-ds';
import {
  fetchSystemReadiness,
  UNAVAILABLE_READINESS,
  type SystemReadinessSnapshot,
  type SystemReadinessStatus,
} from '@/lib/system-readiness';

const STATUS_LABELS: Record<SystemReadinessStatus, string> = {
  ready: 'Tudo pronto para continuar',
  degraded: 'Um item precisa de atenção',
  blocked: 'Ação necessária para continuar',
};

const FRIENDLY_CHECKS: Record<string, { label: string; recovery: string }> = {
  codex: {
    label: 'Acesso à inteligência artificial',
    recovery: 'Abra novamente o Marketing Studio pelo atalho de início. Se o aviso continuar, peça ajuda ao suporte da turma para renovar seu acesso.',
  },
  db: {
    label: 'Seus projetos salvos',
    recovery: 'Feche e abra novamente o Marketing Studio. Seus projetos permanecem salvos no computador.',
  },
  database: {
    label: 'Seus projetos salvos',
    recovery: 'Feche e abra novamente o Marketing Studio. Seus projetos permanecem salvos no computador.',
  },
  web: {
    label: 'Tela do Marketing Studio',
    recovery: 'Aguarde alguns segundos e escolha “Verificar novamente”.',
  },
  browser: {
    label: 'Abertura no navegador',
    recovery: 'Volte à janela do Marketing Studio ou abra o endereço mostrado pelo atalho de início.',
  },
  launcher: {
    label: 'Inicialização do Marketing Studio',
    recovery: 'Feche esta aba e abra novamente o Marketing Studio pelo mesmo atalho usado no início.',
  },
  'readiness-api': {
    label: 'Verificação do Marketing Studio',
    recovery: 'Aguarde alguns segundos e escolha “Verificar novamente”. Se continuar, feche e abra o Marketing Studio.',
  },
};

function friendlyCheck(check: SystemReadinessSnapshot['checks'][number]) {
  const copy = FRIENDLY_CHECKS[check.id];
  return {
    label: copy?.label ?? check.label.replace(/CLI|API|BFF|Supabase|Vite/gi, 'serviço local'),
    detail: check.status === 'ready'
      ? 'Pronto para uso.'
      : check.required
        ? 'Este item precisa ser recuperado antes de continuar.'
        : 'Você pode continuar, mas esta parte pode não funcionar agora.',
    recovery: copy?.recovery ?? 'Aguarde alguns segundos e escolha “Verificar novamente”. Se o aviso continuar, feche e abra o Marketing Studio.',
  };
}

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
          aria-label="Estado do Marketing Studio"
          aria-modal="false"
          tabIndex={-1}
        >
          <div className="cms-system-readiness__head">
            <div>
              <span className={`cms-system-readiness__summary is-${snapshot.status}`}>
                <Icon name={STATUS_ICONS[snapshot.status]} size={14} />
                {label}
              </span>
              <p>{snapshot.status === 'ready' ? 'Você pode seguir com seu projeto' : 'Siga a orientação abaixo'}</p>
            </div>
            <button
              className="asx-iconbtn cms-system-readiness__refresh"
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              title="Atualizar estado"
              aria-label={refreshing ? 'Atualizando estado' : 'Atualizar estado'}
            >
              <Icon name="refresh-double" size={14} />
            </button>
          </div>

          <div className="cms-system-readiness__checks">
            {snapshot.checks.map((check) => {
              const copy = friendlyCheck(check);
              return <div className={`cms-system-readiness__check is-${check.status}`} key={check.id}>
                <Icon name={STATUS_ICONS[check.status]} size={14} />
                <div>
                  <strong>{copy.label}</strong>
                  <span>{copy.detail}</span>
                  {check.status !== 'ready' ? <p>{copy.recovery}</p> : null}
                </div>
              </div>;
            })}
          </div>
          {snapshot.status !== 'ready' ? (
            <button className="cms-system-readiness__retry" type="button" onClick={() => void refresh()} disabled={refreshing}>
              <Icon name="refresh-double" size={14} />
              {refreshing ? 'Verificando…' : 'Verificar novamente'}
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
