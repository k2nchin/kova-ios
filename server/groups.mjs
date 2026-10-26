// Group DMs: up to 10 friends chatting outside any space, with their own voice call.

export const groupsSchema = `CREATE TABLE IF NOT EXISTS dm_groups (id TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', owner_id TEXT NOT NULL, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS dm_group_members (group_id TEXT NOT NULL, user_id TEXT NOT NULL, joined_at TEXT NOT NULL, PRIMARY KEY(group_id, user_id)); CREATE TABLE IF NOT EXISTS group_messages (id TEXT PRIMARY KEY, group_id TEXT NOT NULL, author_id TEXT NOT NULL, content TEXT NOT NULL, attachments TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL);`;

const MAX_MEMBERS = 10;
const parse = (value) => { try { return JSON.parse(value || '[]'); } catch { return []; } };

export const isGroupMember = async (db, groupId, userId) => Boolean(await db.prepare('SELECT user_id FROM dm_group_members WHERE group_id = ? AND user_id = ?').get(groupId, userId));
const membersOf = async (db, groupId) => (await db.prepare('SELECT user_id FROM dm_group_members WHERE group_id = ?').all(groupId)).map((row) => row.user_id);
const areFriends = async (db, a, b) => Boolean(await db.prepare('SELECT user_a FROM friendships WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)').get(a, b, b, a));

/**
 *   GET    /api/groups                          your groups (members + last message)
 *   POST   /api/groups          { name, memberIds }   friends only
 *   PATCH  /api/groups/:id      { name }
 *   POST   /api/groups/:id/members  { userId }  add a friend
 *   DELETE /api/groups/:id/members/me          leave
 *   GET/POST /api/groups/:id/messages          { content, attachments }
 *   POST   /api/groups/:id/call                ring everyone in the group
 */
