import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Music2,
  Plus,
  Trash2,
  Play,
  Pause,
  Upload,
  Search,
  Check,
  Square,
  ArrowLeft,
} from 'lucide-react';
import { soundFx } from '../../utils/soundEffects';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';

export interface CustomSoundItem {
  id: string;
  name: string;
  emoji: string;
  audioData: string; // Base64 data URL
  duration?: number;
  color: string;
  createdAt: number;
}

interface BuiltInSoundItem {
  id: string;
  type: 'laser' | 'victory' | 'cyberhorn' | 'arcade' | 'airhorn' | 'quack' | 'applause' | 'badumtss' | 'discord_ping' | 'bruh';
  name: string;
  emoji: string;
  color: string;
}

const builtInSounds: BuiltInSoundItem[] = [
  { id: 'airhorn', type: 'airhorn', name: 'Airhorn', emoji: '🎺', color: 'from-amber-500/20 to-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'quack', type: 'quack', name: 'Pato Quack', emoji: '🦆', color: 'from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/30' },
  { id: 'badumtss', type: 'badumtss', name: 'Ba-Dum-Tss', emoji: '🥁', color: 'from-purple-500/20 to-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'victory', type: 'victory', name: 'GG Victoria', emoji: '🏆', color: 'from-emerald-500/20 to-cyan-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'applause', type: 'applause', name: 'Aplausos', emoji: '👏', color: 'from-rose-500/20 to-red-500/20 text-rose-300 border-rose-500/30' },
  { id: 'discord_ping', type: 'discord_ping', name: 'Discord Ping', emoji: '🔔', color: 'from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'bruh', type: 'bruh', name: 'Bruh', emoji: '🗿', color: 'from-slate-500/20 to-gray-500/20 text-slate-300 border-slate-500/30' },
  { id: 'laser', type: 'laser', name: 'Cyber Laser', emoji: '⚡', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30' },
  { id: 'arcade', type: 'arcade', name: 'Power Up 8-Bit', emoji: '👾', color: 'from-fuchsia-500/20 to-purple-500/20 text-fuchsia-300 border-fuchsia-500/30' },
  { id: 'cyberhorn', type: 'cyberhorn', name: 'Bocina Nave', emoji: '🚢', color: 'from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-500/30' },
];

const COLOR_PRESETS = [
  { label: 'Púrpura', value: 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30', bg: 'bg-purple-500' },
  { label: 'Cian', value: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30', bg: 'bg-cyan-500' },
  { label: 'Esmeralda', value: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30', bg: 'bg-emerald-500' },
  { label: 'Ámbar', value: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30', bg: 'bg-amber-500' },
  { label: 'Rosa', value: 'from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30', bg: 'bg-pink-500' },
  { label: 'Rojo', value: 'from-rose-500/20 to-red-500/20 text-rose-300 border-rose-500/30', bg: 'bg-red-500' },
];

const EMOJI_PRESETS = ['🔊', '💥', '🎺', '🦆', '🥁', '👏', '🔔', '🗿', '⚡', '👾', '🚢', '📢', '💣', '🤡', '🤖', '🐶', '🐱', '🚀', '💀', '🌮', '🍕', '🎸', '🎤', '🌟'];

const STORAGE_KEY = 'kova.custom_sounds.v1';

export const SoundboardModal: React.FC = () => {
  const { isSoundboardOpen, setIsSoundboardOpen, sendMessage } = useApp();

  // Custom sounds state
  const [customSounds, setCustomSounds] = useState<CustomSoundItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // UI state
  const [isAddingSound, setIsAddingSound] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Form state for new custom sound
  const [soundName, setSoundName] = useState('');
  const [soundEmoji, setSoundEmoji] = useState('🔊');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].value);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Audio refs
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop currently playing sound
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

  // Sync custom sounds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customSounds));
    } catch (e) {
      console.warn('No se pudieron guardar los sonidos en localStorage:', e);
    }
  }, [customSounds]);

  // Clean up audio when modal closes
  useEffect(() => {
    if (!isSoundboardOpen) {
      handleStopSound();
      stopPreview();
      setIsAddingSound(false);
      setErrorMessage('');
    }
  }, [isSoundboardOpen, handleStopSound, stopPreview]);

  // Play built-in sound
  const handlePlayBuiltInSound = (sound: BuiltInSoundItem) => {
    handleStopSound();
    setActivePlayingId(sound.id);
    soundFx.playSoundboardFx(sound.type);

    confetti({
      particleCount: 20,
      spread: 45,
      origin: { y: 0.7 },
      colors: ['#72e4d0', '#b89cff', '#ff6b6b'],
    });

    sendMessage(`${sound.emoji} Reprodujo un sonido del Soundboard: **${sound.name}**`);

    setTimeout(() => {
      setActivePlayingId((prev) => (prev === sound.id ? null : prev));
    }, 1200);
  };

  // Play custom sound
  const handlePlayCustomSound = (sound: CustomSoundItem) => {
    handleStopSound();
    setActivePlayingId(sound.id);

    try {
      const audio = new Audio(sound.audioData);
      currentAudioRef.current = audio;
      audio.volume = 0.85;

      audio.onended = () => {
        setActivePlayingId(null);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setActivePlayingId(null);
        currentAudioRef.current = null;
      };

      audio.play().catch((err) => {
        console.error('Error al reproducir audio personalizado:', err);
        setActivePlayingId(null);
      });

      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#8b5cf6', '#06b6d4', '#ec4899', '#eab308'],
      });

      sendMessage(`${sound.emoji} Reprodujo un sonido personalizado del Soundboard: **${sound.name}**`);
    } catch (e) {
      console.error(e);
      setActivePlayingId(null);
    }
  };

  // Delete a custom sound
  const handleDeleteCustomSound = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePlayingId === id) {
      handleStopSound();
    }
    setCustomSounds((prev) => prev.filter((s) => s.id !== id));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('El archivo no debe superar los 5 MB.');
      return;
    }

    setErrorMessage('');
    setAudioFileName(file.name);
    if (!soundName) {
      // Auto-fill sound name from file without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 30);
      setSoundName(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAudioData(result);

      // Measure duration
      const tempAudio = new Audio(result);
      tempAudio.addEventListener('loadedmetadata', () => {
        setAudioDuration(tempAudio.duration);
      });
    };
    reader.readAsDataURL(file);
  };

  // Preview toggle
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

      audio.onended = () => {
        setIsPreviewPlaying(false);
      };
      audio.onerror = () => {
        setIsPreviewPlaying(false);
      };

      audio.play().catch(() => {
        setIsPreviewPlaying(false);
      });
    }
  };

  // Save new custom sound
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
      color: selectedColor,
      createdAt: Date.now(),
    };

    setCustomSounds((prev) => [newSound, ...prev]);

    // Reset form
    setSoundName('');
    setSoundEmoji('🔊');
    setAudioData(null);
    setAudioFileName('');
    setAudioDuration(0);
    setIsAddingSound(false);
    setErrorMessage('');
  };

  // Filter sounds
  const query = searchQuery.toLowerCase().trim();
  const filteredBuiltIn = builtInSounds.filter((s) =>
    s.name.toLowerCase().includes(query)
  );
  const filteredCustom = customSounds.filter((s) =>
    s.name.toLowerCase().includes(query)
  );

  if (!isSoundboardOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => {
        handleStopSound();
        setIsSoundboardOpen(false);
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#121520] border border-white/[0.1] shadow-2xl overflow-hidden p-5 animate-in zoom-in-95 duration-150 space-y-4 glow-purple max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
              <Music2 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-1.5">
                <span>Kova Soundboard</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Live FX
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {isAddingSound ? 'Añade tu propio efecto de audio' : 'Haz clic para reproducir o subir sonidos'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activePlayingId && (
              <button
                type="button"
                onClick={handleStopSound}
                className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all animate-pulse"
                title="Detener sonido en reproducción"
              >
                <Square size={12} className="fill-rose-400 text-rose-400" />
                <span>Detener</span>
              </button>
            )}

            {!isAddingSound && (
              <button
                type="button"
                onClick={() => setIsAddingSound(true)}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <Plus size={14} />
                <span>Añadir sonido</span>
              </button>
            )}

            <button
              onClick={() => {
                handleStopSound();
                setIsSoundboardOpen(false);
              }}
              className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isAddingSound ? (
          /* ADD CUSTOM SOUND FORM */
          <form onSubmit={handleSaveCustomSound} className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  stopPreview();
                  setIsAddingSound(false);
                  setErrorMessage('');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Volver al Soundboard</span>
              </button>
              <span className="text-[11px] text-purple-400 font-medium">Nuevo Sonido Personalizado</span>
            </div>

            {/* Audio Upload Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Archivo de Audio (MP3, WAV, OGG)</label>
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
                  className="border-2 border-dashed border-white/20 hover:border-purple-500/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.04] group"
                >
                  <Upload size={24} className="mx-auto text-purple-400 group-hover:scale-110 transition-transform mb-2" />
                  <p className="text-xs font-semibold text-white">Haz clic para seleccionar tu audio</p>
                  <p className="text-[11px] text-slate-400 mt-1">Soporta MP3, WAV, OGG, M4A o WebM (máx. 5 MB)</p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-purple-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={togglePreview}
                      className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-colors shrink-0 cursor-pointer shadow-md"
                      title={isPreviewPlaying ? 'Pausar' : 'Preescuchar'}
                    >
                      {isPreviewPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate font-['Outfit']">{audioFileName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {audioDuration > 0 ? `${(Math.round(audioDuration * 10) / 10).toFixed(1)}s de duración` : 'Listo para reproducir'}
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
                    className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>

            {/* Sound Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nombre del Sonido</label>
              <input
                type="text"
                value={soundName}
                onChange={(e) => setSoundName(e.target.value.slice(0, 30))}
                placeholder="Ej. Grito de Victoria, Risita, Claxon..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-['Outfit']"
                maxLength={30}
              />
              <div className="flex justify-end text-[10px] text-slate-500 font-mono">
                {soundName.length}/30 caracteres
              </div>
            </div>

            {/* Emoji Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Emoji del Botón</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={soundEmoji}
                  onChange={(e) => setSoundEmoji(e.target.value)}
                  className="w-12 h-10 text-center text-xl rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  maxLength={4}
                />
                <span className="text-[11px] text-slate-400">Selecciona o escribe cualquier emoji</span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] max-h-24 overflow-y-auto custom-scrollbar">
                {EMOJI_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSoundEmoji(emoji)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base hover:bg-white/[0.1] cursor-pointer transition-all ${
                      soundEmoji === emoji ? 'bg-purple-600/40 border border-purple-400 scale-110' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Color del Botón</label>
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.label}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-7 h-7 rounded-xl ${color.bg} transition-all cursor-pointer flex items-center justify-center ${
                      selectedColor === color.value ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                    title={color.label}
                  >
                    {selectedColor === color.value && <Check size={14} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Submit buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  stopPreview();
                  setIsAddingSound(false);
                  setErrorMessage('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!audioData || !soundName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md transition-all cursor-pointer"
              >
                Guardar en Soundboard
              </button>
            </div>
          </form>
        ) : (
          /* SOUNDS LIST */
          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
            {/* Search Bar */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en el soundboard..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all font-['Outfit']"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer text-xs"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Custom Sounds Section (if any) */}
            {customSounds.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-purple-300 font-mono">
                  <span>SONIDOS PERSONALIZADOS ({filteredCustom.length})</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingSound(true)}
                    className="text-purple-400 hover:text-purple-200 cursor-pointer flex items-center gap-1 font-sans text-xs"
                  >
                    <Plus size={12} />
                    <span>Subir otro</span>
                  </button>
                </div>

                {filteredCustom.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2 text-center">No se encontraron sonidos personalizados con esa búsqueda.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredCustom.map((sound) => {
                      const isPlaying = activePlayingId === sound.id;
                      return (
                        <div
                          key={sound.id}
                          onClick={() => handlePlayCustomSound(sound)}
                          className={`relative group p-3 rounded-2xl border bg-gradient-to-br ${sound.color} hover:scale-[1.02] active:scale-95 transition-all text-left flex items-center gap-3 cursor-pointer shadow-sm ${
                            isPlaying ? 'ring-2 ring-purple-400 animate-pulse' : ''
                          }`}
                        >
                          <span className="text-2xl drop-shadow-md shrink-0">{sound.emoji}</span>
                          <div className="min-w-0 flex-1 pr-6">
                            <div className="text-xs font-bold text-white truncate font-['Outfit'] flex items-center gap-1.5">
                              <span>{sound.name}</span>
                              {isPlaying && (
                                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                              )}
                            </div>
                            <div className="text-[10px] opacity-75 font-mono flex items-center gap-1">
                              <span>Personalizado</span>
                              {sound.duration ? <span>• {sound.duration}s</span> : null}
                            </div>
                          </div>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomSound(sound.id, e)}
                            className="absolute right-2 top-2 p-1.5 rounded-lg bg-black/40 hover:bg-rose-500 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Eliminar sonido"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* If no custom sounds, show callout card */}
            {customSounds.length === 0 && !searchQuery && (
              <div
                onClick={() => setIsAddingSound(true)}
                className="p-3.5 rounded-2xl border border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white font-['Outfit']">¿Tienes audios o memes propios?</h3>
                    <p className="text-[11px] text-slate-400">Sube tus archivos MP3 o WAV para usarlos en llamadas y canales</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-300 group-hover:text-purple-200 shrink-0">
                  Subir audio →
                </span>
              </div>
            )}

            {/* Built-in Sounds Section */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 font-mono">
                EFECTOS NATIVOS DE KOVA ({filteredBuiltIn.length})
              </div>

              {filteredBuiltIn.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">No se encontraron sonidos con esa búsqueda.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredBuiltIn.map((sound) => {
                    const isPlaying = activePlayingId === sound.id;
                    return (
                      <button
                        key={sound.id}
                        type="button"
                        onClick={() => handlePlayBuiltInSound(sound)}
                        className={`p-3 rounded-2xl border bg-gradient-to-br ${sound.color} hover:scale-[1.02] active:scale-95 transition-all text-left flex items-center gap-3 cursor-pointer shadow-sm ${
                          isPlaying ? 'ring-2 ring-white animate-pulse' : ''
                        }`}
                      >
                        <span className="text-2xl drop-shadow-md shrink-0">{sound.emoji}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate font-['Outfit'] flex items-center gap-1.5">
                            <span>{sound.name}</span>
                            {isPlaying && (
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            )}
                          </div>
                          <div className="text-[10px] opacity-75 font-mono">Web Audio FX</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-white/[0.06] text-center text-[10px] text-slate-500 font-mono shrink-0">
          Pulsa cualquier sonido para reproducir instantáneamente en alta fidelidad.
        </div>
      </div>
    </div>
  );
};
