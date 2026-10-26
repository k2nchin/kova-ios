// Listen together: each voice room has one shared player (YouTube link or audio
// file) plus a queue. The server stores where the song is so everyone in the room
// hears the same second; clients compute position = offset + (now - startedAt).

export const musicSchema = `CREATE TABLE IF NOT EXISTS voice_music (signal_id TEXT PRIMARY KEY, current TEXT, queue TEXT NOT NULL DEFAULT '[]', playing INTEGER NOT NULL DEFAULT 0, started_at TEXT, offset_ms INTEGER NOT NULL DEFAULT 0, updated_by TEXT, updated_at TEXT NOT NULL);`;

const MAX_QUEUE = 50;

/** Accepts YouTube links and direct audio files; returns a track or null. */
export function parseTrack(input, addedBy) {
  const raw = String(input || '').trim();
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (!/^https?:$/.test(url.protocol) || raw.length > 2048) return null;
  const host = url.hostname.replace(/^www\.|^m\.|^music\./, '');
  let youtubeId = null;
  if (host === 'youtu.be') youtubeId = url.pathname.slice(1, 12);
  else if (host === 'youtube.com') youtubeId = url.searchParams.get('v') || (url.pathname.match(/^\/(shorts|embed|live)\/([\w-]{11})/) || [])[2] || null;
  const id = `trk_${Math.random().toString(36).slice(2, 10)}`;
  if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) return { id, kind: 'youtube', ref: youtubeId, url: raw, title: 'Vídeo de YouTube', addedBy };
  if (/\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|webm)(\?|$)/i.test(url.pathname) || /\/api\/files\//.test(url.pathname)) {
    const name = decodeURIComponent(url.pathname.split('/').pop() || 'Audio').replace(/^[0-9a-f-]{36}-/, '').slice(0, 120);
    return { id, kind: 'audio', ref: raw, url: raw, title: name, addedBy };
  }
  return null;
}

const stateOut = (row) => {
  if (!row) return { channelId: null, current: null, queue: [], playing: false, startedAt: null, offsetMs: 0, serverNow: Date.now() };
  return {
    channelId: row.signal_id,
    current: row.current ? JSON.parse(row.current) : null,
    queue: JSON.parse(row.queue || '[]'),
    playing: Boolean(Number(row.playing)),
    startedAt: row.started_at,
    offsetMs: Number(row.offset_ms || 0),
    updatedBy: row.updated_by,
    serverNow: Date.now(),
  };
};

/**
 *   GET  /api/voice/:id/music
 *   POST /api/voice/:id/music   { action: 'add' | 'pause' | 'resume' | 'skip' | 'stop' | 'seek' | 'remove' | 'title', url?, positionMs?, trackId?, title? }
 */
export async function handleMusicRoutes({ db, req, res, requestPath, session, send, readBody, can, canAccessSpace, spaceAudience, emitToUsers }) {
  const match = requestPath.match(/^\/api\/voice\/([^/]+)\/music$/);
  if (!match) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const channelId = decodeURIComponent(match[1]);
  const channel = await db.prepare('SELECT id, space_id, type FROM signals WHERE id = ?').get(channelId);
  if (!channel || (channel.type !== 'voice' && channel.type !== 'stage') || !await canAccessSpace(channel.space_id, session.user_id)) { send(res, 404, { message: 'No encontramos esa sala de voz.' }); return true; }
  const load = () => db.prepare('SELECT * FROM voice_music WHERE signal_id = ?').get(channelId);
  if (req.method === 'GET') { send(res, 200, stateOut(await load())); return true; }
  if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  if (!await can(db, channel.space_id, session.user_id, 'CONNECT_VOICE')) { send(res, 403, { message: 'No puedes usar la música de esta sala.' }); return true; }

  const body = await readBody(req);
  const row = await load();
  const state = stateOut(row);
  const now = Date.now();
  const position = () => state.playing && state.startedAt ? state.offsetMs + (now - Date.parse(state.startedAt)) : state.offsetMs;
  let { current, queue, playing } = state;
  let startedAt = state.startedAt;
  let offsetMs = state.offsetMs;
  const startTrack = (track) => { current = track; playing = Boolean(track); startedAt = track ? new Date(now).toISOString() : null; offsetMs = 0; };

  switch (body.action) {
    case 'add': {
      const track = parseTrack(body.url, session.user_id);
      if (!track) { send(res, 400, { message: 'Pega un enlace de YouTube o de un archivo de audio (mp3, ogg, wav…).' }); return true; }
      if (body.title) track.title = String(body.title).slice(0, 120);
      else if (track.kind === 'youtube' && !process.env.KOVA_OFFLINE_TESTS) {
        // Real song title from YouTube's public oEmbed (best effort, short timeout).
        try {
          const info = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${track.ref}`)}`, { signal: AbortSignal.timeout(3000) });
          if (info.ok) track.title = String((await info.json()).title || track.title).slice(0, 120);
        } catch { /* keep the generic title */ }
      }
      if (!current) startTrack(track);
      else if (queue.length >= MAX_QUEUE) { send(res, 400, { message: 'La cola está llena (50 canciones).' }); return true; }
      else queue = [...queue, track];
      break;
    }
    case 'pause': if (current && playing) { offsetMs = position(); playing = false; startedAt = null; } break;
    case 'resume': if (current && !playing) { playing = true; startedAt = new Date(now).toISOString(); } break;
    case 'seek': if (current) { offsetMs = Math.max(0, Number(body.positionMs) || 0); startedAt = playing ? new Date(now).toISOString() : null; } break;
    case 'skip': startTrack(queue[0] || null); queue = queue.slice(1); break;
    case 'stop': current = null; queue = []; playing = false; startedAt = null; offsetMs = 0; break;
    case 'remove': queue = queue.filter((track) => track.id !== body.trackId); break;
    case 'title': if (current && current.id === body.trackId && body.title) current = { ...current, title: String(body.title).slice(0, 120) }; break;
    default: send(res, 400, { message: 'Acción no válida.' }); return true;
  }

  const values = [current ? JSON.stringify(current) : null, JSON.stringify(queue), playing ? 1 : 0, startedAt, Math.round(offsetMs), session.user_id, new Date(now).toISOString(), channelId];
  if (row) await db.prepare('UPDATE voice_music SET current = ?, queue = ?, playing = ?, started_at = ?, offset_ms = ?, updated_by = ?, updated_at = ? WHERE signal_id = ?').run(...values);
  else await db.prepare('INSERT INTO voice_music (current, queue, playing, started_at, offset_ms, updated_by, updated_at, signal_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(...values);
  const next = stateOut(await load());
  await emitToUsers(await spaceAudience(db, channel.space_id), 'voice:music', next);
  send(res, 200, next);
  return true;
}
