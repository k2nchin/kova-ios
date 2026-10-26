// Scheduled messages and reminders. Rows are stored by any API instance; the
// long-running one (Render) delivers them when due, every 30 seconds.
import crypto from 'node:crypto';

export const schedulingSchema = `CREATE TABLE IF NOT EXISTS scheduled_messages (id TEXT PRIMARY KEY, author_id TEXT NOT NULL, signal_id TEXT NOT NULL, content TEXT NOT NULL, send_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, message_id TEXT, signal_id TEXT, note TEXT NOT NULL DEFAULT '', remind_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL);`;

const MAX_AHEAD_MS = 365 * 24 * 60 * 60 * 1000;
const parseWhen = (value) => {
  const time = Date.parse(String(value || ''));
  if (!Number.isFinite(time)) return null;
  const minAhead = Number(process.env.KOVA_SCHEDULE_MIN_AHEAD_MS ?? 30_000);
  if (time < Date.now() + minAhead || time > Date.now() + MAX_AHEAD_MS) return null; // at least 30 s ahead, at most a year
  return new Date(time).toISOString();
};

/**
 *   POST   /api/channels/:id/scheduled   { content, sendAt }   schedule a message
 *   GET    /api/scheduled                                        your pending scheduled messages
 *   DELETE /api/scheduled/:id                                    cancel one
 *   POST   /api/reminders                { messageId?, note?, remindAt }
 *   GET    /api/reminders?due=1                                  due-but-unseen reminders (marks them seen)
 *   GET    /api/reminders                                        your pending reminders
 *   DELETE /api/reminders/:id
 */
export async function handleSchedulingRoutes({ db, req, res, requestPath, session, send, readBody, canAccessSpace }) {
  const scheduleMatch = requestPath.match(/^\/api\/channels\/([^/]+)\/scheduled$/);
  const scheduledItemMatch = requestPath.match(/^\/api\/scheduled\/([^/]+)$/);
  const reminderItemMatch = requestPath.match(/^\/api\/reminders\/([^/]+)$/);
  if (!scheduleMatch && requestPath !== '/api/scheduled' && !scheduledItemMatch && requestPath !== '/api/reminders' && !reminderItemMatch) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const me = session.user_id;

  if (scheduleMatch && req.method === 'POST') {
    const channelId = decodeURIComponent(scheduleMatch[1]);
    const channel = await db.prepare('SELECT space_id, type FROM signals WHERE id = ?').get(channelId);
    if (!channel || channel.type === 'voice' || channel.type === 'stage' || !await canAccessSpace(channel.space_id, me)) { send(res, 404, { message: 'No encontramos ese canal.' }); return true; }
    const body = await readBody(req);
    const content = String(body.content || '').trim();
    const sendAt = parseWhen(body.sendAt);
    if (!content || content.length > 10_000) { send(res, 400, { message: 'Escribe el mensaje que quieres programar.' }); return true; }
    if (!sendAt) { send(res, 400, { message: 'Elige una hora a partir de dentro de un minuto y como mucho dentro de un año.' }); return true; }
    const pending = Number((await db.prepare("SELECT COUNT(*) AS total FROM scheduled_messages WHERE author_id = ? AND status = 'pending'").get(me))?.total || 0);
    if (pending >= 50) { send(res, 400, { message: 'Tienes demasiados mensajes programados (máximo 50).' }); return true; }
    const id = `sched_${crypto.randomUUID()}`;
    await db.prepare("INSERT INTO scheduled_messages (id, author_id, signal_id, content, send_at, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)").run(id, me, channelId, content, sendAt, new Date().toISOString());
    send(res, 201, { id, channelId, content, sendAt });
    return true;
  }

  if (requestPath === '/api/scheduled' && req.method === 'GET') {
    const rows = await db.prepare("SELECT s.id, s.signal_id, s.content, s.send_at, c.name AS channel_name, c.space_id, sp.name AS space_name FROM scheduled_messages s JOIN signals c ON c.id = s.signal_id JOIN spaces sp ON sp.id = c.space_id WHERE s.author_id = ? AND s.status = 'pending' ORDER BY s.send_at").all(me);
    send(res, 200, rows.map((row) => ({ id: row.id, channelId: row.signal_id, channelName: row.channel_name, serverId: row.space_id, serverName: row.space_name, content: row.content, sendAt: row.send_at })));
    return true;
  }

  if (scheduledItemMatch && req.method === 'DELETE') {
    await db.prepare("DELETE FROM scheduled_messages WHERE id = ? AND author_id = ? AND status = 'pending'").run(decodeURIComponent(scheduledItemMatch[1]), me);
    send(res, 200, { ok: true });
    return true;
  }

  if (requestPath === '/api/reminders' && req.method === 'POST') {
    const body = await readBody(req);
    const remindAt = parseWhen(body.remindAt);
    if (!remindAt) { send(res, 400, { message: 'Elige una hora a partir de dentro de un minuto.' }); return true; }
    let messageId = String(body.messageId || '').trim() || null;
    let channelId = null;
    let note = String(body.note || '').trim().slice(0, 300);
    if (messageId) {
      const message = await db.prepare('SELECT m.content, m.signal_id, s.space_id FROM messages m JOIN signals s ON s.id = m.signal_id WHERE m.id = ?').get(messageId);
      if (!message || !await canAccessSpace(message.space_id, me)) { send(res, 404, { message: 'No encontramos ese mensaje.' }); return true; }
      channelId = message.signal_id;
      if (!note) note = String(message.content || '').slice(0, 300);
    }
    if (!note && !messageId) { send(res, 400, { message: 'Escribe qué quieres recordar.' }); return true; }
    const id = `rem_${crypto.randomUUID()}`;
    await db.prepare("INSERT INTO reminders (id, user_id, message_id, signal_id, note, remind_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)").run(id, me, messageId, channelId, note, remindAt, new Date().toISOString());
    send(res, 201, { id, messageId, channelId, note, remindAt });
    return true;
  }

  if (requestPath === '/api/reminders' && req.method === 'GET') {
    const due = new URL(req.url || '/', 'http://localhost').searchParams.get('due') === '1';
    if (due) {
      // Reminders that fired while you were away; shown once.
      const rows = await db.prepare("SELECT r.*, c.space_id FROM reminders r LEFT JOIN signals c ON c.id = r.signal_id WHERE r.user_id = ? AND r.status = 'fired' ORDER BY r.remind_at").all(me);
      if (rows.length) await db.prepare("UPDATE reminders SET status = 'seen' WHERE user_id = ? AND status = 'fired'").run(me);
      send(res, 200, rows.map((row) => ({ id: row.id, note: row.note, messageId: row.message_id, channelId: row.signal_id, serverId: row.space_id, remindAt: row.remind_at })));
      return true;
    }
    const rows = await db.prepare("SELECT id, note, message_id, signal_id, remind_at FROM reminders WHERE user_id = ? AND status = 'pending' ORDER BY remind_at").all(me);
    send(res, 200, rows.map((row) => ({ id: row.id, note: row.note, messageId: row.message_id, channelId: row.signal_id, remindAt: row.remind_at })));
    return true;
  }

  if (reminderItemMatch && req.method === 'DELETE') {
    await db.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?').run(decodeURIComponent(reminderItemMatch[1]), me);
    send(res, 200, { ok: true });
    return true;
  }

  send(res, 405, { message: 'Método no permitido.' });
  return true;
}

