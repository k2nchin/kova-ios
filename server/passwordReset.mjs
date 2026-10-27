// Password reset by emailed 6-digit code. Email goes out through Resend when
// RESEND_API_KEY is set; otherwise the code is only logged (development).
import crypto from 'node:crypto';

export const passwordResetSchema = `CREATE TABLE IF NOT EXISTS password_resets (email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, expires_at TEXT NOT NULL);`;

const RESET_TTL_MS = 15 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;
const hashCode = (email, code) => crypto.createHash('sha256').update(`${email}:${code}`).digest('hex');

const sendResetEmail = async (email, code) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[Kova password reset] RESEND_API_KEY no configurada. Código para ${email}: ${code}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Kova <onboarding@resend.dev>',
      to: [email],
      subject: `Tu código de Kova: ${code}`,
      text: `Tu código para restablecer la contraseña de Kova es ${code}. Caduca en 15 minutos. Si no lo pediste, ignora este correo.`,
      html: `<p>Tu código para restablecer la contraseña de Kova es:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Caduca en 15 minutos. Si no lo pediste, ignora este correo.</p>`,
    }),
  });
  if (!res.ok) console.error('[Kova password reset] Resend falló', res.status, await res.text().catch(() => ''));
};

// Returns true when the route was handled.
export const handlePasswordResetRoutes = async ({ db, requestPath, req, res, send, readBody, passwordHash }) => {
  if (requestPath === '/api/auth/password-reset/request' && req.method === 'POST') {
    const email = String((await readBody(req)).email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { send(res, 400, { message: 'Escribe un correo electrónico válido.' }); return true; }
    const user = await db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email);
    // Same answer whether or not the account exists, so emails can't be probed.
    if (user) {
      const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
      const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();
      await db.prepare('DELETE FROM password_resets WHERE email = ?').run(email);
      await db.prepare('INSERT INTO password_resets (email, code_hash, attempts, expires_at) VALUES (?, ?, 0, ?)').run(email, hashCode(email, code), expiresAt);
      await sendResetEmail(email, code);
    }
    send(res, 200, { ok: true, message: 'Si existe una cuenta con ese correo, te enviamos un código.' });
    return true;
  }
  if (requestPath === '/api/auth/password-reset/confirm' && req.method === 'POST') {
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();
    const password = String(body.password || '');
    if (password.length < 8 || password.length > 128) { send(res, 400, { message: 'La contraseña debe tener entre 8 y 128 caracteres.' }); return true; }
    const row = await db.prepare('SELECT * FROM password_resets WHERE email = ?').get(email);
    const invalid = () => send(res, 400, { message: 'El código no es válido o ha caducado.', code: 'RESET_INVALID' });
    if (!row || row.expires_at < new Date().toISOString() || Number(row.attempts) >= RESET_MAX_ATTEMPTS) { invalid(); return true; }
    const expected = Buffer.from(row.code_hash, 'hex');
    const given = Buffer.from(hashCode(email, code), 'hex');
    if (!/^\d{6}$/.test(code) || !crypto.timingSafeEqual(expected, given)) {
      await db.prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE email = ?').run(email);
      invalid();
      return true;
    }
    const user = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    await db.prepare('DELETE FROM password_resets WHERE email = ?').run(email);
    if (!user) { invalid(); return true; }
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await passwordHash(password), user.id);
    // Sign out every device that used the old password.
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
    send(res, 200, { ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
    return true;
  }
  return false;
};
