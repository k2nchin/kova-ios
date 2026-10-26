// Call notes: records YOUR microphone in ~90 s clips and sends each one to be
// transcribed. Only runs while you have "Notas de la llamada" on.
import { api } from './apiClient';

const CLIP_MS = 90_000;

const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

export async function startCallNotes(channelId: string, onError: (message: string) => void) {
  if (typeof MediaRecorder === 'undefined') throw new Error('Este dispositivo no permite grabar notas de la llamada.');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type)) || '';
  let stopped = false;
  let recorder: MediaRecorder | null = null;
  let timer: number | undefined;

  const send = async (blob: Blob) => {
    if (blob.size < 2000) return; // basically silence
    try {
      await api.transcribeCallClip(channelId, await toBase64(blob), blob.type || mimeType);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo transcribir un fragmento.');
    }
  };

  // One recorder per clip so every upload is a complete, playable file.
  const record = () => {
    if (stopped) return;
    const chunks: Blob[] = [];
    recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 24_000 } : { audioBitsPerSecond: 24_000 });
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => {
      void send(new Blob(chunks, { type: recorder?.mimeType || mimeType }));
      record();
    };
    recorder.start();
    timer = window.setTimeout(() => { if (recorder?.state === 'recording') recorder.stop(); }, CLIP_MS);
  };
  record();

  return () => {
    stopped = true;
    window.clearTimeout(timer);
    if (recorder?.state === 'recording') recorder.stop(); // sends the last clip
    window.setTimeout(() => stream.getTracks().forEach((track) => track.stop()), 300);
  };
}
