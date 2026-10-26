import React, { useState } from 'react';
import { resolveMediaUrl } from '../../services/apiClient';

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?';

/**
 * Profile picture with a chrome monogram fallback when the user has no photo
 * or the image fails to load (new accounts start without one).
 */
export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 40, className = '', onClick }) => {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) };
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick, 'aria-label': `Perfil de ${name}` } : {})}
      className={`kova-avatar ${showImage ? '' : 'kova-avatar-monogram'} ${className}`}
      style={style}
    >
      {showImage ? <img src={resolveMediaUrl(src)} alt="" loading="lazy" onError={() => setFailed(true)} /> : <span aria-hidden="true">{initialsOf(name)}</span>}
    </Tag>
  );
};
