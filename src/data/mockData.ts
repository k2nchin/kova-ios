import { User, Server, Message, NoteDocument, Story, DMConversation } from '../types';

export const CURRENT_USER: User = {
  id: 'user_juanpi1x',
  username: 'juanpi1x',
  displayName: 'JuanPi1x',
  email: 'infokenchinvfx@gmail.com',
  tag: '0001',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
  bio: '⚡ Streamer & Creador · Servidor Oficial JuanPi1x Community',
  thoughtBubble: 'En directo en Twitch & desarrollando KOVA ✦',
  badges: ['pulse', 'dev', 'quest', 'verified_dev'],
  verified: true,
  status: 'online',
  customStatus: '⚡ JuanPi1x Community Oficial',
  roles: ['1546044377594331246', '828123576086822942'],
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  isScreenSharing: false,
  isCameraOn: false,
};

export const BOT_JUANPI_IA: User = {
  id: 'bot_juanpi_ia',
  username: 'juanpi_ia',
  displayName: 'JuanPi IA',
  tag: 'BOT',
  avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
  bio: '🤖 Bot Oficial de JuanPi1x Community · Avisos y chat en tiempo real',
  thoughtBubble: '⚡ Monitoreando streams & chat en tiempo real',
  badges: ['bot', 'verified_dev', 'quest'],
  status: 'online',
  customStatus: '⚡ Conectado a JuanPi1x Community',
  roles: ['1546059730059788412'],
  activity: {
    type: 'Streaming',
    name: 'JuanPi1x en Twitch / YouTube',
    details: 'Monitoreando chat general & avisos',
  },
};

export const MOCK_USERS: Record<string, User> = {
  user_juanpi1x: CURRENT_USER,
  bot_juanpi_ia: BOT_JUANPI_IA,
};

