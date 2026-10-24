import React, { useEffect, useRef, useState } from 'react';
import { Search, Star, X } from 'lucide-react';
import { soundFx } from '../../utils/soundEffects';

interface BuiltInSoundItem {
  id: string;
  type: 'laser' | 'victory' | 'cyberhorn' | 'arcade' | 'airhorn' | 'quack' | 'applause' | 'badumtss' | 'kova_ping' | 'bruh';
  name: string;
  emoji: string;
}

// Same catalog as the full Soundboard modal — shared source of truth.
const builtInSounds: BuiltInSoundItem[] = [
  { id: 'airhorn', type: 'airhorn', name: 'Airhorn', emoji: '🎺' },
  { id: 'quack', type: 'quack', name: 'Pato Quack', emoji: '🦆' },
  { id: 'badumtss', type: 'badumtss', name: 'Ba-Dum-Tss', emoji: '🥁' },
  { id: 'victory', type: 'victory', name: 'Victoria GG', emoji: '🏆' },
  { id: 'applause', type: 'applause', name: 'Aplausos', emoji: '👏' },
  { id: 'kova_ping', type: 'kova_ping', name: 'Kova Ping', emoji: '🔔' },
  { id: 'bruh', type: 'bruh', name: 'Bruh', emoji: '🗿' },
  { id: 'laser', type: 'laser', name: 'Cyber Laser', emoji: '⚡' },
  { id: 'arcade', type: 'arcade', name: 'Power Up 8-Bit', emoji: '👾' },
  { id: 'cyberhorn', type: 'cyberhorn', name: 'Bocina Nave', emoji: '🚢' },
];

const FAVORITES_KEY = 'kova.soundboard.favorites';

interface VoiceSoundboardPanelProps {
  onClose: () => void;
  /** Sends a short "played X" message to the voice room chat, mirroring the full modal behavior. */
  onPlayed?: (name: string, emoji: string) => void;
}

/** Compact in-room soundboard popover — reuses the shared soundFx engine
 *  and the same favorites persisted by the full Soundboard modal. */
export const VoiceSoundboardPanel: React.FC<VoiceSoundboardPanelProps> = ({ onClose, onPlayed }) => {
  const [query, setQuery] = useState('');
  const [volume, setVolume] = useState(0.8);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable — favorites just live for this session.
      }
      return next;
    });
  };

  const play = (sound: BuiltInSoundItem) => {
    soundFx.setMasterVolume(volume);
    soundFx.playSoundboardFx(sound.type);
    onPlayed?.(sound.name, sound.emoji);
  };

  const normalized = query.trim().toLowerCase();
  const visible = builtInSounds.filter((sound) => !normalized || sound.name.toLowerCase().includes(normalized));
  const favoritesFirst = [...visible].sort((a, b) => Number(favoriteIds.includes(b.id)) - Number(favoriteIds.includes(a.id)));

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Sonidos de la sala"
      className="absolute bottom-[96px] left-1/2 z-40 w-[min(420px,calc(100vw-40px))] -translate-x-1/2 overflow-hidden rounded-[22px] border border-white/[0.08] bg-[rgba(16,16,20,.9)] p-4 shadow-[0_18px_60px_rgba(0,0,0,.5)] backdrop-blur-[20px] select-none"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-[#f5f7fa]">Sonidos</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar sonidos"
          className="rounded-lg p-1 text-[#646a76] transition hover:bg-white/[0.06] hover:text-[#f5f7fa]"
        >
          <X size={14} />
        </button>
      </div>

      <label className="mb-3 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-black/30 px-3 py-2">
        <Search size={13} className="shrink-0 text-[#646a76]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar sonido…"
          aria-label="Buscar sonido"
          className="w-full bg-transparent text-xs text-[#f5f7fa] outline-none placeholder:text-[#646a76]"
        />
      </label>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {favoritesFirst.map((sound) => (
          <div key={sound.id} className="group relative">
            <button
              type="button"
              onClick={() => play(sound)}
              title={`Reproducir ${sound.name}`}
              aria-label={`Reproducir ${sound.name}`}
              className="flex h-[64px] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] text-[10px] font-medium text-[#9a9faa] transition hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-[#f5f7fa] active:scale-[.94]"
            >
              <span className="text-lg leading-none">{sound.emoji}</span>
              <span className="max-w-full truncate px-1">{sound.name}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(sound.id)}
              aria-label={favoriteIds.includes(sound.id) ? `Quitar ${sound.name} de favoritos` : `Añadir ${sound.name} a favoritos`}
              title={favoriteIds.includes(sound.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              className={`absolute right-1.5 top-1.5 rounded-full p-0.5 transition ${favoriteIds.includes(sound.id) ? 'text-[#ff2f78]' : 'text-[#646a76] opacity-0 group-hover:opacity-100'}`}
            >
              <Star size={11} fill={favoriteIds.includes(sound.id) ? '#ff2f78' : 'none'} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <label htmlFor="voice-sb-volume" className="text-[10px] font-medium uppercase tracking-wide text-[#646a76]">
          Volumen
        </label>
        <input
          id="voice-sb-volume"
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="h-1 w-32 accent-[#21ddb2]"
          aria-label="Volumen del soundboard"
        />
      </div>
    </div>
  );
};
