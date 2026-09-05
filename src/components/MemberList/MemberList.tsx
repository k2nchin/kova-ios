import React, { useState } from 'react';
import { PanelRightClose, Search, Crown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role, User } from '../../types';

export const MemberList: React.FC = () => {
  const {
    isMemberListOpen,
    setIsMemberListOpen,
    currentUser,
    activeServer,
    friends,
    openUserProfile,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  if (!isMemberListOpen) return null;

  const serverRoles: Role[] = activeServer?.roles || [];

  // Combine activeServer.members with currentUser and friends to make sure everyone in the server is listed
  const serverMembersMap = new Map<string, User>();

  // Add owner / current user
  serverMembersMap.set(currentUser.id, {
    ...currentUser,
    roles: activeServer?.members?.find((m) => m.id === currentUser.id)?.roles || [
      serverRoles.find((r) => r.name.includes('Propietario'))?.id || '',
    ].filter(Boolean),
  });

  // Add server members
  (activeServer?.members || []).forEach((m) => {
    serverMembersMap.set(m.id, m);
  });

  // Add friends who may be in this server
  friends.forEach((f) => {
    if (!serverMembersMap.has(f.id)) {
      const existingInServer = activeServer?.members?.find((m) => m.id === f.id);
      serverMembersMap.set(f.id, {
        ...f,
        roles: existingInServer?.roles || [],
      });
    }
  });

  const allMembers = Array.from(serverMembersMap.values());

  // Filter members by search
  const filtered = searchQuery
    ? allMembers.filter((m) =>
        (m.displayName || m.username).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allMembers;

  // Helper to get a member's highest role
  const getMemberHighestRole = (member: User): Role | null => {
    const memberRoleIds = member.roles || [];
    for (const role of serverRoles) {
      if (role.name === '@everyone') continue;
      if (memberRoleIds.includes(role.id)) {
        return role;
      }
    }
    return null;
  };

  // Helper to get a member's highest HOISTED role
  const getMemberHoistedRole = (member: User): Role | null => {
    const memberRoleIds = member.roles || [];
    for (const role of serverRoles) {
      if (role.name === '@everyone') continue;
      if (role.hoist && memberRoleIds.includes(role.id)) {
        return role;
      }
    }
    return null;
  };

  // Group members by Hoisted Roles (Discord style)
  const hoistedGroups: { role: Role; members: User[] }[] = [];
  const onlineWithoutHoist: User[] = [];
  const offlineMembers: User[] = [];

  // Keep track of members already assigned to a hoisted group
  const assignedMemberIds = new Set<string>();

  serverRoles.forEach((role) => {
    if (role.name === '@everyone' || !role.hoist) return;
    const matchingMembers = filtered.filter((m) => {
      if (assignedMemberIds.has(m.id)) return false;
      const isOnline = m.status !== 'offline';
      if (!isOnline) return false;
      const highestHoist = getMemberHoistedRole(m);
      return highestHoist?.id === role.id;
    });

    if (matchingMembers.length > 0) {
      hoistedGroups.push({ role, members: matchingMembers });
      matchingMembers.forEach((m) => assignedMemberIds.add(m.id));
    }
  });

  // Remaining members
  filtered.forEach((m) => {
    if (assignedMemberIds.has(m.id)) return;
    if (m.status === 'offline') {
      offlineMembers.push(m);
    } else {
      onlineWithoutHoist.push(m);
    }
  });

  const totalOnline = allMembers.filter((m) => m.status !== 'offline').length;
  const isOwnerOrAdmin = currentUser.id === activeServer?.ownerId;

  // Render a member row
  const renderMemberRow = (member: User) => {
    const highestRole = getMemberHighestRole(member);
    const isOnline = member.status !== 'offline';
    const isOwner = member.id === activeServer?.ownerId;

    return (
      <button
        key={member.id}
        className="member-row cursor-pointer group hover:bg-white/[0.04] p-1.5 rounded-xl flex items-center gap-2.5 transition-all w-full text-left"
        onClick={() => openUserProfile(member)}
      >
        <span className="member-avatar-wrap relative shrink-0">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.displayName}
              className="w-8 h-8 rounded-xl object-cover"
            />
          ) : (
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white"
              style={{ background: highestRole?.color || '#5865F2' }}
            >
              {member.displayName?.slice(0, 1) || 'U'}
            </span>
          )}
          <i
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#11151c] ${
              isOnline ? 'bg-emerald-400' : 'bg-slate-500'
            }`}
          />
        </span>

        <span className="member-copy min-w-0 flex-1">
          <strong
            className="text-xs font-semibold truncate block"
            style={{ color: highestRole?.color || '#dbdee1' }}
          >
            {member.displayName}
          </strong>
          <span className="text-[10px] text-slate-400 truncate block">
            {member.customStatus || (isOnline ? 'En línea' : 'Desconectado')}
          </span>
        </span>

        {isOwner && (
          <span title="Propietario del servidor" className="shrink-0 ml-auto mr-1 flex items-center">
            <Crown size={12} className="text-amber-400 fill-amber-400" />
          </span>
        )}

        {highestRole && (
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 truncate max-w-[64px]"
            style={{
              backgroundColor: `${highestRole.color}15`,
              borderColor: `${highestRole.color}40`,
              color: highestRole.color,
            }}
          >
            {highestRole.name}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <aside className="member-panel w-full h-full bg-[#11151c] flex flex-col overflow-y-auto custom-scrollbar select-none font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="space-y-4">
          {/* Header */}
          <div className="member-head flex items-start justify-between">
            <div>
              <span className="eyebrow text-[10px] font-mono tracking-widest text-slate-400">
                EN ESTE SERVIDOR
              </span>
              <h2 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-1.5">
                <span>Miembros</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                  {allMembers.length}
                </span>
              </h2>
            </div>
            <button
              className="icon-button subtle cursor-pointer p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
              aria-label="Cerrar panel"
              onClick={() => setIsMemberListOpen(false)}
              title="Cerrar lista de miembros"
            >
              <PanelRightClose size={17} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#171b25] border border-white/[0.06] text-xs text-[#778398] focus-within:border-[#72e4d0] focus-within:text-white transition-all">
              <Search size={14} className="text-[#778398] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar miembros..."
                className="bg-transparent border-none outline-none text-xs text-[#f4f7fb] placeholder-[#778398] w-full"
              />
            </div>
          </div>

          {/* Presence Summary Ring */}
          <div className="presence-summary p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-300 font-mono">
              {totalOnline}
            </div>
            <div className="text-xs leading-tight">
              <strong className="text-white block font-semibold">
                {totalOnline} {totalOnline === 1 ? 'activo ahora' : 'activos ahora'}
              </strong>
              <span className="text-[10px] text-slate-400">
                {totalOnline === 1 ? 'Tú estás conectado' : 'La colaboración está en movimiento.'}
              </span>
            </div>
          </div>

          {/* DYNAMIC HOISTED ROLE GROUPS (Discord Style) */}
          <div className="space-y-4">
            {hoistedGroups.map((group) => (
              <div key={group.role.id} className="member-group space-y-1">
                <div className="member-group-label flex items-center justify-between text-[11px] font-bold tracking-wider font-mono px-1">
                  <span className="flex items-center gap-1.5" style={{ color: group.role.color }}>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: group.role.color }}
                    />
                    <span>{group.role.name.toUpperCase()}</span>
                  </span>
                  <small className="text-slate-400 text-[10px]">{group.members.length}</small>
                </div>
                <div className="space-y-0.5">{group.members.map(renderMemberRow)}</div>
              </div>
            ))}

            {/* Members Online without hoisted role */}
            {onlineWithoutHoist.length > 0 && (
              <div className="member-group space-y-1">
                <div className="member-group-label flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 font-mono px-1">
                  <span>EN LÍNEA</span>
                  <small className="text-[10px]">{onlineWithoutHoist.length}</small>
                </div>
                <div className="space-y-0.5">{onlineWithoutHoist.map(renderMemberRow)}</div>
              </div>
            )}

            {/* Offline members */}
            {offlineMembers.length > 0 && (
              <div className="member-group space-y-1">
                <div className="member-group-label flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-500 font-mono px-1">
                  <span>DESCONECTADOS</span>
                  <small className="text-[10px]">{offlineMembers.length}</small>
                </div>
                <div className="space-y-0.5 opacity-60 hover:opacity-100 transition-opacity">
                  {offlineMembers.map(renderMemberRow)}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
