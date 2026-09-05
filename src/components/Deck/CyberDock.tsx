import React from 'react';
import {
  LayoutDashboard,
  Columns,
  MessageSquare,
  Users,
  Compass,
  Sparkles,
  Terminal,
  Gamepad2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  LayoutGrid,
  Music2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkspaceLayoutMode } from '../../types';

interface CyberDockProps {
  layoutMode: WorkspaceLayoutMode;
  setLayoutMode: (mode: WorkspaceLayoutMode) => void;
}

export const CyberDock: React.FC<CyberDockProps> = ({ layoutMode, setLayoutMode }) => {
  const {
    currentUser,
    toggleMute,
    setIsKovaAIOpen,
    setIsCodePlaygroundOpen,
    setIsArcadeOpen,
    setIsSoundboardOpen,
    soundEnabled,
    setSoundEnabled,
  } = useApp();

  const layoutButtons: { mode: WorkspaceLayoutMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'bento_master', label: 'Master Bento HUD', icon: <LayoutDashboard className="w-4 h-4" /> },
    { mode: 'split', label: 'Modo Split (Tiling)', icon: <Columns className="w-4 h-4" /> },
    { mode: 'chat_focus', label: 'Chat Focus', icon: <MessageSquare className="w-4 h-4" /> },
    { mode: 'direct_messages', label: 'Mensajes Directos & Amigos', icon: <Users className="w-4 h-4" /> },
    { mode: 'voice_radar', label: 'Radar 3D Audio', icon: <Compass className="w-4 h-4" /> },
    { mode: 'pulse_feed', label: 'Pulse Hub', icon: <LayoutGrid className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 select-none animate-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#0f121d]/90 border border-white/[0.12] shadow-2xl backdrop-blur-2xl glow-purple">
        {/* Layout Mode Switchers */}
        <div className="flex items-center gap-1 pr-2 border-r border-white/[0.08]">
          {layoutButtons.map((btn) => {
            const isActive = layoutMode === btn.mode;
            return (
              <button
                key={btn.mode}
                onClick={() => setLayoutMode(btn.mode)}
                className={`p-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md glow-purple scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
                title={btn.label}
              >
                {btn.icon}
              </button>
            );
          })}
        </div>

        {/* Quick Tools: AI Copilot, Code Playground, Arcade, Soundboard */}
        <div className="flex items-center gap-1 pr-2 border-r border-white/[0.08]">
          <button
            onClick={() => setIsKovaAIOpen(true)}
            className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition-all border border-purple-500/30"
            title="Kova AI Assistant"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
          </button>

          <button
            onClick={() => setIsSoundboardOpen(true)}
            className="p-2 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white transition-all border border-amber-500/30"
            title="Kova Soundboard FX"
          >
            <Music2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCodePlaygroundOpen(true)}
            className="p-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white transition-all border border-cyan-500/30"
            title="Playground de Código en vivo"
          >
            <Terminal className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsArcadeOpen(true)}
            className="p-2 rounded-xl bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white transition-all border border-pink-500/30"
            title="Kova Arcade Minijuegos"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mic & Sound FX quick switches */}
        <div className="flex items-center gap-1 pl-1">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl transition-all ${
              currentUser.isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title={currentUser.isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
          >
            {currentUser.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
            title={soundEnabled ? 'Silenciar sonidos UI' : 'Activar sonidos UI'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
