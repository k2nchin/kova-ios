import { User, NoteDocument } from '../types';

/**
 * Placeholder profile used before sign-in. The real profile replaces it as soon as
 * the server answers, so it must not contain anyone's personal data.
 */
export const CURRENT_USER: User = {
  id: 'user_local',
  username: 'usuario',
  displayName: 'Usuario',
  tag: '0000',
  avatar: '',
  status: 'online',
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  isScreenSharing: false,
  isCameraOn: false,
};

export const INITIAL_NOTES: NoteDocument[] = [];
