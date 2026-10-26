// Community features: followable announcement channels, welcome screen with rules
// and role-assigning onboarding, and activity levels with badges.
import { permissionsOf } from './spaces.mjs';

export const communitySchema = `CREATE TABLE IF NOT EXISTS channel_follows (source_id TEXT NOT NULL, target_id TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(source_id, target_id)); CREATE TABLE IF NOT EXISTS space_welcome (space_id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0, message TEXT NOT NULL DEFAULT '', rules TEXT NOT NULL DEFAULT '[]', require_accept INTEGER NOT NULL DEFAULT 0, questions TEXT NOT NULL DEFAULT '[]', updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS space_onboarded (space_id TEXT NOT NULL, user_id TEXT NOT NULL, accepted_at TEXT NOT NULL, PRIMARY KEY(space_id, user_id)); CREATE TABLE IF NOT EXISTS member_xp (space_id TEXT NOT NULL, user_id TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0, messages INTEGER NOT NULL DEFAULT 0, last_xp_at TEXT, PRIMARY KEY(space_id, user_id));`;

const parse = (value, fallback = []) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
const now = () => new Date().toISOString();

// ---------- Followable announcement channels ----------

/** Copies a new announcement to every channel that follows it (no @everyone pings across spaces). */
export async function forwardAnnouncement(db, { channelId, authorId, content, attachments, deliverMessage }) {
  const followers = await db.prepare('SELECT f.target_id, s.space_id FROM channel_follows f JOIN signals s ON s.id = f.target_id WHERE f.source_id = ?').all(channelId);
  if (!followers.length) return;
  const origin = await db.prepare('SELECT c.name AS channel, s.name AS space FROM signals c JOIN spaces s ON s.id = c.space_id WHERE c.id = ?').get(channelId);
  const safe = String(content || '').replace(/@(everyone|here)\b/g, '@​$1');
  for (const follower of followers) {
    try {
      await deliverMessage({ channelId: follower.target_id, spaceId: follower.space_id, authorId, content: `📣 **${origin?.space || 'Kova'} · #${origin?.channel || 'anuncios'}**\n${safe}`.slice(0, 10_000), attachments, forwarded: true });
    } catch (error) {
      console.warn('[Kova follows]', error?.message || error);
    }
  }
}

/**
 *   GET    /api/channels/:id/followers                       who follows this announcement channel
 *   POST   /api/channels/:id/follow   { targetChannelId }    follow it from a channel of yours (MANAGE_CHANNELS there)
 *   DELETE /api/channels/:id/follow   { targetChannelId }
 */
