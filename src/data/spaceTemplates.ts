import type { Channel, ChannelCategory, ChannelType } from '../types';

export type SpaceTemplateId = 'amigos' | 'comunidad' | 'gaming' | 'trabajo' | 'otro';

interface TemplateChannel {
  name: string;
  type: ChannelType;
  topic: string;
}

export interface SpaceTemplate {
  id: SpaceTemplateId;
  title: string;
  description: string;
  sections: Array<{ name: string; channels: TemplateChannel[] }>;
}

/** Starting structures offered when someone creates a space. */
export const SPACE_TEMPLATES: SpaceTemplate[] = [
  {
    id: 'amigos',
    title: 'Amigos',
    description: 'Para charlar, hacer planes y jugar juntos.',
    sections: [
      { name: 'Texto', channels: [
        { name: 'general', type: 'text', topic: 'Charla del día a día' },
        { name: 'planes', type: 'text', topic: 'Quedadas, salidas y eventos' },
        { name: 'clips-y-memes', type: 'text', topic: 'Lo que te hizo reír hoy' },
      ] },
      { name: 'Voz', channels: [
        { name: 'Charla', type: 'voice', topic: 'Para hablar sin prisa' },
        { name: 'Juegos', type: 'voice', topic: 'Para jugar en equipo' },
      ] },
    ],
  },
  {
    id: 'comunidad',
    title: 'Comunidad',
    description: 'Un club o una comunidad con normas y anuncios.',
    sections: [
      { name: 'Información', channels: [
        { name: 'bienvenida', type: 'announcements', topic: 'Qué es este espacio y cómo empezar' },
        { name: 'normas', type: 'text', topic: 'Normas de convivencia' },
        { name: 'anuncios', type: 'announcements', topic: 'Novedades importantes' },
      ] },
      { name: 'Texto', channels: [
        { name: 'general', type: 'text', topic: 'Conversación abierta' },
        { name: 'presentaciones', type: 'text', topic: 'Cuéntanos quién eres' },
      ] },
      { name: 'Voz', channels: [
        { name: 'Sala común', type: 'voice', topic: 'Voz abierta para todos' },
        { name: 'Eventos', type: 'voice', topic: 'Charlas y actividades' },
      ] },
    ],
  },
  {
    id: 'gaming',
    title: 'Gaming',
    description: 'Busca grupo, comparte jugadas y entra en partida.',
    sections: [
      { name: 'Texto', channels: [
        { name: 'general', type: 'text', topic: 'Todo sobre los juegos del grupo' },
        { name: 'buscar-grupo', type: 'text', topic: '¿Quién se conecta?' },
        { name: 'mejores-jugadas', type: 'text', topic: 'Clips y capturas' },
      ] },
      { name: 'Voz', channels: [
        { name: 'Escuadra 1', type: 'voice', topic: 'Partida en curso' },
        { name: 'Escuadra 2', type: 'voice', topic: 'Partida en curso' },
        { name: 'Sala de espera', type: 'voice', topic: 'Entre partidas' },
      ] },
    ],
  },
  {
    id: 'trabajo',
    title: 'Trabajo o estudio',
    description: 'Proyectos, recursos y reuniones del equipo.',
    sections: [
      { name: 'Texto', channels: [
        { name: 'general', type: 'text', topic: 'Comunicación diaria' },
        { name: 'proyectos', type: 'text', topic: 'Tareas y entregas' },
        { name: 'recursos', type: 'text', topic: 'Documentos y enlaces útiles' },
      ] },
      { name: 'Notas', channels: [
        { name: 'acuerdos', type: 'notes', topic: 'Decisiones y minutas' },
      ] },
      { name: 'Voz', channels: [
        { name: 'Reuniones', type: 'voice', topic: 'Llamadas del equipo' },
        { name: 'Concentración', type: 'voice', topic: 'Trabajar juntos en silencio' },
      ] },
    ],
  },
  {
    id: 'otro',
    title: 'Desde cero',
    description: 'Un canal de texto y uno de voz. El resto lo decides tú.',
    sections: [
      { name: 'Texto', channels: [{ name: 'general', type: 'text', topic: 'Conversación general' }] },
      { name: 'Voz', channels: [{ name: 'General', type: 'voice', topic: 'Voz abierta' }] },
    ],
  },
];

/** Builds the categories and channels of a template with ids unique to the space. */
export const buildSpaceStructure = (templateId: SpaceTemplateId, spaceId: string) => {
  const template = SPACE_TEMPLATES.find((item) => item.id === templateId) || SPACE_TEMPLATES[SPACE_TEMPLATES.length - 1];
  const categories: ChannelCategory[] = [];
  const channels: Channel[] = [];
  template.sections.forEach((section, sectionIndex) => {
    const categoryId = `cat_${sectionIndex}_${spaceId}`;
    const channelIds = section.channels.map((channel, channelIndex) => {
      const id = `chan_${sectionIndex}_${channelIndex}_${spaceId}`;
      channels.push({ id, name: channel.name, type: channel.type, topic: channel.topic, categoryId });
      return id;
    });
    categories.push({ id: categoryId, name: section.name, channelIds });
  });
  return { categories, channels };
};
