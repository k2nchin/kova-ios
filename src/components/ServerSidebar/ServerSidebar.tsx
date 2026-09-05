import React, { useState } from 'react';
import { Plus, CircleHelp, Sparkles, Trash2, MessageSquare, Compass } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';

export const ServerSidebar: React.FC = () => {
  const {
    servers,
    activeServer,
    setActiveServerId,
    deleteServer,
    setIsCreateServerOpen,
    setIsCommandPaletteOpen,
    isDMViewActive,
    setIsDMViewActive,
    setIsDiscoveryOpen,
  } = useApp();

  const [hoveredServerId, setHoveredServerId] = useState<string | null>(null);
  const [contextMenuServerId, setContextMenuServerId] = useState<string | null>(null);

  const handleDeleteServer = (e: React.MouseEvent, serverId: string, serverName: string) => {
    e.stopPropagation();
    setContextMenuServerId(null);
    if (window.confirm(`¿Estás seguro de que deseas eliminar el espacio "${serverName}"?`)) {
      deleteServer(serverId);
      toast.success(`Espacio "${serverName}" eliminado`);
    }
  };

  return (
    <aside className="w-[58px] h-full flex flex-col items-center py-2 select-none shrink-0 font-['Plus_Jakarta_Sans',sans-serif] z-30 relative">
      {/* 1. Discord Home / Direct Messages Button */}
      <div className="relative group flex items-center justify-center w-full">
        {/* Active Indicator bar */}
        <div
          className={`absolute -left-1 w-1 rounded-r-full bg-purple-400 transition-all duration-200 ${
            isDMViewActive ? 'h-8 opacity-100' : 'h-2 opacity-0 group-hover:opacity-60'
          }`}
        />

        <button
          onClick={() => setIsDMViewActive(true)}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden relative shadow-md ${
            isDMViewActive
              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-500/30 scale-105 rounded-xl border border-white/20 glow-purple'
              : 'bg-[#161a24] text-slate-400 hover:text-white hover:bg-[#202534] hover:rounded-xl border border-white/[0.04]'
          }`}
          title="Mensajes Directos e Inicio"
        >
          <MessageSquare size={18} />
        </button>
      </div>

      <div className="rail-divider my-2.5" />

      {/* 2. Space Stack (Dynamic user servers) */}
      <div className="space-stack flex-1 flex flex-col items-center gap-2.5 overflow-y-auto custom-scrollbar w-full px-1">
        {servers.map((server) => {
          const isSelected = !isDMViewActive && activeServer?.id === server.id;
          const acronym =
            server.acronym ||
            server.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

          return (
            <div
              key={server.id}
              className="relative group flex items-center justify-center w-full"
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenuServerId(server.id);
              }}
            >
              {/* Active Indicator bar */}
              <div
                className={`absolute -left-1 w-1 rounded-r-full bg-cyan-400 transition-all duration-200 ${
                  isSelected ? 'h-8 opacity-100' : 'h-2 opacity-0 group-hover:opacity-60'
                }`}
              />

              <button
                onClick={() => {
                  setIsDMViewActive(false);
                  setActiveServerId(server.id);
                  setContextMenuServerId(null);
                }}
                onMouseEnter={() => setHoveredServerId(server.id)}
                onMouseLeave={() => setHoveredServerId(null)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer overflow-hidden relative shadow-md ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-purple-500/30 scale-105 rounded-xl border border-white/20'
                    : 'bg-[#161a24] text-slate-400 hover:text-white hover:bg-[#202534] hover:rounded-xl border border-white/[0.04]'
                }`}
                aria-label={`Espacio ${server.name}`}
              >
                {server.icon ? (
                  <img
                    src={server.icon}
                    alt={server.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{acronym}</span>
                )}
              </button>

              {/* Hover Tooltip */}
              {hoveredServerId === server.id && !contextMenuServerId && (
                <div className="absolute left-[54px] z-50 px-3 py-1.5 rounded-xl bg-[#141824] text-white text-[11px] font-semibold whitespace-nowrap shadow-2xl border border-white/[0.1] pointer-events-none flex flex-col gap-0.5">
                  <div className="text-slate-100 font-bold">{server.name}</div>
                  {server.description && (
                    <div className="text-[10px] text-slate-400 max-w-[150px] truncate">
                      {server.description}
                    </div>
                  )}
                </div>
              )}

              {/* Context Menu / Options */}
              {contextMenuServerId === server.id && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setContextMenuServerId(null)}
                  />
                  <div className="absolute left-[54px] top-0 z-50 w-44 p-1.5 rounded-2xl bg-[#141824] border border-white/[0.1] shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500 font-mono tracking-wider truncate">
                      {server.name}
                    </div>
                    <button
                      onClick={(e) => handleDeleteServer(e, server.id, server.name)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors cursor-pointer text-left font-semibold"
                    >
                      <Trash2 size={13} />
                      <span>Eliminar espacio</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Add Space Button */}
        <button
          className="w-10 h-10 rounded-2xl border border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
          aria-label="Añadir espacio"
          onClick={() => setIsCreateServerOpen(true)}
          title="Crear nuevo espacio"
        >
          <Plus size={18} />
        </button>

        {/* Explore Discoverable Communities Button (Compass) */}
        <button
          className="w-10 h-10 rounded-2xl bg-[#161a24] hover:bg-emerald-500 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer hover:rounded-xl hover:scale-105 active:scale-95 shrink-0 border border-white/[0.04] hover:border-emerald-400/50"
          aria-label="Explorar comunidades"
          onClick={() => setIsDiscoveryOpen(true)}
          title="Descubrir servidores públicos"
        >
          <Compass size={18} />
        </button>
      </div>

      {/* 3. Rail Bottom Controls */}
      <div className="rail-bottom mt-auto flex flex-col items-center gap-2.5 pt-2 border-t border-white/[0.05] w-full">
        <button
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          aria-label="Ayuda"
          onClick={() => setIsCommandPaletteOpen(true)}
          title="Centro de ayuda y atajos (Ctrl+K)"
        >
          <CircleHelp size={16} />
        </button>
      </div>
    </aside>
  );
};
