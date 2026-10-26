import React, { useEffect, useMemo, useState } from 'react';
import { isVoiceLike } from '../../utils/channels';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, type SpaceEvent } from '../../services/apiClient';
import { getSocket } from '../../services/socketClient';
import { useApp, permissionsIn } from '../../context/AppContext';
import type { Server } from '../../types';
import '../../styles/events.css';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const pad = (value: number) => String(value).padStart(2, '0');
const toLocalInput = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
const formatWhen = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Space calendar: month view, upcoming list, "Me interesa" and (for managers) new events. */
export const EventsModal: React.FC<{ server: Server; onClose: () => void }> = ({ server, onClose }) => {
  const { currentUser, setActiveChannelId, setIsDMViewActive } = useApp();
  const perms = permissionsIn(server, currentUser.id);
  const canCreate = perms.has('MANAGE_SERVER') || perms.has('MANAGE_CHANNELS');
  const [events, setEvents] = useState<SpaceEvent[] | null>(null);
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(() => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    return { title: '', description: '', startsAt: toLocalInput(start), channelId: '' };
  });

  useEffect(() => {
    let alive = true;
    const load = () => api.getEvents(server.id).then((items) => { if (alive) setEvents(items); }).catch(() => { if (alive) setEvents([]); });
    void load();
    const socket = getSocket();
    const onChanged = ({ spaceId }: { spaceId: string }) => { if (spaceId === server.id) void load(); };
    socket.on('event:changed', onChanged);
    return () => { alive = false; socket.off('event:changed', onChanged); };
  }, [server.id]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const byDay = useMemo(() => {
    const map = new Map<string, SpaceEvent[]>();
    for (const event of events || []) {
      const key = dayKey(new Date(event.startsAt));
      map.set(key, [...(map.get(key) || []), event]);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const offset = (month.getDay() + 6) % 7; // Monday first
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [month]);

  const shown = selectedDay ? byDay.get(selectedDay) || [] : events || [];
  const todayKey = dayKey(new Date());

  const replace = (updated: SpaceEvent) => setEvents((prev) => (prev || []).map((item) => item.id === updated.id ? updated : item));
  const toggleInterest = async (event: SpaceEvent) => {
    try { replace(await api.setEventInterest(event.id, !event.meInterested)); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo guardar.'); }
  };
  const cancel = async (event: SpaceEvent) => {
    try { await api.cancelEvent(event.id); setEvents((prev) => (prev || []).filter((item) => item.id !== event.id)); toast.success('Evento cancelado'); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo cancelar.'); }
  };
  const create = async (submit: React.FormEvent) => {
    submit.preventDefault();
    try {
      const created = await api.createEvent(server.id, {
        title: form.title,
        description: form.description,
        startsAt: new Date(form.startsAt).toISOString(),
        channelId: form.channelId || undefined,
      });
      setEvents((prev) => [...(prev || []), created].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setIsCreating(false);
      setForm((prev) => ({ ...prev, title: '', description: '' }));
      toast.success('Evento creado: se avisará 15 min antes a los interesados');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el evento.');
    }
  };
  const openChannel = (channelId: string) => { setIsDMViewActive(false); setActiveChannelId(channelId); onClose(); };
  const channelName = (id?: string) => server.channels.find((channel) => channel.id === id)?.name;

  return createPortal(
    <div className="kev-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="kev" role="dialog" aria-modal="true" aria-label={`Eventos de ${server.name}`}>
        <header className="kev-head">
          <CalendarDays size={18} />
          <h2>Eventos · {server.name}</h2>
          {canCreate && !isCreating && (
            <button type="button" className="kev-primary" onClick={() => setIsCreating(true)}><Plus size={14} /> Nuevo evento</button>
          )}
          <button type="button" className="kev-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </header>

        <div className="kev-body">
          <div className="kev-cal">
            <div className="kev-cal-head">
              <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mes anterior"><ChevronLeft size={16} /></button>
              <strong>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
              <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Mes siguiente"><ChevronRight size={16} /></button>
            </div>
            <div className="kev-grid">
              {WEEKDAYS.map((day) => <span key={day} className="kev-wd">{day}</span>)}
              {cells.map((date) => {
                const key = dayKey(date);
                const count = byDay.get(key)?.length || 0;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`kev-day ${date.getMonth() !== month.getMonth() ? 'is-out' : ''} ${key === todayKey ? 'is-today' : ''} ${key === selectedDay ? 'is-selected' : ''}`}
                    onClick={() => setSelectedDay(key === selectedDay ? null : key)}
                    aria-label={`${date.toLocaleDateString()}${count ? `, ${count} evento(s)` : ''}`}
                  >
                    {date.getDate()}
                    {count > 0 && <i />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="kev-list">
            {isCreating && (
              <form className="kev-form" onSubmit={create}>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título del evento" maxLength={100} required autoFocus />
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción (opcional)" maxLength={1000} rows={2} />
                <div className="kev-form-row">
                  <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
                  <select value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })}>
                    <option value="">Sin canal</option>
                    {server.channels.map((channel) => <option key={channel.id} value={channel.id}>{isVoiceLike(channel.type) ? '🔊' : '#'} {channel.name}</option>)}
                  </select>
                </div>
                <div className="kev-form-row">
                  <button type="button" className="kev-ghost" onClick={() => setIsCreating(false)}>Cancelar</button>
                  <button type="submit" className="kev-primary">Crear evento</button>
                </div>
              </form>
            )}
            <h3>{selectedDay ? 'Eventos del día' : 'Próximos eventos'}</h3>
            {events === null ? <p className="kev-empty">Cargando…</p> : shown.length === 0 ? (
              <p className="kev-empty">{selectedDay ? 'Nada este día.' : canCreate ? 'Aún no hay eventos. ¡Crea el primero!' : 'Aún no hay eventos programados.'}</p>
            ) : shown.map((event) => (
              <article key={event.id} className="kev-item">
                <div className="kev-date">
                  <b>{new Date(event.startsAt).getDate()}</b>
                  <span>{new Date(event.startsAt).toLocaleDateString(undefined, { month: 'short' })}</span>
                </div>
                <div className="kev-info">
                  <strong>{event.title}</strong>
                  <small>{formatWhen(event.startsAt)}{event.channelId && channelName(event.channelId) ? ' · ' : ''}
                    {event.channelId && channelName(event.channelId) && <button type="button" className="kev-link" onClick={() => openChannel(event.channelId!)}>{channelName(event.channelId)}</button>}
                  </small>
                  {event.description && <p>{event.description}</p>}
                </div>
                <div className="kev-actions">
                  <button type="button" className={`kev-interest ${event.meInterested ? 'is-on' : ''}`} onClick={() => toggleInterest(event)} aria-pressed={event.meInterested}>
                    <Star size={13} /> {event.interested}
                  </button>
                  {(canCreate || event.createdBy === currentUser.id) && (
                    <button type="button" className="kev-icon" onClick={() => cancel(event)} title="Cancelar evento" aria-label="Cancelar evento"><Trash2 size={14} /></button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
};
