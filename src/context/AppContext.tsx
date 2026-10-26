import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { isVoiceLike } from '../utils/channels';
import {
  Server,
  Channel,
  User,
  Message,
  Thread,
  NoteDocument,
  UserStatus,
  ChannelType,
  ChannelCategory,
  Story,
  DMConversation,
  Role,
  KovaBot,
  Attachment,
  WorkspaceLayoutMode,
} from '../types';
import { DEFAULT_BOTS } from '../data/defaultBots';
import { INITIAL_NOTES, CURRENT_USER } from '../data/defaults';
import { buildSpaceStructure, type SpaceTemplateId } from '../data/spaceTemplates';
import { soundFx } from '../utils/soundEffects';
import { playJoinSound } from '../utils/voiceSounds';
import { systemLanguage, languageName } from '../data/languages';
import { startNativeCapture, type ShareQuality } from '../services/screenCapture';
import { startCallNotes } from '../services/callNotes';
import { refreshPush } from '../services/pushService';
import { BackgroundTheme } from '../components/Themes/ThemeBackground';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  askGemini,
  summarizeConversationWithGemini,
  translateTextWithGemini,
  generateMeetingMinutesWithGemini,
} from '../services/geminiService';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/apiClient';
import { isDesktopApp, isMobileApp } from '../utils/platform';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketClient';
import { connectVoice, type VoicePeer, type VoiceSession } from '../services/voiceClient';
import { showNotification } from '../services/notificationService';

