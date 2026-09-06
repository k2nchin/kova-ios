import React, { useState } from 'react';
import {
  Minus,
  Square,
  X,
  Bell,
  Command,
  ChevronLeft,
  ChevronRight,
  Palette,
  Settings,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BackgroundTheme } from '../Themes/ThemeBackground';
import { toast } from 'sonner';

const QUICK_THEMES: { id: BackgroundTheme; name: string; dot: string }[] = [
  { id: 'oled', name: 'OLED Pure Black', dot: 'bg-black border border-white/20' },
  { id: 'crimson', name: 'Dark Rojo Carmesí', dot: 'bg-rose-500 shadow-sm shadow-rose-500/50' },
  { id: 'abyss', name: 'Abyssal Deep Blue', dot: 'bg-sky-500 shadow-sm shadow-sky-500/50' },
  { id: 'emerald', name: 'Deep Forest Emerald', dot: 'bg-emerald-500 shadow-sm shadow-emerald-500/50' },
  { id: 'amethyst', name: 'Amethyst Gothic Void', dot: 'bg-purple-500 shadow-sm shadow-purple-500/50' },
  { id: 'amber', name: 'Cyber Amber Eclipse', dot: 'bg-amber-500 shadow-sm shadow-amber-500/50' },
  { id: 'nebula', name: 'Nebula Cyber-Glow', dot: 'bg-indigo-400' },
  { id: 'matrix', name: 'Matrix Green Rain', dot: 'bg-emerald-400' },
  { id: 'synthwave', name: 'Synthwave 80s', dot: 'bg-pink-500' },
  { id: 'discord', name: 'Discord Classic', dot: 'bg-[#5865f2]' },
];

interface TitlebarProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { theme, setTheme, setIsCommandPaletteOpen, setIsSettingsOpen } = useApp();
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
      className="h-12 w-full bg-[#08090d] flex items-center justify-between px-3 select-none z-50 text-xs text-[#949ba4] font-medium border-b border-white/[0.04]"
    >
      {/* Left: KOVA Ribbon Logo + Brand + Sidebar Collapse Toggle */}
      <div className="flex items-center gap-2.5 no-drag">
        {/* Official 3D Isometric Logo */}
        <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#101322] border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-950/60 ring-1 ring-purple-400/20">
          <img src="/kova-logo.png" alt="Kova" className="w-7 h-7 object-contain" />
        </div>

        {/* Wordmark */}
        <span className="font-['Outfit'] font-extrabold text-sm tracking-widest text-white uppercase">
          KOVA
        </span>

        {/* Collapse Sidebar Button */}
        <button
          onClick={onToggleSidebar}
          className="w-7 h-7 ml-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.05]"
          title={sidebarCollapsed ? 'Expandir barra lateral' : 'Ocultar barra lateral'}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Center & Right: Search Input (⌘ K) + Notification Bell + Palette/Audio + Window Controls */}
      <div className="flex items-center gap-2.5 no-drag">
        {/* Search Pill: Buscar en KOVA ⌘ K */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center justify-between w-48 sm:w-64 px-3.5 py-1.5 rounded-xl bg-[#10121a] hover:bg-[#141722] border border-white/[0.07] text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer group shadow-inner"
        >
          <span className="text-slate-400 group-hover:text-slate-300 font-normal">
            Buscar en KOVA
          </span>
          <kbd className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[10px] text-slate-300 font-mono flex items-center gap-1 border border-white/[0.05]">
            <Command size={10} /> K
          </kbd>
        </button>

        {/* Notification Bell with Magenta/Purple Unread Dot */}
        <button
          onClick={() => toast.info('Todas las notificaciones están al día')}
          className="relative w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
          title="Notificaciones"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-fuchsia-500 ring-2 ring-[#08090d] animate-pulse" />
        </button>

        {/* Quick Theme Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            title="Cambiar paleta y tema de color"
          >
            <Palette size={15} className="text-purple-400" />
          </button>

          {isThemeMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsThemeMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-50 p-2 rounded-2xl bg-[#121520] border border-white/[0.1] shadow-2xl space-y-1 w-56 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  PALETAS & TEMAS
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
                      <span className="text-[10px] text-purple-400 font-mono font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Global App Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer hover:rotate-45 duration-200"
          title="Ajustes de la aplicación (Ctrl+,)"
        >
          <Settings size={15} />
        </button>

        {/* Window Controls: Minimize, Maximize, Close */}
        <div className="flex items-center ml-1 border-l border-white/[0.06] pl-1">
          <button
            onClick={handleMinimize}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Minimizar"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Maximizar"
          >
            <Square size={12} />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-500 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
