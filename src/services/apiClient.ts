const isTauri = typeof window !== 'undefined' && ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
const API_BASE_URL = import.meta.env.VITE_KOVA_API_URL || (isTauri ? 'https://kova-k2nchin.vercel.app/api' : '/api');

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

  const res = await fetch(`${API_BASE_URL}${endpoint}`, config);

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
  createInvite: (serverId: string, options: { expiresInMinutes: number; maxUses: number }) =>
    request<{ code: string; serverId: string; expiresAt: string | null; maxUses: number; url: string }>(`/servers/${encodeURIComponent(serverId)}/invites`, { method: 'POST', data: options }),
  joinServer: (inviteCode: string) => request<any>('/servers/join', { method: 'POST', data: { inviteCode } }),
  deleteServer: (serverId: string) => request<{ ok: boolean }>(`/servers/${encodeURIComponent(serverId)}`, { method: 'DELETE' }),
  updateServer: (serverId: string, data: { name?: string; description?: string; visibility?: 'public' | 'private'; icon?: string; banner?: string }) =>
    request<any>(`/servers/${encodeURIComponent(serverId)}`, { method: 'PATCH', data }),
  getFriends: () => request<any>('/friends', { method: 'GET' }),
  sendFriendRequest: (userId: string) => request<any>('/friends/requests', { method: 'POST', data: { userId } }),
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
  deleteMessage: (messageId: string) => request<any>(`/messages/${messageId}`, { method: 'DELETE' }),

  // Voice
  getVoiceToken: (channelId: string) =>
    request<{ token: string; url: string; room: string }>('/voice/token', { method: 'POST', data: { channelId } }),

  // Kova AI Proxy
  askAI: (prompt: string, context?: any) =>
    request<{ text: string }>('/ai/chat', { method: 'POST', data: { prompt, context } }),
};
