// Unread counts, @mentions and message search.
// A channel's unread count is what arrived after the person last read it.

export const activitySchema = `CREATE TABLE IF NOT EXISTS channel_reads (user_id TEXT NOT NULL, channel_id TEXT NOT NULL, last_read_at TEXT NOT NULL, PRIMARY KEY(user_id, channel_id)); CREATE TABLE IF NOT EXISTS saved_messages (user_id TEXT NOT NULL, message_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(user_id, message_id));`;

const MENTION = /@([\p{L}\p{N}_.-]{2,32})/gu;

/** Members of `spaceId` mentioned in `content` (@username, @everyone, @here). */
export async function mentionedUserIds(db, spaceId, ownerId, content) {
  const names = [...String(content || '').matchAll(MENTION)].map((match) => match[1].toLowerCase());
  if (!names.length) return [];
  const members = await db.prepare('SELECT u.id, u.username FROM users u WHERE u.id = ? OR u.id IN (SELECT user_id FROM space_members WHERE space_id = ?)').all(ownerId, spaceId);
  if (names.includes('everyone') || names.includes('here')) return members.map((member) => member.id);
  const wanted = new Set(names);
  return members.filter((member) => wanted.has(String(member.username).toLowerCase())).map((member) => member.id);
}

const mentionsUser = (content, username) => {
  const lower = String(content || '').toLowerCase();
  return lower.includes(`@${String(username).toLowerCase()}`) || /@(everyone|here)\b/.test(lower);
};

/**
 *   PUT /api/channels/:id/read        mark a channel as read now
 *   GET /api/unread                   { [channelId]: { unread, mentions } } for every channel you can see
 *   GET /api/servers/:id/search?q=&author=&has=file&channel=   message search in a space
 * Returns true when it answered.
 */
