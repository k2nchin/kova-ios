import React, { useEffect, useRef, useState } from 'react';
import { Plus, Search, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { soundFx } from '../../utils/soundEffects';
import { api, uploadFile, type SpaceSound } from '../../services/apiClient';

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
  /** Voice room where the sound is played for everyone. */
  channelId: string;
  spaceId: string;
  canManage: boolean;
  /** Sends a short "played X" message to the voice room chat, mirroring the full modal behavior. */
  onPlayed?: (name: string, emoji: string) => void;
}

/** Compact in-room soundboard popover — reuses the shared soundFx engine
 *  and the same favorites persisted by the full Soundboard modal. */
export const VoiceSoundboardPanel: React.FC<VoiceSoundboardPanelProps> = ({ onClose, onPlayed, channelId, spaceId, canManage }) => {
  const [spaceSounds, setSpaceSounds] = useState<SpaceSound[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let alive = true;
    api.getSpaceSounds(spaceId).then((items) => { if (alive) setSpaceSounds(items); }).catch(() => undefined);
    return () => { alive = false; };
  }, [spaceId]);
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

  // Played through the server so everyone in the room hears it (you hear it via the same event).
  const playForRoom = async (data: { soundId?: string; builtin?: string }, name: string, emoji: string) => {
    soundFx.setMasterVolume(volume);
    try {
      await api.playRoomSound(channelId, data);
      onPlayed?.(name, emoji);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo reproducir el sonido.');
    }
  };
  const play = (sound: BuiltInSoundItem) => void playForRoom({ builtin: sound.type }, sound.name, sound.emoji);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) { toast.error('Elige un archivo de audio (mp3, ogg, wav).'); return; }
    if (file.size > 512 * 1024) { toast.error('El sonido debe pesar menos de 512 KB (unos 5 segundos).'); return; }
    setUploading(true);
    try {
      const url = await uploadFile(file, 'sound');
      const name = file.name.replace(/\.[^.]+$/, '').slice(0, 32) || 'Sonido';
      const created = await api.createSpaceSound(spaceId, { name, emoji: '🔊', url });
      setSpaceSounds((prev) => [...prev, created]);
      toast.success(`Sonido «${name}» añadido al espacio`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el sonido.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const remove = async (sound: SpaceSound) => {
    try { await api.deleteSpaceSound(sound.id); setSpaceSounds((prev) => prev.filter((item) => item.id !== sound.id)); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo borrar.'); }
  };
  const visibleSpace = spaceSounds.filter((sound) => !query.trim() || sound.name.toLowerCase().includes(query.trim().toLowerCase()));

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

      {(visibleSpace.length > 0 || canManage) && (
        <>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#646a76]">De este espacio</p>
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {visibleSpace.map((sound) => (
              <div key={sound.id} className="group relative">
                <button
                  type="button"
                  onClick={() => void playForRoom({ soundId: sound.id }, sound.name, sound.emoji)}
                  title={`Reproducir ${sound.name} para la sala`}
                  className="flex h-[64px] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-[#21ddb2]/20 bg-[#21ddb2]/[0.05] text-[10px] font-medium text-[#9a9faa] transition hover:border-[#21ddb2]/50 hover:text-[#f5f7fa] active:scale-[.94]"
                >
                  <span className="text-lg leading-none">{sound.emoji}</span>
                  <span className="max-w-full truncate px-1">{sound.name}</span>
                </button>
                {canManage && (
                  <button type="button" onClick={() => void remove(sound)} aria-label={`Borrar ${sound.name}`} className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-[#646a76] opacity-0 transition hover:text-[#ff6b6b] group-hover:opacity-100">
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
            {canManage && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="flex h-[64px] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-white/[0.15] text-[10px] font-medium text-[#9a9faa] transition hover:border-white/[0.3] hover:text-[#f5f7fa]"
              >
                <Plus size={16} />
                <span>{uploading ? 'Subiendo…' : 'Subir sonido'}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="audio/*" hidden onChange={(event) => void upload(event.target.files?.[0])} />
          </div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#646a76]">Kova</p>
        </>
      )}
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
