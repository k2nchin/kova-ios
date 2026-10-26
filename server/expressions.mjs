// Custom emojis and stickers per space. Emojis are written as :name: in messages,
// stickers are sent as [sticker:<id>]; every member of the space can use them.

export const expressionsSchema = `CREATE TABLE IF NOT EXISTS space_expressions (id TEXT PRIMARY KEY, space_id TEXT NOT NULL, kind TEXT NOT NULL, name TEXT NOT NULL, url TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL);`;

const LIMITS = { emoji: 100, sticker: 30 };
const NAME = /^[a-z0-9_]{2,32}$/;

export const expressionOut = (row) => ({ id: row.id, kind: row.kind, name: row.name, url: row.url });

export const expressionsOf = async (db, spaceId) =>
  (await db.prepare('SELECT * FROM space_expressions WHERE space_id = ? ORDER BY kind, name').all(spaceId)).map(expressionOut);

/**
 *   GET    /api/servers/:id/expressions
 *   POST   /api/servers/:id/expressions   { kind: 'emoji' | 'sticker', name, url }   (MANAGE_SERVER)
 *   DELETE /api/expressions/:id
 */
export async function handleExpressionRoutes({ db, req, res, requestPath, session, send, readBody, can, canAccessSpace, notifySpace, hostedImageUrl, crypto }) {
  const list = requestPath.match(/^\/api\/servers\/([^/]+)\/expressions$/);
  const one = requestPath.match(/^\/api\/expressions\/([^/]+)$/);
  if (!list && !one) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }

  if (list) {
    const spaceId = decodeURIComponent(list[1]);
    if (!await canAccessSpace(spaceId, session.user_id)) { send(res, 404, { message: 'No encontramos ese espacio.' }); return true; }
    if (req.method === 'GET') { send(res, 200, await expressionsOf(db, spaceId)); return true; }
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    if (!await can(db, spaceId, session.user_id, 'MANAGE_SERVER')) { send(res, 403, { message: 'Necesitas el permiso Gestionar espacio.' }); return true; }
    const body = await readBody(req);
    const kind = body.kind === 'sticker' ? 'sticker' : 'emoji';
    const name = String(body.name || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    const url = hostedImageUrl(body.url);
    if (!NAME.test(name)) { send(res, 400, { message: 'El nombre debe tener 2-32 letras, números o _ (sin espacios).' }); return true; }
    if (!url) { send(res, 400, { message: 'Sube una imagen válida.' }); return true; }
    const count = await db.prepare('SELECT COUNT(*) AS n FROM space_expressions WHERE space_id = ? AND kind = ?').get(spaceId, kind);
    if (Number(count?.n || 0) >= LIMITS[kind]) { send(res, 400, { message: `Este espacio ya tiene el máximo de ${LIMITS[kind]} ${kind === 'emoji' ? 'emojis' : 'stickers'}.` }); return true; }
    if (await db.prepare('SELECT id FROM space_expressions WHERE space_id = ? AND kind = ? AND name = ?').get(spaceId, kind, name)) { send(res, 409, { message: `Ya existe ${kind === 'emoji' ? 'un emoji' : 'un sticker'} llamado ${name}.` }); return true; }
    const id = `${kind === 'emoji' ? 'emo' : 'stk'}_${crypto.randomUUID().slice(0, 12)}`;
    await db.prepare('INSERT INTO space_expressions (id, space_id, kind, name, url, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, spaceId, kind, name, url, session.user_id, new Date().toISOString());
    await notifySpace(spaceId, 'expressions');
    send(res, 201, { id, kind, name, url });
    return true;
  }

  if (req.method !== 'DELETE') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const row = await db.prepare('SELECT * FROM space_expressions WHERE id = ?').get(decodeURIComponent(one[1]));
  if (!row || !await can(db, row.space_id, session.user_id, 'MANAGE_SERVER')) { send(res, 404, { message: 'No encontramos esa expresión.' }); return true; }
  await db.prepare('DELETE FROM space_expressions WHERE id = ?').run(row.id);
  await notifySpace(row.space_id, 'expressions');
  send(res, 200, { ok: true });
  return true;
}
