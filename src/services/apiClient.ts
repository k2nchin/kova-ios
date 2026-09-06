// API Client Service for Kova Backend

const API_BASE_URL = import.meta.env.VITE_KOVA_API_URL || 'http://localhost:4000/api';

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
    throw new Error(errorBody.message || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  register: (data: { username: string; email: string; password: string; displayName?: string }) =>
    request<{ user: any; token: string }>('/auth/register', { method: 'POST', data }),

  login: (data: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/login', { method: 'POST', data }),

  loginGoogle: (data: { googleId: string; email: string; displayName: string; avatarUrl?: string }) =>
    request<{ user: any; token: string }>('/auth/google', { method: 'POST', data }),

  getMe: () => request<any>('/auth/me', { method: 'GET' }),

  // Servers
  getServers: () => request<any[]>('/servers', { method: 'GET' }),
  createServer: (data: { name: string; description?: string; iconUrl?: string }) =>
    request<any>('/servers', { method: 'POST', data }),
  joinServer: (serverId: string) => request<any>(`/servers/${serverId}/join`, { method: 'POST' }),

  // Channels
  createChannel: (data: { serverId: string; categoryId?: string; name: string; type: string; topic?: string }) =>
    request<any>('/channels', { method: 'POST', data }),
  deleteChannel: (channelId: string) => request<any>(`/channels/${channelId}`, { method: 'DELETE' }),

  // Messages
  getMessages: (channelId: string, limit = 50) =>
    request<any[]>(`/channels/${channelId}/messages?limit=${limit}`, { method: 'GET' }),
  sendMessage: (channelId: string, data: { content: string; replyToId?: string }) =>
    request<any>(`/channels/${channelId}/messages`, { method: 'POST', data }),
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
