import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Monitor,
  Volume2,
  Waves,
  Radio,
  Bell,
  ChevronDown,
  Maximize2,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';

export const VoiceRoom: React.FC = () => {
  const {
    activeServer,
    activeChannel,
    currentUser,
    toggleMute,
    toggleDeafen,
    toggleScreenShare,
    joinVoiceChannel,
    leaveVoiceChannel,
    isInVoice,
    activeVoiceChannelId,
  } = useApp();

  const [antirruido, setAntirruido] = useState(true);
  const [testingMic, setTestingMic] = useState(false);
  const [dotsActive, setDotsActive] = useState([true, true, true, false, false, false, false, false, false]);

  // Real Screen Sharing
  const videoRef = useRef<HTMLVideoElement>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Audio Context for real mic testing
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isConnected = isInVoice && activeVoiceChannelId === activeChannel.id;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
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
  }, [screenStream]);

  // Update video element when screenStream changes
  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const handleVoiceToggle = () => {
    if (isConnected) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
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
      // Fallback to animated frequency simulation
      setTestingMic(true);
      toast.info('Iniciando prueba simulada de frecuencias...');
      const interval = setInterval(() => {
        setDotsActive(Array.from({ length: 9 }, () => Math.random() > 0.35));
      }, 150);
      setTimeout(() => clearInterval(interval), 5000);
    }
  };

  return (
    <div className="flex-1 h-full w-full bg-[#0f1219] flex flex-col justify-between p-5 select-none relative overflow-y-auto custom-scrollbar font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Header Section */}
      <div className="space-y-4">
        {/* Top Server & Bell Notification Row */}
        <div className="flex items-center justify-between pb-1">
          <button
            onClick={() => toast.info(`Espacio actual: ${activeServer.name}`)}
            className="flex items-center gap-1.5 text-sm font-bold text-[#f4f7fb] font-['Outfit'] hover:opacity-85 transition-opacity cursor-pointer"
          >
            <span>{activeServer.name}</span>
            <ChevronDown size={14} className="text-[#778398]" />
          </button>

          <button
            onClick={() => toast.info('Notificaciones del canal de voz activas')}
            className="w-8 h-8 rounded-xl bg-[#171b25] border border-white/[0.05] hover:bg-[#1d2330] text-[#778398] hover:text-[#f4f7fb] flex items-center justify-center transition-all cursor-pointer"
            title="Notificaciones"
          >
            <Bell size={15} />
          </button>
        </div>

        {/* Channel Title & White 'Entrar a la voz' Action Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <Volume2 size={20} className="text-[#72e4d0]" />
            <h1 className="text-lg font-bold text-[#f4f7fb] tracking-wide font-['Outfit']">
              {activeChannel.name}
            </h1>
          </div>

          <button
            onClick={handleVoiceToggle}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isConnected
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-white hover:bg-slate-200 text-[#0d0e12]'
            }`}
          >
            {isConnected ? 'Desconectar de la voz' : 'Entrar a la voz'}
          </button>
        </div>

        {/* 4 Pill Controls Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Micrófono */}
          <button
            onClick={toggleMute}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              currentUser.isMuted
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                : 'bg-[#171b25] hover:bg-[#1d2330] border-white/[0.06] text-[#aeb7c6] hover:text-white'
            }`}
          >
            {currentUser.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
            <span>Micrófono</span>
          </button>

          {/* Audio */}
          <button
            onClick={toggleDeafen}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              currentUser.isDeafened
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                : 'bg-[#171b25] hover:bg-[#1d2330] border-white/[0.06] text-[#aeb7c6] hover:text-white'
            }`}
          >
            <Headphones size={15} />
            <span>Audio</span>
          </button>

          {/* Antirruido */}
          <button
            onClick={() => {
              setAntirruido(!antirruido);
              toast.success(`Cancelación de ruido ${!antirruido ? 'activada' : 'desactivada'}`);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              antirruido
                ? 'bg-[#9ea2aa] text-[#0d0e12] border-transparent shadow-sm hover:bg-[#a9adb6]'
                : 'bg-[#171b25] hover:bg-[#1d2330] border-white/[0.06] text-[#aeb7c6]'
            }`}
          >
            <Waves size={15} />
            <span>{antirruido ? 'Desactivar antirruido' : 'Activar antirruido'}</span>
          </button>

          {/* Compartir pantalla */}
          <button
            onClick={handleScreenShareToggle}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              screenStream
                ? 'bg-[#72e4d0]/20 border-[#72e4d0]/40 text-[#72e4d0]'
                : 'bg-[#171b25] hover:bg-[#1d2330] border-white/[0.06] text-[#aeb7c6] hover:text-white'
            }`}
          >
            <Monitor size={15} />
            <span>{screenStream ? 'Detener pantalla' : 'Compartir pantalla'}</span>
          </button>
        </div>

        {/* Real Microphone Tester Box */}
        <div
          onClick={handleMicTestToggle}
          className={`p-3 px-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
            testingMic
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-[#171b25]/80 border-white/[0.05] hover:border-white/[0.1] text-[#778398]'
          }`}
          title="Haz clic para probar el micrófono en vivo con Web Audio API"
        >
          <span className="text-xs">
            {testingMic
              ? '🎤 Micrófono activo · Detectando decibelios y frecuencias en vivo'
              : isConnected
              ? 'Micrófono conectado · Transmisión WebRTC activa'
              : 'Haz clic aquí para probar la entrada de tu micrófono'}
          </span>

          {/* Animated/Real equalizer dots */}
          <div className="flex items-center gap-1.5 px-2">
            {dotsActive.map((active, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-100 ${
                  active
                    ? 'bg-[#72e4d0] scale-125 shadow-[0_0_8px_#72e4d0]'
                    : 'bg-[#252d3a]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Stage: Either Live Screen Share Video OR Stage Avatar Canvas */}
      <div className="flex-1 my-4 rounded-2xl bg-[#0b0d12] border border-white/[0.04] p-4 flex flex-col items-center justify-center relative overflow-hidden">
        {screenStream ? (
          /* Live Screen Share Player */
          <div className="w-full h-full flex flex-col items-center justify-center relative rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            {/* Overlay Bar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 z-20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white font-['Outfit']">
                  {currentUser.displayName} está compartiendo pantalla
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                  60 FPS · Ultra HD
                </span>
              </div>

              <button
                onClick={handleScreenShareToggle}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                <X size={13} />
                <span>Detener transmisión</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard Voice Lounge Stage */
          <>
            <div className="absolute inset-0 bg-radial from-[#72e4d0]/[0.03] via-transparent to-transparent pointer-events-none" />

            <div className="flex flex-col items-center text-center max-w-sm space-y-3 z-10">
              <div className="relative">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.displayName}
                    className="w-20 h-20 rounded-2xl object-cover border border-white/[0.1] shadow-2xl"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1d2330] to-[#171b25] border border-white/[0.08] flex items-center justify-center text-2xl font-bold text-[#f4f7fb] font-['Outfit'] shadow-xl">
                    {(currentUser.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                {isConnected && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#72e4d0] ring-4 ring-[#0b0d12] animate-pulse" />
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-[#f4f7fb] font-['Outfit']">
                  {currentUser.displayName || 'Juanpi'}
                </h3>
                <p className="text-xs text-[#778398] mt-0.5">
                  {isConnected
                    ? `Conectado a ${activeChannel.name} · Audio Ultra HD 96kHz`
                    : 'Estás en la antesala del canal de voz'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#171b25] text-[#778398] border border-white/[0.06]">
                  Opus Fullband
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#171b25] text-[#778398] border border-white/[0.06]">
                  Antirruido: {antirruido ? 'Activo' : 'Desactivado'}
                </span>
                {isConnected && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#72e4d0]/10 text-[#72e4d0] border border-[#72e4d0]/30 flex items-center gap-1">
                    <Radio size={10} className="animate-pulse" /> RTC 11ms
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-[11px] text-[#778398] text-center pt-1 font-mono">
        Kova Engine · Sala {activeChannel.name} · Cifrado E2EE de Extremo a Extremo
      </div>
    </div>
  );
};
