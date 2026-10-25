// Roles, permissions and membership for spaces. The owner always has every
// permission; everyone else gets the union of @everyone and their roles.
import crypto from 'node:crypto';

export const spacesSchema = `CREATE TABLE IF NOT EXISTS space_roles (id TEXT PRIMARY KEY, space_id TEXT NOT NULL, name TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#99aab5', hoist INTEGER NOT NULL DEFAULT 0, permissions TEXT NOT NULL DEFAULT '[]', position INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS member_roles (space_id TEXT NOT NULL, user_id TEXT NOT NULL, role_id TEXT NOT NULL, PRIMARY KEY(space_id, user_id, role_id)); CREATE TABLE IF NOT EXISTS space_bans (space_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(space_id, user_id));`;

export const PERMISSIONS = [
  'ADMINISTRATOR', 'MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'BAN_MEMBERS',
  'MANAGE_MESSAGES', 'CREATE_INVITE', 'SEND_MESSAGES', 'VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES',
  'READ_MESSAGE_HISTORY', 'ADD_REACTIONS', 'MENTION_EVERYONE', 'CONNECT_VOICE', 'SPEAK_VOICE', 'STREAM_VIDEO',
  'MUTE_MEMBERS', 'MOVE_MEMBERS',
];
const EVERYONE_PERMS = ['SEND_MESSAGES', 'VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'ADD_REACTIONS', 'CREATE_INVITE', 'CONNECT_VOICE', 'SPEAK_VOICE', 'STREAM_VIDEO'];

export const everyoneRoleId = (spaceId) => `role_everyone_${spaceId}`;
export const ownerRoleId = (spaceId) => `role_owner_${spaceId}`;

const defaultRoles = (spaceId) => [
  { id: everyoneRoleId(spaceId), name: '@everyone', color: '#99aab5', hoist: 0, permissions: EVERYONE_PERMS, position: 0 },
  { id: ownerRoleId(spaceId), name: 'Creador', color: '#f4f5f7', hoist: 1, permissions: ['ADMINISTRATOR'], position: 100 },
  { id: `role_admin_${spaceId}`, name: 'Administrador', color: '#c2c4c8', hoist: 1, permissions: ['MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_MESSAGES'], position: 90 },
  { id: `role_mod_${spaceId}`, name: 'Moderador', color: '#a9acb1', hoist: 1, permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS', 'MUTE_MEMBERS'], position: 80 },
];

const parsePerms = (value) => {
  try {
    const list = JSON.parse(value);
    return Array.isArray(list) ? list.filter((p) => PERMISSIONS.includes(p)) : [];
  } catch { return []; }
};
const cleanPerms = (list) => [...new Set((Array.isArray(list) ? list : []).filter((p) => PERMISSIONS.includes(p)))];
const cleanColor = (value) => (/^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value).toLowerCase() : '#99aab5');
const roleOut = (row) => ({ id: row.id, name: row.name, color: row.color, hoist: Boolean(Number(row.hoist)), position: Number(row.position || 0), permissions: parsePerms(row.permissions) });

/** Seeds the default roles the first time a space is seen. */
export async function ensureRoles(db, spaceId) {
  const existing = await db.prepare('SELECT COUNT(*) AS count FROM space_roles WHERE space_id = ?').get(spaceId);
  if (Number(existing?.count || 0) > 0) return;
  const now = new Date().toISOString();
  for (const role of defaultRoles(spaceId)) {
    await db.prepare('INSERT INTO space_roles (id, space_id, name, color, hoist, permissions, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING')
      .run(role.id, spaceId, role.name, role.color, role.hoist, JSON.stringify(role.permissions), role.position, now);
  }
}

export async function rolesOf(db, spaceId) {
  await ensureRoles(db, spaceId);
  return (await db.prepare('SELECT * FROM space_roles WHERE space_id = ? ORDER BY position DESC, created_at').all(spaceId)).map(roleOut);
}

/** Map of userId -> role ids (the owner always carries the owner role). */
export async function memberRoleMap(db, spaceId, ownerId) {
  const map = new Map();
  for (const row of await db.prepare('SELECT user_id, role_id FROM member_roles WHERE space_id = ?').all(spaceId)) {
    map.set(row.user_id, [...(map.get(row.user_id) || []), row.role_id]);
  }
  map.set(ownerId, [ownerRoleId(spaceId), ...(map.get(ownerId) || []).filter((id) => id !== ownerRoleId(spaceId))]);
  return map;
}

export async function permissionsOf(db, spaceId, userId) {
  const space = await db.prepare('SELECT owner_id FROM spaces WHERE id = ?').get(spaceId);
  if (!space) return new Set();
  if (space.owner_id === userId) return new Set(PERMISSIONS);
  const member = await db.prepare('SELECT user_id FROM space_members WHERE space_id = ? AND user_id = ?').get(spaceId, userId);
  if (!member) return new Set();
  await ensureRoles(db, spaceId);
  const rows = await db.prepare('SELECT r.permissions FROM space_roles r WHERE r.space_id = ? AND (r.id = ? OR r.id IN (SELECT role_id FROM member_roles WHERE space_id = ? AND user_id = ?))')
    .all(spaceId, everyoneRoleId(spaceId), spaceId, userId);
  const perms = new Set(rows.flatMap((row) => parsePerms(row.permissions)));
  return perms.has('ADMINISTRATOR') ? new Set(PERMISSIONS) : perms;
}

export const can = async (db, spaceId, userId, permission) => (await permissionsOf(db, spaceId, userId)).has(permission);

/** Owner + members: who should hear about changes to a space. */
export async function spaceAudience(db, spaceId) {
  const space = await db.prepare('SELECT owner_id FROM spaces WHERE id = ?').get(spaceId);
  if (!space) return [];
  const members = (await db.prepare('SELECT user_id FROM space_members WHERE space_id = ?').all(spaceId)).map((row) => row.user_id);
  return [space.owner_id, ...members];
}

/** Removes every role/ban row of a deleted space. */
export async function deleteSpaceExtras(tx, spaceId) {
  await tx.prepare('DELETE FROM member_roles WHERE space_id = ?').run(spaceId);
  await tx.prepare('DELETE FROM space_roles WHERE space_id = ?').run(spaceId);
  await tx.prepare('DELETE FROM space_bans WHERE space_id = ?').run(spaceId);
  await tx.prepare('DELETE FROM space_nicknames WHERE space_id = ?').run(spaceId);
}

/**
 * Role and membership routes:
 *   POST   /api/servers/:id/roles                 create role        (MANAGE_ROLES)
 *   PATCH  /api/servers/:id/roles/:roleId         edit role          (MANAGE_ROLES)
 *   DELETE /api/servers/:id/roles/:roleId         delete role        (MANAGE_ROLES)
 *   PUT    /api/servers/:id/members/:userId/roles/:roleId   give role   (MANAGE_ROLES)
 *   DELETE /api/servers/:id/members/:userId/roles/:roleId   take role   (MANAGE_ROLES)
 *   DELETE /api/servers/:id/members/:userId       leave (self) / kick (KICK_MEMBERS) / ?ban=1 (BAN_MEMBERS)
 * Returns true when it answered.
 */
export async function handleSpaceRoutes({ db, req, res, requestPath, session, send, readBody, notifySpace, emitToUsers }) {
  const match = requestPath.match(/^\/api\/servers\/([^/]+)\/(roles|members)(?:\/([^/]+))?(?:\/roles\/([^/]+))?$/);
  if (!match) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const [, rawSpaceId, kind, rawTarget, rawRoleId] = match;
  const spaceId = decodeURIComponent(rawSpaceId);
  const target = rawTarget ? decodeURIComponent(rawTarget) : '';
  const roleId = rawRoleId ? decodeURIComponent(rawRoleId) : '';
  const space = await db.prepare('SELECT * FROM spaces WHERE id = ?').get(spaceId);
  if (!space) { send(res, 404, { message: 'No encontramos ese espacio.' }); return true; }
  const me = session.user_id;
  const isOwner = space.owner_id === me;
  const perms = await permissionsOf(db, spaceId, me);
  if (!perms.size) { send(res, 403, { message: 'No perteneces a este espacio.' }); return true; }
  const deny = (message) => { send(res, 403, { message }); return true; };

  // ---- Roles ----
  if (kind === 'roles') {
    if (!perms.has('MANAGE_ROLES')) return deny('No tienes permiso para gestionar roles.');
    await ensureRoles(db, spaceId);
    if (!target && req.method === 'POST') {
      const body = await readBody(req);
      const name = String(body.name || '').trim().slice(0, 40);
      if (!name) { send(res, 400, { message: 'El rol necesita un nombre.' }); return true; }
      const permissions = cleanPerms(body.permissions);
      if (permissions.includes('ADMINISTRATOR') && !isOwner) return deny('Solo el creador puede dar el permiso de administrador.');
      const count = Number((await db.prepare('SELECT COUNT(*) AS count FROM space_roles WHERE space_id = ?').get(spaceId))?.count || 0);
      if (count >= 50) { send(res, 400, { message: 'Un espacio puede tener como máximo 50 roles.' }); return true; }
      const role = { id: `role_${crypto.randomUUID()}`, name, color: cleanColor(body.color), hoist: body.hoist ? 1 : 0, permissions, position: 10 + count };
      await db.prepare('INSERT INTO space_roles (id, space_id, name, color, hoist, permissions, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(role.id, spaceId, role.name, role.color, role.hoist, JSON.stringify(role.permissions), role.position, new Date().toISOString());
      await notifySpace(spaceId, 'roles');
      send(res, 201, roleOut({ ...role, permissions: JSON.stringify(role.permissions) }));
      return true;
    }
    const row = target && await db.prepare('SELECT * FROM space_roles WHERE id = ? AND space_id = ?').get(target, spaceId);
    if (!row) { send(res, 404, { message: 'Ese rol no existe.' }); return true; }
    if (row.id === ownerRoleId(spaceId)) return deny('El rol de creador no se puede cambiar.');
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const permissions = body.permissions === undefined ? parsePerms(row.permissions) : cleanPerms(body.permissions);
      if (permissions.includes('ADMINISTRATOR') && !parsePerms(row.permissions).includes('ADMINISTRATOR') && !isOwner) return deny('Solo el creador puede dar el permiso de administrador.');
      const name = row.id === everyoneRoleId(spaceId) ? row.name : (body.name === undefined ? row.name : String(body.name).trim().slice(0, 40) || row.name);
      const color = body.color === undefined ? row.color : cleanColor(body.color);
      const hoist = body.hoist === undefined ? Number(row.hoist) : (body.hoist ? 1 : 0);
      await db.prepare('UPDATE space_roles SET name = ?, color = ?, hoist = ?, permissions = ? WHERE id = ?').run(name, color, hoist, JSON.stringify(permissions), row.id);
      await notifySpace(spaceId, 'roles');
      send(res, 200, roleOut({ ...row, name, color, hoist, permissions: JSON.stringify(permissions) }));
      return true;
    }
    if (req.method === 'DELETE') {
      if (row.id === everyoneRoleId(spaceId)) return deny('El rol @everyone no se puede borrar.');
      await db.prepare('DELETE FROM member_roles WHERE role_id = ?').run(row.id);
      await db.prepare('DELETE FROM space_roles WHERE id = ?').run(row.id);
      await notifySpace(spaceId, 'roles');
      send(res, 200, { ok: true });
      return true;
    }
    send(res, 405, { message: 'Método no permitido.' });
    return true;
  }

  // ---- Members ----
  if (!target) { send(res, 404, { message: 'Ruta no implementada' }); return true; }
  const targetIsMember = target === space.owner_id || Boolean(await db.prepare('SELECT user_id FROM space_members WHERE space_id = ? AND user_id = ?').get(spaceId, target));
  if (!targetIsMember) { send(res, 404, { message: 'Esa persona no está en el espacio.' }); return true; }

  if (roleId) {
    if (!perms.has('MANAGE_ROLES')) return deny('No tienes permiso para asignar roles.');
    if (roleId === ownerRoleId(spaceId) || roleId === everyoneRoleId(spaceId)) return deny('Ese rol no se puede asignar.');
    const role = await db.prepare('SELECT permissions FROM space_roles WHERE id = ? AND space_id = ?').get(roleId, spaceId);
    if (!role) { send(res, 404, { message: 'Ese rol no existe.' }); return true; }
    if (parsePerms(role.permissions).includes('ADMINISTRATOR') && !isOwner) return deny('Solo el creador puede dar roles de administrador.');
    if (req.method === 'PUT') await db.prepare('INSERT INTO member_roles (space_id, user_id, role_id) VALUES (?, ?, ?) ON CONFLICT (space_id, user_id, role_id) DO NOTHING').run(spaceId, target, roleId);
    else if (req.method === 'DELETE') await db.prepare('DELETE FROM member_roles WHERE space_id = ? AND user_id = ? AND role_id = ?').run(spaceId, target, roleId);
    else { send(res, 405, { message: 'Método no permitido.' }); return true; }
    await notifySpace(spaceId, 'members');
    send(res, 200, { ok: true });
    return true;
  }

  if (req.method === 'DELETE') {
    const ban = new URL(req.url || '/', 'http://localhost').searchParams.get('ban') === '1';
    if (target === space.owner_id) return deny(target === me ? 'El creador no puede salir: borra el espacio o transfiérelo.' : 'No puedes expulsar al creador.');
    if (target !== me) {
      if (ban ? !perms.has('BAN_MEMBERS') : !perms.has('KICK_MEMBERS')) return deny(ban ? 'No tienes permiso para vetar.' : 'No tienes permiso para expulsar.');
      const targetPerms = await permissionsOf(db, spaceId, target);
      if (targetPerms.has('ADMINISTRATOR') && !isOwner) return deny('No puedes expulsar a un administrador.');
    }
    await db.prepare('DELETE FROM member_roles WHERE space_id = ? AND user_id = ?').run(spaceId, target);
    await db.prepare('DELETE FROM space_nicknames WHERE space_id = ? AND user_id = ?').run(spaceId, target);
    await db.prepare('DELETE FROM space_members WHERE space_id = ? AND user_id = ?').run(spaceId, target);
    if (ban && target !== me) await db.prepare('INSERT INTO space_bans (space_id, user_id, created_at) VALUES (?, ?, ?) ON CONFLICT (space_id, user_id) DO NOTHING').run(spaceId, target, new Date().toISOString());
    await notifySpace(spaceId, 'members');
    // The removed person must drop the space too.
    await emitToUsers([target], 'space:changed', { serverId: spaceId, kind: 'removed' });
    send(res, 200, { ok: true });
    return true;
  }
  send(res, 405, { message: 'Método no permitido.' });
  return true;
}
