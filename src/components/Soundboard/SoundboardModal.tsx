import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  Plus,
  Trash2,
  Play,
  Pause,
  Upload,
  Search,
  Square,
  ArrowLeft,
  Star,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { soundFx } from '../../utils/soundEffects';
import { useApp } from '../../context/AppContext';

export interface CustomSoundItem {
  id: string;
  name: string;
  emoji: string;
  audioData: string; // Base64 data URL
  duration?: number;
  serverId?: string;
  serverName?: string;
  createdAt: number;
}

interface BuiltInSoundItem {
  id: string;
  type: 'laser' | 'victory' | 'cyberhorn' | 'arcade' | 'airhorn' | 'quack' | 'applause' | 'badumtss' | 'kova_ping' | 'bruh';
  name: string;
  emoji: string;
}

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

const EMOJI_PRESETS = ['🔊', '🥺', '😠', '😸', '😈', '😐', '😆', '😂', '👹', '🐷', '😡', '❤️', '🥸', '✔️', '👱', '🌪️', '🤣', '💃', '🐢', '🎺', '🦆', '🥁', '👏', '🔔', '🗿', '⚡', '👾', '🚢'];

const STORAGE_KEY = 'kova.custom_sounds.v2';
const FAVORITES_KEY = 'kova.soundboard.favorites';
const RECENT_KEY = 'kova.soundboard.recent';

