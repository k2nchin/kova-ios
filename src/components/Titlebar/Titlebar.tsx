import React, { useState } from 'react';
import { Minus, Square, X, Sparkles, Palette } from 'lucide-react';
import { SoundscapePlayer } from '../Audio/SoundscapePlayer';
import { useApp } from '../../context/AppContext';
import { BackgroundTheme } from '../Themes/ThemeBackground';
import { toast } from 'sonner';

const QUICK_THEMES: { id: BackgroundTheme; name: string; dot: string }[] = [
  { id: 'crimson', name: 'Dark Rojo Carmesí', dot: 'bg-rose-500 shadow-sm shadow-rose-500/50' },
  { id: 'oled', name: 'OLED Pure Black', dot: 'bg-black border border-white/20' },
  { id: 'abyss', name: 'Abyssal Deep Blue', dot: 'bg-sky-500 shadow-sm shadow-sky-500/50' },
  { id: 'emerald', name: 'Deep Forest Emerald', dot: 'bg-emerald-500 shadow-sm shadow-emerald-500/50' },
  { id: 'amethyst', name: 'Amethyst Gothic Void', dot: 'bg-purple-500 shadow-sm shadow-purple-500/50' },
  { id: 'amber', name: 'Cyber Amber Eclipse', dot: 'bg-amber-500 shadow-sm shadow-amber-500/50' },
  { id: 'nebula', name: 'Nebula Cyber-Glow', dot: 'bg-indigo-400' },
  { id: 'matrix', name: 'Matrix Green Rain', dot: 'bg-emerald-400' },
  { id: 'synthwave', name: 'Synthwave 80s', dot: 'bg-pink-500' },
  { id: 'discord', name: 'Discord Classic', dot: 'bg-[#5865f2]' },
];

export const Titlebar: React.FC = () => {
  const { theme, setTheme } = useApp();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // Tauri window handlers
  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().minimize();
    } catch {
      // Browser fallback
    }
  };

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      const maximized = await win.isMaximized();
      if (maximized) {
        win.unmaximize();
        setIsMaximized(false);
      } else {
        win.maximize();
        setIsMaximized(true);
      }
    } catch {
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().close();
    } catch {
      // Browser fallback
    }
  };

  return (
    <header
      data-tauri-drag-region
      className="h-9 w-full bg-[#0b0d12] flex items-center justify-between px-3 select-none z-50 text-xs text-[#949ba4] font-medium border-b border-white/[0.04]"
    >
      {/* Left: App Title */}
      <div className="flex items-center gap-2 no-drag">
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-white">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="font-['Outfit'] font-semibold text-xs tracking-wide text-slate-300">
          Kova
        </span>
      </div>

      {/* Center/Right: Quick Theme Switcher + Soundscape Ambient Generator + Window Controls */}
      <div className="flex items-center gap-2 no-drag">
        {/* Quick Theme Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
              theme === 'crimson'
                ? 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                : 'hover:bg-white/[0.08] text-slate-300'
            }`}
            title="Cambiar paleta y tema de color"
          >
            <Palette size={12} className={theme === 'crimson' ? 'text-rose-400' : 'text-cyan-400'} />
            <span className="hidden sm:inline font-semibold">
              {theme === 'crimson' ? 'Dark Rojo' : theme === 'abyss' ? 'Deep Blue' : theme === 'emerald' ? 'Deep Forest' : theme === 'amethyst' ? 'Amethyst' : theme === 'amber' ? 'Amber' : theme}
            </span>
          </button>

          {isThemeMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsThemeMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-50 p-2 rounded-2xl bg-[#121520] border border-white/[0.1] shadow-2xl space-y-1 w-56 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  PALETAS PROFUNDAS & TEMAS
                </div>
                {QUICK_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsThemeMenuOpen(false);
                      toast.success(`Tema "${t.name}" activado`);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      theme === t.id
                        ? 'bg-white/[0.12] text-white font-bold'
                        : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${t.dot}`} />
                      <span>{t.name}</span>
                    </div>
                    {theme === t.id && (
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <SoundscapePlayer />

        <button
          onClick={handleMinimize}
          className="w-7 h-6 flex items-center justify-center rounded hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Minimizar"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-6 flex items-center justify-center rounded hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Maximizar"
        >
          <Square className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-6 flex items-center justify-center rounded hover:bg-rose-500 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
};
