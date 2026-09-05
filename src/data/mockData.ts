import { User, Server, Message, NoteDocument, Story, DMConversation } from '../types';

export const CURRENT_USER: User = {
  id: 'user_me',
  username: 'explorador',
  displayName: 'Explorador',
  tag: '0001',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
  bio: 'Diseñando el futuro ✦ KOVA Suite',
  thoughtBubble: 'Construyendo el futuro de KOVA',
  badges: ['nitro', 'dev', 'quest'],
  status: 'online',
  customStatus: 'Diseñando el futuro',
  roles: ['role_owner_server_kova', 'role_core_server_kova'],
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  isScreenSharing: false,
  isCameraOn: false,
};

export const MOCK_USERS: Record<string, User> = {
  user_me: CURRENT_USER,
  user_dfighj: {
    id: 'user_dfighj',
    username: 'dfighj',
    displayName: 'dfighj',
    tag: '1337',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    customStatus: 'Explorando KOVA',
    roles: ['role_owner_server_kova'],
  },
  user_mika: {
    id: 'user_mika',
    username: 'mika',
    displayName: 'Mika',
    tag: '4042',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    customStatus: 'Listo para ayudar',
    roles: ['role_core_server_kova'],
  },
  user_kova_bot: {
    id: 'user_kova_bot',
    username: 'kova_bot',
    displayName: 'KOVA',
    tag: 'BOT',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bio: 'Bot oficial de bienvenida y soporte para KOVA Suite.',
    status: 'online',
    customStatus: 'Siempre disponible',
    roles: ['role_bot'],
  },
  user_sofia: {
    id: 'user_sofia',
    username: 'sofia',
    displayName: 'Sofia',
    tag: '9009',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    customStatus: 'Creando experiencias',
    roles: ['role_core_server_kova'],
  },
  user_prueba: {
    id: 'user_prueba',
    username: 'prueba',
    displayName: 'PruebaUsuario',
    tag: '0042',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
  },
  user_carlos: {
    id: 'user_carlos',
    username: 'carlos',
    displayName: 'Carlos',
    tag: '1092',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
  },
  user_andres: {
    id: 'user_andres',
    username: 'andres',
    displayName: 'Andrés',
    tag: '3310',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    status: 'offline',
  },
};

