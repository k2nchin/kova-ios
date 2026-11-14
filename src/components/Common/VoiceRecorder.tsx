import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { startVoiceNote, type VoiceNoteRecording } from '../../services/voiceNote';

export type VoiceResult = { file: File; duration: number };
const BARS = 28;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * WhatsApp-style voice notes, better:
 * - hold the mic to record, release to send, slide left to cancel;
 * - a quick tap locks recording so you can talk hands-free;
 * - a live waveform shows your voice while you record.
 */
export function useVoiceRecorder(onSend: (result: VoiceResult) => void | Promise<void>) {
  const recRef = useRef<VoiceNoteRecording | null>(null);
  const [state, setState] = useState<'idle' | 'holding' | 'locked'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.08));
  const [cancelHint, setCancelHint] = useState(0); // 0..1 while sliding to cancel
  const raf = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);

  const teardown = useCallback(() => {
    cancelAnimationFrame(raf.current);
    void ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    setState('idle'); setSeconds(0); setCancelHint(0); setLevels(Array(BARS).fill(0.08));
  }, []);

  useEffect(() => () => { recRef.current?.cancel(); cancelAnimationFrame(raf.current); void ctxRef.current?.close().catch(() => undefined); }, []);

  const pending = useRef<{ cancelled: boolean } | null>(null);
  const start = useCallback(async (mode: 'holding' | 'locked') => {
    if (recRef.current || pending.current) return;
    const token = { cancelled: false };
    pending.current = token;
    setState(mode);
    try {
      const rec = await startVoiceNote();
      pending.current = null;
      // Released/cancelled while the mic was still opening.
      if (token.cancelled) { rec.cancel(); return; }
      recRef.current = rec;
      const started = Date.now();
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx(); ctxRef.current = ctx;
        const analyser = ctx.createAnalyser(); analyser.fftSize = 256;
        ctx.createMediaStreamSource(rec.stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        let last = 0;
        const tick = (t: number) => {
          raf.current = requestAnimationFrame(tick);
          if (t - last < 70) return; last = t;
          analyser.getByteTimeDomainData(data);
          let peak = 0; for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
          const level = Math.min(1, Math.max(0.08, (peak / 128) * 2.2));
          setLevels((prev) => [...prev.slice(1), level]);
          setSeconds(Math.floor((Date.now() - started) / 1000));
        };
        raf.current = requestAnimationFrame(tick);
      } catch {
        const id = window.setInterval(() => { if (!recRef.current) window.clearInterval(id); else setSeconds(Math.floor((Date.now() - started) / 1000)); }, 500);
      }
    } catch (error) {
      pending.current = null;
      toast.error(error instanceof Error && error.name !== 'NotAllowedError' ? error.message : 'Permite el micrófono para grabar notas de voz.');
      teardown();
    }
  }, [teardown]);

  const cancel = useCallback(() => {
    if (pending.current) pending.current.cancelled = true;
    recRef.current?.cancel(); recRef.current = null; teardown();
  }, [teardown]);

  const send = useCallback(async () => {
    const rec = recRef.current; recRef.current = null; teardown();
    if (!rec) { if (pending.current) pending.current.cancelled = true; toast.info('Mantén pulsado un poco más para grabar.'); return; }
    const result = await rec.stop();
    if (!result) { toast.info('La nota de voz era demasiado corta.'); return; }
    await onSend(result);
  }, [onSend, teardown]);

  return { state, seconds, levels, cancelHint, setCancelHint, start, cancel, send, lock: () => setState('locked') };
}

type Recorder = ReturnType<typeof useVoiceRecorder>;

/** Mic button: hold to record, release to send, slide left to cancel, tap to lock. */
export const VoiceRecordButton: React.FC<{ recorder: Recorder; className?: string }> = ({ recorder, className = '' }) => {
  const recRef = useRef(recorder);
  useEffect(() => { recRef.current = recorder; });
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (recorder.state !== 'idle') return;
    e.preventDefault();
    const x0 = e.clientX; const t0 = Date.now(); const id = e.pointerId;
    let done = false;
    void recorder.start('holding');
    // Window listeners: the button is swapped for the recording bar while holding.
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id || done) return;
      const dx = Math.min(0, ev.clientX - x0);
      recRef.current.setCancelHint(Math.min(1, -dx / 110));
      if (dx < -110) { finish(); recRef.current.cancel(); }
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== id || done) return;
      finish();
      // A quick tap locks recording (hands-free); a hold sends on release.
      if (Date.now() - t0 < 350) recRef.current.lock();
      else void recRef.current.send();
    };
    const cancel = (ev: PointerEvent) => { if (ev.pointerId === id && !done) { finish(); recRef.current.cancel(); } };
    const finish = () => {
      done = true;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  };
  return (
    <button
      type="button"
      className={`kova-vrec-btn ${recorder.state === 'holding' ? 'is-holding' : ''} ${className}`}
      aria-label="Mantén pulsado para grabar una nota de voz"
      title="Mantén pulsado para grabar · toca para grabar sin manos"
      onPointerDown={onPointerDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Mic size={17} />
    </button>
  );
};

/** Recording bar shown in place of the composer while recording. */
export const VoiceRecordingBar: React.FC<{ recorder: Recorder }> = ({ recorder }) => (
  <div className="kova-vrec-bar" role="status" aria-live="polite">
    <span className="kova-vrec-dot" aria-hidden />
    <span className="kova-vrec-time">{fmt(recorder.seconds)}</span>
    <span className="kova-vrec-wave" aria-hidden style={{ opacity: 1 - recorder.cancelHint * 0.7 }}>
      {recorder.levels.map((l, i) => <i key={i} style={{ transform: `scaleY(${l})` }} />)}
    </span>
    {recorder.state === 'holding' ? (
      <span className="kova-vrec-hint" style={{ opacity: 0.5 + recorder.cancelHint / 2, color: recorder.cancelHint > 0.6 ? '#f87171' : undefined }}>‹ Desliza para cancelar</span>
    ) : (
      <>
        <button type="button" className="kova-vrec-cancel" onClick={recorder.cancel} aria-label="Descartar nota de voz"><Trash2 size={17} /></button>
        <button type="button" className="kova-vrec-send" onClick={() => void recorder.send()} aria-label="Enviar nota de voz"><Send size={16} /></button>
      </>
    )}
  </div>
);
