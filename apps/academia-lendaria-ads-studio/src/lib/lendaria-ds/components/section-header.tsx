import type { HTMLAttributes, ReactNode } from 'react';

/**
 * SectionHeader — porte fiel de `components/brand/SectionHeader.jsx`.
 * eyebrow + título grande + hairline esmaecendo à direita. O ritmo-assinatura
 * de toda seção de lista no app.
 */
export interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  eyebrow?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
}

export function SectionHeader({ eyebrow, title, action, className = '', ...props }: SectionHeaderProps) {
  return (
    <div className={`al-section-header ${className}`} {...props}>
      <div>
        {eyebrow && <p className="al-section-header__eyebrow">{eyebrow}</p>}
        <h2 className="al-section-header__title">{title}</h2>
      </div>
      <div className="al-hairline" />
      {action && <div className="al-section-header__action">{action}</div>}
    </div>
  );
}
