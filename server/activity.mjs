// Unread counts, @mentions and message search.
// A channel's unread count is what arrived after the person last read it.

export const activitySchema = `CREATE TABLE IF NOT EXISTS channel_reads (user_id TEXT NOT NULL, channel_id TEXT NOT NULL, last_read_at TEXT NOT NULL, PRIMARY KEY(user_id, channel_id));`;

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
export async function handleActivityRoutes({ db, req, res, requestPath, session, send, canAccessSpace, isVerifiedEmail }) {
  const readMatch = requestPath.match(/^\/api\/channels\/([^/]+)\/read$/);
  const searchMatch = requestPath.match(/^\/api\/servers\/([^/]+)\/search$/);
  if (!readMatch && requestPath !== '/api/unread' && !searchMatch) return false;
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
