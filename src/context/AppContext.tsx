import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../types';
import { DEFAULT_BOTS } from '../data/defaultBots';
import {
  generateTwoFactorSecret,
  generateBackupCodes,
  verifyTwoFactorCode,
} from '../utils/twoFactorUtils';
import {
  INITIAL_SERVERS,
  INITIAL_MESSAGES,
  INITIAL_NOTES,
  INITIAL_STORIES,
  INITIAL_DM_CONVERSATIONS,
  CURRENT_USER,
  MOCK_USERS,
} from '../data/mockData';
import { soundFx } from '../utils/soundEffects';
import { BackgroundTheme } from '../components/Themes/ThemeBackground';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  askGemini,
  summarizeConversationWithGemini,
  translateTextWithGemini,
  generateMeetingMinutesWithGemini,
} from '../services/geminiService';

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
}

interface AppContextType {
  // Authentication & User Session
  isAuthenticated: boolean;
  loginWithGoogle: (googleUser?: Partial<User>) => void;
  loginWithEmail: (email: string, pass: string) => void;
  registerUser: (username: string, email: string, pass: string, displayName?: string) => void;
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
  messages: Message[];
  sendMessage: (
    content: string,
    codeBlock?: { language: string; code: string },
    replyId?: string,
    voiceNote?: { duration: number }
  ) => void;
  addReaction: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
  togglePinMessage: (messageId: string) => void;
  translateMessage: (messageId: string, targetLang: string) => void;
  // Voice Call
  activeVoiceChannelId: string | null;
  isInVoice: boolean;
  joinVoiceChannel: (channelId: string) => void;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
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
  updateUserProfile: (updates: Partial<User>) => void;
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
  addStory: (mediaUrl?: string, text?: string, backgroundColor?: string) => void;
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
  pendingFriendRequests: { id: string; username: string; tag: string; timestamp: string }[];
  sendFriendRequest: (usernameOrTag: string) => void;
  cancelFriendRequest: (id: string) => void;
  isMemberListOpen: boolean;
  setIsMemberListOpen: (open: boolean) => void;
  isPinnedDrawerOpen: boolean;
  setIsPinnedDrawerOpen: (open: boolean) => void;
  // User Profile Popout Modal
  profileModalUser: User | null;
  openUserProfile: (user: User) => void;
  closeUserProfile: () => void;
  // Server/Channel operations
  createServer: (name: string, description: string, iconUrl?: string) => void;
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
  joinPublicServer: (server: Server) => void;
  editMessage: (messageId: string, newContent: string) => void;
  // Server Settings & Roles
  isServerSettingsOpen: boolean;
  setIsServerSettingsOpen: (open: boolean) => void;
  serverSettingsTab: 'overview' | 'roles' | 'members';
  setServerSettingsTab: (tab: 'overview' | 'roles' | 'members') => void;
  createRole: (serverId: string, roleData: { name: string; color: string; hoist: boolean; permissions: string[] }) => Role;
  updateRole: (serverId: string, roleId: string, updates: Partial<Role>) => void;
  deleteRole: (serverId: string, roleId: string) => void;
  toggleMemberRole: (serverId: string, memberId: string, roleId: string) => void;
  updateServerDetails: (serverId: string, updates: { name?: string; icon?: string; banner?: string; description?: string }) => void;
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
  createCustomBot: (botData: Omit<KovaBot, 'id' | 'installedServers' | 'verified'>) => KovaBot;
  deleteCustomBot: (botId: string) => void;
  processBotTriggers: (content: string, channelId: string) => Promise<boolean>;
  // Two-Factor Authentication (2FA)
  isTwoFactorEnabled: boolean;
  twoFactorSecret: string;
  twoFactorBackupCodes: string[];
  isTwoFactorSetupOpen: boolean;
  setIsTwoFactorSetupOpen: (open: boolean) => void;
  isTwoFactorBackupOpen: boolean;
  setIsTwoFactorBackupOpen: (open: boolean) => void;
  isTwoFactorDisableOpen: boolean;
  setIsTwoFactorDisableOpen: (open: boolean) => void;
  enableTwoFactor: (secret: string, backupCodes: string[]) => void;
  disableTwoFactor: () => void;
  verifyTwoFactor: (code: string) => boolean;
  regenerateBackupCodes: () => string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const createDefaultRoles = (serverId: string): Role[] => [
  {
    id: `role_everyone_${serverId}`,
    name: '@everyone',
    color: '#99AAB5',
    hoist: false,
    permissions: [
      'SEND_MESSAGES',
      'VIEW_CHANNEL',
      'EMBED_LINKS',
      'ATTACH_FILES',
      'READ_MESSAGE_HISTORY',
      'ADD_REACTIONS',
      'CONNECT_VOICE',
      'SPEAK_VOICE',
    ],
  },
  {
    id: `role_owner_${serverId}`,
    name: '👑 Propietario',
    color: '#FFB800',
    hoist: true,
    permissions: [
      'ADMINISTRATOR',
      'MANAGE_SERVER',
      'MANAGE_ROLES',
      'MANAGE_CHANNELS',
      'KICK_MEMBERS',
      'BAN_MEMBERS',
      'SEND_MESSAGES',
    ],
  },
  {
    id: `role_admin_${serverId}`,
    name: '🛡️ Administrador',
    color: '#5865F2',
    hoist: true,
    permissions: [
      'MANAGE_SERVER',
      'MANAGE_ROLES',
      'MANAGE_CHANNELS',
      'KICK_MEMBERS',
      'BAN_MEMBERS',
      'SEND_MESSAGES',
    ],
  },
  {
    id: `role_mod_${serverId}`,
    name: '⚔️ Moderador',
    color: '#57F287',
    hoist: true,
    permissions: ['MANAGE_CHANNELS', 'KICK_MEMBERS', 'SEND_MESSAGES'],
  },
  {
    id: `role_vip_${serverId}`,
    name: '⭐ VIP',
    color: '#EB459E',
    hoist: true,
    permissions: ['SEND_MESSAGES', 'ATTACH_FILES', 'CONNECT_VOICE', 'SPEAK_VOICE'],
  },
];

const ensureServerRoles = (serverList: Server[], user: User): Server[] => {
  return serverList.map((s) => {
    if (s.roles && s.roles.length > 0) return s;
    const defaultRoles = createDefaultRoles(s.id);
    const ownerRoleId = `role_owner_${s.id}`;
    return {
      ...s,
      roles: defaultRoles,
      members: (s.members && s.members.length > 0 ? s.members : [user]).map((m) =>
        m.id === s.ownerId ? { ...m, roles: m.roles?.length ? m.roles : [ownerRoleId] } : m
      ),
    };
  });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication & Session Persistence
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const session = localStorage.getItem('kova.auth.session');
      return session === 'true';
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

  // Two-Factor Authentication (2FA) State
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kova.auth.2fa.enabled');
      if (saved !== null) return saved === 'true';
    } catch {}
    return !!currentUser.twoFactorEnabled;
  });

  const [twoFactorSecret, setTwoFactorSecret] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('kova.auth.2fa.secret');
      if (saved) return saved;
    } catch {}
    return currentUser.twoFactorSecret || generateTwoFactorSecret();
  });

  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kova.auth.2fa.backupCodes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return currentUser.backupCodes || generateBackupCodes(8);
  });

  const [isTwoFactorSetupOpen, setIsTwoFactorSetupOpen] = useState(false);
  const [isTwoFactorBackupOpen, setIsTwoFactorBackupOpen] = useState(false);
  const [isTwoFactorDisableOpen, setIsTwoFactorDisableOpen] = useState(false);

  const enableTwoFactor = (secret: string, backupCodes: string[]) => {
    setIsTwoFactorEnabled(true);
    setTwoFactorSecret(secret);
    setTwoFactorBackupCodes(backupCodes);
    setCurrentUser((prev) => ({
      ...prev,
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      backupCodes,
    }));
    try {
      localStorage.setItem('kova.auth.2fa.enabled', 'true');
      localStorage.setItem('kova.auth.2fa.secret', secret);
      localStorage.setItem('kova.auth.2fa.backupCodes', JSON.stringify(backupCodes));
    } catch {}
  };

  const disableTwoFactor = () => {
    setIsTwoFactorEnabled(false);
    setCurrentUser((prev) => ({
      ...prev,
      twoFactorEnabled: false,
    }));
    try {
      localStorage.setItem('kova.auth.2fa.enabled', 'false');
    } catch {}
  };

  const verifyTwoFactor = (code: string): boolean => {
    const res = verifyTwoFactorCode(twoFactorSecret, code, twoFactorBackupCodes);
    if (res.success && res.isBackupCode) {
      setTwoFactorBackupCodes(res.remainingBackupCodes);
      try {
        localStorage.setItem('kova.auth.2fa.backupCodes', JSON.stringify(res.remainingBackupCodes));
      } catch {}
    }
    return res.success;
  };

  const regenerateBackupCodes = (): string[] => {
    const newCodes = generateBackupCodes(8);
    setTwoFactorBackupCodes(newCodes);
    setCurrentUser((prev) => ({ ...prev, backupCodes: newCodes }));
    try {
      localStorage.setItem('kova.auth.2fa.backupCodes', JSON.stringify(newCodes));
    } catch {}
    return newCodes;
  };

  const loginWithGoogle = (googleUser?: Partial<User>) => {
    const user: User = {
      ...currentUser,
      id: `google_${Date.now()}`,
      username: googleUser?.username || 'google_user',
      displayName: googleUser?.displayName || 'Usuario de Google',
      avatar:
        googleUser?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      customStatus: 'Conectado con cuenta de Google',
    };
    setCurrentUser(user);
    setIsAuthenticated(true);
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

  const loginWithEmail = (email: string, _pass: string) => {
    const username = email.split('@')[0] || 'usuario';
    const user: User = {
      ...currentUser,
      id: `user_${Date.now()}`,
      username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      status: 'online',
      customStatus: 'Disponible en Kova',
    };
    setCurrentUser(user);
    setIsAuthenticated(true);
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

  const registerUser = (username: string, _email: string, _pass: string, displayName?: string) => {
    const user: User = {
      ...currentUser,
      id: `user_${Date.now()}`,
      username: username.toLowerCase().replace(/\s+/g, '_'),
      displayName: displayName || username,
      status: 'online',
      customStatus: 'Nuevo explorador en Kova',
    };
    setCurrentUser(user);
    setIsAuthenticated(true);
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

  const logout = () => {
    setIsAuthenticated(false);
    setActiveVoiceChannelId(null);
    try {
      localStorage.setItem('kova.auth.session', 'false');
    } catch {}
    soundFx.playLeaveVoice();
  };

  // Dynamic Servers with localStorage persistence
  const [servers, setServers] = useState<Server[]>(() => {
    try {
      const saved = localStorage.getItem('kova.servers.v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return ensureServerRoles(parsed, CURRENT_USER);
      }
    } catch {}
    return ensureServerRoles(INITIAL_SERVERS, CURRENT_USER);
  });

  useEffect(() => {
    try {
      localStorage.setItem('kova.servers.v5', JSON.stringify(servers));
    } catch {}
  }, [servers]);

  const [activeServerId, setActiveServerId] = useState<string>(() => servers[0]?.id || '');
  const [activeChannelId, setActiveChannelId] = useState<string>(() => servers[0]?.channels[0]?.id || '');
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);

  // Themes & Sound
  const [theme, setThemeState] = useState<BackgroundTheme>(() => {
    try {
      const saved = localStorage.getItem('kova.theme.v1');
      if (saved && ['oled', 'nebula', 'matrix', 'synthwave', 'discord'].includes(saved)) {
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
    };
  });

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

  const updateUserProfile = (updates: Partial<User>) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('kova.auth.user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    soundFx.playJoinVoice();
    toast.success('Perfil y foto actualizados');
  };

  // Voice call state
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);
  const isInVoice = activeVoiceChannelId !== null;

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

  // Stories System State
  const [stories, setStories] = useState<Story[]>(() => {
    try {
      localStorage.removeItem('kova.stories.v1');
      localStorage.removeItem('kova.stories.v2');
      const saved = localStorage.getItem('kova.stories.v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const mockIds = ['user_elena', 'user_alex', 'user_marcus', 'user_sophia', 'user_kai', 'user_luna'];
          return parsed.filter((s: Story) => s && s.author && !mockIds.includes(s.author.id));
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('kova.stories.v3', JSON.stringify(stories));
    } catch {}
  }, [stories]);

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

  const addStory = (mediaUrl?: string, text?: string, backgroundColor?: string) => {
    const newStory: Story = {
      id: `story_${Date.now()}`,
      author: currentUser,
      mediaUrl,
      text,
      backgroundColor: backgroundColor || 'from-purple-900 via-indigo-900 to-black',
      createdAt: 'Ahora',
      views: 1,
      likes: 0,
    };
    setStories((prev) => [newStory, ...prev]);
    soundFx.playAISparkle();
  };

  const reactToStory = (storyId: string, _emoji: string) => {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, likes: s.likes + 1 } : s))
    );
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

  const addFriend = (usernameOrTag: string) => {
    const cleanName = usernameOrTag.trim();
    if (!cleanName) return;

    const namePart = cleanName.split('#')[0] || cleanName;
    const tagPart = cleanName.includes('#') ? cleanName.split('#')[1] : Math.floor(1000 + Math.random() * 9000).toString();

    const newFriend: User = {
      id: `friend_${Date.now()}`,
      username: namePart.toLowerCase().replace(/\s+/g, '_'),
      displayName: namePart,
      tag: tagPart,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(namePart)}`,
      status: 'online',
      customStatus: '¡Nuevo amigo en Kova!',
      roles: ['Member'],
    };

    setFriends((prev) => {
      if (prev.some((f) => f.displayName.toLowerCase() === namePart.toLowerCase())) {
        return prev;
      }
      return [newFriend, ...prev];
    });

    soundFx.playJoinVoice();
    toast.success(`¡Solicitud aceptada! ${namePart}#${tagPart} ahora es tu amigo.`);
  };

  const removeFriend = (userId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== userId));
    toast.info('Amigo eliminado de tu lista');
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

  const sendDirectMessage = (receiverId: string, content: string) => {
    if (!content.trim()) return;
    soundFx.playMessageSent();

    setDmConversations((prev) => {
      const timeStr = 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newDM = {
        id: `dm_msg_${Date.now()}`,
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
        const targetUser = friend || MOCK_USERS[receiverId] || {
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

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteServerId, setInviteServerId] = useState<string | null>(null);

  const openInviteModal = (serverId?: string) => {
    setInviteServerId(serverId || null);
    setIsInviteModalOpen(true);
    soundFx.playJoinVoice();
  };

  // Pending Friend Requests (Discord-style: sending a request does not pretend to add an instant friend)
  const [pendingFriendRequests, setPendingFriendRequests] = useState<{ id: string; username: string; tag: string; timestamp: string }[]>(() => {
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

  const sendFriendRequest = (usernameOrTag: string) => {
    const clean = usernameOrTag.trim();
    if (!clean) return;
    const namePart = clean.split('#')[0] || clean;
    const tagPart = clean.includes('#') ? clean.split('#')[1] : Math.floor(1000 + Math.random() * 9000).toString();

    const newReq = {
      id: `req_${Date.now()}`,
      username: namePart,
      tag: tagPart,
      timestamp: 'Ahora',
    };

    setPendingFriendRequests((prev) => [newReq, ...prev]);
    soundFx.playAISparkle();
    toast.success(`¡Solicitud de amistad enviada a ${namePart}#${tagPart}!`);
  };

  const cancelFriendRequest = (id: string) => {
    setPendingFriendRequests((prev) => prev.filter((r) => r.id !== id));
    toast.info('Solicitud de amistad cancelada');
  };

  // Bots & App Directory state
  const [bots, setBots] = useState<KovaBot[]>(() => {
    try {
      const saved = localStorage.getItem('kova.bots.v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_BOTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('kova.bots.v1', JSON.stringify(bots));
    } catch {}
  }, [bots]);

  const [isAppDirectoryOpen, setIsAppDirectoryOpen] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<NoteDocument[]>(INITIAL_NOTES);

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
    id: '',
    name: 'Mi Espacio',
    acronym: 'KO',
    description: 'Servidor Kova',
    ownerId: currentUser.id,
    themeGradient: 'from-purple-600 to-indigo-600',
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
    voiceNote?: { duration: number }
  ) => {
    if (!content.trim() && !codeBlock && !voiceNote) return;

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

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      channelId: activeChannel.id,
      author: currentUser,
      content,
      codeBlock,
      voiceNote,
      timestamp: 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
      replyTo: replyInfo,
    };

    setAllMessages((prev) => ({
      ...prev,
      [activeChannel.id]: [...(prev[activeChannel.id] || []), newMsg],
    }));
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
  };

  const deleteMessage = (messageId: string) => {
    setAllMessages((prev) => ({
      ...prev,
      [activeChannel.id]: (prev[activeChannel.id] || []).filter((m) => m.id !== messageId),
    }));
  };

  const togglePinMessage = (messageId: string) => {
    setAllMessages((prev) => {
      const channelMsgs = prev[activeChannel.id] || [];
      const updated = channelMsgs.map((msg) =>
        msg.id === messageId ? { ...msg, pinned: !msg.pinned } : msg
      );
      return { ...prev, [activeChannel.id]: updated };
    });
  };

  // Voice Controls
  const joinVoiceChannel = (channelId: string) => {
    soundFx.playJoinVoice();
    setActiveVoiceChannelId(channelId);
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.85, x: 0.15 },
      colors: ['#10b981', '#06b6d4', '#8b5cf6'],
    });
  };

  const leaveVoiceChannel = () => {
    soundFx.playLeaveVoice();
    setActiveVoiceChannelId(null);
  };

  const toggleMute = () => {
    soundFx.playMuteToggle(!currentUser.isMuted);
    setCurrentUser((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleDeafen = () => {
    setCurrentUser((prev) => ({ ...prev, isDeafened: !prev.isDeafened }));
  };

  const toggleCamera = () => {
    setCurrentUser((prev) => ({ ...prev, isCameraOn: !prev.isCameraOn }));
  };

  const toggleScreenShare = () => {
    setCurrentUser((prev) => ({ ...prev, isScreenSharing: !prev.isScreenSharing }));
  };

  // Thread controls
  const openThread = (message: Message) => {
    setActiveThread({
      id: `thread_${message.id}`,
      parentMessageId: message.id,
      channelId: message.channelId,
      title: `Hilo: ${message.content.slice(0, 30)}...`,
      messages: [message],
      participantCount: 2,
    });
  };

  const closeThread = () => {
    setActiveThread(null);
  };

  const sendThreadMessage = (content: string) => {
    if (!activeThread || !content.trim()) return;
    soundFx.playMessageSent();
    const newMsg: Message = {
      id: `thread_msg_${Date.now()}`,
      channelId: activeThread.channelId,
      author: currentUser,
      content,
      timestamp: 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    };
    setActiveThread((prev) => prev ? ({ ...prev, messages: [...prev.messages, newMsg] }) : null);
  };

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
      console.error('[Kova AI] Error procesando solicitud:', err);
      const aiMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: '✦ **Kova AI**: Ocurrió un error al procesar tu solicitud con Gemini. Por favor intenta de nuevo.',
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

  const translateMessage = async (messageId: string, targetLang: string) => {
    soundFx.playAISparkle();
    const channelMsgs = allMessages[activeChannel.id] || [];
    const targetMsg = channelMsgs.find((m) => m.id === messageId);
    if (!targetMsg) return;

    try {
      toast.info(`Traduciendo mensaje con Gemini al ${targetLang.toUpperCase()}...`);
      const translated = await translateTextWithGemini(targetMsg.content, targetLang);
      setAllMessages((prev) => {
        const msgs = prev[activeChannel.id] || [];
        const updated = msgs.map((msg) => {
          if (msg.id !== messageId) return msg;
          return { ...msg, translatedText: `[Gemini ${targetLang.toUpperCase()}]: ${translated}` };
        });
        return { ...prev, [activeChannel.id]: updated };
      });
      soundFx.playAISparkle();
    } catch (err) {
      console.error('[Kova AI] Error traduciendo mensaje:', err);
      toast.error('Error al traducir el mensaje');
    }
  };


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

  const createCustomBot = (botData: Omit<KovaBot, 'id' | 'installedServers' | 'verified'>): KovaBot => {
    const newBot: KovaBot = {
      ...botData,
      id: `bot_${Date.now()}`,
      installedServers: [activeServer.id],
      verified: false,
    };

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

  const deleteCustomBot = (botId: string) => {
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

      if (matchedAuto) {
        reply = matchedAuto.response;
      } else if (bot.id === 'bot_lofi') {
        if (content.includes('!play') || content.includes('!music')) {
          const song = content.replace(/!play|!music/gi, '').trim() || 'beats to relax/study to';
          reply = `🎶 **Lofi Girl** empezó a reproducir: *${song}* ☕ 📻\n[▶ Transmitiendo en vivo en el canal de voz | 320kbps High-Fi Audio]`;
        } else if (content.includes('!pause') || content.includes('!stop')) {
          reply = '⏸️ **Lofi Girl**: Música en pausa en el canal de voz.';
        } else if (content.includes('!queue') || content.includes('!cola')) {
          reply = '📜 **Lofi Girl Playlist Activa**:\n1. 🎵 *Kupla - Sleepy Bees* (2:45)\n2. 🎵 *Idealism - Phantasm* (3:12)\n3. 🎵 *Jinsang - Bliss* (2:30)';
        } else {
          reply = '🎧 **Lofi Girl**: Usa `!play <canción>`, `!pause`, o `!queue` para controlar la música.';
        }
      } else if (bot.id === 'bot_mee6') {
        if (content.includes('!level') || content.includes('!rank')) {
          reply = `🏆 **MEE6 Rank**:\n👤 Usuario: **${currentUser.displayName}**\n⭐ Nivel: **18** | Total XP: **4,850** | Posición: **#1 en ${activeServer.name}** 🥇`;
        } else if (content.includes('!clear') || content.includes('!clean')) {
          reply = '🧹 **MEE6 Moderación**: 5 mensajes eliminados por petición del moderador. Canal limpio y ordenado.';
        } else if (content.includes('!warn')) {
          reply = '⚠️ **MEE6 Moderación**: Advertencia registrada en el registro de auditoría del servidor.';
        } else {
          reply = '🛡️ **MEE6**: Usa `!level` para ver tu tarjeta de rango o `!clear` para moderar.';
        }
      } else if (bot.id === 'bot_dankmemer') {
        if (content.includes('!meme')) {
          const memes = [
            '🐸 **Dank Memer**: *Cuando el código compila sin ningún error a la primera...*\n*( ͡° ͜ʖ ͡°) Algo anda muy mal, revisa el git status.*',
            '🐸 **Dank Memer**: *Yo a las 3 AM:* "Voy a cambiar solo un color de CSS".\n*5 horas después:* 14 dependencias actualizadas y reescribí el backend.',
            '🐸 **Dank Memer**: *El cliente:* "¿Pueden hacer que la IA haga todo sola para el viernes?"\n*El dev senior:* `git push --force origin main` y a rezar.',
          ];
          reply = memes[Math.floor(Math.random() * memes.length)];
        } else if (content.includes('!coin') || content.includes('!flip')) {
          reply = `🪙 **Dank Memer**: Lanzando la moneda al aire... ¡Salió **${Math.random() > 0.5 ? 'CARA 🌕' : 'CRUZ 🌑'}**!`;
        } else if (content.includes('!daily')) {
          reply = '💰 **Dank Memer**: ¡Has reclamado tus **5,000 PepeCoins** diarias! Tu balance actual: **24,500 🪙**';
        } else {
          reply = '🐸 **Dank Memer**: ¡Comandos disponibles: `!meme`, `!coin`, `!daily`!';
        }
      } else if (bot.id === 'bot_dalle') {
        if (content.includes('!imagine')) {
          const prompt = content.replace(/!imagine/i, '').replace(`@${bot.name}`, '').trim() || 'Cyberpunk neon city 8k resolution';
          reply = `🎨 **DALL-E Art Engine**:\n> *Prompt: "${prompt}"*\n\n🖼️ Generando arte conceptual fotorrealista...\n✨ ¡Render completado con éxito! [Kova Cyberpunk Style | 4096x4096px]`;
        } else {
          reply = '🎨 **DALL-E**: Usa `!imagine <tu descripción visual>` para generar arte conceptual.';
        }
      } else if (bot.id === 'bot_serverstats') {
        reply = `📊 **Estadísticas Oficiales de ${activeServer.name}**:\n• 👥 **Miembros totales**: ${activeServer.members.length}\n• 💬 **Canales de texto/voz**: ${activeServer.channels.length}\n• 🛡️ **Roles configurados**: ${activeServer.roles.length}\n• 🟢 **Latencia de servidor**: 22ms | 🌐 **Región**: Cloud Global (Kova DC-1)`;
      } else if (bot.id === 'bot_gemini' || bot.systemPrompt) {
        const query = content.replace(bot.prefix || '', '').replace(`@${bot.name}`, '').trim();
        if (!query) {
          reply = `✨ **${bot.name}**: ¡Hola! Puedes interactuar conmigo escribiendo con mi prefijo \`${bot.prefix}\` o mencionándome con \`@${bot.name}\`.`;
        } else {
          try {
            const prompt = bot.systemPrompt
              ? `[INSTRUCCIÓN DE SISTEMA / PERSONALIDAD: ${bot.systemPrompt}]\n\nEstás en el servidor "${activeServer.name}" de Discord/Kova. Responde al siguiente mensaje del usuario de acuerdo a tu personalidad de manera concisa y formateada con Markdown:\n\nUsuario: ${query}`
              : `Eres el bot de Discord Gemini Pro en el servidor "${activeServer.name}". Responde de forma concisa y útil al siguiente mensaje:\n\nUsuario: ${query}`;
            const aiResponse = await askGemini(prompt);
            reply = aiResponse;
          } catch {
            reply = `✨ **${bot.name}**: He recibido tu mensaje: "${query}". Sistemas neuronales activos.`;
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
              id: `user_${bot.id}`,
              username: bot.name,
              displayName: bot.name,
              avatar: bot.avatar,
              tag: 'BOT',
              status: 'online',
            },
            content: reply,
            timestamp: 'Ahora',
            reactions: [],
            aiGenerated: true,
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

  // Notes operations
  const addNote = (title: string, content: string, tags: string[]) => {
    soundFx.playReactionAdded();
    const newDoc: NoteDocument = {
      id: `note_${Date.now()}`,
      title,
      content,
      tags,
      lastEdited: 'Ahora por ' + currentUser.displayName,
    };
    setNotes((prev) => [newDoc, ...prev]);
  };

  const updateNote = (id: string, title: string, content: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, title, content, lastEdited: 'Ahora por ' + currentUser.displayName }
          : n
      )
    );
  };

  // Server, Channel & Category operations
  const createServer = (name: string, description: string, iconUrl?: string) => {
    soundFx.playJoinVoice();
    const newServerId = `server_${Date.now()}`;

    const defaultRoles = createDefaultRoles(newServerId);
    const ownerRoleId = `role_owner_${newServerId}`;
    const ownerMember: User = {
      ...currentUser,
      roles: [ownerRoleId],
    };

    const newServer: Server = {
      id: newServerId,
      name,
      acronym: name.slice(0, 2).toUpperCase(),
      icon: iconUrl || '',
      description: description || 'Servidor creado en Kova',
      ownerId: currentUser.id,
      themeGradient: 'from-purple-600 to-indigo-600',
      categories: [],
      channels: [],
      roles: defaultRoles,
      members: [ownerMember],
    };

    setServers((prev) => [...prev, newServer]);
    setActiveServerId(newServerId);
    setActiveChannelId('');
    setIsDMViewActive(false);
    setIsCreateServerOpen(false);
    toast.success(`Servidor "${name}" creado vacío`);
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

    setActiveChannelId(newChanId);
    setIsCreateChannelOpen(false);
    toast.success(`Canal #${formattedName} creado`);
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
    toast.success('Canal actualizado');
  };

  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);

  const joinPublicServer = (server: Server) => {
    setServers((prev) => {
      const exists = prev.some((s) => s.id === server.id);
      if (exists) return prev;
      return [...prev, server];
    });
    setActiveServerId(server.id);
    if (server.channels.length > 0) {
      setActiveChannelId(server.channels[0].id);
    }
    setIsDMViewActive(false);
  };

  const editMessage = (messageId: string, newContent: string) => {
    setAllMessages((prev) => {
      const current = prev[activeChannel.id] || [];
      const updated = current.map((m) =>
        m.id === messageId ? { ...m, content: newContent, edited: true } : m
      );
      return { ...prev, [activeChannel.id]: updated };
    });
    toast.success('Mensaje editado');
  };

  const createCategory = (name: string) => {
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

    setIsCreateCategoryOpen(false);
    toast.success(`Categoría "${name.toUpperCase()}" creada`);
  };

  const deleteCategory = (categoryId: string) => {
    soundFx.playLeaveVoice();
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== activeServer.id) return s;
        return {
          ...s,
          categories: s.categories.filter((cat) => cat.id !== categoryId),
          channels: s.channels.map((ch) =>
            ch.categoryId === categoryId ? { ...ch, categoryId: undefined } : ch
          ),
        };
      })
    );
    toast.success('Categoría eliminada');
  };

  const updateUserStatus = (status: UserStatus, customStatus?: string) => {
    setCurrentUser((prev) => ({ ...prev, status, customStatus: customStatus ?? prev.customStatus }));
  };

  const deleteServer = (serverId: string) => {
    soundFx.playLeaveVoice();
    const remaining = servers.filter((s) => s.id !== serverId);
    setServers(remaining);
    if (remaining.length > 0) {
      setActiveServerId(remaining[0].id);
      setActiveChannelId(remaining[0].channels[0]?.id || '');
    } else {
      setActiveServerId('');
      setActiveChannelId('');
      setIsDMViewActive(true);
    }
    toast.success('Servidor eliminado');
  };

  const deleteChannel = (channelId: string) => {
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
  const [serverSettingsTab, setServerSettingsTab] = useState<'overview' | 'roles' | 'members'>('roles');

  const createRole = (
    serverId: string,
    roleData: { name: string; color: string; hoist: boolean; permissions: string[] }
  ): Role => {
    soundFx.playReactionAdded();
    const newRoleId = `role_${Date.now()}`;
    const newRole: Role = {
      id: newRoleId,
      name: roleData.name,
      color: roleData.color || '#99AAB5',
      hoist: roleData.hoist ?? true,
      permissions: roleData.permissions || ['SEND_MESSAGES', 'VIEW_CHANNEL'],
    };

    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          roles: [...(s.roles || []), newRole],
        };
      })
    );
    toast.success(`Rol "${newRole.name}" creado`);
    return newRole;
  };

  const updateRole = (serverId: string, roleId: string, updates: Partial<Role>) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          roles: (s.roles || []).map((r) => (r.id === roleId ? { ...r, ...updates } : r)),
        };
      })
    );
    toast.success('Rol actualizado');
  };

  const deleteRole = (serverId: string, roleId: string) => {
    soundFx.playLeaveVoice();
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          roles: (s.roles || []).filter((r) => r.id !== roleId),
          members: (s.members || []).map((m) => ({
            ...m,
            roles: (m.roles || []).filter((rid) => rid !== roleId),
          })),
        };
      })
    );
    toast.success('Rol eliminado');
  };

  const toggleMemberRole = (serverId: string, memberId: string, roleId: string) => {
    soundFx.playReactionAdded();
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          members: (s.members || []).map((m) => {
            if (m.id !== memberId) return m;
            const currentRoles = m.roles || [];
            const hasRole = currentRoles.includes(roleId);
            const nextRoles = hasRole
              ? currentRoles.filter((id) => id !== roleId)
              : [...currentRoles, roleId];
            return {
              ...m,
              roles: nextRoles,
            };
          }),
        };
      })
    );
  };

  const updateServerDetails = (
    serverId: string,
    updates: { name?: string; icon?: string; banner?: string; description?: string }
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
    toast.success('Ajustes del servidor guardados');
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
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
        leaveVoiceChannel,
        toggleMute,
        toggleDeafen,
        toggleCamera,
        toggleScreenShare,
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
        isMemberListOpen,
        setIsMemberListOpen,
        isPinnedDrawerOpen,
        setIsPinnedDrawerOpen,
        profileModalUser,
        openUserProfile,
        closeUserProfile,
        createServer,
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
        twoFactorSecret,
        twoFactorBackupCodes,
        isTwoFactorSetupOpen,
        setIsTwoFactorSetupOpen,
        isTwoFactorBackupOpen,
        setIsTwoFactorBackupOpen,
        isTwoFactorDisableOpen,
        setIsTwoFactorDisableOpen,
        enableTwoFactor,
        disableTwoFactor,
        verifyTwoFactor,
        regenerateBackupCodes,
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
