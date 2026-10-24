import React from 'react';

/**
 * Kova Voice Presence — ambient audio visualization.
 * Three concentric rings breathe imperceptibly when the room is silent and
 * respond to the real room audio level (--voice-audio, written by the audio
 * rAF loop without React renders). GPU-friendly transforms only; no canvas.
 */
export const KovaVoicePulse: React.FC = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
    <div className="relative h-[min(78vh,680px)] w-[min(78vw,680px)]">
      {[
        { inset: '0%', delay: '0s' },
        { inset: '11%', delay: '-1.1s' },
        { inset: '22%', delay: '-2.2s' },
      ].map((ring, index) => (
        <span
          key={index}
          className="voice-pulse-breathe absolute"
          style={{ inset: ring.inset, animationDelay: ring.delay }}
        >
          <span className="voice-pulse-ring" />
        </span>
      ))}
    </div>
  </div>
);
