// Soundboard: every space can upload its own short sounds, and playing one (custom
// or built-in) is heard by everyone in the voice room, not only by you.

export const soundsSchema = `CREATE TABLE IF NOT EXISTS space_sounds (id TEXT PRIMARY KEY, space_id TEXT NOT NULL, name TEXT NOT NULL, emoji TEXT NOT NULL DEFAULT '🔊', url TEXT NOT NULL, volume REAL NOT NULL DEFAULT 1, created_by TEXT NOT NULL, created_at TEXT NOT NULL);`;

const MAX_SOUNDS = 30;
const BUILT_IN = new Set(['laser', 'victory', 'cyberhorn', 'arcade', 'airhorn', 'quack', 'applause', 'badumtss', 'kova_ping', 'bruh']);
const lastPlay = new Map(); // userId -> time, so nobody can spam the room

const soundOut = (row) => ({ id: row.id, name: row.name, emoji: row.emoji, url: row.url, volume: Number(row.volume) });

export const soundsOf = async (db, spaceId) =>
  (await db.prepare('SELECT * FROM space_sounds WHERE space_id = ? ORDER BY created_at').all(spaceId)).map(soundOut);

/**
 *   GET    /api/servers/:id/sounds
 *   POST   /api/servers/:id/sounds   { name, emoji, url, volume }   (MANAGE_SERVER)
 *   DELETE /api/sounds/:id
 *   POST   /api/voice/:id/sound      { soundId } | { builtin }       play it for the whole room
 */
export async function handleSoundRoutes({ db, req, res, requestPath, session, send, readBody, can, canAccessSpace, spaceAudience, emitToUsers, hostedImageUrl, crypto }) {
  const list = requestPath.match(/^\/api\/servers\/([^/]+)\/sounds$/);
  const one = requestPath.match(/^\/api\/sounds\/([^/]+)$/);
  const play = requestPath.match(/^\/api\/voice\/([^/]+)\/sound$/);
  if (!list && !one && !play) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }

  if (play) {
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const channel = await db.prepare('SELECT id, space_id, type FROM signals WHERE id = ?').get(decodeURIComponent(play[1]));
    if (!channel || !['voice', 'stage'].includes(channel.type) || !await canAccessSpace(channel.space_id, session.user_id)) { send(res, 404, { message: 'No encontramos esa sala de voz.' }); return true; }
    if (!await can(db, channel.space_id, session.user_id, 'SPEAK_VOICE')) { send(res, 403, { message: 'No puedes usar sonidos en esta sala.' }); return true; }
    const previous = lastPlay.get(session.user_id) || 0;
    if (Date.now() - previous < 2500) { send(res, 429, { message: 'Espera un momento antes de otro sonido.' }); return true; }
    const body = await readBody(req);
    let payload;
    if (body.builtin && BUILT_IN.has(String(body.builtin))) payload = { builtin: String(body.builtin) };
    else {
      const sound = await db.prepare('SELECT * FROM space_sounds WHERE id = ? AND space_id = ?').get(String(body.soundId || ''), channel.space_id);
      if (!sound) { send(res, 404, { message: 'Ese sonido no existe en este espacio.' }); return true; }
      payload = { sound: soundOut(sound) };
    }
    lastPlay.set(session.user_id, Date.now());
    if (lastPlay.size > 20_000) lastPlay.clear();
    const user = await db.prepare('SELECT display_name, username FROM users WHERE id = ?').get(session.user_id);
    await emitToUsers(await spaceAudience(db, channel.space_id), 'voice:sound', { channelId: channel.id, by: session.user_id, byName: user?.display_name || user?.username || '', ...payload });
    send(res, 200, { ok: true });
    return true;
  }

  if (list) {
    const spaceId = decodeURIComponent(list[1]);
    if (!await canAccessSpace(spaceId, session.user_id)) { send(res, 404, { message: 'No encontramos ese espacio.' }); return true; }
    if (req.method === 'GET') { send(res, 200, await soundsOf(db, spaceId)); return true; }
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    if (!await can(db, spaceId, session.user_id, 'MANAGE_SERVER')) { send(res, 403, { message: 'Necesitas el permiso Gestionar espacio.' }); return true; }
    const body = await readBody(req);
    const name = String(body.name || '').trim().slice(0, 32);
    const url = hostedImageUrl(body.url);
    if (!name) { send(res, 400, { message: 'Ponle un nombre al sonido.' }); return true; }
    if (!url) { send(res, 400, { message: 'Sube un archivo de audio válido.' }); return true; }
    const count = await db.prepare('SELECT COUNT(*) AS n FROM space_sounds WHERE space_id = ?').get(spaceId);
    if (Number(count?.n || 0) >= MAX_SOUNDS) { send(res, 400, { message: `Este espacio ya tiene ${MAX_SOUNDS} sonidos.` }); return true; }
    const id = `snd_${crypto.randomUUID().slice(0, 12)}`;
    const volume = Math.min(1, Math.max(0.1, Number(body.volume) || 1));
    await db.prepare('INSERT INTO space_sounds (id, space_id, name, emoji, url, volume, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, spaceId, name, String(body.emoji || '🔊').slice(0, 8), url, volume, session.user_id, new Date().toISOString());
    send(res, 201, { id, name, emoji: String(body.emoji || '🔊').slice(0, 8), url, volume });
    return true;
  }

  if (req.method !== 'DELETE') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const row = await db.prepare('SELECT * FROM space_sounds WHERE id = ?').get(decodeURIComponent(one[1]));
  if (!row || !await can(db, row.space_id, session.user_id, 'MANAGE_SERVER')) { send(res, 404, { message: 'No encontramos ese sonido.' }); return true; }
  await db.prepare('DELETE FROM space_sounds WHERE id = ?').run(row.id);
  send(res, 200, { ok: true });
  return true;
}
