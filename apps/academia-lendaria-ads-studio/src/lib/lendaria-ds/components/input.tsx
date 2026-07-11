import type { InputHTMLAttributes } from 'react';

/**
 * Input — porte fiel de `components/forms/Input.jsx`.
 * Texto de valor semibold; estilo em `tokens/components.css` (`al-input`).
 */
export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = '', ...props }: InputProps) {
  return <input className={`al-input ${className}`} {...props} />;
}
