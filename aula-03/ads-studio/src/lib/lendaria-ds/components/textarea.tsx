import type { TextareaHTMLAttributes } from 'react';

/**
 * Textarea — porte fiel de `components/forms/Textarea.jsx`.
 * Multiline compartilhando a receita do Input (`al-input`).
 */
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className = '', rows = 4, ...props }: TextareaProps) {
  return <textarea className={`al-input ${className}`} rows={rows} {...props} />;
}
