// Server-side storage for things that used to live only in the browser:
// profile fields, stories, custom bots and custom soundboard sounds.
import crypto from 'node:crypto';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_BOTS_PER_USER = 25;
const MAX_SOUNDS_PER_USER = 50;

export const contentSchema = `CREATE TABLE IF NOT EXISTS stories (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, media_url TEXT NOT NULL DEFAULT '', media_type TEXT NOT NULL DEFAULT '', text TEXT NOT NULL DEFAULT '', background TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, expires_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS story_likes (story_id TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY(story_id, user_id)); CREATE TABLE IF NOT EXISTS custom_bots (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, space_id TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS custom_sounds (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, emoji TEXT NOT NULL DEFAULT '', url TEXT NOT NULL, duration REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL);`;
export const contentUserColumns = [
  "ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN banner TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN custom_status TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN thought_bubble TEXT NOT NULL DEFAULT ''",
];

const text = (value, max) => String(value ?? '').trim().slice(0, max);
// Media must be a hosted https URL (uploads or external); data: URLs are rejected.
const mediaUrl = (value) => {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (url.length > 2048 || !/^https:\/\//i.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)) return null;
  return url;
};
const parseJson = (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } };

// Everyone the viewer shares a space with, plus friends: the audience for stories.
const circleOf = async (db, userId) => {
  const rows = [
    ...await db.prepare('SELECT user_b AS id FROM friendships WHERE user_a = ?').all(userId),
    ...await db.prepare('SELECT user_a AS id FROM friendships WHERE user_b = ?').all(userId),
    ...await db.prepare('SELECT m2.user_id AS id FROM space_members m1 JOIN space_members m2 ON m2.space_id = m1.space_id WHERE m1.user_id = ?').all(userId),
    ...await db.prepare('SELECT s.owner_id AS id FROM space_members m JOIN spaces s ON s.id = m.space_id WHERE m.user_id = ?').all(userId),
    ...await db.prepare('SELECT m.user_id AS id FROM spaces s JOIN space_members m ON m.space_id = s.id WHERE s.owner_id = ?').all(userId),
  ];
  return [...new Set([userId, ...rows.map((row) => row.id)])];
};

const sanitizeBot = (input) => {
  const bot = input && typeof input === 'object' ? input : {};
  const list = (value, max, map) => (Array.isArray(value) ? value.slice(0, max).map(map) : []);
  return {
    name: text(bot.name, 32),
    username: text(bot.username || bot.name, 32),
    tag: text(bot.tag || 'BOT', 8),
    avatar: mediaUrl(bot.avatar) || '',
    banner: mediaUrl(bot.banner) || '',
    description: text(bot.description, 500),
    category: ['music', 'moderation', 'ai', 'fun', 'gaming', 'utility', 'custom'].includes(bot.category) ? bot.category : 'custom',
    prefix: text(bot.prefix || '!', 5),
    isAiPowered: Boolean(bot.isAiPowered),
    systemPrompt: text(bot.systemPrompt, 2000),
    developerName: text(bot.developerName, 64),
    commands: list(bot.commands, 25, (command) => ({ name: text(command?.name, 32), description: text(command?.description, 200), usage: text(command?.usage, 100) })),
    autoResponses: list(bot.autoResponses, 25, (rule) => ({ trigger: text(rule?.trigger, 100), response: text(rule?.response, 2000) })),
  };
};

