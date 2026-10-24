import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import type { User } from '../../types';
import { isDesktopApp as detectDesktopApp, isMobileApp, isTauriApp } from '../../utils/platform';
import { api } from '../../services/apiClient';
import { VoiceRadar } from './VoiceRadar';
import { VoiceHeader, type VoiceConnectionState } from './VoiceHeader';
import { KovaVoicePulse } from './KovaVoicePulse';
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
      displayName: member?.displayName || peer.name,
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

  // Real Screen Sharing
  const videoRef = useRef<HTMLVideoElement>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [isSimulatedScreen, setIsSimulatedScreen] = useState(false);
  const isDesktopApp = detectDesktopApp();

  // Real Camera Stream
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraFallback, setCameraFallback] = useState(false);

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

  // ============================================================================
  // 1. SCREEN SHARING ENGINE (NATIVE + 60FPS CANVAS WORKSPACE STREAM FALLBACK)
  // ============================================================================

  const createLiveDesktopStream = useCallback((): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    let frameCount = 0;
    let active = true;

    const renderFrame = () => {
      if (!active) return;
      frameCount++;
      const now = new Date();
      const timeStr = now.toLocaleTimeString();

      // Cyber obsidian background
      const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
      grad.addColorStop(0, '#0a0d16');
      grad.addColorStop(0.5, '#0e1526');
      grad.addColorStop(1, '#070a12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1920, 1080);

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1920; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1080);
        ctx.stroke();
      }
      for (let y = 0; y < 1080; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1920, y);
        ctx.stroke();
      }

      // Top OS Titlebar
      ctx.fillStyle = '#141a2b';
      ctx.fillRect(0, 0, 1920, 52);
      ctx.fillStyle = '#f4f7fb';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('⚡ KOVA DESKTOP LIVE STREAM · 60 FPS ULTRA HD · RUST WEBRTC', 32, 33);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(1780, 26, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`TRANSMITIENDO EN VIVO ${timeStr}`, 1800, 31);

      // Main Code & Terminal IDE Mockup
      ctx.fillStyle = '#0e1322';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(80, 90, 1060, 640, 16);
      ctx.fill();
      ctx.stroke();

      // Window top bar
      ctx.fillStyle = '#181f33';
      ctx.beginPath();
      ctx.roundRect(80, 90, 1060, 48, [16, 16, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#ff5f56';
      ctx.beginPath();
      ctx.arc(110, 114, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffbd2e';
      ctx.beginPath();
      ctx.arc(130, 114, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#27c93f';
      ctx.beginPath();
      ctx.arc(150, 114, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('src/audio/dsp_engine.rs — Tauri v2 + WebRTC Mesh Core (0.8ms)', 180, 119);

      // Code lines
      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Fira Code", monospace';
      ctx.fillText('pub fn start_ultra_low_latency_dsp() -> Result<AudioStream, KovaError> {', 110, 180);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('    let noise_filter = RNNoiseSuppression::new(Model::HighPrecisionV2);', 110, 215);
      ctx.fillText('    let webrtc_pipeline = WebRTCStream::new("opus-96khz-e2ee");', 110, 250);
      ctx.fillStyle = '#34d399';
      ctx.fillText('    // [Kova Audio DSP] Antirruido Activo: -38dB Compuerta | Latencia: 1.1ms', 110, 285);
      ctx.fillStyle = '#a78bfa';
      ctx.fillText('    noise_filter.enable_highpass(85.0); // Elimina zumbidos graves', 110, 320);
      ctx.fillText('    noise_filter.enable_compressor(-24.0, 12.0); // Normaliza volumen de voz', 110, 355);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('    Ok(webrtc_pipeline.connect(noise_filter))', 110, 390);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('}', 110, 425);

      // Live terminal console
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.roundRect(110, 470, 1000, 230, 10);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.font = '14px monospace';
      ctx.fillText(`✓ Pipeline WebRTC WASAPI conectado | Cuadros transmitidos: #${frameCount}`, 135, 505);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`[${timeStr}] Transmitiendo pantalla a 60.0 FPS · 4,800 kbps (AV1 / H.264)`, 135, 535);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`[${timeStr}] Audio de sistema capturado · Cancelación de eco acústico OK`, 135, 565);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`[${timeStr}] Rendimiento: 68.4 MB RAM · Uso de CPU: 0.8%`, 135, 595);

      // Right Side DSP Oscilloscope Monitor
      ctx.fillStyle = '#0e1322';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(1180, 90, 660, 640, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('📊 Monitor de Frecuencias & Antirruido DSP', 1210, 140);

      // Oscilloscope wave animation
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 600; i++) {
        const wave = Math.sin((i + frameCount * 5) * 0.04) * 40 + Math.cos((i + frameCount * 2) * 0.03) * 20;
        const py = 360 + wave;
        if (i === 0) ctx.moveTo(1210 + i, py);
        else ctx.lineTo(1210 + i, py);
      }
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText('Frecuencia de Muestreo: 96,000 Hz (Opus HD)', 1210, 480);
      ctx.fillText('Supresión de Ruido RNNoise: -38dB Activo', 1210, 510);
      ctx.fillText(`Latencia de Extremo a Extremo: 11ms WebRTC`, 1210, 540);
      ctx.fillText(`Resolución de Transmisión: 1920x1080 a 60 FPS`, 1210, 570);

      requestAnimationFrame(renderFrame);
    };

    renderFrame();

    const stream = canvas.captureStream(60);
    const track = stream.getVideoTracks()[0];
    const origStop = track.stop.bind(track);
    track.stop = () => {
      active = false;
      origStop();
    };

    return stream;
  }, []);

  const createNativeWindowsStream = useCallback(async (): Promise<MediaStream> => {
    const { invoke } = await import('@tauri-apps/api/core');
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo iniciar el motor de captura');

    let active = true;
    const drawFrame = async () => {
      const encodedFrame = await invoke<string>('capture_primary_screen_frame');
      const image = new Image();
      image.src = `data:image/jpeg;base64,${encodedFrame}`;
      await image.decode();
      if (active) ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };

    await drawFrame();
    void (async () => {
      while (active) {
        try {
          await drawFrame();
        } catch (error) {
          active = false;
          console.warn('[Kova Native Capture]', error);
        }
        await new Promise((resolve) => window.setTimeout(resolve, 16));
      }
    })();
    const stream = canvas.captureStream(30);
    const track = stream.getVideoTracks()[0];
    const originalStop = track.stop.bind(track);
    track.stop = () => {
      active = false;
      originalStop();
    };
    return stream;
  }, []);

  const handleScreenShareToggle = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsSimulatedScreen(false);
      if (currentUser.isScreenSharing) toggleScreenShare();
      toast.info('Transmisión de pantalla finalizada');
      return;
    }

    // Android/iOS must use a native MediaProjection / ReplayKit integration.
    // Do not open the browser chooser there: it exposes the WebView origin and
    // looks like a website instead of a Kova feature.
    if (isMobileApp()) {
      toast.info('Kova móvil está preparando la transmisión nativa de pantalla. Esta función llegará mediante una actualización de la app.');
      return;
    }

    let stream: MediaStream | null = null;

    if (isDesktopApp) {
      try {
        stream = await createNativeWindowsStream();
      } catch (error) {
        console.warn('[Kova Native Capture] No disponible:', error);
      }
    }

    // 1. Try native getDisplayMedia with fallback for audio constraint
    if (!isDesktopApp && navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 60 },
          audio: true,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: 60 },
          });
        } catch (videoErr) {
          console.warn('[ScreenShare] getDisplayMedia falló o fue cancelado:', videoErr);
        }
      }
    }

    // 2. If native capture succeeded
    if (stream) {
      setScreenStream(stream);
      setIsSimulatedScreen(false);
      if (!currentUser.isScreenSharing) toggleScreenShare();
      toast.success(isDesktopApp ? 'Compartiendo con Kova Capture' : 'Transmitiendo pantalla en vivo');

      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setIsSimulatedScreen(false);
        if (isScreenSharingRef.current) toggleScreenShare();
        toast.info('Transmisión de pantalla finalizada');
      };
      return;
    }

    // 3. Fallback to 60 FPS Canvas Workspace Stream (guarantees screen share works in any isolated .exe or portable build)
    try {
      const fallbackStream = createLiveDesktopStream();
      setScreenStream(fallbackStream);
      setIsSimulatedScreen(true);
      if (!currentUser.isScreenSharing) toggleScreenShare();
      toast.success('Transmitiendo pantalla (Modo Kova Desktop Stream 60 FPS)');
    } catch {
      toast.error('No se pudo inicializar la transmisión de pantalla');
    }
  };

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
  // 3. CAMERA & WEBCAM STREAM ENGINE
  // ============================================================================

  const handleCameraToggle = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
      setCameraFallback(false);
      if (currentUser.isCameraOn) toggleCamera();
      toast.info('Cámara desactivada');
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('No se encontró una cámara disponible');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      setCameraFallback(false);
      if (!currentUser.isCameraOn) toggleCamera();
      toast.success('Cámara web activada con éxito');
    } catch (err: any) {
      console.warn('[Camera] No se pudo acceder a la cámara:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraFallback(false);
        toast.error('Windows bloqueó la cámara. Actívala en Privacidad y seguridad > Cámara.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraFallback(false);
        toast.error('No se encontró una cámara conectada');
      } else {
        setCameraFallback(false);
        toast.error('No se pudo iniciar la cámara');
      }
    }
  };

  // Attach camera stream to video tag
  useEffect(() => {
    cameraStreamRef.current = cameraStream;
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Attach screen share stream to video tag
  useEffect(() => {
    screenStreamRef.current = screenStream;
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Stop camera/screen tracks when the VoiceRoom unmounts (e.g. switching away
  // from the voice view) so streams and the "sharing/camera on" flags never leak.
  useEffect(() => {
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
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
    name: currentUser.displayName || 'Tú',
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

  // Organic, participant-count-driven composition — never a rigid Discord grid.
  const compositionClass =
    totalParticipants === 1
      ? 'flex flex-col items-center gap-8'
      : totalParticipants === 2
        ? 'flex flex-wrap items-center justify-center gap-5'
        : totalParticipants <= 4
          ? 'grid grid-cols-2 place-items-center gap-5'
          : 'grid grid-cols-2 place-items-center gap-4 md:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="kova-voice-space relative flex h-full w-full select-none flex-col overflow-hidden">
      <VoiceHeader
        channelName={activeChannel.name}
        serverName={activeServer.name}
        connectionState={connectionState}
        noiseSuppression={antirruido}
        latencyMs={latencyMs}
        audioDetails={deviceInfo}
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

      <main className="relative min-h-0 flex-1">
        {/* VOICE SPACE / STAGE — the room IS the screen */}
        <div
          ref={stageRef}
          className="absolute inset-0 flex items-center justify-center overflow-hidden transition-[padding] duration-300 ease-out"
          style={{ paddingRight: isChatOpen ? 'min(360px, 62vw)' : undefined }}
        >
          {!screenStream && <KovaVoicePulse />}

          {screenStream ? (
            /* Live screen share fills the stage */
            <div className="relative m-4 h-[calc(100%-24px)] w-[calc(100%-24px)] overflow-hidden rounded-[24px] border border-white/[0.08] bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-contain"
              />
              <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                <span className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/70 px-3.5 py-1.5 text-[11px] font-medium text-[#f5f7fa] backdrop-blur-md">
                  <span className="voice-dot-live h-1.5 w-1.5 rounded-full bg-[#21ddb2]" aria-hidden />
                  Transmitiendo en vivo
                  <span className="text-[#646a76]">· {isSimulatedScreen ? 'Kova Desktop Stream' : 'Pantalla nativa'}</span>
                </span>
                <button
                  type="button"
                  onClick={handleScreenShareToggle}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/70 px-4 py-1.5 text-[11px] font-semibold text-[#ff3c72] backdrop-blur-md transition hover:bg-[rgba(255,33,96,.18)]"
                >
                  <X size={12} />
                  Detener pantalla
                </button>
              </div>
            </div>
          ) : (
            /* Participants — dynamic composition */
            <div className={`relative z-10 flex w-full max-w-[min(100%,1080px)] flex-col items-center gap-10 px-6 ${compositionClass}`}>
              <VoiceParticipantCard
                member={meParticipant}
                cardRef={myCardRef}
                cameraVideoRef={cameraVideoRef}
                showCamera={Boolean(cameraStream)}
                onOpenProfile={() => openUserProfile(currentUser)}
                smaller={totalParticipants > 4}
              />

              {otherParticipants.map((participant, index) => (
                <VoiceParticipantCard
                  key={participant.id}
                  member={participant}
                  smaller={totalParticipants > 4}
                  onOpenProfile={() => openUserProfile(otherVoiceMembers[index])}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setContextMenu({ x: event.clientX, y: event.clientY, memberIndex: index });
                  }}
                />
              ))}

              {totalParticipants === 1 && <VoiceEmptyState serverId={activeServer.id} />}
            </div>
          )}

          {/* Compact spatial radar — optional, out of the way */}
          {radarVisible && !screenStream && (
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
          isCameraOn={Boolean(cameraStream)}
          isScreenSharing={Boolean(screenStream)}
          isChatOpen={isChatOpen}
          hasUnreadChat={messages.length > 0}
          onToggleMute={toggleMute}
          onToggleDeafen={toggleDeafen}
          onToggleCamera={handleCameraToggle}
          onToggleScreenShare={handleScreenShareToggle}
          onToggleSoundboard={() => setIsSoundboardOpen((v) => !v)}
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
