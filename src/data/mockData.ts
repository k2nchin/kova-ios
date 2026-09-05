import { User, Server, Message, NoteDocument, Story, DMConversation } from '../types';

export const CURRENT_USER: User = {
  id: 'user_me',
  username: 'juanpi1x',
  displayName: 'juanpi1x ツ',
  tag: '0001',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
  bio: 'Tired of life 🥷\nAparataje Music Group',
  thoughtBubble: 'Elige una criatura mítica como mascota',
  badges: ['nitro', 'hypesquad', 'leaf', 'gift', 'dev', 'quest', 'gaming'],
  status: 'dnd',
  customStatus: 'Tired of life 🥷',
  activity: {
    type: 'Coding',
    name: 'Kova Desktop App',
    details: 'Rust + Tauri v2 + React 19',
  },
  roles: ['role_men', 'role_comunidad', 'role_amigos', 'role_verificados', 'role_pc'],
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  isScreenSharing: false,
  isCameraOn: false,
};

export const MOCK_USERS: Record<string, User> = {
  user_me: CURRENT_USER,
  user_ai: {
    id: 'user_ai',
    username: 'kova_ai',
    displayName: 'Kova AI Core ✦',
    tag: 'BOT',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bio: 'Asistente de inteligencia artificial nativo de Kova. Resúmenes de canales, análisis de código y traducción instantánea.',
    status: 'online',
    customStatus: '🧠 Inteligencia activa en tiempo real',
    roles: ['role_bot', 'role_ai'],
  },
  user_elena: {
    id: 'user_elena',
    username: 'elena_cyber',
    displayName: 'Elena Vance',
    tag: '4042',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Senior Rust Architect & Systems Engineer. Baja latencia y sistemas distribuidos.',
    status: 'online',
    customStatus: '🦀 Compilando WebRTC Core a 0.8ms',
    activity: {
      type: 'Coding',
      name: 'tauri-plugin-webrtc',
    },
    roles: ['role_core', 'role_dev'],
  },
  user_alex: {
    id: 'user_alex',
    username: 'alex_visuals',
    displayName: 'Alex Rivers',
    tag: '8821',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    bio: 'Lead UI/UX Designer. Creando interfaces de usuario con diseño moderno y dinámico.',
    status: 'idle',
    customStatus: '🎨 Diseñando interfaces cyber-minimalistas',
    roles: ['role_design'],
  },
  user_marcus: {
    id: 'user_marcus',
    username: 'marcus_audio',
    displayName: 'Marcus Void',
    tag: '1337',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Ingeniero de procesamiento de audio DSP. Calibrando cancelación de ruido Kova Crisp.',
    status: 'dnd',
    customStatus: '🎧 Testeando audio espacial 3D',
    roles: ['role_audio'],
  },
  user_sophia: {
    id: 'user_sophia',
    username: 'sophia_ai',
    displayName: 'Dr. Sophia Chen',
    tag: '9009',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    bio: 'Investigadora en IA y modelos generativos multimodales en tiempo real.',
    status: 'online',
    customStatus: '✨ Modelo de síntesis neural activo',
    roles: ['role_ai_lead'],
  },
};