export const INITIAL_SERVERS: Server[] = [
  {
    id: '783512978086821928',
    name: 'JuanPi1x Community',
    acronym: 'JP',
    ownerId: 'user_juanpi1x',
    description: '⚡ Servidor Oficial de JuanPi1x | Streamer',
    icon: '',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    members: [CURRENT_USER, BOT_JUANPI_IA],
    categories: [
      {
        id: '1546044230240174110',
        name: '📌 │ INFORMACIÓN & STREAM',
        channelIds: [
          '815060736220332052',
          '1546048221422297208',
          '1546051177739845634',
          '1546044293964107857',
          '1546044297734918255',
          '1546044302805835816',
          '1546269805559029790',
          '1546276042438615151',
        ],
      },
      {
        id: '1546044238385385542',
        name: '💬 │ COMUNIDAD & GAMING',
        channelIds: [
          '1546044311236517921',
          '1145054353149919353',
          '1546044315950911550',
          '1546044320472244404',
          '1546044328886149130',
          '1546044333206016101',
        ],
      },
      {
        id: '1546044246564536320',
        name: '🔊 │ SALAS DE VOZ (AUTÓNOMAS)',
        channelIds: [
          '1546280053636079638',
          '1225487533639602176',
          '814987868577333248',
          '816192359133478942',
          '815055525439078410',
          '815066438280413185',
          '1546279425706950767',
        ],
      },
    ],
    channels: [
      // 📌 │ INFORMACIÓN & STREAM
      {
        id: '815060736220332052',
        name: '🌐│redes-sociales',
        type: 'text',
        topic: 'Redes oficiales de JuanPi1x (Twitch, YouTube, TikTok, Instagram, X)',
        categoryId: '1546044230240174110',
      },
      {
        id: '1546048221422297208',
        name: '👋│llegadas',
        type: 'announcements',
        topic: 'Canal oficial de anuncios de nuevos miembros que llegan a la comunidad',
        categoryId: '1546044230240174110',
      },
      {
        id: '1546051177739845634',
        name: '🎭│roles',
        type: 'text',
        topic: 'Selecciona tus roles para recibir notificaciones y personalizar tu perfil',
        categoryId: '1546044230240174110',
      },
      {
        id: '1546044293964107857',
        name: '📢│anuncios',
        type: 'announcements',
        topic: 'Noticias y novedades oficiales de la comunidad',
        categoryId: '1546044230240174110',
      },
      {
        id: '1546044297734918255',
        name: '📜│reglas',
        type: 'text',
        topic: 'Normas de convivencia del servidor JuanPi1x Community',
        categoryId: '1546044230240174110',
      },
      {
        id: '1546044302805835816',
        name: '📡│avisos-directo',
        type: 'announcements',
        topic: 'Notificaciones de directos en Twitch / YouTube',
        categoryId: '1546044230240174110',
      },
      {
        id: '1546269805559029790',
        name: '🎫│soporte-tickets',
        type: 'text',
        topic: 'Crea un ticket de atención privada con JuanPi1x y el equipo de administración.',
        categoryId: '1546044230240174110',
      },
      {
        id: '1546276042438615151',
        name: '📋│auditoría-bot',
        type: 'text',
        topic: 'Registro automático en tiempo real de eventos, moderación, strikes y streams.',
        categoryId: '1546044230240174110',
      },
      // 💬 │ COMUNIDAD & GAMING
      {
        id: '1546044311236517921',
        name: '💡│sugerencias',
        type: 'text',
        topic: 'Ideas y propuestas para directos o el servidor',
        categoryId: '1546044238385385542',
      },
      {
        id: '1145054353149919353',
        name: '🤖│comandos-bots',
        type: 'text',
        topic: 'Comandos oficiales para bots, JuanPi IA y herramientas',
        categoryId: '1546044238385385542',
      },
      {
        id: '1546044315950911550',
        name: '💬│chat-general',
        type: 'text',
        topic: 'Canal principal de conversación para la comunidad de JuanPi1x',
        categoryId: '1546044238385385542',
      },
      {
        id: '1546044320472244404',
        name: '📸│multimedia-clips-y-memes',
        type: 'text',
        topic: 'Comparte tus capturas, jugadas, clips del stream y los mejores memes.',
        categoryId: '1546044238385385542',
      },
      {
        id: '1546044328886149130',
        name: '🎯│buscar-partida',
        type: 'text',
        topic: '🎮 Busca compañeros para cualquier juego: Apex, Overwatch, FIFA, Roblox, etc.',
        categoryId: '1546044238385385542',
      },
      {
        id: '1546044333206016101',
        name: '💎│chat-vip',
        type: 'text',
        isPrivate: true,
        topic: 'Chat exclusivo para miembros VIP y creadores',
        categoryId: '1546044238385385542',
      },
      // 🔊 │ SALAS DE VOZ (AUTÓNOMAS)
      {
        id: '1546280053636079638',
        name: '➕ │ Crear Sala Temporal',
        type: 'voice',
        topic: 'Sala dinámica: entra para generar tu canal de voz privado automático',
        categoryId: '1546044246564536320',
      },
      {
        id: '1225487533639602176',
        name: '🔴 │ En Directo',
        type: 'voice',
        topic: 'Sala de voz especial durante transmisiones en vivo',
        categoryId: '1546044246564536320',
      },
      {
        id: '814987868577333248',
        name: '☕ │ Charla & Chill 1',
        type: 'voice',
        topic: 'Conversación relajada entre miembros',
        categoryId: '1546044246564536320',
      },
      {
        id: '816192359133478942',
        name: '🎵 │ Sala Musical',
        type: 'voice',
        topic: 'Escuchar música en grupo con bots',
        categoryId: '1546044246564536320',
      },
      {
        id: '815055525439078410',
        name: '💤 │ Modo AFK',
        type: 'voice',
        topic: 'Canal oficial de AFK',
        categoryId: '1546044246564536320',
      },
      {
        id: '815066438280413185',
        name: '👑 │ Lounge VIP',
        type: 'voice',
        topic: 'Lounge exclusivo para suscriptores y VIPs',
        categoryId: '1546044246564536320',
      },
      {
        id: '1546279425706950767',
        name: '🎮 │ Gaming Squad',
        type: 'voice',
        topic: 'Canal de voz para squads de juego',
        categoryId: '1546044246564536320',
      },
    ],
    roles: [
      {
        id: '1546044377594331246',
        name: '👑 ┃ OWNER & FUNDADOR',
        color: '#ffd700',
        hoist: true,
        permissions: ['ADMINISTRATOR', 'MANAGE_GUILD', 'MANAGE_CHANNELS', 'MANAGE_ROLES'],
      },
      {
        id: '1546059730059788412',
        name: '🤖 ┃ JUANPI IA (BOT OFICIAL)',
        color: '#00f5d4',
        hoist: true,
        permissions: ['ADMINISTRATOR', 'SEND_MESSAGES', 'EMBED_LINKS'],
      },
      {
        id: '828123576086822942',
        name: '🎮🕹 STREAMERS',
        color: '#e91e63',
        hoist: true,
        permissions: ['PRIORITY_SPEAKER', 'STREAM', 'CONNECT'],
      },
      {
        id: '1546044381058965504',
        name: '🛡️ ┃ MODERADOR SUPREMO',
        color: '#00d2d3',
        hoist: true,
        permissions: ['KICK_MEMBERS', 'BAN_MEMBERS', 'MANAGE_MESSAGES'],
      },
      {
        id: '1546044384175333387',
        name: '💎 ┃ VIP PASS',
        color: '#f1c40f',
        hoist: true,
        permissions: ['CONNECT', 'SPEAK', 'ATTACH_FILES'],
      },
      {
        id: '1546044387773911120',
        name: '👥 ┃ MIEMBRO VERIFICADO',
        color: '#485460',
        hoist: true,
        permissions: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
      },
      {
        id: '1546051168805847101',
        name: '🔔 ┃ AVISOS DIRECTOS',
        color: '#ff3838',
        hoist: false,
        permissions: ['MENTION_EVERYONE'],
      },
      {
        id: '1546051175156285440',
        name: '🎮 ┃ GAMER SQUAD',
        color: '#7158e2',
        hoist: false,
        permissions: ['CONNECT', 'SPEAK'],
      },
      {
        id: '1546053823167209512',
        name: '🚀 ┃ SERVER BOOSTER',
        color: '#f47fff',
        hoist: true,
        permissions: ['ATTACH_FILES', 'USE_EXTERNAL_EMOJIS'],
      },
    ],
  },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {};

export const INITIAL_NOTES: NoteDocument[] = [
  {
    id: 'note_1',
    title: '🎯 Roadmap & Metas Kova 2026',
    tags: ['Arquitectura', 'Prioridad Alta', 'Core'],
    lastEdited: 'Hace 10 minutos por Juanpi',
    content: `# 🚀 Kova Platform Roadmap

## ⚡ Q1: Core Performance & Voice
- [x] Arquitectura base de la aplicación lista
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
- **Supresión de Ruido**: Algoritmo neural de reducción de ruido
- **Latencia estimada P2P**: 8ms a 24ms según región
- **Audio Espacial 3D**: Simulación HRTF para salas de voz grandes`,
  },
];

export const INITIAL_STORIES: Story[] = [];

export const INITIAL_DM_CONVERSATIONS: DMConversation[] = [];
