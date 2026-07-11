import type { CSSProperties, HTMLAttributes } from 'react';

/**
 * Icon — porte fiel de `components/core/Icon.jsx` (bundle Lendár[IA]).
 * Iconoir webfont (v7.11.0, pinada — branch @main é mutável/risco de supply-chain).
 * Nomes de glyph kebab-case iguais ao app de produção (book, play-circle, users…).
 */
const ICONOIR_CSS = 'https://cdn.jsdelivr.net/npm/iconoir@7.11.0/css/iconoir.css';

/** Injeta o stylesheet da Iconoir uma única vez. */
function ensureIconoir(): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector('link[data-al-iconoir]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = ICONOIR_CSS;
  link.setAttribute('data-al-iconoir', 'true');
  document.head.appendChild(link);
}

const sizeMap: Record<string, number> = {
  'size-3': 12,
  'size-4': 14,
  'size-5': 16,
  'size-6': 18,
  'size-7': 20,
  'size-8': 24,
  'size-9': 30,
  'size-10': 36,
};

export type IconSize = keyof typeof sizeMap | number;

export interface IconProps extends HTMLAttributes<HTMLElement> {
  name: string;
  size?: IconSize;
  color?: string;
}

export function Icon({
  name,
  size = 'size-5',
  color,
  className = '',
  style = {},
  ...props
}: IconProps) {
  ensureIconoir();
  const px = typeof size === 'number' ? size : sizeMap[size] ?? 16;
  const merged: CSSProperties = {
    fontSize: px,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color,
    ...style,
  };
  return <i className={`iconoir-${name} ${className}`} aria-hidden="true" style={merged} {...props} />;
}