async function followRoutes({ db, req, res, requestPath, session, send, readBody, can, canAccessSpace }) {
  const match = requestPath.match(/^\/api\/channels\/([^/]+)\/(follow|followers)$/);
  if (!match) return false;
  const source = await db.prepare("SELECT c.id, c.space_id, c.type, s.visibility FROM signals c JOIN spaces s ON s.id = c.space_id WHERE c.id = ?").get(decodeURIComponent(match[1]));
  const canSee = source && (source.visibility === 'public' || await canAccessSpace(source.space_id, session.user_id));
  if (!source || source.type !== 'announcements' || !canSee) { send(res, 404, { message: 'No encontramos ese canal de anuncios.' }); return true; }
  if (match[2] === 'followers') {
    if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const rows = await db.prepare('SELECT c.id, c.name, s.id AS space_id, s.name AS space_name FROM channel_follows f JOIN signals c ON c.id = f.target_id JOIN spaces s ON s.id = c.space_id WHERE f.source_id = ?').all(source.id);
    const mine = [];
    for (const row of rows) if (await canAccessSpace(row.space_id, session.user_id)) mine.push({ channelId: row.id, channelName: row.name, spaceId: row.space_id, spaceName: row.space_name });
    send(res, 200, { count: rows.length, mine });
    return true;
  }
  if (!['POST', 'DELETE'].includes(req.method)) { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const body = await readBody(req);
  const target = await db.prepare('SELECT id, space_id, type FROM signals WHERE id = ?').get(String(body.targetChannelId || ''));
  if (!target || !['text', 'announcements'].includes(target.type)) { send(res, 400, { message: 'Elige un canal de texto donde recibir los anuncios.' }); return true; }
  if (!await can(db, target.space_id, session.user_id, 'MANAGE_CHANNELS')) { send(res, 403, { message: 'Necesitas Gestionar canales en el espacio que recibe los anuncios.' }); return true; }
  if (target.id === source.id) { send(res, 400, { message: 'Un canal no puede seguirse a sí mismo.' }); return true; }
  await db.prepare('DELETE FROM channel_follows WHERE source_id = ? AND target_id = ?').run(source.id, target.id);
  if (req.method === 'POST') {
    const count = await db.prepare('SELECT COUNT(*) AS n FROM channel_follows WHERE target_id = ?').get(target.id);
    if (Number(count?.n || 0) >= 20) { send(res, 400, { message: 'Ese canal ya sigue 20 canales de anuncios.' }); return true; }
    await db.prepare('INSERT INTO channel_follows (source_id, target_id, created_by, created_at) VALUES (?, ?, ?, ?)').run(source.id, target.id, session.user_id, now());
  }
  send(res, 200, { following: req.method === 'POST' });
  return true;
}

// ---------- Welcome screen, rules and onboarding ----------

const welcomeOf = async (db, spaceId) => {
  const row = await db.prepare('SELECT * FROM space_welcome WHERE space_id = ?').get(spaceId);
  return {
    enabled: Boolean(row && Number(row.enabled)),
    message: row?.message || '',
    rules: parse(row?.rules),
    requireAccept: Boolean(row && Number(row.require_accept)),
    questions: parse(row?.questions),
  };
};

/** True when the space asks to accept its rules and this member hasn't yet (owner/managers never blocked). */
export async function mustAcceptRules(db, spaceId, userId) {
  const row = await db.prepare('SELECT enabled, require_accept FROM space_welcome WHERE space_id = ?').get(spaceId);
  if (!row || !Number(row.enabled) || !Number(row.require_accept)) return false;
  if (await db.prepare('SELECT user_id FROM space_onboarded WHERE space_id = ? AND user_id = ?').get(spaceId, userId)) return false;
  return !(await permissionsOf(db, spaceId, userId)).has('MANAGE_SERVER');
}

// Roles that onboarding may hand out: never ones with moderation powers.
const SAFE_ROLE = (perms) => !perms.some((perm) => ['ADMINISTRATOR', 'MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_MESSAGES', 'MUTE_MEMBERS', 'MOVE_MEMBERS', 'MENTION_EVERYONE'].includes(perm));

/**
 *   GET  /api/servers/:id/welcome              config + whether you already accepted
 *   PUT  /api/servers/:id/welcome              { enabled, message, rules[], requireAccept, questions[] }   (MANAGE_SERVER)
 *   POST /api/servers/:id/onboarding           { answers: { [questionId]: optionId[] } }   accept rules + get roles
 */
async function welcomeRoutes({ db, req, res, requestPath, session, send, readBody, can, canAccessSpace, notifySpace }) {
  const match = requestPath.match(/^\/api\/servers\/([^/]+)\/(welcome|onboarding)$/);
  if (!match) return false;
  const spaceId = decodeURIComponent(match[1]);
  if (!await canAccessSpace(spaceId, session.user_id)) { send(res, 404, { message: 'No encontramos ese espacio.' }); return true; }

  if (match[2] === 'welcome') {
    if (req.method === 'PUT') {
      if (!await can(db, spaceId, session.user_id, 'MANAGE_SERVER')) { send(res, 403, { message: 'Necesitas el permiso Gestionar espacio.' }); return true; }
      const body = await readBody(req);
      const roles = new Map((await db.prepare('SELECT id, permissions FROM space_roles WHERE space_id = ?').all(spaceId)).map((row) => [row.id, parse(row.permissions)]));
      const rules = (Array.isArray(body.rules) ? body.rules : []).map((rule) => String(rule || '').trim().slice(0, 300)).filter(Boolean).slice(0, 20);
      const questions = (Array.isArray(body.questions) ? body.questions : []).slice(0, 5).map((question, qi) => ({
        id: String(question?.id || `q${qi + 1}`).slice(0, 20),
        question: String(question?.question || '').trim().slice(0, 150),
        multi: Boolean(question?.multi),
        options: (Array.isArray(question?.options) ? question.options : []).slice(0, 10).map((option, oi) => ({
          id: String(option?.id || `o${oi + 1}`).slice(0, 20),
          label: String(option?.label || '').trim().slice(0, 60),
          emoji: String(option?.emoji || '').slice(0, 8),
          roleIds: [...new Set((Array.isArray(option?.roleIds) ? option.roleIds : []).map(String))].filter((id) => roles.has(id) && !id.startsWith('role_everyone_') && SAFE_ROLE(roles.get(id))).slice(0, 5),
        })).filter((option) => option.label),
      })).filter((question) => question.question && question.options.length);
      const values = [body.enabled ? 1 : 0, String(body.message || '').trim().slice(0, 1000), JSON.stringify(rules), body.requireAccept ? 1 : 0, JSON.stringify(questions), now(), spaceId];
      await db.prepare('DELETE FROM space_welcome WHERE space_id = ?').run(spaceId);
      await db.prepare('INSERT INTO space_welcome (enabled, message, rules, require_accept, questions, updated_at, space_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(...values);
      await notifySpace(spaceId, 'welcome');
    } else if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
    const done = await db.prepare('SELECT accepted_at FROM space_onboarded WHERE space_id = ? AND user_id = ?').get(spaceId, session.user_id);
    send(res, 200, { ...(await welcomeOf(db, spaceId)), completed: Boolean(done) });
    return true;
  }

  if (req.method !== 'POST') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const welcome = await welcomeOf(db, spaceId);
  const body = await readBody(req);
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const roles = new Map((await db.prepare('SELECT id, permissions FROM space_roles WHERE space_id = ?').all(spaceId)).map((row) => [row.id, parse(row.permissions)]));
  const granted = new Set();
  for (const question of welcome.questions) {
    let picked = (Array.isArray(answers[question.id]) ? answers[question.id] : []).map(String);
    if (!question.multi) picked = picked.slice(0, 1);
    for (const option of question.options) {
      if (!picked.includes(option.id)) continue;
      for (const roleId of option.roleIds) if (roles.has(roleId) && SAFE_ROLE(roles.get(roleId))) granted.add(roleId);
    }
  }
  for (const roleId of granted) {
    await db.prepare('DELETE FROM member_roles WHERE space_id = ? AND user_id = ? AND role_id = ?').run(spaceId, session.user_id, roleId);
    await db.prepare('INSERT INTO member_roles (space_id, user_id, role_id) VALUES (?, ?, ?)').run(spaceId, session.user_id, roleId);
  }
  await db.prepare('DELETE FROM space_onboarded WHERE space_id = ? AND user_id = ?').run(spaceId, session.user_id);
  await db.prepare('INSERT INTO space_onboarded (space_id, user_id, accepted_at) VALUES (?, ?, ?)').run(spaceId, session.user_id, now());
  if (granted.size) await notifySpace(spaceId, 'members');
  send(res, 200, { ok: true, roles: [...granted] });
  return true;
}

// ---------- Levels and badges ----------

const XP_COOLDOWN_MS = 60_000;
/** Total XP needed to reach a level: 50·L·(L+1)  (L1 = 100, L5 = 1500, L10 = 5500). */
export const xpForLevel = (level) => 50 * level * (level + 1);
export const levelFor = (xp) => { let level = 0; while (xp >= xpForLevel(level + 1)) level += 1; return level; };

/** One XP grant per minute per member (15–25 XP), so spamming doesn't level you up. */
export async function awardXp(db, { spaceId, userId, emitToUsers, isReal = true }) {
  if (!isReal) return;
  const row = await db.prepare('SELECT * FROM member_xp WHERE space_id = ? AND user_id = ?').get(spaceId, userId);
  const at = Date.now();
  const cooled = !row?.last_xp_at || at - Date.parse(row.last_xp_at) >= XP_COOLDOWN_MS;
  const gain = cooled ? 15 + Math.floor(Math.random() * 11) : 0;
  const xp = Number(row?.xp || 0) + gain;
  const messages = Number(row?.messages || 0) + 1;
  if (row) await db.prepare('UPDATE member_xp SET xp = ?, messages = ?, last_xp_at = ? WHERE space_id = ? AND user_id = ?').run(xp, messages, cooled ? new Date(at).toISOString() : row.last_xp_at, spaceId, userId);
  else await db.prepare('INSERT INTO member_xp (space_id, user_id, xp, messages, last_xp_at) VALUES (?, ?, ?, ?, ?)').run(spaceId, userId, xp, messages, new Date(at).toISOString());
  const before = levelFor(Number(row?.xp || 0));
  const after = levelFor(xp);
  if (after > before) await emitToUsers([userId], 'level:up', { spaceId, level: after });
}

const BADGES = [
  { id: 'founder', label: 'Fundador', emoji: '👑', test: (s) => s.isOwner },
  { id: 'pioneer', label: 'Pionero', emoji: '🚀', test: (s) => s.joinRank > 0 && s.joinRank <= 10 },
  { id: 'first_words', label: 'Primeras palabras', emoji: '💬', test: (s) => s.messages >= 1 },
  { id: 'talker', label: 'Conversador', emoji: '🗣️', test: (s) => s.messages >= 100 },
  { id: 'legend', label: 'Leyenda del chat', emoji: '🔥', test: (s) => s.messages >= 1000 },
  { id: 'level5', label: 'Nivel 5', emoji: '⭐', test: (s) => s.level >= 5 },
  { id: 'level10', label: 'Nivel 10', emoji: '🌟', test: (s) => s.level >= 10 },
  { id: 'veteran', label: 'Veterano', emoji: '🛡️', test: (s) => s.days >= 30 },
  { id: 'year', label: 'Un año aquí', emoji: '🎂', test: (s) => s.days >= 365 },
];

async function memberStats(db, spaceId, userId) {
  const space = await db.prepare('SELECT owner_id, created_at FROM spaces WHERE id = ?').get(spaceId);
  const member = await db.prepare('SELECT joined_at FROM space_members WHERE space_id = ? AND user_id = ?').get(spaceId, userId);
  const isOwner = space?.owner_id === userId;
  const joinedAt = isOwner ? space.created_at : member?.joined_at;
  const row = await db.prepare('SELECT xp, messages FROM member_xp WHERE space_id = ? AND user_id = ?').get(spaceId, userId);
  const xp = Number(row?.xp || 0);
  const level = levelFor(xp);
  const joinRank = isOwner ? 0 : joinedAt ? Number((await db.prepare('SELECT COUNT(*) AS n FROM space_members WHERE space_id = ? AND joined_at <= ?').get(spaceId, joinedAt))?.n || 0) : 0;
  const days = joinedAt ? Math.floor((Date.now() - Date.parse(joinedAt)) / 86_400_000) : 0;
  const stats = { isOwner, joinRank, messages: Number(row?.messages || 0), level, days };
  return {
    userId,
    xp,
    level,
    messages: stats.messages,
    currentLevelXp: xpForLevel(level),
    nextLevelXp: xpForLevel(level + 1),
    joinedAt,
    badges: BADGES.filter((badge) => badge.test(stats)).map(({ id, label, emoji }) => ({ id, label, emoji })),
  };
}

/**
 *   GET /api/servers/:id/leaderboard           top 50 by XP
 *   GET /api/servers/:id/members/:userId/stats  level, XP and badges
 */
async function levelRoutes({ db, req, res, requestPath, session, send, canAccessSpace }) {
  const board = requestPath.match(/^\/api\/servers\/([^/]+)\/leaderboard$/);
  const stats = requestPath.match(/^\/api\/servers\/([^/]+)\/members\/([^/]+)\/stats$/);
  if (!board && !stats) return false;
  if (req.method !== 'GET') { send(res, 405, { message: 'Método no permitido.' }); return true; }
  const spaceId = decodeURIComponent((board || stats)[1]);
  if (!await canAccessSpace(spaceId, session.user_id)) { send(res, 404, { message: 'No encontramos ese espacio.' }); return true; }
  if (stats) {
    const userId = decodeURIComponent(stats[2]);
    if (!await canAccessSpace(spaceId, userId)) { send(res, 404, { message: 'Esa persona no está en el espacio.' }); return true; }
    send(res, 200, await memberStats(db, spaceId, userId));
    return true;
  }
  const rows = await db.prepare('SELECT x.user_id, x.xp, x.messages, u.username, u.display_name, u.avatar FROM member_xp x JOIN users u ON u.id = x.user_id WHERE x.space_id = ? ORDER BY x.xp DESC LIMIT 50').all(spaceId);
  const result = [];
  for (const row of rows) {
    if (!await canAccessSpace(spaceId, row.user_id)) continue; // left the space
    result.push({ userId: row.user_id, username: row.username, displayName: row.display_name, avatar: row.avatar, xp: Number(row.xp), level: levelFor(Number(row.xp)), messages: Number(row.messages) });
  }
  send(res, 200, result);
  return true;
}

export async function handleCommunityRoutes(ctx) {
  if (!/^\/api\/(channels\/[^/]+\/(follow|followers)|servers\/[^/]+\/(welcome|onboarding|leaderboard|members\/[^/]+\/stats))$/.test(ctx.requestPath)) return false;
  if (!ctx.session) { ctx.send(ctx.res, 401, { message: 'Sesión no válida.' }); return true; }
  return (await followRoutes(ctx)) || (await welcomeRoutes(ctx)) || (await levelRoutes(ctx));
}
