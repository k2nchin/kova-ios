import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Megaphone, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/apiClient';
import { useApp, permissionsIn } from '../../context/AppContext';
import type { Channel } from '../../types';
import '../../styles/community.css';

/** Follow an announcement channel: its new posts are copied into a channel of a space you manage. */
export const FollowChannelModal: React.FC<{ channel: Channel; onClose: () => void }> = ({ channel, onClose }) => {
  const { servers, currentUser } = useApp();
  const [followers, setFollowers] = useState<{ count: number; mine: Array<{ channelId: string; channelName: string; spaceName: string }> } | null>(null);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);

  const targets = servers
    .filter((server) => permissionsIn(server, currentUser.id).has('MANAGE_CHANNELS'))
    .flatMap((server) => server.channels.filter((c) => (c.type === 'text' || c.type === 'announcements') && c.id !== channel.id).map((c) => ({ id: c.id, label: `${server.name} · #${c.name}` })));

  const load = () => api.getFollowers(channel.id).then(setFollowers).catch(() => setFollowers({ count: 0, mine: [] }));
  useEffect(() => { void load(); }, [channel.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = async (targetChannelId: string, follow: boolean) => {
    setBusy(true);
    try {
      await api.followChannel(channel.id, targetChannelId, follow);
      toast.success(follow ? 'Siguiendo: los nuevos anuncios llegarán a ese canal' : 'Has dejado de seguir el canal');
      setTarget('');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el seguimiento.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="kfol-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="kfol" role="dialog" aria-modal="true" aria-label="Seguir canal de anuncios">
        <header>
          <Megaphone size={17} />
          <h2>Seguir #{channel.name}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
        </header>
        <p>Cada anuncio nuevo se publicará también en el canal que elijas de tus espacios. {followers ? `${followers.count} ${followers.count === 1 ? 'canal lo sigue' : 'canales lo siguen'}.` : ''}</p>

        {targets.length === 0 ? (
          <p className="kfol-empty">Necesitas gestionar canales en algún espacio para seguir anuncios.</p>
        ) : (
          <div className="kfol-row">
            <select value={target} onChange={(event) => setTarget(event.target.value)} aria-label="Canal que recibirá los anuncios">
              <option value="">Elige un canal…</option>
              {targets.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <button type="button" disabled={!target || busy} onClick={() => void change(target, true)}>Seguir</button>
          </div>
        )}

        {followers && followers.mine.length > 0 && (
          <ul className="kfol-list">
            {followers.mine.map((item) => (
              <li key={item.channelId}>
                <span>{item.spaceName} · #{item.channelName}</span>
                <button type="button" disabled={busy} onClick={() => void change(item.channelId, false)}>Dejar de seguir</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>,
    document.body,
  );
};
