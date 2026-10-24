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