/** Handles /api/users/me, /api/stories, /api/bots and /api/sounds. Returns true when it answered. */
export async function handleContentRoute({ req, res, requestPath, session, db, send, readBody, userFromRow, publicUser, canAccessSpace }) {
  const isContentRoute = requestPath === '/api/users/me' || /^\/api\/(stories|bots|sounds)(\/|$)/.test(requestPath);
  if (!isContentRoute) return false;
  if (!session) { send(res, 401, { message: 'Sesión no válida.' }); return true; }
  const userId = session.user_id;
  const now = new Date().toISOString();

  // ---- Profile ----
  if (requestPath === '/api/users/me' && req.method === 'PATCH') {
    const body = await readBody(req);
    const updates = {};
    if ('displayName' in body) {
      const displayName = text(body.displayName, 64);
      if (!displayName) { send(res, 400, { message: 'El nombre visible no puede estar vacío.' }); return true; }
      updates.display_name = displayName;
    }
    for (const [field, column] of [['avatar', 'avatar'], ['banner', 'banner']]) {
      if (!(field in body)) continue;
      const url = mediaUrl(body[field]);
      if (url === null) { send(res, 400, { message: 'La imagen debe subirse a Kova antes de usarla.', code: 'INVALID_MEDIA_URL' }); return true; }
      updates[column] = url;
    }
    if ('bio' in body) updates.bio = text(body.bio, 300);
    if ('customStatus' in body) updates.custom_status = text(body.customStatus, 128);
    if ('thoughtBubble' in body) updates.thought_bubble = text(body.thoughtBubble, 100);
    const columns = Object.keys(updates);
    if (columns.length) await db.prepare(`UPDATE users SET ${columns.map((column) => `${column} = ?`).join(', ')} WHERE id = ?`).run(...columns.map((column) => updates[column]), userId);
    send(res, 200, publicUser(userFromRow(await db.prepare('SELECT * FROM users WHERE id = ?').get(userId))));
    return true;
  }

  // ---- Stories ----
  if (requestPath === '/api/stories' && req.method === 'GET') {
    const circle = await circleOf(db, userId);
    const placeholders = circle.map(() => '?').join(', ');
    const rows = await db.prepare(`SELECT s.*, u.username, u.display_name, u.avatar FROM stories s JOIN users u ON u.id = s.user_id WHERE s.user_id IN (${placeholders}) AND s.expires_at > ? ORDER BY s.created_at DESC LIMIT 100`).all(...circle, now);
    const stories = [];
    for (const row of rows) {
      const likes = await db.prepare('SELECT user_id FROM story_likes WHERE story_id = ?').all(row.id);
      stories.push({ id: row.id, author: { id: row.user_id, username: row.username, displayName: row.display_name, avatar: row.avatar }, mediaUrl: row.media_url || undefined, mediaType: row.media_type || undefined, text: row.text || undefined, backgroundColor: row.background || undefined, createdAt: row.created_at, expiresAt: row.expires_at, likes: likes.length, likedByMe: likes.some((like) => like.user_id === userId) });
    }
    send(res, 200, stories);
    return true;
  }
  if (requestPath === '/api/stories' && req.method === 'POST') {
    const body = await readBody(req);
    const media = mediaUrl(body.mediaUrl);
    if (media === null) { send(res, 400, { message: 'El archivo de la historia debe subirse a Kova.', code: 'INVALID_MEDIA_URL' }); return true; }
    const storyText = text(body.text, 500);
    if (!media && !storyText) { send(res, 400, { message: 'La historia necesita una imagen, un video o un texto.' }); return true; }
    const story = { id: `story_${crypto.randomUUID()}`, mediaUrl: media || undefined, mediaType: media ? (body.mediaType === 'video' ? 'video' : 'image') : undefined, text: storyText || undefined, backgroundColor: text(body.backgroundColor, 120) || undefined, createdAt: now, expiresAt: new Date(Date.now() + STORY_TTL_MS).toISOString(), likes: 0, likedByMe: false };
    await db.prepare('INSERT INTO stories (id, user_id, media_url, media_type, text, background, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(story.id, userId, media || '', story.mediaType || '', storyText, story.backgroundColor || '', story.createdAt, story.expiresAt);
    await db.prepare('DELETE FROM stories WHERE expires_at < ?').run(new Date(Date.now() - STORY_TTL_MS).toISOString());
    send(res, 201, story);
    return true;
  }
  const storyMatch = requestPath.match(/^\/api\/stories\/([^/]+)(\/like)?$/);
  if (storyMatch) {
    const storyId = decodeURIComponent(storyMatch[1]);
    const story = await db.prepare('SELECT * FROM stories WHERE id = ? AND expires_at > ?').get(storyId, now);
    if (!story || !(await circleOf(db, userId)).includes(story.user_id)) { send(res, 404, { message: 'Esa historia ya no está disponible.' }); return true; }
    if (storyMatch[2] && req.method === 'POST') {
      const existing = await db.prepare('SELECT story_id FROM story_likes WHERE story_id = ? AND user_id = ?').get(storyId, userId);
      if (existing) await db.prepare('DELETE FROM story_likes WHERE story_id = ? AND user_id = ?').run(storyId, userId);
      else await db.prepare('INSERT INTO story_likes (story_id, user_id) VALUES (?, ?)').run(storyId, userId);
      const count = await db.prepare('SELECT COUNT(*) AS n FROM story_likes WHERE story_id = ?').get(storyId);
      send(res, 200, { id: storyId, likes: Number(count?.n || 0), likedByMe: !existing });
      return true;
    }
    if (!storyMatch[2] && req.method === 'DELETE') {
      if (story.user_id !== userId) { send(res, 403, { message: 'Solo puedes borrar tus historias.' }); return true; }
      await db.prepare('DELETE FROM story_likes WHERE story_id = ?').run(storyId);
      await db.prepare('DELETE FROM stories WHERE id = ?').run(storyId);
      send(res, 200, { ok: true });
      return true;
    }
  }

  // ---- Custom bots ----
  if (requestPath === '/api/bots' && req.method === 'GET') {
    const rows = await db.prepare('SELECT b.* FROM custom_bots b JOIN spaces s ON s.id = b.space_id LEFT JOIN space_members m ON m.space_id = s.id AND m.user_id = ? WHERE s.owner_id = ? OR m.user_id IS NOT NULL OR b.owner_id = ?').all(userId, userId, userId);
    const seen = new Set();
    send(res, 200, rows.filter((row) => !seen.has(row.id) && seen.add(row.id)).map((row) => ({ ...parseJson(row.data, {}), id: row.id, createdBy: row.owner_id, installedServers: [row.space_id], verified: false })));
    return true;
  }
  if (requestPath === '/api/bots' && req.method === 'POST') {
    const body = await readBody(req);
    const spaceId = text(body.serverId, 200);
    if (!spaceId || !(await canAccessSpace(spaceId, userId))) { send(res, 404, { message: 'No encontramos ese espacio o no tienes acceso.' }); return true; }
    const owned = await db.prepare('SELECT COUNT(*) AS n FROM custom_bots WHERE owner_id = ?').get(userId);
    if (Number(owned?.n || 0) >= MAX_BOTS_PER_USER) { send(res, 409, { message: `Puedes tener como máximo ${MAX_BOTS_PER_USER} bots.` }); return true; }
    const bot = sanitizeBot(body.bot);
    if (!bot.name) { send(res, 400, { message: 'El bot necesita un nombre.' }); return true; }
    const id = `bot_${crypto.randomUUID()}`;
    await db.prepare('INSERT INTO custom_bots (id, owner_id, space_id, data, created_at) VALUES (?, ?, ?, ?, ?)').run(id, userId, spaceId, JSON.stringify(bot), now);
    send(res, 201, { ...bot, id, createdBy: userId, installedServers: [spaceId], verified: false });
    return true;
  }
  const botMatch = requestPath.match(/^\/api\/bots\/([^/]+)$/);
  if (botMatch && req.method === 'DELETE') {
    const bot = await db.prepare('SELECT b.owner_id, s.owner_id AS space_owner FROM custom_bots b JOIN spaces s ON s.id = b.space_id WHERE b.id = ?').get(decodeURIComponent(botMatch[1]));
    if (!bot || (bot.owner_id !== userId && bot.space_owner !== userId)) { send(res, 404, { message: 'No encontramos ese bot o no tienes permiso.' }); return true; }
    await db.prepare('DELETE FROM custom_bots WHERE id = ?').run(decodeURIComponent(botMatch[1]));
    send(res, 200, { ok: true });
    return true;
  }

  // ---- Custom soundboard sounds ----
  const soundFromRow = (row) => ({ id: row.id, name: row.name, emoji: row.emoji, url: row.url, duration: Number(row.duration) || 0, createdAt: row.created_at });
  if (requestPath === '/api/sounds' && req.method === 'GET') {
    send(res, 200, (await db.prepare('SELECT * FROM custom_sounds WHERE owner_id = ? ORDER BY created_at DESC').all(userId)).map(soundFromRow));
    return true;
  }
  if (requestPath === '/api/sounds' && req.method === 'POST') {
    const body = await readBody(req);
    const url = mediaUrl(body.url);
    if (!url) { send(res, 400, { message: 'El sonido debe subirse a Kova antes de guardarlo.', code: 'INVALID_MEDIA_URL' }); return true; }
    const name = text(body.name, 32);
    if (!name) { send(res, 400, { message: 'El sonido necesita un nombre.' }); return true; }
    const owned = await db.prepare('SELECT COUNT(*) AS n FROM custom_sounds WHERE owner_id = ?').get(userId);
    if (Number(owned?.n || 0) >= MAX_SOUNDS_PER_USER) { send(res, 409, { message: `Puedes guardar como máximo ${MAX_SOUNDS_PER_USER} sonidos.` }); return true; }
    const row = { id: `sound_${crypto.randomUUID()}`, owner_id: userId, name, emoji: text(body.emoji, 16) || '🔊', url, duration: Math.max(0, Math.min(60, Number(body.duration) || 0)), created_at: now };
    await db.prepare('INSERT INTO custom_sounds (id, owner_id, name, emoji, url, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(row.id, row.owner_id, row.name, row.emoji, row.url, row.duration, row.created_at);
    send(res, 201, soundFromRow(row));
    return true;
  }
  const soundMatch = requestPath.match(/^\/api\/sounds\/([^/]+)$/);
  if (soundMatch && req.method === 'DELETE') {
    const result = await db.prepare('DELETE FROM custom_sounds WHERE id = ? AND owner_id = ?').run(decodeURIComponent(soundMatch[1]), userId);
    send(res, result.changes ? 200 : 404, result.changes ? { ok: true } : { message: 'No encontramos ese sonido.' });
    return true;
  }

  send(res, 404, { message: 'Ruta no implementada', code: 'NOT_IMPLEMENTED' });
  return true;
}
