const isTauri = typeof window !== 'undefined' && ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
const API_BASE_URL = import.meta.env.VITE_KOVA_API_URL || (isTauri ? 'https://kova-k2nchin.vercel.app/api' : '/api');
// Same API and database, hosted on Render: the desktop app switches to it for
// the rest of the session when Vercel doesn't answer (some networks block it).
const FALLBACK_API_URL = 'https://kova-ios.onrender.com/api';
const PRIMARY_TIMEOUT_MS = 6000;
let activeApiBase = API_BASE_URL;

const fetchApi = async (endpoint: string, config: RequestInit): Promise<Response> => {
  const canFallBack = isTauri && activeApiBase !== FALLBACK_API_URL && /^https:/.test(activeApiBase);
  if (!canFallBack) return fetch(`${activeApiBase}${endpoint}`, config);
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PRIMARY_TIMEOUT_MS);
  try {
    return await fetch(`${activeApiBase}${endpoint}`, { ...config, signal: controller.signal });
  } catch (error) {
    const timedOut = controller.signal.aborted;
    const isRead = !config.method || config.method === 'GET';
    // A timed-out write may already have reached the server: don't repeat it.
    if (timedOut && !isRead) throw new Error('El servidor tarda en responder. Inténtalo de nuevo.');
    console.warn('[Kova API] Vercel no responde; usando el servidor de reserva.', error);
    activeApiBase = FALLBACK_API_URL;
    return fetch(`${activeApiBase}${endpoint}`, config);
  } finally {
    window.clearTimeout(timer);
  }
};

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('kova.auth.token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem('kova.auth.token', token);
  } catch {}
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem('kova.auth.token');
  } catch {}
}

/** Login responses either carry a session or, with 2FA enabled, a short-lived challenge. */
export type AuthResponse =
  | { user: any; token: string; twoFactorRequired?: false; challenge?: undefined }
  | { twoFactorRequired: true; challenge: string; methods: string[]; user?: undefined; token?: undefined };

export type UploadKind = 'avatar' | 'banner' | 'icon' | 'story' | 'sound' | 'attachment';

/**
 * Uploads a file through Kova: the API validates it and hands back a signed URL,
 * the browser sends the bytes straight to storage, and the public URL is returned.
 */
export async function uploadFile(file: File, kind: UploadKind): Promise<string> {
  const ticket = await api.createUpload({ kind, fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size });
  const res = await fetch(ticket.uploadUrl, { method: ticket.method, headers: ticket.headers, body: file });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `No se pudo subir ${file.name}.`);
  }
  return ticket.publicUrl;
}

