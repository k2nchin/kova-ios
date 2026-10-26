// Per-channel permissions: private channels (only some roles see them) and
// read-only channels (everyone reads, only some roles write). People with
// MANAGE_CHANNELS (owner, admins) always see and write everywhere.
import { permissionsOf } from './spaces.mjs';

export const channelPermsSchema = `CREATE TABLE IF NOT EXISTS channel_access (signal_id TEXT PRIMARY KEY, private INTEGER NOT NULL DEFAULT 0, view_roles TEXT NOT NULL DEFAULT '[]', read_only INTEGER NOT NULL DEFAULT 0, send_roles TEXT NOT NULL DEFAULT '[]', updated_at TEXT NOT NULL);`;

const parse = (value) => { try { const list = JSON.parse(value || '[]'); return Array.isArray(list) ? list.map(String) : []; } catch { return []; } };

const accessRow = async (db, channelId) => {
  const row = await db.prepare('SELECT * FROM channel_access WHERE signal_id = ?').get(channelId);
  return row ? { private: Boolean(Number(row.private)), viewRoles: parse(row.view_roles), readOnly: Boolean(Number(row.read_only)), sendRoles: parse(row.send_roles) } : null;
};

const rolesOfUser = async (db, spaceId, userId) =>
  new Set((await db.prepare('SELECT role_id FROM member_roles WHERE space_id = ? AND user_id = ?').all(spaceId, userId)).map((row) => row.role_id));

/** What this user can do in this channel. Space membership must be checked separately. */
export async function channelRights(db, channel, userId) {
  const perms = await permissionsOf(db, channel.space_id, userId);
  if (!perms.size) return { view: false, send: false };
  const access = await accessRow(db, channel.id);
  const canSend = perms.has('SEND_MESSAGES');
  if (!access || perms.has('MANAGE_CHANNELS')) return { view: true, send: canSend || perms.has('MANAGE_CHANNELS') };
  const mine = await rolesOfUser(db, channel.space_id, userId);
  const view = !access.private || access.viewRoles.some((id) => mine.has(id));
  const send = view && canSend && (!access.readOnly || access.sendRoles.some((id) => mine.has(id)));
  return { view, send };
}

/** Channels of a space this user may see, with the flags the client shows. */
export async function visibleChannels(db, spaceId, userId, channels) {
  const perms = await permissionsOf(db, spaceId, userId);
  const rows = await db.prepare(`SELECT * FROM channel_access WHERE signal_id IN (SELECT id FROM signals WHERE space_id = ?)`).all(spaceId);
  const byId = new Map(rows.map((row) => [row.signal_id, row]));
  const manage = perms.has('MANAGE_CHANNELS');
  const mine = byId.size && !manage ? await rolesOfUser(db, spaceId, userId) : new Set();
  const out = [];
  for (const channel of channels) {
    const row = byId.get(channel.id);
    const isPrivate = Boolean(row && Number(row.private));
    const readOnly = Boolean(row && Number(row.read_only));
    const view = manage || !isPrivate || parse(row?.view_roles).some((id) => mine.has(id));
    if (!view) continue;
    const canSend = manage || (perms.has('SEND_MESSAGES') && (!readOnly || parse(row?.send_roles).some((id) => mine.has(id))));
    out.push({ ...channel, private: isPrivate, readOnly, canSend });
  }
  return out;
}

/** Of these users, the ones who can see the channel (for badges, mentions and push). */
export async function channelViewers(db, channel, userIds) {
  const access = await accessRow(db, channel.id);
  if (!access || !access.private) return userIds;
  const result = [];
  for (const userId of userIds) if ((await channelRights(db, channel, userId)).view) result.push(userId);
  return result;
}

/** Channel the request is about, from its path (or voice token body is checked in the route). */
export async function channelFromPath(db, requestPath) {
  const byChannel = requestPath.match(/^\/api\/(?:channels|voice)\/([^/]+)\/[a-z]+$/);
  if (byChannel) return db.prepare('SELECT id, space_id, type FROM signals WHERE id = ?').get(decodeURIComponent(byChannel[1]));
  const byMessage = requestPath.match(/^\/api\/messages\/([^/]+)(?:\/[a-z]+)?$/);
  if (byMessage) return db.prepare('SELECT s.id, s.space_id, s.type FROM messages m JOIN signals s ON s.id = m.signal_id WHERE m.id = ?').get(decodeURIComponent(byMessage[1]));
  return null;
}

/**
 *   GET /api/channels/:id/access    { private, viewRoles, readOnly, sendRoles }   (MANAGE_CHANNELS)
 *   PUT /api/channels/:id/access    same body
 */
export async function handleChannelAccessRoutes({ db, req, res, requestPath, session, send, readBody, can, notifySpace }) {
  const match = requestPath.match(/^\/api\/channels\/([^/]+)\/access$/);
  if (!match) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const channel = await db.prepare('SELECT id, space_id FROM signals WHERE id = ?').get(decodeURIComponent(match[1]));
  if (!channel || !await can(db, channel.space_id, session.user_id, 'MANAGE_CHANNELS')) { send(res, 403, { message: 'Necesitas el permiso Gestionar canales.' }); return true; }
  if (req.method === 'PUT') {
    const body = await readBody(req);
    const roleIds = new Set((await db.prepare('SELECT id FROM space_roles WHERE space_id = ?').all(channel.space_id)).map((row) => row.id));
    const clean = (list) => JSON.stringify([...new Set((Array.isArray(list) ? list : []).map(String))].filter((id) => roleIds.has(id)).slice(0, 50));
    await db.prepare('DELETE FROM channel_access WHERE signal_id = ?').run(channel.id);
    await db.prepare('INSERT INTO channel_access (signal_id, private, view_roles, read_only, send_roles, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(channel.id, body.private ? 1 : 0, clean(body.viewRoles), body.readOnly ? 1 : 0, clean(body.sendRoles), new Date().toISOString());
    await notifySpace(channel.space_id, 'channels');
  } else if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  send(res, 200, (await accessRow(db, channel.id)) || { private: false, viewRoles: [], readOnly: false, sendRoles: [] });
  return true;
}
