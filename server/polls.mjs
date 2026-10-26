// Native polls: a message "[poll:<id>] question" plus live results for everyone in
// the channel. Single or multiple choice, optional close date.

export const pollsSchema = `CREATE TABLE IF NOT EXISTS polls (id TEXT PRIMARY KEY, signal_id TEXT NOT NULL, space_id TEXT NOT NULL, author_id TEXT NOT NULL, question TEXT NOT NULL, options TEXT NOT NULL, multi INTEGER NOT NULL DEFAULT 0, ends_at TEXT, closed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS poll_votes (poll_id TEXT NOT NULL, user_id TEXT NOT NULL, option_id TEXT NOT NULL, PRIMARY KEY(poll_id, user_id, option_id));`;

const MAX_OPTIONS = 10;
const isClosed = (row) => Boolean(Number(row.closed)) || (row.ends_at && Date.parse(row.ends_at) <= Date.now());

export async function pollOut(db, row, userId) {
  const votes = await db.prepare('SELECT user_id, option_id FROM poll_votes WHERE poll_id = ?').all(row.id);
  const options = JSON.parse(row.options).map((option) => ({ ...option, votes: votes.filter((vote) => vote.option_id === option.id).length }));
  return {
    id: row.id,
    channelId: row.signal_id,
    authorId: row.author_id,
    question: row.question,
    options,
    multi: Boolean(Number(row.multi)),
    endsAt: row.ends_at || undefined,
    closed: Boolean(isClosed(row)),
    voters: new Set(votes.map((vote) => vote.user_id)).size,
    myVotes: votes.filter((vote) => vote.user_id === userId).map((vote) => vote.option_id),
  };
}

/**
 *   POST /api/channels/:id/polls   { question, options: string[], multi?, durationHours? }
 *   GET  /api/polls/:id
 *   POST /api/polls/:id/vote       { optionIds: string[] }   ([] removes your vote)
 *   POST /api/polls/:id/close      (author or MANAGE_MESSAGES)
 * Channel visibility / read-only rules are enforced before this runs.
 */
export async function handlePollRoutes({ db, req, res, requestPath, session, send, readBody, can, canAccessSpace, channelRights, deliverMessage, emitToChannel, crypto }) {
  const create = requestPath.match(/^\/api\/channels\/([^/]+)\/polls$/);
  const one = requestPath.match(/^\/api\/polls\/([^/]+)(?:\/(vote|close))?$/);
  if (!create && !one) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }

  if (create) {
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const channel = await db.prepare('SELECT id, space_id, type FROM signals WHERE id = ?').get(decodeURIComponent(create[1]));
    if (!channel || channel.type === 'voice' || channel.type === 'stage' || !await canAccessSpace(channel.space_id, session.user_id)) { send(res, 404, { message: 'No encontramos ese canal.' }); return true; }
    if (!(await channelRights(db, channel, session.user_id)).send) { send(res, 403, { message: 'No puedes escribir en este canal.' }); return true; }
    const body = await readBody(req);
    const question = String(body.question || '').trim().slice(0, 300);
    const labels = [...new Set((Array.isArray(body.options) ? body.options : []).map((option) => String(option || '').trim().slice(0, 80)).filter(Boolean))];
    if (!question) { send(res, 400, { message: 'Escribe la pregunta de la encuesta.' }); return true; }
    if (labels.length < 2 || labels.length > MAX_OPTIONS) { send(res, 400, { message: `Pon entre 2 y ${MAX_OPTIONS} opciones distintas.` }); return true; }
    const hours = Number(body.durationHours);
    const endsAt = Number.isFinite(hours) && hours > 0 ? new Date(Date.now() + Math.min(hours, 24 * 14) * 3600_000).toISOString() : null;
    const id = `poll_${crypto.randomUUID().slice(0, 16)}`;
    const options = labels.map((label, index) => ({ id: `o${index + 1}`, label }));
    await db.prepare('INSERT INTO polls (id, signal_id, space_id, author_id, question, options, multi, ends_at, closed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)')
      .run(id, channel.id, channel.space_id, session.user_id, question, JSON.stringify(options), body.multi ? 1 : 0, endsAt, new Date().toISOString());
    const message = await deliverMessage({ channelId: channel.id, spaceId: channel.space_id, authorId: session.user_id, content: `[poll:${id}] 📊 ${question}` });
    send(res, 201, { poll: await pollOut(db, await db.prepare('SELECT * FROM polls WHERE id = ?').get(id), session.user_id), message });
    return true;
  }

  const row = await db.prepare('SELECT * FROM polls WHERE id = ?').get(decodeURIComponent(one[1]));
  const channel = row && { id: row.signal_id, space_id: row.space_id };
  if (!row || !await canAccessSpace(row.space_id, session.user_id) || !(await channelRights(db, channel, session.user_id)).view) { send(res, 404, { message: 'No encontramos esa encuesta.' }); return true; }
  const action = one[2];
  if (!action) {
    if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    send(res, 200, await pollOut(db, row, session.user_id));
    return true;
  }
  if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }

  if (action === 'vote') {
    if (isClosed(row)) { send(res, 400, { message: 'Esta encuesta ya está cerrada.' }); return true; }
    const body = await readBody(req);
    const valid = new Set(JSON.parse(row.options).map((option) => option.id));
    let chosen = [...new Set((Array.isArray(body.optionIds) ? body.optionIds : []).map(String))].filter((id) => valid.has(id));
    if (!Number(row.multi)) chosen = chosen.slice(0, 1);
    await db.prepare('DELETE FROM poll_votes WHERE poll_id = ? AND user_id = ?').run(row.id, session.user_id);
    for (const optionId of chosen) await db.prepare('INSERT INTO poll_votes (poll_id, user_id, option_id) VALUES (?, ?, ?)').run(row.id, session.user_id, optionId);
  } else {
    if (row.author_id !== session.user_id && !await can(db, row.space_id, session.user_id, 'MANAGE_MESSAGES')) { send(res, 403, { message: 'Solo quien creó la encuesta o un moderador puede cerrarla.' }); return true; }
    await db.prepare('UPDATE polls SET closed = 1 WHERE id = ?').run(row.id);
  }
  const fresh = await db.prepare('SELECT * FROM polls WHERE id = ?').get(row.id);
  // Everyone gets fresh totals; "myVotes" is recomputed per viewer when they fetch.
  await emitToChannel(row.signal_id, 'poll:updated', { ...(await pollOut(db, fresh, '')), myVotes: undefined });
  send(res, 200, await pollOut(db, fresh, session.user_id));
  return true;
}
