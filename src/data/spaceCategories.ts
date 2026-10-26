// Categories a public space can be listed under in Discover (same ids as the server).
export const SPACE_CATEGORIES = [
  { id: 'gaming', label: 'Videojuegos', emoji: '🎮' },
  { id: 'music', label: 'Música', emoji: '🎵' },
  { id: 'dev', label: 'Programación', emoji: '💻' },
  { id: 'ai', label: 'IA', emoji: '🤖' },
  { id: 'art', label: 'Arte y diseño', emoji: '🎨' },
  { id: 'study', label: 'Estudio', emoji: '📚' },
  { id: 'anime', label: 'Anime', emoji: '🌸' },
  { id: 'sports', label: 'Deportes', emoji: '⚽' },
  { id: 'community', label: 'Comunidad', emoji: '💬' },
];
export const categoryLabel = (id: string) => SPACE_CATEGORIES.find((category) => category.id === id)?.label || 'Comunidad';
