import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  UserPlus,
  Crown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

export const MemberList: React.FC = () => {
  const {
    isMemberListOpen,
    currentUser,
    activeServer,
    friends,
    openUserProfile,
    openInviteModal,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  if (!isMemberListOpen) return null;

  // Build combined member list
  const serverMembersMap = new Map<string, User>();

  // Add current user
  serverMembersMap.set(currentUser.id, currentUser);

  // Add active server members
  (activeServer?.members || []).forEach((m) => {
    serverMembersMap.set(m.id, m);
  });

  // Add friends in server
  friends.forEach((f) => {
    if (!serverMembersMap.has(f.id)) {
      serverMembersMap.set(f.id, f);
    }
  });

  const allMembers = Array.from(serverMembersMap.values());

  const filtered = searchQuery
    ? allMembers.filter((m) =>
        (m.displayName || m.username).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allMembers;

  const onlineMembers = filtered.filter((m) => m.status !== 'offline');
  const offlineMembers = filtered.filter((m) => m.status === 'offline');

  const renderMemberItem = (member: User) => {
    const isOnline = member.status !== 'offline';
    const isBot = member.tag === 'BOT' || member.username.includes('bot');
    const isOwner =
      member.id === activeServer?.ownerId ||
      member.id === 'user_dfighj' ||
      member.roles?.some((r) => r.includes('owner') || r.includes('Propietario'));

    return (
      <button
        key={member.id}
        onClick={() => openUserProfile(member)}
        className="w-full flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer group text-left"
      >
        {/* Avatar with Status Dot */}
        <div className="relative shrink-0">
          <img
            src={
              member.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={member.displayName}
            className={`w-8 h-8 rounded-full object-cover ring-1 ${
              isOnline ? 'ring-white/10' : 'ring-white/5 opacity-50 grayscale'
            }`}
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0f1118]" />
          )}
        </div>

        {/* Member Name + Custom Status Subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold truncate ${
                isOnline ? 'text-slate-200 group-hover:text-white' : 'text-slate-500'
              }`}
            >
              {member.displayName}
            </span>

            {/* Crown Icon */}
            {isOwner && (
              <Crown size={12} className="text-amber-400 fill-amber-400 shrink-0" />
            )}

            {/* Purple BOT Badge */}
            {isBot && (
              <span className="px-1 py-0.2 rounded bg-[#7c3aed] text-white text-[9px] font-extrabold tracking-wider uppercase shrink-0">
                BOT
              </span>
            )}
          </div>

          {/* Subtitle status */}
          <span className="text-[11px] text-slate-400 truncate block">
            {member.customStatus || (isOnline ? 'En línea' : 'Desconectado')}
          </span>
        </div>
      </button>
    );
  };

  return (
    <aside className="w-full h-full bg-[#0a0b10] flex flex-col justify-between p-3 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar space-y-4">
        {/* Header: MIEMBROS */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">
            MIEMBROS
          </span>
        </div>

        {/* Search Bar with Filter Slider */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#11131c] border border-white/[0.06] text-xs focus-within:border-purple-500/30 transition-all">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar miembros"
            className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-500 w-full"
          />
          <SlidersHorizontal size={14} className="text-slate-500 shrink-0 ml-2" />
        </div>

        {/* Group 1: EN LÍNEA — N */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 tracking-wider px-1 mb-1">
            EN LÍNEA — {onlineMembers.length}
          </div>
          <div className="space-y-0.5">
            {onlineMembers.map(renderMemberItem)}
          </div>
        </div>

        {/* Group 2: DESCONECTADO — N */}
        {offlineMembers.length > 0 && (
          <div className="space-y-1 pt-2">
            <div className="text-[11px] font-bold text-slate-500 tracking-wider px-1 mb-1">
              DESCONECTADO — {offlineMembers.length}
            </div>
            <div className="space-y-0.5">
              {offlineMembers.map(renderMemberItem)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Button: [👥+ Invitar personas] */}
      <div className="pt-3 border-t border-white/[0.04]">
        <button
          onClick={() => openInviteModal()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/[0.06] hover:border-purple-500/30 transition-all text-xs font-semibold cursor-pointer shadow-sm"
        >
          <UserPlus size={15} className="text-purple-400" />
          <span>Invitar personas</span>
        </button>
      </div>
    </aside>
  );
};
