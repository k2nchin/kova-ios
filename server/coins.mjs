// Kova Coins: earned for free by activity, sent between users and spent on
// space boosts. Every balance change is written to coin_ledger.

export const coinsSchema = `CREATE TABLE IF NOT EXISTS coin_wallets (user_id TEXT PRIMARY KEY, balance INTEGER NOT NULL DEFAULT 0, last_daily TEXT, activity_day TEXT, activity_earned INTEGER NOT NULL DEFAULT 0); CREATE TABLE IF NOT EXISTS coin_ledger (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount INTEGER NOT NULL, kind TEXT NOT NULL, counterpart_id TEXT, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS space_boosts (id TEXT PRIMARY KEY, space_id TEXT NOT NULL, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL);`;

export const DAILY_REWARD = 50;
export const MESSAGE_REWARD = 1;
export const ACTIVITY_DAILY_CAP = 50;
export const MESSAGE_COOLDOWN_MS = 30_000;
export const BOOST_PRICE = 300;
export const BOOST_DAYS = 30;
export const MAX_TRANSFER = 10_000;

// Boosts needed per level, and what each level unlocks.
export const BOOST_LEVELS = [
  { level: 0, boosts: 0, emoji: 100, sticker: 30, sounds: 30 },
  { level: 1, boosts: 2, emoji: 150, sticker: 45, sounds: 48 },
  { level: 2, boosts: 7, emoji: 250, sticker: 60, sounds: 72 },
  { level: 3, boosts: 14, emoji: 400, sticker: 100, sounds: 100 },
];

const today = () => new Date().toISOString().slice(0, 10);
const lastMessageReward = new Map();

const ensureWallet = async (db, userId) => {
  let row = await db.prepare('SELECT * FROM coin_wallets WHERE user_id = ?').get(userId);
  if (!row) {
    try { await db.prepare('INSERT INTO coin_wallets (user_id, balance, activity_earned) VALUES (?, 0, 0)').run(userId); } catch {}
    row = await db.prepare('SELECT * FROM coin_wallets WHERE user_id = ?').get(userId);
  }
  return row;
};

