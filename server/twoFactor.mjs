// Server-side two-factor authentication (RFC 6238 TOTP + one-time backup codes)
// and login throttling helpers for the Kova API.
import crypto from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const CHALLENGE_MAX_ATTEMPTS = 5;
const LOGIN_MAX_FAILURES = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

export const twoFactorSchema = `CREATE TABLE IF NOT EXISTS backup_codes (user_id TEXT NOT NULL, code_hash TEXT NOT NULL, used_at TEXT, PRIMARY KEY(user_id, code_hash)); CREATE TABLE IF NOT EXISTS login_challenges (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, expires_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS auth_failures (key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, window_start TEXT NOT NULL, locked_until TEXT);`;
export const twoFactorUserColumns = [
  'ALTER TABLE users ADD COLUMN totp_secret TEXT',
  'ALTER TABLE users ADD COLUMN totp_pending_secret TEXT',
  'ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE users ADD COLUMN totp_last_step INTEGER NOT NULL DEFAULT 0',
];

// Secrets are encrypted at rest when KOVA_ENCRYPTION_KEY is configured.
const encryptionKey = process.env.KOVA_ENCRYPTION_KEY ? crypto.createHash('sha256').update(process.env.KOVA_ENCRYPTION_KEY).digest() : null;
if (!encryptionKey) console.warn('[Kova 2FA] KOVA_ENCRYPTION_KEY no está configurada: los secretos TOTP se guardan sin cifrar.');

export const sealSecret = (secret) => {
  if (!encryptionKey) return `plain:${secret}`;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `gcm:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${data.toString('base64')}`;
};

export const openSecret = (stored) => {
  const value = String(stored || '');
  if (value.startsWith('plain:')) return value.slice(6);
  if (!value.startsWith('gcm:') || !encryptionKey) return null;
  const [, iv, tag, data] = value.split(':');
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
};

const base32Encode = (bytes) => {
  let bits = 0; let value = 0; let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { output += BASE32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
};

const base32Decode = (secret) => {
  let bits = 0; let value = 0; const output = [];
  for (const char of String(secret).toUpperCase().replace(/[^A-Z2-7]/g, '')) {
    value = (value << 5) | BASE32.indexOf(char); bits += 5;
    if (bits >= 8) { output.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(output);
};

export const generateSecret = () => base32Encode(crypto.randomBytes(20));

export const otpauthUrl = (secret, account) =>
  `otpauth://totp/${encodeURIComponent(`Kova:${account}`)}?secret=${secret}&issuer=Kova&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;

const hotp = (key, counter) => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** DIGITS;
  return String(code).padStart(DIGITS, '0');
};

/** Returns the matched time step (±1 step of drift) or null. Steps <= lastStep are rejected to stop replays. */
export const verifyTotp = (secret, code, lastStep = 0, now = Date.now()) => {
  const clean = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return null;
  const key = base32Decode(secret);
  const current = Math.floor(now / 1000 / STEP_SECONDS);
  for (const step of [current - 1, current, current + 1]) {
    if (step <= Number(lastStep || 0)) continue;
    const expected = hotp(key, step);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) return step;
  }
  return null;
};

export const totpForTesting = (secret, now = Date.now()) => hotp(base32Decode(secret), Math.floor(now / 1000 / STEP_SECONDS));

const normalizeBackupCode = (code) => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const hashBackupCode = (code) => crypto.createHash('sha256').update(`kova-backup:${normalizeBackupCode(code)}`).digest('hex');
export const generateBackupCodes = (count = 10) => Array.from({ length: count }, () => {
  const raw = base32Encode(crypto.randomBytes(7)).slice(0, 10);
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
});
export const looksLikeBackupCode = (code) => normalizeBackupCode(code).length === 10;

// Login throttling: after LOGIN_MAX_FAILURES failures inside the window the key is locked.
export const loginLockedFor = async (db, key) => {
  const row = await db.prepare('SELECT locked_until FROM auth_failures WHERE key = ?').get(key);
  const until = row?.locked_until ? Date.parse(row.locked_until) : 0;
  return until > Date.now() ? Math.ceil((until - Date.now()) / 1000) : 0;
};

export const recordLoginFailure = async (db, key) => {
  const now = Date.now();
  const row = await db.prepare('SELECT count, window_start FROM auth_failures WHERE key = ?').get(key);
  const fresh = !row || now - Date.parse(row.window_start) > LOGIN_WINDOW_MS;
  const count = fresh ? 1 : Number(row.count) + 1;
  const windowStart = fresh ? new Date(now).toISOString() : row.window_start;
  const lockedUntil = count >= LOGIN_MAX_FAILURES ? new Date(now + LOGIN_LOCK_MS).toISOString() : null;
  if (row) await db.prepare('UPDATE auth_failures SET count = ?, window_start = ?, locked_until = ? WHERE key = ?').run(lockedUntil ? 0 : count, windowStart, lockedUntil, key);
  else await db.prepare('INSERT INTO auth_failures (key, count, window_start, locked_until) VALUES (?, ?, ?, ?)').run(key, count, windowStart, lockedUntil);
};

export const clearLoginFailures = async (db, key) => {
  await db.prepare('DELETE FROM auth_failures WHERE key = ?').run(key);
};
