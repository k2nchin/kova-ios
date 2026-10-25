import React from 'react';

/** Check mark shown next to verified accounts and spaces (decided by the server). */
export const VerifiedBadge: React.FC<{ size?: number; label?: string }> = ({ size = 15, label = 'Verificado' }) => (
  <svg
    className="kova-verified"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    role="img"
    aria-label={label}
    style={{ flexShrink: 0, display: 'inline-block', verticalAlign: '-2px' }}
  >
    <title>{label}</title>
    <path
      fill="#f4f5f7"
      d="M12 1.5l2.6 2 3.3-.3 1 3.1 2.8 1.8-1 3.1 1 3.1-2.8 1.8-1 3.1-3.3-.3-2.6 2-2.6-2-3.3.3-1-3.1-2.8-1.8 1-3.1-1-3.1 2.8-1.8 1-3.1 3.3.3z"
    />
    <path fill="none" stroke="#0a0a0b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M7.8 12.3l2.8 2.8 5.6-5.8" />
  </svg>
);
