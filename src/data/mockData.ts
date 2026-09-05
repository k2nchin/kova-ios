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
};

export const INITIAL_SERVERS: Server[] = [];

export const INITIAL_MESSAGES: Record<string, Message[]> = {};

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
