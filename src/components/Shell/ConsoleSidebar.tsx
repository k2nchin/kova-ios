import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Bookmark,
  CalendarDays,
  Trophy,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  X,
  Compass,
  FileText,
  Hash,
  Headphones,
  Lock,
  HeadphoneOff,
  Megaphone,
  MessagesSquare,
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
import { EventsModal } from '../Modals/EventsModal';
import { LeaderboardModal } from '../Community/Levels';
import '../../styles/console.css';

const cleanName = (name: string) => name.replace(/^.*?[│|]\s*/, '').replace(/^#+\s*/, '');
type ChannelFolder = { id: string; name: string; channelIds: string[]; collapsed?: boolean };
const FOLDERS_KEY = 'kova.channelFolders.v1';
const readFolders = (): Record<string, ChannelFolder[]> => {
  try { return JSON.parse(localStorage.getItem(FOLDERS_KEY) || '{}'); } catch { return {}; }
};

const monogram = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'K';

const channelIcon = (channel: Channel) => {
  if (channel.type === 'voice') return Volume2;
  if (channel.type === 'announcements') return Megaphone;
  if (channel.type === 'forum') return MessagesSquare;
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
    voiceOccupancy,
    savedMessageIds,
    unreadByChannel,
    preferences,
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
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const closeLeaderboard = useCallback(() => setIsLeaderboardOpen(false), []);
  const savedCount = savedMessageIds.size;
  const isPulseActive = layoutMode === 'pulse_feed' && !isDMViewActive;

  // Personal channel folders (only you see them), saved per space on this device.
  const [allFolders, setAllFolders] = useState<Record<string, ChannelFolder[]>>(readFolders);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [channelMenu, setChannelMenu] = useState<{ channelId: string; x: number; y: number } | null>(null);
  const spaceId = activeServer?.id || '';
  const folders = useMemo(() => allFolders[spaceId] || [], [allFolders, spaceId]);
  const saveFolders = (next: ChannelFolder[]) => setAllFolders((prev) => {
    const updated = { ...prev, [spaceId]: next };
    try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(updated)); } catch { /* storage unavailable */ }
    return updated;
  });
  const createFolder = (channelId?: string) => {
    const id = `f_${crypto.randomUUID().slice(0, 8)}`;
    const cleaned = folders.map((folder) => ({ ...folder, channelIds: folder.channelIds.filter((other) => other !== channelId) }));
    saveFolders([...cleaned, { id, name: 'Nueva carpeta', channelIds: channelId ? [channelId] : [] }]);
    setEditingFolderId(id);
  };
  const renameFolder = (folderId: string, name: string) => {
    setEditingFolderId(null);
    saveFolders(folders.map((folder) => folder.id === folderId ? { ...folder, name: name.trim().slice(0, 40) || folder.name } : folder));
  };
  const moveToFolder = (channelId: string, folderId: string | null) =>
    saveFolders(folders.map((folder) => {
      const rest = folder.channelIds.filter((id) => id !== channelId);
      return { ...folder, channelIds: folder.id === folderId ? [...rest, channelId] : rest };
    }));
  const moveInFolder = (channelId: string, delta: number) =>
    saveFolders(folders.map((folder) => {
      const index = folder.channelIds.indexOf(channelId);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= folder.channelIds.length) return folder;
      const ids = [...folder.channelIds];
      [ids[index], ids[target]] = [ids[target], ids[index]];
      return { ...folder, channelIds: ids };
    }));
  const toggleFolder = (folderId: string) => saveFolders(folders.map((folder) => folder.id === folderId ? { ...folder, collapsed: !folder.collapsed } : folder));
  const deleteFolder = (folderId: string) => saveFolders(folders.filter((folder) => folder.id !== folderId));
  useEffect(() => {
    if (!channelMenu) return;
    const close = () => setChannelMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('keydown', close);
    return () => { window.removeEventListener('click', close); window.removeEventListener('keydown', close); };
  }, [channelMenu]);

  const sections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const visible = (activeServer?.channels || []).filter((channel) => !normalized || cleanName(channel.name).toLowerCase().includes(normalized));
    const inFolder = new Set(folders.flatMap((folder) => folder.channelIds));
    const folderSections = folders.map((folder) => ({
      id: folder.id,
      title: folder.name,
      folder: folder as ChannelFolder | undefined,
      channels: folder.channelIds.map((id) => visible.find((channel) => channel.id === id)).filter((channel): channel is Channel => Boolean(channel)),
    })).filter((section) => !normalized || section.channels.length > 0);
    const rest = visible.filter((channel) => !inFolder.has(channel.id));
    return [
      ...folderSections,
      { id: 'text', title: 'Texto', folder: undefined, channels: rest.filter((channel) => channel.type !== 'voice') },
      { id: 'voice', title: 'Voz', folder: undefined, channels: rest.filter((channel) => channel.type === 'voice') },
    ].filter((section) => section.folder || section.channels.length > 0 || section.id === 'text');
  }, [activeServer?.channels, query, folders]);

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
            // A dot for unread messages, a number for @mentions (like Discord).
            const counts = server.channels.map((channel) => unreadByChannel[channel.id]).filter(Boolean);
            const spaceMentions = counts.reduce((sum, count) => sum + (count?.mentions || 0), 0);
            const spaceUnread = preferences.channelActivity && counts.some((count) => (count?.unread || 0) > 0);
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
                {!active && spaceUnread && !spaceMentions && <i className="kova-rail-unread" aria-label="Mensajes sin leer" />}
                {spaceMentions > 0 && <b className="kova-rail-mentions" aria-label={`${spaceMentions} menciones`}>{spaceMentions > 99 ? '99+' : spaceMentions}</b>}
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
            <Bookmark size={15} /> Guardado {savedCount > 0 && <b>{savedCount}</b>}
          </button>
          <button type="button" onClick={() => setIsLeaderboardOpen(true)} title="Clasificación y niveles" aria-label="Clasificación">
            <Trophy size={15} />
          </button>
          <button type="button" onClick={() => setIsEventsOpen(true)} title="Eventos del espacio" aria-label="Eventos">
            <CalendarDays size={15} />
          </button>
          <button type="button" onClick={() => setIsNotificationsOpen(true)} title="Actividad">
            <Bell size={15} /> {unreadNotificationsCount > 0 && <b>{unreadNotificationsCount}</b>}
          </button>
        </div>

        {isLeaderboardOpen && activeServer && <LeaderboardModal spaceId={activeServer.id} spaceName={activeServer.name} currentUserId={currentUser.id} onClose={closeLeaderboard} />}
        {isEventsOpen && activeServer && <EventsModal server={activeServer} onClose={() => setIsEventsOpen(false)} />}
        <label className="kova-channels-search">
          <Search size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar canal" />
        </label>

        {channelMenu && (() => {
          const current = folders.find((folder) => folder.channelIds.includes(channelMenu.channelId));
          const close = () => setChannelMenu(null);
          return (
            <div className="kova-folder-menu" style={{ left: Math.min(channelMenu.x, window.innerWidth - 220), top: Math.min(channelMenu.y, window.innerHeight - 260) }} onClick={(event) => event.stopPropagation()} role="menu">
              <small>Mis carpetas (solo tú las ves)</small>
              {folders.filter((folder) => folder.id !== current?.id).map((folder) => (
                <button key={folder.id} type="button" role="menuitem" onClick={() => { moveToFolder(channelMenu.channelId, folder.id); close(); }}>Mover a «{folder.name}»</button>
              ))}
              <button type="button" role="menuitem" onClick={() => { createFolder(channelMenu.channelId); close(); }}>Nueva carpeta con este canal…</button>
              {current && (
                <>
                  <button type="button" role="menuitem" onClick={() => { moveInFolder(channelMenu.channelId, -1); close(); }}>Subir</button>
                  <button type="button" role="menuitem" onClick={() => { moveInFolder(channelMenu.channelId, 1); close(); }}>Bajar</button>
                  <button type="button" role="menuitem" onClick={() => { moveToFolder(channelMenu.channelId, null); close(); }}>Sacar de «{current.name}»</button>
                </>
              )}
            </div>
          );
        })()}
        <div className="kova-channels-list custom-scrollbar">
          {sections.length === 0 && (
            <p className="kova-channels-empty">{query ? 'Ningún canal coincide.' : 'Este espacio aún no tiene canales.'}</p>
          )}
          {sections.map((section) => (
            <div key={section.id} className="kova-channels-section">
              <div className={`kova-channels-section-head ${section.folder ? 'is-folder' : ''}`}>
                {section.folder ? (
                  <>
                    {editingFolderId === section.folder.id ? (
                      <input
                        className="kova-folder-name-input"
                        defaultValue={section.title}
                        autoFocus
                        maxLength={40}
                        onFocus={(event) => event.target.select()}
                        onBlur={(event) => renameFolder(section.folder!.id, event.target.value)}
                        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur(); }}
                        aria-label="Nombre de la carpeta"
                      />
                    ) : (
                      <button type="button" className="kova-folder-toggle" onClick={() => toggleFolder(section.folder!.id)} onDoubleClick={() => setEditingFolderId(section.folder!.id)} title="Clic para plegar · doble clic para renombrar" aria-expanded={!section.folder.collapsed}>
                        {section.folder.collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                        <span>{section.title}</span>
                      </button>
                    )}
                    <button type="button" onClick={() => deleteFolder(section.folder!.id)} title="Quitar carpeta (los canales vuelven a su sitio)" aria-label="Quitar carpeta">
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <span>{section.title}</span>
                )}
                {section.id === 'text' && (
                  <button type="button" onClick={() => createFolder()} title="Nueva carpeta personal" aria-label="Nueva carpeta">
                    <FolderPlus size={13} />
                  </button>
                )}
                {!section.folder && canManageChannels && (
                <button type="button" onClick={() => setIsCreateChannelOpen(true)} title="Crear canal" aria-label="Crear canal">
                  <Plus size={13} />
                </button>
                )}
              </div>
              {section.folder && !section.folder.collapsed && section.channels.length === 0 && (
                <p className="kova-folder-empty">Clic derecho en un canal → Mover a «{section.title}»</p>
              )}
              {!section.folder?.collapsed && section.channels.map((channel) => {
                const Icon = channelIcon(channel);
                const isActive = !isDMViewActive && !isPulseActive && activeChannel?.id === channel.id;
                const isLive = channel.type === 'voice' && activeVoiceChannelId === channel.id;
                return (
                  <div key={channel.id}>
                    <button
                      type="button"
                      className={`kova-channel ${isActive ? 'is-active' : ''} ${isLive ? 'is-live' : ''}`}
                      onClick={() => openChannel(channel)}
                      onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); setChannelMenu({ channelId: channel.id, x: event.clientX, y: event.clientY }); }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon size={16} />
                      <span className="kova-channel-name">{cleanName(channel.name)}</span>
                      {channel.private && <Lock size={11} className="kova-channel-lock" aria-label="Privado" />}
                      {unreadByChannel[channel.id]?.mentions ? (
                        <b className="kova-channel-badge is-mention" aria-label="Te mencionaron">@{unreadByChannel[channel.id].mentions}</b>
                      ) : preferences.channelActivity && unreadByChannel[channel.id]?.unread ? (
                        <b className="kova-channel-badge" aria-label="Mensajes sin leer">{unreadByChannel[channel.id].unread > 99 ? '99+' : unreadByChannel[channel.id].unread}</b>
                      ) : null}
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
                    {channel.type === 'voice' && !isLive && connectingVoiceChannelId !== channel.id && (voiceOccupancy[channel.id] || []).length > 0 && (
                      <ul className="kova-channel-peers" aria-label={`En ${channel.name}`}>
                        {(voiceOccupancy[channel.id] || []).map((person) => {
                          const member = activeServer?.members?.find((m) => m.id === person.id);
                          const name = member?.nickname || member?.displayName || person.name;
                          return (
                            <li key={person.id}>
                              <button type="button" className="kova-channel-peer" onClick={() => member && openUserProfile(member)} title={`Ver perfil de ${name}`}>
                                <Avatar src={member?.avatar || person.avatar} name={name} size={20} />
                                <span>{name}</span>
                                {member?.verified && <VerifiedBadge size={12} />}
                              </button>
                            </li>
                          );
                        })}
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
