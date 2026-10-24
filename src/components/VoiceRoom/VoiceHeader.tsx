import React, { useEffect, useRef, useState } from 'react';
import { Volume2, MoreVertical, Waves, X, Sparkles, Signal } from 'lucide-react';

export type VoiceConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

interface VoiceHeaderProps {
  channelName: string;
  serverName: string;
  connectionState: VoiceConnectionState;
  noiseSuppression: boolean;
  /** Real latency in ms (measured); null while unknown. */
  latencyMs: number | null;
  audioDetails: {
    sampleRate: number | null;
    inputDevice: string | null;
    outputDevice: string | null;
  };
  onOpenSoundboard: () => void;
  onOpenChat: () => void;
  onToggleRadar: () => void;
  onToggleNoiseSuppression: () => void;
  radarVisible: boolean;
}

const STATE_META: Record<VoiceConnectionState, { label: string; color: string; pulse?: boolean }> = {
  connected: { label: 'Conectado', color: '#21ddb2', pulse: true },
  connecting: { label: 'Conectando…', color: '#9a9faa' },
  reconnecting: { label: 'Reconectando…', color: '#f5b73d' },
  disconnected: { label: 'Desconectado', color: '#ff3c72' },
};

export const VoiceHeader: React.FC<VoiceHeaderProps> = ({
  channelName,
  serverName,
  connectionState,
  noiseSuppression,
  latencyMs,
  audioDetails,
  onOpenSoundboard,
  onOpenChat,
  onToggleRadar,
  onToggleNoiseSuppression,
  radarVisible,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const meta = STATE_META[connectionState];

  // Close popovers on outside click / Escape.
  useEffect(() => {
    if (!detailsOpen && !menuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setDetailsOpen(false);
        setMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDetailsOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [detailsOpen, menuOpen]);

  return (
    <header
      ref={headerRef}
      className="relative z-40 flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0e0f12]/70 px-4 backdrop-blur-[14px] sm:px-6"
    >
      {/* Left: animated voice icon + channel identity + live connection */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04]">
          <Volume2 size={17} className={connectionState === 'connected' ? 'text-[#21ddb2]' : 'text-[#9a9faa]'} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-[#f5f7fa]">{channelName}</h1>
            <span className="hidden truncate text-xs text-[#646a76] sm:inline">· {serverName}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${meta.pulse ? 'voice-dot-live' : ''}`}
              style={{ background: meta.color }}
              aria-hidden
            />
            <span className="voice-badge-in text-[11px] font-medium text-[#9a9faa]">
              {meta.label}
              {connectionState === 'connected' && latencyMs !== null && (
                <span className="ml-1.5 font-mono text-[10px] text-[#646a76]">{latencyMs} ms</span>
              )}
            </span>
            {noiseSuppression && (
              <span className="hidden items-center gap-1 text-[10px] text-[#646a76] sm:flex" title="Supresión de ruido activa">
                <Waves size={10} className="text-[#21ddb2]/70" />
                Noise suppression
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: compact actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onOpenSoundboard}
          aria-label="Sonidos de la sala"
          title="Sonidos"
          className="voice-btn"
        >
          <Sparkles size={17} />
        </button>
        <button
          type="button"
          onClick={onOpenChat}
          aria-label="Chat de la sala"
          title="Chat"
          className="voice-btn"
        >
          <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Overflow menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setMenuOpen((v) => !v); setDetailsOpen(false); }}
            aria-label="Más opciones"
            aria-expanded={menuOpen}
            title="Más opciones"
            className="voice-btn"
          >
            <MoreVertical size={17} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-[52px] w-52 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14151a] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.5)]">
              <button
                type="button"
                onClick={() => { setDetailsOpen(true); setMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#f5f7fa] transition hover:bg-white/[0.06]"
              >
                <Signal size={13} className="text-[#9a9faa]" />
                Detalles de conexión
              </button>
              <button
                type="button"
                onClick={() => { onToggleRadar(); setMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#f5f7fa] transition hover:bg-white/[0.06]"
              >
                <Waves size={13} className="text-[#9a9faa]" />
                {radarVisible ? 'Ocultar radar de voz' : 'Mostrar radar de voz'}
              </button>
              <button
                type="button"
                onClick={() => { onToggleNoiseSuppression(); setMenuOpen(false); }}
                className="flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#f5f7fa] transition hover:bg-white/[0.06]"
              >
                <span className="flex items-center gap-2.5">
                  <Waves size={13} className="text-[#9a9faa]" />
                  Supresión de ruido
                </span>
                <span className={`text-[10px] font-bold ${noiseSuppression ? 'text-[#21ddb2]' : 'text-[#646a76]'}`}>
                  {noiseSuppression ? '✓ Activa' : 'Desactivada'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Connection details popover (real data from the live pipeline) */}
        {detailsOpen && (
          <div
            role="dialog"
            aria-label="Detalles de conexión"
            className="absolute right-4 top-[78px] w-[290px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14151a] p-4 shadow-[0_18px_50px_rgba(0,0,0,.5)] sm:w-[320px]"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-[#f5f7fa]">Detalles de conexión</p>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                aria-label="Cerrar detalles"
                className="rounded-lg p-1 text-[#646a76] transition hover:bg-white/[0.06] hover:text-[#f5f7fa]"
              >
                <X size={13} />
              </button>
            </div>
            <dl className="space-y-2 text-[11px]">
              {[
                ['Latencia', latencyMs !== null ? `${latencyMs} ms` : '—'],
                ['Codec', '—'],
                ['Bitrate', '—'],
                ['Supresión de ruido', noiseSuppression ? 'Activa (filtro paso-alto 85 Hz + compresor)' : 'Desactivada'],
                ['Motor de audio', audioDetails.sampleRate !== null ? `WebAudio · ${audioDetails.sampleRate.toLocaleString('es')} Hz` : '—'],
                ['Dispositivo de entrada', audioDetails.inputDevice || '—'],
                ['Dispositivo de salida', audioDetails.outputDevice || '—'],
                ['Pérdida de paquetes', '—'],
                ['Jitter', '—'],
              ].map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <dt className="text-[#646a76]">{key}</dt>
                  <dd className="max-w-[62%] text-right font-medium text-[#9a9faa]">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[10px] leading-4 text-[#646a76]">
              Las métricas de red se activan con la conexión remota de Kova Cloud. Hoy ves el estado real de tu pipeline local.
            </p>
          </div>
        )}
      </div>
    </header>
  );
};
