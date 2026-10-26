// Audit log: who changed what in a space. Recorded around every successful admin
// request (one place, so no route can forget), plus a small "before" lookup for
// deletions where the target would be gone afterwards.

export const auditSchema = `CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, space_id TEXT NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL DEFAULT '', details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);`;

const nameOf = async (db, table, id, column = 'name') => (await db.prepare(`SELECT ${column} AS v FROM ${table} WHERE id = ?`).get(id))?.v || '';
const userName = async (db, id) => { const u = await db.prepare('SELECT display_name, username FROM users WHERE id = ?').get(id); return u ? (u.display_name || u.username) : ''; };

/**
 * Rules: [method, path regex, action, how to find the space + a readable target].
 * `before` runs ahead of the request (the thing may not exist afterwards).
 */
const RULES = [
  ['PATCH', /^\/api\/servers\/([^/]+)$/, 'space.update', async (db, m) => ({ spaceId: m[1], target: await nameOf(db, 'spaces', m[1]) })],
  ['POST', /^\/api\/servers\/([^/]+)\/roles$/, 'role.create', async (db, m, body) => ({ spaceId: m[1], target: body?.name || '' })],
  ['PATCH', /^\/api\/servers\/([^/]+)\/roles\/([^/]+)$/, 'role.update', async (db, m) => ({ spaceId: m[1], target: await nameOf(db, 'space_roles', m[2]) })],
  ['DELETE', /^\/api\/servers\/([^/]+)\/roles\/([^/]+)$/, 'role.delete', async (db, m) => ({ spaceId: m[1], target: await nameOf(db, 'space_roles', m[2]) }), true],
  ['PUT', /^\/api\/servers\/([^/]+)\/members\/([^/]+)\/roles\/([^/]+)$/, 'member.role_add', async (db, m) => ({ spaceId: m[1], target: await userName(db, m[2]), details: await nameOf(db, 'space_roles', m[3]) })],
  ['DELETE', /^\/api\/servers\/([^/]+)\/members\/([^/]+)\/roles\/([^/]+)$/, 'member.role_remove', async (db, m) => ({ spaceId: m[1], target: await userName(db, m[2]), details: await nameOf(db, 'space_roles', m[3]) })],
  ['DELETE', /^\/api\/servers\/([^/]+)\/members\/([^/]+)$/, 'member.remove', async (db, m, _b, url, actor) => (m[2] === actor ? null : { spaceId: m[1], target: await userName(db, m[2]), action: url.searchParams.get('ban') === '1' ? 'member.ban' : 'member.kick' })],
  ['POST', /^\/api\/channels$/, 'channel.create', async (db, _m, body, _u, _a, out) => ({ spaceId: body?.serverId, target: out?.name || body?.name || '' })],
  ['PATCH', /^\/api\/channels\/([^/]+)$/, 'channel.update', async (db, m) => ({ spaceId: await nameOf(db, 'signals', m[1], 'space_id'), target: await nameOf(db, 'signals', m[1]) })],
  ['DELETE', /^\/api\/channels\/([^/]+)$/, 'channel.delete', async (db, m) => ({ spaceId: await nameOf(db, 'signals', m[1], 'space_id'), target: await nameOf(db, 'signals', m[1]) }), true],
  ['PUT', /^\/api\/channels\/([^/]+)\/access$/, 'channel.permissions', async (db, m) => ({ spaceId: await nameOf(db, 'signals', m[1], 'space_id'), target: await nameOf(db, 'signals', m[1]) })],
  ['POST', /^\/api\/servers\/([^/]+)\/invites$/, 'invite.create', async (db, m) => ({ spaceId: m[1] })],
  ['PATCH', /^\/api\/spaces\/([^/]+)\/automod$/, 'automod.update', async (db, m, body) => ({ spaceId: m[1], details: body?.enabled ? 'activado' : 'desactivado' })],
  ['PUT', /^\/api\/servers\/([^/]+)\/welcome$/, 'welcome.update', async (db, m) => ({ spaceId: m[1] })],
  ['POST', /^\/api\/servers\/([^/]+)\/expressions$/, 'expression.create', async (db, m, body) => ({ spaceId: m[1], target: body?.name || '' })],
  ['DELETE', /^\/api\/expressions\/([^/]+)$/, 'expression.delete', async (db, m) => ({ spaceId: await nameOf(db, 'space_expressions', m[1], 'space_id'), target: await nameOf(db, 'space_expressions', m[1]) }), true],
  ['POST', /^\/api\/servers\/([^/]+)\/sounds$/, 'sound.create', async (db, m, body) => ({ spaceId: m[1], target: body?.name || '' })],
  ['POST', /^\/api\/servers\/([^/]+)\/webhooks$/, 'webhook.create', async (db, m, body) => ({ spaceId: m[1], target: body?.name || '' })],
  ['DELETE', /^\/api\/webhooks\/([^/]+)$/, 'webhook.delete', async (db, m) => ({ spaceId: await nameOf(db, 'webhooks', m[1], 'space_id'), target: await nameOf(db, 'webhooks', m[1]) }), true],
  ['POST', /^\/api\/messages\/([^/]+)\/pin$/, 'message.pin', async (db, m) => {
    const row = await db.prepare('SELECT s.space_id, s.name FROM messages x JOIN signals s ON s.id = x.signal_id WHERE x.id = ?').get(m[1]);
    return row && { spaceId: row.space_id, target: `#${row.name}` };
  }],
  // Only logged when a moderator deletes someone else's message.
  ['DELETE', /^\/api\/messages\/([^/]+)$/, 'message.delete', async (db, m, _b, _u, actor) => {
    const row = await db.prepare('SELECT x.author_id, x.content, s.space_id, s.name FROM messages x JOIN signals s ON s.id = x.signal_id WHERE x.id = ?').get(m[1]);
    if (!row || row.author_id === actor) return null;
    return { spaceId: row.space_id, target: await userName(db, row.author_id), details: `#${row.name}: ${String(row.content).slice(0, 80)}` };
  }, true],
];

