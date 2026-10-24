import React from 'react';
import { AtSign, Hash, Mic, Sparkles, Volume2 } from 'lucide-react';
import './chrome.css';

// Kova's signature backdrop: a perspective grid room lit by a silver beam.
// Place it inside a positioned element that has the `kl-root` class.
/** Floating glyphs of a chat app drifting through the hero room. */
const glyphs = [
  { Icon: Hash, x: '12%', y: '30%', size: 30, delay: 0 },
  { Icon: AtSign, x: '82%', y: '26%', size: 26, delay: 1.2 },
  { Icon: Volume2, x: '76%', y: '64%', size: 30, delay: 0.6 },
  { Icon: Mic, x: '8%', y: '80%', size: 24, delay: 1.8 },
  { Icon: Sparkles, x: '62%', y: '14%', size: 20, delay: 2.4 },
];

export function ChromeRoom() {
  return (
    <div className="kl-room" aria-hidden="true">
      <div className="kl-room-grid kl-room-floor" />
      <div className="kl-room-grid kl-room-ceiling" />
      <div className="kl-beam" />
      <div className="kl-dust" />
      {glyphs.map(({ Icon, x, y, size, delay }) => (
        <span key={`${x}${y}`} className="kl-glyph" style={{ left: x, top: y, animationDelay: `${delay}s` }}>
          <Icon width={size} height={size} strokeWidth={1.2} />
        </span>
      ))}
    </div>
  );
}

