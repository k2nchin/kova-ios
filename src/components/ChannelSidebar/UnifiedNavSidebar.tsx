import React, { useState } from 'react';
import {
  Plus,
  SquarePen,
  Home,
  MessageSquare,
  Zap,
  Calendar,
  Folder,
  Settings,
  ChevronDown,
  ChevronRight,
  Hash,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

interface UnifiedNavSidebarProps {
  onOpenNewModal?: () => void;
}

export const UnifiedNavSidebar: React.FC<UnifiedNavSidebarProps> = () => {
  const {
    servers,
    activeServer,
    setActiveServerId,
    activeChannel,
    setActiveChannelId,
    currentUser,
    setIsSettingsOpen,
    setIsCreateServerOpen,
    setIsCreateChannelOpen,
    setIsDMViewActive,
    isDMViewActive,
    openUserProfile,
  } = useApp();

  // Accordion state for spaces
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({
    server_kova: true,
    server_nebula: false,
    server_creators: false,
    server_privado: false,
  });

  const [activeMenu, setActiveMenu] = useState<'inicio' | 'mensajes' | 'actividades' | 'calendario' | 'archivos' | 'configuracion'>('inicio');

  const toggleSpace = (spaceId: string) => {
    setExpandedSpaces((prev) => ({
      ...prev,
      [spaceId]: !prev[spaceId],
    }));
  };

  const getSpaceIcon = (serverName: string) => {
    if (serverName.toLowerCase().includes('kova')) {
      return (
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#6d28d9] to-[#9333ea] flex items-center justify-center text-white font-bold text-xs shadow-sm">
          K
        </div>
      );
    }
    if (serverName.toLowerCase().includes('nebula')) {
      return (
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white text-xs shadow-sm">
          <Sparkles size={13} />
        </div>
      );
    }
    if (serverName.toLowerCase().includes('creator') || serverName.toLowerCase().includes('team')) {
      return (
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs shadow-sm">
          <Users size={13} />
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 text-xs shadow-sm border border-white/[0.06]">
        <Lock size={12} />
      </div>
    );
  };

  return (
    <aside className="w-[260px] h-full flex flex-col justify-between p-3 select-none bg-[#090a0f] text-[#dbdee1] border-r border-white/[0.04] shrink-0 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar space-y-4">
        {/* 1. Top Action Row: [+ Nuevo] + [✎] */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={() => {
              setIsDMViewActive(false);
              setIsCreateChannelOpen(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#8b5cf6] hover:from-[#7c3aed] hover:to-[#9333ea] text-white font-semibold text-xs shadow-lg shadow-purple-950/40 hover:shadow-purple-900/50 transition-all cursor-pointer border border-purple-400/20"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>Nuevo</span>
          </button>

          <button
            onClick={() => {
              setIsDMViewActive(true);
              toast.info('Abriendo mensajes directos');
            }}
            className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Nuevo mensaje o nota"
          >
            <SquarePen size={15} />
          </button>
        </div>

        {/* 2. App Navigation Menu */}
        <nav className="space-y-0.5 text-xs">
          <button
            onClick={() => {
              setActiveMenu('inicio');
              setIsDMViewActive(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeMenu === 'inicio' && !isDMViewActive
                ? 'bg-white/[0.06] text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Home size={16} />
            <span>Inicio</span>
          </button>

          <button
            onClick={() => {
              setActiveMenu('mensajes');
              setIsDMViewActive(true);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
              isDMViewActive || activeMenu === 'mensajes'
                ? 'bg-white/[0.06] text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={16} />
              <span>Mensajes</span>
            </div>
            <span className="w-5 h-5 rounded-full bg-[#7c3aed] text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-purple-950">
              4
            </span>
          </button>

          <button
            onClick={() => {
              setActiveMenu('actividades');
              toast.info('Mostrando actividades recientes');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeMenu === 'actividades'
                ? 'bg-white/[0.06] text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Zap size={16} />
            <span>Actividades</span>
          </button>

          <button
            onClick={() => {
              setActiveMenu('calendario');
              toast.info('Eventos y calendario sincronizado');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeMenu === 'calendario'
                ? 'bg-white/[0.06] text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Calendar size={16} />
            <span>Calendario</span>
          </button>

          <button
            onClick={() => {
              setActiveMenu('archivos');
              toast.info('Archivos compartidos de KOVA');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeMenu === 'archivos'
                ? 'bg-white/[0.06] text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Folder size={16} />
            <span>Archivos</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-all cursor-pointer"
          >
            <Settings size={16} />
            <span>Configuración</span>
          </button>
        </nav>

        {/* 3. Section: ESPACIOS + */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              ESPACIOS
            </span>
            <button
              onClick={() => setIsCreateServerOpen(true)}
              className="text-slate-500 hover:text-white p-0.5 rounded hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Crear nuevo espacio"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Spaces Accordion */}
          <div className="space-y-2 pt-1">
            {servers.map((server) => {
              const isExpanded = expandedSpaces[server.id] ?? (server.id === activeServer?.id);
              const isServerSelected = server.id === activeServer?.id;

              return (
                <div key={server.id} className="space-y-1">
                  {/* Space Header Row */}
                  <button
                    onClick={() => {
                      setActiveServerId(server.id);
                      setIsDMViewActive(false);
                      toggleSpace(server.id);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-all cursor-pointer group ${
                      isServerSelected && !isDMViewActive
                        ? 'bg-white/[0.04] text-white font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getSpaceIcon(server.name)}
                      <span className="text-xs truncate font-medium text-slate-200 group-hover:text-white">
                        {server.name}
                      </span>
                    </div>
                    <span className="text-slate-500 group-hover:text-slate-300 transition-transform">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </button>

                  {/* Nested Channels (if expanded) */}
                  {isExpanded && server.channels && (
                    <div className="pl-4 pr-1 space-y-0.5 animate-in fade-in duration-150">
                      {server.channels
                        .filter((c) => c.type !== 'voice')
                        .map((channel) => {
                          const isActive =
                            !isDMViewActive &&
                            isServerSelected &&
                            activeChannel?.id === channel.id;

                          return (
                            <button
                              key={channel.id}
                              onClick={() => {
                                setActiveServerId(server.id);
                                setActiveChannelId(channel.id);
                                setIsDMViewActive(false);
                              }}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#6d28d9]/30 text-white font-semibold border border-purple-500/40 shadow-sm shadow-purple-950/50'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                              }`}
                            >
                              <Hash
                                size={14}
                                className={isActive ? 'text-purple-300' : 'text-slate-500'}
                              />
                              <span className="truncate">{channel.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Floating User Card: Explorador 👑 | En línea | ⚙️ */}
      <div className="pt-3 border-t border-white/[0.04]">
        <div className="flex items-center justify-between p-2 rounded-2xl bg-[#10121a]/90 border border-white/[0.06] shadow-xl hover:border-purple-500/20 transition-all">
          <div
            onClick={() => openUserProfile(currentUser)}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
          >
            {/* Avatar with status green dot */}
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser.displayName}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#10121a]" />
            </div>

            {/* Name + Status */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white truncate">
                  {currentUser.displayName || 'Explorador'}
                </span>
                <span className="text-[11px]" title="Propietario / VIP">👑</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">
                En línea
              </span>
            </div>
          </div>

          {/* Settings Gear */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
            title="Ajustes de usuario"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
