import crypto from 'node:crypto';
// Kova realtime gateway (Socket.IO): messages, presence and typing.
// Only runs on a long-lived Node host. Instances without it (Vercel) relay their
// events here over HTTP, and clients also poll as a fallback.
let io = null;
const connectionsByUser = new Map(); // userId -> number of open sockets
const TYPING_TTL_MS = 8_000;

const channelRoom = (channelId) => `channel:${channelId}`;
const spaceRoom = (spaceId) => `space:${spaceId}`;
const userRoom = (userId) => `user:${userId}`;

export const isOnline = (userId) => (connectionsByUser.get(userId) || 0) > 0;

// Instances without a socket server (Vercel) forward events to the realtime
// gateway over HTTP, authenticated with a shared secret.
const RELAY_URL = String(process.env.KOVA_REALTIME_URL || '').replace(/\/$/, '');
const RELAY_SECRET = process.env.KOVA_REALTIME_SECRET || '';
export const isRelayAuthorized = (header) => {
  if (!RELAY_SECRET || typeof header !== 'string') return false;
  const a = Buffer.from(header);
  const b = Buffer.from(RELAY_SECRET);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const relay = async (target, event, payload) => {
  if (!RELAY_URL || !RELAY_SECRET) return;
  try {
    await fetch(`${RELAY_URL}/api/realtime/emit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-kova-realtime-secret': RELAY_SECRET },
      body: JSON.stringify({ ...target, event, payload }),
      signal: AbortSignal.timeout(2500),
    });
  } catch (error) {
    // Realtime is best effort: clients still catch up through polling.
    console.warn('[Kova realtime relay]', error?.name || error);
  }
};

export const emitToChannel = async (channelId, event, payload) => {
  if (io) io.to(channelRoom(channelId)).emit(event, payload);
  else await relay({ channelId }, event, payload);
};
export const emitToUsers = async (userIds, event, payload) => {
  if (io) for (const id of new Set(userIds)) io.to(userRoom(id)).emit(event, payload);
  else await relay({ userIds: [...new Set(userIds)] }, event, payload);
};

/** Receives a relayed event (POST /api/realtime/emit) and broadcasts it locally. */
export const broadcastRelayed = ({ channelId, userIds, event, payload } = {}) => {
  const allowed = ['message:created', 'message:updated', 'message:deleted', 'message:reactions', 'dm:created'];
  if (!io || !allowed.includes(event)) return false;
  if (typeof channelId === 'string' && channelId) io.to(channelRoom(channelId)).emit(event, payload);
  if (Array.isArray(userIds)) for (const id of new Set(userIds.map(String).slice(0, 50))) io.to(userRoom(id)).emit(event, payload);
  return true;
};

const spaceIdsFor = async (db, userId) => {
  const rows = await db.prepare('SELECT s.id FROM spaces s LEFT JOIN space_members m ON m.space_id = s.id WHERE s.owner_id = ? OR m.user_id = ?').all(userId, userId);
  return [...new Set(rows.map((row) => row.id))];
};

const presenceAudience = async (db, userId) => {
  const left = await db.prepare('SELECT user_b AS id FROM friendships WHERE user_a = ?').all(userId);
  const right = await db.prepare('SELECT user_a AS id FROM friendships WHERE user_b = ?').all(userId);
  return [...left, ...right].map((row) => row.id);
};

const broadcastPresence = async (db, socket, status) => {
  const { user, spaceIds } = socket.data;
  const payload = { userId: user.id, status, at: new Date().toISOString() };
  for (const spaceId of spaceIds) socket.to(spaceRoom(spaceId)).emit('presence:changed', payload);
  emitToUsers(await presenceAudience(db, user.id), 'presence:changed', payload);
};

export async function attachRealtime(httpServer, { db, canAccessSpace, allowedOrigins }) {
  const { Server } = await import('socket.io');
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins?.length ? allowedOrigins : true, credentials: false },
    pingInterval: 20_000,
    pingTimeout: 25_000,
  });

  io.use(async (socket, next) => {
    try {
      const token = String(socket.handshake.auth?.token || '');
      if (!token) return next(new Error('UNAUTHORIZED'));
      const row = await db.prepare('SELECT u.id, u.username, u.display_name FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?').get(token, new Date().toISOString());
      if (!row) return next(new Error('UNAUTHORIZED'));
      socket.data.user = { id: row.id, username: row.username, displayName: row.display_name };
      socket.data.channelId = null;
      next();
    } catch (error) {
      console.error('[Kova realtime auth]', error);
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', async (socket) => {
    const { user } = socket.data;
    socket.data.spaceIds = await spaceIdsFor(db, user.id);
    socket.join(userRoom(user.id));
    for (const spaceId of socket.data.spaceIds) socket.join(spaceRoom(spaceId));

    const previous = connectionsByUser.get(user.id) || 0;
    connectionsByUser.set(user.id, previous + 1);
    if (previous === 0) await broadcastPresence(db, socket, 'online');

    const stopTyping = () => {
      clearTimeout(socket.data.typingTimer);
      if (socket.data.typingChannelId) {
        socket.to(channelRoom(socket.data.typingChannelId)).emit('channel:typing', { channelId: socket.data.typingChannelId, userId: user.id, displayName: user.displayName, typing: false });
        socket.data.typingChannelId = null;
      }
    };

    socket.on('channel:join', async ({ channelId } = {}, ack) => {
      try {
        const id = String(channelId || '');
        const channel = id && await db.prepare('SELECT space_id FROM signals WHERE id = ?').get(id);
        if (!channel || !(await canAccessSpace(channel.space_id, user.id))) return ack?.({ ok: false });
        stopTyping();
        if (socket.data.channelId) socket.leave(channelRoom(socket.data.channelId));
        socket.data.channelId = id;
        socket.join(channelRoom(id));
        ack?.({ ok: true });
      } catch (error) {
        console.error('[Kova realtime join]', error);
        ack?.({ ok: false });
      }
    });

    socket.on('channel:typing', ({ channelId, typing } = {}) => {
      const id = String(channelId || '');
      if (!id || id !== socket.data.channelId) return;
      if (!typing) return stopTyping();
      clearTimeout(socket.data.typingTimer);
      socket.data.typingChannelId = id;
      socket.data.typingTimer = setTimeout(stopTyping, TYPING_TTL_MS);
      socket.to(channelRoom(id)).emit('channel:typing', { channelId: id, userId: user.id, displayName: user.displayName, typing: true });
    });

    socket.on('presence:query', async ({ userIds } = {}, ack) => {
      const ids = Array.isArray(userIds) ? userIds.slice(0, 500).map(String) : [];
      ack?.({ online: ids.filter(isOnline) });
    });

    // Spaces created or joined after connecting.
    socket.on('spaces:refresh', async () => {
      for (const spaceId of socket.data.spaceIds) socket.leave(spaceRoom(spaceId));
      socket.data.spaceIds = await spaceIdsFor(db, user.id);
      for (const spaceId of socket.data.spaceIds) socket.join(spaceRoom(spaceId));
    });

    socket.on('disconnect', async () => {
      stopTyping();
      const remaining = (connectionsByUser.get(user.id) || 1) - 1;
      if (remaining > 0) return connectionsByUser.set(user.id, remaining);
      connectionsByUser.delete(user.id);
      try { await broadcastPresence(db, socket, 'offline'); } catch (error) { console.error('[Kova realtime presence]', error); }
    });
  });

  console.log('Kova realtime gateway (Socket.IO) activo');
  return io;
}
