// Thread replies and shared notes, both stored on the server and seen by
// everyone in the space.
import crypto from 'node:crypto';

export const threadsSchema = `CREATE TABLE IF NOT EXISTS thread_messages (id TEXT PRIMARY KEY, parent_id TEXT NOT NULL, signal_id TEXT NOT NULL, author_id TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS channel_notes (id TEXT PRIMARY KEY, signal_id TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', tags TEXT NOT NULL DEFAULT '[]', author_id TEXT NOT NULL, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL, created_at TEXT NOT NULL);`;

const parseTags = (value) => { try { const tags = JSON.parse(value); return Array.isArray(tags) ? tags.map(String).slice(0, 10) : []; } catch { return []; } };
const cleanTags = (value) => (Array.isArray(value) ? [...new Set(value.map((tag) => String(tag).trim().slice(0, 24)).filter(Boolean))].slice(0, 10) : []);

/** Number of replies per parent message, for the "N respuestas" chip. */
export async function threadCounts(db, parentIds) {
  if (!parentIds.length) return {};
  const placeholders = parentIds.map(() => '?').join(',');
  const rows = await db.prepare(`SELECT parent_id, COUNT(*) AS total FROM thread_messages WHERE parent_id IN (${placeholders}) GROUP BY parent_id`).all(...parentIds);
  return Object.fromEntries(rows.map((row) => [row.parent_id, Number(row.total)]));
}

/**
 *   GET/POST /api/messages/:id/thread       replies of a message
 *   GET/POST /api/channels/:id/notes        notes of a notes channel
 *   PATCH/DELETE /api/notes/:id             edit (any member) / delete (author or MANAGE_MESSAGES)
 */
export async function handleThreadRoutes({ db, req, res, requestPath, session, send, readBody, canAccessSpace, can, publicUser, userFromRow, emitToChannel }) {
  const threadMatch = requestPath.match(/^\/api\/messages\/([^/]+)\/thread$/);
  const channelNotesMatch = requestPath.match(/^\/api\/channels\/([^/]+)\/notes$/);
  const noteMatch = requestPath.match(/^\/api\/notes\/([^/]+)$/);
  if (!threadMatch && !channelNotesMatch && !noteMatch) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const me = session.user_id;
  const now = () => new Date().toISOString();

  if (threadMatch) {
    const parentId = decodeURIComponent(threadMatch[1]);
    const parent = await db.prepare('SELECT m.id, m.signal_id, s.space_id FROM messages m JOIN signals s ON s.id = m.signal_id WHERE m.id = ?').get(parentId);
    if (!parent || !await canAccessSpace(parent.space_id, me)) { send(res, 404, { message: 'No encontramos ese mensaje.' }); return true; }
    if (req.method === 'GET') {
      const rows = await db.prepare('SELECT t.*, u.username, u.display_name, u.avatar FROM thread_messages t JOIN users u ON u.id = t.author_id WHERE t.parent_id = ? ORDER BY t.created_at LIMIT 500').all(parentId);
      send(res, 200, rows.map((row) => ({ id: row.id, parentId, channelId: row.signal_id, content: row.content, createdAt: row.created_at, author: { id: row.author_id, username: row.username, displayName: row.display_name, avatar: row.avatar } })));
      return true;
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const content = String(body.content || '').trim();
      if (!content || content.length > 4000) { send(res, 400, { message: 'La respuesta debe tener entre 1 y 4000 caracteres.' }); return true; }
      const reply = { id: `thread_${crypto.randomUUID()}`, parentId, channelId: parent.signal_id, content, createdAt: now() };
      await db.prepare('INSERT INTO thread_messages (id, parent_id, signal_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(reply.id, parentId, parent.signal_id, me, content, reply.createdAt);
      const author = publicUser(userFromRow(await db.prepare('SELECT * FROM users WHERE id = ?').get(me)));
      const count = Number((await db.prepare('SELECT COUNT(*) AS total FROM thread_messages WHERE parent_id = ?').get(parentId))?.total || 0);
      const payload = { ...reply, author, threadCount: count };
      await emitToChannel(parent.signal_id, 'thread:message', payload);
      send(res, 201, payload);
      return true;
    }
  }

  if (channelNotesMatch) {
    const channelId = decodeURIComponent(channelNotesMatch[1]);
    const channel = await db.prepare('SELECT id, space_id FROM signals WHERE id = ?').get(channelId);
    if (!channel || !await canAccessSpace(channel.space_id, me)) { send(res, 404, { message: 'No encontramos ese canal.' }); return true; }
    if (req.method === 'GET') {
      const rows = await db.prepare('SELECT n.*, u.display_name AS editor_name FROM channel_notes n LEFT JOIN users u ON u.id = n.updated_by WHERE n.signal_id = ? ORDER BY n.updated_at DESC').all(channelId);
      send(res, 200, rows.map((row) => ({ id: row.id, channelId, title: row.title, content: row.content, tags: parseTags(row.tags), authorId: row.author_id, updatedBy: row.editor_name || '', updatedAt: row.updated_at })));
      return true;
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const title = String(body.title || '').trim().slice(0, 120) || 'Nota sin título';
      const note = { id: `note_${crypto.randomUUID()}`, channelId, title, content: String(body.content || '').slice(0, 50_000), tags: cleanTags(body.tags), authorId: me, updatedAt: now() };
      await db.prepare('INSERT INTO channel_notes (id, signal_id, title, content, tags, author_id, updated_by, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(note.id, channelId, note.title, note.content, JSON.stringify(note.tags), me, me, note.updatedAt, note.updatedAt);
      await emitToChannel(channelId, 'notes:changed', { channelId });
      send(res, 201, note);
      return true;
    }
  }

  if (noteMatch) {
    const noteId = decodeURIComponent(noteMatch[1]);
    const note = await db.prepare('SELECT n.*, s.space_id FROM channel_notes n JOIN signals s ON s.id = n.signal_id WHERE n.id = ?').get(noteId);
    if (!note || !await canAccessSpace(note.space_id, me)) { send(res, 404, { message: 'No encontramos esa nota.' }); return true; }
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const title = body.title === undefined ? note.title : String(body.title).trim().slice(0, 120) || note.title;
      const content = body.content === undefined ? note.content : String(body.content).slice(0, 50_000);
      const tags = body.tags === undefined ? parseTags(note.tags) : cleanTags(body.tags);
      const updatedAt = now();
      await db.prepare('UPDATE channel_notes SET title = ?, content = ?, tags = ?, updated_by = ?, updated_at = ? WHERE id = ?').run(title, content, JSON.stringify(tags), me, updatedAt, noteId);
      await emitToChannel(note.signal_id, 'notes:changed', { channelId: note.signal_id, noteId, editorId: me });
      send(res, 200, { id: noteId, title, content, tags, updatedAt });
      return true;
    }
    if (req.method === 'DELETE') {
      if (note.author_id !== me && !await can(db, note.space_id, me, 'MANAGE_MESSAGES')) { send(res, 403, { message: 'Solo quien creó la nota o un moderador puede borrarla.' }); return true; }
      await db.prepare('DELETE FROM channel_notes WHERE id = ?').run(noteId);
      await emitToChannel(note.signal_id, 'notes:changed', { channelId: note.signal_id });
      send(res, 200, { ok: true });
      return true;
    }
  }

  send(res, 405, { message: 'Método no permitido.' });
  return true;
}