export const INITIAL_SERVERS: Server[] = [
  {
    id: 'server_kova',
    name: 'Kova Official Space',
    acronym: 'KO',
    themeGradient: 'from-purple-600 via-indigo-600 to-cyan-500',
    description: 'Servidor central oficial de Kova Community & Development.',
    ownerId: 'user_me',
    categories: [
      {
        id: 'cat_info',
        name: 'INFORMACIÓN',
        channelIds: ['chan_anuncios', 'chan_reglas'],
      },
      {
        id: 'cat_text',
        name: 'CANALES DE TEXTO',
        channelIds: ['chan_general', 'chan_ideas', 'chan_notes'],
      },
      {
        id: 'cat_voice',
        name: 'CANALES DE VOZ (HD)',
        channelIds: ['chan_voice_main', 'chan_voice_gaming', 'chan_voice_dev', 'chan_voice_lofi'],
      },
    ],
    channels: [
      {
        id: 'chan_anuncios',
        name: 'anuncios',
        type: 'announcements',
        topic: 'Anuncios oficiales y actualizaciones de la plataforma Kova.',
        categoryId: 'cat_info',
      },
      {
        id: 'chan_reglas',
        name: 'reglas-y-bienvenida',
        type: 'text',
        topic: 'Reglas de la comunidad y directrices del servidor.',
        categoryId: 'cat_info',
      },
      {
        id: 'chan_general',
        name: 'general',
        type: 'text',
        topic: 'Charla general de la comunidad Kova.',
        categoryId: 'cat_text',
      },
      {
        id: 'chan_ideas',
        name: 'ideas-y-feedback',
        type: 'text',
        topic: 'Sugerencias, nuevas características y feedback de la app.',
        categoryId: 'cat_text',
      },
      {
        id: 'chan_notes',
        name: 'roadmap-notas',
        type: 'notes',
        topic: 'Documentación colaborativa y minutas de reuniones.',
        categoryId: 'cat_text',
      },
      {
        id: 'chan_voice_main',
        name: 'Voz Principal (HD 96kHz)',
        type: 'voice',
        topic: 'Audio de alta fidelidad, baja latencia WebRTC.',
        categoryId: 'cat_voice',
        connectedUsers: ['user_elena', 'user_marcus'],
      },
      {
        id: 'chan_voice_gaming',
        name: 'Gaming & Chill',
        type: 'voice',
        topic: 'Canal de voz para partidas y streaming en vivo.',
        categoryId: 'cat_voice',
      },
      {
        id: 'chan_voice_dev',
        name: 'Sala Devs (0.1ms)',
        type: 'voice',
        topic: 'Discusiones de código, WebGPU, Tauri v2 y Rust.',
        categoryId: 'cat_voice',
        connectedUsers: ['user_alex'],
      },
      {
        id: 'chan_voice_lofi',
        name: 'Radio Lo-Fi 24/7',
        type: 'voice',
        topic: 'Música instrumental relajante las 24 horas.',
        categoryId: 'cat_voice',
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
        name: '⚡ Kova Core Team',
        color: '#06b6d4',
        hoist: true,
        permissions: ['MANAGE_CHANNELS', 'SEND_MESSAGES'],
      },
    ],
    members: [
      CURRENT_USER,
      MOCK_USERS.user_elena,
      MOCK_USERS.user_marcus,
      MOCK_USERS.user_alex,
      MOCK_USERS.user_sophia,
      MOCK_USERS.user_ai,
    ],
  },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  chan_general: [
    {
      id: 'msg_welcome_1',
      channelId: 'chan_general',
      author: MOCK_USERS.user_elena,
      content: '¡Hola a todos! Acabo de hacer push al pipeline de audio WebRTC en Rust. La latencia bajó a menos de 1.2ms en las pruebas de audio local. 🚀',
      timestamp: 'Hoy a las 10:14',
      reactions: [
        { emoji: '🔥', count: 4, users: ['user_me', 'user_alex', 'user_marcus'] },
        { emoji: '🦀', count: 5, users: ['user_me', 'user_marcus'] },
      ],
      codeBlock: {
        language: 'rust',
        code: `pub fn start_low_latency_audio_stream(sample_rate: u32) -> Result<String, String> {
  println!("Iniciando DSP con {}Hz", sample_rate);
  Ok("Audio Engine conectado con latencia < 1.2ms".to_string())
}`,
      },
    },
    {
      id: 'msg_welcome_2',
      channelId: 'chan_general',
      author: MOCK_USERS.user_alex,
      content: 'El consumo de memoria se mantiene en apenas 78 MB de RAM frente a los más de 500 MB que consume Electron. La arquitectura de Kova es increíble.',
      timestamp: 'Hoy a las 10:20',
      reactions: [
        { emoji: '⚡', count: 3, users: ['user_elena', 'user_me'] },
        { emoji: '❤️', count: 2, users: ['user_marcus'] },
      ],
    },
    {
      id: 'msg_welcome_3',
      channelId: 'chan_general',
      author: MOCK_USERS.user_ai,
      content: '✦ **Kova AI**: Se han detectado 2 canales de voz listos para pruebas con audio espacial y notas sincronizadas en tiempo real.',
      timestamp: 'Hoy a las 10:22',
      aiGenerated: true,
      reactions: [{ emoji: '✨', count: 4, users: ['user_me', 'user_elena'] }],
    },
  ],
  chan_anuncios: [
    {
      id: 'msg_announcement_1',
      channelId: 'chan_anuncios',
      author: CURRENT_USER,
      content: '¡Bienvenidos a todos al espacio oficial de Kova! Estamos construyendo una plataforma ultrarrápida, ligera y con audio HD.',
      timestamp: 'Ayer a las 18:00',
      pinned: true,
      reactions: [{ emoji: '🎉', count: 6, users: ['user_elena', 'user_marcus', 'user_alex'] }],
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
