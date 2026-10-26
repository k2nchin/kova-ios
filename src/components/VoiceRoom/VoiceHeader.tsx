import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, MoreHorizontal, Sparkles, Volume2 } from 'lucide-react';

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
  peopleCount: number;
  onOpenSoundboard: () => void;
  onOpenChat: () => void;
  onToggleRadar: () => void;
  onToggleNoiseSuppression: () => void;
  radarVisible: boolean;
  /** Call notes: yours, how many people in the room have them on, actions. */
  notesOn: boolean;
  notesTakers: number;
  onToggleNotes: () => void;
  onSummarize: () => void;
}

const STATE_LABEL: Record<VoiceConnectionState, string> = {
  connected: 'Conectado',
  connecting: 'Conectando…',
  reconnecting: 'Reconectando…',
  disconnected: 'Sin conectar',
};

export const VoiceHeader: React.FC<VoiceHeaderProps> = ({
  channelName,
  serverName,
  connectionState,
  noiseSuppression,
  latencyMs,
  audioDetails,
  peopleCount,
  onOpenSoundboard,
  onOpenChat,
  onToggleRadar,
  onToggleNoiseSuppression,
  radarVisible,
  notesOn,
  notesTakers,
  onToggleNotes,
  onSummarize,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close the menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Only real, measured values are listed.
  const details = [
    ['Latencia', latencyMs !== null ? `${latencyMs} ms` : null],
    ['Frecuencia', audioDetails.sampleRate !== null ? `${audioDetails.sampleRate.toLocaleString('es')} Hz` : null],
    ['Micrófono', audioDetails.inputDevice],
    ['Salida', audioDetails.outputDevice],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <header ref={headerRef} className="kvr-head">
      <span className={`kvr-head-icon ${connectionState === 'connected' ? 'is-live' : ''}`} aria-hidden>
        <Volume2 size={18} />
      </span>
      <div className="kvr-head-text">
        <h1>{channelName}</h1>
        <p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className={`kvr-state-dot is-${connectionState}`} />
            {STATE_LABEL[connectionState]}
            {connectionState === 'connected' && latencyMs !== null && ` · ${latencyMs} ms`}
          </span>
          <span>{peopleCount === 1 ? '1 persona' : `${peopleCount} personas`}</span>
          <span className="kvr-desktop-only">{serverName}</span>
          {notesTakers > 0 && <span className="kvr-notes-badge" title="Kova IA transcribe la voz de quien activó las notas">📝 Notas activas{notesTakers > 1 ? ` · ${notesTakers}` : ''}</span>}
        </p>
      </div>

      <div className="kvr-head-actions">
        <button type="button" className="kvr-icon-btn kvr-desktop-only" onClick={onOpenSoundboard} aria-label="Sonidos" title="Sonidos">
          <Sparkles size={17} />
        </button>
        <button type="button" className="kvr-icon-btn kvr-desktop-only" onClick={onOpenChat} aria-label="Chat de la sala" title="Chat de la sala">
          <MessageSquare size={17} />
        </button>
        <button
          type="button"
          className="kvr-icon-btn"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Opciones de la sala"
          aria-expanded={menuOpen}
          title="Opciones de la sala"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {menuOpen && (
        <div className="kvr-menu" role="menu">
          <button type="button" role="menuitemcheckbox" aria-checked={noiseSuppression} className="kvr-menu-item" onClick={onToggleNoiseSuppression}>
            <span>Supresión de ruido</span>
            <i className={`kvr-switch ${noiseSuppression ? 'is-on' : ''}`} />
          </button>
          <button type="button" role="menuitemcheckbox" aria-checked={notesOn} className="kvr-menu-item" onClick={onToggleNotes}>
            <span>Notas de la llamada<small style={{ display: 'block' }}>Kova IA transcribe solo tu voz</small></span>
            <i className={`kvr-switch ${notesOn ? 'is-on' : ''}`} />
          </button>
          <button type="button" role="menuitem" className="kvr-menu-item" onClick={() => { onSummarize(); setMenuOpen(false); }}>
            <span>Resumir llamada<small style={{ display: 'block' }}>Se publica en el chat de la sala</small></span>
          </button>
          <button type="button" role="menuitemcheckbox" aria-checked={radarVisible} className="kvr-menu-item kvr-desktop-only" onClick={onToggleRadar}>
            <span>Radar de voz</span>
            <i className={`kvr-switch ${radarVisible ? 'is-on' : ''}`} />
          </button>
          <button type="button" role="menuitem" className="kvr-menu-item kvr-mobile-only" onClick={() => { onOpenSoundboard(); setMenuOpen(false); }}>
            <span>Sonidos</span>
          </button>
          {details.length > 0 && (
            <dl aria-label="Detalles de audio">
              {details.map(([key, value]) => (
                <div key={key}><dt>{key}</dt><dd title={value}>{value}</dd></div>
              ))}
            </dl>
          )}
        </div>
      )}
    </header>
  );
};
