import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import type { User } from '../../types';
import { isDesktopApp as detectDesktopApp, isMobileApp, isTauriApp } from '../../utils/platform';
import { api } from '../../services/apiClient';
import { VoiceRadar } from './VoiceRadar';
import { VoiceHeader, type VoiceConnectionState } from './VoiceHeader';
import '../../styles/voiceRoom.css';
import { VideoTrackView } from './VideoTrackView';
import { VoiceParticipantCard, type VoiceParticipant } from './VoiceParticipantCard';
import { VoiceControlDock } from './VoiceControlDock';
import { VoiceEmptyState } from './VoiceEmptyState';
import { VoiceSoundboardPanel } from './VoiceSoundboardPanel';
import { VoiceChatPanel } from './VoiceChatPanel';
import { ParticipantContextMenu, MENU_ICONS, type ParticipantMenuAction } from './ParticipantContextMenu';

export const VoiceRoom: React.FC = () => {
  const {
    activeServer,
    activeChannel,
    currentUser,
    setCurrentUser,
    updateUserProfile,
    toggleMute,
    toggleDeafen,
    toggleCamera,
    toggleScreenShare,
    joinVoiceChannel,
    voicePeers,
    isVoiceConnecting,
    leaveVoiceChannel,
    openUserProfile,
    messages,
    openInviteModal,
    isInVoice,
    activeVoiceChannelId,
  } = useApp();

  // Audio DSP & Noise Suppression
  const [antirruido, setAntirruido] = useState(true);
  const [isMicHardwareAvailable, setIsMicHardwareAvailable] = useState(true);

  // Room UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [radarVisible, setRadarVisible] = useState(false);
  const [pipelineReady, setPipelineReady] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{ sampleRate: number | null; inputDevice: string | null; outputDevice: string | null }>({
    sampleRate: null,
    inputDevice: null,
    outputDevice: null,
  });

  // Only render people actually present in the LiveKit room for this channel;
  // speaking and mute state come live from LiveKit, profile data from the roster.
  const livePeers = activeVoiceChannelId === activeChannel?.id ? voicePeers.filter((peer) => !peer.isLocal) : [];
  const otherVoiceMembers: User[] = livePeers.map((peer) => {
    const member = activeServer?.members?.find((m) => m.id === peer.id);
    return {
      ...(member || { id: peer.id, username: peer.name, tag: '0000', status: 'online' as const, roles: [] }),
      displayName: member?.nickname || member?.displayName || peer.name,
      avatar: member?.avatar || peer.avatar || '',
      isSpeaking: peer.isSpeaking,
      isMuted: peer.isMuted,
    };
  });
  const voiceDisplayName = (member: typeof otherVoiceMembers[number], index: number) => {
    const raw = String(member.displayName || '').trim();
    if (raw && !/^\d{8,}$/.test(raw)) return raw;
    return /ia|bot/i.test(String(member.username || '')) ? 'Kova IA' : `Invitado ${index + 1}`;
  };
  const voiceRoleLabel = (member: typeof otherVoiceMembers[number]) => {
    const roleId = member.roles?.[0];
    if (!roleId) return undefined;
    const label = activeServer?.roles?.find((role) => role.id === roleId)?.name;
    return label && label !== 'Miembro' ? label : undefined;
  };

  // Audio Context & Real DSP Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const highpassFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Live-audio surfaces — the rAF loop writes CSS custom properties here,
  // never React state, so the voice UI reacts at 60fps without re-renders.
  const stageRef = useRef<HTMLDivElement>(null);
  const myCardRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const isConnected = isInVoice && activeVoiceChannelId === activeChannel.id;

  // Camera and screen are LiveKit tracks carried on each peer.
  const roomPeers = isConnected ? voicePeers : [];
  const localPeer = roomPeers.find((peer) => peer.isLocal);
  const screens = roomPeers.filter((peer) => peer.screenTrack);
  const [focusedScreenId, setFocusedScreenId] = useState<string | null>(null);
  const focusedScreen = screens.find((peer) => peer.id === focusedScreenId) || screens[0];

  // ============================================================================
  // 2. REAL MICROPHONE, WEBRTC AUDIO & ANTIRRUIDO DSP ENGINE
  // ============================================================================

  // Refs to track live mute/deafen without re-creating Web Audio pipeline
  const isMutedRef = useRef(currentUser.isMuted);
  const isDeafenedRef = useRef(currentUser.isDeafened);
  const isScreenSharingRef = useRef(currentUser.isScreenSharing);
  const isCameraOnRef = useRef(currentUser.isCameraOn);
  useEffect(() => {
    isMutedRef.current = currentUser.isMuted;
  }, [currentUser.isMuted]);
  useEffect(() => {
    isDeafenedRef.current = currentUser.isDeafened;
  }, [currentUser.isDeafened]);
  useEffect(() => {
    isScreenSharingRef.current = currentUser.isScreenSharing;
  }, [currentUser.isScreenSharing]);
  useEffect(() => {
    isCameraOnRef.current = currentUser.isCameraOn;
  }, [currentUser.isCameraOn]);

  const startAudioPipeline = useCallback(async () => {
    // If already running, return
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Try capturing real physical microphone
      let stream: MediaStream | null = null;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          micStreamRef.current = stream;
          setIsMicHardwareAvailable(true);
        }
      } catch (micErr) {
        console.warn('[AudioEngine] Micrófono físico no accesible, usando modo simulado:', micErr);
        setIsMicHardwareAvailable(false);
      }

      // Build Web Audio DSP Nodes
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      // Antirruido High-Pass Filter (Cuts sub-85Hz rumble, table knocks & fan hum)
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = antirruido ? 85 : 20;
      highpassFilterRef.current = highpass;

      // Antirruido Compressor (Normalizes speech level)
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorRef.current = compressor;

      if (stream) {
        const source = ctx.createMediaStreamSource(stream);
        source.connect(highpass);
        highpass.connect(compressor);
        compressor.connect(analyser);
      }

      // Audio measurement & voice activity detection loop.
      // Visual feedback flows through CSS custom properties (--voice-audio,
      // --card-audio, --voice-mic) so the UI breathes at 60fps with ZERO
      // React re-renders; only real isSpeaking changes touch React state.
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;

        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 64);

        stageRef.current?.style.setProperty('--voice-audio', normalized.toFixed(3));
        myCardRef.current?.style.setProperty('--card-audio', normalized.toFixed(3));
        dockRef.current?.style.setProperty('--voice-mic', normalized.toFixed(3));

        // Noise gate threshold: higher when antirruido is on to silence background hum
        const threshold = antirruido ? 18 : 8;
        const isSpeakingNow = avg > threshold && !isMutedRef.current && !isDeafenedRef.current;

        setCurrentUser((prev) => (prev.isSpeaking !== isSpeakingNow ? { ...prev, isSpeaking: isSpeakingNow } : prev));

        animFrameRef.current = requestAnimationFrame(loop);
      };

      loop();
      setPipelineReady(true);

      // Read-only hardware facts for the connection details popover.
      const inputLabel = stream ? stream.getAudioTracks()[0]?.label || null : null;
      setDeviceInfo((prev) => ({ ...prev, sampleRate: ctx.sampleRate, inputDevice: inputLabel }));
      if (navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const output = devices.find((device) => device.kind === 'audiooutput') || null;
          setDeviceInfo((prev) => ({ ...prev, outputDevice: output?.label || null }));
        } catch {
          // Enumeration blocked — keep the popover honest with "—".
        }
      }
    } catch (err) {
      console.error('[AudioEngine] Error al inicializar Web Audio:', err);
      toast.error('No se pudo iniciar el audio de la sala');
    }
  }, [antirruido, setCurrentUser]);

  const stopAudioPipeline = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setPipelineReady(false);
    stageRef.current?.style.setProperty('--voice-audio', '0');
    myCardRef.current?.style.setProperty('--card-audio', '0');
    dockRef.current?.style.setProperty('--voice-mic', '0');
    setCurrentUser((prev) => ({ ...prev, isSpeaking: false }));
  }, [setCurrentUser]);

  // Connect audio when entering voice channel
  useEffect(() => {
    if (isConnected) {
      startAudioPipeline();
    } else {
      stopAudioPipeline();
    }
    return () => {
      stopAudioPipeline();
    };
  }, [isConnected, startAudioPipeline, stopAudioPipeline]);

  // Update hardware mute state
  useEffect(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !currentUser.isMuted;
      });
    }
  }, [currentUser.isMuted]);

  // Update antirruido frequency filter dynamically
  useEffect(() => {
    if (highpassFilterRef.current) {
      highpassFilterRef.current.frequency.value = antirruido ? 85 : 20;
    }
  }, [antirruido]);

  // ============================================================================
  // 4. CONNECTION STATE & REAL LATENCY MEASUREMENT
  // ============================================================================

  // Derive the visual connection state from the real pipeline lifecycle.
  const connectionState: VoiceConnectionState = !isConnected
    ? (isVoiceConnecting ? 'connecting' : 'disconnected')
    : pipelineReady
      ? 'connected'
      : 'connecting';

  // Measure real network round-trip against the app's own health endpoint.
  // (The desktop build runs on a custom protocol: no endpoint, no fake ms.)
  useEffect(() => {
    if (!isConnected || isTauriApp()) {
      setLatencyMs(null);
      return;
    }
    let cancelled = false;
    const measure = async () => {
      try {
        const started = performance.now();
        const response = await fetch('/api/health', { cache: 'no-store' });
        if (response.ok && !cancelled) {
          setLatencyMs(Math.max(1, Math.round(performance.now() - started)));
        }
      } catch {
        if (!cancelled) setLatencyMs(null);
      }
    };
    void measure();
    const interval = window.setInterval(() => void measure(), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isConnected]);

  // Immediate, Clean Voice Disconnect
  const handleDisconnect = () => {
    stopAudioPipeline();
    leaveVoiceChannel();
  };

  // Main Voice Connect / Disconnect Toggle
  const handleVoiceToggle = () => {
    if (isConnected) {
      handleDisconnect();
    } else {
      // The join sound plays once LiveKit actually connects.
      void joinVoiceChannel(activeChannel.id);
    }
  };

  // ============================================================================
  // 5. PARTICIPANT CONTEXT MENU (actions with real backing only)
  // ============================================================================

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; memberIndex: number } | null>(null);

  const buildMenuActions = (memberIndex: number): ParticipantMenuAction[] => {
    const member = otherVoiceMembers[memberIndex];
    if (!member) return [];
    const actions: ParticipantMenuAction[] = [
      {
        key: 'profile',
        label: 'Ver perfil',
        icon: MENU_ICONS.profile,
        onSelect: () => openUserProfile(member),
      },
      {
        key: 'invite',
        label: 'Invitar al espacio',
        icon: MENU_ICONS.invite,
        onSelect: () => openInviteModal(activeServer.id),
      },
    ];
    const targetUserId = member.userId || member.id;
    if (targetUserId && !/bot/i.test(member.id)) {
      actions.push({
        key: 'report',
        label: 'Reportar',
        icon: MENU_ICONS.report,
        danger: true,
        onSelect: () => {
          void api
            .reportUser(targetUserId, 'voice_room', `Reporte desde ${activeChannel.name}`)
            .then(() => toast.success('Reporte enviado al equipo de seguridad de Kova'))
            .catch(() => toast.error('No se pudo enviar el reporte'));
        },
      });
    }
    return actions;
  };

  // ============================================================================
  // 6. VOICE SPACE RENDER
  // ============================================================================

  const meParticipant: VoiceParticipant = {
    id: currentUser.id,
    name: activeServer?.members?.find((m) => m.id === currentUser.id)?.nickname || currentUser.displayName || 'Tú',
    avatar: currentUser.avatar,
    isSpeaking: Boolean(currentUser.isSpeaking),
    isMuted: Boolean(currentUser.isMuted),
    isDeafened: Boolean(currentUser.isDeafened),
    isMe: true,
  };

  const otherParticipants: VoiceParticipant[] = otherVoiceMembers.map((member, index) => ({
    id: member.id,
    name: voiceDisplayName(member, index),
    avatar: member.avatar,
    isSpeaking: Boolean(member.isSpeaking),
    isMuted: Boolean(member.isMuted),
    isDeafened: Boolean(member.isDeafened),
    roleLabel: voiceRoleLabel(member),
  }));

  const totalParticipants = 1 + otherParticipants.length;

  return (
    <div className="kova-voice-space kvr">
      <VoiceHeader
        channelName={activeChannel.name}
        serverName={activeServer.name}
        connectionState={connectionState}
        noiseSuppression={antirruido}
        latencyMs={latencyMs}
        audioDetails={deviceInfo}
        peopleCount={totalParticipants}
        onOpenSoundboard={() => setIsSoundboardOpen((v) => !v)}
        onOpenChat={() => setIsChatOpen((v) => !v)}
        onToggleRadar={() => setRadarVisible((v) => !v)}
        onToggleNoiseSuppression={() => {
          setAntirruido((v) => {
            toast.success(`Supresión de ruido ${!v ? 'activada' : 'desactivada'}`);
            return !v;
          });
        }}
        radarVisible={radarVisible}
      />

      <main className="relative min-h-0 flex-1 flex flex-col">
        <div
          ref={stageRef}
          className="kvr-stage"
          style={{ paddingRight: isChatOpen ? 'min(360px, 62vw)' : undefined }}
        >
          {focusedScreen?.screenTrack && (
            <div className="kvr-screen">
              <VideoTrackView track={focusedScreen.screenTrack} fit="contain" />
              <div className="kvr-screen-bar">
                <span>{focusedScreen.isLocal ? 'Estás compartiendo tu pantalla' : `Pantalla de ${otherParticipants.find((p) => p.id === focusedScreen.id)?.name || focusedScreen.name}`}</span>
                {screens.length > 1 && (
                  <span className="kvr-screen-tabs">
                    {screens.map((peer) => (
                      <button key={peer.id} type="button" className={peer.id === focusedScreen.id ? 'is-on' : ''} onClick={() => setFocusedScreenId(peer.id)}>
                        {peer.isLocal ? 'Tú' : peer.name}
                      </button>
                    ))}
                  </span>
                )}
                {focusedScreen.isLocal && (
                  <button type="button" className="kvr-btn-ghost" onClick={() => void toggleScreenShare()}>
                    <X size={13} /> Dejar de compartir
                  </button>
                )}
              </div>
            </div>
          )}
          <div className={`kvr-grid ${screens.length ? 'is-strip' : ''}`} data-count={Math.min(totalParticipants + (totalParticipants === 1 ? 1 : 0), 3)}>
            <VoiceParticipantCard
              member={meParticipant}
              cardRef={myCardRef}
              cameraTrack={localPeer?.cameraTrack}
              mirrorCamera
              onOpenProfile={() => openUserProfile(currentUser)}
            />

            {otherParticipants.map((participant, index) => (
              <VoiceParticipantCard
                key={participant.id}
                member={participant}
                cameraTrack={livePeers[index]?.cameraTrack}
                onOpenProfile={() => openUserProfile(otherVoiceMembers[index])}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setContextMenu({ x: event.clientX, y: event.clientY, memberIndex: index });
                }}
              />
            ))}

            {totalParticipants === 1 && !screens.length && <VoiceEmptyState serverId={activeServer.id} />}
          </div>

          {/* Compact spatial radar — optional, out of the way */}
          {radarVisible && !screens.length && (
            <div className="absolute bottom-[96px] left-5 z-20 hidden md:block">
              <VoiceRadar
                compact
                me={{
                  id: currentUser.id,
                  name: currentUser.displayName,
                  avatar: currentUser.avatar,
                  radarPos: currentUser.radarPos,
                  isSpeaking: currentUser.isSpeaking,
                }}
                others={otherVoiceMembers.map((m, i) => ({
                  id: m.id,
                  name: voiceDisplayName(m, i),
                  avatar: m.avatar,
                  radarPos: m.radarPos,
                  isSpeaking: Boolean(m.isSpeaking),
                }))}
                onMoveMe={(pos) => updateUserProfile({ radarPos: pos })}
              />
            </div>
          )}
        </div>

        {/* Floating Control Dock — the single home for leave */}
        <VoiceControlDock
          isMuted={Boolean(currentUser.isMuted)}
          isDeafened={Boolean(currentUser.isDeafened)}
          isCameraOn={Boolean(currentUser.isCameraOn)}
          isScreenSharing={Boolean(currentUser.isScreenSharing)}
          isChatOpen={isChatOpen}
          hasUnreadChat={messages.length > 0}
          onToggleMute={toggleMute}
          onToggleDeafen={toggleDeafen}
          onToggleCamera={() => void toggleCamera()}
          onToggleScreenShare={() => void toggleScreenShare()}
          onToggleChat={() => setIsChatOpen((v) => !v)}
          onLeave={handleVoiceToggle}
          dockRef={dockRef}
        />

        {/* Compact soundboard popover */}
        {isSoundboardOpen && <VoiceSoundboardPanel onClose={() => setIsSoundboardOpen(false)} />}

        {/* Right-side chat panel */}
        {isChatOpen && <VoiceChatPanel channelName={activeChannel.name} onClose={() => setIsChatOpen(false)} />}

        {/* Participant context menu */}
        {contextMenu && (
          <ParticipantContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            memberName={voiceDisplayName(otherVoiceMembers[contextMenu.memberIndex], contextMenu.memberIndex)}
            actions={buildMenuActions(contextMenu.memberIndex)}
            onClose={() => setContextMenu(null)}
          />
        )}
      </main>
    </div>
  );
};
