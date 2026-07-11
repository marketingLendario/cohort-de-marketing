import type { CSSProperties, HTMLAttributes } from 'react';

/**
 * BookCard — porte fiel de `components/brand/BookCard.jsx`.
 * Item de estante editorial — sem caixa: capa que sobe levemente no hover
 * (sombra funda, sem aura), título serif, autor serif itálico, status em mono.
 */

/* Glyph iconoir inline (evita import cross-directory). */
function BkIcon({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  const style: CSSProperties = {
    fontSize: size,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color,
  };
  return <i className={`iconoir-${name}`} aria-hidden="true" style={style} />;
}

/* Gradiente determinístico por slug — espelha getSimpleGradient do app. */
const gradients: Array<[string, string]> = [
  ['#3f2d23', '#1d1410'],
  ['#23303f', '#10161d'],
  ['#2d233f', '#14101d'],
  ['#233f2d', '#101d14'],
  ['#3f2338', '#1d1018'],
  ['#3f3923', '#1d1a10'],
];
function pickGradient(seed = ''): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return gradients[h % gradients.length]!;
}

export type BookStatus = 'read' | 'reading';

export interface BookCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  author: string;
  category?: string;
  coverUrl?: string;
  status?: BookStatus;
  bookmarked?: boolean;
}

export function BookCard({
  title,
  author,
  category = 'Livro',
  coverUrl,
  status,
  bookmarked = false,
  onClick,
  className = '',
  ...props
}: BookCardProps) {
  const [g1, g2] = pickGradient(title);
  const statusConfig = status
    ? {
        read: { label: 'LIDO', icon: 'check', cls: 'al-bookcard__status--read' },
        reading: { label: 'LENDO', icon: 'book', cls: 'al-bookcard__status--reading' },
      }[status]
    : undefined;

  return (
    <div className={`al-bookcard ${className}`} onClick={onClick} {...props}>
      <div className="al-bookcard__topbar">
        <span>
          {statusConfig && (
            <span className={`al-bookcard__status ${statusConfig.cls}`}>
              <BkIcon name={statusConfig.icon} size={12} />
              {statusConfig.label}
            </span>
          )}
        </span>
        <button className="al-bookcard__fav" aria-label="Favoritar">
          <BkIcon name="star" size={14} color={bookmarked ? 'var(--primary)' : undefined} />
        </button>
      </div>
      <div className="al-bookcard__stage">
        <div className="al-bookcard__aura" />
        <div className="al-bookcard__cover">
          {coverUrl ? (
            <img src={coverUrl} alt={title} loading="lazy" decoding="async" />
          ) : (
            <div className="al-bookcard__fallback" style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
              <BkIcon name="book" size={16} color="rgba(255,255,255,0.5)" />
              <span>{title}</span>
            </div>
          )}
          <div className="al-bookcard__spine" />
        </div>
        <div className="al-bookcard__shadow" />
      </div>
      <div className="al-bookcard__info">
        <p className="al-bookcard__category">{category}</p>
        <h4 className="al-bookcard__title">{title}</h4>
        <p className="al-bookcard__author">{author}</p>
      </div>
    </div>
  );
}
