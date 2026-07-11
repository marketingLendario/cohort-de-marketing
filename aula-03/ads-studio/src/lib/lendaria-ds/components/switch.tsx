import { useState } from 'react';
import type { ButtonHTMLAttributes } from 'react';

/**
 * Switch — porte fiel de `components/forms/Switch.jsx`.
 * Ouro quando ligado. Controlado (checked/onCheckedChange) ou não-controlado.
 */
export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  className = '',
  ...props
}: SwitchProps) {
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
      role="switch"
      aria-checked={isOn}
      data-checked={isOn ? 'true' : 'false'}
      className={`al-switch ${className}`}
      onClick={toggle}
      {...props}
    >
      <span className="al-switch__thumb" />
    </button>
  );
}