// Stable local fallback for development/offline mode. The real server is the
// source of truth; this mapping only keeps an offline userId immutable between
// sessions and never derives identity from the editable username.
const stableLocalId = (prefix: string, seed: string): string => {
  const key = `kova.identity.${prefix}${seed.trim().toLowerCase()}`;
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const generated = `${prefix}${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
    localStorage.setItem(key, generated);
    return generated;
  } catch {
    return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
};

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface AppPreferences {
  compactMode: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
  noiseSuppression: boolean;
  videoPreview: boolean;
  directMentions: boolean;
  channelActivity: boolean;
  activityStatus: boolean;
  confirmExternalLinks: boolean;
  /** Language messages are translated into. */
  myLanguage: string;
}

export interface AppNotification {
  id: string;
  type: 'stream' | 'bot' | 'mention' | 'role' | 'system' | 'friend';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  channelId?: string;
  actionLabel?: string;
  url?: string;
}

/** `twoFactorRequired` means the password step passed and a 2FA code is now needed. */
export type LoginOutcome = { twoFactorRequired: boolean };

interface AppContextType {
  // Authentication & User Session
  isAuthenticated: boolean;
  loginAsGuest: () => Promise<void>;
  loginWithGoogle: (googleUser?: Partial<User> & { email?: string; googleAccessToken?: string }) => Promise<LoginOutcome>;
  loginWithEmail: (email: string, pass: string) => Promise<LoginOutcome>;
  registerUser: (username: string, email: string, pass: string, displayName?: string) => Promise<void>;
  logout: () => void;
  // Workspace & Servers
  servers: Server[];
  activeServer: Server;
  activeChannel: Channel;
  setActiveServerId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  setUserPresence: (status: UserStatus) => void;
  // Realtime gateway
  realtimeConnected: boolean;
  typingUsers: string[];
  setTyping: (typing: boolean) => void;
  presenceByUser: Record<string, 'online' | 'offline'>;
  // Workspace layout (Pulse hub, split, chat focus...)
  layoutMode: WorkspaceLayoutMode;
  setLayoutMode: (mode: WorkspaceLayoutMode) => void;
  messages: Message[];
  sendMessage: (
    content: string,
    codeBlock?: { language: string; code: string },
    replyId?: string,
    voiceNote?: { duration: number },
    attachments?: Attachment[]
  ) => void;
  addReaction: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
  togglePinMessage: (messageId: string) => void;
  translateMessage: (messageId: string, targetLang?: string) => Promise<void>;
  // Voice Call
  activeVoiceChannelId: string | null;
  isInVoice: boolean;
  joinVoiceChannel: (channelId: string) => Promise<void>;
  voicePeers: VoicePeer[];
  isVoiceConnecting: boolean;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleCamera: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  isCameraPickerOpen: boolean;
  setIsCameraPickerOpen: (open: boolean) => void;
  startCamera: (deviceId?: string) => Promise<boolean>;
  isScreenPickerOpen: boolean;
  setIsScreenPickerOpen: (open: boolean) => void;
  startScreenShare: (sourceId: string, quality: ShareQuality) => Promise<boolean>;
  // Push-to-talk (desktop)
  pushToTalkEnabled: boolean;
  pushToTalkKey: string;
  isPushToTalkHeld: boolean;
  setPushToTalkEnabled: (enabled: boolean) => void;
  setPushToTalkKey: (key: string) => void;
  // Threads & Drawer
  activeThread: Thread | null;
  openThread: (message: Message) => void;
  closeThread: () => void;
  sendThreadMessage: (content: string) => void;
  // AI Assistant & Smart Features
  isKovaAIOpen: boolean;
  setIsKovaAIOpen: (open: boolean) => void;
  aiHistory: AIMessage[];
  isAILoading: boolean;
  askKovaAI: (prompt: string) => Promise<void>;
  summarizeChannel: () => Promise<void>;
  generateMinutesToNotes: () => void;
  // Themes & Sound
  theme: BackgroundTheme;
  setTheme: (theme: BackgroundTheme) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  preferences: AppPreferences;
  updatePreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
  /** Resolves to false (after showing an error) when the server rejected the change. */
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
  // Activities, Soundboard & Arcades
  isArcadeOpen: boolean;
  setIsArcadeOpen: (open: boolean) => void;
  isCodePlaygroundOpen: boolean;
  setIsCodePlaygroundOpen: (open: boolean) => void;
  isSoundboardOpen: boolean;
  setIsSoundboardOpen: (open: boolean) => void;
  // Stories System
  stories: Story[];
  isCreateStoryOpen: boolean;
  setIsCreateStoryOpen: (open: boolean) => void;
  activeStoryIndex: number | null;
  openStoryViewer: (index: number) => void;
  closeStoryViewer: () => void;
  addStory: (mediaUrl?: string, text?: string, backgroundColor?: string, mediaType?: 'image' | 'video') => Promise<void>;
  reactToStory: (storyId: string, emoji: string) => void;
  // Direct Messages & Friends
  isDMViewActive: boolean;
  setIsDMViewActive: (active: boolean) => void;
  activeDMUserId: string | null;
  setActiveDMUserId: (userId: string | null) => void;
  dmConversations: DMConversation[];
  sendDirectMessage: (receiverId: string, content: string) => void;
  friends: User[];
  addFriend: (usernameOrTag: string) => void;
  removeFriend: (userId: string) => void;
  // UI Panels & Modals
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isCreateServerOpen: boolean;
  setIsCreateServerOpen: (open: boolean) => void;
  isCreateChannelOpen: boolean;
  setIsCreateChannelOpen: (open: boolean) => void;
  isCreateCategoryOpen: boolean;
  setIsCreateCategoryOpen: (open: boolean) => void;
  presetChannelType: ChannelType;
  setPresetChannelType: (type: ChannelType) => void;
  presetCategoryId: string | undefined;
  setPresetCategoryId: (catId?: string) => void;
  isInviteModalOpen: boolean;
  setIsInviteModalOpen: (open: boolean) => void;
  inviteServerId: string | null;
  openInviteModal: (serverId?: string) => void;
  pendingFriendRequests: { id: string; username: string; tag: string; timestamp: string; direction?: 'incoming' | 'outgoing'; userId?: string }[];
  sendFriendRequest: (userId: string) => void;
  cancelFriendRequest: (id: string) => void;
  acceptFriendRequest: (id: string) => void;
  isMemberListOpen: boolean;
  setIsMemberListOpen: (open: boolean) => void;
  isPinnedDrawerOpen: boolean;
  setIsPinnedDrawerOpen: (open: boolean) => void;
  // User Profile Popout Modal
  profileModalUser: User | null;
  openUserProfile: (user: User) => void;
  closeUserProfile: () => void;
  // Server/Channel operations
  createServer: (
    name: string,
    description?: string,
    iconUrl?: string,
    template?: SpaceTemplateId,
    visibility?: 'public' | 'private'
  ) => Promise<Server | null>;
  setSpaceNickname: (serverId: string, nickname: string) => Promise<boolean>;
  removeFromSpace: (serverId: string, userId: string, ban?: boolean) => Promise<boolean>;
  callNotesOn: boolean;
  notesTakers: Record<string, string[]>;
  toggleCallNotes: () => Promise<void>;
  summarizeCall: () => Promise<string | null>;
  autoTranslateChannels: Set<string>;
  toggleAutoTranslate: (channelId: string) => void;
  scheduleMessage: (channelId: string, content: string, sendAt: Date) => Promise<boolean>;
  remindMe: (messageId: string, remindAt: Date) => Promise<void>;
  savedMessageIds: Set<string>;
  toggleSaveMessage: (messageId: string) => Promise<void>;
  voiceOccupancy: Record<string, Array<{ id: string; name: string; avatar: string }>>;
  blockedUsers: Array<{ id: string; username: string; displayName: string; avatar: string }>;
  blockedUserIds: Set<string>;
  blockUser: (user: { id: string; username?: string; displayName?: string; avatar?: string }) => Promise<boolean>;
  unblockUser: (userId: string) => Promise<void>;
  unreadByChannel: Record<string, { unread: number; mentions: number }>;
  catchUpByChannel: Record<string, number>;
  dismissCatchUp: (channelId: string) => void;
  markChannelRead: (channelId: string) => void;
  loadOlderMessages: (channelId: string) => Promise<number>;
  connectingVoiceChannelId: string | null;
  refreshServers: () => Promise<void>;
  joinServerByInvite: (inviteCodeOrId: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  createChannel: (name: string, type: ChannelType, categoryId?: string) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  deleteServer: (serverId: string) => void;
  deleteChannel: (channelId: string) => void;
  createCategory: (name: string) => void;
  deleteCategory: (categoryId: string) => void;
  isEditChannelOpen: boolean;
  setIsEditChannelOpen: (open: boolean) => void;
  editingChannelId: string | null;
  setEditingChannelId: (id: string | null) => void;
  isDiscoveryOpen: boolean;
  setIsDiscoveryOpen: (open: boolean) => void;
  joinPublicServer: (serverId: string) => Promise<boolean>;
  editMessage: (messageId: string, newContent: string) => void;
  // Server Settings & Roles
  isServerSettingsOpen: boolean;
  setIsServerSettingsOpen: (open: boolean) => void;
  serverSettingsTab: 'overview' | 'roles' | 'members' | 'automod' | 'expressions' | 'welcome';
  setServerSettingsTab: (tab: 'overview' | 'roles' | 'members' | 'automod' | 'expressions' | 'welcome') => void;
  createRole: (serverId: string, roleData: { name: string; color: string; hoist: boolean; permissions: string[] }) => Promise<Role | null>;
  updateRole: (serverId: string, roleId: string, updates: Partial<Role>) => void;
  deleteRole: (serverId: string, roleId: string) => Promise<void>;
  toggleMemberRole: (serverId: string, memberId: string, roleId: string) => Promise<void>;
  updateServerDetails: (serverId: string, updates: { name?: string; icon?: string; banner?: string; description?: string; visibility?: 'public' | 'private'; category?: string }) => void;
  // Discord MCP & Bot Hub
  // Notes
  notes: NoteDocument[];
  addNote: (title: string, content: string, tags: string[]) => void;
  updateNote: (id: string, title: string, content: string) => void;
  updateUserStatus: (status: UserStatus, customStatus?: string) => void;
  // Bots & App Directory
  bots: KovaBot[];
  isAppDirectoryOpen: boolean;
  setIsAppDirectoryOpen: (open: boolean) => void;
  installBotToServer: (botId: string, serverId: string) => void;
  uninstallBotFromServer: (botId: string, serverId: string) => void;
  createCustomBot: (botData: Omit<KovaBot, 'id' | 'installedServers' | 'verified'>) => Promise<KovaBot>;
  deleteCustomBot: (botId: string) => Promise<void>;
  processBotTriggers: (content: string, channelId: string) => Promise<boolean>;
  // Two-Factor Authentication (2FA)
  isTwoFactorEnabled: boolean;
  twoFactorBackupCodes: string[];
  backupCodesRemaining: number;
  hasPendingTwoFactorLogin: boolean;
  completeTwoFactorLogin: (code: string) => Promise<void>;
  cancelTwoFactorLogin: () => void;
  isTwoFactorSetupOpen: boolean;
  setIsTwoFactorSetupOpen: (open: boolean) => void;
  isTwoFactorBackupOpen: boolean;
  setIsTwoFactorBackupOpen: (open: boolean) => void;
  isTwoFactorDisableOpen: boolean;
  setIsTwoFactorDisableOpen: (open: boolean) => void;
  startTwoFactorSetup: () => Promise<{ secret: string; otpauthUrl: string }>;
  confirmTwoFactorSetup: (code: string) => Promise<string[]>;
  disableTwoFactor: (code: string) => Promise<void>;
  regenerateBackupCodes: (code: string) => Promise<string[]>;
  // Notifications & Live Streams
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  dismissNotification: (id: string) => void;
  isLiveStreamsOpen: boolean;
  setIsLiveStreamsOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mirrors the server's default roles; only used until the space is loaded.
const createDefaultRoles = (serverId: string): Role[] => [
  { id: `role_everyone_${serverId}`, name: '@everyone', color: '#99aab5', hoist: false, permissions: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'ADD_REACTIONS', 'CREATE_INVITE', 'CONNECT_VOICE', 'SPEAK_VOICE', 'STREAM_VIDEO'] },
  { id: `role_owner_${serverId}`, name: 'Creador', color: '#f4f5f7', hoist: true, permissions: ['ADMINISTRATOR'] },
  { id: `role_admin_${serverId}`, name: 'Administrador', color: '#c2c4c8', hoist: true, permissions: ['MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_MESSAGES'] },
  { id: `role_mod_${serverId}`, name: 'Moderador', color: '#a9acb1', hoist: true, permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS', 'MUTE_MEMBERS'] },
];

/** Effective permissions of a person in a space (owner and ADMINISTRATOR get all). */
export const permissionsIn = (server: Server | undefined, userId: string): Set<string> => {
  if (!server) return new Set();
  const all = ['ADMINISTRATOR', 'MANAGE_SERVER', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_MESSAGES', 'CREATE_INVITE'];
  if (server.ownerId === userId) return new Set(all);
  const member = server.members?.find((m) => m.id === userId);
  const roleIds = new Set([`role_everyone_${server.id}`, ...(member?.roles || [])]);
  const perms = new Set((server.roles || []).filter((role) => roleIds.has(role.id)).flatMap((role) => role.permissions || []));
  return perms.has('ADMINISTRATOR') ? new Set(all) : perms;
};

const ensureServerRoles = (serverList: Server[], user: User): Server[] => {
  return serverList.map((s) => {
    const roles = s.roles && s.roles.length > 0 ? s.roles : createDefaultRoles(s.id);
    const ownerRoleId = `role_owner_${s.id}`;
    const channels = Array.isArray(s.channels) ? s.channels : [];
    const categories = Array.isArray(s.categories) ? s.categories : [];

    return {
      ...s,
      roles,
      categories,
      channels,
      members: (s.members && s.members.length > 0 ? s.members : [user]).map((m) =>
        m.id === s.ownerId ? { ...m, roles: m.roles?.length ? m.roles : [ownerRoleId] } : m
      ),
    };
  });
};

const ALLOW_OFFLINE_AUTH = import.meta.env.DEV && import.meta.env.VITE_ALLOW_OFFLINE_AUTH === 'true';

const relativeTime = (iso: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  return `hace ${Math.round(minutes / 60)} h`;
};

const storyFromApi = (item: any, fallbackUser: User): Story => ({
  id: item.id,
  // Other people are built only from what the server sent: never copy the
  // signed-in user's fields (avatar, verified badge…) onto them.
  author: item.author?.id === fallbackUser.id ? fallbackUser : {
    id: item.author?.id,
    userId: item.author?.id,
    username: item.author?.username || 'usuario',
    displayName: item.author?.displayName || item.author?.username || 'Usuario',
    avatar: item.author?.avatar || '',
    tag: item.author?.tag || '0000',
    status: 'online',
    verified: Boolean(item.author?.verified),
  },
  mediaUrl: item.mediaUrl,
  text: item.text,
  backgroundColor: item.backgroundColor,
  createdAt: relativeTime(item.createdAt),
  views: 0,
  likes: Number(item.likes) || 0,
});

export const messageFromApi = (item: any, fallbackUser: User): Message => {
  const author: User = !item.author ? fallbackUser : item.author.id === fallbackUser.id ? { ...fallbackUser } : {
    id: item.author.id,
    userId: item.author.userId || item.author.id,
    username: item.author.username || 'usuario',
    displayName: item.author.displayName || item.author.username || 'Usuario',
    tag: item.author.tag || '0000',
    avatar: item.author.avatar || '',
    status: item.author.status || 'online',
    verified: Boolean(item.author.verified),
  };
  const date = new Date(item.createdAt || Date.now());
  return {
    id: item.id,
    channelId: item.channelId,
    author,
    content: item.content || '',
    timestamp: `Hoy a las ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    edited: Boolean(item.edited),
    pinned: Boolean(item.pinned),
    threadCount: Number(item.threadCount) || 0,
    replyTo: item.replyTo?.id ? { id: item.replyTo.id, authorName: item.replyTo.authorName || '', content: item.replyTo.content || '' } : undefined,
    reactions: Array.isArray(item.reactions) ? item.reactions : [],
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication & Session Persistence
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const session = localStorage.getItem('kova.auth.session');
      return session === 'true' && (ALLOW_OFFLINE_AUTH || Boolean(getAuthToken()));
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedUser = localStorage.getItem('kova.auth.user');
      if (savedUser) return JSON.parse(savedUser);
    } catch {}
    return CURRENT_USER;
  });

  useEffect(() => {
    try {
      localStorage.setItem('kova.auth.user', JSON.stringify(currentUser));
    } catch {}
  }, [currentUser]);

  const setUserPresence = (status: UserStatus) => {
    setCurrentUser((prev) => ({ ...prev, status }));
  };

  // Two-Factor Authentication (2FA): the secret and backup codes live only on the server.
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState<boolean>(() => Boolean(currentUser.twoFactorEnabled));
  // Freshly generated backup codes, kept in memory only so the user can save them once.
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [pendingTwoFactor, setPendingTwoFactor] = useState<{ challenge: string; baseUser: User } | null>(null);

  const [isTwoFactorSetupOpen, setIsTwoFactorSetupOpen] = useState(false);
  const [isTwoFactorBackupOpen, setIsTwoFactorBackupOpen] = useState(false);
  const [isTwoFactorDisableOpen, setIsTwoFactorDisableOpen] = useState(false);

  // Drop the old client-side 2FA material that earlier versions stored in the browser.
  useEffect(() => {
    try {
      ['kova.auth.2fa.enabled', 'kova.auth.2fa.secret', 'kova.auth.2fa.backupCodes'].forEach((key) => localStorage.removeItem(key));
    } catch {}
    setCurrentUser((prev) => {
      if (!prev.twoFactorSecret && !prev.backupCodes) return prev;
      const { twoFactorSecret: _secret, backupCodes: _codes, ...rest } = prev;
      return rest;
    });
  }, []);

  const refreshTwoFactorStatus = async () => {
    if (!getAuthToken()) return;
    try {
      const status = await api.getTwoFactorStatus();
      setIsTwoFactorEnabled(status.enabled);
      setBackupCodesRemaining(status.backupCodesRemaining);
      setCurrentUser((prev) => (prev.twoFactorEnabled === status.enabled ? prev : { ...prev, twoFactorEnabled: status.enabled }));
    } catch (error) {
      console.warn('[Kova 2FA] No se pudo consultar el estado:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) void refreshTwoFactorStatus();
  }, [isAuthenticated]);

  const startTwoFactorSetup = () => api.startTwoFactorSetup();

  const confirmTwoFactorSetup = async (code: string): Promise<string[]> => {
    const { backupCodes } = await api.enableTwoFactor(code);
    setIsTwoFactorEnabled(true);
    setTwoFactorBackupCodes(backupCodes);
    setBackupCodesRemaining(backupCodes.length);
    setCurrentUser((prev) => ({ ...prev, twoFactorEnabled: true }));
    return backupCodes;
  };

  const disableTwoFactor = async (code: string) => {
    await api.disableTwoFactor(code);
    setIsTwoFactorEnabled(false);
    setTwoFactorBackupCodes([]);
    setBackupCodesRemaining(0);
    setCurrentUser((prev) => ({ ...prev, twoFactorEnabled: false }));
  };

  const regenerateBackupCodes = async (code: string): Promise<string[]> => {
    const { backupCodes } = await api.regenerateBackupCodes(code);
    setTwoFactorBackupCodes(backupCodes);
    setBackupCodesRemaining(backupCodes.length);
    return backupCodes;
  };

  const loginAsGuest = async () => {
    if (!isMobileApp()) throw new Error('El modo invitado solo está disponible en la aplicación móvil.');
    const guestId = stableLocalId('guest_', 'android-test');
    const guestNumber = guestId.slice(-4).toUpperCase();
    const user: User = {
      ...CURRENT_USER,
      id: guestId,
      userId: guestId,
      username: `invitado_${guestNumber}`,
      displayName: `Invitado ${guestNumber}`,
      email: '',
      tag: 'GUEST',
      verified: false,
      badges: [],
      roles: [],
      customStatus: 'Sesión de prueba móvil',
    };

    setCurrentUser(user);
    setIsAuthenticated(true);
    connectSocket();
    try {
      localStorage.setItem('kova.auth.session', 'true');
      localStorage.setItem('kova.auth.user', JSON.stringify(user));
      localStorage.setItem('kova.auth.guest', 'true');
    } catch {}
    toast.success(`¡Bienvenido, ${user.displayName}!`);
  };

  const loginWithGoogle = async (googleUser?: Partial<User> & { email?: string; googleAccessToken?: string }) => {
    let user: User = {
      ...currentUser,
      id: googleUser?.id || stableLocalId('google_', googleUser?.email || ''),
      username: googleUser?.username || 'google_user',
      displayName: googleUser?.displayName || 'Usuario de Google',
      avatar:
        googleUser?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      customStatus: 'Conectado con cuenta de Google',
    };

    try {
      if (!googleUser?.googleAccessToken) {
        throw new Error('Google no devolvió una credencial verificable.');
      }
      const res = await api.loginGoogle({
        accessToken: googleUser.googleAccessToken,
        googleId: user.id,
        email: googleUser.email || `${user.username}@gmail.com`,
        displayName: user.displayName,
        avatarUrl: user.avatar,
      });
      if (res?.twoFactorRequired) {
        setPendingTwoFactor({ challenge: res.challenge, baseUser: user });
        return { twoFactorRequired: true };
      }
      if (res?.token && res?.user) {
        setAuthToken(res.token);
        user = {
          ...user,
          id: res.user.id,
          userId: res.user.userId || res.user.id,
          tag: res.user.tag || user.tag,
          email: res.user.email || user.email,
          verified: Boolean(res.user.verified),
        };
      }
    } catch (err) {
      console.warn('[Kova Backend Sync] Modo offline / local para Google Auth:', err);
      if (!ALLOW_OFFLINE_AUTH) {
        throw new Error('No se pudo crear una sesión de Kova con el servidor. Inténtalo de nuevo.');
      }
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    connectSocket();

    setServers((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((s, idx) => {
        if (idx === 0 && (s.id === 'server_default' || s.name === 'Mi Espacio')) {
          return {
            ...s,
            name: `Espacio de ${user.displayName.split(' ')[0]}`,
            acronym: user.displayName.slice(0, 2).toUpperCase(),
            ownerId: user.id,
          };
        }
        return s;
      });
    });
    try {
      localStorage.setItem('kova.auth.session', 'true');
      localStorage.setItem('kova.auth.user', JSON.stringify(user));
    } catch {}
    soundFx.playAISparkle();
    return { twoFactorRequired: false };
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const username = email.split('@')[0] || 'usuario';
    let user: User = {
      ...currentUser,
      id: stableLocalId('user_', email),
      username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      status: 'online',
      customStatus: 'Disponible en Kova',
    };

    try {
      const res = await api.login({ email, password: pass });
      if (res?.twoFactorRequired) {
        setPendingTwoFactor({ challenge: res.challenge, baseUser: { ...user, email } });
        return { twoFactorRequired: true };
      }
      if (res?.token && res?.user) {
        setAuthToken(res.token);
        user = {
          ...user,
          id: res.user.id,
          userId: res.user.userId || res.user.id,
          username: res.user.username,
          displayName: res.user.displayName,
          tag: res.user.tag || user.tag,
          avatar: res.user.avatar || res.user.avatarUrl || user.avatar,
          email: res.user.email || email,
          verified: Boolean(res.user.verified),
        };
        toast.success(`¡Bienvenido de nuevo, ${user.displayName}!`);
      }
    } catch (err: any) {
      console.warn('[Kova Backend Sync] Fallback local para login:', err);
      if (!ALLOW_OFFLINE_AUTH) {
        throw new Error(err?.message || 'No se pudo iniciar sesión con el servidor de Kova.');
      }
      toast.info('Servidor no disponible: sesión local de desarrollo activada');
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    connectSocket();

    setServers((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((s, idx) => {
        if (idx === 0 && (s.id === 'server_default' || s.name === 'Mi Espacio')) {
          return {
            ...s,
            name: `Espacio de ${user.displayName.split(' ')[0]}`,
            acronym: user.displayName.slice(0, 2).toUpperCase(),
            ownerId: user.id,
          };
        }
        return s;
      });
    });
    try {
      localStorage.setItem('kova.auth.session', 'true');
      localStorage.setItem('kova.auth.user', JSON.stringify(user));
    } catch {}
    soundFx.playAISparkle();
    return { twoFactorRequired: false };
  };

  const completeTwoFactorLogin = async (code: string) => {
    if (!pendingTwoFactor) throw Object.assign(new Error('La verificación expiró. Vuelve a iniciar sesión.'), { code: 'CHALLENGE_EXPIRED' });
    let res;
    try {
      res = await api.completeTwoFactorLogin({ challenge: pendingTwoFactor.challenge, code });
    } catch (error) {
      if ((error as { code?: string }).code === 'CHALLENGE_EXPIRED') setPendingTwoFactor(null);
      throw error;
    }
    setAuthToken(res.token);
    const user: User = {
      ...pendingTwoFactor.baseUser,
      id: res.user.id,
      userId: res.user.userId || res.user.id,
      username: res.user.username || pendingTwoFactor.baseUser.username,
      displayName: res.user.displayName || pendingTwoFactor.baseUser.displayName,
      tag: res.user.tag || pendingTwoFactor.baseUser.tag,
      avatar: res.user.avatar || pendingTwoFactor.baseUser.avatar,
      email: res.user.email || pendingTwoFactor.baseUser.email,
      verified: Boolean(res.user.verified),
      twoFactorEnabled: true,
    };
    setPendingTwoFactor(null);
    setBackupCodesRemaining(res.backupCodesRemaining);
    if (res.method === 'backup_code') {
      toast.warning(`Usaste un código de respaldo. Te quedan ${res.backupCodesRemaining}.`);
    }
    setCurrentUser(user);
    setIsAuthenticated(true);
    connectSocket();
    try {
      localStorage.setItem('kova.auth.session', 'true');
      localStorage.setItem('kova.auth.user', JSON.stringify(user));
    } catch {}
    soundFx.playAISparkle();
  };

  const cancelTwoFactorLogin = () => setPendingTwoFactor(null);

  const registerUser = async (username: string, email: string, pass: string, displayName?: string) => {
    let user: User = {
      ...currentUser,
      id: stableLocalId('user_', email),
      username: username.toLowerCase().replace(/\s+/g, '_'),
      displayName: displayName || username,
      status: 'online',
      customStatus: 'Nuevo explorador en Kova',
    };

    try {
      const res = await api.register({
        username: user.username,
        email,
        password: pass,
        displayName: user.displayName,
      });
      if (res?.token && res?.user) {
        setAuthToken(res.token);
        user = {
          ...user,
          id: res.user.id,
          userId: res.user.userId || res.user.id,
          username: res.user.username || user.username,
          displayName: res.user.displayName || user.displayName,
          tag: res.user.tag || user.tag,
          avatar: res.user.avatar || res.user.avatarUrl || user.avatar,
          email: res.user.email || email,
          verified: Boolean(res.user.verified),
        };
        toast.success('¡Cuenta creada y sincronizada con éxito!');
      }
    } catch (err: any) {
      console.warn('[Kova Backend Sync] Fallback local para registro:', err);
      if (!ALLOW_OFFLINE_AUTH) {
        throw new Error(err?.message || 'No se pudo crear la cuenta en el servidor de Kova.');
      }
      toast.info('Servidor no disponible: cuenta local de desarrollo activada');
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    connectSocket();

    setServers((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((s, idx) => {
        if (idx === 0 && (s.id === 'server_default' || s.name === 'Mi Espacio')) {
          return {
            ...s,
            name: `Espacio de ${user.displayName.split(' ')[0]}`,
            acronym: user.displayName.slice(0, 2).toUpperCase(),
            ownerId: user.id,
          };
        }
        return s;
      });
    });
    try {
      localStorage.setItem('kova.auth.session', 'true');
      localStorage.setItem('kova.auth.user', JSON.stringify(user));
    } catch {}
    soundFx.playAISparkle();
  };

  // Notifications & Live Streams state
  // Empty until a real event arrives from the account/server.
  // Declared before any consumer (e.g. logout) to avoid TDZ hazards.
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('kova.notifications.v1');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Live voice session (LiveKit) and who was already in the room.
  const voiceSessionRef = useRef<VoiceSession | null>(null);
  const knownPeerIdsRef = useRef<Set<string>>(new Set());

  const logout = () => {
    void api.logout().catch(() => undefined);
    clearAuthToken();
    disconnectSocket();
    void voiceSessionRef.current?.disconnect();
    voiceSessionRef.current = null;
    knownPeerIdsRef.current = new Set();
    setVoicePeers([]);
    setIsAuthenticated(false);
    setActiveVoiceChannelId(null);
    setCurrentUser(CURRENT_USER);
    setServers([]);
    setAllMessages({});
    setStories([]);
    setFriends([]);
    setDmConversations([]);
    setPendingFriendRequests([]);
    setNotifications([]);
    setNotes(INITIAL_NOTES);
    setAiHistory([
      {
        id: 'ai_msg_0',
        sender: 'ai' as const,
        text: '¡Hola! Soy **Kova AI**. Estoy aquí para ayudarte a resumir canales, traducir mensajes, redactar código y optimizar tu flujo de trabajo en Kova. ¿En qué puedo ayudarte hoy?',
        timestamp: 'Ahora',
      },
    ]);
    try {
      localStorage.setItem('kova.auth.session', 'false');
      localStorage.removeItem('kova.auth.user');
      localStorage.removeItem('kova.stories.v3');
      localStorage.removeItem('kova.friends.v2');
      localStorage.removeItem('kova.dms.v3');
      localStorage.removeItem('kova.pending_friends.v1');
    } catch {}
    soundFx.playLeaveVoice();
  };

  useEffect(() => {
    if (!isAuthenticated || !getAuthToken() || ALLOW_OFFLINE_AUTH) return;
    let cancelled = false;
    api.getMe().then((remoteUser) => {
      if (cancelled || !remoteUser) return;
      // The server is the source of truth for the profile; presence and avatar
      // fall back to what the client already has when the server has none.
      setCurrentUser((previous) => ({
        ...previous,
        ...remoteUser,
        id: remoteUser.id,
        userId: remoteUser.userId || remoteUser.id,
        status: previous.status,
        avatar: remoteUser.avatar || previous.avatar,
        banner: remoteUser.banner || undefined,
        thoughtBubble: remoteUser.thoughtBubble || previous.thoughtBubble,
      }));
    }).catch(() => {
      if (cancelled) return;
      clearAuthToken();
      localStorage.setItem('kova.auth.session', 'false');
      setIsAuthenticated(false);
      toast.error('Tu sesión expiró. Vuelve a iniciar sesión.');
    });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Dynamic Servers with localStorage persistence
  const serverCacheKey = `kova.servers.v12.${currentUser.id}`;
  const [serversCacheReadyForUser, setServersCacheReadyForUser] = useState(currentUser.id);
  const [servers, setServers] = useState<Server[]>(() => {
    try {
      const saved = localStorage.getItem(`kova.servers.v12.${currentUser.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return ensureServerRoles(parsed, currentUser);
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    setServersCacheReadyForUser('');
    try {
      const saved = localStorage.getItem(`kova.servers.v12.${currentUser.id}`);
      const parsed = saved ? JSON.parse(saved) : [];
      setServers(Array.isArray(parsed) ? ensureServerRoles(parsed, currentUser) : []);
    } catch { setServers([]); }
    setServersCacheReadyForUser(currentUser.id);
  }, [currentUser.id]);

  useEffect(() => {
    if (serversCacheReadyForUser !== currentUser.id) return;
    try {
      localStorage.setItem(serverCacheKey, JSON.stringify(servers));
    } catch {}
  }, [servers, serverCacheKey, serversCacheReadyForUser, currentUser.id]);

  const serversRef = useRef(servers);
  useEffect(() => { serversRef.current = servers; }, [servers]);

  // Server copy of every space is the source of truth (channels, roles, members).
  const refreshServers = async () => {
    if (!getAuthToken()) return;
    try {
      const remote = await api.getServers();
      if (!Array.isArray(remote)) return;
      setServers((local) => remote.map((space: any) => {
        const cached = local.find((item) => item.id === space.id);
        return ensureServerRoles([{ ...(cached || {}), ...space } as Server], currentUser)[0];
      }));
      // Let the realtime gateway join rooms for spaces created/joined meanwhile.
      try { getSocket().emit('spaces:refresh'); } catch {}
    } catch (error) {
      console.warn('[Kova spaces sync]', error);
    }
  };
  const refreshServersRef = useRef(refreshServers);
  refreshServersRef.current = refreshServers;

  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) return;
    void refreshServersRef.current();
  }, [isAuthenticated, currentUser.id]);

  // Someone changed a space (channels, roles, members, settings): refetch.
  // Several events in a row collapse into one request.
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    let timer: number | undefined;
    const onChanged = ({ serverId, kind }: { serverId: string; kind: string }) => {
      if (kind === 'deleted' || kind === 'removed') {
        const gone = serversRef.current.find((server) => server.id === serverId);
        if (gone) toast.info(kind === 'deleted' ? `Se borró el espacio ${gone.name}` : `Ya no estás en ${gone.name}`);
        setServers((prev) => prev.filter((server) => server.id !== serverId));
        return;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void refreshServersRef.current(), 300);
    };
    socket.on('space:changed', onChanged);
    return () => { socket.off('space:changed', onChanged); window.clearTimeout(timer); };
  }, [isAuthenticated]);

  const [activeServerId, setActiveServerId] = useState<string>(() => servers[0]?.id || '');
  const [activeChannelId, setActiveChannelId] = useState<string>(() => {
    const general = servers[0]?.channels.find((c) => c.name.includes('general'));
    return general?.id || servers[0]?.channels[0]?.id || '';
  });
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});

  // Spaces arrive from the API after the first render: once they do, point the
  // active space/channel at a real one (otherwise message loading never starts).
  useEffect(() => {
    if (servers.length === 0 || servers.some((server) => server.id === activeServerId)) return;
    const owner = servers.find((server) => server.channels.some((channel) => channel.id === activeChannelId)) || servers[0];
    setActiveServerId(owner.id);
    if (!owner.channels.some((channel) => channel.id === activeChannelId)) {
      const general = owner.channels.find((channel) => !isVoiceLike(channel.type) && channel.name.includes('general')) || owner.channels.find((channel) => !isVoiceLike(channel.type));
      if (general) setActiveChannelId(general.id);
    }
  }, [servers, activeServerId, activeChannelId]);

  // Sincronización en tiempo real vía Socket.IO: mensajes, presencia y "escribiendo…"
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [typingByChannel, setTypingByChannel] = useState<Record<string, Record<string, string>>>({});
  const [presenceByUser, setPresenceByUser] = useState<Record<string, 'online' | 'offline'>>({});

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = connectSocket();

    const updateChannel = (channelId: string, update: (messages: Message[]) => Message[]) =>
      setAllMessages((prev) => (prev[channelId] ? { ...prev, [channelId]: update(prev[channelId]) } : prev));

    const handleMessageCreated = (msg: any) => {
      if (!msg?.channelId || !msg.id) return;
      const incoming = messageFromApi(msg, currentUser);
      setAllMessages((prev) => {
        const channelMsgs = prev[msg.channelId] || [];
        if (channelMsgs.some((m) => m.id === msg.id)) return prev;
        // Our own typed messages are reconciled by the REST response (local_ → persisted id);
        // ones the server creates for us (polls, scheduled, forum posts) arrive only here.
        if (msg.author?.id === currentUser.id && channelMsgs.some((m) => m.id.startsWith('local_') && m.content.trim() === String(msg.content).trim())) return prev;
        return { ...prev, [msg.channelId]: [...channelMsgs, incoming] };
      });
      setTypingByChannel((prev) => {
        if (!prev[msg.channelId]?.[msg.author?.id]) return prev;
        const { [msg.author.id]: _removed, ...rest } = prev[msg.channelId];
        return { ...prev, [msg.channelId]: rest };
      });
    };
    const handleMessageUpdated = (msg: any) => {
      if (!msg?.channelId) return;
      updateChannel(msg.channelId, (messages) => messages.map((m) => {
        if (m.id !== msg.id) return m;
        const next = { ...m };
        if (typeof msg.content === 'string') { next.content = msg.content; next.edited = true; }
        if (typeof msg.pinned === 'boolean') next.pinned = msg.pinned;
        return next;
      }));
    };
    const handleMessageDeleted = (msg: any) => {
      if (!msg?.channelId) return;
      updateChannel(msg.channelId, (messages) => messages.filter((m) => m.id !== msg.id));
    };
    const handleReactions = (update: any) => {
      if (!update?.channelId || !Array.isArray(update.reactions)) return;
      updateChannel(update.channelId, (messages) => messages.map((m) => (m.id === update.messageId ? { ...m, reactions: update.reactions } : m)));
    };
    const handleTyping = (event: any) => {
      if (!event?.channelId || !event.userId || event.userId === currentUser.id) return;
      setTypingByChannel((prev) => {
        const channel = { ...(prev[event.channelId] || {}) };
        if (event.typing) channel[event.userId] = event.displayName || 'Alguien';
        else delete channel[event.userId];
        return { ...prev, [event.channelId]: channel };
      });
    };
    const handlePresence = (event: any) => {
      if (!event?.userId) return;
      setPresenceByUser((prev) => ({ ...prev, [event.userId]: event.status === 'offline' ? 'offline' : 'online' }));
    };
    const handleConnect = () => {
      setRealtimeConnected(true);
      if (activeChannelId) socket.emit('channel:join', { channelId: activeChannelId });
    };
    const handleDisconnect = () => {
      setRealtimeConnected(false);
      setTypingByChannel({});
    };

    const handleNickname = ({ serverId, userId, nickname }: { serverId: string; userId: string; nickname: string }) => {
      setServers((prev) => prev.map((server) => server.id !== serverId ? server : {
        ...server,
        members: (server.members || []).map((member) => member.id === userId ? { ...member, nickname } : member),
      }));
    };
    socket.on('message:created', handleMessageCreated);
    socket.on('message:updated', handleMessageUpdated);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('message:reactions', handleReactions);
    socket.on('channel:typing', handleTyping);
    socket.on('presence:changed', handlePresence);
    socket.on('space:nickname', handleNickname);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    if (socket.connected) setRealtimeConnected(true);

    return () => {
      socket.off('message:created', handleMessageCreated);
      socket.off('message:updated', handleMessageUpdated);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('message:reactions', handleReactions);
      socket.off('channel:typing', handleTyping);
      socket.off('presence:changed', handlePresence);
    socket.off('space:nickname', handleNickname);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [isAuthenticated, activeChannelId, currentUser]);

  // Cambiar de sala en Socket.IO cuando cambia el canal activo
  useEffect(() => {
    if (!activeChannelId) return;
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('channel:join', { channelId: activeChannelId });
    }
  }, [activeChannelId]);

  // Ask which members are online whenever the realtime link (re)connects or the space changes.
  useEffect(() => {
    if (!realtimeConnected) return;
    const memberIds = servers.find((server) => server.id === activeServerId)?.members?.map((member) => member.id) || [];
    if (memberIds.length === 0) return;
    getSocket().emit('presence:query', { userIds: memberIds }, (reply: { online?: string[] }) => {
      const online = new Set(reply?.online || []);
      setPresenceByUser((prev) => {
        const next = { ...prev };
        for (const id of memberIds) next[id] = online.has(id) ? 'online' : 'offline';
        return next;
      });
    });
  }, [realtimeConnected, activeServerId, servers]);

  const setTyping = (typing: boolean) => {
    const socket = getSocket();
    if (socket.connected && activeChannelId) socket.emit('channel:typing', { channelId: activeChannelId, typing });
  };
  const typingUsers = Object.values(typingByChannel[activeChannelId] || {});

  const activeServerKnown = servers.some((server) => server.id === activeServerId);
  // REST polling is the reliable cross-device path on Vercel/serverless. Socket.IO
  // is used only when an actual realtime gateway URL has been configured.
  useEffect(() => {
    if (!isAuthenticated || !getAuthToken() || !activeChannelId || !activeServerKnown) return;
    let cancelled = false;
    const loadMessages = async () => {
      try {
        const remote = await api.getMessages(activeChannelId, 100);
        if (cancelled || !Array.isArray(remote)) return;
        const normalized = remote.map((item: any) => messageFromApi(item, currentUser));
        setAllMessages((previous) => {
          const current = previous[activeChannelId] || [];
          const ids = new Set(normalized.map((message) => message.id));
          // Keep what only exists here (sending, bot/AI answers) and per-device
          // extras such as translations; the server is the truth for the rest.
          const localOnly = current.filter((message) => !message.id.startsWith('message_') && !ids.has(message.id));
          const translations = new Map(current.filter((m) => m.translatedText).map((m) => [m.id, m.translatedText]));
          const merged = normalized.map((message) => (translations.has(message.id) ? { ...message, translatedText: translations.get(message.id) } : message));
          return { ...previous, [activeChannelId]: [...merged, ...localOnly] };
        });
      } catch (error) {
        if (!cancelled) console.warn('[Kova messages sync]', error);
      }
    };
    void loadMessages();
    // With a live socket, polling is only a safety net for missed events.
    const timer = window.setInterval(loadMessages, realtimeConnected ? 30000 : 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [isAuthenticated, activeChannelId, activeServerId, currentUser.id, activeServerKnown, realtimeConnected]);

  // Themes & Sound
  const [theme, setThemeState] = useState<BackgroundTheme>(() => {
    try {
      const saved = localStorage.getItem('kova.theme.v1');
      if (saved && ['oled', 'nebula', 'matrix', 'synthwave', 'crimson', 'abyss', 'emerald', 'amethyst', 'amber'].includes(saved)) {
        return saved as BackgroundTheme;
      }
    } catch {}
    return 'oled';
  });

  const setTheme = (newTheme: BackgroundTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('kova.theme.v1', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      document.body.className = `theme-${newTheme}`;
    } catch {}
    soundFx.playAISparkle();
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = `theme-${theme}`;
  }, [theme]);

  // App Preferences
  const [preferences, setPreferences] = useState<AppPreferences>(() => {
    try {
      const saved = localStorage.getItem('kova.preferences.v1');
      if (saved) {
        return {
          compactMode: false,
          soundEnabled: true,
          reducedMotion: false,
          noiseSuppression: true,
          videoPreview: true,
          directMentions: true,
          channelActivity: true,
          activityStatus: true,
          confirmExternalLinks: true,
          myLanguage: systemLanguage(),
          ...JSON.parse(saved),
        };
      }
    } catch {}
    return {
      compactMode: false,
      soundEnabled: true,
      reducedMotion: false,
      noiseSuppression: true,
      videoPreview: true,
      directMentions: true,
      channelActivity: true,
      activityStatus: true,
      confirmExternalLinks: true,
      myLanguage: systemLanguage(),
    };
  });

  const preferencesRef = useRef(preferences);
  useEffect(() => { preferencesRef.current = preferences; }, [preferences]);
  // Noise suppression also updates the live call's microphone.
  useEffect(() => {
    void voiceSessionRef.current?.setNoiseSuppression(preferences.noiseSuppression).catch(() => undefined);
  }, [preferences.noiseSuppression]);
  const updatePreference = <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('kova.preferences.v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (key === 'soundEnabled') {
      soundFx.setSoundEnabled(value as boolean);
    }
    if (key === 'compactMode') {
      document.documentElement.setAttribute('data-compact', value ? 'true' : 'false');
    }
    if (key === 'reducedMotion') {
      document.documentElement.setAttribute('data-reduced-motion', value ? 'true' : 'false');
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-compact', preferences.compactMode ? 'true' : 'false');
    document.documentElement.setAttribute('data-reduced-motion', preferences.reducedMotion ? 'true' : 'false');
    soundFx.setSoundEnabled(preferences.soundEnabled);
  }, []);

  const setSoundEnabled = (enabled: boolean) => {
    updatePreference('soundEnabled', enabled);
  };

  const soundEnabled = preferences.soundEnabled;

  // Profile fields other people see are saved on the server; the rest (radar
  // position, etc.) stays local. Updates apply optimistically and roll back on error.
  const updateUserProfile = async (updates: Partial<User>) => {
    const previous = currentUser;
    setCurrentUser((prev) => ({ ...prev, ...updates }));
    const serverFields = (['displayName', 'avatar', 'banner', 'bio', 'customStatus', 'thoughtBubble', 'accentColor', 'joinSound'] as const).filter((key) => key in updates);
    if (serverFields.length === 0 || !getAuthToken()) return true;
    try {
      const saved = await api.updateProfile(Object.fromEntries(serverFields.map((key) => [key, updates[key] ?? ''])));
      setCurrentUser((prev) => ({ ...prev, displayName: saved.displayName, avatar: saved.avatar || prev.avatar, banner: saved.banner || undefined, bio: saved.bio, customStatus: saved.customStatus, thoughtBubble: saved.thoughtBubble || prev.thoughtBubble, accentColor: saved.accentColor || '', joinSound: saved.joinSound || '' }));
      return true;
    } catch (error) {
      setCurrentUser(previous);
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el perfil.');
      return false;
    }
  };

  // Voice call state
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);
  const isInVoice = activeVoiceChannelId !== null;
  const [voicePeers, setVoicePeers] = useState<VoicePeer[]>([]);
  const [isVoiceConnecting, setIsVoiceConnecting] = useState(false);
  // Which room we're joining, so the sidebar can show us there immediately.
  const [connectingVoiceChannelId, setConnectingVoiceChannelId] = useState<string | null>(null);

  // Activities, Soundboard & Arcades
  const [isArcadeOpen, setIsArcadeOpen] = useState(false);
  const [isCodePlaygroundOpen, setIsCodePlaygroundOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);

  // User Profile Popout Modal State
  const [profileModalUser, setProfileModalUser] = useState<User | null>(null);
  const openUserProfile = (user: User) => {
    soundFx.playMessageSent();
    setProfileModalUser(user);
  };
  const closeUserProfile = () => {
    setProfileModalUser(null);
  };

  // Stories System State (served by the API; expire after 24h)
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    try {
      ['kova.stories.v1', 'kova.stories.v2', 'kova.stories.v3'].forEach((key) => localStorage.removeItem(key));
    } catch {}
  }, []);

  const loadStories = async () => {
    if (!getAuthToken()) return;
    try {
      const remote = await api.getStories();
      setStories(remote.map((item) => storyFromApi(item, currentUser)));
    } catch (error) {
      console.warn('[Kova stories]', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadStories();
    const timer = window.setInterval(() => void loadStories(), 60_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser.id]);

  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  // Expose helper to window for story viewer navigation
  useEffect(() => {
    (window as unknown as { __setStoryIndex?: (i: number) => void }).__setStoryIndex = (index: number) => {
      setActiveStoryIndex(index);
    };
  }, []);

  const openStoryViewer = (index: number) => {
    setActiveStoryIndex(index);
  };

  const closeStoryViewer = () => {
    setActiveStoryIndex(null);
  };

  const addStory = async (mediaUrl?: string, text?: string, backgroundColor?: string, mediaType?: 'image' | 'video') => {
    const created = await api.createStory({ mediaUrl, mediaType, text, backgroundColor: backgroundColor || 'from-purple-900 via-indigo-900 to-black' });
    setStories((prev) => [storyFromApi({ ...created, author: currentUser }, currentUser), ...prev]);
    soundFx.playAISparkle();
  };

  const reactToStory = (storyId: string, _emoji: string) => {
    void api.toggleStoryLike(storyId)
      .then((result) => setStories((prev) => prev.map((story) => (story.id === storyId ? { ...story, likes: result.likes } : story))))
      .catch((error) => toast.error(error instanceof Error ? error.message : 'No se pudo reaccionar a la historia.'));
  };

  // Friends System State
  const [friends, setFriends] = useState<User[]>(() => {
    try {
      localStorage.removeItem('kova.friends.v1');
      const saved = localStorage.getItem('kova.friends.v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const mockIds = ['user_elena', 'user_alex', 'user_marcus', 'user_sophia', 'user_kai', 'user_luna'];
          return parsed.filter((f: User) => f && !mockIds.includes(f.id));
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('kova.friends.v2', JSON.stringify(friends));
    } catch {}
  }, [friends]);

  const addFriend = (userId: string) => {
    if (!userId.trim()) return;
    void sendFriendRequest(userId);
  };

  const removeFriend = (userId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== userId));
    if (getAuthToken()) void api.removeFriend(userId).then(() => toast.info('Amigo eliminado de tu lista')).catch(async (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar al amigo.');
      await refreshFriends();
    });
    else toast.info('Amigo eliminado de tu lista');
  };

  // Direct Messages (DMs) State
  const [isDMViewActive, setIsDMViewActive] = useState<boolean>(() => servers.length === 0);
  const [activeDMUserId, setActiveDMUserId] = useState<string | null>(null);
  const [dmConversations, setDmConversations] = useState<DMConversation[]>(() => {
    try {
      localStorage.removeItem('kova.dms.v1');
      localStorage.removeItem('kova.dms.v2');
      const saved = localStorage.getItem('kova.dms.v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const mockIds = ['user_elena', 'user_alex', 'user_marcus', 'user_sophia', 'user_kai', 'user_luna'];
          return parsed.filter((dm: DMConversation) => dm && dm.user && !mockIds.includes(dm.user.id));
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('kova.dms.v3', JSON.stringify(dmConversations));
    } catch {}
  }, [dmConversations]);

  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) return;
    let cancelled = false;
    const refreshDMs = async () => {
      try {
        const remote = await api.getDMConversations();
        if (cancelled || !Array.isArray(remote)) return;
        setDmConversations((previous) => remote.map((item) => {
          const prior = previous.find((conversation) => conversation.user.id === item.user.id);
          return {
            id: `dm_${item.user.id}`,
            user: { ...(prior?.user || {}), ...item.user },
            unreadCount: prior?.unreadCount || 0,
            lastMessage: item.lastMessage,
            lastMessageTime: item.lastMessageTime ? new Date(item.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            messages: prior?.messages || [],
          };
        }));
      } catch (error) { if (!cancelled) console.warn('[Kova direct-message list sync]', error); }
    };
    void refreshDMs();
    const timer = window.setInterval(refreshDMs, 6000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [isAuthenticated, currentUser.id]);

  useEffect(() => {
    if (!isAuthenticated || !getAuthToken() || !activeDMUserId) return;
    let cancelled = false;
    void api.getDirectMessages(activeDMUserId, 100).then((remote) => {
      if (cancelled || !Array.isArray(remote)) return;
      setDmConversations((previous) => {
        const conversation = previous.find((item) => item.user.id === activeDMUserId);
        if (!conversation) return previous;
        const messages = remote.map((item: any) => ({
          id: item.id,
          authorId: item.authorId,
          content: item.content,
          timestamp: `Hoy a las ${new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        }));
        return previous.map((item) => item.user.id === activeDMUserId ? { ...item, messages } : item);
      });
    }).catch((error) => { if (!cancelled) toast.error(error instanceof Error ? error.message : 'No se pudo cargar la conversación.'); });
    return () => { cancelled = true; };
  }, [isAuthenticated, activeDMUserId]);

  // Incoming direct messages arrive live; the open conversation updates at
  // once and others get an unread badge.
  const activeDMUserIdRef = useRef(activeDMUserId);
  activeDMUserIdRef.current = activeDMUserId;
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    const onDirectMessage = (payload: { id: string; authorId: string; content: string; createdAt: string; peerIds?: string[] }) => {
      if (payload.authorId === currentUser.id) return; // our own sends are already shown
      const peerId = payload.authorId;
      const isOpen = activeDMUserIdRef.current === peerId;
      const time = new Date(payload.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDmConversations((previous) => {
        const existing = previous.find((item) => item.user.id === peerId);
        if (!existing) return previous; // the 6 s list refresh will add it
        if (existing.messages.some((message) => message.id === payload.id)) return previous;
        return previous.map((item) => item.user.id !== peerId ? item : {
          ...item,
          lastMessage: payload.content,
          lastMessageTime: time,
          unreadCount: isOpen ? 0 : (item.unreadCount || 0) + 1,
          messages: [...item.messages, { id: payload.id, authorId: payload.authorId, content: payload.content, timestamp: `Hoy a las ${time}` }],
        });
      });
      if (!isOpen) soundFx.playMessageSent();
    };
    socket.on('dm:created', onDirectMessage);
    return () => { socket.off('dm:created', onDirectMessage); };
  }, [isAuthenticated, currentUser.id]);

  // Opening a conversation clears its badge.
  useEffect(() => {
    if (!activeDMUserId) return;
    setDmConversations((previous) => previous.some((item) => item.user.id === activeDMUserId && item.unreadCount)
      ? previous.map((item) => item.user.id === activeDMUserId ? { ...item, unreadCount: 0 } : item)
      : previous);
  }, [activeDMUserId]);

  const sendDirectMessage = (receiverId: string, content: string) => {
    if (!content.trim()) return;
    soundFx.playMessageSent();
    const localId = `local_dm_${crypto.randomUUID?.() || Date.now()}`;

    setDmConversations((prev) => {
      const timeStr = 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newDM = {
        id: localId,
        authorId: currentUser.id,
        content: content.trim(),
        timestamp: timeStr,
      };

      const existingIndex = prev.findIndex((c) => c.user.id === receiverId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const conv = updated[existingIndex];
        updated[existingIndex] = {
          ...conv,
          lastMessage: content.trim(),
          lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          messages: [...conv.messages, newDM],
        };
        return updated;
      } else {
        const friend = friends.find((f) => f.id === receiverId);
        const targetUser = friend || {
          id: receiverId,
          username: `user_${receiverId}`,
          displayName: `Usuario`,
          tag: '0000',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          status: 'online' as UserStatus,
        };
        return [
          {
            id: `dm_${receiverId}`,
            user: targetUser,
            unreadCount: 0,
            lastMessage: content.trim(),
            lastMessageTime: 'Ahora',
            messages: [newDM],
          },
          ...prev,
        ];
      }
    });
    if (getAuthToken()) {
      // Replace the optimistic row with the server's canonical message ID.
      void api.sendDirectMessage(receiverId, content.trim()).then((saved) => {
        setDmConversations((previous) => previous.map((conversation) => conversation.user.id === receiverId ? {
          ...conversation,
          messages: conversation.messages.map((message) => message.id.startsWith('local_dm_') && message.authorId === currentUser.id && message.content === content.trim() ? { ...message, id: saved.id, timestamp: `Hoy a las ${new Date(saved.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` } : message),
        } : conversation));
      }).catch((error) => {
        setDmConversations((previous) => previous.map((conversation) => conversation.user.id === receiverId ? { ...conversation, messages: conversation.messages.filter((message) => message.id !== localId) } : conversation));
        toast.error(error instanceof Error ? error.message : 'No se pudo enviar el mensaje directo.');
      });
    }
  };

  // Threads
  const [activeThread, setActiveThread] = useState<Thread | null>(null);

  // Modals & Panels
  const [isKovaAIOpen, setIsKovaAIOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [presetChannelType, setPresetChannelType] = useState<ChannelType>('text');
  const [presetCategoryId, setPresetCategoryId] = useState<string | undefined>(undefined);
  const [isMemberListOpen, setIsMemberListOpen] = useState(true);
  const [isPinnedDrawerOpen, setIsPinnedDrawerOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<WorkspaceLayoutMode>('split');

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteServerId, setInviteServerId] = useState<string | null>(null);

  const openInviteModal = (serverId?: string) => {
    setInviteServerId(serverId || null);
    setIsInviteModalOpen(true);
    soundFx.playJoinVoice();
  };

  // Pending Friend Requests (Discord-style: sending a request does not pretend to add an instant friend)
  const [pendingFriendRequests, setPendingFriendRequests] = useState<{ id: string; username: string; tag: string; timestamp: string; direction?: 'incoming' | 'outgoing'; userId?: string }[]>(() => {
    try {
      const saved = localStorage.getItem('kova.pending_friends.v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('kova.pending_friends.v1', JSON.stringify(pendingFriendRequests));
    } catch {}
  }, [pendingFriendRequests]);

  const refreshFriends = React.useCallback(async () => {
    try {
      const data = await api.getFriends();
      setFriends(Array.isArray(data.friends) ? data.friends : []);
      const incoming = (data.incoming || []).map((r: any) => ({ id: r.id, username: r.user.displayName || r.user.username, tag: r.user.tag || '0000', userId: r.user.id, timestamp: 'Recibida', direction: 'incoming' as const }));
      const outgoing = (data.outgoing || []).map((r: any) => ({ id: r.id, username: r.user.displayName || r.user.username, tag: r.user.tag || '0000', userId: r.user.id, timestamp: 'Enviada', direction: 'outgoing' as const }));
      setPendingFriendRequests((previous) => {
        const knownIncoming = new Set(previous.filter((item) => item.direction === 'incoming').map((item) => item.id));
        const freshIncoming = incoming.filter((item: { id: string }) => !knownIncoming.has(item.id));
        if (freshIncoming.length) {
          setNotifications((current) => [
            ...freshIncoming.map((request: { id: string; username: string }) => ({
              id: `friend_${request.id}`,
              type: 'friend' as const,
              title: 'Nueva solicitud de amistad',
              description: `${request.username} quiere agregarte en Kova.`,
              timestamp: 'Ahora',
              read: false,
            })),
            ...current.filter((notification) => !freshIncoming.some((request: { id: string }) => notification.id === `friend_${request.id}`)),
          ]);
          freshIncoming.forEach((request: { username: string }) => {
            toast.info(`${request.username} te envió una solicitud de amistad`);
            void showNotification('Nueva solicitud de amistad', `${request.username} quiere agregarte en Kova.`);
          });
        }
        return [...incoming, ...outgoing];
      });
    } catch (error) {
      console.warn('[Kova friends sync]', error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshFriends();
    const timer = window.setInterval(refreshFriends, 6000);
    const refreshOnReturn = () => { if (document.visibilityState === 'visible') void refreshFriends(); };
    window.addEventListener('focus', refreshFriends);
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshFriends);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [isAuthenticated, refreshFriends]);

  const sendFriendRequest = async (userId: string) => {
    const clean = userId.trim();
    if (!clean) return;
    try {
      const result = await api.sendFriendRequest(clean);
      const name = result.user.displayName || result.user.username;
      if (result.accepted) {
        // They had already asked us: it's a friendship now.
        await refreshFriends();
        soundFx.playJoinVoice();
        toast.success(`Ahora tú y ${name} son amigos`);
        return;
      }
      setPendingFriendRequests((prev) => [{ id: result.id, username: name, tag: result.user.tag || '0000', userId: result.user.id, timestamp: 'Ahora', direction: 'outgoing' }, ...prev]);
      soundFx.playAISparkle();
      toast.success(`Solicitud enviada a ${name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.');
    }
  };

  const cancelFriendRequest = async (id: string) => {
    try {
      await api.deleteFriendRequest(id);
      setPendingFriendRequests((prev) => prev.filter((r) => r.id !== id));
      toast.info('Solicitud eliminada');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la solicitud.'); }
  };

  // ---- Who is in each voice room (seen from outside) ----
  const [voiceOccupancy, setVoiceOccupancy] = useState<Record<string, Array<{ id: string; name: string; avatar: string }>>>({});
  useEffect(() => {
    if (!isAuthenticated || !getAuthToken() || !activeServerId) { setVoiceOccupancy({}); return; }
    let cancelled = false;
    const load = () => api.getVoiceOccupancy(activeServerId).then((rooms) => { if (!cancelled) setVoiceOccupancy(rooms); }).catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 20_000);
    const socket = getSocket();
    let again: number | undefined;
    const onVoice = ({ serverId }: { serverId: string }) => {
      if (serverId !== activeServerId) return;
      void load();
      window.clearTimeout(again);
      again = window.setTimeout(load, 3000); // LiveKit lists a newcomer a moment later
    };
    socket.on('voice:changed', onVoice);
    return () => { cancelled = true; window.clearInterval(timer); window.clearTimeout(again); socket.off('voice:changed', onVoice); };
  }, [isAuthenticated, activeServerId]);

  // ---- Saved messages (personal bookmarks) ----
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) { setSavedMessageIds(new Set()); return; }
    api.getSaved().then((items) => setSavedMessageIds(new Set(items.map((item) => item.id)))).catch(() => undefined);
  }, [isAuthenticated, currentUser.id]);
  const toggleSaveMessage = async (messageId: string) => {
    if (!messageId.startsWith('message_')) { toast.error('Espera a que el mensaje se envíe para guardarlo.'); return; }
    const saved = !savedMessageIds.has(messageId);
    const apply = (value: boolean) => setSavedMessageIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(messageId); else next.delete(messageId);
      return next;
    });
    apply(saved);
    try {
      await api.saveMessage(messageId, saved);
      toast.success(saved ? 'Mensaje guardado' : 'Quitado de guardados');
    } catch (error) {
      apply(!saved);
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el mensaje.');
    }
  };

  // ---- Scheduled messages & reminders ----
  const scheduleMessage = async (channelId: string, content: string, sendAt: Date) => {
    try {
      await api.scheduleMessage(channelId, content, sendAt.toISOString());
      toast.success(`Programado para ${sendAt.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo programar el mensaje.');
      return false;
    }
  };
  const remindMe = async (messageId: string, remindAt: Date) => {
    try {
      await api.createReminder({ messageId, remindAt: remindAt.toISOString() });
      toast.success(`Te lo recordaré ${remindAt.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el recordatorio.');
    }
  };
  // Reminders: live while Kova is open, and the ones you missed when you come back.
  const shownReminders = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) return;
    const show = (reminder: { id: string; note: string; channelId: string | null; serverId?: string | null }) => {
      if (shownReminders.current.has(reminder.id)) return;
      shownReminders.current.add(reminder.id);
      soundFx.playReactionAdded();
      toast('⏰ Recordatorio', {
        description: reminder.note || 'Tienes un recordatorio.',
        duration: 15_000,
        action: reminder.channelId ? { label: 'Ver', onClick: () => {
          if (reminder.serverId) setActiveServerId(reminder.serverId);
          setIsDMViewActive(false);
          setActiveChannelId(reminder.channelId!);
        } } : undefined,
      });
      if (!document.hasFocus()) void showNotification('⏰ Recordatorio de Kova', reminder.note || 'Tienes un recordatorio.');
    };
    const loadDue = () => api.getDueReminders().then((items) => items.forEach(show)).catch(() => undefined);
    void loadDue();
    const socket = getSocket();
    const onDue = (reminder: { id: string; note: string; channelId: string | null; serverId: string | null }) => {
      show(reminder);
      void api.getDueReminders().catch(() => undefined); // marks it as seen
    };
    socket.on('reminder:due', onDue);
    const onEvent = (event: { id: string; title: string; startsAt: string; serverId: string; channelId?: string }) => {
      soundFx.playReactionAdded();
      const minutes = Math.max(0, Math.round((Date.parse(event.startsAt) - Date.now()) / 60_000));
      const when = minutes > 0 ? `Empieza en ${minutes} min` : 'Empieza ahora';
      toast(`📅 ${event.title}`, {
        description: when,
        duration: 20_000,
        action: { label: 'Ir', onClick: () => {
          setActiveServerId(event.serverId);
          setIsDMViewActive(false);
          if (event.channelId) setActiveChannelId(event.channelId);
        } },
      });
      if (!document.hasFocus()) void showNotification(`📅 ${event.title}`, when);
    };
    socket.on('event:starting', onEvent);
    const onLevel = ({ spaceId, level }: { spaceId: string; level: number }) => {
      const space = serversRef.current.find((item) => item.id === spaceId);
      soundFx.playReactionAdded();
      toast.success(`🎉 ¡Subiste a nivel ${level}${space ? ` en ${space.name}` : ''}!`);
    };
    socket.on('level:up', onLevel);
    const onFocus = () => { void loadDue(); };
    window.addEventListener('focus', onFocus);
    return () => { socket.off('reminder:due', onDue); socket.off('event:starting', onEvent); socket.off('level:up', onLevel); window.removeEventListener('focus', onFocus); };
  }, [isAuthenticated, currentUser.id]);

  // Push notifications: keep this device's subscription fresh and open the
  // space/channel/DM a notification points to (?space=…&channel=… or ?dm=…).
  useEffect(() => { if (isAuthenticated) void refreshPush(); }, [isAuthenticated]);
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || deepLinkHandled.current || servers.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const space = params.get('space');
    const channel = params.get('channel');
    const dm = params.get('dm');
    if (!space && !dm) return;
    deepLinkHandled.current = true;
    if (dm) { setIsDMViewActive(true); setActiveDMUserId(dm); }
    else if (space && servers.some((server) => server.id === space)) {
      setActiveServerId(space);
      setIsDMViewActive(false);
      if (channel) setActiveChannelId(channel);
    }
    window.history.replaceState(null, '', window.location.pathname);
  }, [isAuthenticated, servers]);

  // Soundboard: sounds anyone plays in your voice room are heard by everyone in it.
  const voiceRoomRef = useRef<{ channelId: string | null; deafened: boolean }>({ channelId: null, deafened: false });
  voiceRoomRef.current = { channelId: activeVoiceChannelId, deafened: Boolean(currentUser.isDeafened) };
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    const onSound = (event: { channelId: string; builtin?: string; sound?: { url: string; volume: number } }) => {
      const room = voiceRoomRef.current;
      if (event.channelId !== room.channelId || room.deafened) return;
      if (event.builtin) { soundFx.playSoundboardFx(event.builtin as Parameters<typeof soundFx.playSoundboardFx>[0]); return; }
      if (event.sound) {
        const audio = new Audio(event.sound.url);
        audio.volume = Math.min(1, Math.max(0, event.sound.volume * 0.8));
        void audio.play().catch(() => undefined);
      }
    };
    socket.on('voice:sound', onSound);
    return () => { socket.off('voice:sound', onSound); };
  }, [isAuthenticated]);

  // ---- Call notes (opt-in transcription of your own voice) ----
  const [callNotesOn, setCallNotesOn] = useState(false);
  const [notesTakers, setNotesTakers] = useState<Record<string, string[]>>({});
  const stopCallNotesRef = useRef<(() => void) | null>(null);
  const stopCallNotes = (channelId?: string | null) => {
    stopCallNotesRef.current?.();
    stopCallNotesRef.current = null;
    setCallNotesOn(false);
    if (channelId && getAuthToken()) void api.setCallNotes(channelId, false).catch(() => undefined);
  };
  const toggleCallNotes = async () => {
    const channelId = activeVoiceChannelId;
    if (!channelId) { toast.error('Entra a una sala de voz para tomar notas.'); return; }
    if (callNotesOn) { stopCallNotes(channelId); toast.success('Notas de la llamada desactivadas'); return; }
    try {
      stopCallNotesRef.current = await startCallNotes(channelId, (message) => toast.error(message));
      setCallNotesOn(true);
      void api.setCallNotes(channelId, true).catch(() => undefined);
      toast.success('Notas activadas: Kova IA transcribe solo tu voz. Todos en la sala lo ven.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron activar las notas.');
    }
  };
  const summarizeCall = async () => {
    if (!activeVoiceChannelId) return null;
    try {
      const result = await api.summarizeCall(activeVoiceChannelId);
      toast.success('Resumen publicado en el chat de la sala');
      return result.summary;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo resumir la llamada.');
      return null;
    }
  };
  // Who is taking notes in each room (everyone sees it).
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    const onNotes = ({ channelId, userId, active }: { channelId: string; userId: string; active: boolean }) =>
      setNotesTakers((prev) => {
        const current = new Set(prev[channelId] || []);
        if (active) current.add(userId); else current.delete(userId);
        return { ...prev, [channelId]: [...current] };
      });
    socket.on('voice:notes', onNotes);
    return () => { socket.off('voice:notes', onNotes); };
  }, [isAuthenticated]);

  // ---- Blocked people ----
  const [blockedUsers, setBlockedUsers] = useState<Array<{ id: string; username: string; displayName: string; avatar: string }>>([]);
  const blockedUserIds = React.useMemo(() => new Set(blockedUsers.map((user) => user.id)), [blockedUsers]);
  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) { setBlockedUsers([]); return; }
    api.getBlockedUsers().then((data) => setBlockedUsers(data.users || data.blockedUserIds.map((id) => ({ id, username: '', displayName: 'Cuenta bloqueada', avatar: '' })))).catch(() => undefined);
  }, [isAuthenticated, currentUser.id]);

  const blockUser = async (user: { id: string; username?: string; displayName?: string; avatar?: string }) => {
    try {
      await api.blockUser(user.id);
      setBlockedUsers((prev) => (prev.some((item) => item.id === user.id) ? prev : [{ id: user.id, username: user.username || '', displayName: user.displayName || user.username || 'Usuario', avatar: user.avatar || '' }, ...prev]));
      setFriends((prev) => prev.filter((friend) => friend.id !== user.id));
      toast.success(`Bloqueaste a ${user.displayName || user.username || 'esta cuenta'}.`);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo bloquear.');
      return false;
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      await api.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((item) => item.id !== userId));
      toast.success('Cuenta desbloqueada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo desbloquear.');
    }
  };

  // ---- Unread counts & @mentions ----
  const [unreadByChannel, setUnreadByChannel] = useState<Record<string, { unread: number; mentions: number }>>({});
  const viewingChannelId = !isDMViewActive ? activeChannelId : '';
  const viewingRef = useRef(viewingChannelId);
  useEffect(() => { viewingRef.current = viewingChannelId; }, [viewingChannelId]);

  // "¿Qué me perdí?": how many messages were new when a busy channel was opened.
  const [catchUpByChannel, setCatchUpByChannel] = useState<Record<string, number>>({});
  const dismissCatchUp = (channelId: string) => setCatchUpByChannel((prev) => {
    if (!(channelId in prev)) return prev;
    const next = { ...prev };
    delete next[channelId];
    return next;
  });

  const markChannelRead = (channelId: string) => {
    if (!channelId) return;
    setUnreadByChannel((prev) => {
      if (!prev[channelId]) return prev;
      const missed = prev[channelId].unread;
      if (missed >= 5) setCatchUpByChannel((current) => ({ ...current, [channelId]: Math.max(current[channelId] || 0, missed) }));
      const next = { ...prev };
      delete next[channelId];
      return next;
    });
    if (getAuthToken()) void api.markChannelRead(channelId).catch(() => undefined);
  };
  const markChannelReadRef = useRef(markChannelRead);
  useEffect(() => { markChannelReadRef.current = markChannelRead; });

  // Load counts at sign-in, when the window comes back, and every couple of minutes.
  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) return;
    const load = () => api.getUnread().then((counts) => {
      const viewing = viewingRef.current;
      setUnreadByChannel(viewing && document.hasFocus() ? Object.fromEntries(Object.entries(counts).filter(([id]) => id !== viewing)) : counts);
    }).catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 120_000);
    const onFocus = () => { void load(); };
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [isAuthenticated, currentUser.id]);

  // Opening a channel (or coming back to the window) reads it.
  useEffect(() => {
    if (!viewingChannelId || !isAuthenticated) return;
    markChannelReadRef.current(viewingChannelId);
    const onFocus = () => markChannelReadRef.current(viewingRef.current);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [viewingChannelId, isAuthenticated]);

  // Live: new messages elsewhere raise badges; @mentions also notify.
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    const onActivity = (event: { channelId: string; spaceId: string; authorId: string; authorName: string; preview: string; mentions: string[] }) => {
      if (event.authorId === currentUser.id) return;
      const mentioned = event.mentions?.includes(currentUser.id);
      const looking = viewingRef.current === event.channelId && document.hasFocus();
      if (looking) { markChannelReadRef.current(event.channelId); return; }
      setUnreadByChannel((prev) => {
        const current = prev[event.channelId] || { unread: 0, mentions: 0 };
        return { ...prev, [event.channelId]: { unread: current.unread + 1, mentions: current.mentions + (mentioned ? 1 : 0) } };
      });
      if (mentioned && preferencesRef.current.directMentions) {
        const space = serversRef.current.find((server) => server.id === event.spaceId);
        const channel = space?.channels.find((item) => item.id === event.channelId);
        const where = channel ? `#${channel.name}${space ? ` · ${space.name}` : ''}` : 'Kova';
        soundFx.playReactionAdded();
        toast(`${event.authorName} te mencionó`, { description: `${where}: ${event.preview}` });
        if (!document.hasFocus()) void showNotification(`${event.authorName} te mencionó en ${where}`, event.preview);
      }
    };
    socket.on('channel:activity', onActivity);
    return () => { socket.off('channel:activity', onActivity); };
  }, [isAuthenticated, currentUser.id]);

  // Older history: prepends up to 50 messages before the oldest loaded one.
  const loadOlderMessages = async (channelId: string) => {
    const loaded = (allMessages[channelId] || []).filter((message) => message.id.startsWith('message_'));
    const oldest = loaded[0];
    if (!oldest) return 0;
    const older = await api.getMessages(channelId, 50, oldest.id);
    if (!Array.isArray(older) || older.length === 0) return 0;
    const normalized = older.map((item: any) => messageFromApi(item, currentUser));
    setAllMessages((prev) => {
      const current = prev[channelId] || [];
      const ids = new Set(current.map((message) => message.id));
      return { ...prev, [channelId]: [...normalized.filter((message) => !ids.has(message.id)), ...current] };
    });
    return normalized.length;
  };

  // Friends' online state (they may share no space with us).
  useEffect(() => {
    if (!realtimeConnected || friends.length === 0) return;
    const friendIds = friends.map((friend) => friend.id);
    getSocket().emit('presence:query', { userIds: friendIds }, (reply: { online?: string[] }) => {
      const online = new Set(reply?.online || []);
      setPresenceByUser((prev) => {
        const next = { ...prev };
        for (const id of friendIds) next[id] = online.has(id) ? 'online' : 'offline';
        return next;
      });
    });
  }, [realtimeConnected, friends]);

  // Friend requests sent, accepted or cancelled by the other person show up live.
  const refreshFriendsRef = useRef(refreshFriends);
  useEffect(() => { refreshFriendsRef.current = refreshFriends; }, [refreshFriends]);
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    const onFriends = () => { void refreshFriendsRef.current(); };
    socket.on('friends:changed', onFriends);
    return () => { socket.off('friends:changed', onFriends); };
  }, [isAuthenticated]);

  const acceptFriendRequest = async (id: string) => {
    try {
      await api.acceptFriendRequest(id);
      await refreshFriends();
      soundFx.playJoinVoice();
      toast.success('Ahora son amigos en Kova');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo aceptar la solicitud.'); }
  };

  // Bots & App Directory state
  // Built-in bots ship with the app; custom bots are stored on the server per space.
  const [bots, setBots] = useState<KovaBot[]>(DEFAULT_BOTS);

  useEffect(() => {
    try {
      localStorage.removeItem('kova.bots.v1');
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) return;
    let cancelled = false;
    api.getBots()
      .then((custom) => {
        if (cancelled) return;
        setBots([...custom.map((bot) => ({ ...bot, tag: bot.tag || 'BOT' }) as KovaBot), ...DEFAULT_BOTS]);
      })
      .catch((error) => console.warn('[Kova bots]', error));
    return () => { cancelled = true; };
  }, [isAuthenticated, currentUser.id]);

  const [isAppDirectoryOpen, setIsAppDirectoryOpen] = useState(false);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLiveStreamsOpen, setIsLiveStreamsOpen] = useState(false);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    try { localStorage.setItem('kova.notifications.v1', JSON.stringify(notifications.slice(0, 100))); } catch {}
  }, [notifications]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Notes state
  const [notes, setNotes] = useState<NoteDocument[]>([]);

  // AI Assistant state
  const [aiHistory, setAiHistory] = useState<AIMessage[]>([
    {
      id: 'ai_msg_0',
      sender: 'ai',
      text: '¡Hola! Soy **Kova AI**. Estoy aquí para ayudarte a resumir canales, traducir mensajes, redactar código y optimizar tu flujo de trabajo en Kova. ¿En qué puedo ayudarte hoy?',
      timestamp: 'Ahora',
    },
  ]);
  const [isAILoading, setIsAILoading] = useState(false);

  // Fallback Channel and Server for empty state safety
  const fallbackChannel: Channel = {
    id: '',
    name: 'general',
    type: 'text',
    topic: '',
  };

  const fallbackServer: Server = {
    id: 'server_default',
    name: 'Sin espacio creado',
    acronym: '—',
    description: 'Crea tu primer espacio para comenzar en Kova.',
    ownerId: currentUser.id,
    themeGradient: 'from-purple-600 via-indigo-600 to-cyan-500',
    categories: [],
    channels: [],
    roles: createDefaultRoles('fallback'),
    members: [{ ...currentUser, roles: ['role_owner_fallback'] }],
  };

  const activeServer: Server =
    servers.find((s) => s.id === activeServerId) || servers[0] || fallbackServer;

  const activeChannel: Channel =
    activeServer.channels.find((c) => c.id === activeChannelId) ||
    activeServer.channels[0] ||
    fallbackChannel;

  const messages: Message[] = allMessages[activeChannel.id] || [];

  // Register Global Hotkeys (Ctrl+K, Ctrl+J)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsKovaAIOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sendMessage = (
    content: string,
    codeBlock?: { language: string; code: string },
    replyId?: string,
    voiceNote?: { duration: number },
    attachments?: Attachment[]
  ) => {
    if (!content.trim() && !codeBlock && !voiceNote && !attachments?.length) return;

    soundFx.playMessageSent();

    let replyInfo;
    if (replyId) {
      const target = messages.find((m) => m.id === replyId);
      if (target) {
        replyInfo = {
          id: target.id,
          authorName: target.author.displayName,
          content: target.content.slice(0, 80),
        };
      }
    }

    const localId = `local_${crypto.randomUUID?.() || Date.now()}`;
    const newMsg: Message = {
      id: localId,
      channelId: activeChannel.id,
      author: currentUser,
      content,
      codeBlock,
      voiceNote,
      attachments,
      timestamp: 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
      replyTo: replyInfo,
    };

    setAllMessages((prev) => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), newMsg],
    }));

    if (getAuthToken()) {
      void api.sendMessage(activeChannel.id, { content, replyToId: replyId, attachments })
        .then((saved) => {
          const persisted = messageFromApi(saved, currentUser);
          setAllMessages((previous) => {
            const list = previous[activeChannel.id] || [];
            // Realtime may have delivered it first: then just drop the local copy.
            if (list.some((message) => message.id === persisted.id)) return { ...previous, [activeChannel.id]: list.filter((message) => message.id !== localId) };
            return { ...previous, [activeChannel.id]: list.map((message) => message.id === localId ? persisted : message) };
          });
        })
        .catch((error) => {
          setAllMessages((previous) => ({ ...previous, [activeChannel.id]: (previous[activeChannel.id] || []).filter((message) => message.id !== localId) }));
          toast.error(error instanceof Error ? error.message : 'No se pudo guardar el mensaje.');
        });
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    soundFx.playReactionAdded();
    setAllMessages((prev) => {
      const channelMsgs = prev[activeChannel.id] || [];
      const updated = channelMsgs.map((msg) => {
        if (msg.id !== messageId) return msg;
        const existingRx = msg.reactions.find((r) => r.emoji === emoji);
        if (existingRx) {
          const hasReacted = existingRx.users.includes(currentUser.id);
          const newUsers = hasReacted
            ? existingRx.users.filter((u) => u !== currentUser.id)
            : [...existingRx.users, currentUser.id];
          const newCount = newUsers.length;

          const newReactions = msg.reactions
            .map((r) => (r.emoji === emoji ? { ...r, count: newCount, users: newUsers } : r))
            .filter((r) => r.count > 0);

          return { ...msg, reactions: newReactions };
        } else {
          return {
            ...msg,
            reactions: [...msg.reactions, { emoji, count: 1, users: [currentUser.id] }],
          };
        }
      });
      return { ...prev, [activeChannel.id]: updated };
    });
    if (getAuthToken()) void api.toggleReaction(messageId, emoji).then((result) => {
      setAllMessages((previous) => ({
        ...previous,
        [activeChannel.id]: (previous[activeChannel.id] || []).map((message) => message.id === messageId ? { ...message, reactions: result.reactions || [] } : message),
      }));
    }).catch((error) => toast.error(error instanceof Error ? error.message : 'No se pudo guardar la reacción.'));
  };

  const deleteMessage = (messageId: string) => {
    setAllMessages((prev) => ({
      ...prev,
      [activeChannel.id]: (prev[activeChannel.id] || []).filter((m) => m.id !== messageId),
    }));
    if (getAuthToken() && !messageId.startsWith('local_')) void api.deleteMessage(messageId).catch(async (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el mensaje.');
      try {
        const remote = await api.getMessages(activeChannel.id, 100);
        setAllMessages((previous) => ({ ...previous, [activeChannel.id]: remote.map((item: any) => messageFromApi(item, currentUser)) }));
      } catch {}
    });
  };

  const togglePinMessage = (messageId: string) => {
    const channelId = activeChannel.id;
    const message = (allMessages[channelId] || []).find((msg) => msg.id === messageId);
    if (!message) return;
    const pinned = !message.pinned;
    const apply = (value: boolean) => setAllMessages((prev) => ({
      ...prev,
      [channelId]: (prev[channelId] || []).map((msg) => (msg.id === messageId ? { ...msg, pinned: value } : msg)),
    }));
    apply(pinned);
    if (!messageId.startsWith('message_')) return; // not on the server yet
    api.pinMessage(messageId, pinned).then(
      () => toast.success(pinned ? 'Mensaje fijado' : 'Mensaje desfijado'),
      (error) => { apply(!pinned); toast.error(error instanceof Error ? error.message : 'No se pudo fijar el mensaje.'); },
    );
  };

  // Voice Controls
  const joinVoiceChannel = async (channelId: string) => {
    setActiveChannelId(channelId);
    setIsDMViewActive(false);
    if (activeVoiceChannelId === channelId || isVoiceConnecting) return;
    setIsVoiceConnecting(true);
    setConnectingVoiceChannelId(channelId);
    try {
      await voiceSessionRef.current?.disconnect();
      voiceSessionRef.current = null;
      knownPeerIdsRef.current = new Set();
      setCurrentUser((prev) => ({ ...prev, isCameraOn: false, isScreenSharing: false }));
      const { token, url, canPublish } = await api.getVoiceToken(channelId);
      // Stage audience joins listening only; moderators invite them up to talk.
      if (canPublish === false) setCurrentUser((prev) => ({ ...prev, isMuted: true }));
      const muted = Boolean(currentUser.isMuted || currentUser.isDeafened || canPublish === false);
      voiceSessionRef.current = await connectVoice({
        url,
        token,
        micEnabled: !muted,
        deafened: Boolean(currentUser.isDeafened),
        noiseSuppression: preferences.noiseSuppression,
        onPeers: (peers) => {
          // Someone new arrived: play their own join sound (or the default chime).
          const known = knownPeerIdsRef.current;
          const arrivals = peers.filter((peer) => !peer.isLocal && !known.has(peer.id));
          knownPeerIdsRef.current = new Set(peers.map((peer) => peer.id));
          if (known.size > 0 || peers.length > 1) {
            arrivals.slice(0, 2).forEach((peer) => {
              const member = serversRef.current.flatMap((server) => server.members || []).find((m) => m.id === peer.id);
              playJoinSound(member?.joinSound);
            });
          }
          setVoicePeers(peers);
        },
        onLocalVideoChange: ({ camera, screen }) => {
          setCurrentUser((prev) => (prev.isCameraOn === camera && prev.isScreenSharing === screen ? prev : { ...prev, isCameraOn: camera, isScreenSharing: screen }));
        },
        onUnexpectedDisconnect: () => {
          voiceSessionRef.current = null;
          knownPeerIdsRef.current = new Set();
          setCurrentUser((prev) => ({ ...prev, isCameraOn: false, isScreenSharing: false }));
          setActiveVoiceChannelId(null);
          toast.error('Se perdió la conexión de voz.');
        },
      });
      setActiveVoiceChannelId(channelId);
      playJoinSound(currentUser.joinSound);
    } catch (error) {
      voiceSessionRef.current = null;
      setVoicePeers([]);
      toast.error(error instanceof Error ? error.message : 'No se pudo conectar al canal de voz.');
    } finally {
      setIsVoiceConnecting(false);
      setConnectingVoiceChannelId(null);
    }
  };

  // Keep the published microphone and remote audio in sync with mute/deafen.
  useEffect(() => {
    const session = voiceSessionRef.current;
    if (!session) return;
    session.setDeafened(Boolean(currentUser.isDeafened));
    void session.setMicrophoneEnabled(!(currentUser.isMuted || currentUser.isDeafened)).catch((error) => {
      console.warn('[Kova voice] No se pudo cambiar el micrófono:', error);
    });
  }, [currentUser.isMuted, currentUser.isDeafened, activeVoiceChannelId]);

  // Leave the LiveKit room when the app unmounts (logout, window close).
  useEffect(() => () => { void voiceSessionRef.current?.disconnect(); }, []);

  const leaveVoiceChannel = () => {
    soundFx.playLeaveVoice();
    if (stopCallNotesRef.current) stopCallNotes(activeVoiceChannelId);
    if (activeVoiceChannelId && getAuthToken()) void api.voiceLeft(activeVoiceChannelId).catch(() => undefined);
    nativeShareRef.current?.stop();
    nativeShareRef.current = null;
    void voiceSessionRef.current?.disconnect();
    voiceSessionRef.current = null;
    knownPeerIdsRef.current = new Set();
    setVoicePeers([]);
    setActiveVoiceChannelId(null);

    // Reset voice media states immediately
    setCurrentUser((prev) => ({
      ...prev,
      isSpeaking: false,
      isScreenSharing: false,
      isCameraOn: false,
    }));

    // Remove user from any connected voice channels across all servers
    setServers((prevServers) =>
      prevServers.map((srv) => ({
        ...srv,
        channels: srv.channels.map((chan) => {
          if (isVoiceLike(chan.type) && chan.connectedUsers?.includes(currentUser.id)) {
            return {
              ...chan,
              connectedUsers: chan.connectedUsers.filter((uId) => uId !== currentUser.id),
            };
          }
          return chan;
        }),
      }))
    );

    // If currently viewing a voice channel, immediately return to a text channel in the server
    const currentServer = servers.find((s) => s.id === activeServerId) || servers[0];
    if (currentServer) {
      const activeChan = currentServer.channels.find((c) => c.id === activeChannelId);
      if (!activeChan || isVoiceLike(activeChan.type)) {
        const textChannel = currentServer.channels.find(
          (c) => c.type === 'text' || c.type === 'announcements'
        ) || currentServer.channels[0];
        if (textChannel) {
          setActiveChannelId(textChannel.id);
        }
      }
    }

    toast.info('Desconectado del canal de voz');
  };

  const toggleMute = () => {
    soundFx.playMuteToggle(!currentUser.isMuted);
    setCurrentUser((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  // --- Push-to-talk (desktop): la tecla global controla el microfono ---
  const [pushToTalkEnabled, setPushToTalkEnabledState] = useState(() => {
    if (typeof window === 'undefined') return false;
    return isDesktopApp() && localStorage.getItem('kova.ptt.enabled') === '1';
  });
  const [pushToTalkKey, setPushToTalkKeyState] = useState(() => {
    if (typeof window === 'undefined') return 'Control+Space';
    return localStorage.getItem('kova.ptt.key') || 'Control+Space';
  });
  const [isPushToTalkHeld, setIsPushToTalkHeld] = useState(false);

  useEffect(() => {
    if (!isDesktopApp()) return;
    let unregisterFn: (() => void) | undefined;
    let disposed = false;
    (async () => {
      try {
        const { register, unregister } = await import('@tauri-apps/plugin-global-shortcut');
        if (disposed) return;
        await unregister(pushToTalkKey).catch(() => undefined);
        if (!pushToTalkEnabled) return;
        await register(pushToTalkKey, (event) => {
          if (event.state === 'Pressed') {
            setIsPushToTalkHeld(true);
            setCurrentUser((prev) => (prev.isMuted ? { ...prev, isMuted: false } : prev));
          } else if (event.state === 'Released') {
            setIsPushToTalkHeld(false);
            setCurrentUser((prev) => (!prev.isMuted ? { ...prev, isMuted: true } : prev));
          }
        });
        unregisterFn = () => {
          void unregister(pushToTalkKey).catch(() => undefined);
        };
      } catch (error) {
        console.warn('[Kova PTT]', error);
      }
    })();
    return () => {
      disposed = true;
      unregisterFn?.();
    };
  }, [pushToTalkEnabled, pushToTalkKey]);

  const setPushToTalkEnabled = (enabled: boolean) => {
    setPushToTalkEnabledState(enabled);
    try {
      localStorage.setItem('kova.ptt.enabled', enabled ? '1' : '0');
    } catch {}
    // PTT activado: el microfono queda cerrado hasta presionar la tecla.
    // PTT desactivado: el microfono vuelve a modo abierto.
    setCurrentUser((prev) => ({ ...prev, isMuted: enabled }));
  };

  const setPushToTalkKey = (key: string) => {
    setPushToTalkKeyState(key);
    try {
      localStorage.setItem('kova.ptt.key', key);
    } catch {}
  };

  const toggleDeafen = () => {
    soundFx.playDeafenToggle(!currentUser.isDeafened);
    setCurrentUser((prev) => ({ ...prev, isDeafened: !prev.isDeafened }));
  };

  // Camera and screen go through LiveKit so everyone in the room sees them.
  // Turning them on opens Kova's own pickers (like Discord), never the browser's.
  const [isCameraPickerOpen, setIsCameraPickerOpen] = useState(false);
  const [isScreenPickerOpen, setIsScreenPickerOpen] = useState(false);
  const nativeShareRef = useRef<{ stop: () => void } | null>(null);

  const stopNativeShare = () => {
    nativeShareRef.current?.stop();
    nativeShareRef.current = null;
  };

  const toggleCamera = async () => {
    const session = voiceSessionRef.current;
    if (!session) { toast.error('Entra a una sala de voz para encender la cámara.'); return; }
    if (!currentUser.isCameraOn) { setIsCameraPickerOpen(true); return; }
    try { await session.setCameraEnabled(false); } catch { /* already off */ }
    setCurrentUser((prev) => ({ ...prev, isCameraOn: false }));
  };

  const startCamera = async (deviceId?: string) => {
    const session = voiceSessionRef.current;
    if (!session) { toast.error('Entra a una sala de voz para encender la cámara.'); return false; }
    try {
      const on = await session.setCameraEnabled(true, deviceId);
      setCurrentUser((prev) => ({ ...prev, isCameraOn: on }));
      return on;
    } catch (error) {
      setCurrentUser((prev) => ({ ...prev, isCameraOn: false }));
      toast.error(/denied|NotAllowed/i.test(String(error)) ? 'Kova no tiene permiso para usar la cámara.' : 'No se pudo encender la cámara.');
      return false;
    }
  };

  const toggleScreenShare = async () => {
    const session = voiceSessionRef.current;
    if (!session) { toast.error('Entra a una sala de voz para compartir pantalla.'); return; }
    if (currentUser.isScreenSharing) {
      if (nativeShareRef.current) {
        stopNativeShare();
        await session.unpublishScreenTrack().catch(() => undefined);
      } else {
        await session.setScreenShareEnabled(false).catch(() => undefined);
      }
      setCurrentUser((prev) => ({ ...prev, isScreenSharing: false }));
      return;
    }
    if (isDesktopApp()) { setIsScreenPickerOpen(true); return; }
    // Web: the browser has its own picker and nothing can replace it there.
    if (!navigator.mediaDevices?.getDisplayMedia) { toast.error('Este dispositivo no permite compartir pantalla.'); return; }
    try {
      const on = await session.setScreenShareEnabled(true);
      setCurrentUser((prev) => ({ ...prev, isScreenSharing: on }));
    } catch (error) {
      setCurrentUser((prev) => ({ ...prev, isScreenSharing: false }));
      if (!/NotAllowed|AbortError|Permission denied/i.test(String(error))) toast.error('No se pudo compartir la pantalla.');
    }
  };

  /** Desktop: share the window/screen chosen in Kova's picker. */
  const startScreenShare = async (sourceId: string, quality: ShareQuality) => {
    const session = voiceSessionRef.current;
    if (!session) return false;
    try {
      stopNativeShare();
      const capture = await startNativeCapture(sourceId, quality, () => {
        nativeShareRef.current = null;
        void session.unpublishScreenTrack().catch(() => undefined);
        setCurrentUser((prev) => ({ ...prev, isScreenSharing: false }));
        toast.info('Se dejó de compartir: la ventana ya no está disponible.');
      });
      nativeShareRef.current = capture;
      await session.publishScreenTrack(capture.track, { maxBitrate: quality.bitrate, maxFramerate: quality.fps });
      setCurrentUser((prev) => ({ ...prev, isScreenSharing: true }));
      return true;
    } catch (error) {
      stopNativeShare();
      toast.error(error instanceof Error ? error.message : 'No se pudo compartir la pantalla.');
      return false;
    }
  };

  // Thread controls
  const threadReplyFromApi = (item: any): Message => ({
    id: item.id,
    channelId: item.channelId,
    author: item.author?.id === currentUser.id ? currentUser : { id: item.author?.id, username: item.author?.username || 'usuario', displayName: item.author?.displayName || item.author?.username || 'Usuario', avatar: item.author?.avatar || '', tag: '0000', status: 'online', verified: Boolean(item.author?.verified) },
    content: item.content,
    timestamp: `Hoy a las ${new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    reactions: [],
  });
  const countParticipants = (messages: Message[]) => new Set(messages.map((message) => message.author.id)).size;
  const setParentThreadCount = (channelId: string, parentId: string, count: number) =>
    setAllMessages((prev) => ({ ...prev, [channelId]: (prev[channelId] || []).map((message) => (message.id === parentId ? { ...message, threadCount: count } : message)) }));

  const openThread = (message: Message) => {
    setActiveThread({
      id: `thread_${message.id}`,
      parentMessageId: message.id,
      channelId: message.channelId,
      title: message.content.length > 40 ? `${message.content.slice(0, 40)}…` : message.content || 'Hilo',
      messages: [message],
      participantCount: 1,
    });
    if (!message.id.startsWith('message_')) return; // not saved yet: nothing to load
    api.getThread(message.id).then((replies) => {
      setActiveThread((prev) => {
        if (!prev || prev.parentMessageId !== message.id) return prev;
        const messages = [message, ...replies.map(threadReplyFromApi)];
        return { ...prev, messages, participantCount: countParticipants(messages) };
      });
    }).catch(() => toast.error('No se pudo cargar el hilo.'));
  };

  const closeThread = () => {
    setActiveThread(null);
  };

  const sendThreadMessage = (content: string) => {
    if (!activeThread || !content.trim()) return;
    const thread = activeThread;
    if (!thread.parentMessageId.startsWith('message_')) { toast.error('Espera a que se envíe el mensaje para responder en su hilo.'); return; }
    soundFx.playMessageSent();
    api.replyInThread(thread.parentMessageId, content.trim()).then((saved) => {
      const reply = threadReplyFromApi(saved);
      setActiveThread((prev) => {
        if (!prev || prev.parentMessageId !== thread.parentMessageId || prev.messages.some((m) => m.id === reply.id)) return prev;
        const messages = [...prev.messages, reply];
        return { ...prev, messages, participantCount: countParticipants(messages) };
      });
      setParentThreadCount(thread.channelId, thread.parentMessageId, Number(saved.threadCount) || 0);
    }).catch((error) => toast.error(error instanceof Error ? error.message : 'No se pudo responder en el hilo.'));
  };

  // Live thread replies from others.
  const activeThreadRef = useRef(activeThread);
  useEffect(() => { activeThreadRef.current = activeThread; }, [activeThread]);
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    const onThread = (payload: any) => {
      setParentThreadCount(payload.channelId, payload.parentId, Number(payload.threadCount) || 0);
      const open = activeThreadRef.current;
      if (!open || open.parentMessageId !== payload.parentId || payload.author?.id === currentUser.id) return;
      const reply = threadReplyFromApi(payload);
      setActiveThread((prev) => {
        if (!prev || prev.messages.some((m) => m.id === reply.id)) return prev;
        const messages = [...prev.messages, reply];
        return { ...prev, messages, participantCount: countParticipants(messages) };
      });
    };
    socket.on('thread:message', onThread);
    return () => { socket.off('thread:message', onThread); };
  }, [isAuthenticated, currentUser.id]);

  // AI Assistant methods powered by Google Gemini
  const askKovaAI = async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsKovaAIOpen(true);
    const userMsg: AIMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: 'Ahora',
    };
    setAiHistory((prev) => [...prev, userMsg]);
    setIsAILoading(true);

    try {
      soundFx.playAISparkle();
      const channelMsgs = allMessages[activeChannel.id] || [];
      const recentFormatted = channelMsgs.slice(-8).map((m) => `${m.author.displayName}: ${m.content}`);
      const reply = await askGemini(prompt, {
        channelName: activeChannel?.name,
        serverName: activeServer?.name,
        recentMessages: recentFormatted,
      });

      const aiMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: 'Ahora',
      };
      setAiHistory((prev) => [...prev, aiMsg]);
      soundFx.playAISparkle();
    } catch (err) {
      console.error('[Kova IA] Error procesando solicitud:', err);
      const aiMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: '✦ **Kova IA**: Ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo en unos momentos.',
        timestamp: 'Ahora',
      };
      setAiHistory((prev) => [...prev, aiMsg]);
    } finally {
      setIsAILoading(false);
    }
  };

  const summarizeChannel = async () => {
    setIsKovaAIOpen(true);
    const channelMsgs = allMessages[activeChannel.id] || [];
    const formatted = channelMsgs.slice(-25).map((m) => ({
      author: m.author.displayName,
      content: m.content,
      timestamp: m.timestamp,
    }));

    setIsAILoading(true);
    const userMsg: AIMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: `Resume la conversación reciente y los puntos clave en #${activeChannel.name}`,
      timestamp: 'Ahora',
    };
    setAiHistory((prev) => [...prev, userMsg]);

    try {
      soundFx.playAISparkle();
      const summary = await summarizeConversationWithGemini(activeChannel.name, formatted);
      const aiMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: summary,
        timestamp: 'Ahora',
      };
      setAiHistory((prev) => [...prev, aiMsg]);
      soundFx.playAISparkle();
    } catch (err) {
      console.error('[Kova AI] Error al resumir canal:', err);
    } finally {
      setIsAILoading(false);
    }
  };

  const generateMinutesToNotes = async () => {
    soundFx.playAISparkle();
    toast.info('Generando minuta ejecutiva con Gemini...');
    const channelMsgs = allMessages[activeChannel.id] || [];
    const formatted = channelMsgs.slice(-30).map((m) => ({
      author: m.author.displayName,
      content: m.content,
    }));
    const memberNames = (activeServer?.members || []).map((m) => m.displayName);

    try {
      const minutes = await generateMeetingMinutesWithGemini(
        activeChannel.name,
        activeServer?.name || 'Kova',
        memberNames,
        formatted
      );
      addNote(minutes.title, minutes.content, ['Minuta', 'Gemini AI', activeChannel.name]);
      toast.success('Minuta creada con Gemini y guardada en Notas');
    } catch (err) {
      console.error('[Kova AI] Error al generar minuta:', err);
      const fallbackTitle = `Minuta Ejecutiva #${activeChannel.name} - ${new Date().toLocaleDateString('es-ES')}`;
      const fallbackContent = `# 📋 Minuta Ejecutiva: #${activeChannel.name}\n**Fecha:** ${new Date().toLocaleString('es-ES')}\n**Participantes:** ${memberNames.join(', ')}\n\n*Nota generada automáticamente.*`;
      addNote(fallbackTitle, fallbackContent, ['Minuta', 'Reunión']);
      toast.warning('Se guardó una plantilla de minuta local.');
    }
  };

  const applyTranslations = (channelId: string, lang: string, results: Record<string, { text: string; same: boolean }>) =>
    setAllMessages((prev) => ({
      ...prev,
      [channelId]: (prev[channelId] || []).map((message) => {
        const found = results[message.id];
        if (!found || found.same) return message;
        return { ...message, translatedText: found.text, translatedLang: lang };
      }),
    }));

  const translateMessage = async (messageId: string, targetLang?: string) => {
    const lang = targetLang || preferences.myLanguage;
    const channelId = activeChannel.id;
    if (!messageId.startsWith('message_')) { toast.error('Espera a que el mensaje se envíe para traducirlo.'); return; }
    try {
      const results = await api.translateMessages(lang, [messageId]);
      if (results[messageId]?.same) { toast.info(`Este mensaje ya está en ${languageName(lang).toLowerCase()}.`); return; }
      applyTranslations(channelId, lang, results);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo traducir el mensaje.');
    }
  };

  // Auto-translate: channels where new messages are translated to your language.
  const [autoTranslateChannels, setAutoTranslateChannels] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('kova.autoTranslate.v1') || '[]')); } catch { return new Set(); }
  });
  const toggleAutoTranslate = (channelId: string) => setAutoTranslateChannels((prev) => {
    const next = new Set(prev);
    if (next.has(channelId)) next.delete(channelId); else next.add(channelId);
    try { localStorage.setItem('kova.autoTranslate.v1', JSON.stringify([...next])); } catch {}
    toast.success(next.has(channelId) ? `Traducción automática al ${languageName(preferences.myLanguage).toLowerCase()} activada` : 'Traducción automática desactivada');
    return next;
  });
  const triedTranslations = useRef<Set<string>>(new Set());
  const autoChannelId = activeChannel?.id && autoTranslateChannels.has(activeChannel.id) ? activeChannel.id : '';
  const channelMessages = autoChannelId ? allMessages[autoChannelId] : undefined;
  useEffect(() => {
    if (!autoChannelId || !channelMessages) return;
    const lang = preferences.myLanguage;
    const pending = channelMessages
      .filter((message) => message.id.startsWith('message_') && message.author.id !== currentUser.id && message.content.trim() && !message.translatedText)
      .map((message) => message.id)
      .filter((id) => !triedTranslations.current.has(`${id}:${lang}`))
      .slice(-60);
    if (!pending.length) return;
    pending.forEach((id) => triedTranslations.current.add(`${id}:${lang}`));
    const timer = window.setTimeout(async () => {
      for (let index = 0; index < pending.length; index += 20) {
        try {
          applyTranslations(autoChannelId, lang, await api.translateMessages(lang, pending.slice(index, index + 20)));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo traducir automáticamente.');
          break;
        }
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [autoChannelId, channelMessages, preferences.myLanguage, currentUser.id]);

  // Bots & App Directory operations
  const installBotToServer = (botId: string, serverId: string) => {
    const targetBot = bots.find((b) => b.id === botId);
    if (!targetBot) return;

    setBots((prev) =>
      prev.map((b) =>
        b.id === botId
          ? {
              ...b,
              installedServers: b.installedServers.includes(serverId)
                ? b.installedServers
                : [...b.installedServers, serverId],
            }
          : b
      )
    );

    const botUser: User = {
      id: `user_${targetBot.id}`,
      username: targetBot.name,
      displayName: targetBot.name,
      avatar: targetBot.avatar,
      tag: 'BOT',
      status: 'online',
      customStatus: targetBot.description.slice(0, 32),
      thoughtBubble: targetBot.prefix ? `Prefijo: ${targetBot.prefix}` : 'Bot Activo',
      bio: targetBot.description,
      roles: ['role_bot'],
    };

    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        const alreadyMember = s.members.some((m) => m.id === botUser.id);
        if (alreadyMember) return s;
        return {
          ...s,
          members: [...s.members, botUser],
        };
      })
    );

    soundFx.playAISparkle();
    toast.success(`¡Bot ${targetBot.name} añadido a ${activeServer.name}!`);
  };

  const uninstallBotFromServer = (botId: string, serverId: string) => {
    const targetBot = bots.find((b) => b.id === botId);
    setBots((prev) =>
      prev.map((b) =>
        b.id === botId
          ? {
              ...b,
              installedServers: b.installedServers.filter((sid) => sid !== serverId),
            }
          : b
      )
    );

    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          members: s.members.filter((m) => m.id !== `user_${botId}`),
        };
      })
    );

    toast.info(`Bot ${targetBot ? targetBot.name : ''} expulsado del servidor`);
  };

  const createCustomBot = async (botData: Omit<KovaBot, 'id' | 'installedServers' | 'verified'>): Promise<KovaBot> => {
    const newBot = (await api.createBot(activeServer.id, botData)) as KovaBot;

    setBots((prev) => [newBot, ...prev]);

    const botUser: User = {
      id: `user_${newBot.id}`,
      username: newBot.name,
      displayName: newBot.name,
      avatar: newBot.avatar,
      tag: 'BOT',
      status: 'online',
      customStatus: newBot.description.slice(0, 32),
      thoughtBubble: newBot.prefix ? `Prefijo: ${newBot.prefix}` : 'Bot Activo',
      bio: newBot.description,
      roles: ['role_bot'],
    };

    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== activeServer.id) return s;
        return {
          ...s,
          members: [...s.members, botUser],
        };
      })
    );

    soundFx.playAISparkle();
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    } catch {}
    toast.success(`¡Bot personalizado "${newBot.name}" creado e instalado!`);
    return newBot;
  };

  const deleteCustomBot = async (botId: string) => {
    try {
      await api.deleteBot(botId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el bot.');
      return;
    }
    setBots((prev) => prev.filter((b) => b.id !== botId));
    setServers((prev) =>
      prev.map((s) => ({
        ...s,
        members: s.members.filter((m) => m.id !== `user_${botId}`),
      }))
    );
    toast.info('Bot eliminado');
  };

  const processBotTriggers = async (content: string, channelId: string): Promise<boolean> => {
    const installedBots = bots.filter((b) => b.installedServers.includes(activeServer.id));
    if (!installedBots.length) return false;

    for (const bot of installedBots) {
      const isMentioned = content.toLowerCase().includes(`@${bot.name.toLowerCase()}`);
      const isPrefix = bot.prefix ? content.trim().startsWith(bot.prefix) : false;
      const matchedAuto = bot.autoResponses?.find((r) =>
        content.toLowerCase().includes(r.trigger.toLowerCase())
      );

      if (!isMentioned && !isPrefix && !matchedAuto) continue;

      let reply = '';

      if (bot.id === 'bot_kova') {
        const lower = content.toLowerCase();
        if (lower.includes('!roles')) {
          const rolesList = (activeServer?.roles || []).map((r) => `• ${r.name}`).join('\n');
          reply = rolesList
            ? `🎭 **Roles de ${activeServer.name}**:\n${rolesList}`
            : `🎭 **${activeServer.name}** todavía no tiene roles configurados.`;
        } else if (lower.includes('!tickets')) {
          reply = `🎫 **Sistema de Tickets de Soporte**:\nTu solicitud ha sido registrada. El equipo de moderación de ${activeServer.name} te atenderá a la brevedad.`;
        } else if (lower.includes('!partida')) {
          const juego = content.replace(/!partida/i, '').trim() || 'juegos competitivos';
          reply = `🎯 **Gamer Squad Convocatoria**:\n¡Se buscan compañeros para jugar **${juego}**! Únete a una sala de voz o responde en este canal.`;
        } else if (lower.includes('!vip')) {
          reply = '💎 **Ventajas de VIP PASS**:\n1. Acceso a canales privados para miembros VIP.\n2. Insignia dorada exclusiva en tu perfil.\n3. Prioridad en salas de voz y llamadas.';
        } else if (lower.includes('!bot')) {
          reply = '🤖 **Estado de Kova Bot**:\n• 🟢 **Estado**: En línea y operativo\n• ⚡ **Respuesta**: En tiempo real\n• 👥 **Comunidad**: Listo para ayudarte';
        } else if (lower.includes('!ayuda') || lower.includes('!help')) {
          reply = '📜 **Comandos de Kova Bot**:\n• `!roles` - Roles del servidor\n• `!tickets` - Abrir ticket de soporte\n• `!partida <juego>` - Convocar escuadra\n• `!vip` - Beneficios VIP Pass\n• `!bot` - Estado del bot\n• `@Kova Bot [pregunta]` - Asistente IA en el chat';
        } else if (isMentioned) {
          const query = content.replace(new RegExp(`@${bot.name}`, 'gi'), '').trim();
          if (!query) {
            reply = `⚡ **Kova Bot**: ¡Hola! Soy el asistente de ${activeServer.name}. Usa \`!ayuda\` para ver mis comandos o pregúntame lo que necesites.`;
          } else {
            try {
              const prompt = `Eres Kova Bot, un agente nativo de Kova. Responde con personalidad cercana, útil y directa. Organiza la respuesta en bloques breves, ofrece un siguiente paso práctico y evita mencionar Discord. Usa Markdown limpio.\n\nPregunta: ${query}`;
              const aiResponse = await askGemini(prompt);
              reply = aiResponse;
            } catch {
              reply = `⚡ **Kova Bot**: No pude procesar tu consulta ahora mismo. Inténtalo de nuevo en unos segundos.`;
            }
          }
        } else if (matchedAuto) {
          reply = matchedAuto.response;
        } else {
          reply = `🤖 **Kova Bot**: Comando no reconocido. Escribe \`!ayuda\` para ver la lista completa de comandos.`;
        }
      } else if (matchedAuto) {
        reply = matchedAuto.response;
      } else if (bot.id === 'bot_lofi') {
        reply = '🎧 **Kova Lofi**: La música en las salas de voz todavía no está disponible en Kova. Mientras tanto puedes usar los sonidos de la sala.';
      } else if (bot.id === 'bot_sentinel') {
        if (content.includes('!level') || content.includes('!rank')) {
          const mine = (allMessages[channelId] || []).filter((message) => message.author.id === currentUser.id).length;
          reply = `🏆 **Kova Sentinel**: Has escrito **${mine}** mensajes recientes en este canal. Los niveles y la experiencia todavía no existen en Kova.`;
        } else if (content.includes('!clear') || content.includes('!clean') || content.includes('!warn')) {
          reply = '🛡️ **Kova Sentinel**: Para moderar usa el menú de cada mensaje (borrar) o Ajustes del espacio → Miembros (expulsar o vetar). Necesitas los permisos de moderación.';
        } else {
          reply = '🛡️ **Kova Sentinel**: Usa `!level` para ver tu actividad en este canal.';
        }
      } else if (bot.id === 'bot_memes') {
        if (content.includes('!meme')) {
          const memes = [
            '🤣 **Kova Memes**: *Cuando el código compila sin ningún error a la primera...*\n*( ͡° ͜ʖ ͡°) Algo anda muy mal, revisa el git status.*',
            '🤣 **Kova Memes**: *Yo a las 3 AM:* "Voy a cambiar solo un color de CSS".\n*5 horas después:* 14 dependencias actualizadas y reescribí el backend.',
            '🤣 **Kova Memes**: *El cliente:* "¿Pueden hacer que la IA haga todo sola para el viernes?"\n*El dev senior:* `git push --force origin main` y a rezar.',
          ];
          reply = memes[Math.floor(Math.random() * memes.length)];
        } else if (content.includes('!coin') || content.includes('!flip')) {
          reply = `🪙 **Kova Memes**: Lanzando la moneda al aire... ¡Salió **${Math.random() > 0.5 ? 'CARA 🌕' : 'CRUZ 🌑'}**!`;
        } else {
          reply = '🤣 **Kova Memes**: ¡Comandos disponibles: `!meme` y `!coin`!';
        }
      } else if (bot.id === 'bot_stats') {
        const onlineNow = activeServer.members.filter((member) => presenceByUser[member.id] === 'online').length;
        reply = `📊 **Estadísticas de ${activeServer.name}**:\n• 👥 **Miembros**: ${activeServer.members.length}${onlineNow ? ` (${onlineNow} en línea)` : ''}\n• 💬 **Canales**: ${activeServer.channels.filter((c) => !isVoiceLike(c.type)).length} de texto y ${activeServer.channels.filter((c) => isVoiceLike(c.type)).length} de voz\n• 🛡️ **Roles**: ${activeServer.roles.length}`;
      } else if (bot.id === 'bot_gemini' || bot.systemPrompt) {
        const query = content.replace(bot.prefix || '', '').replace(`@${bot.name}`, '').trim();
        if (!query) {
          reply = `✨ **${bot.name}**: ¡Hola! Puedes interactuar conmigo escribiendo con mi prefijo \`${bot.prefix}\` o mencionándome con \`@${bot.name}\`.`;
        } else {
          try {
            const prompt = bot.systemPrompt
              ? `[INSTRUCCIÓN DE SISTEMA / PERSONALIDAD: ${bot.systemPrompt}]\n\nEstás en el servidor "${activeServer.name}" de Kova. Responde al siguiente mensaje del usuario de acuerdo a tu personalidad de manera concisa y formateada con Markdown:\n\nUsuario: ${query}`
              : `Eres Kova IA, el asistente inteligente oficial en el servidor "${activeServer.name}". Responde de forma clara, concisa y útil al siguiente mensaje:\n\nUsuario: ${query}`;
            const aiResponse = await askGemini(prompt);
            reply = aiResponse;
          } catch {
            reply = `✨ **${bot.name}**: He recibido tu mensaje: "${query}". Sistemas activos.`;
          }
        }
      } else {
        reply = `🤖 **${bot.name}**: Recibí tu comando con prefijo \`${bot.prefix}\`. ¡Estoy activo en el servidor!`;
      }

      if (reply) {
        setTimeout(() => {
          const botMessage: Message = {
            id: `msg_bot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            channelId,
            author: {
              id: bot.id === 'bot_kova' ? 'bot_kova' : `user_${bot.id}`,
              username: bot.username || bot.name,
              displayName: bot.name,
              avatar: bot.avatar,
              tag: 'BOT',
              status: 'online',
              roles: ['role_bot'],
            },
            content: reply,
            timestamp: 'Ahora',
            reactions: [],
            aiGenerated: true,
            botCard: {
              eyebrow: bot.id === 'bot_kova' ? 'AGENTE OFICIAL DE KOVA' : 'AUTOMATIZACIÓN DEL ESPACIO',
              title: bot.name,
              description: reply,
              tone: /error|advertencia|no reconocido/i.test(reply) ? 'warning' : /éxito|activo|conectado|completado/i.test(reply) ? 'success' : 'ai',
              suggestions: bot.id === 'bot_kova' ? ['!ayuda', '!roles', '!bot'] : [bot.prefix ? `${bot.prefix}help` : '!ayuda'],
              footer: 'Solo tú puedes ver esta respuesta.',
            },
          };

          setAllMessages((prev) => ({
            ...prev,
            [channelId]: [...(prev[channelId] || []), botMessage],
          }));
          soundFx.playReactionAdded();
        }, 600);
        return true;
      }
    }
    return false;
  };

  // Notes: one set per notes channel, saved on the server for everyone.
  const notesChannelId = activeChannel?.type === 'notes' ? activeChannel.id : '';
  const noteFromApi = (item: any): NoteDocument => ({
    id: item.id,
    title: item.title,
    content: item.content || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    lastEdited: item.updatedBy ? `${new Date(item.updatedAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${item.updatedBy}` : 'Ahora',
  });
  useEffect(() => {
    if (!notesChannelId || !getAuthToken()) { setNotes([]); return; }
    let cancelled = false;
    const load = () => api.getNotes(notesChannelId).then((items) => { if (!cancelled) setNotes(items.map(noteFromApi)); }).catch(() => undefined);
    void load();
    const socket = getSocket();
    // Someone else edited: refresh (our own edits are already on screen).
    const onNotes = (event: { channelId: string; editorId?: string }) => {
      if (event.channelId === notesChannelId && event.editorId !== currentUser.id) void load();
    };
    socket.on('notes:changed', onNotes);
    return () => { cancelled = true; socket.off('notes:changed', onNotes); };
  }, [notesChannelId, currentUser.id]);

  const addNote = (title: string, content: string, tags: string[]) => {
    if (!notesChannelId) return;
    soundFx.playReactionAdded();
    api.createNote(notesChannelId, { title, content, tags })
      .then((saved) => setNotes((prev) => [noteFromApi({ ...saved, updatedBy: currentUser.displayName }), ...prev]))
      .catch((error) => toast.error(error instanceof Error ? error.message : 'No se pudo crear la nota.'));
  };

  // Typing updates the note at once; it saves half a second after you stop.
  const noteSaveTimers = useRef<Record<string, number>>({});
  const updateNote = (id: string, title: string, content: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, title, content, lastEdited: `Editando · ${currentUser.displayName}` } : n)));
    window.clearTimeout(noteSaveTimers.current[id]);
    noteSaveTimers.current[id] = window.setTimeout(() => {
      api.updateNote(id, { title, content })
        .then(() => setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, lastEdited: `Guardado · ${currentUser.displayName}` } : n))))
        .catch((error) => toast.error(error instanceof Error ? error.message : 'No se pudo guardar la nota.'));
    }, 500);
  };

  // Server, Channel & Category operations
  // Sets (or clears, with '') the signed-in person's nickname in a space.
  const setSpaceNickname = async (serverId: string, nickname: string) => {
    try {
      const saved = await api.setNickname(serverId, nickname);
      setServers((prev) => prev.map((server) => server.id !== serverId ? server : {
        ...server,
        members: (server.members || []).map((member) => member.id === currentUser.id ? { ...member, nickname: saved.nickname } : member),
      }));
      toast.success(saved.nickname ? `Ahora eres «${saved.nickname}» aquí` : 'Apodo quitado');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el apodo.');
      return false;
    }
  };

  // Creates the space on the server first, so the caller can invite people
  // right away. Resolves to the new space, or null (an error toast is shown).
  const createServer = async (
    name: string,
    description?: string,
    iconUrl?: string,
    template: SpaceTemplateId = 'amigos',
    visibility: 'public' | 'private' = 'private'
  ): Promise<Server | null> => {
    const newServerId = `server_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
    const { categories, channels } = buildSpaceStructure(template, newServerId);
    const ownerMember: User = { ...currentUser, roles: [`role_owner_${newServerId}`] };

    if (getAuthToken()) {
      try {
        await api.createServer({ id: newServerId, name, description, iconUrl, visibility, categories: categories.map(({ id, name: categoryName }) => ({ id, name: categoryName })), channels });
      } catch (error) {
        toast.error(error instanceof Error ? `No se pudo crear el espacio: ${error.message}` : 'No se pudo crear el espacio.');
        return null;
      }
    }

    const newServer: Server = {
      id: newServerId,
      name,
      acronym: name.slice(0, 2).toUpperCase(),
      icon: iconUrl || '',
      description: description || '',
      ownerId: currentUser.id,
      visibility,
      themeGradient: 'from-zinc-700 to-zinc-950',
      categories,
      channels,
      roles: createDefaultRoles(newServerId),
      members: [ownerMember],
    };
    setServers((prev) => [...prev, newServer]);
    setActiveServerId(newServerId);
    const firstText = channels.find((channel) => !isVoiceLike(channel.type));
    if (firstText) setActiveChannelId(firstText.id);
    setIsDMViewActive(false);
    soundFx.playJoinVoice();
    return newServer;
  };

  // Resolves to true once the invite worked; errors come back as a message
  // so the dialog can show them next to the field.
  const joinServerByInvite = async (inviteCodeOrId: string): Promise<{ ok: true } | { ok: false; message: string }> => {
    const cleanCode = inviteCodeOrId.replace(/^.*\/invite\//, '').split(/[/?#]/)[0].trim();
    if (!cleanCode) return { ok: false, message: 'Pega un enlace o un código de invitación.' };

    const existing = servers.find((server) => server.id === cleanCode);
    if (existing) {
      setActiveServerId(existing.id);
      setActiveChannelId(existing.channels.find((channel) => !isVoiceLike(channel.type))?.id || existing.channels[0]?.id || '');
      setIsDMViewActive(false);
      toast.success(`Ya estás en ${existing.name}`);
      return { ok: true };
    }

    try {
      const joined = await api.joinServer(cleanCode);
      const space = ensureServerRoles([joined as Server], currentUser)[0];
      setServers((prev) => (prev.some((server) => server.id === space.id) ? prev : [...prev, space]));
      setActiveServerId(space.id);
      setActiveChannelId(space.channels.find((channel) => !isVoiceLike(channel.type))?.id || space.channels[0]?.id || '');
      setIsDMViewActive(false);
      toast.success(`Te uniste a ${space.name}`);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Esa invitación no es válida.' };
    }
  };

  const createChannel = (name: string, type: ChannelType, categoryId?: string) => {
    soundFx.playReactionAdded();
    const newChanId = `chan_${Date.now()}`;
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');

    const newChannel: Channel = {
      id: newChanId,
      name: formattedName,
      type,
      topic: `Canal ${formattedName} en ${activeServer.name}`,
      categoryId,
    };

    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== activeServer.id) return s;
        let updatedCategories = s.categories;
        if (categoryId) {
          const catExists = s.categories.some((c) => c.id === categoryId);
          if (catExists) {
            updatedCategories = s.categories.map((cat) =>
              cat.id === categoryId ? { ...cat, channelIds: [...cat.channelIds, newChanId] } : cat
            );
          } else {
            updatedCategories = [
              ...s.categories,
              { id: categoryId, name: categoryId.toUpperCase(), channelIds: [newChanId] },
            ];
          }
        }
        return {
          ...s,
          channels: [...s.channels, newChannel],
          categories: updatedCategories,
        };
      })
    );

    // Only set as active text view if not a voice channel, or keep current channel active
    if (!isVoiceLike(type)) {
      setActiveChannelId(newChanId);
    }
    setIsCreateChannelOpen(false);
    if (getAuthToken()) api.createChannel({ id: newChanId, serverId: activeServer.id, categoryId, name: formattedName, type, topic: newChannel.topic })
      .catch((error) => {
        setServers((previous) => previous.map((server) => server.id !== activeServer.id ? server : {
          ...server,
          channels: server.channels.filter((channel) => channel.id !== newChanId),
          categories: server.categories.map((category) => ({ ...category, channelIds: category.channelIds.filter((id) => id !== newChanId) })),
        }));
        toast.error(error instanceof Error ? error.message : 'No se pudo guardar la señal online.');
      });
    toast.success(`Canal ${type === 'voice' ? 'de voz 🔊' : '#'}${formattedName} creado`);
  };

  const updateChannel = (channelId: string, updates: Partial<Channel>) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== activeServer.id) return s;
        return {
          ...s,
          channels: s.channels.map((c) => (c.id === channelId ? { ...c, ...updates } : c)),
        };
      })
    );
    if (getAuthToken()) void api.updateChannel(channelId, { name: updates.name, topic: updates.topic, categoryId: updates.categoryId }).catch((error) => toast.error(error instanceof Error ? error.message : 'No se pudo guardar el canal en línea.'));
    toast.success('Canal actualizado');
  };

  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);

  const joinPublicServer = async (serverId: string) => {
    if (!getAuthToken()) {
      toast.error('Inicia sesión para unirte a una comunidad.');
      return false;
    }
    try {
      const space = await api.joinServer(serverId);
      const server = ensureServerRoles([space as Server], currentUser)[0];
      setServers((previous) => previous.some((item) => item.id === server.id) ? previous : [...previous, server]);
      setActiveServerId(server.id);
      setActiveChannelId(server.channels[0]?.id || '');
      setIsDMViewActive(false);
      toast.success(`Te has unido a ${server.name}`);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo unir a esta comunidad.');
      return false;
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (getAuthToken() && !messageId.startsWith('local_')) {
      try {
        await api.updateMessage(messageId, newContent);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo guardar la edición.');
        return;
      }
    }
    setAllMessages((prev) => {
      const current = prev[activeChannel.id] || [];
      const updated = current.map((m) =>
        m.id === messageId ? { ...m, content: newContent, edited: true } : m
      );
      return { ...prev, [activeChannel.id]: updated };
    });
    toast.success('Mensaje editado');
  };

  const createCategory = async (name: string) => {
    soundFx.playReactionAdded();
    const newCatId = `cat_${Date.now()}`;
    const newCategory: ChannelCategory = {
      id: newCatId,
      name: name.trim().toUpperCase(),
      channelIds: [],
    };

    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== activeServer.id) return s;
        return {
          ...s,
          categories: [...s.categories, newCategory],
        };
      })
    );

    if (getAuthToken()) {
      try {
        await api.createCategory({ id: newCatId, serverId: activeServer.id, name: newCategory.name });
      } catch (error) {
        setServers((prev) => prev.map((server) => server.id === activeServer.id ? { ...server, categories: server.categories.filter((category) => category.id !== newCatId) } : server));
        toast.error(error instanceof Error ? error.message : 'No se pudo guardar la categoría.');
        return;
      }
    }

    setIsCreateCategoryOpen(false);
    toast.success(`Categoría "${name.toUpperCase()}" creada`);
  };

  const deleteCategory = async (categoryId: string) => {
    if (getAuthToken()) {
      try {
        await api.deleteCategory(categoryId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la categoría.');
        return;
      }
    }
    soundFx.playLeaveVoice();
    setServers((prev) => prev.map((server) => server.id !== activeServer.id ? server : ({
      ...server,
      categories: server.categories.filter((category) => category.id !== categoryId),
      channels: server.channels.map((channel) => channel.categoryId === categoryId ? { ...channel, categoryId: undefined } : channel),
    })));
    toast.success('Categoría eliminada');
  };

  const updateUserStatus = (status: UserStatus, customStatus?: string) => {
    setCurrentUser((prev) => ({ ...prev, status, customStatus: customStatus ?? prev.customStatus }));
  };

  const deleteServer = async (serverId: string) => {
    if (getAuthToken()) {
      try {
        await api.deleteServer(serverId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el servidor en línea.');
        return;
      }
    }
    soundFx.playLeaveVoice();
    setServers((prev) => {
      const remaining = prev.filter((s) => s.id !== serverId);
      if (remaining.length > 0) {
        const nextServer = remaining[0];
        setActiveServerId(nextServer.id);
        setActiveChannelId(nextServer.channels[0]?.id || '');
      } else {
        setActiveServerId('');
        setActiveChannelId('');
        setIsDMViewActive(true);
      }
      return remaining;
    });
    toast.success('Servidor eliminado');
  };

  const deleteChannel = async (channelId: string) => {
    if (getAuthToken()) {
      try {
        await api.deleteChannel(channelId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el canal en línea.');
        return;
      }
    }
    soundFx.playLeaveVoice();
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== activeServer.id) return s;
        const newChannels = s.channels.filter((c) => c.id !== channelId);
        return {
          ...s,
          channels: newChannels,
          categories: s.categories.map((cat) => ({
            ...cat,
            channelIds: cat.channelIds.filter((id) => id !== channelId),
          })),
        };
      })
    );
    if (activeChannelId === channelId) {
      const remaining = activeServer.channels.filter((c) => c.id !== channelId);
      if (remaining.length > 0) {
        setActiveChannelId(remaining[0].id);
      } else {
        setActiveChannelId('');
      }
    }
    toast.success('Canal eliminado');
  };

  // Server Settings & Roles State & Handlers
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [serverSettingsTab, setServerSettingsTab] = useState<'overview' | 'roles' | 'members' | 'automod' | 'expressions' | 'welcome'>('roles');

  const applyRoles = (serverId: string, update: (server: Server) => Server) =>
    setServers((prev) => prev.map((server) => (server.id === serverId ? update(server) : server)));

  const createRole = async (
    serverId: string,
    roleData: { name: string; color: string; hoist: boolean; permissions: string[] }
  ): Promise<Role | null> => {
    try {
      const role = await api.createRole(serverId, roleData) as Role;
      applyRoles(serverId, (server) => ({ ...server, roles: [...(server.roles || []).filter((r) => r.id !== role.id), role] }));
      soundFx.playReactionAdded();
      return role;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el rol.');
      return null;
    }
  };

  // Edits show at once; the save waits until typing pauses (one request per role).
  const roleSaveTimers = useRef<Record<string, { timer: number; data: Partial<Role> }>>({});
  const updateRole = (serverId: string, roleId: string, updates: Partial<Role>) => {
    applyRoles(serverId, (server) => ({ ...server, roles: (server.roles || []).map((r) => (r.id === roleId ? { ...r, ...updates } : r)) }));
    const key = `${serverId}:${roleId}`;
    const pending = roleSaveTimers.current[key];
    if (pending) window.clearTimeout(pending.timer);
    const data = { ...(pending?.data || {}), ...updates };
    roleSaveTimers.current[key] = {
      data,
      timer: window.setTimeout(() => {
        delete roleSaveTimers.current[key];
        const { name, color, hoist, permissions } = data;
        api.updateRole(serverId, roleId, { name, color, hoist, permissions }).catch((error) => {
          toast.error(error instanceof Error ? error.message : 'No se pudo guardar el rol.');
          void refreshServersRef.current();
        });
      }, 500),
    };
  };

  const deleteRole = async (serverId: string, roleId: string) => {
    try {
      await api.deleteRole(serverId, roleId);
      applyRoles(serverId, (server) => ({
        ...server,
        roles: (server.roles || []).filter((r) => r.id !== roleId),
        members: (server.members || []).map((m) => ({ ...m, roles: (m.roles || []).filter((rid) => rid !== roleId) })),
      }));
      toast.success('Rol eliminado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo borrar el rol.');
    }
  };

  const toggleMemberRole = async (serverId: string, memberId: string, roleId: string) => {
    const server = servers.find((item) => item.id === serverId);
    const has = Boolean(server?.members?.find((m) => m.id === memberId)?.roles?.includes(roleId));
    const flip = (give: boolean) => applyRoles(serverId, (srv) => ({
      ...srv,
      members: (srv.members || []).map((m) => m.id !== memberId ? m : {
        ...m,
        roles: give ? [...new Set([...(m.roles || []), roleId])] : (m.roles || []).filter((id) => id !== roleId),
      }),
    }));
    flip(!has);
    try {
      await api.setMemberRole(serverId, memberId, roleId, !has);
      soundFx.playReactionAdded();
    } catch (error) {
      flip(has);
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el rol.');
    }
  };

  /** Leave a space yourself, or kick/ban someone else. */
  const removeFromSpace = async (serverId: string, userId: string, ban = false) => {
    try {
      await api.removeMember(serverId, userId, ban);
      if (userId === currentUser.id) {
        const left = servers.find((server) => server.id === serverId);
        setServers((prev) => prev.filter((server) => server.id !== serverId));
        if (activeServerId === serverId) setIsDMViewActive(true);
        toast.success(`Saliste de ${left?.name || 'el espacio'}`);
      } else {
        applyRoles(serverId, (server) => ({ ...server, members: (server.members || []).filter((m) => m.id !== userId) }));
        toast.success(ban ? 'Persona vetada del espacio' : 'Persona expulsada del espacio');
      }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la acción.');
      return false;
    }
  };

  const updateServerDetails = (
    serverId: string,
    updates: { name?: string; icon?: string; banner?: string; description?: string; visibility?: 'public' | 'private'; category?: string }
  ) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          ...updates,
          acronym: updates.name ? updates.name.slice(0, 2).toUpperCase() : s.acronym,
        };
      })
    );
    if (getAuthToken()) void api.updateServer(serverId, { name: updates.name, description: updates.description, icon: updates.icon, banner: updates.banner, visibility: updates.visibility, category: updates.category }).catch((error) => toast.error(error instanceof Error ? error.message : 'No se pudieron guardar los ajustes en línea.'));
    toast.success('Ajustes del servidor guardados');
  };

  return (
    <AppContext.Provider
      value={{
    isAuthenticated,
        realtimeConnected,
        typingUsers,
        setTyping,
        presenceByUser,
    loginAsGuest,
        loginWithGoogle,
        loginWithEmail,
        registerUser,
        logout,
        servers,
        activeServer,
        activeChannel,
        setActiveServerId: (id) => {
          setIsDMViewActive(false);
          setActiveServerId(id);
          const s = servers.find((serv) => serv.id === id);
          if (s && s.channels.length > 0) {
            setActiveChannelId(s.channels[0].id);
          }
        },
        setActiveChannelId,
        currentUser,
        setCurrentUser,
        setUserPresence,
        messages,
        sendMessage,
        addReaction,
        deleteMessage,
        togglePinMessage,
        translateMessage,
        activeVoiceChannelId,
        isInVoice,
        joinVoiceChannel,
        voicePeers,
        isVoiceConnecting,
        leaveVoiceChannel,
        toggleMute,
        toggleDeafen,
        toggleCamera,
        toggleScreenShare,
        pushToTalkEnabled,
        pushToTalkKey,
        isPushToTalkHeld,
        setPushToTalkEnabled,
        setPushToTalkKey,
        activeThread,
        openThread,
        closeThread,
        sendThreadMessage,
        isKovaAIOpen,
        setIsKovaAIOpen,
        aiHistory,
        isAILoading,
        askKovaAI,
        summarizeChannel,
        generateMinutesToNotes,
        theme,
        setTheme,
        soundEnabled,
        setSoundEnabled,
        preferences,
        updatePreference,
        updateUserProfile,
        isArcadeOpen,
        setIsArcadeOpen,
        isCodePlaygroundOpen,
        setIsCodePlaygroundOpen,
        isSoundboardOpen,
        setIsSoundboardOpen,
        stories,
        isCreateStoryOpen,
        setIsCreateStoryOpen,
        activeStoryIndex,
        openStoryViewer,
        closeStoryViewer,
        addStory,
        reactToStory,
        isDMViewActive,
        setIsDMViewActive,
        activeDMUserId,
        setActiveDMUserId,
        dmConversations,
        sendDirectMessage,
        friends,
        addFriend,
        removeFriend,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        isCreateServerOpen,
        setIsCreateServerOpen,
        isCreateChannelOpen,
        setIsCreateChannelOpen,
        isCreateCategoryOpen,
        setIsCreateCategoryOpen,
        presetChannelType,
        setPresetChannelType,
        presetCategoryId,
        setPresetCategoryId,
        isInviteModalOpen,
        setIsInviteModalOpen,
        inviteServerId,
        openInviteModal,
        pendingFriendRequests,
        sendFriendRequest,
        cancelFriendRequest,
        acceptFriendRequest,
        isMemberListOpen,
        setIsMemberListOpen,
        isPinnedDrawerOpen,
        setIsPinnedDrawerOpen,
        layoutMode,
        setLayoutMode,
        profileModalUser,
        openUserProfile,
        closeUserProfile,
        createServer,
        joinServerByInvite,
        setSpaceNickname,
        removeFromSpace,
        callNotesOn,
        notesTakers,
        toggleCallNotes,
        summarizeCall,
        autoTranslateChannels,
        toggleAutoTranslate,
        scheduleMessage,
        remindMe,
        savedMessageIds,
        toggleSaveMessage,
        voiceOccupancy,
        blockedUsers,
        blockedUserIds,
        blockUser,
        unblockUser,
        unreadByChannel,
        catchUpByChannel,
        dismissCatchUp,
        markChannelRead,
        loadOlderMessages,
        connectingVoiceChannelId,
        isCameraPickerOpen,
        setIsCameraPickerOpen,
        startCamera,
        isScreenPickerOpen,
        setIsScreenPickerOpen,
        startScreenShare,
        refreshServers,
        createChannel,
        deleteServer,
        deleteChannel,
        createCategory,
        deleteCategory,
        updateChannel,
        isEditChannelOpen,
        setIsEditChannelOpen,
        editingChannelId,
        setEditingChannelId,
        isDiscoveryOpen,
        setIsDiscoveryOpen,
        joinPublicServer,
        editMessage,
        isServerSettingsOpen,
        setIsServerSettingsOpen,
        serverSettingsTab,
        setServerSettingsTab,
        createRole,
        updateRole,
        deleteRole,
        toggleMemberRole,
        updateServerDetails,
        notes,
        addNote,
        updateNote,
        updateUserStatus,
        bots,
        isAppDirectoryOpen,
        setIsAppDirectoryOpen,
        installBotToServer,
        uninstallBotFromServer,
        createCustomBot,
        deleteCustomBot,
        processBotTriggers,
        isTwoFactorEnabled,
        twoFactorBackupCodes,
        backupCodesRemaining,
        hasPendingTwoFactorLogin: pendingTwoFactor !== null,
        completeTwoFactorLogin,
        cancelTwoFactorLogin,
        isTwoFactorSetupOpen,
        setIsTwoFactorSetupOpen,
        isTwoFactorBackupOpen,
        setIsTwoFactorBackupOpen,
        isTwoFactorDisableOpen,
        setIsTwoFactorDisableOpen,
        startTwoFactorSetup,
        confirmTwoFactorSetup,
        disableTwoFactor,
        regenerateBackupCodes,
        notifications,
        unreadNotificationsCount,
        isNotificationsOpen,
        setIsNotificationsOpen,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        dismissNotification,
        isLiveStreamsOpen,
        setIsLiveStreamsOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