interface RequestOptions extends RequestInit {
  data?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers, ...customOptions } = options;
  const token = getAuthToken();

  const config: RequestInit = {
    ...customOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const res = await fetchApi(endpoint, config);

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error(errorBody.message || `Request failed with status ${res.status}`) as Error & { code?: string; status?: number };
    error.code = errorBody.code;
    error.status = res.status;
    throw error;
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  // Auth
  register: (data: { username: string; email: string; password: string; displayName?: string }) =>
    request<{ user: any; token: string }>('/auth/register', { method: 'POST', data }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', data }),

  loginGoogle: (data: { accessToken: string; googleId: string; email: string; displayName: string; avatarUrl?: string }) =>
    request<AuthResponse>('/auth/google', { method: 'POST', data }),

  // Two-factor authentication (server-side TOTP)
  completeTwoFactorLogin: (data: { challenge: string; code: string }) =>
    request<{ user: any; token: string; method: 'totp' | 'backup_code'; backupCodesRemaining: number }>('/auth/2fa/login', { method: 'POST', data }),
  getTwoFactorStatus: () => request<{ enabled: boolean; backupCodesRemaining: number }>('/auth/2fa/status', { method: 'GET' }),
  startTwoFactorSetup: () => request<{ secret: string; otpauthUrl: string }>('/auth/2fa/setup', { method: 'POST' }),
  enableTwoFactor: (code: string) => request<{ enabled: true; backupCodes: string[] }>('/auth/2fa/enable', { method: 'POST', data: { code } }),
  disableTwoFactor: (code: string) => request<{ enabled: false }>('/auth/2fa/disable', { method: 'POST', data: { code } }),
  regenerateBackupCodes: (code: string) => request<{ backupCodes: string[] }>('/auth/2fa/backup-codes', { method: 'POST', data: { code } }),

  getMe: () => request<any>('/auth/me', { method: 'GET' }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  // Servers
  getServers: () => request<any[]>('/servers', { method: 'GET' }),
  discoverServers: (query = '') => request<any[]>(`/servers/discover${query ? `?q=${encodeURIComponent(query)}` : ''}`, { method: 'GET' }),
  createServer: (data: { id?: string; name: string; description?: string; iconUrl?: string; visibility?: 'public' | 'private'; categories?: Array<{ id: string; name: string }>; channels?: Array<{ id: string; name: string; type: string; topic?: string; categoryId?: string }> }) =>
    request<any>('/servers', { method: 'POST', data }),
  createInvite: async (serverId: string, options: { expiresInMinutes: number; maxUses: number }) => {
    const invite = await request<{ code: string; serverId: string; expiresAt: string | null; maxUses: number; url: string }>(`/servers/${encodeURIComponent(serverId)}/invites`, { method: 'POST', data: options });
    // On the web, share the address the person is using (some networks block the
    // default domain); the desktop app keeps the public URL from the server.
    const webOrigin = !isTauri && typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol) ? window.location.origin : '';
    return webOrigin ? { ...invite, url: `${webOrigin}/invite/${encodeURIComponent(invite.code)}` } : invite;
  },
  joinServer: (inviteCode: string) => request<any>('/servers/join', { method: 'POST', data: { inviteCode } }),
  createRole: (serverId: string, data: { name: string; color?: string; hoist?: boolean; permissions?: string[] }) =>
    request<any>(`/servers/${encodeURIComponent(serverId)}/roles`, { method: 'POST', data }),
  updateRole: (serverId: string, roleId: string, data: { name?: string; color?: string; hoist?: boolean; permissions?: string[] }) =>
    request<any>(`/servers/${encodeURIComponent(serverId)}/roles/${encodeURIComponent(roleId)}`, { method: 'PATCH', data }),
  deleteRole: (serverId: string, roleId: string) =>
    request<{ ok: true }>(`/servers/${encodeURIComponent(serverId)}/roles/${encodeURIComponent(roleId)}`, { method: 'DELETE' }),
  setMemberRole: (serverId: string, userId: string, roleId: string, give: boolean) =>
    request<{ ok: true }>(`/servers/${encodeURIComponent(serverId)}/members/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`, { method: give ? 'PUT' : 'DELETE' }),
  /** Leave (your own id), kick, or ban (ban=true) someone from a space. */
  removeMember: (serverId: string, userId: string, ban = false) =>
    request<{ ok: true }>(`/servers/${encodeURIComponent(serverId)}/members/${encodeURIComponent(userId)}${ban ? '?ban=1' : ''}`, { method: 'DELETE' }),
  setNickname: (serverId: string, nickname: string) =>
    request<{ serverId: string; userId: string; nickname: string }>(`/servers/${encodeURIComponent(serverId)}/nickname`, { method: 'PUT', data: { nickname } }),
  deleteServer: (serverId: string) => request<{ ok: boolean }>(`/servers/${encodeURIComponent(serverId)}`, { method: 'DELETE' }),
  updateServer: (serverId: string, data: { name?: string; description?: string; visibility?: 'public' | 'private'; icon?: string; banner?: string }) =>
    request<any>(`/servers/${encodeURIComponent(serverId)}`, { method: 'PATCH', data }),
  getFriends: () => request<any>('/friends', { method: 'GET' }),
  /** Accepts a user id or a username/@username (what people type in "Añadir amigo"). */
  sendFriendRequest: (who: string) => request<any>('/friends/requests', { method: 'POST', data: /^user_[\w-]+$/.test(who) ? { userId: who } : { identity: who } }),
  acceptFriendRequest: (requestId: string) => request<any>(`/friends/requests/${requestId}/accept`, { method: 'POST' }),
  deleteFriendRequest: (requestId: string) => request<any>(`/friends/requests/${requestId}`, { method: 'DELETE' }),
  removeFriend: (userId: string) => request<{ ok: boolean }>(`/friends/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  getDMConversations: () => request<Array<{ user: any; lastMessage: string; lastMessageTime: string }>>('/dms', { method: 'GET' }),
  getDirectMessages: (userId: string, limit = 50) => request<any[]>(`/dms/${encodeURIComponent(userId)}/messages?limit=${limit}`, { method: 'GET' }),
  sendDirectMessage: (userId: string, content: string) => request<any>(`/dms/${encodeURIComponent(userId)}/messages`, { method: 'POST', data: { content } }),

  // Safety
  getBlockedUsers: () => request<{ blockedUserIds: string[] }>('/safety/blocks', { method: 'GET' }),
  blockUser: (userId: string) => request<{ ok: true; userId: string }>('/safety/blocks', { method: 'POST', data: { userId } }),
  unblockUser: (userId: string) => request<{ ok: true }>(`/safety/blocks/${userId}`, { method: 'DELETE' }),
  reportUser: (userId: string, reason: string, details = '') => request<{ id: string; ok: true }>('/safety/reports', { method: 'POST', data: { userId, reason, details } }),

  // Channels
  createChannel: (data: { id?: string; serverId: string; categoryId?: string; name: string; type: string; topic?: string }) =>
    request<any>('/channels', { method: 'POST', data }),
  updateChannel: (channelId: string, data: { name?: string; topic?: string; categoryId?: string | null }) =>
    request<any>(`/channels/${encodeURIComponent(channelId)}`, { method: 'PATCH', data }),
  deleteChannel: (channelId: string) => request<any>(`/channels/${channelId}`, { method: 'DELETE' }),
  createCategory: (data: { id?: string; serverId: string; name: string }) =>
    request<{ id: string; name: string; channelIds: string[] }>('/categories', { method: 'POST', data }),
  deleteCategory: (categoryId: string) => request<{ ok: boolean }>(`/categories/${encodeURIComponent(categoryId)}`, { method: 'DELETE' }),

  // Messages
  getMessages: (channelId: string, limit = 50) =>
    request<any[]>(`/channels/${channelId}/messages?limit=${limit}`, { method: 'GET' }),
  sendMessage: (channelId: string, data: { content: string; replyToId?: string; attachments?: Array<{ id: string; url: string; name: string; type: string; size: string }> }) =>
    request<any>(`/channels/${channelId}/messages`, { method: 'POST', data }),
  updateMessage: (messageId: string, content: string) =>
    request<any>(`/messages/${messageId}`, { method: 'PUT', data: { content } }),
  toggleReaction: (messageId: string, emoji: string) =>
    request<any>(`/messages/${messageId}/reactions`, { method: 'POST', data: { emoji } }),
  pinMessage: (messageId: string, pinned: boolean) =>
    request<{ id: string; pinned: boolean }>(`/messages/${encodeURIComponent(messageId)}/pin`, { method: pinned ? 'PUT' : 'DELETE' }),
  deleteMessage: (messageId: string) => request<any>(`/messages/${messageId}`, { method: 'DELETE' }),

  // Voice
  getVoiceToken: (channelId: string) =>
    request<{ token: string; url: string; room: string }>('/voice/token', { method: 'POST', data: { channelId } }),

  // Uploads, profile and user content
  createUpload: (data: { kind: UploadKind; fileName: string; contentType: string; size: number }) =>
    request<{ uploadUrl: string; method: 'PUT'; headers: Record<string, string>; publicUrl: string }>('/uploads', { method: 'POST', data }),
  updateProfile: (data: { displayName?: string; avatar?: string; banner?: string; bio?: string; customStatus?: string; thoughtBubble?: string; accentColor?: string; joinSound?: string }) =>
    request<any>('/users/me', { method: 'PATCH', data }),
  getStories: () => request<any[]>('/stories', { method: 'GET' }),
  createStory: (data: { mediaUrl?: string; mediaType?: 'image' | 'video'; text?: string; backgroundColor?: string }) =>
    request<any>('/stories', { method: 'POST', data }),
  deleteStory: (storyId: string) => request<{ ok: true }>(`/stories/${encodeURIComponent(storyId)}`, { method: 'DELETE' }),
  toggleStoryLike: (storyId: string) =>
    request<{ id: string; likes: number; likedByMe: boolean }>(`/stories/${encodeURIComponent(storyId)}/like`, { method: 'POST' }),
  getBots: () => request<any[]>('/bots', { method: 'GET' }),
  createBot: (serverId: string, bot: unknown) => request<any>('/bots', { method: 'POST', data: { serverId, bot } }),
  deleteBot: (botId: string) => request<{ ok: true }>(`/bots/${encodeURIComponent(botId)}`, { method: 'DELETE' }),
  getSounds: () => request<Array<{ id: string; name: string; emoji: string; url: string; duration: number }>>('/sounds', { method: 'GET' }),
  createSound: (data: { name: string; emoji: string; url: string; duration: number }) =>
    request<{ id: string; name: string; emoji: string; url: string; duration: number }>('/sounds', { method: 'POST', data }),
  deleteSound: (soundId: string) => request<{ ok: true }>(`/sounds/${encodeURIComponent(soundId)}`, { method: 'DELETE' }),

  // Kova AI Proxy
  askAI: (prompt: string, context?: any) =>
    request<{ text: string }>('/ai/chat', { method: 'POST', data: { prompt, context } }),
};
