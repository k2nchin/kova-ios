import React, { useState } from 'react';
import {
  Zap,
  Search,
  Sparkles,
  Radio,
  Plus,
  Compass,
  Settings,
  Minus,
  Square,
  X,
  Layers,
  Activity,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TopCommandDeck: React.FC = () => {
  const {
    servers,
    activeServer,
    setActiveServerId,
    currentUser,
    setIsCreateServerOpen,
    setIsSettingsOpen,
    setIsCommandPaletteOpen,
    setIsKovaAIOpen,
    isInVoice,
  } = useApp();

  const [isMaximized, setIsMaximized] = useState(false);

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
      const max = await win.isMaximized();
      if (max) {
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
      className="h-14 w-full bg-[#0a0c12]/95 border-b border-white/[0.08] backdrop-blur-2xl flex items-center justify-between px-4 select-none z-50 shrink-0"
    >
      {/* 1. Left: Brand & Spaces Navigation (Replaces Discord vertical rail) */}
      <div className="flex items-center gap-3.5 no-drag">
        {/* Brand Orb */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-cyan-900/40 border border-purple-500/40 shadow-lg glow-purple">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
          <span className="font-['Outfit'] font-black text-sm tracking-widest text-gradient-kova">
            KOVA
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 font-mono">
            SPATIAL OS
          </span>
        </div>

        {/* Spaces Horizontal Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          {servers.map((s) => {
            const isActive = activeServer.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveServerId(s.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md glow-purple scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                }`}
              >
                {s.icon ? (
                  <img
                    src={s.icon}
                    alt={s.name}
                    className="w-4 h-4 rounded-lg object-cover ring-1 ring-white/20"
                  />
                ) : (
                  <span className="font-mono text-[10px]">{s.acronym}</span>
                )}
                <span className="truncate max-w-[110px] hidden md:inline">{s.name}</span>
                {s.unread && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </button>
            );
          })}

          <button
            onClick={() => setIsCreateServerOpen(true)}
            className="p-1.5 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition-all border border-dashed border-emerald-500/30"
            title="Crear nuevo Espacio"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Center: Quantum Search / Command Palette */}
      <div className="flex-1 max-w-sm mx-4 no-drag">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-purple-500/40 text-slate-400 hover:text-slate-200 transition-all text-xs group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <span className="text-[11px] font-medium">Buscar en la órbita de Kova...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono bg-white/[0.06] border border-white/[0.1] rounded-md text-slate-300">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* 3. Right: Telemetry + Kova AI Core + User Capsule + Window Controls */}
      <div className="flex items-center gap-3 no-drag">
        {/* Real-time Telemetry (Low latency Rust Engine) */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/40 border border-white/[0.06] text-[10px] font-mono text-slate-400">
          <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-emerald-300">Rust 1.1ms</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400">RAM 68MB</span>
        </div>



        {/* User Status Capsule */}
        <div
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] cursor-pointer transition-all"
          title="Ajustes de Perfil"
        >
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20"
            />
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#0a0c12] ${
                currentUser.status === 'online'
                  ? 'bg-emerald-500'
                  : currentUser.status === 'idle'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
          </div>
          <span className="text-xs font-bold text-slate-200 truncate max-w-[80px] hidden sm:inline">
            {currentUser.displayName}
          </span>
          <Settings className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Frameless Window Controls */}
        <div className="flex items-center pl-2 border-l border-white/[0.08] gap-0.5">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-500 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
