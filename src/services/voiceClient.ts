// Real voice transport for Kova: a thin wrapper over a LiveKit room.
// The backend (/api/voice/token) decides who may join; LiveKit carries the audio.
import { Room, RoomEvent, Track, type Participant, type RemoteTrack } from 'livekit-client';

export interface VoicePeer {
  id: string;
  name: string;
  avatar?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
}

export interface VoiceSession {
  setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
  setDeafened: (deafened: boolean) => void;
  disconnect: () => Promise<void>;
}

interface ConnectOptions {
  url: string;
  token: string;
  micEnabled: boolean;
  deafened: boolean;
  onPeers: (peers: VoicePeer[]) => void;
  /** Called when the connection drops without the user asking to leave. */
  onUnexpectedDisconnect: () => void;
}

const avatarFrom = (participant: Participant) => {
  try {
    return (JSON.parse(participant.metadata || '{}') as { avatar?: string }).avatar || undefined;
  } catch {
    return undefined;
  }
};

const toPeer = (participant: Participant, isLocal: boolean): VoicePeer => ({
  id: participant.identity,
  name: participant.name || participant.identity,
  avatar: avatarFrom(participant),
  isSpeaking: participant.isSpeaking,
  isMuted: !participant.isMicrophoneEnabled,
  isLocal,
});

export async function connectVoice(options: ConnectOptions): Promise<VoiceSession> {
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const audioElements = new Map<RemoteTrack, HTMLMediaElement>();
  let deafened = options.deafened;
  let leaving = false;

  const emitPeers = () => {
    options.onPeers([
      toPeer(room.localParticipant, true),
      ...Array.from(room.remoteParticipants.values()).map((participant) => toPeer(participant, false)),
    ]);
  };

  room
    .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      if (track.kind !== Track.Kind.Audio) return;
      const element = track.attach();
      element.muted = deafened;
      element.style.display = 'none';
      document.body.appendChild(element);
      audioElements.set(track, element);
      emitPeers();
    })
    .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      // LiveKit may already have detached the element; remove ours explicitly too.
      track.detach().forEach((element) => element.remove());
      audioElements.get(track)?.remove();
      audioElements.delete(track);
      emitPeers();
    })
    .on(RoomEvent.ParticipantConnected, emitPeers)
    .on(RoomEvent.ParticipantDisconnected, emitPeers)
    .on(RoomEvent.ActiveSpeakersChanged, emitPeers)
    .on(RoomEvent.TrackMuted, emitPeers)
    .on(RoomEvent.TrackUnmuted, emitPeers)
    .on(RoomEvent.LocalTrackPublished, emitPeers)
    .on(RoomEvent.Disconnected, () => {
      audioElements.forEach((element) => element.remove());
      audioElements.clear();
      options.onPeers([]);
      if (!leaving) options.onUnexpectedDisconnect();
    });

  await room.connect(options.url, options.token);
  try {
    await room.localParticipant.setMicrophoneEnabled(options.micEnabled);
  } catch (error) {
    // Joining without a microphone is still useful for listening.
    console.warn('[Kova voice] No se pudo activar el micrófono:', error);
  }
  // Browsers may block autoplay until a user gesture; joining is one.
  await room.startAudio().catch(() => undefined);
  emitPeers();

  return {
    setMicrophoneEnabled: async (enabled) => {
      await room.localParticipant.setMicrophoneEnabled(enabled);
      emitPeers();
    },
    setDeafened: (value) => {
      deafened = value;
      audioElements.forEach((element) => {
        element.muted = value;
      });
    },
    disconnect: async () => {
      leaving = true;
      await room.disconnect();
    },
  };
}
