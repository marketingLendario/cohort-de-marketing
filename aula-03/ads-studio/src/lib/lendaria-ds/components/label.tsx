import type { LabelHTMLAttributes } from 'react';

/**
 * Label — porte fiel de `components/forms/Label.jsx`.
 * Label de campo de formulário (`al-field-label`).
 */
export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = '', children, ...props }: LabelProps) {
  return (
    <label className={`al-field-label ${className}`} {...props}>
      {children}
    </label>
  );
}
