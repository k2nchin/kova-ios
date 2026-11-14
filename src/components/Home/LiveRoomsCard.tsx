import React, { useEffect, useState } from 'react';
import { Radio, Volume2 } from 'lucide-react';
import { api, getAuthToken, type LiveVoiceRoom } from '../../services/apiClient';
import { getSocket } from '../../services/socketClient';
import { useApp } from '../../context/AppContext';

/** Opens a channel full-screen in the phone shell. */
export const OPEN_CHANNEL_EVENT = 'kova:open-channel';

/**
 * "En la sala ahora": every voice room with people in it across your spaces,
 * friends first. One tap and you're in.
 */
export const LiveRoomsCard: React.FC = () => {
  const { setActiveServerId, joinVoiceChannel, activeVoiceChannelId } = useApp();
  const [rooms, setRooms] = useState<LiveVoiceRoom[]>([]);

  useEffect(() => {
    if (!getAuthToken()) return;
    let cancelled = false;
    let again: number | undefined;
    const load = () => api.getLiveVoice().then((list) => { if (!cancelled) setRooms(Array.isArray(list) ? list : []); }).catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 20_000);
    const socket = getSocket();
    const onVoice = () => { void load(); window.clearTimeout(again); again = window.setTimeout(load, 3000); };
    socket.on('voice:changed', onVoice);
    return () => { cancelled = true; window.clearInterval(timer); window.clearTimeout(again); socket.off('voice:changed', onVoice); };
  }, []);

  const visible = rooms.filter((room) => room.channelId !== activeVoiceChannelId);
  if (!visible.length) return null;

  const join = (room: LiveVoiceRoom) => {
    setActiveServerId(room.serverId);
    window.dispatchEvent(new CustomEvent(OPEN_CHANNEL_EVENT, { detail: { channelId: room.channelId } }));
    // Let the space load before joining its room.
    window.setTimeout(() => { void joinVoiceChannel(room.channelId); }, 60);
  };

  return (
    <section className="kova-live" aria-label="En la sala ahora">
      <header><Radio size={14} /> <span>En la sala ahora</span></header>
      <div className="kova-live-list">
        {visible.map((room) => {
          const shown = room.people.slice(0, 4);
          const friendNames = room.people.filter((p) => p.friend).map((p) => p.name);
          return (
            <button key={room.channelId} type="button" className="kova-live-room" onClick={() => join(room)} aria-label={`Unirte a ${room.channelName} en ${room.serverName}`}>
              <span className="kova-live-faces">
                {shown.map((p) => <img key={p.id} src={p.avatar || undefined} alt={p.name} className={p.friend ? 'is-friend' : ''} />)}
                {room.people.length > shown.length && <b>+{room.people.length - shown.length}</b>}
              </span>
              <span className="kova-live-text">
                <strong><Volume2 size={12} /> {room.channelName}</strong>
                <small>{friendNames.length ? `${friendNames.slice(0, 2).join(', ')}${friendNames.length > 2 ? ` y ${friendNames.length - 2} más` : ''} · ` : ''}{room.serverName}</small>
              </span>
              <span className="kova-live-join">Unirme</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