export async function handleGroupRoutes({ db, req, res, requestPath, session, send, readBody, emitToUsers, publicUser, userFromRow, sendPush, crypto }) {
  const match = requestPath.match(/^\/api\/groups(?:\/([^/]+)(?:\/(members|messages|call)(?:\/(me))?)?)?$/);
  if (!match) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const me = session.user_id;
  const now = new Date().toISOString();
  const groupId = match[1] ? decodeURIComponent(match[1]) : null;
  const sub = match[2];

  const userCard = async (id) => {
    const row = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!row) return null;
    const user = publicUser(userFromRow(row));
    return { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar, verified: user.verified };
  };
  const groupOut = async (group) => {
    const ids = await membersOf(db, group.id);
    const members = (await Promise.all(ids.map(userCard))).filter(Boolean);
    const last = await db.prepare('SELECT content, created_at, author_id FROM group_messages WHERE group_id = ? ORDER BY created_at DESC LIMIT 1').get(group.id);
    return { id: group.id, name: group.name, ownerId: group.owner_id, members, createdAt: group.created_at, lastMessage: last ? { content: last.content.slice(0, 120), createdAt: last.created_at, authorId: last.author_id } : null };
  };
  const notify = async (event, payload) => emitToUsers(await membersOf(db, groupId), event, payload);

  if (!groupId) {
    if (req.method === 'GET') {
      const groups = await db.prepare('SELECT g.* FROM dm_groups g JOIN dm_group_members m ON m.group_id = g.id WHERE m.user_id = ? ORDER BY g.created_at DESC').all(me);
      const out = [];
      for (const group of groups) out.push(await groupOut(group));
      out.sort((a, b) => (b.lastMessage?.createdAt || b.createdAt).localeCompare(a.lastMessage?.createdAt || a.createdAt));
      send(res, 200, out);
      return true;
    }
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const body = await readBody(req);
    const wanted = [...new Set((Array.isArray(body.memberIds) ? body.memberIds : []).map(String))].filter((id) => id !== me);
    if (wanted.length < 1) { send(res, 400, { message: 'Elige al menos a un amigo.' }); return true; }
    if (wanted.length + 1 > MAX_MEMBERS) { send(res, 400, { message: `Un grupo admite hasta ${MAX_MEMBERS} personas.` }); return true; }
    for (const id of wanted) if (!await areFriends(db, me, id)) { send(res, 403, { message: 'Solo puedes añadir a tus amigos.' }); return true; }
    const id = `group_${crypto.randomUUID()}`;
    await db.prepare('INSERT INTO dm_groups (id, name, owner_id, created_at) VALUES (?, ?, ?, ?)').run(id, String(body.name || '').trim().slice(0, 60), me, now);
    for (const userId of [me, ...wanted]) await db.prepare('INSERT INTO dm_group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)').run(id, userId, now);
    const group = await groupOut(await db.prepare('SELECT * FROM dm_groups WHERE id = ?').get(id));
    await emitToUsers([me, ...wanted], 'group:changed', { groupId: id });
    send(res, 201, group);
    return true;
  }

  const group = await db.prepare('SELECT * FROM dm_groups WHERE id = ?').get(groupId);
  if (!group || !await isGroupMember(db, groupId, me)) { send(res, 404, { message: 'No encontramos ese grupo.' }); return true; }

  if (!sub) {
    if (req.method !== 'PATCH') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const name = String((await readBody(req)).name || '').trim().slice(0, 60);
    await db.prepare('UPDATE dm_groups SET name = ? WHERE id = ?').run(name, groupId);
    await notify('group:changed', { groupId });
    send(res, 200, await groupOut({ ...group, name }));
    return true;
  }

  if (sub === 'members') {
    if (match[3] === 'me' && req.method === 'DELETE') {
      await notify('group:changed', { groupId });
      await db.prepare('DELETE FROM dm_group_members WHERE group_id = ? AND user_id = ?').run(groupId, me);
      const left = await membersOf(db, groupId);
      if (!left.length) {
        await db.prepare('DELETE FROM group_messages WHERE group_id = ?').run(groupId);
        await db.prepare('DELETE FROM dm_groups WHERE id = ?').run(groupId);
      } else if (group.owner_id === me) await db.prepare('UPDATE dm_groups SET owner_id = ? WHERE id = ?').run(left[0], groupId);
      send(res, 200, { ok: true });
      return true;
    }
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const userId = String((await readBody(req)).userId || '');
    if (!await areFriends(db, me, userId)) { send(res, 403, { message: 'Solo puedes añadir a tus amigos.' }); return true; }
    const current = await membersOf(db, groupId);
    if (current.includes(userId)) { send(res, 400, { message: 'Ya está en el grupo.' }); return true; }
    if (current.length >= MAX_MEMBERS) { send(res, 400, { message: `El grupo ya tiene ${MAX_MEMBERS} personas.` }); return true; }
    await db.prepare('INSERT INTO dm_group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)').run(groupId, userId, now);
    await notify('group:changed', { groupId });
    send(res, 200, await groupOut(group));
    return true;
  }

  if (sub === 'call') {
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const caller = await userCard(me);
    const others = (await membersOf(db, groupId)).filter((id) => id !== me);
    await emitToUsers(others, 'group:call', { groupId, groupName: group.name, caller });
    await sendPush(db, others, { title: `📞 ${caller?.displayName || 'Alguien'} te está llamando`, body: group.name || 'Grupo de Kova', url: `/app?group=${groupId}`, tag: `call-${groupId}` });
    send(res, 200, { ok: true });
    return true;
  }

  // messages
  if (req.method === 'GET') {
    const rows = await db.prepare('SELECT * FROM group_messages WHERE group_id = ? ORDER BY created_at DESC LIMIT 100').all(groupId);
    const authors = new Map();
    const out = [];
    for (const row of rows.reverse()) {
      if (!authors.has(row.author_id)) authors.set(row.author_id, await userCard(row.author_id));
      out.push({ id: row.id, groupId, author: authors.get(row.author_id), content: row.content, attachments: parse(row.attachments), createdAt: row.created_at });
    }
    send(res, 200, out);
    return true;
  }
  if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const body = await readBody(req);
  const content = String(body.content || '').trim().slice(0, 10_000);
  const attachments = (Array.isArray(body.attachments) ? body.attachments : []).slice(0, 10)
    .filter((item) => typeof item?.url === 'string' && /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/)/i.test(item.url))
    .map((item) => ({ id: String(item.id || '').slice(0, 64), url: item.url.slice(0, 2048), name: String(item.name || 'archivo').slice(0, 200), type: ['image', 'video', 'audio'].includes(item.type) ? item.type : 'file', size: String(item.size || '').slice(0, 20), duration: Number(item.duration) || undefined }));
  if (!content && !attachments.length) { send(res, 400, { message: 'Escribe un mensaje antes de enviarlo.' }); return true; }
  const message = { id: `gmsg_${crypto.randomUUID()}`, groupId, author: await userCard(me), content, attachments, createdAt: now };
  await db.prepare('INSERT INTO group_messages (id, group_id, author_id, content, attachments, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(message.id, groupId, me, content, JSON.stringify(attachments), now);
  await notify('group:message', message);
  const others = (await membersOf(db, groupId)).filter((id) => id !== me);
  await sendPush(db, others, { title: `${message.author?.displayName || 'Mensaje'} · ${group.name || 'Grupo'}`, body: content.slice(0, 200) || '📎 Adjunto', url: `/app?group=${groupId}`, tag: `group-${groupId}` });
  send(res, 201, message);
  return true;
}
