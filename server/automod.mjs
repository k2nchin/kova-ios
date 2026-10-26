// AutoMod with Kova IA: stops spam and scams BEFORE they are posted.
// Free heuristics run first (floods, mass mentions, known scam phrases); only
// messages with links or money/gift bait go to the AI, and if the AI is slow or
// down the message goes through (fail open) so chat never stalls.

export const automodSchema = `CREATE TABLE IF NOT EXISTS space_automod (space_id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS automod_log (id TEXT PRIMARY KEY, space_id TEXT NOT NULL, signal_id TEXT NOT NULL, user_id TEXT NOT NULL, content TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL);`;

const FLOOD_WINDOW_MS = 30_000;
const recentByUser = new Map(); // `${space}:${user}` -> [{ text, at }]

const SCAM_PATTERNS = [
  /free\s*nitro|nitro\s*(gratis|free)|discord\s*nitro.*(gift|regalo)/i,
  /steam\s*(gift|regalo|community).*https?:/i,
  /(gana|ganar|earn|make)\s*\$?\d+.*(d[ií]a|day|hora|hour).*https?:/i,
  /(crypto|cripto|usdt|btc|bitcoin).*(regalo|giveaway|airdrop|doubl|duplica)/i,
  /(verifica|verify).*(cuenta|account).*https?:/i,
];
const BAIT = /https?:\/\/|www\.|\b(gratis|free|regalo|gift|airdrop|giveaway|premio|prize|crypto|cripto|bitcoin|nitro|paypal|bizum)\b/i;

const verdictText = {
  scam: 'posible estafa o enlace peligroso',
  spam: 'spam',
  abuse: 'acoso o contenido ofensivo',
};

/** Returns null when the message may be posted, or a short reason when it's blocked. */
export async function screenMessage({ db, spaceId, userId, content, classifyMessage }) {
  const row = await db.prepare('SELECT enabled FROM space_automod WHERE space_id = ?').get(spaceId);
  if (!row || !Number(row.enabled)) return null;
  const text = String(content || '');
  const now = Date.now();
  const key = `${spaceId}:${userId}`;
  const recent = (recentByUser.get(key) || []).filter((item) => now - item.at < FLOOD_WINDOW_MS);
  recent.push({ text: text.trim().toLowerCase(), at: now });
  recentByUser.set(key, recent);
  if (recentByUser.size > 20_000) recentByUser.clear();

  if (recent.length > 8) return 'spam (demasiados mensajes seguidos)';
  if (text.trim() && recent.filter((item) => item.text === text.trim().toLowerCase()).length >= 3) return 'spam (mensaje repetido)';
  if ((text.match(/<@|@\w/g) || []).length >= 8) return 'spam (menciones masivas)';
  if (SCAM_PATTERNS.some((pattern) => pattern.test(text))) return verdictText.scam;
  if (!BAIT.test(text) || !classifyMessage) return null;

  try {
    const verdict = await Promise.race([classifyMessage(text), new Promise((resolve) => setTimeout(() => resolve(null), 5000))]);
    return verdict && verdictText[verdict] ? verdictText[verdict] : null;
  } catch {
    return null;
  }
}

export async function logBlocked({ db, crypto, spaceId, channelId, userId, content, reason }) {
  await db.prepare('INSERT INTO automod_log (id, space_id, signal_id, user_id, content, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(`am_${crypto.randomUUID()}`, spaceId, channelId, userId, String(content).slice(0, 500), reason, new Date().toISOString());
}

/**
 *   GET   /api/spaces/:id/automod   { enabled, log }   (needs MANAGE_SERVER)
 *   PATCH /api/spaces/:id/automod   { enabled }
 */
export async function handleAutomodRoutes({ db, req, res, requestPath, session, send, readBody, can }) {
  const match = requestPath.match(/^\/api\/spaces\/([^/]+)\/automod$/);
  if (!match) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const spaceId = decodeURIComponent(match[1]);
  if (!await can(db, spaceId, session.user_id, 'MANAGE_SERVER')) { send(res, 403, { message: 'Necesitas el permiso Gestionar espacio.' }); return true; }
  if (req.method === 'PATCH') {
    const body = await readBody(req);
    const enabled = body.enabled ? 1 : 0;
    const now = new Date().toISOString();
    const existing = await db.prepare('SELECT space_id FROM space_automod WHERE space_id = ?').get(spaceId);
    if (existing) await db.prepare('UPDATE space_automod SET enabled = ?, updated_at = ? WHERE space_id = ?').run(enabled, now, spaceId);
    else await db.prepare('INSERT INTO space_automod (space_id, enabled, updated_at) VALUES (?, ?, ?)').run(spaceId, enabled, now);
  } else if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const row = await db.prepare('SELECT enabled FROM space_automod WHERE space_id = ?').get(spaceId);
  const log = await db.prepare('SELECT l.id, l.content, l.reason, l.created_at, l.signal_id, u.username, u.display_name FROM automod_log l JOIN users u ON u.id = l.user_id WHERE l.space_id = ? ORDER BY l.created_at DESC LIMIT 30').all(spaceId);
  send(res, 200, {
    enabled: Boolean(row && Number(row.enabled)),
    log: log.map((item) => ({ id: item.id, content: item.content, reason: item.reason, createdAt: item.created_at, channelId: item.signal_id, author: item.display_name || item.username })),
  });
  return true;
}
