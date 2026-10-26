import React, { useEffect, useRef, useState } from 'react';
import { ListMusic, Music2, Pause, Play, SkipForward, Square, Volume2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, type MusicState } from '../../services/apiClient';
import { getSocket } from '../../services/socketClient';

const VOLUME_KEY = 'kova.music.volume';
const readVolume = () => { try { return Number(localStorage.getItem(VOLUME_KEY) ?? 60); } catch { return 60; } };

/** Where the shared song is right now, corrected for clock skew with the server. */
const positionMs = (state: MusicState, skew: number) =>
  state.playing && state.startedAt ? state.offsetMs + (Date.now() + skew - Date.parse(state.startedAt)) : state.offsetMs;

/** Shared music for a voice room: same song, same second, for everyone in the room. */
export const ListenTogether: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [state, setState] = useState<MusicState | null>(null);
  const [skew, setSkew] = useState(0);
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [volume, setVolume] = useState(readVolume);
  const audioRef = useRef<HTMLAudioElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const apply = (next: MusicState) => {
    setSkew(next.serverNow - Date.now());
    setState(next);
  };

  useEffect(() => {
    let alive = true;
    api.getMusic(channelId).then((next) => { if (alive) apply(next); }).catch(() => undefined);
    const socket = getSocket();
    const onMusic = (next: MusicState) => { if (next.channelId === channelId) apply(next); };
    socket.on('voice:music', onMusic);
    return () => { alive = false; socket.off('voice:music', onMusic); };
  }, [channelId]);

  // Audio files: keep the <audio> element on the shared position.
  const current = state?.current || null;
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state || current?.kind !== 'audio') return;
    const target = positionMs(state, skew) / 1000;
    if (Math.abs(audio.currentTime - target) > 1.5) audio.currentTime = target;
    if (state.playing) void audio.play().catch(() => toast.info('Pulsa ▶ para escuchar la música de la sala.'));
    else audio.pause();
  }, [state, skew, current?.kind]);

  useEffect(() => {
    try { localStorage.setItem(VOLUME_KEY, String(volume)); } catch { /* storage unavailable */ }
    if (audioRef.current) audioRef.current.volume = volume / 100;
    frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [volume] }), '*');
  }, [volume, state]);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      apply(await api.controlMusic(channelId, { action, ...extra }));
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo controlar la música.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!link.trim()) return;
    if (await act('add', { url: link.trim() })) setLink('');
  };

  // The YouTube embed restarts at the shared second whenever the state changes.
  const youtubeSrc = current?.kind === 'youtube' && state?.playing
    ? `https://www.youtube-nocookie.com/embed/${current.ref}?autoplay=1&enablejsapi=1&controls=0&disablekb=1&modestbranding=1&rel=0&start=${Math.floor(positionMs(state, skew) / 1000)}`
    : '';

  return (
    <div className={`klt ${open ? 'is-open' : ''}`}>
      {youtubeSrc && (
        <iframe
          ref={frameRef}
          key={`${current!.id}-${state!.startedAt}-${state!.offsetMs}`}
          className="klt-yt"
          src={youtubeSrc}
          title="Música de la sala"
          allow="autoplay; encrypted-media"
          onLoad={() => window.setTimeout(() => frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [volume] }), '*'), 800)}
        />
      )}
      {current?.kind === 'audio' && (
        <audio
          ref={audioRef}
          src={current.ref}
          onEnded={() => { if (state?.current?.id === current.id) void act('skip'); }}
          onLoadedMetadata={() => { if (audioRef.current) audioRef.current.volume = volume / 100; }}
        />
      )}

      {!open ? (
        <button type="button" className={`klt-pill ${current ? 'is-live' : ''}`} onClick={() => setOpen(true)}>
          <Music2 size={14} />
          <span>{current ? current.title : 'Escuchar juntos'}</span>
          {current && state?.playing && <i className="klt-eq"><b /><b /><b /></i>}
        </button>
      ) : (
        <section className="klt-card" aria-label="Escuchar juntos">
          <header>
            <Music2 size={15} />
            <strong>Escuchar juntos</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar"><X size={15} /></button>
          </header>

          {current ? (
            <div className="klt-now">
              <small>{state?.playing ? 'Sonando ahora' : 'En pausa'}</small>
              <p title={current.url}>{current.title}</p>
              <div className="klt-controls">
                {state?.playing
                  ? <button type="button" disabled={busy} onClick={() => act('pause')} aria-label="Pausar para todos"><Pause size={16} /></button>
                  : <button type="button" disabled={busy} onClick={() => act('resume')} aria-label="Reanudar para todos"><Play size={16} /></button>}
                <button type="button" disabled={busy} onClick={() => act('skip')} aria-label="Siguiente"><SkipForward size={16} /></button>
                <button type="button" disabled={busy} onClick={() => act('stop')} aria-label="Parar y vaciar la cola"><Square size={14} /></button>
                <label className="klt-volume" title="Tu volumen (solo para ti)">
                  <Volume2 size={14} />
                  <input type="range" min={0} max={100} value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Volumen de la música" />
                </label>
              </div>
            </div>
          ) : (
            <p className="klt-empty">Pon música para toda la sala: todos escuchan lo mismo, al mismo segundo.</p>
          )}

          <form onSubmit={add} className="klt-add">
            <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="Enlace de YouTube o de un mp3…" aria-label="Enlace de la canción" />
            <button type="submit" disabled={busy || !link.trim()}>{current ? 'A la cola' : 'Poner'}</button>
          </form>

          {state && state.queue.length > 0 && (
            <div className="klt-queue">
              <small><ListMusic size={12} /> En cola ({state.queue.length})</small>
              <ol>
                {state.queue.map((track) => (
                  <li key={track.id}>
                    <span title={track.url}>{track.title}</span>
                    <button type="button" onClick={() => act('remove', { trackId: track.id })} aria-label={`Quitar ${track.title}`}><X size={12} /></button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
