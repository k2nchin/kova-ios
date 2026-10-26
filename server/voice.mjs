// LiveKit access tokens for Kova voice channels. LiveKit is the SFU that carries
// the audio; Kova only decides who may join which room.
import crypto from 'node:crypto';

const TOKEN_TTL_SECONDS = 6 * 60 * 60;

export class VoiceError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const isVoiceConfigured = () => Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);

export const voiceRoomName = (channelId) => `kova_${channelId}`;

const base64url = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

/** Signs a LiveKit access token (HS256 JWT with a `video` grant). */
export const signLiveKitToken = ({ identity, name, metadata, room, apiKey, apiSecret, ttlSeconds = TOKEN_TTL_SECONDS, now = Math.floor(Date.now() / 1000) }) => {
  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const payload = base64url({
    iss: apiKey,
    sub: identity,
    name,
    metadata,
    nbf: now - 10,
    exp: now + ttlSeconds,
    jti: crypto.randomUUID(),
    video: { room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true, canPublishSources: ['microphone', 'camera', 'screen_share', 'screen_share_audio'] },
  });
  const signature = crypto.createHmac('sha256', apiSecret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
};

export const createVoiceToken = ({ user, channelId }) => {
  if (!isVoiceConfigured()) throw new VoiceError(503, 'VOICE_NOT_CONFIGURED', 'La voz no está configurada en este servidor.');
  const room = voiceRoomName(channelId);
  const token = signLiveKitToken({
    identity: user.id,
    name: user.displayName || user.username,
    metadata: JSON.stringify({ avatar: user.avatar || '', username: user.username }),
    room,
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
  });
  return { token, url: process.env.LIVEKIT_URL, room };
};

// ---- Who is in each voice room (LiveKit RoomService over HTTP/Twirp) ----
const adminToken = (grant) => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const payload = base64url({ iss: process.env.LIVEKIT_API_KEY, sub: 'kova-api', nbf: now - 10, exp: now + 60, video: grant });
  const signature = crypto.createHmac('sha256', process.env.LIVEKIT_API_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
};
const roomService = async (method, body, grant) => {
  const base = String(process.env.LIVEKIT_URL).replace(/^ws/i, 'http').replace(/\/$/, '');
  const res = await fetch(`${base}/twirp/livekit.RoomService/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken(grant)}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new VoiceError(502, 'VOICE_LOOKUP_FAILED', 'No se pudo consultar las salas de voz.');
  return res.json();
};

const occupancyCache = new Map();
/** { [channelId]: [{ id, name, avatar }] } for the given voice channels (cached 5 s). */
export async function voiceOccupancy(channelIds) {
  if (!isVoiceConfigured() || channelIds.length === 0) return {};
  const key = [...channelIds].sort().join(',');
  const cached = occupancyCache.get(key);
  if (cached && Date.now() - cached.at < 5000) return cached.value;
  const names = channelIds.map(voiceRoomName);
  const { rooms = [] } = await roomService('ListRooms', { names }, { roomList: true });
  const value = {};
  for (const room of rooms) {
    if (!Number(room.num_participants)) continue;
    const { participants = [] } = await roomService('ListParticipants', { room: room.name }, { roomAdmin: true, room: room.name });
    value[room.name.replace(/^kova_/, '')] = participants.map((participant) => {
      let avatar = '';
      try { avatar = JSON.parse(participant.metadata || '{}').avatar || ''; } catch {}
      return { id: participant.identity, name: participant.name || participant.identity, avatar };
    });
  }
  occupancyCache.set(key, { at: Date.now(), value });
  return value;
}
export const forgetVoiceOccupancy = () => occupancyCache.clear();
