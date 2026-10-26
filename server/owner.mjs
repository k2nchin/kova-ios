// Owner tools: shareable space templates (structure only, never messages or
// members) and space statistics.
import { ensureRoles, everyoneRoleId, ownerRoleId } from './spaces.mjs';

export const ownerSchema = `CREATE TABLE IF NOT EXISTS space_templates (code TEXT PRIMARY KEY, source_space_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', data TEXT NOT NULL, created_by TEXT NOT NULL, uses INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);`;

const parse = (value, fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
const DAY = 86_400_000;

/** Structure of a space: categories, channels, custom roles, welcome screen. */
async function snapshot(db, spaceId) {
  const space = await db.prepare('SELECT * FROM spaces WHERE id = ?').get(spaceId);
  const categories = await db.prepare('SELECT id, name FROM categories WHERE space_id = ? ORDER BY position, created_at').all(spaceId);
  const channels = await db.prepare('SELECT name, type, topic, category_id FROM signals WHERE space_id = ? ORDER BY created_at').all(spaceId);
  const roles = await db.prepare('SELECT id, name, color, hoist, permissions, position FROM space_roles WHERE space_id = ? ORDER BY position').all(spaceId);
  const welcome = await db.prepare('SELECT message, rules, require_accept FROM space_welcome WHERE space_id = ? AND enabled = 1').get(spaceId);
  return {
    name: space.name,
    description: space.description || '',
    category: space.category || 'community',
    categories: categories.map((c) => c.name),
    channels: channels.map((c) => ({ name: c.name, type: c.type, topic: c.topic || '', category: categories.findIndex((cat) => cat.id === c.category_id) })),
    roles: roles.filter((r) => r.id !== everyoneRoleId(spaceId) && r.id !== ownerRoleId(spaceId)).map((r) => ({ name: r.name, color: r.color, hoist: Boolean(Number(r.hoist)), permissions: parse(r.permissions, []) })),
    welcome: welcome ? { message: welcome.message, rules: parse(welcome.rules, []), requireAccept: Boolean(Number(welcome.require_accept)) } : null,
  };
}

const preview = (row) => {
  const data = parse(row.data, {});
  return { code: row.code, name: row.name, description: row.description, uses: Number(row.uses || 0), createdAt: row.created_at, channels: data.channels || [], categories: data.categories || [], roles: (data.roles || []).map((r) => ({ name: r.name, color: r.color })), hasWelcome: Boolean(data.welcome) };
};

async function stats(db, spaceId) {
  const now = Date.now();
  const since30 = new Date(now - 30 * DAY).toISOString();
  const since7 = new Date(now - 7 * DAY).toISOString();
  const since14 = new Date(now - 14 * DAY).toISOString();
  const space = await db.prepare('SELECT owner_id, created_at FROM spaces WHERE id = ?').get(spaceId);
  const members = await db.prepare('SELECT user_id, joined_at FROM space_members WHERE space_id = ?').all(spaceId);
  const messages = await db.prepare('SELECT m.author_id, m.created_at, m.signal_id FROM messages m JOIN signals s ON s.id = m.signal_id WHERE s.space_id = ? AND m.created_at >= ? AND m.author_id NOT LIKE ?').all(spaceId, since30, 'wh_%');
  const channels = await db.prepare("SELECT id, name, type FROM signals WHERE space_id = ? AND type NOT IN ('voice', 'stage')").all(spaceId);

  const days = Array.from({ length: 30 }, (_, i) => new Date(now - (29 - i) * DAY).toISOString().slice(0, 10));
  const perDay = Object.fromEntries(days.map((d) => [d, { messages: 0, joins: 0 }]));
  for (const m of messages) { const d = m.created_at.slice(0, 10); if (perDay[d]) perDay[d].messages += 1; }
  for (const m of members) { const d = String(m.joined_at || '').slice(0, 10); if (perDay[d]) perDay[d].joins += 1; }

  const hours = Array(24).fill(0);
  for (const m of messages) hours[new Date(m.created_at).getUTCHours()] += 1;

  const byChannel = new Map();
  const lastByChannel = new Map();
  for (const m of messages) byChannel.set(m.signal_id, (byChannel.get(m.signal_id) || 0) + 1);
  const lastRows = await db.prepare('SELECT m.signal_id, MAX(m.created_at) AS last FROM messages m JOIN signals s ON s.id = m.signal_id WHERE s.space_id = ? GROUP BY m.signal_id').all(spaceId);
  for (const row of lastRows) lastByChannel.set(row.signal_id, row.last);

  const activeWeek = new Set(messages.filter((m) => m.created_at >= since7).map((m) => m.author_id));
  const joined30 = members.filter((m) => String(m.joined_at || '') >= since30);
  // Of people who joined in the last 30 days, how many wrote at least once.
  const writers = new Set(messages.map((m) => m.author_id));
  const retained = joined30.filter((m) => writers.has(m.user_id)).length;

  const topUsers = [...messages.reduce((map, m) => map.set(m.author_id, (map.get(m.author_id) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const names = new Map();
  for (const [id] of topUsers) { const u = await db.prepare('SELECT display_name, username, avatar FROM users WHERE id = ?').get(id); names.set(id, u); }

  return {
    totals: {
      members: members.length + (members.some((m) => m.user_id === space.owner_id) ? 0 : 1),
      messages30: messages.length,
      activeWeek: activeWeek.size,
      joins30: joined30.length,
      newcomerRetention: joined30.length ? Math.round((retained / joined30.length) * 100) : null,
    },
    days: days.map((d) => ({ date: d, ...perDay[d] })),
    hours,
    topChannels: channels.map((c) => ({ id: c.id, name: c.name, messages: byChannel.get(c.id) || 0 })).sort((a, b) => b.messages - a.messages).slice(0, 5),
    deadChannels: channels.filter((c) => !lastByChannel.get(c.id) || lastByChannel.get(c.id) < since14).map((c) => ({ id: c.id, name: c.name, lastMessageAt: lastByChannel.get(c.id) || null })),
    topMembers: topUsers.map(([id, count]) => ({ id, name: names.get(id)?.display_name || names.get(id)?.username || 'Usuario', avatar: names.get(id)?.avatar || '', messages: count })),
  };
}

/**
 *   POST /api/servers/:id/template          create/refresh your space's template code   (MANAGE_SERVER)
 *   GET  /api/servers/:id/template          current code of this space (if any)
 *   GET  /api/templates/:code               preview (any signed-in user)
 *   POST /api/templates/:code/use  { name } new space with that structure
 *   GET  /api/servers/:id/stats             statistics   (MANAGE_SERVER)
 */
export async function handleOwnerRoutes({ db, req, res, requestPath, session, send, readBody, can, crypto }) {
  const spaceTemplate = requestPath.match(/^\/api\/servers\/([^/]+)\/(template|stats)$/);
  const template = requestPath.match(/^\/api\/templates\/([A-Za-z0-9]{6,16})(\/use)?$/);
  if (!spaceTemplate && !template) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const now = new Date().toISOString();

  if (spaceTemplate) {
    const spaceId = decodeURIComponent(spaceTemplate[1]);
    if (!await can(db, spaceId, session.user_id, 'MANAGE_SERVER')) { send(res, 403, { message: 'Necesitas el permiso Gestionar espacio.' }); return true; }
    if (spaceTemplate[2] === 'stats') {
      if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
      send(res, 200, await stats(db, spaceId));
      return true;
    }
    const existing = await db.prepare('SELECT * FROM space_templates WHERE source_space_id = ?').get(spaceId);
    if (req.method === 'GET') { send(res, 200, existing ? preview(existing) : null); return true; }
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const data = await snapshot(db, spaceId);
    const code = existing?.code || crypto.randomBytes(6).toString('base64url').replace(/[^A-Za-z0-9]/g, 'k').slice(0, 8);
    await db.prepare('DELETE FROM space_templates WHERE code = ?').run(code);
    await db.prepare('INSERT INTO space_templates (code, source_space_id, name, description, data, created_by, uses, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(code, spaceId, data.name, data.description, JSON.stringify(data), session.user_id, Number(existing?.uses || 0), now);
    send(res, 200, preview(await db.prepare('SELECT * FROM space_templates WHERE code = ?').get(code)));
    return true;
  }

  const row = await db.prepare('SELECT * FROM space_templates WHERE code = ?').get(template[1]);
  if (!row) { send(res, 404, { message: 'Esa plantilla no existe.' }); return true; }
  if (!template[2]) {
    if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    send(res, 200, preview(row));
    return true;
  }
  if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const body = await readBody(req);
  const data = parse(row.data, {});
  const spaceId = `space_${crypto.randomUUID()}`;
  const name = String(body.name || data.name || 'Nuevo espacio').trim().slice(0, 100);
  await db.prepare("INSERT INTO spaces (id, owner_id, name, description, visibility, created_at) VALUES (?, ?, ?, ?, 'private', ?)").run(spaceId, session.user_id, name, String(data.description || '').slice(0, 1000), now);
  try { await db.prepare('UPDATE spaces SET category = ? WHERE id = ?').run(data.category || 'community', spaceId); } catch { /* older schema */ }
  const categoryIds = [];
  for (const [index, categoryName] of (data.categories || []).slice(0, 50).entries()) {
    const id = `category_${crypto.randomUUID()}`;
    categoryIds.push(id);
    await db.prepare('INSERT INTO categories (id, space_id, name, position, created_at) VALUES (?, ?, ?, ?, ?)').run(id, spaceId, String(categoryName).slice(0, 64), index, now);
  }
  for (const channel of (data.channels || []).slice(0, 200)) {
    const type = ['text', 'voice', 'announcements', 'notes', 'forum', 'stage'].includes(channel.type) ? channel.type : 'text';
    await db.prepare('INSERT INTO signals (id, space_id, name, type, topic, category_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(`signal_${crypto.randomUUID()}`, spaceId, String(channel.name || 'canal').slice(0, 100), type, String(channel.topic || '').slice(0, 500), categoryIds[channel.category] || null, now);
  }
  await ensureRoles(db, spaceId);
  for (const [index, role] of (data.roles || []).slice(0, 50).entries()) {
    await db.prepare('INSERT INTO space_roles (id, space_id, name, color, hoist, permissions, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(`role_${crypto.randomUUID()}`, spaceId, String(role.name || 'Rol').slice(0, 64), /^#[0-9a-f]{6}$/i.test(role.color) ? role.color : '#99aab5', role.hoist ? 1 : 0, JSON.stringify(Array.isArray(role.permissions) ? role.permissions : []), index + 1, now);
  }
  if (data.welcome) {
    await db.prepare('INSERT INTO space_welcome (space_id, enabled, message, rules, require_accept, questions, updated_at) VALUES (?, 1, ?, ?, ?, ?, ?)')
      .run(spaceId, String(data.welcome.message || ''), JSON.stringify(data.welcome.rules || []), data.welcome.requireAccept ? 1 : 0, '[]', now);
  }
  await db.prepare('UPDATE space_templates SET uses = uses + 1 WHERE code = ?').run(row.code);
  send(res, 201, { id: spaceId, name });
  return true;
}
