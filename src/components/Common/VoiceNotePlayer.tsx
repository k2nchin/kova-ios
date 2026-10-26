import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Pause, Play } from 'lucide-react';

const format = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const SPEEDS = [1, 1.5, 2];

/** Kova-styled voice note: play/pause, seekable bars and playback speed. */
export const VoiceNotePlayer: React.FC<{ url: string; duration?: number; seed: string }> = ({ url, duration = 0, seed }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration);
  const [speed, setSpeed] = useState(1);
  // Stable pseudo-waveform per message so it doesn't jump between renders.
  const bars = useMemo(() => {
    const out: number[] = [];
    let h = [...seed].reduce((n, c) => ((n * 31) ^ c.charCodeAt(0)) >>> 0, 7);
    for (let i = 0; i < 36; i += 1) {
      h = (h * 1103515245 + 12345) >>> 0;
      out.push(25 + (h % 75));
    }
    return out;
  }, [seed]);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = speed; }, [speed]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => undefined); else audio.pause();
  };
  const seek = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !total) return;
    const rect = event.currentTarget.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * total;
  };
  const progress = total ? current / total : 0;

  return (
    <div className="kvn">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => { const d = event.currentTarget.duration; if (Number.isFinite(d) && d > 0) setTotal(d); }}
      />
      <button type="button" className="kvn-play" onClick={toggle} aria-label={playing ? 'Pausar nota de voz' : 'Reproducir nota de voz'}>
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div className="kvn-wave" onClick={seek} role="slider" aria-label="Posición" aria-valuemin={0} aria-valuemax={Math.round(total)} aria-valuenow={Math.round(current)} tabIndex={0}>
        {bars.map((height, index) => <i key={index} style={{ height: `${height}%` }} className={index / bars.length < progress ? 'is-on' : ''} />)}
      </div>
      <span className="kvn-time">{format(playing || current ? current : total)}</span>
      <button type="button" className="kvn-speed" onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label="Velocidad">{speed}×</button>
      <Mic size={13} className="kvn-mic" aria-hidden="true" />
    </div>
  );
};
