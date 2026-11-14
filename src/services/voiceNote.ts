// Voice notes: records your microphone in the composer and returns an audio file.
export interface VoiceNoteRecording {
  /** Live microphone stream, for level meters while recording. */
  stream: MediaStream;
  stop: () => Promise<{ file: File; duration: number } | null>;
  cancel: () => void;
}

export const MAX_VOICE_NOTE_SECONDS = 300;

export async function startVoiceNote(): Promise<VoiceNoteRecording> {
  if (typeof MediaRecorder === 'undefined') throw new Error('Este dispositivo no permite grabar notas de voz.');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'].find((type) => MediaRecorder.isTypeSupported(type)) || '';
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 48_000 } : undefined);
  const chunks: Blob[] = [];
  const startedAt = Date.now();
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  recorder.start(250);
  const release = () => stream.getTracks().forEach((track) => track.stop());
  const autoStop = window.setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, MAX_VOICE_NOTE_SECONDS * 1000);

  return {
    stream,
    stop: () => new Promise((resolve) => {
      window.clearTimeout(autoStop);
      const finish = () => {
        release();
        const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type });
        if (blob.size < 1500) { resolve(null); return; }
        const ext = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm';
        resolve({ file: new File([blob], `nota-de-voz.${ext}`, { type: type.split(';')[0] }), duration: Math.min(duration, MAX_VOICE_NOTE_SECONDS) });
      };
      if (recorder.state === 'inactive') finish();
      else { recorder.onstop = finish; recorder.stop(); }
    }),
    cancel: () => {
      window.clearTimeout(autoStop);
      recorder.onstop = null;
      if (recorder.state !== 'inactive') recorder.stop();
      release();
    },
  };
}

/** Voice notes inside text-only messages (direct messages): `[[kova-voice:URL|seconds]]`. */
const VOICE_TOKEN = /^\[\[kova-voice:(https?:\/\/\S+?|\/\S+?)\|(\d+)\]\]$/;
export const encodeVoiceNote = (url: string, duration: number) => `[[kova-voice:${url}|${Math.round(duration)}]]`;
export const decodeVoiceNote = (content: string): { url: string; duration: number } | null => {
  const m = content.trim().match(VOICE_TOKEN);
  return m ? { url: m[1], duration: Number(m[2]) } : null;
};
export const previewText = (content: string) => (decodeVoiceNote(content) ? '🎤 Nota de voz' : content);
