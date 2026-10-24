import React from 'react';
import {
  Users,
  Plus,
  Crown,
  Shield,
  UserPlus,
  Radio,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const KovaRightPanel: React.FC = () => {
  const {
    currentUser,
    activeServer,
    openInviteModal,
    activeVoiceChannelId,
  } = useApp();

  const members = activeServer?.members && activeServer.members.length > 0
    ? activeServer.members
    : [currentUser];

  const owners = members.filter((m) => m.id === (activeServer?.ownerId || currentUser.id));
  const regularMembers = members.filter((m) => m.id !== (activeServer?.ownerId || currentUser.id));

  return (
    <aside className="w-[240px] h-full flex flex-col bg-[#05010c] border-l border-purple-950/30 select-none shrink-0 overflow-y-auto scrollbar-none p-3 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Header: Miembros */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase font-['Outfit']">
          Miembros ({members.length})
        </span>
        <button
          onClick={() => openInviteModal(activeServer?.id)}
          className="w-6 h-6 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 flex items-center justify-center transition-colors cursor-pointer"
          title="Invitar amigos"
        >
          <UserPlus size={13} />
        </button>
      </div>

      {/* 2. Owners section */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-purple-400/80 tracking-wider uppercase px-1">
          Propietario — {owners.length}
        </span>
        <div className="space-y-0.5">
          {owners.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/[0.04] transition-colors group cursor-pointer"
            >
              <div className="relative shrink-0">
                <img
                  src={member.avatar}
                  alt={member.displayName}
                  className="w-8 h-8 rounded-full object-cover border border-purple-500/40"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#05010c]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-white truncate">
                    {member.displayName}
                  </span>
                  <Crown size={12} className="text-amber-400 fill-amber-400/20 shrink-0" />
                </div>
                <p className="text-[10px] text-zinc-400 truncate">
                  En línea
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Regular Members section */}
      {regularMembers.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase px-1">
            Miembros — {regularMembers.length}
          </span>
          <div className="space-y-0.5">
            {regularMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/[0.04] transition-colors group cursor-pointer"
              >
                <div className="relative shrink-0">
                  <img
                    src={member.avatar}
                    alt={member.displayName}
                    className="w-8 h-8 rounded-full object-cover border border-white/[0.06]"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#05010c]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-zinc-300 truncate block">
                    {member.displayName}
                  </span>
                  <p className="text-[10px] text-zinc-500 truncate">
                    En línea
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Active Voice Presence if in voice */}
      {activeVoiceChannelId && (
        <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-1.5">
          <div className="flex items-center gap-2 text-purple-300 text-xs font-bold font-['Outfit']">
            <Radio size={14} className="animate-pulse text-purple-400" />
            <span>Voz Conectada</span>
          </div>
          <p className="text-[10px] text-purple-200/70">
            Estás conectado en tiempo real al canal de voz.
          </p>
        </div>
      )}

      {/* 5. Clean Invite CTA */}
      <div className="pt-2">
        <button
          onClick={() => openInviteModal(activeServer?.id)}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 text-purple-200 text-xs font-semibold border border-purple-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Plus size={14} />
          <span>Invitar a este servidor</span>
        </button>
      </div>
    </aside>
  );
};
