import type { HTMLAttributes } from 'react';

/**
 * Badge / pill — porte fiel de `components/core/Badge.jsx` (bundle Lendár[IA]).
 * Chips mono contornados (LENDO / LIDO / RASCUNHO), nunca banners ruidosos.
 * O estilo vive em `tokens/components.css` (classes `al-badge*`).
 */
export type BadgeVariant =
  | 'default'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'outline';

export type BadgeSize = 'default' | 'sm' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function Badge({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const sizeClass = size !== 'default' ? ` al-badge--size-${size}` : '';
  return (
    <span className={`al-badge al-badge--${variant}${sizeClass} ${className}`} {...props}>
      {children}
    </span>
  );
}
