import React, { useState } from 'react';
import {
  Minus,
  Square,
  X,
  Bell,
  Search,
  Users,
  ChevronDown,
  Palette,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BackgroundTheme } from '../Themes/ThemeBackground';
import { toast } from 'sonner';

const QUICK_THEMES: { id: BackgroundTheme; name: string; dot: string }[] = [
  { id: 'amethyst', name: 'Violet Neon (Default)', dot: 'bg-purple-500 shadow-sm shadow-purple-500/50' },
  { id: 'oled', name: 'OLED Pure Black', dot: 'bg-black border border-white/20' },
  { id: 'crimson', name: 'Dark Rojo Carmesí', dot: 'bg-rose-500 shadow-sm shadow-rose-500/50' },
  { id: 'abyss', name: 'Abyssal Deep Blue', dot: 'bg-sky-500 shadow-sm shadow-sky-500/50' },
  { id: 'emerald', name: 'Deep Forest Emerald', dot: 'bg-emerald-500 shadow-sm shadow-emerald-500/50' },
  { id: 'nebula', name: 'Nebula Cyber-Glow', dot: 'bg-indigo-400' },
  { id: 'synthwave', name: 'Synthwave 80s', dot: 'bg-pink-500' },
];

interface TitlebarProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  authMode?: boolean;
}

export const Titlebar: React.FC<TitlebarProps> = ({ sidebarCollapsed = false, onToggleSidebar, authMode = false }) => {
  const {
    theme,
    setTheme,
    setIsCommandPaletteOpen,
    setIsSettingsOpen,
    currentUser,
    setIsMemberListOpen,
    isMemberListOpen,
    setIsNotificationsOpen,
    unreadNotificationsCount,
  } = useApp();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // Tauri window handlers
  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
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
        await win.unmaximize();
        setIsMaximized(false);
      } else {
        await win.maximize();
        setIsMaximized(true);
      }
    } catch {
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch {
      // Browser fallback
    }
  };

  const handleTitlebarMouseDown = async (event: React.MouseEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, [role="button"]')) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().startDragging();
    } catch {
      // La versión web no controla la ventana del sistema.
    }
  };

  return (
    <header
      data-tauri-drag-region
      onMouseDown={handleTitlebarMouseDown}
      onDoubleClick={handleMaximize}
      className="kova-titlebar h-[52px] shrink-0 w-full bg-[#05030a] flex items-center justify-between px-4 select-none z-[60] text-xs text-[#949ba4] font-medium border-b border-white/10"
    >
      {/* Left: Star + Wordmark + Tagline + Sidebar Toggle */}
      <div className="flex items-center gap-2.5 no-drag">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-purple-950/40 text-purple-400/70 hover:text-purple-200 border border-transparent hover:border-purple-900/40 transition-colors cursor-pointer mr-1"
            title={sidebarCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
        <div className="kova-brand-logo-wrap w-8 h-8 flex items-center justify-center">
          <img
            src="/kova-chrome-cube.png"
            alt="Logo de Kova"
            className="kova-brand-logo w-8 h-8 object-contain"
          />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-['Outfit'] font-black text-sm tracking-[0.2em] text-white select-none">
            KOVA
          </span>
          <span className="text-[7.5px] font-bold tracking-[0.18em] text-purple-300/60 uppercase mt-0.5">
            REAL PEOPLE. GREAT VIBES.
          </span>
        </div>
      </div>

      {/* Center: Search Pill "Buscar en KOVA..." with ⌘ K */}
      {!authMode && <div className="flex-1 max-w-md mx-4 no-drag">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center justify-between w-full max-w-md px-4 py-1.5 rounded-full bg-[#0d071c] hover:bg-[#130b28] border border-purple-900/40 hover:border-purple-500/40 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-inner group"
        >
          <div className="flex items-center gap-2">
            <Search size={13} className="text-zinc-500 group-hover:text-purple-400 transition-colors" />
            <span className="text-zinc-400 group-hover:text-zinc-300 font-normal">
              Buscar en KOVA...
            </span>
          </div>
          <kbd className="px-1.5 py-0.2 rounded bg-white/[0.06] text-[10px] text-zinc-400 font-mono flex items-center gap-0.5 border border-white/[0.06]">
            ⌘ K
          </kbd>
        </button>
      </div>}

      {/* Right: Actions, Avatar, Window Controls */}
      <div className="flex items-center gap-3 no-drag">
        {!authMode && <>
        {/* Notification Bell */}
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="relative w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Notificaciones"
        >
          <Bell size={16} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500 ring-2 ring-[#05030a] animate-pulse" />
          )}
        </button>

        {/* Member list toggle */}
        <button
          onClick={() => setIsMemberListOpen(!isMemberListOpen)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Miembros"
        >
          <Users size={16} />
        </button>

        {/* User Avatar with Dropdown */}
        <div className="flex items-center gap-1 cursor-pointer pl-1" onClick={() => setIsSettingsOpen(true)}>
          <div className="relative">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt="Avatar"
              className="w-7 h-7 rounded-full object-cover border border-purple-500/30"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#05030a]" />
          </div>
          <ChevronDown size={12} className="text-zinc-500" />
        </div>
        </>}

        {/* Window Controls: Minimize, Maximize, Close */}
        <div className="mobile-window-controls flex items-center ml-2 border-l border-white/[0.06] pl-2 gap-1">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Minimizar"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Maximizar"
          >
            <Square size={11} />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-500 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </header>
  );
};