export async function handleActivityRoutes({ db, req, res, requestPath, session, send, readBody, canAccessSpace, isVerifiedEmail, askKovaAI, AiError }) {
  const readMatch = requestPath.match(/^\/api\/channels\/([^/]+)\/read$/);
  const searchMatch = requestPath.match(/^\/api\/servers\/([^/]+)\/search$/);
  const catchupMatch = requestPath.match(/^\/api\/channels\/([^/]+)\/catchup$/);
  const saveMatch = requestPath.match(/^\/api\/messages\/([^/]+)\/save$/);
  if (!readMatch && requestPath !== '/api/unread' && !searchMatch && !catchupMatch && !saveMatch && requestPath !== '/api/saved') return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const me = session.user_id;

  if (readMatch && req.method === 'PUT') {
    const channelId = decodeURIComponent(readMatch[1]);
    const channel = await db.prepare('SELECT space_id FROM signals WHERE id = ?').get(channelId);
    if (!channel || !await canAccessSpace(channel.space_id, me)) { send(res, 404, { message: 'No encontramos ese canal.' }); return true; }
    const now = new Date().toISOString();
    await db.prepare('INSERT INTO channel_reads (user_id, channel_id, last_read_at) VALUES (?, ?, ?) ON CONFLICT (user_id, channel_id) DO UPDATE SET last_read_at = excluded.last_read_at').run(me, channelId, now);
    send(res, 200, { channelId, lastReadAt: now });
    return true;
  }

  // Saved messages: a personal list across all your spaces.
  if (saveMatch && ['PUT', 'DELETE'].includes(req.method)) {
    const messageId = decodeURIComponent(saveMatch[1]);
    const message = await db.prepare('SELECT m.id, s.space_id FROM messages m JOIN signals s ON s.id = m.signal_id WHERE m.id = ?').get(messageId);
    if (!message || !await canAccessSpace(message.space_id, me)) { send(res, 404, { message: 'No encontramos ese mensaje.' }); return true; }
    if (req.method === 'PUT') {
      const total = Number((await db.prepare('SELECT COUNT(*) AS total FROM saved_messages WHERE user_id = ?').get(me))?.total || 0);
      if (total >= 500) { send(res, 400, { message: 'Has llegado al máximo de 500 mensajes guardados.' }); return true; }
      await db.prepare('INSERT INTO saved_messages (user_id, message_id, created_at) VALUES (?, ?, ?) ON CONFLICT (user_id, message_id) DO NOTHING').run(me, messageId, new Date().toISOString());
    } else {
      await db.prepare('DELETE FROM saved_messages WHERE user_id = ? AND message_id = ?').run(me, messageId);
    }
    send(res, 200, { messageId, saved: req.method === 'PUT' });
    return true;
  }
  if (requestPath === '/api/saved' && req.method === 'GET') {
    // Only messages you can still see (you may have left a space since).
    const rows = await db.prepare(`
      SELECT sv.created_at AS saved_at, m.id, m.content, m.created_at, m.signal_id, c.name AS channel_name, c.space_id, sp.name AS space_name,
             u.id AS author_id, u.username, u.display_name, u.avatar, u.email
      FROM saved_messages sv
      JOIN messages m ON m.id = sv.message_id
      JOIN signals c ON c.id = m.signal_id
      JOIN spaces sp ON sp.id = c.space_id
      JOIN users u ON u.id = m.author_id
      LEFT JOIN space_members sm ON sm.space_id = sp.id AND sm.user_id = ?
      WHERE sv.user_id = ? AND (sp.owner_id = ? OR sm.user_id IS NOT NULL)
      ORDER BY sv.created_at DESC LIMIT 500`).all(me, me, me);
    send(res, 200, rows.map((row) => ({
      id: row.id, content: row.content, createdAt: row.created_at, savedAt: row.saved_at,
      channelId: row.signal_id, channelName: row.channel_name, serverId: row.space_id, serverName: row.space_name,
      author: { id: row.author_id, username: row.username, displayName: row.display_name, avatar: row.avatar, verified: isVerifiedEmail(row.email) },
    })));
    return true;
  }

  // "¿Qué me perdí?": AI summary of the last N messages of a channel.
  if (catchupMatch && req.method === 'POST') {
    const channelId = decodeURIComponent(catchupMatch[1]);
    const channel = await db.prepare('SELECT c.name, c.space_id, s.name AS space_name FROM signals c JOIN spaces s ON s.id = c.space_id WHERE c.id = ?').get(channelId);
    if (!channel || !await canAccessSpace(channel.space_id, me)) { send(res, 404, { message: 'No encontramos ese canal.' }); return true; }
    const body = await readBody(req);
    const count = Math.min(150, Math.max(3, Math.floor(Number(body.count) || 30)));
    const rows = (await db.prepare('SELECT m.content, m.created_at, u.display_name, u.username FROM messages m JOIN users u ON u.id = m.author_id WHERE m.signal_id = ? ORDER BY m.created_at DESC LIMIT ?').all(channelId, count)).reverse();
    if (rows.length < 2) { send(res, 400, { message: 'No hay suficientes mensajes para resumir.' }); return true; }
    const me_ = await db.prepare('SELECT display_name, username FROM users WHERE id = ?').get(me);
    // Newest lines win when the transcript is too long for the model.
    let transcript = rows.map((row) => `${row.display_name || row.username}: ${String(row.content || '[archivo]').replace(/\s+/g, ' ').slice(0, 400)}`).join('\n');
    if (transcript.length > 10_000) transcript = transcript.slice(-10_000);
    const prompt = `Resume en español lo que pasó en el canal #${channel.name} del espacio "${channel.space_name}" mientras ${me_?.display_name || 'la persona'} (@${me_?.username || ''}) no estaba.
Formato (Markdown, breve, máximo 8 viñetas en total):
**En resumen:** una frase.
**Lo importante:** viñetas con los temas, decisiones o planes.
**Pendiente para ti:** solo si alguien te mencionó o te preguntó algo; si no, omite esta sección.
No inventes nada que no esté en los mensajes.

<mensajes>
${transcript}
</mensajes>`;
    try {
      const { text } = await askKovaAI(me, { prompt });
      send(res, 200, { summary: text, count: rows.length, from: rows[0].created_at, to: rows[rows.length - 1].created_at });
    } catch (error) {
      if (error instanceof AiError) { send(res, error.status, { message: error.message, code: error.code }); return true; }
      throw error;
    }
    return true;
  }

  if (requestPath === '/api/unread' && req.method === 'GET') {
    const user = await db.prepare('SELECT username FROM users WHERE id = ?').get(me);
    // Per channel: messages by others since the last read (or since joining).
    // Dates go back as parameters so TEXT and TIMESTAMPTZ columns both work.
    const channels = await db.prepare(`
      SELECT c.id AS channel_id, r.last_read_at, sm.joined_at, s.created_at AS space_created_at
      FROM signals c
      JOIN spaces s ON s.id = c.space_id
      LEFT JOIN space_members sm ON sm.space_id = s.id AND sm.user_id = ?
      LEFT JOIN channel_reads r ON r.channel_id = c.id AND r.user_id = ?
      WHERE (s.owner_id = ? OR sm.user_id IS NOT NULL) AND c.type <> 'voice'`).all(me, me, me);
    const rows = [];
    for (const channel of channels.slice(0, 300)) {
      const since = channel.last_read_at || channel.joined_at || channel.space_created_at;
      const fresh = await db.prepare('SELECT content FROM messages WHERE signal_id = ? AND author_id <> ? AND created_at > ? ORDER BY created_at DESC LIMIT 200')
        .all(channel.channel_id, me, since instanceof Date ? since.toISOString() : String(since));
      for (const message of fresh) rows.push({ channel_id: channel.channel_id, content: message.content });
    }
    const result = {};
    for (const row of rows) {
      const entry = result[row.channel_id] || (result[row.channel_id] = { unread: 0, mentions: 0 });
      entry.unread += 1;
      if (user && mentionsUser(row.content, user.username)) entry.mentions += 1;
    }
    send(res, 200, result);
    return true;
  }

  if (searchMatch && req.method === 'GET') {
    const spaceId = decodeURIComponent(searchMatch[1]);
    if (!await canAccessSpace(spaceId, me)) { send(res, 404, { message: 'No encontramos ese espacio.' }); return true; }
    const params = new URL(req.url || '/', 'http://localhost').searchParams;
    const query = String(params.get('q') || '').trim().slice(0, 100);
    const author = String(params.get('author') || '').trim();
    const channel = String(params.get('channel') || '').trim();
    const hasFile = params.get('has') === 'file';
    if (!query && !author && !hasFile) { send(res, 400, { message: 'Escribe algo para buscar.' }); return true; }
    const where = ['c.space_id = ?'];
    const args = [spaceId];
    if (query) {
      // Escape LIKE wildcards so "50%" searches literally.
      where.push("lower(m.content) LIKE ? ESCAPE '\\'");
      args.push(`%${query.toLowerCase().replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`);
    }
    if (author) { where.push('m.author_id = ?'); args.push(author); }
    if (channel) { where.push('m.signal_id = ?'); args.push(channel); }
    if (hasFile) where.push("m.attachments <> '[]'");
    const rows = await db.prepare(`
      SELECT m.id, m.signal_id, m.content, m.attachments, m.created_at, m.author_id, u.username, u.display_name, u.avatar, u.email, c.name AS channel_name
      FROM messages m JOIN signals c ON c.id = m.signal_id JOIN users u ON u.id = m.author_id
      WHERE ${where.join(' AND ')}
      ORDER BY m.created_at DESC LIMIT 50`).all(...args);
    send(res, 200, rows.map((row) => ({
      id: row.id,
      channelId: row.signal_id,
      channelName: row.channel_name,
      content: row.content,
      hasAttachments: row.attachments !== '[]',
      createdAt: row.created_at,
      author: { id: row.author_id, username: row.username, displayName: row.display_name, avatar: row.avatar, verified: isVerifiedEmail(row.email) },
    })));
    return true;
  }

  send(res, 405, { message: 'Método no permitido.' });
  return true;
}
