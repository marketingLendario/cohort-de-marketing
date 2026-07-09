import type { CSSProperties, HTMLAttributes } from 'react';

/**
 * Avatar — porte fiel de `components/display/Avatar.jsx`.
 * Imagem ou fallback de iniciais.
 */
const avatarSizes: Record<string, number> = { sm: 32, default: 40, lg: 56, xl: 80 };

export type AvatarSize = keyof typeof avatarSizes | number;

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  name?: string;
  size?: AvatarSize;
}

export function Avatar({ src, name = '', size = 'default', className = '', style = {}, ...props }: AvatarProps) {
  const px = typeof size === 'number' ? size : avatarSizes[size] ?? 40;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const merged: CSSProperties = { width: px, height: px, fontSize: px * 0.38, ...style };
  return (
    <span className={`al-avatar ${className}`} style={merged} {...props}>
      {src ? <img src={src} alt={name} loading="lazy" decoding="async" /> : <span>{initials || '•'}</span>}
    </span>
  );
}