/** Call before the request: returns a finisher to call with the response status/body. */
export async function auditAround(db, { req, requestPath, actorId, body, crypto }) {
  if (!actorId || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return null;
  const url = new URL(req.url || '/', 'http://localhost');
  for (const [method, pattern, action, resolve, before] of RULES) {
    if (method !== req.method) continue;
    const match = requestPath.match(pattern);
    if (!match) continue;
    const early = before ? await resolve(db, match, body, url, actorId).catch(() => null) : null;
    return async (status, out) => {
      if (status >= 400) return;
      const info = early || (before ? null : await resolve(db, match, body, url, actorId, out).catch(() => null));
      if (!info?.spaceId) return;
      await db.prepare('INSERT INTO audit_log (id, space_id, actor_id, action, target, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(`al_${crypto.randomUUID()}`, info.spaceId, actorId, info.action || action, String(info.target || '').slice(0, 120), String(info.details || '').slice(0, 200), new Date().toISOString());
    };
  }
  return null;
}

/** GET /api/servers/:id/audit?action=&actor=   (MANAGE_SERVER or VIEW… owners/admins) */
export async function handleAuditRoutes({ db, req, res, requestPath, session, send, can }) {
  const match = requestPath.match(/^\/api\/servers\/([^/]+)\/audit$/);
  if (!match) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const spaceId = decodeURIComponent(match[1]);
  if (!await can(db, spaceId, session.user_id, 'MANAGE_SERVER')) { send(res, 403, { message: 'Necesitas el permiso Gestionar espacio.' }); return true; }
  const params = new URL(req.url || '/', 'http://localhost').searchParams;
  const where = ['a.space_id = ?'];
  const args = [spaceId];
  if (params.get('action')) { where.push('a.action LIKE ?'); args.push(`${params.get('action')}%`); }
  if (params.get('actor')) { where.push('a.actor_id = ?'); args.push(params.get('actor')); }
  const rows = await db.prepare(`SELECT a.*, u.display_name, u.username, u.avatar FROM audit_log a JOIN users u ON u.id = a.actor_id WHERE ${where.join(' AND ')} ORDER BY a.created_at DESC LIMIT 200`).all(...args);
  send(res, 200, rows.map((row) => ({ id: row.id, action: row.action, target: row.target, details: row.details, createdAt: row.created_at, actor: { id: row.actor_id, name: row.display_name || row.username, avatar: row.avatar } })));
  return true;
}
