import React from 'react';
import {
  Sparkles,
  Compass,
  Video,
  Bookmark,
  Bell,
  Plus,
  Moon,
  Settings,
  Hash,
  Volume2,
  FolderPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface KovaMainSidebarProps {
  activeTopTab: 'inicio' | 'explorar' | 'directos' | 'guardados' | 'notificaciones';
  setActiveTopTab: (tab: 'inicio' | 'explorar' | 'directos' | 'guardados' | 'notificaciones') => void;
}

export const KovaMainSidebar: React.FC<KovaMainSidebarProps> = ({
  activeTopTab,
  setActiveTopTab,
}) => {
  const {
    currentUser,
    servers,
    activeServer,
    activeChannel,
    setActiveServerId,
    setActiveChannelId,
    setIsSettingsOpen,
    setIsCreateChannelOpen,
    setIsCreateServerOpen,
    setPresetChannelType,
    joinVoiceChannel,
    activeVoiceChannelId,
  } = useApp();

  const textChannels = activeServer?.channels?.filter((c) => c.type === 'text') || [];
  const voiceChannels = activeServer?.channels?.filter((c) => c.type === 'voice') || [];

  return (
    <aside className="w-[260px] h-full flex flex-col bg-[#05010c] border-r border-purple-950/30 select-none shrink-0 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Main Navigation Items */}
      <div className="p-3 pb-2 space-y-1">
        {/* Inicio */}
        <button
          onClick={() => setActiveTopTab('inicio')}
          className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer text-left ${
            activeTopTab === 'inicio'
              ? 'bg-gradient-to-r from-purple-900/60 to-purple-800/40 border border-purple-500/40 shadow-lg shadow-purple-950/60'
              : 'hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight">Inicio</p>
              <p className="text-[10px] text-purple-300/60 truncate">Tu espacio de comunidad</p>
            </div>
          </div>
        </button>

        {/* Explorar */}
        <button
          onClick={() => setActiveTopTab('explorar')}
          className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer text-left ${
            activeTopTab === 'explorar'
              ? 'bg-purple-900/50 border border-purple-500/30 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 shrink-0">
              <Compass size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-200 leading-tight">Explorar</p>
              <p className="text-[10px] text-zinc-500 truncate">Descubrir comunidades</p>
            </div>
          </div>
        </button>

        {/* Directos */}
        <button
          onClick={() => setActiveTopTab('directos')}
          className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer text-left ${
            activeTopTab === 'directos'
              ? 'bg-purple-900/50 border border-purple-500/30 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 shrink-0">
              <Video size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-200 leading-tight">Directos</p>
              <p className="text-[10px] text-zinc-500 truncate">Salas en vivo</p>
            </div>
          </div>
        </button>

        {/* Notificaciones */}
        <button
          onClick={() => setActiveTopTab('notificaciones')}
          className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer text-left ${
            activeTopTab === 'notificaciones'
              ? 'bg-purple-900/50 border border-purple-500/30 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 shrink-0">
              <Bell size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-200 leading-tight">Notificaciones</p>
              <p className="text-[10px] text-zinc-500 truncate">Avisos y menciones</p>
            </div>
          </div>
        </button>
      </div>

      {/* 2. Scrollable Middle: SERVIDORES & CANALES REALES */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-none">
        {/* SERVIDORES */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-['Outfit']">
              Servidores ({servers.length})
            </span>
            <button
              onClick={() => setIsCreateServerOpen(true)}
              className="w-5 h-5 rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Crear servidor"
            >
              <Plus size={13} />
            </button>
          </div>

          {servers.length > 0 ? (
            <div className="space-y-1">
              {servers.map((server) => {
                const isSelected = activeServer?.id === server.id;
                return (
                  <button
                    key={server.id}
                    onClick={() => {
                      setActiveServerId(server.id);
                      if (server.channels && server.channels[0]) {
                        setActiveChannelId(server.channels[0].id);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-purple-950/60 border border-purple-500/40 shadow-sm'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 bg-purple-600/20 border-purple-500/30 text-purple-300 font-bold text-xs">
                        {server.icon ? (
                          <img src={server.icon} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          server.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                          {server.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate">
                          {server.channels?.length || 0} canales
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => setIsCreateServerOpen(true)}
              className="w-full p-3 rounded-xl border border-dashed border-purple-900/40 bg-purple-950/20 hover:bg-purple-950/40 text-purple-300 text-xs flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderPlus size={16} />
              <span>+ Crear tu primer servidor</span>
            </button>
          )}
        </div>

        {/* CANALES DE TEXTO */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-['Outfit']">
              Canales de Texto
            </span>
            <button
              onClick={() => {
                setPresetChannelType('text');
                setIsCreateChannelOpen(true);
              }}
              className="w-5 h-5 rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Crear canal"
            >
              <Plus size={13} />
            </button>
          </div>

          {textChannels.length > 0 ? (
            <div className="space-y-0.5">
              {textChannels.map((ch) => {
                const isActive = activeChannel?.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-purple-950/70 text-white font-semibold border border-purple-500/30'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Hash size={14} className={isActive ? 'text-purple-400' : 'text-zinc-500'} />
                      <span className="text-xs truncate">{ch.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => {
                setPresetChannelType('text');
                setIsCreateChannelOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-white/[0.08] hover:border-purple-500/30 text-[11px] text-zinc-500 hover:text-purple-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
            >
              <Plus size={12} />
              <span>Crear canal de texto</span>
            </button>
          )}
        </div>

        {/* CANALES DE VOZ */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-['Outfit']">
              Canales de Voz
            </span>
            <button
              onClick={() => {
                setPresetChannelType('voice');
                setIsCreateChannelOpen(true);
              }}
              className="w-5 h-5 rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Crear sala de voz"
            >
              <Plus size={13} />
            </button>
          </div>

          {voiceChannels.length > 0 ? (
            <div className="space-y-0.5">
              {voiceChannels.map((room) => {
                const isInVoice = activeVoiceChannelId === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      joinVoiceChannel(room.id);
                      setActiveChannelId(room.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all cursor-pointer text-left ${
                      isInVoice
                        ? 'bg-purple-950/70 text-purple-300 font-semibold border border-purple-500/40'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Volume2 size={14} className={isInVoice ? 'text-purple-400 animate-pulse' : 'text-zinc-500'} />
                      <span className="text-xs truncate">{room.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => {
                setPresetChannelType('voice');
                setIsCreateChannelOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-white/[0.08] hover:border-purple-500/30 text-[11px] text-zinc-500 hover:text-purple-300 transition-colors cursor-pointer text-left flex items-center gap-1.5"
            >
              <Plus size={12} />
              <span>Crear sala de voz</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Bottom User Profile Bar */}
      <div className="p-3 border-t border-purple-950/30 bg-[#070212]/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border border-purple-500/30"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#05010c]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {currentUser?.displayName || 'Usuario'}
            </p>
            <p className="text-[10px] text-zinc-400 leading-none">
              En línea
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Ajustes"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
