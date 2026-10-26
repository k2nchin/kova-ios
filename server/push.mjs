// Web Push: notifications that reach the phone/PC even with Kova closed.
// The VAPID key pair is generated once and kept in the database so Vercel and
// Render sign with the same keys without extra configuration.
import webpush from 'web-push';

export const pushSchema = `CREATE TABLE IF NOT EXISTS push_subscriptions (endpoint TEXT PRIMARY KEY, user_id TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS app_secrets (key TEXT PRIMARY KEY, value TEXT NOT NULL);`;

let vapid = null;
const loadVapid = async (db) => {
  if (vapid) return vapid;
  if (process.env.KOVA_VAPID_PUBLIC_KEY && process.env.KOVA_VAPID_PRIVATE_KEY) {
    vapid = { publicKey: process.env.KOVA_VAPID_PUBLIC_KEY, privateKey: process.env.KOVA_VAPID_PRIVATE_KEY };
  } else {
    let row = await db.prepare("SELECT value FROM app_secrets WHERE key = 'vapid'").get();
    if (!row) {
      const keys = webpush.generateVAPIDKeys();
      // Two instances racing: the first insert wins and both read it back.
      try { await db.prepare("INSERT INTO app_secrets (key, value) VALUES ('vapid', ?)").run(JSON.stringify(keys)); } catch { /* already created */ }
      row = await db.prepare("SELECT value FROM app_secrets WHERE key = 'vapid'").get();
    }
    vapid = JSON.parse(row.value);
  }
  webpush.setVapidDetails(process.env.KOVA_VAPID_SUBJECT || 'mailto:soporte@kova.app', vapid.publicKey, vapid.privateKey);
  return vapid;
};

/** Best effort: sends to every device of these users; dead subscriptions are removed. */
export async function sendPush(db, userIds, { title, body, url = '/app', tag }) {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (!ids.length || process.env.KOVA_DISABLE_PUSH) return;
  try {
    await loadVapid(db);
    const subs = await db.prepare(`SELECT * FROM push_subscriptions WHERE user_id IN (${ids.map(() => '?').join(',')})`).all(...ids);
    const payload = JSON.stringify({ title: String(title).slice(0, 120), body: String(body || '').slice(0, 240), url, tag });
    await Promise.all(subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 3600, timeout: 5000 });
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint);
      }
    }));
  } catch (error) {
    console.warn('[Kova push]', error?.message || error);
  }
}

/**
 *   GET  /api/push/key            { publicKey }
 *   POST /api/push/subscribe      PushSubscription JSON
 *   POST /api/push/unsubscribe    { endpoint }
 */
export async function handlePushRoutes({ db, req, res, requestPath, session, send, readBody }) {
  if (!requestPath.startsWith('/api/push/')) return false;
  if (requestPath === '/api/push/key' && req.method === 'GET') { send(res, 200, { publicKey: (await loadVapid(db)).publicKey }); return true; }
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const body = await readBody(req);
  const endpoint = String(body.endpoint || '');
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000) { send(res, 400, { message: 'Suscripción no válida.' }); return true; }
  if (requestPath === '/api/push/subscribe') {
    const p256dh = String(body.keys?.p256dh || '');
    const auth = String(body.keys?.auth || '');
    if (!p256dh || !auth || p256dh.length > 200 || auth.length > 100) { send(res, 400, { message: 'Suscripción no válida.' }); return true; }
    await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
    await db.prepare('INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)').run(endpoint, session.user_id, p256dh, auth, new Date().toISOString());
    send(res, 200, { ok: true });
    return true;
  }
  if (requestPath === '/api/push/unsubscribe') {
    await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?').run(endpoint, session.user_id);
    send(res, 200, { ok: true });
    return true;
  }
  send(res, 404, { message: 'No encontrado.' });
  return true;
}
