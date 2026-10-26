import React, { useEffect, useState } from 'react';
import { AlarmClock, Bookmark, Clock, Loader2, Pin, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { Avatar } from '../Common/Avatar';
import { VerifiedBadge } from '../Common/VerifiedBadge';
import '../../styles/savedDrawer.css';

interface PinnedMessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SavedItem = Awaited<ReturnType<typeof api.getSaved>>[number];

const when = (iso: string) => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Your saved messages (any space) and the pins of the current channel. */
export const PinnedMessagesDrawer: React.FC<PinnedMessagesDrawerProps> = ({ isOpen, onClose }) => {
  const { messages, activeChannel, togglePinMessage, toggleSaveMessage, savedMessageIds, setActiveChannelId, setActiveServerId, setIsDMViewActive } = useApp();
  const [tab, setTab] = useState<'saved' | 'pinned' | 'later'>('saved');
  const [scheduled, setScheduled] = useState<Awaited<ReturnType<typeof api.getScheduled>> | null>(null);
  const [reminders, setReminders] = useState<Awaited<ReturnType<typeof api.getReminders>> | null>(null);
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<SavedItem[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSaved(null);
    api.getSaved().then(setSaved).catch((error) => { setSaved([]); toast.error(error instanceof Error ? error.message : 'No se pudieron cargar tus guardados.'); });
    api.getScheduled().then(setScheduled).catch(() => setScheduled([]));
    api.getReminders().then(setReminders).catch(() => setReminders([]));
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const needle = query.trim().toLowerCase();
  const matches = (text: string, author: string) => !needle || `${text} ${author}`.toLowerCase().includes(needle);
  const savedList = (saved || []).filter((item) => savedMessageIds.has(item.id) && matches(item.content, item.author.displayName));
  const pinned = messages.filter((message) => message.pinned && matches(message.content, message.author.displayName));

  const goTo = (serverId: string, channelId: string) => {
    setIsDMViewActive(false);
    setActiveServerId(serverId);
    setActiveChannelId(channelId);
    onClose();
  };

  return (
    <div className="ksd-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="ksd" role="dialog" aria-modal="true" aria-label="Guardados y fijados">
        <header className="ksd-head">
          <h2>{tab === 'saved' ? 'Guardados' : tab === 'later' ? 'Programados' : `Fijados en #${activeChannel?.name || 'canal'}`}</h2>
          <button type="button" className="ksd-close" onClick={onClose} aria-label="Cerrar"><X size={17} /></button>
        </header>
        <div className="ksd-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'saved'} className={tab === 'saved' ? 'is-on' : ''} onClick={() => setTab('saved')}>
            <Bookmark size={14} /> Guardados
          </button>
          <button type="button" role="tab" aria-selected={tab === 'pinned'} className={tab === 'pinned' ? 'is-on' : ''} onClick={() => setTab('pinned')}>
            <Pin size={14} /> Fijados
          </button>
          <button type="button" role="tab" aria-selected={tab === 'later'} className={tab === 'later' ? 'is-on' : ''} onClick={() => setTab('later')}>
            <Clock size={14} /> Programados
          </button>
        </div>
        <label className="ksd-search">
          <Search size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar por texto o persona" />
        </label>

        <div className="ksd-list">
          {tab === 'saved' && saved === null && <p className="ksd-empty"><Loader2 size={16} className="animate-spin" /> Cargando…</p>}
          {tab === 'saved' && saved !== null && savedList.length === 0 && (
            <p className="ksd-empty">{needle ? 'Nada coincide.' : 'Guarda mensajes con el marcador de cada mensaje para leerlos después. Solo tú los ves.'}</p>
          )}
          {tab === 'saved' && savedList.map((item) => (
            <article key={item.id} className="ksd-item">
              <Avatar src={item.author.avatar} name={item.author.displayName} size={30} />
              <div className="ksd-body">
                <div className="ksd-meta">
                  <strong>{item.author.displayName}</strong>
                  {item.author.verified && <VerifiedBadge size={12} />}
                  <span>{item.serverName} · #{item.channelName}</span>
                  <time>{when(item.createdAt)}</time>
                </div>
                <p>{item.content || <i>Archivo adjunto</i>}</p>
                <div className="ksd-actions">
                  <button type="button" onClick={() => goTo(item.serverId, item.channelId)}>Ir al canal</button>
                  <button type="button" onClick={() => void toggleSaveMessage(item.id)}>Quitar</button>
                </div>
              </div>
            </article>
          ))}

          {tab === 'later' && (scheduled === null || reminders === null) && <p className="ksd-empty"><Loader2 size={16} className="animate-spin" /> Cargando…</p>}
          {tab === 'later' && scheduled?.length === 0 && reminders?.length === 0 && (
            <p className="ksd-empty">Programa un mensaje con el reloj junto a Enviar, o pide un recordatorio desde el menú de un mensaje.</p>
          )}
          {tab === 'later' && scheduled?.map((item) => (
            <article key={item.id} className="ksd-item">
              <span className="ksd-icon"><Clock size={16} /></span>
              <div className="ksd-body">
                <div className="ksd-meta"><strong>Mensaje programado</strong><span>{item.serverName} · #{item.channelName}</span><time>{when(item.sendAt)}</time></div>
                <p>{item.content}</p>
                <div className="ksd-actions">
                  <button type="button" onClick={() => { void api.cancelScheduled(item.id).then(() => { setScheduled((prev) => (prev || []).filter((s) => s.id !== item.id)); toast.success('Envío cancelado'); }); }}>Cancelar envío</button>
                </div>
              </div>
            </article>
          ))}
          {tab === 'later' && reminders?.map((item) => (
            <article key={item.id} className="ksd-item">
              <span className="ksd-icon"><AlarmClock size={16} /></span>
              <div className="ksd-body">
                <div className="ksd-meta"><strong>Recordatorio</strong><time>{when(item.remindAt)}</time></div>
                <p>{item.note}</p>
                <div className="ksd-actions">
                  <button type="button" onClick={() => { void api.cancelReminder(item.id).then(() => { setReminders((prev) => (prev || []).filter((r) => r.id !== item.id)); toast.success('Recordatorio quitado'); }); }}>Quitar</button>
                </div>
              </div>
            </article>
          ))}

          {tab === 'pinned' && pinned.length === 0 && <p className="ksd-empty">{needle ? 'Nada coincide.' : 'Este canal no tiene mensajes fijados.'}</p>}
          {tab === 'pinned' && pinned.map((message) => (
            <article key={message.id} className="ksd-item">
              <Avatar src={message.author.avatar} name={message.author.displayName} size={30} />
              <div className="ksd-body">
                <div className="ksd-meta">
                  <strong>{message.author.displayName}</strong>
                  <time>{message.timestamp}</time>
                </div>
                <p>{message.content || <i>Archivo adjunto</i>}</p>
                <div className="ksd-actions">
                  <button type="button" onClick={() => togglePinMessage(message.id)}>Desfijar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
};
