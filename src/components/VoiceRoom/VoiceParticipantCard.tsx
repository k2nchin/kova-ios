import React from 'react';
import { MicOff, HeadphoneOff } from 'lucide-react';
import type { Track } from 'livekit-client';
import { Avatar } from '../Common/Avatar';
import { VideoTrackView } from './VideoTrackView';
import { VerifiedBadge } from '../Common/VerifiedBadge';

export interface VoiceParticipant {
  id: string;
  name: string;
  avatar?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  roleLabel?: string;
  isMe?: boolean;
  verified?: boolean;
}

interface VoiceParticipantCardProps {
  member: VoiceParticipant;
  /** Card root ref: the audio loop writes --card-audio here (rAF, no React renders). */
  cardRef?: React.RefObject<HTMLElement | null>;
  /** Live camera track (LiveKit), local or remote. */
  cameraTrack?: Track;
  mirrorCamera?: boolean;
  onOpenProfile?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

/** One person in the room: avatar (or camera) with a live speaking outline. */
export const VoiceParticipantCard: React.FC<VoiceParticipantCardProps> = ({
  member,
  cardRef,
  cameraTrack,
  mirrorCamera,
  onOpenProfile,
  onContextMenu,
}) => {
  const isSpeaking = member.isSpeaking && !member.isMuted && !member.isDeafened;
  const status = member.isDeafened ? ', sin audio' : member.isMuted ? ', micrófono silenciado' : isSpeaking ? ', hablando' : '';

  return (
    <article
      ref={cardRef as React.RefObject<HTMLElement>}
      className={`kvr-tile ${cameraTrack ? 'has-video' : ''}`}
      data-speaking={isSpeaking ? '1' : '0'}
      onClick={onOpenProfile}
      onContextMenu={onContextMenu}
      title={`Ver perfil de ${member.name}`}
      aria-label={`${member.name}${status}`}
    >
      {cameraTrack ? (
        <VideoTrackView track={cameraTrack} mirror={mirrorCamera} />
      ) : (
        <span className="kvr-tile-avatar">
          <Avatar src={member.avatar} name={member.name} size={84} />
        </span>
      )}

      {member.roleLabel && <span className="kvr-tile-role">{member.roleLabel}</span>}

      <span className="kvr-tile-name">
        <span>{member.name}</span>
        {member.verified && <VerifiedBadge size={13} />}
        {member.isMe && <em>tú</em>}
        {member.isDeafened ? <HeadphoneOff size={13} aria-hidden /> : member.isMuted ? <MicOff size={13} aria-hidden /> : null}
      </span>
    </article>
  );
};