const ledger = (db, crypto, userId, amount, kind, counterpartId = null, note = '') =>
  db.prepare('INSERT INTO coin_ledger (id, user_id, amount, kind, counterpart_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(`coin_${crypto.randomUUID()}`, userId, amount, kind, counterpartId, note, new Date().toISOString());

// Atomic debit: fails (returns false) instead of going negative.
const debit = async (db, userId, amount) =>
  (await db.prepare('UPDATE coin_wallets SET balance = balance - ? WHERE user_id = ? AND balance >= ?').run(amount, userId, amount)).changes > 0;
const credit = (db, userId, amount) => db.prepare('UPDATE coin_wallets SET balance = balance + ? WHERE user_id = ?').run(amount, userId);

export const activeBoostCount = async (db, spaceId) =>
  Number((await db.prepare('SELECT COUNT(*) AS n FROM space_boosts WHERE space_id = ? AND expires_at > ?').get(spaceId, new Date().toISOString()))?.n || 0);

export const boostTier = (count) => [...BOOST_LEVELS].reverse().find((tier) => count >= tier.boosts);

export const spacePerks = async (db, spaceId) => boostTier(await activeBoostCount(db, spaceId));

/** Small reward for sending a message, with a cooldown and a daily cap. Never throws. */
export const rewardMessage = async (db, crypto, userId) => {
  try {
    const now = Date.now();
    if (now - (lastMessageReward.get(userId) || 0) < MESSAGE_COOLDOWN_MS) return;
    lastMessageReward.set(userId, now);
    if (lastMessageReward.size > 50_000) lastMessageReward.clear();
    await ensureWallet(db, userId);
    const day = today();
    await db.prepare('UPDATE coin_wallets SET activity_day = ?, activity_earned = 0 WHERE user_id = ? AND (activity_day IS NULL OR activity_day <> ?)').run(day, userId, day);
    const granted = await db.prepare('UPDATE coin_wallets SET balance = balance + ?, activity_earned = activity_earned + ? WHERE user_id = ? AND activity_earned + ? <= ?')
      .run(MESSAGE_REWARD, MESSAGE_REWARD, userId, MESSAGE_REWARD, ACTIVITY_DAILY_CAP);
    if (granted.changes) await ledger(db, crypto, userId, MESSAGE_REWARD, 'activity');
  } catch (error) {
    console.warn('[Kova Coins] No se pudo dar la recompensa por mensaje', error?.message);
  }
};

const walletOut = async (db, userId) => {
  const row = await ensureWallet(db, userId);
  const day = today();
  return {
    balance: Number(row.balance || 0),
    dailyAvailable: row.last_daily !== day,
    dailyReward: DAILY_REWARD,
    activityEarnedToday: row.activity_day === day ? Number(row.activity_earned || 0) : 0,
    activityDailyCap: ACTIVITY_DAILY_CAP,
    boostPrice: BOOST_PRICE,
    boostDays: BOOST_DAYS,
  };
};

const boostStatus = async (db, spaceId, userId) => {
  const count = await activeBoostCount(db, spaceId);
  const tier = boostTier(count);
  const next = BOOST_LEVELS.find((t) => t.boosts > count) || null;
  const mine = await db.prepare('SELECT id, expires_at FROM space_boosts WHERE space_id = ? AND user_id = ? AND expires_at > ? ORDER BY expires_at').all(spaceId, userId, new Date().toISOString());
  return { spaceId, boosts: count, level: tier.level, perks: tier, nextLevel: next, levels: BOOST_LEVELS, mine: mine.map((b) => ({ id: b.id, expiresAt: b.expires_at })) };
};

/**
 *   GET  /api/coins/wallet
 *   GET  /api/coins/history
 *   POST /api/coins/daily
 *   POST /api/coins/transfer          { toUserId | toUsername, amount, note? }
 *   GET  /api/servers/:id/boosts
 *   POST /api/servers/:id/boosts      { count? }   spends BOOST_PRICE per boost
 */
export async function handleCoinRoutes({ db, req, res, requestPath, session, send, readBody, canAccessSpace, runInTransaction, emitToUsers, crypto }) {
  const boostMatch = requestPath.match(/^\/api\/servers\/([^/]+)\/boosts$/);
  if (!requestPath.startsWith('/api/coins/') && !boostMatch) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const userId = session.user_id;

  if (requestPath === '/api/coins/wallet' && req.method === 'GET') { send(res, 200, await walletOut(db, userId)); return true; }

  if (requestPath === '/api/coins/history' && req.method === 'GET') {
    const rows = await db.prepare('SELECT l.*, u.username, u.display_name FROM coin_ledger l LEFT JOIN users u ON u.id = l.counterpart_id WHERE l.user_id = ? ORDER BY l.created_at DESC LIMIT 50').all(userId);
    send(res, 200, rows.map((r) => ({ id: r.id, amount: Number(r.amount), kind: r.kind, note: r.note, createdAt: r.created_at, counterpart: r.counterpart_id ? { id: r.counterpart_id, username: r.username, displayName: r.display_name } : null })));
    return true;
  }

  if (requestPath === '/api/coins/daily' && req.method === 'POST') {
    await ensureWallet(db, userId);
    const day = today();
    const claimed = await db.prepare('UPDATE coin_wallets SET balance = balance + ?, last_daily = ? WHERE user_id = ? AND (last_daily IS NULL OR last_daily <> ?)').run(DAILY_REWARD, day, userId, day);
    if (!claimed.changes) { send(res, 409, { message: 'Ya reclamaste tu recompensa de hoy. Vuelve mañana.', code: 'DAILY_CLAIMED' }); return true; }
    await ledger(db, crypto, userId, DAILY_REWARD, 'daily');
    send(res, 200, await walletOut(db, userId));
    return true;
  }

  if (requestPath === '/api/coins/transfer' && req.method === 'POST') {
    const body = await readBody(req);
    const amount = Number(body.amount);
    const note = String(body.note || '').trim().slice(0, 140);
    if (!Number.isInteger(amount) || amount < 1 || amount > MAX_TRANSFER) { send(res, 400, { message: `La cantidad debe ser un número entero entre 1 y ${MAX_TRANSFER}.` }); return true; }
    const target = body.toUserId
      ? await db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(String(body.toUserId))
      : await db.prepare('SELECT id, username, display_name FROM users WHERE LOWER(username) = ?').get(String(body.toUsername || '').trim().replace(/^@/, '').toLowerCase());
    if (!target) { send(res, 404, { message: 'No encontramos a ese usuario.' }); return true; }
    if (target.id === userId) { send(res, 400, { message: 'No puedes enviarte monedas a ti mismo.' }); return true; }
    await ensureWallet(db, userId);
    await ensureWallet(db, target.id);
    const ok = await runInTransaction(async (tx) => {
      if (!await debit(tx, userId, amount)) return false;
      await credit(tx, target.id, amount);
      await ledger(tx, crypto, userId, -amount, 'transfer_out', target.id, note);
      await ledger(tx, crypto, target.id, amount, 'transfer_in', userId, note);
      return true;
    });
    if (!ok) { send(res, 400, { message: 'No tienes suficientes Kova Coins.', code: 'INSUFFICIENT_FUNDS' }); return true; }
    const sender = await db.prepare('SELECT username, display_name FROM users WHERE id = ?').get(userId);
    await emitToUsers?.([target.id], 'coins:received', { amount, note, from: { id: userId, username: sender?.username, displayName: sender?.display_name } });
    send(res, 200, await walletOut(db, userId));
    return true;
  }

  if (boostMatch) {
    const spaceId = decodeURIComponent(boostMatch[1]);
    if (!await canAccessSpace(spaceId, userId)) { send(res, 404, { message: 'No encontramos ese espacio.' }); return true; }
    if (req.method === 'GET') { send(res, 200, await boostStatus(db, spaceId, userId)); return true; }
    if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const count = Number((await readBody(req)).count ?? 1);
    if (!Number.isInteger(count) || count < 1 || count > 10) { send(res, 400, { message: 'Puedes comprar entre 1 y 10 potenciadores a la vez.' }); return true; }
    const cost = count * BOOST_PRICE;
    await ensureWallet(db, userId);
    const ok = await runInTransaction(async (tx) => {
      if (!await debit(tx, userId, cost)) return false;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + BOOST_DAYS * 86_400_000).toISOString();
      for (let i = 0; i < count; i += 1) {
        await tx.prepare('INSERT INTO space_boosts (id, space_id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(`boost_${crypto.randomUUID()}`, spaceId, userId, expiresAt, now.toISOString());
      }
      await ledger(tx, crypto, userId, -cost, 'boost', null, spaceId);
      return true;
    });
    if (!ok) { send(res, 400, { message: `Necesitas ${cost} Kova Coins para ${count === 1 ? 'este potenciador' : 'estos potenciadores'}.`, code: 'INSUFFICIENT_FUNDS' }); return true; }
    send(res, 200, { ...(await boostStatus(db, spaceId, userId)), wallet: await walletOut(db, userId) });
    return true;
  }

  send(res, 404, { message: 'Ruta no encontrada.' });
  return true;
}
