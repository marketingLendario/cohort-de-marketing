import type { HTMLAttributes } from 'react';

/**
 * Alert inline — porte fiel de `components/display/Alert.jsx`.
 * Borda tingida + fundo tingido a 5%, texto leve. O estilo vive em
 * `tokens/components.css` (classes `al-alert*`).
 */
export type AlertVariant = 'info' | 'success' | 'warning' | 'destructive';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export function Alert({ variant = 'info', className = '', children, ...props }: AlertProps) {
  return (
    <div className={`al-alert al-alert--${variant} ${className}`} role="alert" {...props}>
      {children}
    </div>
  );
}
