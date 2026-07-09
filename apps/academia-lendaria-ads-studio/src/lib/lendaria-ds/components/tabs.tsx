import { useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';

/**
 * Tabs — porte fiel de `components/display/Tabs.jsx`.
 * Sublinhado editorial: lista sobre hairline, ativo ganha régua dourada.
 * Segue o padrão WAI-ARIA Tabs com ativação automática: roving tabindex,
 * ArrowLeft/ArrowRight com wrap-around, Home/End nas bordas.
 */
export interface TabItem {
  value: string;
  label: ReactNode;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items?: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  items = [],
  value,
  defaultValue,
  onValueChange,
  className = '',
  ...props
}: TabsProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultValue ?? items[0]?.value);
  const active = value !== undefined ? value : internal;
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };

  const focusAndSelect = (index: number) => {
    const item = items[index];
    if (!item) return;
    select(item.value);
    triggerRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let target: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
        target = (index + 1) % items.length;
        break;
      case 'ArrowLeft':
        target = (index - 1 + items.length) % items.length;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    focusAndSelect(target);
  };

  return (
    <div className={`al-tabs__list ${className}`} role="tablist" {...props}>
      {items.map((item, index) => {
        const isActive = active === item.value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              triggerRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            data-active={isActive ? 'true' : 'false'}
            className="al-tabs__trigger"
            onClick={() => select(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
