import React from 'react';
import { Mic, MicOff, Headphones, HeadphoneOff, Video, VideoOff, Monitor, MessageSquare, PhoneOff } from 'lucide-react';

interface VoiceControlDockProps {
  isMuted: boolean;
  isDeafened: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  hasUnreadChat: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
  /** Dock root ref: the audio loop writes --voice-mic here (rAF, no React renders). */
  dockRef?: React.RefObject<HTMLDivElement | null>;
}

interface DockButtonProps {
  icon: React.ReactNode;
  label: string;
  short: string;
  state?: 'on' | 'off' | 'idle';
  onClick: () => void;
  badge?: boolean;
  className?: string;
}

const DockButton: React.FC<DockButtonProps> = ({ icon, label, short, state = 'idle', onClick, badge, className = '' }) => (
  <button
    type="button"
    className={`kvr-dock-btn ${className}`}
    onClick={onClick}
    aria-label={label}
    aria-pressed={state !== 'idle'}
    title={label}
    data-state={state}
  >
    {icon}
    <small>{short}</small>
    {badge && <span className="kvr-badge" aria-hidden />}
  </button>
);

export const VoiceControlDock: React.FC<VoiceControlDockProps> = ({
  isMuted,
  isDeafened,
  isCameraOn,
  isScreenSharing,
  isChatOpen,
  hasUnreadChat,
  onToggleMute,
  onToggleDeafen,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onLeave,
  dockRef,
}) => (
  <div ref={dockRef} role="toolbar" aria-label="Controles de la sala de voz" className="kvr-dock">
    <DockButton
      className="kvr-dock-mic"
      icon={isMuted ? <MicOff size={19} /> : <Mic size={19} />}
      label={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
      short={isMuted ? 'Silencio' : 'Micro'}
      state={isMuted ? 'off' : 'idle'}
      onClick={onToggleMute}
    />
    <DockButton
      icon={isDeafened ? <HeadphoneOff size={19} /> : <Headphones size={19} />}
      label={isDeafened ? 'Activar audio' : 'Dejar de oír'}
      short="Audio"
      state={isDeafened ? 'off' : 'idle'}
      onClick={onToggleDeafen}
    />
    <DockButton
      icon={isCameraOn ? <Video size={19} /> : <VideoOff size={19} />}
      label={isCameraOn ? 'Apagar cámara' : 'Encender cámara'}
      short="Cámara"
      state={isCameraOn ? 'on' : 'idle'}
      onClick={onToggleCamera}
    />
    <DockButton
      className="kvr-desktop-only"
      icon={<Monitor size={19} />}
      label={isScreenSharing ? 'Dejar de compartir' : 'Compartir pantalla'}
      short="Pantalla"
      state={isScreenSharing ? 'on' : 'idle'}
      onClick={onToggleScreenShare}
    />
    <DockButton
      icon={<MessageSquare size={19} />}
      label={isChatOpen ? 'Cerrar chat de la sala' : 'Abrir chat de la sala'}
      short="Chat"
      state={isChatOpen ? 'on' : 'idle'}
      onClick={onToggleChat}
      badge={hasUnreadChat && !isChatOpen}
    />
    <span className="kvr-dock-sep" aria-hidden />
    <button type="button" className="kvr-dock-leave" onClick={onLeave} aria-label="Salir de la sala" title="Salir de la sala">
      <PhoneOff size={18} />
      <span>Salir</span>
    </button>
  </div>
);
