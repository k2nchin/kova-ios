// Real voice transport for Kova: a thin wrapper over a LiveKit room.
// The backend (/api/voice/token) decides who may join; LiveKit carries the audio.
import { Room, RoomEvent, Track, VideoPresets, type Participant, type RemoteTrack } from 'livekit-client';

export interface VoicePeer {
  id: string;
  name: string;
  avatar?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
  /** Live camera / screen tracks (local or subscribed); render with VideoTrackView. */
  cameraTrack?: Track;
  screenTrack?: Track;
}

export interface VoiceSession {
  setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
  setDeafened: (deafened: boolean) => void;
  /** Publish or stop the camera. Resolves to the final state. */
  setCameraEnabled: (enabled: boolean) => Promise<boolean>;
  /** Publish or stop a screen share (the browser asks what to share). */
  setScreenShareEnabled: (enabled: boolean) => Promise<boolean>;
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
  /** Called when the browser ends a share/camera by itself (e.g. "Stop sharing"). */
  onLocalVideoChange?: (state: { camera: boolean; screen: boolean }) => void;
}

const avatarFrom = (participant: Participant) => {
  try {
    return (JSON.parse(participant.metadata || '{}') as { avatar?: string }).avatar || undefined;
  } catch {
    return undefined;
  }
};

const videoTrack = (participant: Participant, source: Track.Source) => {
  const publication = participant.getTrackPublication(source);
  return publication && !publication.isMuted ? publication.track : undefined;
};

const toPeer = (participant: Participant, isLocal: boolean): VoicePeer => ({
  id: participant.identity,
  name: participant.name || participant.identity,
  avatar: avatarFrom(participant),
  isSpeaking: participant.isSpeaking,
  isMuted: !participant.isMicrophoneEnabled,
  isLocal,
  cameraTrack: videoTrack(participant, Track.Source.Camera),
  screenTrack: videoTrack(participant, Track.Source.ScreenShare),
});

export async function connectVoice(options: ConnectOptions): Promise<VoiceSession> {
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
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
      // Video is rendered by the UI from the peer list; only audio is played here.
      if (track.kind !== Track.Kind.Audio) { emitPeers(); return; }
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
    .on(RoomEvent.LocalTrackUnpublished, () => {
      emitPeers();
      options.onLocalVideoChange?.({
        camera: room.localParticipant.isCameraEnabled,
        screen: room.localParticipant.isScreenShareEnabled,
      });
    })
    .on(RoomEvent.TrackPublished, emitPeers)
    .on(RoomEvent.TrackUnpublished, emitPeers)
    .on(RoomEvent.Disconnected, () => {
      audioElements.forEach((element) => element.remove());
      audioElements.clear();
      options.onPeers([]);
      if (!leaving) options.onUnexpectedDisconnect();
    });

  await room.connect(options.url, options.token);
  // Show the room right away; opening the microphone can take a few seconds
  // (device start-up, permission prompt), so it continues in the background.
  emitPeers();
  void room.localParticipant.setMicrophoneEnabled(options.micEnabled)
    .catch((error) => {
      // Joining without a microphone is still useful for listening.
      console.warn('[Kova voice] No se pudo activar el micrófono:', error);
    })
    .finally(emitPeers);
  // Browsers may block autoplay until a user gesture; joining is one.
  void room.startAudio().catch(() => undefined);

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
    setCameraEnabled: async (enabled) => {
      await room.localParticipant.setCameraEnabled(enabled);
      emitPeers();
      return room.localParticipant.isCameraEnabled;
    },
    setScreenShareEnabled: async (enabled) => {
      await room.localParticipant.setScreenShareEnabled(enabled, { audio: true, selfBrowserSurface: 'exclude' });
      emitPeers();
      return room.localParticipant.isScreenShareEnabled;
    },
    disconnect: async () => {
      leaving = true;
      await room.disconnect();
    },
  };
}
