// Space events with a calendar: anyone with MANAGE_SERVER (or MANAGE_CHANNELS) creates
// them, members mark "Me interesa", and interested people get a heads-up before start.

export const eventsSchema = `CREATE TABLE IF NOT EXISTS space_events (id TEXT PRIMARY KEY, space_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', starts_at TEXT NOT NULL, ends_at TEXT, signal_id TEXT, created_by TEXT NOT NULL, reminded INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS event_rsvps (event_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(event_id, user_id));`;

const HEADS_UP_MS = 15 * 60 * 1000;
const PAST_KEEP_MS = 24 * 60 * 60 * 1000;

const eventOut = async (db, row, userId) => {
  const rsvps = await db.prepare('SELECT user_id FROM event_rsvps WHERE event_id = ?').all(row.id);
  return {
    id: row.id,
    spaceId: row.space_id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at || undefined,
    channelId: row.signal_id || undefined,
    createdBy: row.created_by,
    interested: rsvps.length,
    interestedIds: rsvps.map((item) => item.user_id),
    meInterested: rsvps.some((item) => item.user_id === userId),
  };
};

const canManage = async (can, db, spaceId, userId) =>
  (await can(db, spaceId, userId, 'MANAGE_SERVER')) || (await can(db, spaceId, userId, 'MANAGE_CHANNELS'));

/**
 *   GET    /api/spaces/:id/events        upcoming (and today's past) events
 *   POST   /api/spaces/:id/events        { title, description, startsAt, endsAt?, channelId? }
 *   POST   /api/events/:id/rsvp          { interested }
 *   DELETE /api/events/:id
 */
export async function handleEventRoutes({ db, req, res, requestPath, session, send, readBody, can, canAccessSpace, spaceAudience, emitToUsers, crypto }) {
  const list = requestPath.match(/^\/api\/spaces\/([^/]+)\/events$/);
  const one = requestPath.match(/^\/api\/events\/([^/]+)(\/rsvp)?$/);
  if (!list && !one) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const notify = async (spaceId, eventName, payload) => emitToUsers(await spaceAudience(db, spaceId), eventName, payload);

  if (list) {
    const spaceId = decodeURIComponent(list[1]);
    if (!await canAccessSpace(spaceId, session.user_id)) { send(res, 404, { message: 'No encontramos ese espacio.' }); return true; }
    if (req.method === 'GET') {
      const rows = await db.prepare('SELECT * FROM space_events WHERE space_id = ? AND starts_at >= ? ORDER BY starts_at LIMIT 100')
        .all(spaceId, new Date(Date.now() - PAST_KEEP_MS).toISOString());
      const events = [];
      for (const row of rows) events.push(await eventOut(db, row, session.user_id));
      send(res, 200, events);
      return true;
    }
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    if (!await canManage(can, db, spaceId, session.user_id)) { send(res, 403, { message: 'Necesitas permiso para gestionar el espacio o sus canales.' }); return true; }
    const body = await readBody(req);
    const title = String(body.title || '').trim().slice(0, 100);
    const startsAt = Date.parse(String(body.startsAt || ''));
    const endsAt = body.endsAt ? Date.parse(String(body.endsAt)) : NaN;
    if (!title) { send(res, 400, { message: 'Ponle un título al evento.' }); return true; }
    if (!Number.isFinite(startsAt) || startsAt < Date.now() - 60_000) { send(res, 400, { message: 'Elige una fecha de inicio futura.' }); return true; }
    if (Number.isFinite(endsAt) && endsAt <= startsAt) { send(res, 400, { message: 'El evento debe terminar después de empezar.' }); return true; }
    const channelId = String(body.channelId || '') || null;
    if (channelId && !await db.prepare('SELECT id FROM signals WHERE id = ? AND space_id = ?').get(channelId, spaceId)) { send(res, 400, { message: 'Ese canal no es de este espacio.' }); return true; }
    const id = `event_${crypto.randomUUID()}`;
    await db.prepare('INSERT INTO space_events (id, space_id, title, description, starts_at, ends_at, signal_id, created_by, reminded, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)')
      .run(id, spaceId, title, String(body.description || '').trim().slice(0, 1000), new Date(startsAt).toISOString(), Number.isFinite(endsAt) ? new Date(endsAt).toISOString() : null, channelId, session.user_id, new Date().toISOString());
    // The creator is interested by default.
    await db.prepare('INSERT INTO event_rsvps (event_id, user_id, created_at) VALUES (?, ?, ?)').run(id, session.user_id, new Date().toISOString());
    const event = await eventOut(db, await db.prepare('SELECT * FROM space_events WHERE id = ?').get(id), session.user_id);
    await notify(spaceId, 'event:changed', { spaceId });
    send(res, 201, event);
    return true;
  }

  const eventId = decodeURIComponent(one[1]);
  const row = await db.prepare('SELECT * FROM space_events WHERE id = ?').get(eventId);
  if (!row || !await canAccessSpace(row.space_id, session.user_id)) { send(res, 404, { message: 'No encontramos ese evento.' }); return true; }
  if (one[2]) {
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const body = await readBody(req);
    await db.prepare('DELETE FROM event_rsvps WHERE event_id = ? AND user_id = ?').run(eventId, session.user_id);
    if (body.interested) await db.prepare('INSERT INTO event_rsvps (event_id, user_id, created_at) VALUES (?, ?, ?)').run(eventId, session.user_id, new Date().toISOString());
    await notify(row.space_id, 'event:changed', { spaceId: row.space_id });
    send(res, 200, await eventOut(db, row, session.user_id));
    return true;
  }
  if (req.method !== 'DELETE') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  if (row.created_by !== session.user_id && !await canManage(can, db, row.space_id, session.user_id)) { send(res, 403, { message: 'No puedes cancelar este evento.' }); return true; }
  await db.prepare('DELETE FROM event_rsvps WHERE event_id = ?').run(eventId);
  await db.prepare('DELETE FROM space_events WHERE id = ?').run(eventId);
  await notify(row.space_id, 'event:changed', { spaceId: row.space_id });
  send(res, 200, { ok: true });
  return true;
}

/** Job tick: heads-up to interested people ~15 min before an event starts. */
export async function runEventReminders({ db, emitToUsers }) {
  const now = Date.now();
  const rows = await db.prepare('SELECT * FROM space_events WHERE reminded = 0 AND starts_at <= ? AND starts_at >= ? LIMIT 50')
    .all(new Date(now + HEADS_UP_MS).toISOString(), new Date(now - HEADS_UP_MS).toISOString());
  for (const row of rows) {
    const claimed = await db.prepare('UPDATE space_events SET reminded = 1 WHERE id = ? AND reminded = 0').run(row.id);
    if (!claimed.changes) continue;
    const users = (await db.prepare('SELECT user_id FROM event_rsvps WHERE event_id = ?').all(row.id)).map((item) => item.user_id);
    if (users.length) await emitToUsers(users, 'event:starting', { id: row.id, title: row.title, startsAt: row.starts_at, serverId: row.space_id, channelId: row.signal_id || undefined });
  }
}
