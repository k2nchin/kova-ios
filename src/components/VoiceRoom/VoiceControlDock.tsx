import React from 'react';
import { Mic, MicOff, Headphones, Video, Monitor, Sparkles, MessageSquare, LogOut } from 'lucide-react';

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
  onToggleSoundboard: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
  /** Dock root ref: the audio loop writes --voice-mic here (rAF, no React renders). */
  dockRef?: React.RefObject<HTMLDivElement | null>;
}

interface VoiceControlButtonProps {
  icon: React.ReactNode;
  label: string;
  state?: 'on' | 'off' | 'idle';
  onClick: () => void;
  badge?: boolean;
  /** Secondary controls collapse on phones (kept on tablet+). */
  hideOnMobile?: boolean;
}

const VoiceControlButton: React.FC<VoiceControlButtonProps> = ({ icon, label, state = 'idle', onClick, badge, hideOnMobile }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={state === 'on'}
    title={label}
    data-state={state}
    className={`voice-btn ${hideOnMobile ? 'hidden sm:flex' : ''}`}
  >
    {icon}
    {badge && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#21ddb2] ring-1 ring-[#101014]" />}
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
  onToggleSoundboard,
  onToggleChat,
  onLeave,
  dockRef,
}) => (
  <div
    ref={dockRef}
    role="toolbar"
    aria-label="Controles de la sala de voz"
    className="voice-dock absolute bottom-[22px] left-1/2 z-30 flex h-16 -translate-x-1/2 items-center gap-1 rounded-[22px] border border-white/[0.08] bg-[rgba(16,16,20,.84)] p-2 shadow-[0_14px_50px_rgba(0,0,0,.35)] backdrop-blur-[20px] select-none"
  >
    <button
      type="button"
      onClick={onToggleMute}
      aria-label={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
      title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
      data-state={isMuted ? 'off' : 'idle'}
      data-live={isMuted ? '0' : '1'}
      className="voice-btn voice-btn-mic"
    >
      {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
    </button>

    <VoiceControlButton
      icon={<Headphones size={18} />}
      label={isDeafened ? 'Activar audio' : 'Ensordecer audio'}
      state={isDeafened ? 'off' : 'idle'}
      onClick={onToggleDeafen}
    />
    <VoiceControlButton
      icon={<Video size={18} />}
      label={isCameraOn ? 'Apagar cámara' : 'Encender cámara'}
      state={isCameraOn ? 'on' : 'idle'}
      onClick={onToggleCamera}
      hideOnMobile
    />
    <VoiceControlButton
      icon={<Monitor size={18} />}
      label={isScreenSharing ? 'Detener pantalla compartida' : 'Compartir pantalla'}
      state={isScreenSharing ? 'on' : 'idle'}
      onClick={onToggleScreenShare}
      hideOnMobile
    />
    <VoiceControlButton
      icon={<Sparkles size={18} />}
      label="Sonidos"
      onClick={onToggleSoundboard}
      hideOnMobile
    />
    <VoiceControlButton
      icon={<MessageSquare size={18} />}
      label={isChatOpen ? 'Cerrar chat de la sala' : 'Abrir chat de la sala'}
      state={isChatOpen ? 'on' : 'idle'}
      onClick={onToggleChat}
      badge={hasUnreadChat && !isChatOpen}
    />

    <span aria-hidden className="mx-1 h-6 w-px bg-white/[0.08]" />

    <button
      type="button"
      onClick={onLeave}
      aria-label="Salir de la sala"
      title="Salir de la sala"
      className="voice-btn w-[52px] text-[#ff3c72] hover:bg-[rgba(255,33,96,.20)]"
      style={{ background: 'rgba(255, 33, 96, .13)' }}
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold">
        <LogOut size={16} />
        Salir
      </span>
    </button>
  </div>
);
