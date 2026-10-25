import { soundFx } from './soundEffects';

/** Chosen sound for mute/unmute, stored per device. */
export type MuteSoundStyle = 'clic' | 'suave' | 'ninguno';
const MUTE_STYLE_KEY = 'kova.voice.muteSound';

export const getMuteSoundStyle = (): MuteSoundStyle => {
  try {
    const value = localStorage.getItem(MUTE_STYLE_KEY);
    return value === 'suave' || value === 'ninguno' ? value : 'clic';
  } catch {
    return 'clic';
  }
};

export const setMuteSoundStyle = (style: MuteSoundStyle) => {
  try { localStorage.setItem(MUTE_STYLE_KEY, style); } catch {}
};

let current: HTMLAudioElement | null = null;

/**
 * Plays someone's custom join sound (an uploaded audio URL), cut after 4 s.
 * Falls back to Kova's default chime when there's no sound or it fails.
 */
export const playJoinSound = (url?: string) => {
  if (!soundFx.isEnabled()) return;
  if (!url) { soundFx.playJoinVoice(); return; }
  try {
    current?.pause();
    const audio = new Audio(url);
    audio.volume = Math.min(1, 0.7 * soundFx.getMasterVolume());
    current = audio;
    const stop = window.setTimeout(() => audio.pause(), 4000);
    audio.addEventListener('ended', () => window.clearTimeout(stop));
    audio.play().catch(() => { window.clearTimeout(stop); soundFx.playJoinVoice(); });
  } catch {
    soundFx.playJoinVoice();
  }
};
