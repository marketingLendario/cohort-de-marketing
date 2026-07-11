import type { ButtonHTMLAttributes } from 'react';

/**
 * Lendár[IA] Button — porte fiel de `components/core/Button.jsx` (bundle).
 * Caps tracked, cantos de 2px, zero efeito. O estilo vive em
 * `tokens/components.css` (classes `al-btn*`).
 *
 * Variants: default (ouro preenchido — o CTA raro), outline (hairline dourada,
 * a assinatura editorial), secondary, ghost, destructive (contornado),
 * link (serif itálica), cta (default em tamanho cerimonial).
 * 'glowing' é legado e renderiza como outline quieto.
 */
export type ButtonVariant =
  | 'default'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'link'
  | 'cta'
  | 'glowing';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'default',
  size = 'default',
  // default 'button' para que Buttons dentro de <form> nunca submetam por acidente
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizeClass = size !== 'default' ? ` al-btn--size-${size}` : '';
  return (
    <button type={type} className={`al-btn al-btn--${variant}${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
