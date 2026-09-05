import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Monitor,
  Volume2,
  VolumeX,
  Waves,
  Radio,
  Bell,
  ChevronDown,
  Maximize2,
  X,
  Sparkles,
  Video,
  VideoOff,
  MessageSquare,
  Compass,
  PhoneOff,
  Send,
  Smile,
  Sliders,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { SpatialAudioRadar } from './SpatialAudioRadar';
import { MOCK_USERS } from '../../data/mockData';
import { soundFx } from '../../utils/soundEffects';

export const VoiceRoom: React.FC = () => {
  const {
    activeServer,
    activeChannel,
    currentUser,
    toggleMute,
    toggleDeafen,
    toggleCamera,
    toggleScreenShare,
    joinVoiceChannel,
    leaveVoiceChannel,
    isInVoice,
    activeVoiceChannelId,
    setIsSoundboardOpen,
    openUserProfile,
    messages,
    sendMessage,
  } = useApp();

  const [antirruido, setAntirruido] = useState(true);
  const [testingMic, setTestingMic] = useState(false);
  const [dotsActive, setDotsActive] = useState([true, true, true, false, false, false, false, false, false]);

  // Stage View Mode: 'grid' | 'radar'
  const [stageViewMode, setStageViewMode] = useState<'grid' | 'radar'>('grid');
  // Integrated Voice Text Chat Drawer
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Simulated Speaking Pulses for Server Room Mates
  const [elenaSpeaking, setElenaSpeaking] = useState(true);
  const [marcusSpeaking, setMarcusSpeaking] = useState(false);

  // Volume states for participants
  const [volumes, setVolumes] = useState<Record<string, number>>({
    user_elena: 100,
    user_marcus: 90,
    user_ai: 80,
  });

  // Real Screen Sharing
  const videoRef = useRef<HTMLVideoElement>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Real Camera Stream
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Audio Context for real mic testing / detection
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isConnected = isInVoice && activeVoiceChannelId === activeChannel.id;

  // Auto-scroll chat drawer
  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatOpen, messages]);

  // Simulate periodic realistic talking from Elena and Marcus
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      setElenaSpeaking((prev) => !prev);
      if (Math.random() > 0.6) {
        setMarcusSpeaking((prev) => !prev);
      }
    }, 3200);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Cleanup media streams on unmount
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [screenStream, cameraStream]);

  // Update screen video element when screenStream changes
  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Update camera video element when cameraStream changes
  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const handleVoiceToggle = () => {
    if (isConnected) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }
      leaveVoiceChannel();
      toast.info('Desconectado de la sala de voz');
    } else {
      joinVoiceChannel(activeChannel.id);
      toast.success('Conectado a la sala con audio de baja latencia');
    }
  };

  const handleScreenShareToggle = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      if (currentUser.isScreenSharing) toggleScreenShare();
      toast.info('Transmisión de pantalla finalizada');
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast.error('Tu entorno no soporta la API de captura de pantalla');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setScreenStream(stream);
      if (!currentUser.isScreenSharing) toggleScreenShare();
      toast.success('Transmitiendo pantalla en vivo');

      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        if (currentUser.isScreenSharing) toggleScreenShare();
        toast.info('La transmisión de pantalla terminó');
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (!errorMsg.includes('Permission denied')) {
        toast.error('No se pudo iniciar la transmisión de pantalla');
      }
    }
  };

  const handleCameraToggle = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
      if (currentUser.isCameraOn) toggleCamera();
      toast.info('Cámara desactivada');
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toggleCamera();
        toast.info('Modo avatar de video activo');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (!currentUser.isCameraOn) toggleCamera();
      toast.success('Cámara web activada');
    } catch {
      toggleCamera();
      toast.info('Modo avatar de video activo');
    }
  };

  const handleMicTestToggle = async () => {
    if (testingMic) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      setTestingMic(false);
      setDotsActive(Array.from({ length: 9 }, () => false));
      toast.info('Prueba de micrófono finalizada');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      setTestingMic(true);
      toast.success('Micrófono conectado. Habla para probar la modulación en tiempo real');

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        const count = Math.min(9, Math.round((avg / 64) * 9));
        setDotsActive(Array.from({ length: 9 }, (_, i) => i < Math.max(1, count)));
        animFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setTestingMic(true);
      toast.info('Iniciando prueba simulada de frecuencias...');
      const interval = setInterval(() => {
        setDotsActive(Array.from({ length: 9 }, () => Math.random() > 0.35));
      }, 150);
      setTimeout(() => clearInterval(interval), 5000);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="flex-1 h-full w-full bg-[#0b0e14] flex overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif] relative">
      {/* Main Voice Room Stage Area */}
      <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto custom-scrollbar relative min-w-0">
        {/* 1. Header Section */}
        <div className="space-y-3 shrink-0">
          {/* Top Server & Actions Bar */}
          <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Volume2 size={16} className={isConnected ? 'animate-pulse' : ''} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm md:text-base font-bold text-white tracking-wide font-['Outfit'] truncate">
                    {activeChannel.name}
                  </h1>
                  {isConnected && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <Radio size={10} className="animate-pulse" /> 11ms RTC
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeServer.name} · {activeChannel.topic || 'Audio de ultra-baja latencia 96kHz'}
                </p>
              </div>
            </div>

            {/* Stage View & Controls Right Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Toggle Grid vs Radar 3D */}
              <div className="flex items-center p-0.5 rounded-xl bg-[#141824] border border-white/[0.06]">
                <button
                  onClick={() => setStageViewMode('grid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    stageViewMode === 'grid'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista de cuadrícula de participantes"
                >
                  Cuadrícula
                </button>
                <button
                  onClick={() => setStageViewMode('radar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    stageViewMode === 'radar'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Audio espacial 3D interactivo"
                >
                  <Compass size={12} />
                  <span>Radar 3D</span>
                </button>
              </div>

              {/* Soundboard trigger */}
              <button
                onClick={() => {
                  soundFx.playJoinVoice();
                  setIsSoundboardOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2234] border border-white/[0.06] text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Abrir soundboard"
              >
                <Sparkles size={13} className="text-pink-400" />
                <span className="hidden sm:inline">Sonidos</span>
              </button>

              {/* Toggle Voice Text Chat Drawer */}
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                  isChatOpen
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-[#141824] hover:bg-[#1c2234] border-white/[0.06] text-slate-400 hover:text-white'
                }`}
                title="Abrir chat de texto de la sala de voz"
              >
                <MessageSquare size={14} />
                {messages.length > 0 && !isChatOpen && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1 ring-1 ring-[#0b0e14]" />
                )}
              </button>

              {/* Main Connect / Disconnect button */}
              <button
                onClick={handleVoiceToggle}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                  isConnected
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-emerald-500/20'
                }`}
              >
                {isConnected ? (
                  <>
                    <PhoneOff size={13} />
                    <span className="hidden sm:inline">Desconectar</span>
                  </>
                ) : (
                  <>
                    <Radio size={13} />
                    <span>Entrar a la voz</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Audio Calibration & Noise Suppression Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-3 rounded-xl bg-[#121622]/80 border border-white/[0.05]">
            <div
              onClick={handleMicTestToggle}
              className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white transition-colors"
              title="Haz clic para calibrar el micrófono en tiempo real"
            >
              <span className="text-emerald-400 font-bold">🎤 Calibrador:</span>
              <span className="text-[11px] text-slate-400">
                {testingMic
                  ? 'Detectando decibelios en vivo...'
                  : isConnected
                  ? 'Transmisión WebRTC 96kHz activa'
                  : 'Probar entrada de micrófono'}
              </span>
              <div className="flex items-center gap-1 px-1">
                {dotsActive.map((active, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-100 ${
                      active ? 'bg-emerald-400 scale-125 shadow-[0_0_6px_#34d399]' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => {
                  setAntirruido(!antirruido);
                  toast.success(`Supresión de ruido RNNoise ${!antirruido ? 'activada' : 'desactivada'}`);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  antirruido
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-white'
                }`}
              >
                <Waves size={12} />
                <span>RNNoise AI: {antirruido ? 'Activado' : 'Desactivado'}</span>
              </button>

              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                Opus Fullband · E2EE
              </span>
            </div>
          </div>
        </div>

        {/* 2. Main Center Stage */}
        <div className="flex-1 my-3 rounded-2xl bg-[#080b11] border border-white/[0.05] p-3 flex flex-col justify-center items-center relative overflow-hidden min-h-[360px]">
          {/* Radar Mode Switch */}
          {stageViewMode === 'radar' ? (
            <div className="w-full h-full">
              <SpatialAudioRadar />
            </div>
          ) : screenStream ? (
            /* Active Live Screen Share Player Mode */
            <div className="w-full h-full flex flex-col items-center justify-center relative rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between p-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 z-20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white font-['Outfit']">
                    {currentUser.displayName} está transmitiendo en vivo
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold">
                    1080p 60 FPS · Ultra HD
                  </span>
                </div>

                <button
                  onClick={handleScreenShareToggle}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <X size={13} />
                  <span>Detener pantalla</span>
                </button>
              </div>

              {/* Floating bottom thumbnails of members while screensharing */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 z-20 pointer-events-auto">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10">
                  <div className="relative">
                    <img
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={currentUser.displayName}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-400 shadow-[0_0_8px_#34d399]"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black" />
                  </div>
                  <span className="text-xs font-bold text-white">{currentUser.displayName} (Tú)</span>
                  <span className="text-slate-500">|</span>
                  <img
                    src={MOCK_USERS.user_elena.avatar}
                    alt="Elena"
                    className={`w-7 h-7 rounded-full object-cover ${elenaSpeaking ? 'ring-2 ring-emerald-400 shadow-[0_0_8px_#34d399]' : 'opacity-70'}`}
                  />
                  <img
                    src={MOCK_USERS.user_marcus.avatar}
                    alt="Marcus"
                    className={`w-7 h-7 rounded-full object-cover ${marcusSpeaking ? 'ring-2 ring-emerald-400 shadow-[0_0_8px_#34d399]' : 'opacity-70'}`}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Multi-Participant Bento Voice Grid Stage */
            <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
              {/* Participant 1: YOU (currentUser) */}
              <div className="rounded-2xl bg-[#111522] border border-white/[0.08] p-4 flex flex-col justify-between relative overflow-hidden shadow-xl group/card">
                {/* Background gradient / camera stream */}
                {currentUser.isCameraOn ? (
                  <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <video
                      ref={cameraVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 text-[9px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                      CÁMARA HD
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-transparent pointer-events-none" />
                )}

                {/* Top User Card Status */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/50 text-slate-300 backdrop-blur-sm border border-white/10">
                    Tú · Propietario
                  </span>
                  <div className="flex items-center gap-1 text-slate-300">
                    {currentUser.isMuted && (
                      <span className="p-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30" title="Silenciado">
                        <MicOff size={12} />
                      </span>
                    )}
                    {currentUser.isDeafened && (
                      <span className="p-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30" title="Ensordecido">
                        <Headphones size={12} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Center Avatar & Speaking Green Ring */}
                {!currentUser.isCameraOn && (
                  <div className="flex flex-col items-center justify-center my-auto z-10 py-4">
                    <div className="relative">
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.displayName}
                          className={`w-20 h-20 rounded-2xl object-cover transition-all duration-200 ${
                            isConnected && !currentUser.isMuted
                              ? 'ring-4 ring-emerald-400 shadow-[0_0_20px_#10b981]'
                              : 'border border-white/10'
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-20 h-20 rounded-2xl bg-[#1c2234] border border-white/10 flex items-center justify-center text-2xl font-bold text-white font-['Outfit'] shadow-xl ${
                            isConnected && !currentUser.isMuted
                              ? 'ring-4 ring-emerald-400 shadow-[0_0_20px_#10b981]'
                              : ''
                          }`}
                        >
                          {(currentUser.displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}

                      {isConnected && !currentUser.isMuted && (
                        <span className="w-4 h-4 rounded-full bg-emerald-400 absolute -bottom-1 -right-1 ring-2 ring-[#111522] animate-pulse" />
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom User Name & Audio Waves Bar */}
                <div className="flex items-center justify-between z-10 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/[0.06] mt-auto">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs font-bold text-white font-['Outfit'] truncate">
                      {currentUser.displayName}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">(Tú)</span>
                  </div>

                  {isConnected && !currentUser.isMuted && (
                    <div className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
                    </div>
                  )}
                </div>
              </div>

              {/* Participant 2: Elena Vance */}
              <div
                onClick={() => openUserProfile(MOCK_USERS.user_elena)}
                className="rounded-2xl bg-[#111522] border border-white/[0.08] p-4 flex flex-col justify-between relative overflow-hidden shadow-xl group/card cursor-pointer hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 backdrop-blur-sm border border-cyan-500/30">
                    Rust Lead · Core
                  </span>
                  {elenaSpeaking && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1">
                      <Radio size={9} className="animate-pulse" /> HABLANDO
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center my-auto z-10 py-4">
                  <div className="relative">
                    <img
                      src={MOCK_USERS.user_elena.avatar}
                      alt={MOCK_USERS.user_elena.displayName}
                      className={`w-20 h-20 rounded-2xl object-cover transition-all duration-200 ${
                        elenaSpeaking
                          ? 'ring-4 ring-emerald-400 shadow-[0_0_20px_#10b981] scale-105'
                          : 'border border-white/10'
                      }`}
                    />
                    {elenaSpeaking && (
                      <span className="w-4 h-4 rounded-full bg-emerald-400 absolute -bottom-1 -right-1 ring-2 ring-[#111522] animate-pulse" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between z-10 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/[0.06] mt-auto">
                  <span className="text-xs font-bold text-white font-['Outfit'] truncate">
                    {MOCK_USERS.user_elena.displayName}
                  </span>

                  {/* Audio wave pulse when speaking */}
                  {elenaSpeaking ? (
                    <div className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                      <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce delay-75" />
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce delay-150" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">100% vol</span>
                  )}
                </div>
              </div>

              {/* Participant 3: Marcus Void */}
              <div
                onClick={() => openUserProfile(MOCK_USERS.user_marcus)}
                className="rounded-2xl bg-[#111522] border border-white/[0.08] p-4 flex flex-col justify-between relative overflow-hidden shadow-xl group/card cursor-pointer hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 backdrop-blur-sm border border-purple-500/30">
                    Audio DSP · WebRTC
                  </span>
                  {marcusSpeaking && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1">
                      <Radio size={9} className="animate-pulse" /> HABLANDO
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center my-auto z-10 py-4">
                  <div className="relative">
                    <img
                      src={MOCK_USERS.user_marcus.avatar}
                      alt={MOCK_USERS.user_marcus.displayName}
                      className={`w-20 h-20 rounded-2xl object-cover transition-all duration-200 ${
                        marcusSpeaking
                          ? 'ring-4 ring-emerald-400 shadow-[0_0_20px_#10b981] scale-105'
                          : 'border border-white/10'
                      }`}
                    />
                    {marcusSpeaking && (
                      <span className="w-4 h-4 rounded-full bg-emerald-400 absolute -bottom-1 -right-1 ring-2 ring-[#111522] animate-pulse" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between z-10 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/[0.06] mt-auto">
                  <span className="text-xs font-bold text-white font-['Outfit'] truncate">
                    {MOCK_USERS.user_marcus.displayName}
                  </span>

                  {marcusSpeaking ? (
                    <div className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                      <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce delay-75" />
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce delay-150" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">Calibrando 96kHz</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Discord-Tier Floating Stage Voice Control Dock (Bottom Island) */}
        <div className="flex items-center justify-center shrink-0 pt-1 pb-1">
          <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-[#141824]/90 border border-white/[0.08] shadow-2xl backdrop-blur-xl">
            {/* Mic Button */}
            <button
              onClick={toggleMute}
              className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                currentUser.isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.06]'
              }`}
              title={currentUser.isMuted ? 'Activar micrófono (Ctrl+Shift+M)' : 'Silenciar micrófono (Ctrl+Shift+M)'}
            >
              {currentUser.isMuted ? <MicOff size={17} /> : <Mic size={17} />}
            </button>

            {/* Deafen Button */}
            <button
              onClick={toggleDeafen}
              className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                currentUser.isDeafened
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.06]'
              }`}
              title={currentUser.isDeafened ? 'Desensordecer audio' : 'Ensordecer audio'}
            >
              <Headphones size={17} />
            </button>

            {/* Camera Button */}
            <button
              onClick={handleCameraToggle}
              className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                currentUser.isCameraOn
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.06]'
              }`}
              title={currentUser.isCameraOn ? 'Desactivar cámara' : 'Activar cámara'}
            >
              {currentUser.isCameraOn ? <Video size={17} /> : <VideoOff size={17} />}
            </button>

            {/* Screen Share Button */}
            <button
              onClick={handleScreenShareToggle}
              className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                screenStream
                  ? 'bg-purple-600 text-white border border-purple-500'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.06]'
              }`}
              title={screenStream ? 'Detener transmisión de pantalla' : 'Transmitir pantalla (Ultra HD 60 FPS)'}
            >
              <Monitor size={17} />
            </button>

            {/* Soundboard Button */}
            <button
              onClick={() => {
                soundFx.playJoinVoice();
                setIsSoundboardOpen(true);
              }}
              className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-pink-400 border border-white/[0.06] transition-all cursor-pointer flex items-center justify-center"
              title="Panel de efectos de sonido"
            >
              <Sparkles size={17} />
            </button>

            {/* Chat Drawer Toggle */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                isChatOpen
                  ? 'bg-purple-600 text-white border border-purple-500'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/[0.06]'
              }`}
              title="Abrir chat de texto de la sala"
            >
              <MessageSquare size={17} />
            </button>

            <div className="w-px h-6 bg-white/10 mx-0.5" />

            {/* Disconnect Button (Discord Red Phone) */}
            <button
              onClick={handleVoiceToggle}
              className="p-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
              title="Desconectarse del canal de voz"
            >
              <PhoneOff size={16} />
              <span className="text-xs font-bold">Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Integrated Voice Channel Text Chat Drawer (Discord Voice Chat Drawer) */}
      {isChatOpen && (
        <div className="w-72 md:w-80 h-full bg-[#0d1017] border-l border-white/[0.06] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 shrink-0">
          {/* Drawer Header */}
          <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-purple-400" />
              <h3 className="text-xs font-bold text-white font-['Outfit']">
                Chat de #{activeChannel.name}
              </h3>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <MessageSquare size={24} className="mb-2 text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">Sin mensajes aún</p>
                <p className="text-[11px] mt-0.5">Envía notas, enlaces o comentarios mientras hablas en el canal.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="space-y-0.5 group/msg">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200 font-['Outfit']">
                      {m.author.displayName}
                    </span>
                    <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed break-words bg-white/[0.02] p-2 rounded-xl border border-white/[0.03]">
                    {m.content}
                  </p>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendChatMessage} className="p-2.5 border-t border-white/[0.06] bg-[#0b0e14]">
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#141824] border border-white/[0.08] focus-within:border-purple-500/50 transition-colors">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Enviar mensaje a #${activeChannel.name}...`}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-2"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition-all cursor-pointer shrink-0"
              >
                <Send size={13} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
