import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Bookmark,
  Compass,
  FileText,
  Hash,
  Headphones,
  HeadphoneOff,
  Megaphone,
  Mic,
  MicOff,
  PhoneOff,
  Plus,
  Search,
  Settings,
  UserPlus,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp, permissionsIn } from '../../context/AppContext';
import { VerifiedBadge } from '../Common/VerifiedBadge';
import { Avatar } from '../Common/Avatar';
import type { Channel } from '../../types';
import '../../styles/console.css';

const cleanName = (name: string) => name.replace(/^.*?[│|]\s*/, '').replace(/^#+\s*/, '');
const monogram = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'K';

const channelIcon = (channel: Channel) => {
  if (channel.type === 'voice') return Volume2;
  if (channel.type === 'announcements') return Megaphone;
  if (channel.type === 'notes') return FileText;
  return Hash;
};

interface ConsoleSidebarProps {
  /** Called after navigating, so the mobile drawer can close itself. */
  onNavigate?: () => void;
}

/**
 * Kova's "chrome console": a rail of spaces plus an organised channel panel
 * (text and voice sections, live voice presence, voice controls).
 */
export const ConsoleSidebar: React.FC<ConsoleSidebarProps> = ({ onNavigate }) => {
  const {
    servers,
    activeServer,
    activeChannel,
    currentUser,
    messages,
    unreadNotificationsCount,
    isDMViewActive,
    isInVoice,
    activeVoiceChannelId,
    voicePeers,
    connectingVoiceChannelId,
    setActiveServerId,
    setActiveChannelId,
    setIsDMViewActive,
    setIsCreateServerOpen,
    setIsCreateChannelOpen,
    setIsDiscoveryOpen,
    setIsPinnedDrawerOpen,
    setIsNotificationsOpen,
    setIsSettingsOpen,
    setIsServerSettingsOpen,
    openInviteModal,
    openUserProfile,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    layoutMode,
    setLayoutMode,
  } = useApp();
  const canManageChannels = permissionsIn(activeServer, currentUser.id).has('MANAGE_CHANNELS');

  const [query, setQuery] = useState('');
  const pinnedCount = messages.filter((message) => message.pinned).length;
  const isPulseActive = layoutMode === 'pulse_feed' && !isDMViewActive;

  const sections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const visible = (activeServer?.channels || []).filter((channel) => !normalized || cleanName(channel.name).toLowerCase().includes(normalized));
    return [
      { id: 'text', title: 'Texto', channels: visible.filter((channel) => channel.type !== 'voice') },
      { id: 'voice', title: 'Voz', channels: visible.filter((channel) => channel.type === 'voice') },
    ].filter((section) => section.channels.length > 0);
  }, [activeServer?.channels, query]);

  const liveVoiceChannel = activeServer?.channels.find((channel) => channel.id === activeVoiceChannelId);

  const goHome = () => {
    setIsDMViewActive(true);
    onNavigate?.();
  };

  const openSpace = (serverId: string) => {
    setActiveServerId(serverId);
    setIsDMViewActive(false);
    if (layoutMode === 'pulse_feed') setLayoutMode('split');
  };

  const togglePulse = () => {
    setIsDMViewActive(false);
    setLayoutMode(isPulseActive ? 'split' : 'pulse_feed');
    onNavigate?.();
  };

  const openChannel = (channel: Channel) => {
    setIsDMViewActive(false);
    if (layoutMode === 'pulse_feed') setLayoutMode('split');
    setActiveChannelId(channel.id);
    if (channel.type === 'voice' && !(isInVoice && activeVoiceChannelId === channel.id)) {
      void joinVoiceChannel(channel.id);
    }
    onNavigate?.();
  };

  return (
    <aside className="kova-console" aria-label="Navegación de Kova">
      {/* Rail of spaces */}
      <nav className="kova-rail" aria-label="Tus espacios">
        <button type="button" className={`kova-rail-home ${isDMViewActive ? 'is-active' : ''}`} onClick={goHome} title="Inicio y mensajes directos">
          <img src="/kova-chrome-cube.png" alt="" />
        </button>
        <span className="kova-rail-divider" />
        <div className="kova-rail-spaces custom-scrollbar">
          {servers.map((server) => {
            const active = !isDMViewActive && activeServer?.id === server.id;
            return (
              <button
                type="button"
                key={server.id}
                className={`kova-rail-space ${active ? 'is-active' : ''}`}
                onClick={() => openSpace(server.id)}
                title={server.name}
                aria-current={active ? 'true' : undefined}
              >
                {server.icon ? <img src={server.icon} alt="" /> : <span>{monogram(server.name)}</span>}
              </button>
            );
          })}
          <button type="button" className="kova-rail-action" onClick={() => setIsCreateServerOpen(true)} title="Crear espacio" aria-label="Crear espacio">
            <Plus size={18} />
          </button>
          <button type="button" className="kova-rail-action" onClick={() => setIsDiscoveryOpen(true)} title="Descubrir comunidades" aria-label="Descubrir comunidades">
            <Compass size={18} />
          </button>
        </div>
        <div className="kova-rail-foot">
          <button type="button" className="kova-rail-action" onClick={() => setIsSettingsOpen(true)} title="Ajustes" aria-label="Ajustes">
            <Settings size={18} />
          </button>
        </div>
      </nav>

      {/* Channel panel */}
      <section className="kova-channels">
        <header className="kova-channels-head">
          <button type="button" className="kova-channels-title" onClick={() => setIsServerSettingsOpen(true)} title="Ajustes del espacio">
            <span>{activeServer?.name || 'Kova'}</span>
            {activeServer?.verified && <VerifiedBadge size={15} label="Espacio verificado" />}
            <Settings size={14} />
          </button>
          <button type="button" className="kova-icon-btn" onClick={() => openInviteModal()} title="Invitar personas" aria-label="Invitar personas">
            <UserPlus size={16} />
          </button>
        </header>

        <div className="kova-channels-tools">
          <button type="button" className={isPulseActive ? 'is-active' : ''} onClick={togglePulse} title="Pulse: resumen de tu espacio">
            <Activity size={15} /> Pulse
          </button>
          <button type="button" onClick={() => setIsPinnedDrawerOpen(true)} title="Mensajes guardados">
            <Bookmark size={15} /> Guardado {pinnedCount > 0 && <b>{pinnedCount}</b>}
          </button>
          <button type="button" onClick={() => setIsNotificationsOpen(true)} title="Actividad">
            <Bell size={15} /> {unreadNotificationsCount > 0 && <b>{unreadNotificationsCount}</b>}
          </button>
        </div>

        <label className="kova-channels-search">
          <Search size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar canal" />
        </label>

        <div className="kova-channels-list custom-scrollbar">
          {sections.length === 0 && (
            <p className="kova-channels-empty">{query ? 'Ningún canal coincide.' : 'Este espacio aún no tiene canales.'}</p>
          )}
          {sections.map((section) => (
            <div key={section.id} className="kova-channels-section">
              <div className="kova-channels-section-head">
                <span>{section.title}</span>
                {canManageChannels && (
                <button type="button" onClick={() => setIsCreateChannelOpen(true)} title="Crear canal" aria-label="Crear canal">
                  <Plus size={13} />
                </button>
                )}
              </div>
              {section.channels.map((channel) => {
                const Icon = channelIcon(channel);
                const isActive = !isDMViewActive && !isPulseActive && activeChannel?.id === channel.id;
                const isLive = channel.type === 'voice' && activeVoiceChannelId === channel.id;
                return (
                  <div key={channel.id}>
                    <button
                      type="button"
                      className={`kova-channel ${isActive ? 'is-active' : ''} ${isLive ? 'is-live' : ''}`}
                      onClick={() => openChannel(channel)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon size={16} />
                      <span className="kova-channel-name">{cleanName(channel.name)}</span>
                      {channel.unreadCount ? <b className="kova-channel-badge">{channel.unreadCount}</b> : null}
                    </button>
                    {channel.type === 'voice' && connectingVoiceChannelId === channel.id && !isLive && (
                      <ul className="kova-channel-peers" aria-live="polite">
                        <li>
                          <span className="kova-channel-peer is-connecting">
                            <Avatar src={currentUser.avatar} name={currentUser.displayName || currentUser.username} size={20} />
                            <span>{currentUser.displayName} (tú)</span>
                            <small>Conectando…</small>
                          </span>
                        </li>
                      </ul>
                    )}
                    {isLive && voicePeers.length > 0 && (
                      <ul className="kova-channel-peers">
                        {voicePeers.map((peer) => (
                          <li key={peer.id} className={peer.isSpeaking ? 'is-speaking' : ''}>
                            {(() => {
                              const member = activeServer?.members?.find((m) => m.id === peer.id);
                              const name = member?.nickname || member?.displayName || peer.name;
                              return (
                                <button
                                  type="button"
                                  className="kova-channel-peer"
                                  onClick={() => openUserProfile(member || (peer.isLocal ? currentUser : { id: peer.id, username: peer.name, displayName: peer.name, avatar: peer.avatar || '', tag: '0000', status: 'online' }))}
                                  title={`Ver perfil de ${name}`}
                                >
                                  <Avatar src={member?.avatar || peer.avatar} name={name} size={20} />
                                  <span>{peer.isLocal ? `${name} (tú)` : name}</span>
                                  {(member?.verified || (peer.isLocal && currentUser.verified)) && <VerifiedBadge size={12} />}
                                  {peer.isMuted && <MicOff size={12} aria-label="Silenciado" />}
                                </button>
                              );
                            })()}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {isInVoice && liveVoiceChannel && (
          <div className="kova-voicebar" role="region" aria-label="Conexión de voz">
            <div className="kova-voicebar-info">
              <span className="kova-voicebar-dot" />
              <div>
                <strong>Voz conectada</strong>
                <small>{cleanName(liveVoiceChannel.name)}</small>
              </div>
            </div>
            <div className="kova-voicebar-actions">
              <button type="button" onClick={toggleMute} title={currentUser.isMuted ? 'Activar micrófono' : 'Silenciar'} aria-pressed={Boolean(currentUser.isMuted)}>
                {currentUser.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
              <button type="button" onClick={toggleDeafen} title={currentUser.isDeafened ? 'Activar audio' : 'Ensordecer'} aria-pressed={Boolean(currentUser.isDeafened)}>
                {currentUser.isDeafened ? <HeadphoneOff size={15} /> : <Headphones size={15} />}
              </button>
              <button type="button" className="is-danger" onClick={() => { leaveVoiceChannel(); toast.info('Saliste de la sala de voz'); }} title="Salir de la sala" aria-label="Salir de la sala">
                <PhoneOff size={15} />
              </button>
            </div>
          </div>
        )}

        <footer className="kova-channels-me">
          <Avatar src={currentUser.avatar} name={currentUser.displayName || currentUser.username} size={34} onClick={() => openUserProfile(currentUser)} />
          <div>
            <strong>{currentUser.displayName}</strong>
            <small>{currentUser.customStatus || 'En línea'}</small>
          </div>
        </footer>
      </section>
    </aside>
  );
};
