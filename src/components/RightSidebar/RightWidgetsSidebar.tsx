import React, { useState } from 'react';
import {
  Users,
  Search,
  Crown,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

export const RightWidgetsSidebar: React.FC = () => {
  const {
    activeServer,
    currentUser,
    openUserProfile,
    activeChannel,
    servers,
    realtimeConnected,
    presenceByUser,
  } = useApp();

  const [searchMember, setSearchMember] = useState('');

  // 1. Build members list; live presence from the realtime gateway overrides the stored status.
  const serverMembers = activeServer?.members || [];
  const withLivePresence = (member: User): User => {
    const live = realtimeConnected ? presenceByUser[member.id] : undefined;
    if (!live) return member;
    return { ...member, status: live === 'offline' ? 'offline' : member.status === 'offline' ? 'online' : member.status };
  };
  const memberList: User[] = [
    currentUser,
    ...serverMembers.filter((m) => m.id !== currentUser.id).map(withLivePresence),
  ];

  const filteredMembers = memberList.filter(
    (m) =>
      m.displayName.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.username.toLowerCase().includes(searchMember.toLowerCase())
  );

  const onlineMembers = filteredMembers.filter((m) => m.status !== 'offline');
  const offlineMembers = filteredMembers.filter((m) => m.status === 'offline');

  return (
    <aside className="kova-right-sidebar w-[280px] xl:w-[300px] h-full flex flex-col p-3 gap-3 overflow-y-auto custom-scrollbar select-none text-[#dbdee1] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header & Search */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-purple-400" />
            <h3 className="text-xs font-bold text-white font-['Outfit'] tracking-wide">
              Presencias
            </h3>
          </div>
          <span className="text-[10px] font-mono text-purple-300/70 font-bold px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40">
            {memberList.length}
          </span>
        </div>

        {/* Member Search Bar */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/50"
          />
          <input
            type="text"
            placeholder="Buscar personas..."
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            className="w-full bg-[#0d071c] border border-purple-950/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-purple-400/40 focus:outline-hidden focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Online Members Section */}
      <div className="p-3 rounded-2xl bg-[#090414]/90 border border-purple-950/50 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400/60 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ACTIVOS AHORA — {onlineMembers.length}
          </span>
        </div>

        <div className="space-y-1">
          {onlineMembers.length === 0 ? (
            <div className="text-center p-3 text-xs text-purple-400/40">
              No hay presencias con ese nombre
            </div>
          ) : (
            onlineMembers.map((member) => {
              const isOwner = member.id === activeServer?.ownerId || member.id === currentUser.id;

              return (
                <button
                  key={member.id}
                  onClick={() => openUserProfile(member)}
                  onContextMenu={(e) => { e.preventDefault(); openUserProfile(member); }}
                  className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-purple-950/40 transition-all cursor-pointer group text-left"
                >
                  <div className="relative shrink-0">
                    <img
                      src={
                        member.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={member.displayName}
                      className="w-8 h-8 rounded-xl object-cover border border-purple-500/30"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#090414]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-purple-100 group-hover:text-white truncate">
                        {member.displayName}
                      </span>
                      {isOwner && (
                        <Crown size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                      )}
                      {member.id === currentUser.id && (
                        <CheckCircle2 size={12} className="text-sky-400 fill-sky-400/20 shrink-0 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[10px] text-purple-400/60 truncate font-mono">
                      {isOwner ? '✦ Creador del espacio' : member.id === currentUser.id ? '✓ Tu señal' : '◉ Presencia activa'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Offline Members Section */}
      {offlineMembers.length > 0 && (
        <div className="p-3 rounded-2xl bg-[#090414]/90 border border-purple-950/50 shadow-xl space-y-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400/50 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            EN PAUSA — {offlineMembers.length}
          </span>

          <div className="space-y-1">
            {offlineMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => openUserProfile(member)}
                onContextMenu={(e) => { e.preventDefault(); openUserProfile(member); }}
                className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-purple-950/30 opacity-70 hover:opacity-100 transition-all cursor-pointer group text-left"
              >
                <div className="relative shrink-0">
                  <img
                    src={
                      member.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={member.displayName}
                    className="w-8 h-8 rounded-xl object-cover grayscale group-hover:grayscale-0 border border-purple-950/40"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-slate-500 ring-2 ring-[#090414]" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white truncate block">
                    {member.displayName}
                  </span>
                  <p className="text-[10px] text-slate-500 truncate font-mono">Señal en pausa</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </aside>
  );
};
