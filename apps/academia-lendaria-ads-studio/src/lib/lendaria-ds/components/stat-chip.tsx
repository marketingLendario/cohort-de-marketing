import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

/**
 * StatChip — porte fiel de `components/display/StatChip.jsx`.
 * Par label/valor em cápsula: mono caps + serif. Padrão "MEMBROS · 3.847".
 */
export interface StatChipProps extends HTMLAttributes<HTMLSpanElement> {
  label: ReactNode;
  value: ReactNode;
  /** Token semântico de cor para o valor (ex: 'success', 'primary'). */
  tone?: string;
}

export function StatChip({ label, value, tone, className = '', ...props }: StatChipProps) {
  const valueStyle: CSSProperties | undefined = tone ? { color: `var(--${tone})` } : undefined;
  return (
    <span className={`al-stat ${className}`} {...props}>
      <span className="al-stat__label">{label}</span>
      <span className="al-stat__value" style={valueStyle}>
        {value}
      </span>
    </span>
  );
}
