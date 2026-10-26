// Forum channels: each post is a message with a title and tags; replies use the
// existing message threads. Moderators define the channel's tag list.
import { threadCounts } from './threads.mjs';

export const forumsSchema = `CREATE TABLE IF NOT EXISTS forum_posts (message_id TEXT PRIMARY KEY, signal_id TEXT NOT NULL, title TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS forum_tags (signal_id TEXT PRIMARY KEY, tags TEXT NOT NULL DEFAULT '[]');`;

const parse = (value) => { try { const list = JSON.parse(value || '[]'); return Array.isArray(list) ? list : []; } catch { return []; } };
const tagsOf = async (db, channelId) => parse((await db.prepare('SELECT tags FROM forum_tags WHERE signal_id = ?').get(channelId))?.tags);

/**
 *   GET  /api/channels/:id/posts[?tag=]         posts, newest activity first, + available tags
 *   POST /api/channels/:id/posts                { title, content, tags }
 *   PUT  /api/channels/:id/forum-tags           { tags: string[] }   (MANAGE_CHANNELS)
 * Channel visibility / read-only rules are enforced before this runs.
 */
export async function handleForumRoutes({ db, req, res, requestPath, session, send, readBody, can, canAccessSpace, deliverMessage, notifySpace, isVerifiedEmail }) {
  const match = requestPath.match(/^\/api\/channels\/([^/]+)\/(posts|forum-tags)$/);
  if (!match) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const channel = await db.prepare('SELECT id, space_id, type FROM signals WHERE id = ?').get(decodeURIComponent(match[1]));
  if (!channel || channel.type !== 'forum' || !await canAccessSpace(channel.space_id, session.user_id)) { send(res, 404, { message: 'No encontramos ese foro.' }); return true; }

  if (match[2] === 'forum-tags') {
    if (req.method !== 'PUT') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    if (!await can(db, channel.space_id, session.user_id, 'MANAGE_CHANNELS')) { send(res, 403, { message: 'Necesitas el permiso Gestionar canales.' }); return true; }
    const body = await readBody(req);
    const tags = [...new Set((Array.isArray(body.tags) ? body.tags : []).map((tag) => String(tag || '').trim().slice(0, 24)).filter(Boolean))].slice(0, 20);
    await db.prepare('DELETE FROM forum_tags WHERE signal_id = ?').run(channel.id);
    await db.prepare('INSERT INTO forum_tags (signal_id, tags) VALUES (?, ?)').run(channel.id, JSON.stringify(tags));
    await notifySpace(channel.space_id, 'channels');
    send(res, 200, { tags });
    return true;
  }

  const available = await tagsOf(db, channel.id);
  if (req.method === 'POST') {
    const body = await readBody(req);
    const title = String(body.title || '').trim().slice(0, 120);
    const content = String(body.content || '').trim().slice(0, 10_000);
    const tags = [...new Set((Array.isArray(body.tags) ? body.tags : []).map(String))].filter((tag) => available.includes(tag)).slice(0, 5);
    if (!title) { send(res, 400, { message: 'Ponle un título a la publicación.' }); return true; }
    if (!content) { send(res, 400, { message: 'Escribe el contenido de la publicación.' }); return true; }
    const message = await deliverMessage({ channelId: channel.id, spaceId: channel.space_id, authorId: session.user_id, content });
    await db.prepare('INSERT INTO forum_posts (message_id, signal_id, title, tags, created_at) VALUES (?, ?, ?, ?, ?)').run(message.id, channel.id, title, JSON.stringify(tags), message.createdAt);
    send(res, 201, { ...message, title, tags, replies: 0, lastActivityAt: message.createdAt });
    return true;
  }
  if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }

  const tag = new URL(req.url || '/', 'http://localhost').searchParams.get('tag');
  const rows = await db.prepare(`SELECT p.title, p.tags, m.id, m.content, m.created_at, m.author_id, m.pinned_at, u.username, u.display_name, u.avatar, u.email,
      (SELECT MAX(t.created_at) FROM thread_messages t WHERE t.parent_id = m.id) AS last_reply
    FROM forum_posts p JOIN messages m ON m.id = p.message_id JOIN users u ON u.id = m.author_id
    WHERE p.signal_id = ? ORDER BY m.created_at DESC LIMIT 200`).all(channel.id);
  const counts = await threadCounts(db, rows.map((row) => row.id));
  const posts = rows
    .map((row) => ({
      id: row.id,
      channelId: channel.id,
      title: row.title,
      tags: parse(row.tags),
      content: row.content,
      createdAt: row.created_at,
      pinned: Boolean(row.pinned_at),
      replies: counts[row.id] || 0,
      lastActivityAt: row.last_reply && row.last_reply > row.created_at ? row.last_reply : row.created_at,
      author: { id: row.author_id, username: row.username, displayName: row.display_name, avatar: row.avatar, status: 'online', verified: isVerifiedEmail(row.email) },
    }))
    .filter((post) => !tag || post.tags.includes(tag))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.lastActivityAt.localeCompare(a.lastActivityAt));
  send(res, 200, { tags: available, posts });
  return true;
}
