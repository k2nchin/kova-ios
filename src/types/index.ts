export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface User {
  id: string;
  username: string;
  displayName: string;
  tag: string;
  avatar: string;
  banner?: string;
  bio?: string;
  thoughtBubble?: string;
  badges?: string[];
  status: UserStatus;
  customStatus?: string;
  activity?: {
    type: 'Playing' | 'Listening' | 'Coding' | 'Streaming';
    name: string;
    details?: string;
  };
  roles?: string[];
  isMuted?: boolean;
  isDeafened?: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
  isCameraOn?: boolean;
  radarPos?: { x: number; y: number }; // 2D/3D Spatial Audio Coordinate (-100 to 100)
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
}

export type ChannelType = 'text' | 'voice' | 'notes' | 'announcements' | 'forum';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  topic?: string;
  categoryId?: string;
  unreadCount?: number;
  isPrivate?: boolean;
  userLimit?: number;
  connectedUsers?: string[];
  slowmode?: number;
}

export interface ChannelCategory {
  id: string;
  name: string;
  channelIds: string[];
}

export interface Role {
  id: string;
  name: string;
  color: string;
  hoist: boolean;
  mentionable?: boolean;
  position?: number;
  permissions: string[];
}

export interface Server {
  id: string;
  name: string;
  icon?: string;
  acronym: string;
  banner?: string;
  description: string;
  ownerId: string;
  themeGradient?: string;
  categories: ChannelCategory[];
  channels: Channel[];
  roles: Role[];
  members: User[];
  unread?: boolean;
  mentionCount?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Attachment {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'audio';
  size: string;
}

export interface Message {
  id: string;
  channelId: string;
  author: User;
  content: string;
  timestamp: string;
  edited?: boolean;
  pinned?: boolean;
  aiGenerated?: boolean;
  translatedText?: string;
  replyTo?: {
    id: string;
    authorName: string;
    content: string;
  };
  reactions: Reaction[];
  attachments?: Attachment[];
  codeBlock?: {
    language: string;
    code: string;
  };
  voiceNote?: {
    duration: number;
  };
  threadCount?: number;
  actionCard?: {
    title: string;
    action: string;
  };
}

export interface Thread {
  id: string;
  parentMessageId: string;
  channelId: string;
  title: string;
  messages: Message[];
  participantCount: number;
}

export interface NoteDocument {
  id: string;
  title: string;
  content: string;
  lastEdited: string;
  tags: string[];
}

export interface Story {
  id: string;
  author: User;
  mediaUrl?: string;
  text?: string;
  backgroundColor?: string;
  createdAt: string;
  views: number;
  likes: number;
}

export interface DirectMessage {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
}

export interface DMConversation {
  id: string;
  user: User;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  messages: DirectMessage[];
}

export type WorkspaceLayoutMode =
  | 'bento_master'
  | 'split'
  | 'chat_focus'
  | 'stories_feed'
  | 'pulse_feed'
  | 'voice_radar'
  | 'direct_messages';

export interface BotAutoResponse {
  trigger: string;
  response: string;
}

export interface BotCommand {
  name: string;
  description: string;
  usage: string;
}

export interface KovaBot {
  id: string;
  name: string;
  tag: string;
  username: string;
  avatar: string;
  banner?: string;
  description: string;
  category: 'music' | 'moderation' | 'ai' | 'fun' | 'gaming' | 'utility' | 'custom';
  prefix: string;
  isAiPowered: boolean;
  systemPrompt?: string;
  autoResponses?: BotAutoResponse[];
  commands: BotCommand[];
  installedServers: string[];
  createdBy?: string;
  developerName?: string;
  verified?: boolean;
}
