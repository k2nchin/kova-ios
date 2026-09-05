import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Radio,
  Headphones,
  Activity,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { soundscapes } from '../../utils/soundscapes';

type SoundMode = 'cyber_rain' | 'cosmic_drone' | 'lofi_pulse' | 'binaural_focus';

export const SoundscapePlayer: React.FC = () => {
  const [activeMode, setActiveMode] = useState<SoundMode | null>(null);
  const [volume, setVolume] = useState<number>(0.35);
  const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);

  const options: { id: SoundMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'cyber_rain',
      label: 'Lluvia Cyberpunk',
      icon: <CloudRain className="w-3.5 h-3.5 text-cyan-400" />,
      desc: 'Ruido rosa/marrón con filtro de tormenta',
    },
    {
      id: 'cosmic_drone',
      label: 'Drone Cósmico 432Hz',
      icon: <Radio className="w-3.5 h-3.5 text-purple-400" />,
      desc: 'Armónicos espaciales y modulación suave',
    },
    {
      id: 'lofi_pulse',
      label: 'Lo-Fi Pulse',
      icon: <Activity className="w-3.5 h-3.5 text-emerald-400" />,
      desc: 'Sub-bajo cálido para sesiones de código',
    },
    {
      id: 'binaural_focus',
      label: 'Foco Binaural 14Hz',
      icon: <Headphones className="w-3.5 h-3.5 text-amber-400" />,
      desc: 'Ondas Beta estéreo para concentración',
    },
  ];

  const handleToggle = (mode: SoundMode) => {
    if (activeMode === mode) {
      soundscapes.stop();
      setActiveMode(null);
    } else {
      soundscapes.play(mode);
      soundscapes.setVolume(volume);
      setActiveMode(mode);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundscapes.setVolume(val);
  };

  const handleStopAll = () => {
    soundscapes.stop();
    setActiveMode(null);
  };

  return (
    <div className="relative select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Trigger button in Titlebar / Header */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all">
        <button
          onClick={() => setIsOpenMenu(!isOpenMenu)}
          className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:text-white cursor-pointer"
          title="Sonidos ambientales procedurales"
        >
          {activeMode ? (
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <Sparkles className="w-3 h-3 animate-spin-slow" />
              <span className="truncate max-w-[90px]">
                {options.find((o) => o.id === activeMode)?.label || 'Soundscape'}
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400">
              <Headphones className="w-3 h-3 text-slate-400" />
              <span>Ambiente</span>
            </span>
          )}
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>

        {activeMode && (
          <button
            onClick={handleStopAll}
            className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
            title="Detener sonido ambiental"
          >
            <VolumeX className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpenMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpenMenu(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-2xl bg-[#111420] border border-white/[0.1] shadow-2xl z-50 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-bold text-white font-['Outfit']">
                  Soundscapes Procedurales
                </span>
              </div>
              {activeMode && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                  Activo
                </span>
              )}
            </div>

            {/* List of Ambient presets */}
            <div className="space-y-1">
              {options.map((opt) => {
                const isCurrent = activeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleToggle(opt.id)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-purple-600/20 border border-purple-500/40 text-white'
                        : 'hover:bg-white/[0.05] text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="mt-0.5">{opt.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[11px] truncate flex items-center justify-between">
                        <span>{opt.label}</span>
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Volume Slider */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full accent-cyan-400 h-1 bg-white/[0.1] rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400 shrink-0 w-7 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
