// Social profile features: private notes about people, "Jugando a… / Escuchando…"
// activity status, and richer per-space profiles (avatar, bio, pronouns).

export const socialSchema = `CREATE TABLE IF NOT EXISTS user_notes (owner_id TEXT NOT NULL, target_id TEXT NOT NULL, note TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(owner_id, target_id)); CREATE TABLE IF NOT EXISTS user_activity (user_id TEXT PRIMARY KEY, kind TEXT NOT NULL, name TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', started_at TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS space_profiles (space_id TEXT NOT NULL, user_id TEXT NOT NULL, avatar TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', pronouns TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL, PRIMARY KEY(space_id, user_id));`;

const KINDS = new Set(['playing', 'listening', 'watching', 'streaming', 'coding']);
// An activity nobody refreshed in this long is stale (app closed without clearing it).
const ACTIVITY_TTL_MS = 6 * 60 * 60 * 1000;

const activityOut = (row) => (row && Date.now() - Date.parse(row.updated_at) < ACTIVITY_TTL_MS
  ? { kind: row.kind, name: row.name, details: row.details || '', startedAt: row.started_at }
  : null);

/** { [userId]: activity } for these people. */
export async function activitiesFor(db, userIds) {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (!ids.length) return {};
  const rows = await db.prepare(`SELECT * FROM user_activity WHERE user_id IN (${ids.map(() => '?').join(',')})`).all(...ids);
  const out = {};
  for (const row of rows) { const activity = activityOut(row); if (activity) out[row.user_id] = activity; }
  return out;
}

/** { [userId]: { avatar, bio, pronouns } } for a space. */
export async function spaceProfilesOf(db, spaceId) {
  const rows = await db.prepare('SELECT * FROM space_profiles WHERE space_id = ?').all(spaceId);
  return Object.fromEntries(rows.map((row) => [row.user_id, { avatar: row.avatar, bio: row.bio, pronouns: row.pronouns }]));
}

/** Everyone who should see this person's live activity: friends + people in their spaces. */
async function activityAudience(db, userId) {
  const friends = await db.prepare('SELECT user_b AS id FROM friendships WHERE user_a = ? UNION SELECT user_a AS id FROM friendships WHERE user_b = ?').all(userId, userId);
  const mates = await db.prepare(`SELECT DISTINCT m.user_id AS id FROM space_members m WHERE m.space_id IN (SELECT id FROM spaces WHERE owner_id = ? UNION SELECT space_id FROM space_members WHERE user_id = ?)
    UNION SELECT s.owner_id AS id FROM spaces s WHERE s.id IN (SELECT space_id FROM space_members WHERE user_id = ?)`).all(userId, userId, userId);
  return [...new Set([userId, ...friends.map((row) => row.id), ...mates.map((row) => row.id)])].slice(0, 2000);
}

/**
 *   GET/PUT /api/users/:id/note          { note }   only you see it
 *   PUT     /api/me/activity             { kind, name, details } | { clear: true }
 *   GET     /api/activities?ids=a,b      live activity of several people
 *   PUT     /api/servers/:id/profile     { avatar, bio, pronouns }   your profile in that space
 */
export async function handleSocialRoutes({ db, req, res, requestPath, session, send, readBody, canAccessSpace, notifySpace, emitToUsers, hostedImageUrl }) {
  const noteMatch = requestPath.match(/^\/api\/users\/([^/]+)\/note$/);
  const profileMatch = requestPath.match(/^\/api\/servers\/([^/]+)\/profile$/);
  if (!noteMatch && !profileMatch && requestPath !== '/api/me/activity' && requestPath !== '/api/activities') return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const me = session.user_id;
  const now = new Date().toISOString();

  if (noteMatch) {
    const target = decodeURIComponent(noteMatch[1]);
    if (req.method === 'PUT') {
      const note = String((await readBody(req)).note || '').trim().slice(0, 500);
      await db.prepare('DELETE FROM user_notes WHERE owner_id = ? AND target_id = ?').run(me, target);
      if (note) await db.prepare('INSERT INTO user_notes (owner_id, target_id, note, updated_at) VALUES (?, ?, ?, ?)').run(me, target, note, now);
    } else if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const row = await db.prepare('SELECT note FROM user_notes WHERE owner_id = ? AND target_id = ?').get(me, target);
    send(res, 200, { note: row?.note || '' });
    return true;
  }

  if (requestPath === '/api/activities') {
    if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const ids = String(new URL(req.url || '/', 'http://localhost').searchParams.get('ids') || '').split(',').map((id) => id.trim()).filter(Boolean).slice(0, 200);
    send(res, 200, await activitiesFor(db, ids));
    return true;
  }

  if (requestPath === '/api/me/activity') {
    if (req.method !== 'PUT') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const body = await readBody(req);
    let activity = null;
    if (body.clear) await db.prepare('DELETE FROM user_activity WHERE user_id = ?').run(me);
    else {
      const kind = String(body.kind || '');
      const name = String(body.name || '').trim().slice(0, 80);
      if (!KINDS.has(kind) || !name) { send(res, 400, { message: 'Indica qué estás haciendo.' }); return true; }
      const details = String(body.details || '').trim().slice(0, 120);
      const previous = await db.prepare('SELECT * FROM user_activity WHERE user_id = ?').get(me);
      // Same thing as before: keep the start time so "desde hace 1 h" stays right.
      const startedAt = previous && previous.kind === kind && previous.name === name ? previous.started_at : now;
      await db.prepare('DELETE FROM user_activity WHERE user_id = ?').run(me);
      await db.prepare('INSERT INTO user_activity (user_id, kind, name, details, started_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(me, kind, name, details, startedAt, now);
      activity = { kind, name, details, startedAt };
    }
    await emitToUsers(await activityAudience(db, me), 'activity:changed', { userId: me, activity });
    send(res, 200, { activity });
    return true;
  }

  const spaceId = decodeURIComponent(profileMatch[1]);
  if (!await canAccessSpace(spaceId, me)) { send(res, 404, { message: 'No encontramos ese espacio.' }); return true; }
  if (req.method !== 'PUT') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const body = await readBody(req);
  const avatar = body.avatar ? hostedImageUrl(body.avatar) : '';
  if (body.avatar && !avatar) { send(res, 400, { message: 'Sube una imagen válida para el avatar.' }); return true; }
  const profile = { avatar, bio: String(body.bio || '').trim().slice(0, 300), pronouns: String(body.pronouns || '').trim().slice(0, 30) };
  await db.prepare('DELETE FROM space_profiles WHERE space_id = ? AND user_id = ?').run(spaceId, me);
  if (profile.avatar || profile.bio || profile.pronouns) {
    await db.prepare('INSERT INTO space_profiles (space_id, user_id, avatar, bio, pronouns, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(spaceId, me, profile.avatar, profile.bio, profile.pronouns, now);
  }
  await notifySpace(spaceId, 'members');
  send(res, 200, profile);
  return true;
}