export const INITIAL_SERVERS: Server[] = [
  {
    id: 'server_kova',
    name: 'KOVA Suite',
    acronym: 'KS',
    themeGradient: 'from-purple-600 via-indigo-600 to-cyan-500',
    description: 'Espacio principal de KOVA Suite.',
    ownerId: 'user_dfighj',
    categories: [
      {
        id: 'cat_main',
        name: 'CANALES',
        channelIds: ['chan_general', 'chan_anuncios', 'chan_diseno', 'chan_feedback', 'chan_soporte', 'chan_lounge'],
      },
    ],
    channels: [
      {
        id: 'chan_general',
        name: 'general',
        type: 'text',
        topic: 'Canal de bienvenida',
        categoryId: 'cat_main',
      },
      {
        id: 'chan_anuncios',
        name: 'anuncios',
        type: 'text',
        topic: 'Canal de anuncios oficiales',
        categoryId: 'cat_main',
      },
      {
        id: 'chan_diseno',
        name: 'diseño',
        type: 'text',
        topic: 'Discusión y propuestas de diseño UI/UX',
        categoryId: 'cat_main',
      },
      {
        id: 'chan_feedback',
        name: 'feedback',
        type: 'text',
        topic: 'Ideas, sugerencias y comentarios',
        categoryId: 'cat_main',
      },
      {
        id: 'chan_soporte',
        name: 'soporte',
        type: 'text',
        topic: 'Soporte técnico y ayuda a la comunidad',
        categoryId: 'cat_main',
      },
      {
        id: 'chan_lounge',
        name: 'Lounge',
        type: 'voice',
        topic: 'Sala de voz Lounge KOVA Suite',
        categoryId: 'cat_main',
        connectedUsers: ['user_dfighj', 'user_me'],
      },
    ],
    roles: [
      {
        id: 'role_owner_server_kova',
        name: '👑 Propietario',
        color: '#FFB800',
        hoist: true,
        permissions: ['ADMINISTRATOR'],
      },
      {
        id: 'role_core_server_kova',
        name: '⚡ Miembro',
        color: '#7c3aed',
        hoist: true,
        permissions: ['MANAGE_CHANNELS', 'SEND_MESSAGES'],
      },
    ],
    members: [
      MOCK_USERS.user_dfighj,
      CURRENT_USER,
      MOCK_USERS.user_mika,
      MOCK_USERS.user_kova_bot,
      MOCK_USERS.user_sofia,
      MOCK_USERS.user_prueba,
      MOCK_USERS.user_carlos,
      MOCK_USERS.user_andres,
    ],
  },
  {
    id: 'server_nebula',
    name: 'Proyecto Nebula',
    acronym: 'PN',
    themeGradient: 'from-indigo-600 to-purple-800',
    description: 'Espacio de trabajo para Proyecto Nebula.',
    ownerId: 'user_me',
    categories: [
      {
        id: 'cat_nebula',
        name: 'CANALES',
        channelIds: ['chan_nebula_gen'],
      },
    ],
    channels: [
      {
        id: 'chan_nebula_gen',
        name: 'general',
        type: 'text',
        topic: 'Canal general de Proyecto Nebula',
        categoryId: 'cat_nebula',
      },
    ],
    roles: [],
    members: [CURRENT_USER, MOCK_USERS.user_dfighj],
  },
  {
    id: 'server_creators',
    name: 'Team Creators',
    acronym: 'TC',
    themeGradient: 'from-emerald-600 to-teal-800',
    description: 'Comunidad de creadores de contenido.',
    ownerId: 'user_me',
    categories: [
      {
        id: 'cat_creators',
        name: 'CANALES',
        channelIds: ['chan_creators_gen'],
      },
    ],
    channels: [
      {
        id: 'chan_creators_gen',
        name: 'general',
        type: 'text',
        topic: 'Canal de creadores',
        categoryId: 'cat_creators',
      },
    ],
    roles: [],
    members: [CURRENT_USER, MOCK_USERS.user_sofia],
  },
  {
    id: 'server_privado',
    name: 'Privado',
    acronym: 'PR',
    themeGradient: 'from-zinc-700 to-neutral-900',
    description: 'Espacio confidencial restringido.',
    ownerId: 'user_me',
    categories: [
      {
        id: 'cat_privado',
        name: 'CANALES',
        channelIds: ['chan_privado_gen'],
      },
    ],
    channels: [
      {
        id: 'chan_privado_gen',
        name: 'general',
        type: 'text',
        topic: 'Canal privado y seguro',
        categoryId: 'cat_privado',
      },
    ],
    roles: [],
    members: [CURRENT_USER],
  },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  chan_general: [
    {
      id: 'msg_welcome_1',
      channelId: 'chan_general',
      author: MOCK_USERS.user_dfighj,
      content: '¡Hola a todos! 👋\nListo para construir algo increíble.',
      timestamp: '12:05',
      reactions: [
        { emoji: '🚀', count: 3, users: ['user_me', 'user_mika', 'user_sofia'] },
      ],
    },
    {
      id: 'msg_welcome_2',
      channelId: 'chan_general',
      author: MOCK_USERS.user_kova_bot,
      content: 'Recuerda revisar nuestros canales y las reglas del servidor.',
      timestamp: '12:06',
      reactions: [],
      actionCard: {
        title: 'Ver reglas',
        action: 'open_rules',
      },
    },
  ],
};

export const INITIAL_NOTES: NoteDocument[] = [
  {
    id: 'note_1',
    title: '🎯 Roadmap & Metas Kova 2026',
    tags: ['Arquitectura', 'Prioridad Alta', 'Core'],
    lastEdited: 'Hace 10 minutos por Juanpi',
    content: `# 🚀 Kova Platform Roadmap

## ⚡ Q1: Core Performance & Voice
- [x] Scaffolding Tauri v2 + React 19
- [x] Motor de diseño Glassmorphism Cyber-Dark
- [x] Mensajería en tiempo real y syntax highlighting
- [x] Kova AI Assistant nativo con resúmenes contextuales
- [x] Canales de Voz WebRTC & cancelador de ruido
- [x] Editor de notas Markdown colaborativo
- [x] Historias de estado estilo Discord/Instagram con visor dinámico

## 🌐 Q2: Ecosistema & Extensiones
- [ ] Soundboard interactivo con sonidos de comunidad
- [ ] Compartir pantalla 4K 60FPS con audio de sistema
- [ ] Cifrado de extremo a extremo (E2EE) en DMs
- [ ] Aplicaciones nativas de escritorio`,
  },
  {
    id: 'note_2',
    title: '🎧 Especificaciones de Audio DSP & Codec Opus',
    tags: ['Audio', 'WebRTC', 'DSP'],
    lastEdited: 'Ayer por Marcus Void',
    content: `# Pipeline de Audio Kova

- **Codec**: Opus Fullband (48 kHz, 64-128 kbps adaptable)
- **Supresión de Ruido**: Algoritmo Neural RNNoise integrado en Rust
- **Latencia estimada P2P**: 8ms a 24ms según región
- **Audio Espacial 3D**: Simulación HRTF para salas de voz grandes`,
  },
];

export const INITIAL_STORIES: Story[] = [];

export const INITIAL_DM_CONVERSATIONS: DMConversation[] = [];
