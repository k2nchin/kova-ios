import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Bookmark,
  Compass,
  MessageCircle,
  Home,
  Moon,
  Plus,
  Radio,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

const cleanName = (name: string) => name.replace(/^.*?[│|]\s*/, '').replace(/^#+\s*/, '');

export const UnifiedNavSidebar: React.FC = () => {
  const {
    servers,
    activeServer,
    activeChannel,
    currentUser,
    messages,
    unreadNotificationsCount,
    isInVoice,
    activeVoiceChannelId,
    setActiveServerId,
    setActiveChannelId,
    setIsDMViewActive,
    setIsCreateServerOpen,
    setIsDiscoveryOpen,
    setIsPinnedDrawerOpen,
    setIsNotificationsOpen,
    setIsSettingsOpen,
    openUserProfile,
    joinVoiceChannel,
    leaveVoiceChannel,
    layoutMode,
    setLayoutMode,
  } = useApp();

  const [query, setQuery] = useState('');
  const pinnedCount = messages.filter((message) => message.pinned).length;
  const isPulseActive = layoutMode === 'pulse_feed';

  const togglePulse = () => {
    const next = isPulseActive ? 'split' : 'pulse_feed';
    setIsDMViewActive(false);
    setLayoutMode(next);
    if (next === 'pulse_feed') {
      toast.success('Pulse activo · el pulso de tu espacio');
    }
  };

  const signals = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (activeServer?.channels || []).filter((channel) => {
      if (channel.type !== 'text' && channel.type !== 'voice') return false;
      return !normalized || cleanName(channel.name).toLowerCase().includes(normalized);
    });
  }, [activeServer?.channels, query]);

  const openSignal = (channelId: string, type: string, name: string) => {
    setIsDMViewActive(false);
    if (isPulseActive) setLayoutMode('split');
    setActiveChannelId(channelId);
    if (type === 'voice') {
      if (isInVoice && activeVoiceChannelId === channelId) {
        leaveVoiceChannel();
        toast.info(`Saliste de ${cleanName(name)}`);
      } else {
        joinVoiceChannel(channelId);
        toast.success(`Entraste a ${cleanName(name)}`);
      }
    }
  };

  return (
    <aside className="kova-sidebar kova-inbox h-full flex flex-col select-none text-[#dbdee1]">
      <div className="kova-inbox-head">
        <div>
          <h2>Bandeja de Kova</h2>
        </div>
        <div className="kova-inbox-head-actions">
          <button type="button" onClick={() => setIsCreateServerOpen(true)} title="Crear espacio"><Plus size={16} /></button>
          <button type="button" onClick={() => setIsSettingsOpen(true)} title="Personalizar Kova"><Settings size={15} /></button>
        </div>
      </div>

      <div className="kova-inbox-actions" aria-label="Acciones rápidas">
        <button type="button" className={isPulseActive ? 'is-active' : ''} onClick={togglePulse} title="Pulse · Resumen IA de tu espacio (Alt+P)"><Activity size={16} /><span>Pulse</span></button>
        <button type="button" onClick={() => setIsDMViewActive(true)} title="Inicio y amigos"><Home size={16} /><span>Inicio y amigos</span></button>
        <button type="button" onClick={() => setIsDiscoveryOpen(true)} title="Descubrir comunidades"><Compass size={16} /><span>Descubrir</span></button>
        <button type="button" onClick={() => setIsPinnedDrawerOpen(true)} title="Mensajes guardados"><Bookmark size={16} /><span>Guardado</span>{pinnedCount > 0 && <b>{pinnedCount}</b>}</button>
        <button type="button" onClick={() => setIsNotificationsOpen(true)} title="Actividad y notificaciones"><Bell size={16} /><span>Actividad</span>{unreadNotificationsCount > 0 && <b>{unreadNotificationsCount}</b>}</button>
      </div>

      <div className="kova-space-chips" aria-label="Tus espacios">
        {servers.map((server) => (
          <button
            type="button"
            key={server.id}
            className={activeServer?.id === server.id ? 'is-active' : ''}
            onClick={() => { setActiveServerId(server.id); setIsDMViewActive(false); }}
            title={server.name}
          >
            {server.icon ? <img src={server.icon} alt="" /> : <Sparkles size={15} />}
            <span>{server.name}</span>
          </button>
        ))}
        <button type="button" className="is-add" onClick={() => setIsCreateServerOpen(true)} title="Nuevo espacio"><Plus size={15} /></button>
      </div>

      <label className="kova-inbox-search">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar una señal..." />
        <kbd>{signals.length}</kbd>
      </label>

      <div className="kova-signal-list custom-scrollbar">
        <div className="kova-signal-list-title">
          <span>SEÑALES RECIENTES</span>
          <i />
        </div>

        {signals.length === 0 ? (
          <div className="kova-inbox-empty">
            <img src="/kova-chrome-cube.png" alt="" />
            <strong>No encontramos señales</strong>
            <span>Prueba con otro nombre.</span>
          </div>
        ) : signals.map((channel) => {
          const isVoice = channel.type === 'voice';
          const isActive = activeChannel?.id === channel.id;
          const isLive = isVoice && isInVoice && activeVoiceChannelId === channel.id;
          return (
            <button
              type="button"
              key={channel.id}
              className={`kova-signal-card ${isActive ? 'is-active' : ''} ${isLive ? 'is-live' : ''}`}
              onClick={() => openSignal(channel.id, channel.type, channel.name)}
            >
              <span className="kova-signal-icon">{isVoice ? <Radio size={17} /> : <MessageCircle size={17} />}</span>
              <span className="kova-signal-copy">
                <strong>{cleanName(channel.name)}</strong>
                <small>{isVoice ? (isLive ? 'Conectado ahora' : 'Sala abierta') : (channel.topic || 'Conversación disponible')}</small>
              </span>
              {channel.unreadCount ? <b className="kova-signal-badge">{channel.unreadCount}</b> : <span className="kova-signal-arrow">›</span>}
            </button>
          );
        })}
      </div>

      <div className="kova-inbox-profile">
        <button type="button" onClick={() => openUserProfile(currentUser)}>
          <span className="kova-profile-avatar">
            <img src={currentUser.avatar} alt="" />
            <i />
          </span>
          <span><strong>{currentUser.displayName}</strong><small>Tu señal está activa</small></span>
        </button>
        <button type="button" onClick={() => setIsSettingsOpen(true)} title="Tema y apariencia"><Moon size={16} /></button>
      </div>
    </aside>
  );
};
