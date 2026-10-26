import type { Attachment, UserActivity } from '../types';

export type { UserActivity };
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
  discoverServers: (query = '', category = 'all') => request<any[]>(`/servers/discover?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`, { method: 'GET' }),
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
  updateServer: (serverId: string, data: { name?: string; description?: string; visibility?: 'public' | 'private'; icon?: string; banner?: string; category?: string }) =>
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
  getBlockedUsers: () => request<{ blockedUserIds: string[]; users?: Array<{ id: string; username: string; displayName: string; avatar: string }> }>('/safety/blocks', { method: 'GET' }),
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
  getMessages: (channelId: string, limit = 50, before?: string) =>
    request<any[]>(`/channels/${channelId}/messages?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`, { method: 'GET' }),
  catchUpChannel: (channelId: string, count: number) =>
    request<{ summary: string; count: number; from: string; to: string }>(`/channels/${encodeURIComponent(channelId)}/catchup`, { method: 'POST', data: { count } }),
  saveMessage: (messageId: string, saved: boolean) =>
    request<{ messageId: string; saved: boolean }>(`/messages/${encodeURIComponent(messageId)}/save`, { method: saved ? 'PUT' : 'DELETE' }),
  getSaved: () => request<Array<{ id: string; content: string; createdAt: string; savedAt: string; channelId: string; channelName: string; serverId: string; serverName: string; author: { id: string; username: string; displayName: string; avatar: string; verified: boolean } }>>('/saved', { method: 'GET' }),
  scheduleMessage: (channelId: string, content: string, sendAt: string) =>
    request<{ id: string; channelId: string; content: string; sendAt: string }>(`/channels/${encodeURIComponent(channelId)}/scheduled`, { method: 'POST', data: { content, sendAt } }),
  getScheduled: () => request<Array<{ id: string; channelId: string; channelName: string; serverId: string; serverName: string; content: string; sendAt: string }>>('/scheduled', { method: 'GET' }),
  cancelScheduled: (id: string) => request<{ ok: true }>(`/scheduled/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  createReminder: (data: { messageId?: string; note?: string; remindAt: string }) => request<{ id: string; remindAt: string }>('/reminders', { method: 'POST', data }),
  getReminders: () => request<Array<{ id: string; note: string; messageId: string | null; channelId: string | null; remindAt: string }>>('/reminders', { method: 'GET' }),
  getDueReminders: () => request<Array<{ id: string; note: string; messageId: string | null; channelId: string | null; serverId: string | null; remindAt: string }>>('/reminders?due=1', { method: 'GET' }),
  cancelReminder: (id: string) => request<{ ok: true }>(`/reminders/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  translateMessages: (lang: string, messageIds: string[]) =>
    request<Record<string, { text: string; same: boolean }>>('/translate', { method: 'POST', data: { lang, messageIds } }),
  markChannelRead: (channelId: string) => request<{ channelId: string; lastReadAt: string }>(`/channels/${encodeURIComponent(channelId)}/read`, { method: 'PUT' }),
  getUnread: () => request<Record<string, { unread: number; mentions: number }>>('/unread', { method: 'GET' }),
  searchMessages: (serverId: string, params: { q?: string; author?: string; channel?: string; hasFile?: boolean }) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.author) query.set('author', params.author);
    if (params.channel) query.set('channel', params.channel);
    if (params.hasFile) query.set('has', 'file');
    return request<Array<{ id: string; channelId: string; channelName: string; content: string; hasAttachments: boolean; createdAt: string; author: { id: string; username: string; displayName: string; avatar: string; verified: boolean } }>>(`/servers/${encodeURIComponent(serverId)}/search?${query}`, { method: 'GET' });
  },
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
  getThread: (messageId: string) => request<any[]>(`/messages/${encodeURIComponent(messageId)}/thread`, { method: 'GET' }),
  replyInThread: (messageId: string, content: string) => request<any>(`/messages/${encodeURIComponent(messageId)}/thread`, { method: 'POST', data: { content } }),
  getNotes: (channelId: string) => request<Array<{ id: string; title: string; content: string; tags: string[]; updatedBy: string; updatedAt: string }>>(`/channels/${encodeURIComponent(channelId)}/notes`, { method: 'GET' }),
  createNote: (channelId: string, data: { title: string; content: string; tags: string[] }) => request<any>(`/channels/${encodeURIComponent(channelId)}/notes`, { method: 'POST', data }),
  updateNote: (noteId: string, data: { title?: string; content?: string; tags?: string[] }) => request<any>(`/notes/${encodeURIComponent(noteId)}`, { method: 'PATCH', data }),
  deleteNote: (noteId: string) => request<{ ok: true }>(`/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' }),
  setCallNotes: (channelId: string, active: boolean) => request<{ ok: true }>(`/voice/${encodeURIComponent(channelId)}/notes`, { method: 'POST', data: { active } }),
  transcribeCallClip: (channelId: string, audio: string, mimeType: string) => request<{ text: string }>(`/voice/${encodeURIComponent(channelId)}/transcribe`, { method: 'POST', data: { audio, mimeType } }),
  summarizeCall: (channelId: string) => request<{ summary: string; messageId: string; lines: number }>(`/voice/${encodeURIComponent(channelId)}/summary`, { method: 'POST', data: {} }),
  getWelcome: (spaceId: string) => request<WelcomeConfig & { completed: boolean }>(`/servers/${encodeURIComponent(spaceId)}/welcome`),
  setWelcome: (spaceId: string, data: WelcomeConfig) => request<WelcomeConfig & { completed: boolean }>(`/servers/${encodeURIComponent(spaceId)}/welcome`, { method: 'PUT', data }),
  completeOnboarding: (spaceId: string, answers: Record<string, string[]>) => request<{ ok: true; roles: string[] }>(`/servers/${encodeURIComponent(spaceId)}/onboarding`, { method: 'POST', data: { answers } }),
  getLeaderboard: (spaceId: string) => request<LeaderboardEntry[]>(`/servers/${encodeURIComponent(spaceId)}/leaderboard`),
  getMemberStats: (spaceId: string, userId: string) => request<MemberStats>(`/servers/${encodeURIComponent(spaceId)}/members/${encodeURIComponent(userId)}/stats`),
  getFollowers: (channelId: string) => request<{ count: number; mine: Array<{ channelId: string; channelName: string; spaceId: string; spaceName: string }> }>(`/channels/${encodeURIComponent(channelId)}/followers`),
  followChannel: (channelId: string, targetChannelId: string, follow: boolean) =>
    request<{ following: boolean }>(`/channels/${encodeURIComponent(channelId)}/follow`, { method: follow ? 'POST' : 'DELETE', data: { targetChannelId } }),
  getForumPosts: (channelId: string, tag?: string) =>
    request<{ tags: string[]; posts: ForumPost[] }>(`/channels/${encodeURIComponent(channelId)}/posts${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`),
  createForumPost: (channelId: string, data: { title: string; content: string; tags: string[] }) =>
    request<ForumPost>(`/channels/${encodeURIComponent(channelId)}/posts`, { method: 'POST', data }),
  setForumTags: (channelId: string, tags: string[]) => request<{ tags: string[] }>(`/channels/${encodeURIComponent(channelId)}/forum-tags`, { method: 'PUT', data: { tags } }),
  createPoll: (channelId: string, data: { question: string; options: string[]; multi?: boolean; durationHours?: number }) =>
    request<{ poll: Poll }>(`/channels/${encodeURIComponent(channelId)}/polls`, { method: 'POST', data }),
  getPoll: (pollId: string) => request<Poll>(`/polls/${encodeURIComponent(pollId)}`),
  votePoll: (pollId: string, optionIds: string[]) => request<Poll>(`/polls/${encodeURIComponent(pollId)}/vote`, { method: 'POST', data: { optionIds } }),
  closePoll: (pollId: string) => request<Poll>(`/polls/${encodeURIComponent(pollId)}/close`, { method: 'POST', data: {} }),
  createExpression: (spaceId: string, data: { kind: 'emoji' | 'sticker'; name: string; url: string }) =>
    request<{ id: string }>(`/servers/${encodeURIComponent(spaceId)}/expressions`, { method: 'POST', data }),
  deleteExpression: (id: string) => request<{ ok: true }>(`/expressions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getChannelAccess: (channelId: string) => request<ChannelAccess>(`/channels/${encodeURIComponent(channelId)}/access`),
  setChannelAccess: (channelId: string, data: ChannelAccess) => request<ChannelAccess>(`/channels/${encodeURIComponent(channelId)}/access`, { method: 'PUT', data }),
  getPushKey: () => request<{ publicKey: string }>('/push/key'),
  subscribePush: (subscription: PushSubscriptionJSON) => request<{ ok: true }>('/push/subscribe', { method: 'POST', data: subscription }),
  unsubscribePush: (endpoint: string) => request<{ ok: true }>('/push/unsubscribe', { method: 'POST', data: { endpoint } }),
  getAuditLog: (spaceId: string, action = '') => request<AuditEntry[]>(`/servers/${encodeURIComponent(spaceId)}/audit${action ? `?action=${encodeURIComponent(action)}` : ''}`),
  getWebhooks: (spaceId: string) => request<WebhookInfo[]>(`/servers/${encodeURIComponent(spaceId)}/webhooks`),
  createWebhook: (spaceId: string, data: { name: string; channelId: string }) => request<WebhookInfo>(`/servers/${encodeURIComponent(spaceId)}/webhooks`, { method: 'POST', data }),
  deleteWebhook: (id: string) => request<{ ok: true }>(`/webhooks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getSpaceTemplate: (spaceId: string) => request<SpaceTemplate | null>(`/servers/${encodeURIComponent(spaceId)}/template`),
  createSpaceTemplate: (spaceId: string) => request<SpaceTemplate>(`/servers/${encodeURIComponent(spaceId)}/template`, { method: 'POST', data: {} }),
  previewTemplate: (code: string) => request<SpaceTemplate>(`/templates/${encodeURIComponent(code)}`),
  useTemplate: (code: string, name: string) => request<{ id: string; name: string }>(`/templates/${encodeURIComponent(code)}/use`, { method: 'POST', data: { name } }),
  getSpaceStats: (spaceId: string) => request<SpaceStats>(`/servers/${encodeURIComponent(spaceId)}/stats`),
  getUserNote: (userId: string) => request<{ note: string }>(`/users/${encodeURIComponent(userId)}/note`),
  setUserNote: (userId: string, note: string) => request<{ note: string }>(`/users/${encodeURIComponent(userId)}/note`, { method: 'PUT', data: { note } }),
  setMyActivity: (data: { kind?: string; name?: string; details?: string; clear?: boolean }) => request<{ activity: UserActivity | null }>('/me/activity', { method: 'PUT', data }),
  setSpaceProfile: (spaceId: string, data: { avatar: string; bio: string; pronouns: string }) => request<{ avatar: string; bio: string; pronouns: string }>(`/servers/${encodeURIComponent(spaceId)}/profile`, { method: 'PUT', data }),
  getGroups: () => request<DmGroup[]>('/groups'),
  createGroup: (name: string, memberIds: string[]) => request<DmGroup>('/groups', { method: 'POST', data: { name, memberIds } }),
  renameGroup: (groupId: string, name: string) => request<DmGroup>(`/groups/${encodeURIComponent(groupId)}`, { method: 'PATCH', data: { name } }),
  addGroupMember: (groupId: string, userId: string) => request<DmGroup>(`/groups/${encodeURIComponent(groupId)}/members`, { method: 'POST', data: { userId } }),
  leaveGroup: (groupId: string) => request<{ ok: true }>(`/groups/${encodeURIComponent(groupId)}/members/me`, { method: 'DELETE' }),
  getGroupMessages: (groupId: string) => request<GroupMessage[]>(`/groups/${encodeURIComponent(groupId)}/messages`),
  sendGroupMessage: (groupId: string, content: string, attachments: Attachment[] = []) => request<GroupMessage>(`/groups/${encodeURIComponent(groupId)}/messages`, { method: 'POST', data: { content, attachments } }),
  ringGroup: (groupId: string) => request<{ ok: true }>(`/groups/${encodeURIComponent(groupId)}/call`, { method: 'POST', data: {} }),
  getCallActivity: (channelId: string) => request<CallActivity | null>(`/voice/${encodeURIComponent(channelId)}/activity`),
  callActivityAction: (channelId: string, data: Record<string, unknown>) => request<CallActivity | null>(`/voice/${encodeURIComponent(channelId)}/activity`, { method: 'POST', data }),
  getSpaceSounds: (spaceId: string) => request<SpaceSound[]>(`/servers/${encodeURIComponent(spaceId)}/sounds`),
  createSpaceSound: (spaceId: string, data: { name: string; emoji: string; url: string; volume?: number }) => request<SpaceSound>(`/servers/${encodeURIComponent(spaceId)}/sounds`, { method: 'POST', data }),
  deleteSpaceSound: (soundId: string) => request<{ ok: true }>(`/sounds/${encodeURIComponent(soundId)}`, { method: 'DELETE' }),
  playRoomSound: (channelId: string, data: { soundId?: string; builtin?: string }) => request<{ ok: true }>(`/voice/${encodeURIComponent(channelId)}/sound`, { method: 'POST', data }),
  getStage: (channelId: string) => request<StageState>(`/stage/${encodeURIComponent(channelId)}`),
  setStageHand: (channelId: string, raised: boolean) => request<StageState>(`/stage/${encodeURIComponent(channelId)}/hand`, { method: 'POST', data: { raised } }),
  setStageSpeaker: (channelId: string, userId: string, speaker: boolean) => request<StageState>(`/stage/${encodeURIComponent(channelId)}/speakers`, { method: 'POST', data: { userId, speaker } }),
  setStageTopic: (channelId: string, topic: string) => request<StageState>(`/stage/${encodeURIComponent(channelId)}/topic`, { method: 'PUT', data: { topic } }),
  getMusic: (channelId: string) => request<MusicState>(`/voice/${encodeURIComponent(channelId)}/music`),
  controlMusic: (channelId: string, data: Record<string, unknown>) => request<MusicState>(`/voice/${encodeURIComponent(channelId)}/music`, { method: 'POST', data }),
  getEvents: (spaceId: string) => request<SpaceEvent[]>(`/spaces/${encodeURIComponent(spaceId)}/events`),
  createEvent: (spaceId: string, data: { title: string; description?: string; startsAt: string; endsAt?: string; channelId?: string }) =>
    request<SpaceEvent>(`/spaces/${encodeURIComponent(spaceId)}/events`, { method: 'POST', data }),
  setEventInterest: (eventId: string, interested: boolean) => request<SpaceEvent>(`/events/${encodeURIComponent(eventId)}/rsvp`, { method: 'POST', data: { interested } }),
  cancelEvent: (eventId: string) => request<{ ok: true }>(`/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' }),
  getAutomod: (spaceId: string) => request<AutomodState>(`/spaces/${encodeURIComponent(spaceId)}/automod`),
  setAutomod: (spaceId: string, enabled: boolean) => request<AutomodState>(`/spaces/${encodeURIComponent(spaceId)}/automod`, { method: 'PATCH', data: { enabled } }),
  getVoiceOccupancy: (serverId: string) =>
    request<Record<string, Array<{ id: string; name: string; avatar: string }>>>(`/servers/${encodeURIComponent(serverId)}/voice`, { method: 'GET' }),
  voiceLeft: (channelId: string) => request<{ ok: true }>('/voice/left', { method: 'POST', data: { channelId } }),
  getVoiceToken: (channelId: string, ring = false) =>
    request<{ token: string; url: string; room: string; canPublish?: boolean }>('/voice/token', { method: 'POST', data: { channelId, ring } }),

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

export type AutomodState = {
  enabled: boolean;
  log: Array<{ id: string; content: string; reason: string; createdAt: string; channelId: string; author: string }>;
};

export type SpaceEvent = {
  id: string; spaceId: string; title: string; description: string; startsAt: string; endsAt?: string;
  channelId?: string; createdBy: string; interested: number; interestedIds: string[]; meInterested: boolean;
};

export type MusicTrack = { id: string; kind: 'youtube' | 'audio'; ref: string; url: string; title: string; addedBy: string };
export type MusicState = {
  channelId: string | null; current: MusicTrack | null; queue: MusicTrack[]; playing: boolean;
  startedAt: string | null; offsetMs: number; serverNow: number; updatedBy?: string;
};

export type ChannelAccess = { private: boolean; viewRoles: string[]; readOnly: boolean; sendRoles: string[] };

export type Poll = {
  id: string; channelId: string; authorId: string; question: string;
  options: Array<{ id: string; label: string; votes: number }>;
  multi: boolean; endsAt?: string; closed: boolean; voters: number; myVotes: string[];
};

export type ForumPost = {
  id: string; channelId: string; title: string; tags: string[]; content: string; createdAt: string;
  pinned: boolean; replies: number; lastActivityAt: string;
  author: { id: string; username: string; displayName: string; avatar: string; status: 'online'; verified?: boolean };
};

export type OnboardingQuestion = { id: string; question: string; multi: boolean; options: Array<{ id: string; label: string; emoji: string; roleIds: string[] }> };
export type WelcomeConfig = { enabled: boolean; message: string; rules: string[]; requireAccept: boolean; questions: OnboardingQuestion[] };
export type LeaderboardEntry = { userId: string; username: string; displayName: string; avatar: string; xp: number; level: number; messages: number };
export type MemberStats = {
  userId: string; xp: number; level: number; messages: number; currentLevelXp: number; nextLevelXp: number; joinedAt?: string;
  badges: Array<{ id: string; label: string; emoji: string }>;
};

type StagePerson = { id: string; name: string; avatar: string };
export type StageState = { channelId: string; topic: string; speakers: StagePerson[]; requests: StagePerson[]; youModerate: boolean; youSpeak: boolean; yourHand: boolean };

export type SpaceSound = { id: string; name: string; emoji: string; url: string; volume: number };

type ActivityBase = { hostId: string; updatedAt: string; names: Record<string, string> };
export type CallActivity =
  | (ActivityBase & { kind: 'tictactoe'; players: [string, string | null]; board: Array<'X' | 'O' | null>; turn: number; winner: 'X' | 'O' | 'draw' | null })
  | (ActivityBase & { kind: 'trivia'; round: number; rounds: number; phase: 'question' | 'reveal' | 'done'; question: { text: string; options: string[] } | null; correct?: number; answered: string[]; answers?: Record<string, number>; scores: Record<string, number> });

type GroupPerson = { id: string; username: string; displayName: string; avatar: string; verified?: boolean };
export type DmGroup = { id: string; name: string; ownerId: string; members: GroupPerson[]; createdAt: string; lastMessage: { content: string; createdAt: string; authorId: string } | null };
export type GroupMessage = { id: string; groupId: string; author: GroupPerson | null; content: string; attachments: Attachment[]; createdAt: string };

export type AuditEntry = { id: string; action: string; target: string; details: string; createdAt: string; actor: { id: string; name: string; avatar: string } };
export type WebhookInfo = { id: string; name: string; avatar: string; channelId: string; createdAt: string; url: string; githubUrl: string };
export type SpaceTemplate = { code: string; name: string; description: string; uses: number; createdAt: string; channels: Array<{ name: string; type: string }>; categories: string[]; roles: Array<{ name: string; color: string }>; hasWelcome: boolean };
export type SpaceStats = {
  totals: { members: number; messages30: number; activeWeek: number; joins30: number; newcomerRetention: number | null };
  days: Array<{ date: string; messages: number; joins: number }>;
  hours: number[];
  topChannels: Array<{ id: string; name: string; messages: number }>;
  deadChannels: Array<{ id: string; name: string; lastMessageAt: string | null }>;
  topMembers: Array<{ id: string; name: string; avatar: string; messages: number }>;
};
