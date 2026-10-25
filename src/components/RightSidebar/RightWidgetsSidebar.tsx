import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VerifiedBadge } from '../Common/VerifiedBadge';
import { User } from '../../types';
import { Avatar } from '../Common/Avatar';

/** Members of the active space, split into online and offline. */
export const RightWidgetsSidebar: React.FC = () => {
  const {
    activeServer,
    currentUser,
    openUserProfile,
    realtimeConnected,
    presenceByUser,
    setIsMemberListOpen,
  } = useApp();

  const [query, setQuery] = useState('');

  // Live presence from the realtime gateway overrides the stored status.
  const withLivePresence = (member: User): User => {
    const live = realtimeConnected ? presenceByUser[member.id] : undefined;
    if (!live) return member;
    return { ...member, status: live === 'offline' ? 'offline' : member.status === 'offline' ? 'online' : member.status };
  };
  const members: User[] = [
    { ...currentUser, nickname: activeServer?.members?.find((m) => m.id === currentUser.id)?.nickname, status: currentUser.status === 'offline' ? 'online' : currentUser.status },
    ...(activeServer?.members || []).filter((member) => member.id !== currentUser.id).map(withLivePresence),
  ];
  const needle = query.trim().toLowerCase();
  const visible = members.filter((member) =>
    !needle || `${member.nickname || ''} ${member.displayName} ${member.username}`.toLowerCase().includes(needle)
  );
  const online = visible.filter((member) => member.status !== 'offline');
  const offline = visible.filter((member) => member.status === 'offline');

  const row = (member: User, isOnline: boolean) => (
    <li key={member.id}>
      <button type="button" className={`kova-member ${isOnline ? '' : 'is-offline'}`} onClick={() => openUserProfile(member)}>
        <span className="kova-member-avatar">
          <Avatar src={member.avatar} name={member.nickname || member.displayName || member.username} size={32} />
          <i className={isOnline ? 'is-online' : ''} />
        </span>
        <span className="kova-member-text">
          <strong>
            {member.nickname || member.displayName || member.username}
            {member.verified && <VerifiedBadge size={13} />}
            {member.id === currentUser.id && <em>tú</em>}
          </strong>
          <small>
            {member.id === activeServer?.ownerId ? 'Creador del espacio' : member.customStatus || (isOnline ? 'En línea' : 'Desconectado')}
          </small>
        </span>
      </button>
    </li>
  );

  return (
    <aside className="kova-members" aria-label="Miembros del espacio">
      <header className="kova-members-head">
        <h2>Miembros <span>{members.length}</span></h2>
        <button type="button" onClick={() => setIsMemberListOpen(false)} aria-label="Cerrar miembros" title="Cerrar">
          <X size={16} />
        </button>
      </header>

      <label className="kova-members-search">
        <Search size={14} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar persona" />
      </label>

      <div className="kova-members-list custom-scrollbar">
        {visible.length === 0 && <p className="kova-members-empty">Nadie coincide con “{query}”.</p>}
        {online.length > 0 && (
          <section>
            <h3>En línea · {online.length}</h3>
            <ul>{online.map((member) => row(member, true))}</ul>
          </section>
        )}
        {offline.length > 0 && (
          <section>
            <h3>Desconectados · {offline.length}</h3>
            <ul>{offline.map((member) => row(member, false))}</ul>
          </section>
        )}
        {!realtimeConnected && (
          <p className="kova-members-note">La presencia en vivo no está disponible ahora mismo.</p>
        )}
      </div>
    </aside>
  );
};
