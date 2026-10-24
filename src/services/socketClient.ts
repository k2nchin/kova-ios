// Socket.IO Realtime Client for Kova

import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './apiClient';

const SOCKET_URL = import.meta.env.VITE_KOVA_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');
const SOCKET_CONFIGURED = Boolean(import.meta.env.VITE_KOVA_SOCKET_URL);

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = getAuthToken();
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
      reconnectionDelay: 800,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.5,
      timeout: 12000,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      forceNew: false,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!SOCKET_CONFIGURED) return s;
  const token = getAuthToken();
  if (token) {
    s.auth = { token };
  }
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

// Reconnect the socket when the app returns to the foreground or the network
// comes back online. This is critical on mobile where sockets are dropped while
// the app is backgrounded to preserve the real-time presence stream.
export function connectSocketOnResume(): () => void {
  const resume = () => {
    if (!SOCKET_CONFIGURED || !getAuthToken()) return;
    const s = getSocket();
    if (!s.connected) s.connect();
  };
  const onVisibility = () => {
    if (document.visibilityState === 'visible') resume();
  };
  window.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('online', resume);
  return () => {
    window.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('online', resume);
  };
}
