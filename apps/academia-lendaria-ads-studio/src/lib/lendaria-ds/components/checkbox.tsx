import { useState } from 'react';
import type { ButtonHTMLAttributes } from 'react';

/**
 * Checkbox — porte fiel de `components/forms/Checkbox.jsx`.
 * Fill dourado + check escuro quando marcado.
 */
export interface CheckboxProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({
  checked,
  defaultChecked = false,
  onCheckedChange,
  className = '',
  ...props
}: CheckboxProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const isOn = checked !== undefined ? checked : internal;
  const toggle = () => {
    const next = !isOn;
    if (checked === undefined) setInternal(next);
    onCheckedChange?.(next);
  };
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isOn}
      data-checked={isOn ? 'true' : 'false'}
      className={`al-checkbox ${className}`}
      onClick={toggle}
      {...props}
    >
      {isOn && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path
            d="M1.5 5.5L4 8L8.5 2.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
