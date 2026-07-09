import type { HTMLAttributes } from 'react';

/**
 * Card family — porte fiel de `components/core/Card.jsx` (bundle Lendár[IA]).
 * Card = fill `var(--card)` + hairline dourada; hierarquia por hairline +
 * tipografia, não por caixas. O estilo vive em `tokens/components.css`
 * (classes `al-card*`).
 */
export type DivProps = HTMLAttributes<HTMLDivElement>;
export type HeadingProps = HTMLAttributes<HTMLHeadingElement>;
export type ParagraphProps = HTMLAttributes<HTMLParagraphElement>;

export function Card({ className = '', children, ...props }: DivProps) {
  return (
    <div className={`al-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: DivProps) {
  return (
    <div className={`al-card__header ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }: HeadingProps) {
  return (
    <h3 className={`al-card__title ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }: ParagraphProps) {
  return (
    <p className={`al-card__description ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }: DivProps) {
  return (
    <div className={`al-card__content ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: DivProps) {
  return (
    <div className={`al-card__footer ${className}`} {...props}>
      {children}
    </div>
  );
}