/**
 * Delivers due scheduled messages and reminders. `deliverMessage` posts a
 * message as its author (permission is re-checked at send time).
 */
export async function runDueJobs({ db, canAccessSpace, deliverMessage, emitToUsers }) {
  const now = new Date().toISOString();
  const due = await db.prepare("SELECT * FROM scheduled_messages WHERE status = 'pending' AND send_at <= ? ORDER BY send_at LIMIT 50").all(now);
  for (const job of due) {
    // Claim it first so two instances never send it twice.
    const claimed = await db.prepare("UPDATE scheduled_messages SET status = 'sending' WHERE id = ? AND status = 'pending'").run(job.id);
    if (!claimed.changes) continue;
    try {
      const channel = await db.prepare('SELECT space_id FROM signals WHERE id = ?').get(job.signal_id);
      if (!channel || !await canAccessSpace(channel.space_id, job.author_id)) {
        await db.prepare("UPDATE scheduled_messages SET status = 'failed' WHERE id = ?").run(job.id);
        continue;
      }
      await deliverMessage({ channelId: job.signal_id, spaceId: channel.space_id, authorId: job.author_id, content: job.content });
      await db.prepare("UPDATE scheduled_messages SET status = 'sent' WHERE id = ?").run(job.id);
    } catch (error) {
      console.error('[Kova scheduling] no se pudo enviar', job.id, error?.message || error);
      await db.prepare("UPDATE scheduled_messages SET status = 'failed' WHERE id = ?").run(job.id);
    }
  }
  const reminders = await db.prepare("SELECT r.*, c.space_id FROM reminders r LEFT JOIN signals c ON c.id = r.signal_id WHERE r.status = 'pending' AND r.remind_at <= ? LIMIT 100").all(now);
  for (const reminder of reminders) {
    const claimed = await db.prepare("UPDATE reminders SET status = 'fired' WHERE id = ? AND status = 'pending'").run(reminder.id);
    if (!claimed.changes) continue;
    await emitToUsers([reminder.user_id], 'reminder:due', { id: reminder.id, note: reminder.note, messageId: reminder.message_id, channelId: reminder.signal_id, serverId: reminder.space_id, remindAt: reminder.remind_at });
  }
}
