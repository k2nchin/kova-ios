// Native screen/window sharing for the desktop app (no browser picker):
// Kova lists sources itself and turns JPEG frames from Rust into a video track.
import { invoke } from '@tauri-apps/api/core';

export interface CaptureSource {
  id: string;
  kind: 'screen' | 'window';
  name: string;
  appName: string;
  thumbnail: string;
}

export interface ShareQuality {
  label: string;
  maxWidth: number;
  fps: number;
  /** JPEG quality of each captured frame (higher = sharper text). */
  jpeg: number;
  /** Upload bitrate for the shared video, in bits per second. */
  bitrate: number;
  /** 'detail' keeps text sharp; 'motion' keeps games smooth. */
  hint: 'detail' | 'motion';
}

// Free for everyone: no paid tier for HD sharing in Kova.
export const SHARE_QUALITIES: ShareQuality[] = [
  { label: 'Alta · 1080p · 30 fps', maxWidth: 1920, fps: 30, jpeg: 85, bitrate: 6_000_000, hint: 'detail' },
  { label: 'Juegos · 720p · 60 fps', maxWidth: 1280, fps: 60, jpeg: 75, bitrate: 5_000_000, hint: 'motion' },
  { label: 'Máxima · 1440p · 30 fps', maxWidth: 2560, fps: 30, jpeg: 88, bitrate: 9_000_000, hint: 'detail' },
  { label: 'Ahorro · 480p · 15 fps', maxWidth: 854, fps: 15, jpeg: 70, bitrate: 1_000_000, hint: 'detail' },
];

export const listCaptureSources = () => invoke<CaptureSource[]>('list_capture_sources');

/**
 * Starts pulling frames for `sourceId` and returns a live video track.
 * Frames are skipped (never queued) when capture is slower than the target fps.
 */
export async function startNativeCapture(sourceId: string, quality: ShareQuality, onEnded: () => void) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('No se pudo preparar la captura.');

  const drawFrame = async () => {
    const bytes = await invoke<ArrayBuffer>('capture_source_frame', { id: sourceId, maxWidth: quality.maxWidth, jpegQuality: quality.jpeg });
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
    }
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
  };

  await drawFrame(); // fails fast if the source is gone
  const stream = canvas.captureStream(quality.fps);
  const [track] = stream.getVideoTracks();
  track.contentHint = quality.hint;

  let stopped = false;
  let failures = 0;
  const interval = 1000 / quality.fps;
  const loop = async () => {
    while (!stopped) {
      const started = performance.now();
      try {
        await drawFrame();
        failures = 0;
      } catch {
        // The window was closed or minimised for too long: end the share.
        if (++failures >= 15) { stop(); onEnded(); return; }
      }
      const wait = interval - (performance.now() - started);
      if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
    }
  };
  void loop();

  const stop = () => {
    if (stopped) return;
    stopped = true;
    track.stop();
  };
  return { track, stop };
}
