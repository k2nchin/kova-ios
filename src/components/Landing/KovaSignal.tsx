import React from 'react';

interface KovaSignalProps {
  size?: number;
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

/**
 * THE SIGNAL — the recurring Kova motif.
 * A warm luminous core with a subtle cyan inner detail and a restrained halo.
 * It represents presence: people, connection, discovery.
 */
export const KovaSignal: React.FC<KovaSignalProps> = ({ size = 10, pulse = true, className, style, label }) => (
  <span
    className={`relative inline-flex items-center justify-center shrink-0 ${className ?? ''}`}
    style={{ width: size, height: size, ...style }}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    {/* soft halo */}
    <span
      aria-hidden
      className={pulse ? 'kova-signal-breathe' : undefined}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: size * 4.2,
        height: size * 4.2,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(154,163,174,.28) 0%, rgba(154,163,174,.10) 42%, transparent 70%)',
        pointerEvents: 'none',
      }}
    />
    {/* presence ring (very subtle cyan) */}
    {pulse && (
      <span
        aria-hidden
        className="kova-signal-ring"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: size * 2.4,
          height: size * 2.4,
          marginLeft: -size * 1.2,
          marginTop: -size * 1.2,
          borderRadius: '50%',
          border: '1px solid rgba(112,215,208,.35)',
          pointerEvents: 'none',
        }}
      />
    )}
    {/* warm core */}
    <span
      aria-hidden
      style={{
        position: 'relative',
        width: Math.max(4, size * 0.58),
        height: Math.max(4, size * 0.58),
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 35% 30%, #F4F6F3 0%, #EDF1F5 42%, #9AA3AE 100%)',
        boxShadow: '0 0 8px rgba(201,209,218,.75)',
      }}
    />
    {/* cyan inner detail */}
    <span
      aria-hidden
      style={{
        position: 'absolute',
        width: Math.max(1.5, size * 0.14),
        height: Math.max(1.5, size * 0.14),
        right: size * 0.22,
        top: size * 0.24,
        borderRadius: '50%',
        background: 'var(--kova-signal, #70D7D0)',
        boxShadow: '0 0 5px rgba(112,215,208,.95)',
        opacity: 0.92,
      }}
    />
  </span>
);
