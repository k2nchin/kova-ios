// Stage channels: a few speakers, a big audience. Listeners raise their hand and
// a moderator invites them up. Speaking rights are enforced by LiveKit itself
// (the join token and live permission updates), not just hidden in the UI.

export const stageSchema = `CREATE TABLE IF NOT EXISTS stage_members (signal_id TEXT NOT NULL, user_id TEXT NOT NULL, state TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(signal_id, user_id)); CREATE TABLE IF NOT EXISTS stage_topics (signal_id TEXT PRIMARY KEY, topic TEXT NOT NULL, updated_at TEXT NOT NULL);`;

const MODERATOR_PERMS = ['MANAGE_CHANNELS', 'MUTE_MEMBERS', 'MOVE_MEMBERS'];

export const isStageModerator = async (can, db, spaceId, userId) => {
  for (const perm of MODERATOR_PERMS) if (await can(db, spaceId, userId, perm)) return true;
  return false;
};

/** Whether this user may talk on the stage right now. */
export async function canSpeakOnStage(db, can, channel, userId) {
  if (await isStageModerator(can, db, channel.space_id, userId)) return true;
  const row = await db.prepare("SELECT state FROM stage_members WHERE signal_id = ? AND user_id = ?").get(channel.id, userId);
  return row?.state === 'speaker';
}

async function stageState(db, can, channel, viewerId) {
  const rows = await db.prepare('SELECT m.user_id, m.state, u.display_name, u.username, u.avatar FROM stage_members m JOIN users u ON u.id = m.user_id WHERE m.signal_id = ? ORDER BY m.updated_at').all(channel.id);
  const topic = await db.prepare('SELECT topic FROM stage_topics WHERE signal_id = ?').get(channel.id);
  const person = (row) => ({ id: row.user_id, name: row.display_name || row.username, avatar: row.avatar || '' });
  return {
    channelId: channel.id,
    topic: topic?.topic || '',
    speakers: rows.filter((row) => row.state === 'speaker').map(person),
    requests: rows.filter((row) => row.state === 'hand').map(person),
    youModerate: await isStageModerator(can, db, channel.space_id, viewerId),
    youSpeak: await canSpeakOnStage(db, can, channel, viewerId),
    yourHand: rows.some((row) => row.user_id === viewerId && row.state === 'hand'),
  };
}

/**
 *   GET  /api/stage/:id                         topic, speakers, raised hands
 *   POST /api/stage/:id/hand      { raised }    listener asks to speak
 *   POST /api/stage/:id/speakers  { userId, speaker }   moderator invites / moves to audience (anyone can step down)
 *   PUT  /api/stage/:id/topic     { topic }     moderator
 */
export async function handleStageRoutes({ db, req, res, requestPath, session, send, readBody, can, canAccessSpace, spaceAudience, emitToUsers, setVoicePublish }) {
  const match = requestPath.match(/^\/api\/stage\/([^/]+)(?:\/(hand|speakers|topic))?$/);
  if (!match) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const channel = await db.prepare('SELECT id, space_id, type FROM signals WHERE id = ?').get(decodeURIComponent(match[1]));
  if (!channel || channel.type !== 'stage' || !await canAccessSpace(channel.space_id, session.user_id)) { send(res, 404, { message: 'No encontramos ese escenario.' }); return true; }
  const action = match[2];
  const now = new Date().toISOString();
  const changed = async () => emitToUsers(await spaceAudience(db, channel.space_id), 'stage:changed', { channelId: channel.id });
  const setState = async (userId, state) => {
    await db.prepare('DELETE FROM stage_members WHERE signal_id = ? AND user_id = ?').run(channel.id, userId);
    if (state) await db.prepare('INSERT INTO stage_members (signal_id, user_id, state, updated_at) VALUES (?, ?, ?, ?)').run(channel.id, userId, state, now);
  };

  if (!action) {
    if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    send(res, 200, await stageState(db, can, channel, session.user_id));
    return true;
  }
  const body = await readBody(req);
  const moderator = await isStageModerator(can, db, channel.space_id, session.user_id);

  if (action === 'topic') {
    if (req.method !== 'PUT') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    if (!moderator) { send(res, 403, { message: 'Solo los moderadores del escenario pueden cambiar el tema.' }); return true; }
    await db.prepare('DELETE FROM stage_topics WHERE signal_id = ?').run(channel.id);
    await db.prepare('INSERT INTO stage_topics (signal_id, topic, updated_at) VALUES (?, ?, ?)').run(channel.id, String(body.topic || '').trim().slice(0, 120), now);
  } else if (action === 'hand') {
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const current = await db.prepare('SELECT state FROM stage_members WHERE signal_id = ? AND user_id = ?').get(channel.id, session.user_id);
    if (current?.state !== 'speaker') await setState(session.user_id, body.raised ? 'hand' : null);
  } else {
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const userId = String(body.userId || '');
    const selfDown = userId === session.user_id && !body.speaker;
    if (!moderator && !selfDown) { send(res, 403, { message: 'Solo los moderadores pueden subir gente al escenario.' }); return true; }
    if (!await canAccessSpace(channel.space_id, userId)) { send(res, 404, { message: 'Esa persona no está en el espacio.' }); return true; }
    await setState(userId, body.speaker ? 'speaker' : null);
    await setVoicePublish(channel.id, userId, Boolean(body.speaker) || await isStageModerator(can, db, channel.space_id, userId));
  }
  await changed();
  send(res, 200, await stageState(db, can, channel, session.user_id));
  return true;
}
