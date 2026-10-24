import http from 'node:http';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { attachRealtime, emitToChannel, emitToUsers } from './realtime.mjs';
import { askKovaAI, AiError } from './ai.mjs';
import { createVoiceToken, VoiceError } from './voice.mjs';
import { twoFactorSchema, twoFactorUserColumns, sealSecret, openSecret, generateSecret, otpauthUrl, verifyTotp, hashBackupCode, generateBackupCodes, looksLikeBackupCode, loginLockedFor, recordLoginFailure, clearLoginFailures, CHALLENGE_TTL_MS, CHALLENGE_MAX_ATTEMPTS } from './twoFactor.mjs';

const port = Number(process.env.KOVA_API_PORT || 4000);
// Vercel's deployment filesystem is read-only. Use its writable temporary
// directory when no hosted PostgreSQL connection is configured.
const dataDir = path.resolve(process.env.KOVA_DATA_DIR || (process.env.VERCEL ? '/tmp/kova-data' : './server/data'));
if (process.env.VERCEL && !process.env.DATABASE_URL) throw new Error('DATABASE_URL es obligatorio en Vercel; se cancela el inicio para evitar guardar datos en almacenamiento temporal.');
const requestBuckets = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 120;
const AUTH_RATE_LIMIT = 20;
const scrypt = promisify(crypto.scrypt);
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const schema = `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL, display_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, avatar TEXT NOT NULL DEFAULT '', password_hash TEXT NOT NULL, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT, FOREIGN KEY(user_id) REFERENCES users(id)); CREATE TABLE IF NOT EXISTS spaces (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', visibility TEXT NOT NULL DEFAULT 'private', created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS space_members (space_id TEXT NOT NULL, user_id TEXT NOT NULL, joined_at TEXT NOT NULL, PRIMARY KEY(space_id, user_id), FOREIGN KEY(space_id) REFERENCES spaces(id), FOREIGN KEY(user_id) REFERENCES users(id)); CREATE TABLE IF NOT EXISTS signals (id TEXT PRIMARY KEY, space_id TEXT NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, topic TEXT NOT NULL DEFAULT '', category_id TEXT, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, space_id TEXT NOT NULL, name TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS server_invites (code TEXT PRIMARY KEY, space_id TEXT NOT NULL, creator_id TEXT NOT NULL, expires_at TEXT, max_uses INTEGER NOT NULL DEFAULT 0, uses INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, signal_id TEXT NOT NULL, author_id TEXT NOT NULL, content TEXT NOT NULL, reply_to_id TEXT, attachments TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS message_reactions (message_id TEXT NOT NULL, user_id TEXT NOT NULL, emoji TEXT NOT NULL, PRIMARY KEY(message_id, user_id, emoji)); CREATE TABLE IF NOT EXISTS direct_messages (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS friend_requests (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, UNIQUE(sender_id, receiver_id)); CREATE TABLE IF NOT EXISTS friendships (user_a TEXT NOT NULL, user_b TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(user_a, user_b)); CREATE TABLE IF NOT EXISTS blocked_users (blocker_id TEXT NOT NULL, blocked_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(blocker_id, blocked_id)); CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL, target_id TEXT NOT NULL, reason TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL);`;
let db;
let runInTransaction;
if (process.env.DATABASE_URL) {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'false' ? false : true });
  const convert = (sql) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };
  const adapter = (query) => ({ exec: (sql) => query(sql), prepare: (sql) => ({
    get: async (...args) => (await query(convert(sql), args)).rows[0],
    all: async (...args) => (await query(convert(sql), args)).rows,
    run: async (...args) => { const result = await query(convert(sql), args); return { changes: result.rowCount }; },
  }) });
  db = adapter(pool.query.bind(pool));
  runInTransaction = async (operation) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await operation(adapter(client.query.bind(client)));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  };
  console.log('Kova API usando PostgreSQL online');
} else {
  fs.mkdirSync(dataDir, { recursive: true });
  db = new DatabaseSync(path.join(dataDir, 'kova.sqlite'));
  runInTransaction = async (operation) => {
    db.exec('BEGIN IMMEDIATE');
    try { const result = await operation(db); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  };
}
await db.exec(schema);
await db.exec(twoFactorSchema);
for (const statement of twoFactorUserColumns) { try { await db.exec(statement); } catch {} }
try { await db.exec("ALTER TABLE spaces ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'"); } catch {}
try { await db.exec("ALTER TABLE spaces ADD COLUMN icon_url TEXT NOT NULL DEFAULT ''"); } catch {}
try { await db.exec("ALTER TABLE spaces ADD COLUMN banner_url TEXT NOT NULL DEFAULT ''"); } catch {}
try { await db.exec('ALTER TABLE sessions ADD COLUMN expires_at TEXT'); } catch {}
try { await db.exec('ALTER TABLE signals ADD COLUMN category_id TEXT'); } catch {}
try { await db.exec('ALTER TABLE messages ADD COLUMN reply_to_id TEXT'); } catch {}
try { await db.exec("ALTER TABLE messages ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'"); } catch {}
try { await db.prepare('UPDATE sessions SET expires_at = ? WHERE expires_at IS NULL').run(new Date(0).toISOString()); } catch {}
const userFromRow = (row) => row && ({ id: row.id, username: row.username, displayName: row.display_name, email: row.email, avatar: row.avatar, passwordHash: row.password_hash, twoFactorEnabled: Number(row.totp_enabled || 0) === 1 });
const passwordHash = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString('hex')}`;
};
const verifyPassword = async (password, stored) => {
  if (String(stored).startsWith('scrypt$')) {
    const [, salt, expectedHex] = String(stored).split('$');
    if (!salt || !expectedHex) return false;
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = Buffer.from(await scrypt(password, salt, expected.length));
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }
  // Keep existing accounts usable once; successful legacy logins are upgraded below.
  const actual = crypto.createHash('sha256').update(password).digest();
  const expected = Buffer.from(String(stored), 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};
const sessionExpiry = () => new Date(Date.now() + SESSION_TTL_MS).toISOString();
const parseJson = (value, fallback) => { try { return JSON.parse(value || ''); } catch { return fallback; } };
const canAccessSpace = async (spaceId, userId) => Boolean(await db.prepare('SELECT s.id FROM spaces s LEFT JOIN space_members m ON m.space_id = s.id WHERE s.id = ? AND (s.owner_id = ? OR m.user_id = ?)').get(spaceId, userId, userId));
const readBody = async (req) => {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new Error('REQUEST_BODY_TOO_LARGE');
  }
  try {
    const body = JSON.parse(raw || '{}');
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('INVALID_JSON');
    return body;
  } catch (error) {
    if (error?.message === 'REQUEST_BODY_TOO_LARGE') throw error;
    throw new Error('INVALID_JSON');
  }
};
const publicUser = (u) => {
  const hash = [...String(u.id || '')].reduce((n, c) => ((n * 33) ^ c.charCodeAt(0)) >>> 0, 5381);
  return { id: u.id, userId: u.id, username: u.username, displayName: u.displayName, email: u.email, avatar: u.avatar, tag: String(hash % 10000).padStart(4, '0'), status: 'online', verified: false, twoFactorEnabled: Boolean(u.twoFactorEnabled) };
};
const issueSession = async (user) => {
  const token = crypto.randomBytes(32).toString('hex');
  await db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(token, user.id, new Date().toISOString(), sessionExpiry());
  return { user: publicUser(user), token };
};
// With 2FA enabled the password (or Google) step only yields a short-lived challenge.
const completeFirstFactor = async (user) => {
  if (!user.twoFactorEnabled) return issueSession(user);
  const challenge = crypto.randomBytes(32).toString('hex');
  await db.prepare('DELETE FROM login_challenges WHERE user_id = ? OR expires_at < ?').run(user.id, new Date().toISOString());
  await db.prepare('INSERT INTO login_challenges (id, user_id, attempts, expires_at) VALUES (?, ?, 0, ?)').run(challenge, user.id, new Date(Date.now() + CHALLENGE_TTL_MS).toISOString());
  return { twoFactorRequired: true, challenge, methods: ['totp', 'backup_code'] };
};
// Accepts a current TOTP code or an unused backup code. Returns the method used or null.
const verifySecondFactor = async (userId, code) => {
  const row = await db.prepare('SELECT totp_secret, totp_last_step FROM users WHERE id = ? AND totp_enabled = 1').get(userId);
  if (!row) return null;
  const secret = openSecret(row.totp_secret);
  const step = secret ? verifyTotp(secret, code, row.totp_last_step) : null;
  if (step !== null) {
    await db.prepare('UPDATE users SET totp_last_step = ? WHERE id = ?').run(step, userId);
    return 'totp';
  }
  if (!looksLikeBackupCode(code)) return null;
  const used = await db.prepare('UPDATE backup_codes SET used_at = ? WHERE user_id = ? AND code_hash = ? AND used_at IS NULL').run(new Date().toISOString(), userId, hashBackupCode(code));
  return used.changes > 0 ? 'backup_code' : null;
};
const replaceBackupCodes = async (userId) => {
  const codes = generateBackupCodes(10);
  await db.prepare('DELETE FROM backup_codes WHERE user_id = ?').run(userId);
  for (const code of codes) await db.prepare('INSERT INTO backup_codes (user_id, code_hash, used_at) VALUES (?, ?, NULL)').run(userId, hashBackupCode(code));
  return codes;
};
const send = (res, status, body) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
  });
  res.end(JSON.stringify(body));
};

const handleRequest = async (req, res) => {
  const requestPath = new URL(req.url || '/', 'http://localhost').pathname;
  const clientKey = `${req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'}:${requestPath.split('/').slice(0, 4).join('/')}`;
  const now = Date.now();
  const bucket = requestBuckets.get(clientKey) || { startedAt: now, count: 0 };
  if (now - bucket.startedAt >= RATE_WINDOW_MS) { bucket.startedAt = now; bucket.count = 0; }
  bucket.count += 1;
  requestBuckets.set(clientKey, bucket);
  if (requestBuckets.size > 20_000) {
    for (const [key, value] of requestBuckets) if (now - value.startedAt > RATE_WINDOW_MS) requestBuckets.delete(key);
  }
  if (bucket.count > (requestPath.startsWith('/api/auth/') && req.method === 'POST' ? AUTH_RATE_LIMIT : RATE_LIMIT)) return send(res, 429, { message: 'Demasiadas solicitudes. Inténtalo de nuevo en un minuto.' });
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (requestPath === '/api/health') return send(res, 200, { ok: true, service: 'kova-api', timestamp: new Date().toISOString() });
  if (requestPath === '/api/errors' && req.method === 'POST') {
    const body = await readBody(req);
    console.error('[Kova client error]', JSON.stringify({ message: body.message, source: body.source, version: body.version, createdAt: body.createdAt }));
    return send(res, 202, { accepted: true });
  }
  if (requestPath === '/api/auth/register' && req.method === 'POST') {
    const body = await readBody(req); const email = String(body.email || '').trim().toLowerCase();
    if (!email || !body.password || !body.username) return send(res, 400, { message: 'Usuario, email y contraseña son obligatorios.' });
    const username = String(body.username).trim();
    const password = String(body.password);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return send(res, 400, { message: 'Escribe un correo electrónico válido.' });
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) return send(res, 400, { message: 'El usuario debe tener entre 3 y 32 caracteres y usar solo letras, números, punto, guion o guion bajo.' });
    if (password.length < 8 || password.length > 128) return send(res, 400, { message: 'La contraseña debe tener entre 8 y 128 caracteres.' });
    if (await db.prepare('SELECT id FROM users WHERE email = ?').get(email)) return send(res, 409, { message: 'Ya existe una cuenta con ese email.' });
    const displayName = String(body.displayName || username).trim().slice(0, 64);
    const user = { id: `user_${crypto.randomUUID()}`, username, displayName: displayName || username, email, avatar: '', passwordHash: await passwordHash(password) };
    try {
      await db.prepare('INSERT INTO users (id, username, display_name, email, avatar, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(user.id, user.username, user.displayName, user.email, user.avatar, user.passwordHash, new Date().toISOString());
    } catch (error) {
      if (String(error?.code || '').startsWith('23') || /unique|duplicate/i.test(String(error?.message))) return send(res, 409, { message: 'Ya existe una cuenta con ese correo.' });
      throw error;
    }
    return send(res, 201, await issueSession(user));
  }
  if (requestPath === '/api/auth/login' && req.method === 'POST') {
    const body = await readBody(req); const email = String(body.email || '').trim().toLowerCase();
    const throttleKey = `login:${email}`;
    const lockedSeconds = await loginLockedFor(db, throttleKey);
    if (lockedSeconds) return send(res, 429, { message: `Demasiados intentos fallidos. Inténtalo de nuevo en ${Math.ceil(lockedSeconds / 60)} min.`, code: 'LOGIN_LOCKED', retryAfter: lockedSeconds });
    const user = userFromRow(await db.prepare('SELECT * FROM users WHERE email = ?').get(email));
    const password = String(body.password || '');
    if (!user || !password || !(await verifyPassword(password, user.passwordHash))) {
      await recordLoginFailure(db, throttleKey);
      return send(res, 401, { message: 'Email o contraseña incorrectos.' });
    }
    await clearLoginFailures(db, throttleKey);
    if (!String(user.passwordHash).startsWith('scrypt$')) {
      user.passwordHash = await passwordHash(password);
      await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(user.passwordHash, user.id);
    }
    return send(res, 200, await completeFirstFactor(user));
  }
  if (requestPath === '/api/auth/google' && req.method === 'POST') {
    const body = await readBody(req);
    const accessToken = String(body.accessToken || '').trim();
    if (!accessToken) return send(res, 400, { message: 'Falta la credencial de Google.' });
    try {
      const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!googleResponse.ok) return send(res, 401, { message: 'La sesión de Google no es válida o expiró.' });
      const profile = await googleResponse.json();
      const email = String(profile.email || '').trim().toLowerCase();
      if (!email || profile.email_verified !== true) return send(res, 401, { message: 'Google no confirmó el correo electrónico.' });

      let user = userFromRow(await db.prepare('SELECT * FROM users WHERE email = ?').get(email));
      if (!user) {
        const displayName = String(profile.name || body.displayName || email.split('@')[0]).trim();
        const username = email.split('@')[0].replace(/[^a-z0-9._-]/gi, '').slice(0, 32) || `kova_${Date.now()}`;
        user = {
          id: `google_${String(profile.sub || '')}`,
          username,
          displayName,
          email,
          avatar: String(profile.picture || body.avatarUrl || ''),
          passwordHash: `google:${crypto.randomUUID()}`,
        };
        await db.prepare('INSERT INTO users (id, username, display_name, email, avatar, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(user.id, user.username, user.displayName, user.email, user.avatar, user.passwordHash, new Date().toISOString());
      }
      return send(res, 200, await completeFirstFactor(user));
    } catch (error) {
      console.error('Google auth failed:', error);
      return send(res, 502, { message: 'No se pudo verificar la cuenta con Google.' });
    }
  }
  if (requestPath === '/api/auth/2fa/login' && req.method === 'POST') {
    const body = await readBody(req);
    const challengeId = String(body.challenge || '');
    const challenge = challengeId && await db.prepare('SELECT * FROM login_challenges WHERE id = ?').get(challengeId);
    if (!challenge || Date.parse(challenge.expires_at) < Date.now() || Number(challenge.attempts) >= CHALLENGE_MAX_ATTEMPTS) {
      if (challenge) await db.prepare('DELETE FROM login_challenges WHERE id = ?').run(challengeId);
      return send(res, 401, { message: 'La verificación expiró. Vuelve a iniciar sesión.', code: 'CHALLENGE_EXPIRED' });
    }
    const method = await verifySecondFactor(challenge.user_id, String(body.code || ''));
    if (!method) {
      await db.prepare('UPDATE login_challenges SET attempts = attempts + 1 WHERE id = ?').run(challengeId);
      return send(res, 401, { message: 'Código incorrecto o expirado.', code: 'INVALID_CODE', attemptsLeft: CHALLENGE_MAX_ATTEMPTS - Number(challenge.attempts) - 1 });
    }
    await db.prepare('DELETE FROM login_challenges WHERE id = ?').run(challengeId);
    const user = userFromRow(await db.prepare('SELECT * FROM users WHERE id = ?').get(challenge.user_id));
    const remaining = await db.prepare('SELECT COUNT(*) AS n FROM backup_codes WHERE user_id = ? AND used_at IS NULL').get(user.id);
    return send(res, 200, { ...(await issueSession(user)), method, backupCodesRemaining: Number(remaining?.n || 0) });
  }
  if (requestPath.startsWith('/api/auth/2fa/')) {
    const authToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const row = await db.prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?').get(authToken, new Date().toISOString());
    if (!row) return send(res, 401, { message: 'Sesión no válida.' });
    const enabled = Number(row.totp_enabled || 0) === 1;
    if (requestPath === '/api/auth/2fa/status' && req.method === 'GET') {
      const remaining = await db.prepare('SELECT COUNT(*) AS n FROM backup_codes WHERE user_id = ? AND used_at IS NULL').get(row.id);
      return send(res, 200, { enabled, backupCodesRemaining: enabled ? Number(remaining?.n || 0) : 0 });
    }
    if (requestPath === '/api/auth/2fa/setup' && req.method === 'POST') {
      if (enabled) return send(res, 409, { message: 'La verificación en dos pasos ya está activada.' });
      const secret = generateSecret();
      await db.prepare('UPDATE users SET totp_pending_secret = ? WHERE id = ?').run(sealSecret(secret), row.id);
      return send(res, 200, { secret, otpauthUrl: otpauthUrl(secret, row.email || row.username) });
    }
    if (requestPath === '/api/auth/2fa/enable' && req.method === 'POST') {
      if (enabled) return send(res, 409, { message: 'La verificación en dos pasos ya está activada.' });
      const body = await readBody(req);
      const secret = openSecret(row.totp_pending_secret);
      if (!secret) return send(res, 400, { message: 'Primero genera un nuevo código QR.' });
      const step = verifyTotp(secret, String(body.code || ''));
      if (step === null) return send(res, 400, { message: 'El código no coincide. Revisa la hora de tu dispositivo e inténtalo de nuevo.', code: 'INVALID_CODE' });
      await db.prepare('UPDATE users SET totp_secret = ?, totp_pending_secret = NULL, totp_enabled = 1, totp_last_step = ? WHERE id = ?').run(sealSecret(secret), step, row.id);
      const backupCodes = await replaceBackupCodes(row.id);
      // Sign out every other device: they authenticated without the second factor.
      await db.prepare('DELETE FROM sessions WHERE user_id = ? AND token <> ?').run(row.id, authToken);
      return send(res, 200, { enabled: true, backupCodes });
    }
    if (requestPath === '/api/auth/2fa/disable' && req.method === 'POST') {
      if (!enabled) return send(res, 409, { message: 'La verificación en dos pasos no está activada.' });
      const body = await readBody(req);
      if (!await verifySecondFactor(row.id, String(body.code || ''))) return send(res, 400, { message: 'Código incorrecto o expirado.', code: 'INVALID_CODE' });
      await db.prepare('UPDATE users SET totp_secret = NULL, totp_pending_secret = NULL, totp_enabled = 0, totp_last_step = 0 WHERE id = ?').run(row.id);
      await db.prepare('DELETE FROM backup_codes WHERE user_id = ?').run(row.id);
      return send(res, 200, { enabled: false });
    }
    if (requestPath === '/api/auth/2fa/backup-codes' && req.method === 'POST') {
      if (!enabled) return send(res, 409, { message: 'La verificación en dos pasos no está activada.' });
      const body = await readBody(req);
      if (await verifySecondFactor(row.id, String(body.code || '')) !== 'totp') return send(res, 400, { message: 'Introduce un código actual de tu aplicación de autenticación.', code: 'INVALID_CODE' });
      return send(res, 200, { backupCodes: await replaceBackupCodes(row.id) });
    }
    return send(res, 404, { message: 'Ruta no implementada', code: 'NOT_IMPLEMENTED' });
  }
  if (requestPath === '/api/auth/me' && req.method === 'GET') {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); const row = await db.prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?').get(token, new Date().toISOString()); const user = userFromRow(row);
    return user ? send(res, 200, publicUser(user)) : send(res, 401, { message: 'Sesión no válida.' });
  }
  if (requestPath === '/api/auth/logout' && req.method === 'POST') {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (token) await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return send(res, 200, { ok: true });
  }
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = await db.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?').get(token, new Date().toISOString());
  if (requestPath === '/api/voice/token' && req.method === 'POST') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const body = await readBody(req);
    const channelId = String(body.channelId || '');
    const channel = channelId && await db.prepare('SELECT id, space_id, type FROM signals WHERE id = ?').get(channelId);
    if (!channel || !(await canAccessSpace(channel.space_id, session.user_id))) return send(res, 404, { message: 'No encontramos ese canal o no tienes acceso.' });
    if (channel.type !== 'voice') return send(res, 400, { message: 'Ese canal no es de voz.', code: 'NOT_VOICE_CHANNEL' });
    try {
      const user = userFromRow(await db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id));
      return send(res, 200, createVoiceToken({ user, channelId }));
    } catch (error) {
      if (error instanceof VoiceError) return send(res, error.status, { message: error.message, code: error.code });
      throw error;
    }
  }
  if (requestPath === '/api/ai/chat' && req.method === 'POST') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const body = await readBody(req);
    try {
      return send(res, 200, await askKovaAI(session.user_id, { prompt: body.prompt, context: body.context }));
    } catch (error) {
      if (error instanceof AiError) return send(res, error.status, { message: error.message, code: error.code });
      throw error;
    }
  }
  if (requestPath === '/api/dms' && req.method === 'GET') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const left = await db.prepare('SELECT u.* FROM friendships f JOIN users u ON u.id = f.user_b WHERE f.user_a = ?').all(session.user_id);
    const right = await db.prepare('SELECT u.* FROM friendships f JOIN users u ON u.id = f.user_a WHERE f.user_b = ?').all(session.user_id);
    const peers = [...left, ...right]; const conversations = [];
    for (const row of peers) {
      const peer = userFromRow(row);
      const latest = await db.prepare('SELECT content, created_at FROM direct_messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1').get(session.user_id, peer.id, peer.id, session.user_id);
      conversations.push({ user: publicUser(peer), lastMessage: latest?.content || '', lastMessageTime: latest?.created_at || '' });
    }
    return send(res, 200, conversations.sort((a, b) => String(b.lastMessageTime).localeCompare(String(a.lastMessageTime))));
  }
  const directMessagesMatch = requestPath.match(/^\/api\/dms\/([^/]+)\/messages$/);
  if (directMessagesMatch && ['GET', 'POST'].includes(req.method)) {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const peerId = decodeURIComponent(directMessagesMatch[1]);
    if (peerId === session.user_id) return send(res, 400, { message: 'No puedes abrir una conversación contigo mismo.' });
    const pair = [session.user_id, peerId].sort();
    if (!await db.prepare('SELECT user_a FROM friendships WHERE user_a = ? AND user_b = ?').get(pair[0], pair[1])) return send(res, 403, { message: 'Solo puedes enviar mensajes directos a tus amigos.' });
    if (req.method === 'GET') {
      const limit = Math.min(100, Math.max(1, Number(new URL(req.url || '/', 'http://localhost').searchParams.get('limit')) || 50));
      const rows = await db.prepare('SELECT * FROM direct_messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at DESC LIMIT ?').all(session.user_id, peerId, peerId, session.user_id, limit);
      return send(res, 200, rows.reverse().map((row) => ({ id: row.id, authorId: row.sender_id, content: row.content, createdAt: row.created_at })));
    }
    const body = await readBody(req); const content = String(body.content || '').trim();
    if (!content || content.length > 10_000) return send(res, 400, { message: 'El mensaje debe tener entre 1 y 10 000 caracteres.' });
    if (await db.prepare('SELECT blocker_id FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)').get(session.user_id, peerId, peerId, session.user_id)) return send(res, 403, { message: 'No se puede enviar el mensaje por la configuración de bloqueo.' });
    const id = `dm_${crypto.randomUUID()}`; const createdAt = new Date().toISOString();
    await db.prepare('INSERT INTO direct_messages (id, sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?, ?)').run(id, session.user_id, peerId, content, createdAt);
    const directMessage = { id, authorId: session.user_id, content, createdAt };
    emitToUsers([session.user_id, peerId], 'dm:created', { ...directMessage, peerIds: [session.user_id, peerId] });
    return send(res, 201, directMessage);
  }
  const removeFriendMatch = requestPath.match(/^\/api\/friends\/([^/]+)$/);
  if (removeFriendMatch && req.method === 'DELETE') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const pair = [session.user_id, decodeURIComponent(removeFriendMatch[1])].sort();
    await db.prepare('DELETE FROM friendships WHERE user_a = ? AND user_b = ?').run(pair[0], pair[1]);
    return send(res, 200, { ok: true });
  }
  if (requestPath === '/api/safety/blocks' && req.method === 'GET') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const rows = await db.prepare('SELECT blocked_id FROM blocked_users WHERE blocker_id = ?').all(session.user_id);
    return send(res, 200, { blockedUserIds: rows.map((row) => row.blocked_id) });
  }
  if (requestPath === '/api/safety/blocks' && req.method === 'POST') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const body = await readBody(req); const targetId = String(body.userId || '').trim();
    if (!targetId || targetId === session.user_id) return send(res, 400, { message: 'Selecciona otra cuenta para bloquear.' });
    const target = await db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
    if (!target) return send(res, 404, { message: 'La cuenta ya no existe.' });
    try { await db.prepare('INSERT INTO blocked_users (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)').run(session.user_id, targetId, new Date().toISOString()); } catch {}
    return send(res, 201, { ok: true, userId: targetId });
  }
  const unblockMatch = requestPath.match(/^\/api\/safety\/blocks\/([^/]+)$/);
  if (unblockMatch && req.method === 'DELETE') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    await db.prepare('DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?').run(session.user_id, unblockMatch[1]);
    return send(res, 200, { ok: true });
  }
  if (requestPath === '/api/safety/reports' && req.method === 'POST') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const body = await readBody(req); const targetId = String(body.userId || '').trim(); const reason = String(body.reason || '').trim().slice(0, 120); const details = String(body.details || '').trim().slice(0, 2000);
    if (!targetId || !reason || targetId === session.user_id) return send(res, 400, { message: 'Indica una cuenta y el motivo del reporte.' });
    const id = `report_${crypto.randomUUID()}`;
    await db.prepare('INSERT INTO reports (id, reporter_id, target_id, reason, details, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, session.user_id, targetId, reason, details, 'open', new Date().toISOString());
    return send(res, 201, { id, ok: true });
  }
  if (requestPath === '/api/friends' && req.method === 'GET') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const friends = await db.prepare(`SELECT u.* FROM users u JOIN friendships f ON (f.user_a = ? AND f.user_b = u.id) OR (f.user_b = ? AND f.user_a = u.id) ORDER BY u.display_name`).all(session.user_id, session.user_id);
    const incoming = await db.prepare(`SELECT r.id AS request_id, r.created_at, u.* FROM friend_requests r JOIN users u ON u.id = r.sender_id WHERE r.receiver_id = ? AND r.status = 'pending' ORDER BY r.created_at DESC`).all(session.user_id);
    const outgoing = await db.prepare(`SELECT r.id AS request_id, r.created_at, u.* FROM friend_requests r JOIN users u ON u.id = r.receiver_id WHERE r.sender_id = ? AND r.status = 'pending' ORDER BY r.created_at DESC`).all(session.user_id);
    return send(res, 200, { friends: friends.map((r) => publicUser(userFromRow(r))), incoming: incoming.map((r) => ({ id: r.request_id, user: publicUser(userFromRow(r)), timestamp: r.created_at })), outgoing: outgoing.map((r) => ({ id: r.request_id, user: publicUser(userFromRow(r)), timestamp: r.created_at })) });
  }
  if (requestPath === '/api/friends/requests' && req.method === 'POST') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const body = await readBody(req);
    const userId = String(body.userId || '').trim();
    let target;
    if (userId) {
      target = userFromRow(await db.prepare('SELECT * FROM users WHERE id = ?').get(userId));
      if (!target) return send(res, 404, { message: 'No encontramos esa cuenta de Kova. Revisa su ID.' });
    } else {
      const identity = String(body.identity || '').trim().replace(/^@/, '').replace(/#\d{1,4}$/, '');
      target = userFromRow(await db.prepare('SELECT * FROM users WHERE lower(username) = lower(?) OR lower(display_name) = lower(?) OR lower(email) = lower(?) OR id = ?').get(identity, identity, identity, identity));
    }
    if (!target) return send(res, 404, { message: 'No encontramos esa cuenta de Kova. Revisa su usuario o correo.' });
    if (target.id === session.user_id) return send(res, 400, { message: 'No puedes enviarte una solicitud a ti mismo.' });
    const pair = [session.user_id, target.id].sort();
    if (await db.prepare('SELECT user_a FROM friendships WHERE user_a = ? AND user_b = ?').get(pair[0], pair[1])) return send(res, 409, { message: 'Ya son amigos en Kova.' });
    const reverse = await db.prepare("SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'").get(target.id, session.user_id);
    if (reverse) return send(res, 409, { message: 'Esta persona ya te envió una solicitud. Acéptala en Pendientes.' });
    const id = `friend_req_${crypto.randomUUID()}`;
    try { await db.prepare('INSERT INTO friend_requests (id, sender_id, receiver_id, status, created_at) VALUES (?, ?, ?, ?, ?)').run(id, session.user_id, target.id, 'pending', new Date().toISOString()); }
    catch { return send(res, 409, { message: 'La solicitud ya está pendiente.' }); }
    return send(res, 201, { id, user: publicUser(target), timestamp: new Date().toISOString() });
  }
  const friendRequestMatch = requestPath.match(/^\/api\/friends\/requests\/([^/]+)(\/accept)?$/);
  if (friendRequestMatch && req.method === 'POST' && friendRequestMatch[2]) {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const request = await db.prepare("SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'").get(friendRequestMatch[1], session.user_id);
    if (!request) return send(res, 404, { message: 'Esta solicitud ya no está disponible.' });
    const pair = [request.sender_id, request.receiver_id].sort();
    await runInTransaction(async (tx) => {
      await tx.prepare('INSERT INTO friendships (user_a, user_b, created_at) VALUES (?, ?, ?) ON CONFLICT (user_a, user_b) DO NOTHING').run(pair[0], pair[1], new Date().toISOString());
      await tx.prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ? AND receiver_id = ? AND status = 'pending'").run(request.id, session.user_id);
    });
    return send(res, 200, { ok: true });
  }
  if (friendRequestMatch && req.method === 'DELETE') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    await db.prepare("DELETE FROM friend_requests WHERE id = ? AND (sender_id = ? OR receiver_id = ?)").run(friendRequestMatch[1], session.user_id, session.user_id);
    return send(res, 200, { ok: true });
  }
  const inviteCreateMatch = requestPath.match(/^\/api\/servers\/([^/]+)\/invites$/);
  if (inviteCreateMatch && req.method === 'POST') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const serverId = decodeURIComponent(inviteCreateMatch[1]);
    const server = await db.prepare('SELECT id FROM spaces WHERE id = ? AND owner_id = ?').get(serverId, session.user_id);
    if (!server) return send(res, 403, { message: 'Solo el propietario puede crear invitaciones para este espacio.' });
    const body = await readBody(req);
    const allowedExpiries = new Set([0, 30, 60, 360, 720, 1440, 10080]);
    const expiryMinutes = Number(body.expiresInMinutes ?? 10080);
    const maxUses = Math.max(0, Math.min(10000, Math.floor(Number(body.maxUses) || 0)));
    if (!allowedExpiries.has(expiryMinutes)) return send(res, 400, { message: 'El plazo de invitación no es válido.' });
    const code = crypto.randomBytes(12).toString('base64url');
    const expiresAt = expiryMinutes ? new Date(Date.now() + expiryMinutes * 60_000).toISOString() : null;
    await db.prepare('INSERT INTO server_invites (code, space_id, creator_id, expires_at, max_uses, uses, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)').run(code, serverId, session.user_id, expiresAt, maxUses, new Date().toISOString());
    const publicAppUrl = String(process.env.PUBLIC_APP_URL || 'https://kova-k2nchin.vercel.app').replace(/\/$/, '');
    return send(res, 201, { code, serverId, expiresAt, maxUses, url: `${publicAppUrl}/invite/${code}` });
  }
  if (requestPath === '/api/servers/join' && req.method === 'POST') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const body = await readBody(req); const inviteCode = String(body.inviteCode || body.serverId || '').trim();
    if (!inviteCode || inviteCode.length > 200) return send(res, 400, { message: 'El enlace o código de invitación no es válido.' });
    const joined = await runInTransaction(async (tx) => {
      const invite = await tx.prepare('SELECT * FROM server_invites WHERE code = ?').get(inviteCode);
      let space;
      if (invite) {
        space = await tx.prepare('SELECT * FROM spaces WHERE id = ?').get(invite.space_id);
        if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) return { error: { status: 410, message: 'Esta invitación venció.' } };
        if (!space) return { error: { status: 404, message: 'El espacio de esta invitación ya no existe.' } };
        const knownMember = await tx.prepare('SELECT user_id FROM space_members WHERE space_id = ? AND user_id = ?').get(space.id, session.user_id);
        if (!knownMember && space.owner_id !== session.user_id) {
          const claimed = await tx.prepare('UPDATE server_invites SET uses = uses + 1 WHERE code = ? AND (max_uses = 0 OR uses < max_uses) AND (expires_at IS NULL OR expires_at > ?)').run(inviteCode, new Date().toISOString());
          if (!claimed.changes) return { error: { status: 410, message: 'Esta invitación venció o ya alcanzó su límite de usos.' } };
        }
      } else {
        // Legacy server IDs remain valid only for public spaces or existing members.
        space = await tx.prepare('SELECT * FROM spaces WHERE id = ?').get(inviteCode);
        const alreadyMember = space && await tx.prepare('SELECT user_id FROM space_members WHERE space_id = ? AND user_id = ?').get(space.id, session.user_id);
        if (!space || (space.visibility !== 'public' && space.owner_id !== session.user_id && !alreadyMember)) return { error: { status: 404, message: 'La invitación no existe o el espacio es privado.' } };
      }
      const membership = await tx.prepare('SELECT user_id FROM space_members WHERE space_id = ? AND user_id = ?').get(space.id, session.user_id);
      if (!membership && space.owner_id !== session.user_id) await tx.prepare('INSERT INTO space_members (space_id, user_id, joined_at) VALUES (?, ?, ?) ON CONFLICT (space_id, user_id) DO NOTHING').run(space.id, session.user_id, new Date().toISOString());
      const channels = await tx.prepare('SELECT * FROM signals WHERE space_id = ?').all(space.id);
      const categories = await tx.prepare('SELECT * FROM categories WHERE space_id = ? ORDER BY position, created_at').all(space.id);
      return { space, channels, categories };
    });
    if (joined.error) return send(res, joined.error.status, { message: joined.error.message });
    const { space, channels, categories } = joined;
    return send(res, 200, { id: space.id, name: space.name, description: space.description, visibility: space.visibility || 'private', icon: space.icon_url || '', banner: space.banner_url || '', ownerId: space.owner_id, categories: categories.map((c) => ({ id: c.id, name: c.name, channelIds: channels.filter((channel) => channel.category_id === c.id).map((channel) => channel.id) })), channels: channels.map((c) => ({ id: c.id, name: c.name, type: c.type, topic: c.topic, categoryId: c.category_id })) });
  }
  if (requestPath === '/api/servers/discover' && req.method === 'GET') {
    if (!session) return send(res, 401, { message: 'Inicia sesión para explorar comunidades.' });
    const query = (new URL(req.url || '/', 'http://localhost').searchParams.get('q') || '').trim().toLowerCase().slice(0, 80);
    const spaces = await db.prepare("SELECT * FROM spaces WHERE visibility = 'public' ORDER BY created_at DESC LIMIT 200").all();
    const results = [];
    for (const space of spaces) {
      if (query && !`${space.name} ${space.description}`.toLowerCase().includes(query)) continue;
      const channels = await db.prepare('SELECT * FROM signals WHERE space_id = ? ORDER BY created_at').all(space.id);
      const categories = await db.prepare('SELECT * FROM categories WHERE space_id = ? ORDER BY position, created_at').all(space.id);
      const memberCount = Number((await db.prepare('SELECT COUNT(*) AS count FROM space_members WHERE space_id = ?').get(space.id))?.count || 0) + 1;
      results.push({
        id: space.id,
        name: space.name,
        description: space.description,
        icon: space.icon_url || '',
        banner: space.banner_url || '',
        ownerId: space.owner_id,
        memberCount,
        onlineCount: 0,
        categories: categories.map((category) => ({ id: category.id, name: category.name, channelIds: channels.filter((channel) => channel.category_id === category.id).map((channel) => channel.id) })),
        channels: channels.map((channel) => ({ id: channel.id, name: channel.name, type: channel.type, topic: channel.topic, categoryId: channel.category_id })),
      });
    }
    return send(res, 200, results.slice(0, 100));
  }
  if (requestPath === '/api/servers' && req.method === 'GET') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const spaces = await db.prepare('SELECT DISTINCT s.* FROM spaces s LEFT JOIN space_members m ON m.space_id = s.id WHERE s.owner_id = ? OR m.user_id = ? ORDER BY s.created_at DESC').all(session.user_id, session.user_id);
    const result = []; for (const s of spaces) { const channels = await db.prepare('SELECT * FROM signals WHERE space_id = ?').all(s.id); const categories = await db.prepare('SELECT * FROM categories WHERE space_id = ? ORDER BY position, created_at').all(s.id); result.push({ id: s.id, name: s.name, description: s.description, visibility: s.visibility || 'private', icon: s.icon_url || '', banner: s.banner_url || '', ownerId: s.owner_id, categories: categories.map((c) => ({ id: c.id, name: c.name, channelIds: channels.filter((channel) => channel.category_id === c.id).map((channel) => channel.id) })), channels: channels.map((c) => ({ id: c.id, name: c.name, type: c.type, topic: c.topic, categoryId: c.category_id })) }); }
    return send(res, 200, result);
  }
  if (requestPath === '/api/servers' && req.method === 'POST') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const body = await readBody(req); const name = String(body.name || '').trim();
    if (!name) return send(res, 400, { message: 'El nombre del espacio es obligatorio.' });
    const visibility = body.visibility === 'public' ? 'public' : 'private';
    const id = String(body.id || `space_${crypto.randomUUID()}`).trim();
    const categories = Array.isArray(body.categories) ? body.categories.slice(0, 50) : [];
    const channels = Array.isArray(body.channels) ? body.channels.slice(0, 100) : [];
    await runInTransaction(async (tx) => {
      await tx.prepare('INSERT INTO spaces (id, owner_id, name, description, visibility, icon_url, banner_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, session.user_id, name, String(body.description || '').slice(0, 1000), visibility, String(body.iconUrl || '').slice(0, 700_000), String(body.bannerUrl || '').slice(0, 700_000), new Date().toISOString());
      for (const [position, category] of categories.entries()) {
        const categoryId = String(category.id || `category_${crypto.randomUUID()}`);
        const categoryName = String(category.name || '').trim().slice(0, 64);
        if (categoryName) await tx.prepare('INSERT INTO categories (id, space_id, name, position, created_at) VALUES (?, ?, ?, ?, ?)').run(categoryId, id, categoryName, position, new Date().toISOString());
      }
      for (const channel of channels) {
        const channelId = String(channel.id || `signal_${crypto.randomUUID()}`);
        const categoryId = channel.categoryId && categories.some((category) => category.id === channel.categoryId) ? channel.categoryId : null;
        await tx.prepare('INSERT INTO signals (id, space_id, name, type, topic, category_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(channelId, id, String(channel.name || 'general').slice(0, 100), String(channel.type || 'text'), String(channel.topic || '').slice(0, 500), categoryId, new Date().toISOString());
      }
    });
    return send(res, 201, { id, name, description: String(body.description || ''), visibility, icon: String(body.iconUrl || ''), banner: String(body.bannerUrl || ''), ownerId: session.user_id, categories, channels });
  }
  const serverUpdateMatch = requestPath.match(/^\/api\/servers\/([^/]+)$/);
  if (serverUpdateMatch && req.method === 'PATCH') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const serverId = decodeURIComponent(serverUpdateMatch[1]);
    const space = await db.prepare('SELECT * FROM spaces WHERE id = ? AND owner_id = ?').get(serverId, session.user_id);
    if (!space) return send(res, 404, { message: 'No encontramos ese espacio o no tienes permiso.' });
    const body = await readBody(req);
    const name = body.name === undefined ? space.name : String(body.name).trim().slice(0, 100);
    const description = body.description === undefined ? space.description : String(body.description).trim().slice(0, 1000);
    const visibility = body.visibility === undefined ? space.visibility : (body.visibility === 'public' ? 'public' : 'private');
    if (!name) return send(res, 400, { message: 'El nombre del espacio no puede quedar vacío.' });
    const icon = body.icon === undefined ? space.icon_url || '' : String(body.icon || '').slice(0, 700_000);
    const banner = body.banner === undefined ? space.banner_url || '' : String(body.banner || '').slice(0, 700_000);
    await db.prepare('UPDATE spaces SET name = ?, description = ?, visibility = ?, icon_url = ?, banner_url = ? WHERE id = ? AND owner_id = ?').run(name, description, visibility, icon, banner, serverId, session.user_id);
    return send(res, 200, { id: serverId, name, description, visibility, icon, banner, ownerId: session.user_id });
  }
  const channelMessagesMatch = requestPath.match(/^\/api\/channels\/([^/]+)\/messages$/);
  if (channelMessagesMatch && ['GET', 'POST'].includes(req.method)) {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const channelId = decodeURIComponent(channelMessagesMatch[1]);
    const channel = await db.prepare('SELECT id, space_id FROM signals WHERE id = ?').get(channelId);
    if (!channel || !(await canAccessSpace(channel.space_id, session.user_id))) return send(res, 404, { message: 'No encontramos ese canal o no tienes acceso.' });
    if (req.method === 'GET') {
      const requested = Number(new URL(req.url || '/', 'http://localhost').searchParams.get('limit')) || 50;
      const limit = Math.min(100, Math.max(1, Math.floor(requested)));
      const rows = await db.prepare('SELECT m.*, u.username, u.display_name, u.avatar FROM messages m JOIN users u ON u.id = m.author_id WHERE m.signal_id = ? ORDER BY m.created_at DESC LIMIT ?').all(channelId, limit);
      const messages = [];
      for (const row of rows.reverse()) {
        const reactions = await db.prepare('SELECT emoji, user_id FROM message_reactions WHERE message_id = ?').all(row.id);
        const grouped = new Map();
        for (const reaction of reactions) {
          const current = grouped.get(reaction.emoji) || { emoji: reaction.emoji, count: 0, users: [] };
          current.count += 1;
          current.users.push(reaction.user_id);
          grouped.set(reaction.emoji, current);
        }
        messages.push({ id: row.id, channelId, author: { id: row.author_id, username: row.username, displayName: row.display_name, avatar: row.avatar, status: 'online' }, content: row.content, replyToId: row.reply_to_id || undefined, attachments: parseJson(row.attachments, []), createdAt: row.created_at, reactions: [...grouped.values()] });
      }
      return send(res, 200, messages);
    }
    const body = await readBody(req);
    const content = String(body.content || '').trim();
    const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 10).filter((item) => typeof item?.url === 'string' && /^https:\/\//i.test(item.url) && item.url.length <= 2048) : [];
    if (!content && attachments.length === 0) return send(res, 400, { message: 'Escribe un mensaje antes de enviarlo.' });
    if (content.length > 10_000) return send(res, 413, { message: 'El mensaje supera el límite de 10 000 caracteres.' });
    const replyToId = String(body.replyToId || '').trim() || null;
    if (replyToId && !await db.prepare('SELECT id FROM messages WHERE id = ? AND signal_id = ?').get(replyToId, channelId)) return send(res, 400, { message: 'El mensaje al que respondes ya no existe.' });
    const id = `message_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    await db.prepare('INSERT INTO messages (id, signal_id, author_id, content, reply_to_id, attachments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, channelId, session.user_id, content, replyToId, JSON.stringify(attachments), createdAt);
    const author = userFromRow(await db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id));
    const created = { id, channelId, author: publicUser(author), content, replyToId: replyToId || undefined, attachments, createdAt, reactions: [] };
    emitToChannel(channelId, 'message:created', created);
    return send(res, 201, created);
  }
  const messageReactionMatch = requestPath.match(/^\/api\/messages\/([^/]+)\/reactions$/);
  if (messageReactionMatch && req.method === 'POST') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const messageId = decodeURIComponent(messageReactionMatch[1]);
    const message = await db.prepare('SELECT m.id, m.signal_id, s.space_id FROM messages m JOIN signals s ON s.id = m.signal_id WHERE m.id = ?').get(messageId);
    if (!message || !(await canAccessSpace(message.space_id, session.user_id))) return send(res, 404, { message: 'No encontramos ese mensaje.' });
    const body = await readBody(req); const emoji = String(body.emoji || '').trim();
    if (!emoji || emoji.length > 32) return send(res, 400, { message: 'La reacción no es válida.' });
    const existing = await db.prepare('SELECT message_id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?').get(messageId, session.user_id, emoji);
    if (existing) await db.prepare('DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?').run(messageId, session.user_id, emoji);
    else {
      try { await db.prepare('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)').run(messageId, session.user_id, emoji); } catch {}
    }
    const rows = await db.prepare('SELECT emoji, user_id FROM message_reactions WHERE message_id = ?').all(messageId);
    const grouped = new Map();
    for (const row of rows) { const current = grouped.get(row.emoji) || { emoji: row.emoji, count: 0, users: [] }; current.count += 1; current.users.push(row.user_id); grouped.set(row.emoji, current); }
    const reactionUpdate = { messageId, channelId: message.signal_id, reactions: [...grouped.values()] };
    emitToChannel(message.signal_id, 'message:reactions', reactionUpdate);
    return send(res, 200, reactionUpdate);
  }
  const messageMatch = requestPath.match(/^\/api\/messages\/([^/]+)$/);
  if (messageMatch && req.method === 'PUT') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const messageId = decodeURIComponent(messageMatch[1]);
    const body = await readBody(req); const content = String(body.content || '').trim();
    if (!content || content.length > 10_000) return send(res, 400, { message: 'El mensaje debe tener entre 1 y 10 000 caracteres.' });
    const message = await db.prepare('SELECT m.author_id, m.signal_id, s.space_id, p.owner_id FROM messages m JOIN signals s ON s.id = m.signal_id JOIN spaces p ON p.id = s.space_id WHERE m.id = ?').get(messageId);
    if (!message || (message.author_id !== session.user_id && message.owner_id !== session.user_id)) return send(res, 404, { message: 'No encontramos ese mensaje o no tienes permiso para editarlo.' });
    await db.prepare('UPDATE messages SET content = ? WHERE id = ?').run(content, messageId);
    emitToChannel(message.signal_id, 'message:updated', { id: messageId, channelId: message.signal_id, content, edited: true });
    return send(res, 200, { id: messageId, content, edited: true });
  }
  if (messageMatch && req.method === 'DELETE') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const messageId = decodeURIComponent(messageMatch[1]);
    const message = await db.prepare('SELECT m.author_id, m.signal_id, s.space_id, p.owner_id FROM messages m JOIN signals s ON s.id = m.signal_id JOIN spaces p ON p.id = s.space_id WHERE m.id = ?').get(messageId);
    if (!message || (message.author_id !== session.user_id && message.owner_id !== session.user_id)) return send(res, 404, { message: 'No encontramos ese mensaje o no tienes permiso para eliminarlo.' });
    await db.prepare('DELETE FROM message_reactions WHERE message_id = ?').run(messageId);
    await db.prepare('DELETE FROM messages WHERE id = ?').run(messageId);
    emitToChannel(message.signal_id, 'message:deleted', { id: messageId, channelId: message.signal_id });
    return send(res, 200, { ok: true });
  }
  if (requestPath === '/api/channels' && req.method === 'POST') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const body = await readBody(req); const serverId = String(body.serverId || '');
    const canEdit = await db.prepare('SELECT id FROM spaces WHERE id = ? AND owner_id = ?').get(serverId, session.user_id);
    if (!canEdit) return send(res, 403, { message: 'Solo el propietario puede crear señales.' });
    const id = String(body.id || `signal_${crypto.randomUUID()}`); const name = String(body.name || '').trim();
    if (!name) return send(res, 400, { message: 'El nombre de la señal es obligatorio.' });
    const categoryId = String(body.categoryId || '').trim() || null;
    if (categoryId && !await db.prepare('SELECT id FROM categories WHERE id = ? AND space_id = ?').get(categoryId, serverId)) return send(res, 400, { message: 'La categoría no pertenece a este espacio.' });
    await db.prepare('INSERT INTO signals (id, space_id, name, type, topic, category_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, serverId, name, String(body.type || 'text'), String(body.topic || ''), categoryId, new Date().toISOString());
    return send(res, 201, { id, name, type: String(body.type || 'text'), topic: String(body.topic || ''), categoryId: body.categoryId || null });
  }
  const channelMatch = requestPath.match(/^\/api\/channels\/([^/]+)$/);
  if (channelMatch && req.method === 'DELETE') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const channel = await db.prepare('SELECT s.owner_id FROM spaces s JOIN signals c ON c.space_id = s.id WHERE c.id = ?').get(channelMatch[1]);
    if (!channel || channel.owner_id !== session.user_id) return send(res, 403, { message: 'No puedes eliminar esta señal.' });
    await runInTransaction(async (tx) => {
      await tx.prepare('DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM messages WHERE signal_id = ?)').run(channelMatch[1]);
      await tx.prepare('DELETE FROM messages WHERE signal_id = ?').run(channelMatch[1]);
      await tx.prepare('DELETE FROM signals WHERE id = ?').run(channelMatch[1]);
    });
    return send(res, 200, { ok: true });
  }
  if (channelMatch && req.method === 'PATCH') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const channel = await db.prepare('SELECT c.*, s.owner_id FROM signals c JOIN spaces s ON s.id = c.space_id WHERE c.id = ?').get(decodeURIComponent(channelMatch[1]));
    if (!channel || channel.owner_id !== session.user_id) return send(res, 404, { message: 'No encontramos el canal o no tienes permiso.' });
    const body = await readBody(req);
    const name = body.name === undefined ? channel.name : String(body.name).trim().slice(0, 100);
    const topic = body.topic === undefined ? channel.topic : String(body.topic).trim().slice(0, 500);
    const categoryId = body.categoryId === undefined ? channel.category_id : (String(body.categoryId || '').trim() || null);
    if (!name) return send(res, 400, { message: 'El nombre del canal no puede quedar vacío.' });
    if (categoryId && !await db.prepare('SELECT id FROM categories WHERE id = ? AND space_id = ?').get(categoryId, channel.space_id)) return send(res, 400, { message: 'La categoría no pertenece a este espacio.' });
    await db.prepare('UPDATE signals SET name = ?, topic = ?, category_id = ? WHERE id = ?').run(name, topic, categoryId, channel.id);
    return send(res, 200, { id: channel.id, name, topic, categoryId });
  }
  const serverMatch = requestPath.match(/^\/api\/servers\/([^/]+)$/);
  if (serverMatch && req.method === 'DELETE') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const serverId = decodeURIComponent(serverMatch[1]);
    const server = await db.prepare('SELECT id FROM spaces WHERE id = ? AND owner_id = ?').get(serverId, session.user_id);
    if (!server) return send(res, 404, { message: 'No encontramos ese espacio o no tienes permiso para eliminarlo.' });
    await runInTransaction(async (tx) => {
      await tx.prepare('DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM messages WHERE signal_id IN (SELECT id FROM signals WHERE space_id = ?))').run(serverId);
      await tx.prepare('DELETE FROM messages WHERE signal_id IN (SELECT id FROM signals WHERE space_id = ?)').run(serverId);
      await tx.prepare('DELETE FROM server_invites WHERE space_id = ?').run(serverId);
      await tx.prepare('DELETE FROM categories WHERE space_id = ?').run(serverId);
      await tx.prepare('DELETE FROM signals WHERE space_id = ?').run(serverId);
      await tx.prepare('DELETE FROM space_members WHERE space_id = ?').run(serverId);
      await tx.prepare('DELETE FROM spaces WHERE id = ?').run(serverId);
    });
    return send(res, 200, { ok: true });
  }
  if (requestPath === '/api/categories' && req.method === 'POST') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const body = await readBody(req); const serverId = String(body.serverId || '').trim(); const name = String(body.name || '').trim().slice(0, 64);
    if (!name) return send(res, 400, { message: 'El nombre de la categoría es obligatorio.' });
    if (!await db.prepare('SELECT id FROM spaces WHERE id = ? AND owner_id = ?').get(serverId, session.user_id)) return send(res, 403, { message: 'Solo el propietario puede administrar categorías.' });
    const id = String(body.id || `category_${crypto.randomUUID()}`);
    const position = Number((await db.prepare('SELECT COUNT(*) AS count FROM categories WHERE space_id = ?').get(serverId))?.count || 0);
    await db.prepare('INSERT INTO categories (id, space_id, name, position, created_at) VALUES (?, ?, ?, ?, ?)').run(id, serverId, name, position, new Date().toISOString());
    return send(res, 201, { id, name, channelIds: [] });
  }
  const categoryMatch = requestPath.match(/^\/api\/categories\/([^/]+)$/);
  if (categoryMatch && req.method === 'DELETE') {
    if (!session) return send(res, 401, { message: 'Sesión no válida.' });
    const id = decodeURIComponent(categoryMatch[1]);
    const category = await db.prepare('SELECT c.id, c.space_id, s.owner_id FROM categories c JOIN spaces s ON s.id = c.space_id WHERE c.id = ?').get(id);
    if (!category || category.owner_id !== session.user_id) return send(res, 404, { message: 'No encontramos esa categoría o no tienes permiso.' });
    await db.prepare('UPDATE signals SET category_id = NULL WHERE category_id = ?').run(id);
    await db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { message: 'Ruta no implementada', code: 'NOT_IMPLEMENTED' });
};

export const handler = async (req, res) => {
  try {
    return await handleRequest(req, res);
  } catch (error) {
    console.error('[Kova API error]', error);
    if (res.headersSent) { res.destroy?.(); return; }
    const tooLarge = error?.message === 'REQUEST_BODY_TOO_LARGE';
    const invalidJson = error?.message === 'INVALID_JSON';
    return send(res, tooLarge ? 413 : invalidJson ? 400 : 500, {
      message: tooLarge ? 'La solicitud supera el tamaño permitido.' : invalidJson ? 'El cuerpo de la solicitud debe ser un objeto JSON válido.' : 'Error interno del servidor. Inténtalo de nuevo.',
      code: tooLarge ? 'PAYLOAD_TOO_LARGE' : invalidJson ? 'INVALID_JSON' : 'INTERNAL_ERROR',
    });
  }
};

if (!process.env.VERCEL) {
  const server = http.createServer(handler);
  const allowedOrigins = String(process.env.KOVA_SOCKET_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
  await attachRealtime(server, { db, canAccessSpace, allowedOrigins });
  server.listen(port, () => console.log(`Kova API listening on http://localhost:${port}`));
}
