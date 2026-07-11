import type { HTMLAttributes } from 'react';

/**
 * Progress — porte fiel de `components/display/Progress.jsx`.
 * Linha de progresso de 2px (ouro sobre track secundário), não barra grossa.
 */
export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export function Progress({ value = 0, max = 100, className = '', ...props }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={`al-progress ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      {...props}
    >
      <div className="al-progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