export const SoundboardModal: React.FC = () => {
  const { isSoundboardOpen, setIsSoundboardOpen, sendMessage, activeServer } = useApp();

  const [customSounds, setCustomSounds] = useState<CustomSoundItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : ['airhorn'];
    } catch {
      return ['airhorn'];
    }
  });

  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      return stored ? JSON.parse(stored) : ['quack', 'badumtss'];
    } catch {
      return ['quack', 'badumtss'];
    }
  });

  const [isAddingSound, setIsAddingSound] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    favs: false,
    recent: false,
    server: false,
    defaults: false,
  });

  const [soundName, setSoundName] = useState('');
  const [soundEmoji, setSoundEmoji] = useState('🔊');
  const [audioData, setAudioData] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleSection = (sec: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleStopSound = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setActivePlayingId(null);
  }, []);

  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }
    setIsPreviewPlaying(false);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customSounds));
    } catch {}
  }, [customSounds]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
    } catch {}
  }, [favoriteIds]);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds));
    } catch {}
  }, [recentIds]);

  useEffect(() => {
    if (!isSoundboardOpen) {
      handleStopSound();
      stopPreview();
      setIsAddingSound(false);
      setErrorMessage('');
      setShowVolumeSlider(false);
    }
  }, [isSoundboardOpen, handleStopSound, stopPreview]);

  const recordRecent = (id: string) => {
    setRecentIds((prev) => [id, ...prev.filter((item) => item !== id)].slice(0, 6));
  };

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePlayBuiltInSound = (sound: BuiltInSoundItem) => {
    if (isMuted) return;
    handleStopSound();
    setActivePlayingId(sound.id);
    recordRecent(sound.id);

    soundFx.playSoundboardFx(sound.type);
    sendMessage(`${sound.emoji} Reprodujo un sonido del Soundboard: **${sound.name}**`);

    setTimeout(() => {
      setActivePlayingId((prev) => (prev === sound.id ? null : prev));
    }, 1200);
  };

  const handlePlayCustomSound = (sound: CustomSoundItem) => {
    if (isMuted) return;
    handleStopSound();
    setActivePlayingId(sound.id);
    recordRecent(sound.id);

    try {
      const audio = new Audio(sound.audioData);
      currentAudioRef.current = audio;
      audio.volume = isMuted ? 0 : volume;

      audio.onended = () => {
        setActivePlayingId(null);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setActivePlayingId(null);
        currentAudioRef.current = null;
      };

      audio.play().catch(() => {
        setActivePlayingId(null);
      });

      sendMessage(`${sound.emoji} Reprodujo un sonido del Soundboard: **${sound.name}**`);
    } catch {
      setActivePlayingId(null);
    }
  };

  const handlePlayAny = (id: string) => {
    const builtIn = builtInSounds.find((s) => s.id === id);
    if (builtIn) {
      handlePlayBuiltInSound(builtIn);
      return;
    }
    const custom = customSounds.find((s) => s.id === id);
    if (custom) {
      handlePlayCustomSound(custom);
    }
  };

  const getSoundById = (id: string): { id: string; name: string; emoji: string; isCustom: boolean; customObj?: CustomSoundItem } | null => {
    const b = builtInSounds.find((s) => s.id === id);
    if (b) return { id: b.id, name: b.name, emoji: b.emoji, isCustom: false };
    const c = customSounds.find((s) => s.id === id);
    if (c) return { id: c.id, name: c.name, emoji: c.emoji, isCustom: true, customObj: c };
    return null;
  };

  const handleDeleteCustomSound = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePlayingId === id) {
      handleStopSound();
    }
    setCustomSounds((prev) => prev.filter((s) => s.id !== id));
    setFavoriteIds((prev) => prev.filter((item) => item !== id));
    setRecentIds((prev) => prev.filter((item) => item !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('El archivo no debe superar los 5 MB.');
      return;
    }

    setErrorMessage('');
    setAudioFileName(file.name);
    if (!soundName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 30);
      setSoundName(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAudioData(result);

      const tempAudio = new Audio(result);
      tempAudio.addEventListener('loadedmetadata', () => {
        setAudioDuration(tempAudio.duration);
      });
    };
    reader.readAsDataURL(file);
  };

  const togglePreview = () => {
    if (!audioData) return;

    if (isPreviewPlaying) {
      stopPreview();
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(audioData);
      previewAudioRef.current = audio;
      setIsPreviewPlaying(true);

      audio.onended = () => setIsPreviewPlaying(false);
      audio.onerror = () => setIsPreviewPlaying(false);
      audio.play().catch(() => setIsPreviewPlaying(false));
    }
  };

  const handleSaveCustomSound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!soundName.trim()) {
      setErrorMessage('Por favor introduce un nombre para el sonido.');
      return;
    }
    if (!audioData) {
      setErrorMessage('Por favor sube un archivo de audio (.mp3, .wav, .ogg).');
      return;
    }

    stopPreview();

    const newSound: CustomSoundItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: soundName.trim(),
      emoji: soundEmoji || '🔊',
      audioData,
      duration: audioDuration > 0 ? Math.round(audioDuration * 10) / 10 : undefined,
      serverId: activeServer?.id,
      serverName: activeServer?.name,
      createdAt: Date.now(),
    };

    setCustomSounds((prev) => [newSound, ...prev]);

    setSoundName('');
    setSoundEmoji('🔊');
    setAudioData(null);
    setAudioFileName('');
    setAudioDuration(0);
    setIsAddingSound(false);
    setErrorMessage('');
  };

  const query = searchQuery.toLowerCase().trim();
  const filterMatch = (name: string) => name.toLowerCase().includes(query);

  const filteredBuiltIn = builtInSounds.filter((s) => filterMatch(s.name));
  const filteredCustom = customSounds.filter((s) => filterMatch(s.name));

  const favoritesList = favoriteIds.map(getSoundById).filter((s): s is NonNullable<typeof s> => s !== null && filterMatch(s.name));
  const recentList = recentIds.map(getSoundById).filter((s): s is NonNullable<typeof s> => s !== null && filterMatch(s.name));

  if (!isSoundboardOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => {
        handleStopSound();
        setIsSoundboardOpen(false);
      }}
    >
      <div
        className="w-full max-w-[480px] h-[580px] rounded-3xl bg-[#0d071c] border border-purple-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(147,51,234,0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-purple-100 relative backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search & Volume Bar */}
        <div className="p-3 pb-2.5 flex items-center gap-2 border-b border-purple-950/40 bg-[#0d071c] shrink-0">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Encuentra el sonido perfecto"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#06020e] border border-purple-950/50 focus:border-purple-500 text-white text-xs placeholder:text-purple-400/40 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400/70 hover:text-white cursor-pointer text-xs"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVolumeSlider((v) => !v)}
              className="p-2 rounded-xl hover:bg-purple-900/30 text-purple-300/70 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-purple-500/20"
              title="Volumen del Soundboard"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {showVolumeSlider && (
              <div className="absolute right-0 top-11 z-30 p-3 rounded-2xl bg-[#0d071c] border border-purple-500/30 shadow-2xl w-44 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xl">
                <div className="flex items-center justify-between text-[11px] text-purple-300 font-medium">
                  <span>Volumen</span>
                  <span>{isMuted ? '0%' : `${Math.round(volume * 100)}%`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setIsMuted(false);
                    setVolume(parseFloat(e.target.value));
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  className="text-[11px] text-purple-400 hover:text-purple-300 text-left cursor-pointer transition-colors"
                >
                  {isMuted ? 'Desilenciar' : 'Silenciar soundboard'}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              handleStopSound();
              setIsSoundboardOpen(false);
            }}
            className="p-2 rounded-xl hover:bg-purple-900/30 text-purple-400/70 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-purple-500/20"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Body: Left Mini-Sidebar + Sound Grid Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left mini sidebar for fast section jumping */}
          <div className="w-12 bg-[#080312] border-r border-purple-950/40 flex flex-col items-center py-3 gap-3 shrink-0 select-none">
            <button
              type="button"
              onClick={() => {
                document.getElementById('sb-section-favs')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-8 h-8 rounded-xl hover:bg-purple-900/30 flex items-center justify-center text-purple-400/70 hover:text-purple-200 transition-colors cursor-pointer"
              title="Favoritos"
            >
              <Star size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                document.getElementById('sb-section-recent')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-8 h-8 rounded-xl hover:bg-purple-900/30 flex items-center justify-center text-purple-400/70 hover:text-purple-200 transition-colors cursor-pointer"
              title="Usados frecuentemente"
            >
              <Clock size={16} />
            </button>

            <div className="w-6 h-[1px] bg-purple-950/40" />

            <button
              type="button"
              onClick={() => {
                document.getElementById('sb-section-server')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-8 h-8 rounded-xl bg-purple-950/40 hover:bg-purple-600 border border-purple-900/40 flex items-center justify-center text-xs font-bold text-white transition-all cursor-pointer shadow"
              title={activeServer.name}
            >
              {activeServer.name.slice(0, 2).toUpperCase()}
            </button>

            <button
              type="button"
              onClick={() => {
                document.getElementById('sb-section-defaults')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-8 h-8 rounded-xl hover:bg-purple-900/30 flex items-center justify-center text-purple-400 transition-colors cursor-pointer"
              title="Efectos Oficiales Kova"
            >
              <Sparkles size={16} />
            </button>
          </div>

          {/* Content Area: Custom Sound Form OR Sound List */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0416]">
            {isAddingSound ? (
              <form onSubmit={handleSaveCustomSound} className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex items-center justify-between pb-2 border-b border-purple-950/40">
                  <button
                    type="button"
                    onClick={() => {
                      stopPreview();
                      setIsAddingSound(false);
                      setErrorMessage('');
                    }}
                    className="text-xs text-purple-300/70 hover:text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Volver</span>
                  </button>
                  <span className="text-xs font-bold text-white font-['Outfit']">Subir sonido al servidor</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200">Archivo de audio (.mp3, .wav, .ogg)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {!audioData ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-800/40 hover:border-purple-500/60 rounded-xl p-5 text-center cursor-pointer transition-all bg-[#0d071c]/50 hover:bg-[#0d071c]"
                    >
                      <Upload size={22} className="mx-auto text-purple-400 mb-1.5" />
                      <p className="text-xs font-semibold text-white">Seleccionar archivo de audio</p>
                      <p className="text-[10px] text-purple-400/50 mt-0.5">Hasta 5 segundos / 5 MB</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#0d071c] border border-purple-950/50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={togglePreview}
                          className="p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/30 cursor-pointer"
                          title={isPreviewPlaying ? 'Pausar' : 'Probar'}
                        >
                          {isPreviewPlaying ? <Pause size={13} /> : <Play size={13} />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{audioFileName}</p>
                          <p className="text-[10px] text-purple-400/60 font-mono">
                            {audioDuration > 0 ? `${audioDuration.toFixed(1)}s` : 'Audio listo'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          stopPreview();
                          setAudioData(null);
                          setAudioFileName('');
                          setAudioDuration(0);
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer px-2 py-1"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200">Nombre del sonido</label>
                  <input
                    type="text"
                    value={soundName}
                    onChange={(e) => setSoundName(e.target.value.slice(0, 30))}
                    placeholder="Ej. Descansa Gang, adio, mmg..."
                    className="w-full px-3 py-2 rounded-lg bg-[#0d071c] border border-purple-950/50 text-white text-xs placeholder:text-purple-400/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                    maxLength={30}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-purple-200">Emoji relacionado</label>
                  <div className="flex items-center gap-2 mb-1.5">
                    <input
                      type="text"
                      value={soundEmoji}
                      onChange={(e) => setSoundEmoji(e.target.value)}
                      className="w-10 h-9 text-center text-lg rounded-lg bg-[#0d071c] border border-purple-950/50 text-white"
                      maxLength={4}
                    />
                    <span className="text-[11px] text-purple-400/60">Elige o escribe el emoji</span>
                  </div>
                  <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-[#0d071c] border border-purple-950/50 max-h-20 overflow-y-auto custom-scrollbar">
                    {EMOJI_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSoundEmoji(emoji)}
                        className={`w-7 h-7 rounded flex items-center justify-center text-sm hover:bg-purple-900/40 cursor-pointer transition-colors ${
                          soundEmoji === emoji ? 'bg-purple-600/40 ring-1 ring-purple-500 text-white' : 'text-slate-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    {errorMessage}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-purple-950/40">
                  <button
                    type="button"
                    onClick={() => {
                      stopPreview();
                      setIsAddingSound(false);
                      setErrorMessage('');
                    }}
                    className="px-3.5 py-1.5 rounded-md text-xs text-purple-400/60 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!audioData || !soundName.trim()}
                    className="px-4 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    Subir
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {/* 1. FAVORITOS */}
                <div id="sb-section-favs" className="space-y-1.5">
                  <div
                    onClick={() => toggleSection('favs')}
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#949ba4] cursor-pointer hover:text-[#dbdee1] select-none"
                  >
                    <Star size={12} className="text-[#e99b24] fill-[#e99b24]" />
                    <span>Favoritos</span>
                    {collapsedSections.favs ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  </div>

                  {!collapsedSections.favs && (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      {favoritesList.length === 0 ? (
                        <p className="text-[11px] text-purple-400/50 col-span-2 px-1">No tienes sonidos favoritos aún.</p>
                      ) : (
                        favoritesList.map((snd) => {
                          const isPlaying = activePlayingId === snd.id;
                          return (
                            <button
                              key={`fav_${snd.id}`}
                              type="button"
                              onClick={() => handlePlayAny(snd.id)}
                              className={`h-11 px-3 rounded-xl bg-[#06020e] hover:bg-purple-950/40 border border-purple-950/50 transition-all flex items-center justify-between gap-2 text-left cursor-pointer group ${
                                isPlaying ? 'ring-1 ring-purple-500 bg-purple-900/30' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0">{snd.emoji}</span>
                                <span className="text-xs font-semibold text-purple-200 truncate group-hover:text-white">
                                  {snd.name}
                                </span>
                              </div>
                              <span title="Quitar de favoritos" className="inline-flex">
                                <Star
                                  size={12}
                                  onClick={(e) => toggleFavorite(snd.id, e)}
                                  className="text-amber-400 fill-amber-400 shrink-0 hover:scale-110 transition-transform cursor-pointer"
                                />
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* 2. USADOS FRECUENTEMENTE */}
                <div id="sb-section-recent" className="space-y-1.5 pt-1">
                  <div
                    onClick={() => toggleSection('recent')}
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-400/80 cursor-pointer hover:text-purple-200 select-none font-mono"
                  >
                    <Clock size={12} />
                    <span>Usados frecuentemente</span>
                    {collapsedSections.recent ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  </div>

                  {!collapsedSections.recent && (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      {recentList.map((snd) => {
                        const isPlaying = activePlayingId === snd.id;
                        return (
                          <button
                            key={`rec_${snd.id}`}
                            type="button"
                            onClick={() => handlePlayAny(snd.id)}
                            className={`h-11 px-3 rounded-xl bg-[#06020e] hover:bg-purple-950/40 border border-purple-950/50 transition-all flex items-center justify-between gap-2 text-left cursor-pointer group ${
                              isPlaying ? 'ring-1 ring-purple-500 bg-purple-900/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{snd.emoji}</span>
                              <span className="text-xs font-semibold text-purple-200 truncate group-hover:text-white">
                                {snd.name}
                              </span>
                            </div>
                            <Star
                              size={12}
                              onClick={(e) => toggleFavorite(snd.id, e)}
                              className={`shrink-0 transition-colors ${
                                favoriteIds.includes(snd.id)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-transparent group-hover:text-purple-400/40 hover:text-purple-200'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. SERVER SOUNDS */}
                <div id="sb-section-server" className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between select-none">
                    <div
                      onClick={() => toggleSection('server')}
                      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-400/80 cursor-pointer hover:text-purple-200 font-mono"
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="truncate">{activeServer.name}</span>
                      <span className="text-[10px] text-purple-400/50 font-normal">({filteredCustom.length})</span>
                      {collapsedSections.server ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingSound(true)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                    >
                      <Plus size={12} />
                      <span>Añadir sonido</span>
                    </button>
                  </div>

                  {!collapsedSections.server && (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      {filteredCustom.length === 0 ? (
                        <div
                          onClick={() => setIsAddingSound(true)}
                          className="col-span-2 p-3.5 rounded-xl border border-dashed border-purple-900/40 hover:border-purple-500/50 bg-purple-950/20 hover:bg-purple-950/40 text-center cursor-pointer transition-all"
                        >
                          <p className="text-xs font-semibold text-purple-200">+ Añadir un sonido a este servidor</p>
                          <p className="text-[10px] text-purple-400/60 mt-0.5">Sube memes y audios para tus canales de voz</p>
                        </div>
                      ) : (
                        filteredCustom.map((snd) => {
                          const isPlaying = activePlayingId === snd.id;
                          return (
                            <div
                              key={`srv_${snd.id}`}
                              onClick={() => handlePlayCustomSound(snd)}
                              className={`h-11 px-3 rounded-xl bg-[#06020e] hover:bg-purple-950/40 border border-purple-950/50 transition-all flex items-center justify-between gap-2 text-left cursor-pointer group relative ${
                                isPlaying ? 'ring-1 ring-purple-500 bg-purple-900/30' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0">{snd.emoji}</span>
                                <span className="text-xs font-semibold text-purple-200 truncate group-hover:text-white">
                                  {snd.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <Star
                                  size={12}
                                  onClick={(e) => toggleFavorite(snd.id, e)}
                                  className={`transition-colors cursor-pointer ${
                                    favoriteIds.includes(snd.id)
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-transparent group-hover:text-purple-400/40 hover:text-purple-200'
                                  }`}
                                />
                                <span title="Eliminar sonido" className="inline-flex">
                                  <Trash2
                                    size={12}
                                    onClick={(e) => handleDeleteCustomSound(snd.id, e)}
                                    className="text-transparent group-hover:text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                  />
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* 4. EFECTOS NATIVOS DE KOVA */}
                <div id="sb-section-defaults" className="space-y-1.5 pt-1">
                  <div
                    onClick={() => toggleSection('defaults')}
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-400/80 cursor-pointer hover:text-purple-200 select-none font-mono"
                  >
                    <Sparkles size={12} className="text-purple-400" />
                    <span>Sonidos Oficiales ({filteredBuiltIn.length})</span>
                    {collapsedSections.defaults ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  </div>

                  {!collapsedSections.defaults && (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      {filteredBuiltIn.map((snd) => {
                        const isPlaying = activePlayingId === snd.id;
                        return (
                          <button
                            key={`def_${snd.id}`}
                            type="button"
                            onClick={() => handlePlayBuiltInSound(snd)}
                            className={`h-11 px-3 rounded-xl bg-[#06020e] hover:bg-purple-950/40 border border-purple-950/50 transition-all flex items-center justify-between gap-2 text-left cursor-pointer group ${
                              isPlaying ? 'ring-1 ring-purple-500 bg-purple-900/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{snd.emoji}</span>
                              <span className="text-xs font-semibold text-purple-200 truncate group-hover:text-white">
                                {snd.name}
                              </span>
                            </div>
                            <Star
                              size={12}
                              onClick={(e) => toggleFavorite(snd.id, e)}
                              className={`shrink-0 transition-colors ${
                                favoriteIds.includes(snd.id)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-transparent group-hover:text-purple-400/40 hover:text-purple-200'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="h-11 px-4 border-t border-purple-950/40 bg-[#080312] flex items-center justify-between shrink-0 text-[11px] text-purple-400/70">
          <div className="flex items-center gap-2">
            {activePlayingId ? (
              <button
                type="button"
                onClick={handleStopSound}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold cursor-pointer animate-pulse"
              >
                <Square size={11} className="fill-rose-400" />
                <span>Detener sonido</span>
              </button>
            ) : (
              <span>Haz clic en un sonido para reproducirlo</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAddingSound((prev) => !prev)}
            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold cursor-pointer transition-colors"
          >
            <Plus size={13} />
            <span>{isAddingSound ? 'Ver sonidos' : 'Añadir sonido'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
