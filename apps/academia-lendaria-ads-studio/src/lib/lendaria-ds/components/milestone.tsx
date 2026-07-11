import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Milestone — porte fiel de `components/brand/Milestone.jsx`.
 * Realce editorial para um único momento de conquista: losango, eyebrow,
 * título e régua dourada. Só ouro, sem brilho/loop. Para selos, certificações
 * e aprovações.
 */
export interface MilestoneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: ReactNode;
  title: ReactNode;
  note?: ReactNode;
  mark?: boolean;
  align?: 'center' | 'start';
}

export function Milestone({
  eyebrow,
  title,
  note,
  mark = true,
  align = 'center',
  className = '',
  ...props
}: MilestoneProps) {
  const cls = `al-milestone${align === 'start' ? ' al-milestone--start' : ''}${className ? ' ' + className : ''}`;
  return (
    <div className={cls} {...props}>
      {mark && <span className="al-milestone__mark" aria-hidden="true" />}
      {eyebrow && <p className="al-milestone__eyebrow">{eyebrow}</p>}
      <h2 className="al-milestone__title">{title}</h2>
      <div className="al-milestone__rule" aria-hidden="true" />
      {note && <p className="al-milestone__note">{note}</p>}
    </div>
  );
}
