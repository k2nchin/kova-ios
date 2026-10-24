import React from 'react';
import { MicOff, Headphones } from 'lucide-react';

export interface VoiceParticipant {
  id: string;
  name: string;
  avatar?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  roleLabel?: string;
  isMe?: boolean;
}

interface VoiceParticipantCardProps {
  member: VoiceParticipant;
  /** Card root ref: the audio loop writes --card-audio here (rAF, no React renders). */
  cardRef?: React.RefObject<HTMLElement | null>;
  cameraVideoRef?: React.RefObject<HTMLVideoElement | null>;
  showCamera?: boolean;
  onOpenProfile?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  smaller?: boolean;
}

// Deterministic avatar gradient derived from a stable userId — never random.
export const getAvatarGradient = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const hueA = 160 + (Math.abs(hash) % 40); // teal family
  const hueB = 190 + (Math.abs(hash >> 3) % 50); // cyan family
  const dark = 8 + (Math.abs(hash >> 5) % 6);
  return `linear-gradient(135deg, hsl(${hueA} 45% 26%), hsl(${dark}, 8%, ${14 + (Math.abs(hash) % 8)}%) 55%, hsl(${hueB} 55% 18%))`;
};

export const VoiceParticipantCard: React.FC<VoiceParticipantCardProps> = ({
  member,
  cardRef,
  cameraVideoRef,
  showCamera,
  onOpenProfile,
  onContextMenu,
  smaller,
}) => {
  const isSpeaking = member.isSpeaking && !member.isMuted && !member.isDeafened;

  return (
    <article
      ref={cardRef as React.RefObject<HTMLElement>}
      data-speaking={isSpeaking ? '1' : '0'}
      onContextMenu={onContextMenu}
      onClick={onOpenProfile}
      title={`Ver perfil de ${member.name}`}
      aria-label={`${member.name}${member.isMuted ? ', micrófono silenciado' : ''}`}
      className={`voice-card voice-enter group relative flex shrink-0 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden border border-white/[0.07] bg-white/[0.035] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21ddb2]/40 ${
        smaller ? 'h-[clamp(150px,20vh,180px)] w-[clamp(150px,18vw,190px)]' : 'h-[clamp(200px,26vh,230px)] w-[clamp(210px,22vw,260px)]'
      }`}
      style={{ borderRadius: 'var(--voice-radius)' }}
    >
      {/* Live camera stream replaces the avatar composition */}
      {showCamera && (
        <video
          ref={cameraVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {!showCamera && (
        <>
          {/* Avatar + activity ring (ring inherits --card-audio from the card root) */}
          <div className="relative flex items-center justify-center">
            <span
              aria-hidden
              className="pointer-events-none absolute rounded-full border border-[#2dd7b4]"
              style={{
                width: '104px',
                height: '104px',
                transform: 'scale(calc(1 + var(--card-audio, 0) * 0.04))',
                opacity: 'calc(0.35 + var(--card-audio, 0) * 0.5)',
                transition: 'transform 200ms cubic-bezier(.2,.8,.2,1), opacity 200ms cubic-bezier(.2,.8,.2,1)',
              }}
            />
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="relative h-[92px] w-[92px] rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div
                aria-hidden
                className="relative flex h-[92px] w-[92px] items-center justify-center rounded-full text-2xl font-bold text-white ring-1 ring-white/10"
                style={{ background: getAvatarGradient(member.id) }}
              >
                {(member.name || 'K').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Status dot */}
            <span
              className={`absolute bottom-1.5 right-1.5 h-3.5 w-3.5 rounded-full ring-2 ring-[#0e0f12] ${
                member.isDeafened ? 'bg-[#ff3c72]' : member.isMuted ? 'bg-[#646a76]' : isSpeaking ? 'voice-dot-live bg-[#21ddb2]' : 'bg-[#21ddb2]/80'
              }`}
              title={member.isDeafened ? 'Ensordecido' : member.isMuted ? 'Silenciado' : 'Conectado'}
            />
          </div>

          {/* Identity */}
          <div className="relative z-10 flex max-w-full flex-col items-center gap-1 px-3">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-[#f5f7fa]">{member.name}</span>
              {member.isMe && <span className="text-[10px] font-medium text-[#646a76]">(tú)</span>}
            </div>
            <div className="flex items-center gap-1.5">
              {member.isMuted && <MicOff size={11} className="text-[#ff3c72]/80" aria-label="Micrófono silenciado" />}
              {member.isDeafened && <Headphones size={11} className="text-[#ff3c72]/80" aria-label="Audio ensordecido" />}
              {!member.isMuted && !member.isDeafened && (
                <span className={`text-[11px] ${isSpeaking ? 'text-[#21ddb2]' : 'text-[#9a9faa]'}`}>
                  {isSpeaking ? 'hablando' : 'en voz'}
                </span>
              )}
              {member.roleLabel && (
                <span className="rounded-full border border-white/[0.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#9a9faa]">
                  {member.roleLabel}
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {showCamera && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
          <span className="truncate text-xs font-semibold text-white">{member.name}</span>
          {member.isMuted && <MicOff size={12} className="text-[#ff3c72]" />}
        </div>
      )}
    </article>
  );
};
