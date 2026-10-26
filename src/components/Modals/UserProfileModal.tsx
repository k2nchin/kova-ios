import { MemberLevel } from '../Community/Levels';
import React, { useEffect, useState } from 'react';
import { X, Pencil, Send, UserPlus, Ban, Flag, Check, Volume2, MicOff, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { VerifiedBadge } from '../Common/VerifiedBadge';
import { api } from '../../services/apiClient';
import type { Role } from '../../types';
import { Avatar } from '../Common/Avatar';
import '../../styles/profile.css';

const STATUS_LABEL: Record<string, string> = { online: 'En línea', idle: 'Ausente', dnd: 'No molestar', offline: 'Desconectado' };

/** Profile card: identity, nickname in this space, voice presence, roles and actions. */
export const UserProfileModal: React.FC = () => {
  const {
    profileModalUser,
    closeUserProfile,
    currentUser,
    activeServer,
    setIsSettingsOpen,
    toggleMemberRole,
    sendDirectMessage,
    addFriend,
    setSpaceNickname,
    voicePeers,
    activeVoiceChannelId,
    realtimeConnected,
    presenceByUser,
    blockUser,
  } = useApp();

  const [quickMsg, setQuickMsg] = useState('');
  const [nickname, setNickname] = useState('');
  const [editingNickname, setEditingNickname] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);

  const profileId = profileModalUser?.id;
  useEffect(() => {
    setQuickMsg(''); setEditingNickname(false); setRolesOpen(false);
  }, [profileId]);

  useEffect(() => {
    if (!profileModalUser) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeUserProfile(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profileModalUser, closeUserProfile]);

  if (!profileModalUser) return null;

  const isMe = profileModalUser.id === currentUser.id;
  const member = activeServer?.members?.find((m) => m.id === profileModalUser.id);
  const user = isMe ? { ...currentUser, nickname: member?.nickname, roles: member?.roles || currentUser.roles } : { ...profileModalUser, ...(member || {}) };
  const shownName = user.nickname || user.displayName || user.username;

  const liveStatus = realtimeConnected ? presenceByUser[user.id] : undefined;
  const status = isMe ? (currentUser.status === 'offline' ? 'online' : currentUser.status) : liveStatus === 'offline' ? 'offline' : liveStatus ? (user.status === 'offline' ? 'online' : user.status) : user.status;

  const voicePeer = activeVoiceChannelId ? voicePeers.find((peer) => peer.id === user.id) : undefined;
  const voiceChannel = voicePeer ? activeServer?.channels.find((c) => c.id === activeVoiceChannelId) : undefined;

  const isSpaceOwner = user.id === activeServer?.ownerId;
  const canManageRoles = Boolean(activeServer) && currentUser.id === activeServer?.ownerId;
  const serverRoles: Role[] = activeServer?.roles || [];
  const memberRoles = serverRoles.filter((role) => (user.roles || []).includes(role.id) && role.name !== '@everyone');

  const accent = /^#[0-9a-f]{6}$/i.test(user.accentColor || '') ? user.accentColor! : '#454749';

  const sendQuick = (event: React.FormEvent) => {
    event.preventDefault();
    const text = quickMsg.trim();
    if (!text) return;
    sendDirectMessage(user.id, text);
    toast.success(`Mensaje enviado a ${shownName}`);
    closeUserProfile();
  };

  const saveNickname = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeServer) return;
    if (await setSpaceNickname(activeServer.id, nickname)) setEditingNickname(false);
  };

  const report = async () => {
    try {
      await api.reportUser(user.id, 'Reporte desde perfil');
      toast.success('Reporte enviado. El equipo de Kova lo revisará.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar el reporte.');
    }
  };

  const block = async () => {
    if (await blockUser({ id: user.id, username: user.username, displayName: shownName, avatar: user.avatar })) closeUserProfile();
  };

  return (
    <div className="kpf-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeUserProfile(); }}>
      <article className="kpf" role="dialog" aria-modal="true" aria-label={`Perfil de ${shownName}`} style={{ '--kpf-accent': accent } as React.CSSProperties}>
        <div className="kpf-banner">
          {user.banner && <img src={user.banner} alt="" />}
          <button type="button" className="kpf-close" onClick={closeUserProfile} aria-label="Cerrar perfil"><X size={16} /></button>
        </div>

        <div className="kpf-head">
          <span className="kpf-avatar">
            <Avatar src={user.avatar} name={shownName} size={84} />
            <i className={`kpf-dot is-${status}`} title={STATUS_LABEL[status] || ''} />
          </span>
        </div>

        <div className="kpf-body">
          <h2>{shownName} {user.verified && <VerifiedBadge size={18} label="Cuenta verificada" />}</h2>
          <p className="kpf-sub">
            {user.nickname && <span>{user.displayName}</span>}
            <span>@{user.username}</span>
            <span>{STATUS_LABEL[status] || ''}</span>
          </p>
          {(user.customStatus || user.thoughtBubble) && <p className="kpf-status">{user.customStatus || user.thoughtBubble}</p>}

          {voicePeer && voiceChannel && (
            <div className="kpf-voice">
              <Volume2 size={15} />
              <span>En <strong>{voiceChannel.name}</strong>{voicePeer.isSpeaking ? ' · hablando' : ''}</span>
              {voicePeer.isMuted && <MicOff size={14} aria-label="Micrófono silenciado" />}
            </div>
          )}

          {activeServer && member && <MemberLevel spaceId={activeServer.id} userId={user.id} />}

          {user.bio && (
            <section className="kpf-section">
              <h3>Sobre mí</h3>
              <p>{user.bio}</p>
            </section>
          )}

          {isMe && activeServer && (
            <section className="kpf-section">
              <h3>Apodo en {activeServer.name}</h3>
              {editingNickname ? (
                <form className="kpf-inline" onSubmit={saveNickname}>
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={32} placeholder={currentUser.displayName} autoFocus />
                  <button type="submit" className="kpf-btn-metal" aria-label="Guardar apodo"><Check size={15} /></button>
                  <button type="button" className="kpf-btn-ghost" onClick={() => setEditingNickname(false)} aria-label="Cancelar"><X size={15} /></button>
                </form>
              ) : (
                <button type="button" className="kpf-row-btn" onClick={() => { setNickname(user.nickname || ''); setEditingNickname(true); }}>
                  <span>{user.nickname || 'Sin apodo · se muestra tu nombre'}</span>
                  <Pencil size={14} />
                </button>
              )}
            </section>
          )}

          {activeServer && (memberRoles.length > 0 || canManageRoles || isSpaceOwner) && (
            <section className="kpf-section">
              <h3>
                Roles
                {canManageRoles && (
                  <button type="button" className="kpf-mini" onClick={() => setRolesOpen((open) => !open)}>
                    <Plus size={12} /> Gestionar
                  </button>
                )}
              </h3>
              <div className="kpf-roles">
                {isSpaceOwner && <span className="kpf-role"><i style={{ background: '#f4f5f7' }} />Creador</span>}
                {memberRoles.map((role) => (
                  <span key={role.id} className="kpf-role"><i style={{ background: role.color }} />{role.name}</span>
                ))}
                {!isSpaceOwner && memberRoles.length === 0 && <span className="kpf-muted">Sin roles</span>}
              </div>
              {rolesOpen && canManageRoles && (
                <div className="kpf-role-menu">
                  {serverRoles.filter((role) => role.name !== '@everyone').map((role) => {
                    const has = (user.roles || []).includes(role.id);
                    return (
                      <button key={role.id} type="button" onClick={() => toggleMemberRole(activeServer!.id, user.id, role.id)}>
                        <i style={{ background: role.color }} />
                        <span>{role.name}</span>
                        {has && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          <footer className="kpf-actions">
            {isMe ? (
              <button type="button" className="kpf-btn-metal kpf-wide" onClick={() => { closeUserProfile(); setIsSettingsOpen(true); }}>
                <Pencil size={14} /> Editar perfil
              </button>
            ) : (
              <>
                <form className="kpf-inline" onSubmit={sendQuick}>
                  <input value={quickMsg} onChange={(e) => setQuickMsg(e.target.value)} placeholder={`Mensaje para ${shownName}`} />
                  <button type="submit" className="kpf-btn-metal" disabled={!quickMsg.trim()} aria-label="Enviar mensaje"><Send size={15} /></button>
                </form>
                <div className="kpf-row">
                  <button type="button" className="kpf-btn-ghost" onClick={() => addFriend(user.id)}><UserPlus size={14} /> Amistad</button>
                  <button type="button" className="kpf-btn-ghost" onClick={report}><Flag size={14} /> Reportar</button>
                  <button type="button" className="kpf-btn-danger" onClick={block}><Ban size={14} /> Bloquear</button>
                </div>
              </>
            )}
          </footer>
        </div>
      </article>
    </div>
  );
};
