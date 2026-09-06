import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Monitor,
  UserPlus,
  VolumeX,
  PhoneOff,
  Video,
  VideoOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

export const VoicePerformanceDock: React.FC = () => {
  const {
    activeVoiceChannelId,
    activeServer,
    currentUser,
    toggleMute,
    toggleDeafen,
    toggleCamera,
    toggleScreenShare,
    openInviteModal,
    leaveVoiceChannel,
    joinVoiceChannel,
  } = useApp();

  const isMuted = currentUser?.isMuted;
  const isDeafened = currentUser?.isDeafened;
  const isScreenSharing = currentUser?.isScreenSharing;

  // Real-time audio waveform animation simulation
  const [waveHeights, setWaveHeights] = useState([40, 70, 55, 85, 45]);
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveHeights([
        Math.floor(25 + Math.random() * 65),
        Math.floor(35 + Math.random() * 60),
        Math.floor(20 + Math.random() * 75),
        Math.floor(40 + Math.random() * 55),
        Math.floor(30 + Math.random() * 60),
      ]);
    }, 180);
    return () => clearInterval(interval);
  }, []);

  const channelLabel = activeVoiceChannelId
    ? `Lounge / ${activeServer?.name || 'KOVA Suite'}`
    : `Desconectado`;

  return (
    <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#0e1017]/95 border border-white/[0.06] shadow-2xl backdrop-blur-xl select-none">
      {/* 1. Left: Voz conectada + Equalizer Waves */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Animated Green Equalizer Waveform */}
        <div className="flex items-end gap-0.5 h-5 w-5 justify-center">
          {waveHeights.map((h, i) => (
            <span
              key={i}
              className="w-0.5 rounded-full bg-emerald-400 transition-all duration-150"
              style={{ height: `${activeVoiceChannelId ? h : 15}%` }}
            />
          ))}
        </div>

        {/* Text Details */}
        <div className="flex flex-col min-w-0 cursor-pointer" onClick={() => {
          if (!activeVoiceChannelId) {
            joinVoiceChannel('chan_lounge');
            toast.success('Conectado a Lounge');
          }
        }}>
          <span className="text-xs font-bold text-white tracking-wide">
            {activeVoiceChannelId ? 'Voz conectada' : 'Haz clic para conectar'}
          </span>
          <span className="text-[11px] text-slate-400 truncate">
            {channelLabel}
          </span>
        </div>

        {/* Signal Bars Indicator */}
        <div className="flex items-end gap-0.5 ml-1 h-3" title="Calidad de señal: 99.8% HD">
          <span className="w-1 h-1.5 rounded-xs bg-emerald-400" />
          <span className="w-1 h-2.5 rounded-xs bg-emerald-400" />
          <span className="w-1 h-3.5 rounded-xs bg-emerald-400" />
        </div>
      </div>

      {/* 2. Center Controls: Micro, Auriculares, Pantalla, Invitar */}
      <div className="flex items-center gap-2">
        {/* Micro */}
        <button
          onClick={toggleMute}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-all cursor-pointer relative group"
        >
          {isMuted ? (
            <MicOff size={16} className="text-rose-400" />
          ) : (
            <Mic size={16} className="text-slate-200 group-hover:text-white" />
          )}
          <span className="text-[10px] text-slate-400 mt-0.5 group-hover:text-slate-200">
            Micro
          </span>
          {/* Active Purple Indicator Bar */}
          {!isMuted && (
            <span className="absolute bottom-1 w-5 h-0.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/80" />
          )}
        </button>

        {/* Auriculares */}
        <button
          onClick={toggleDeafen}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-all cursor-pointer relative group"
        >
          {isDeafened ? (
            <VolumeX size={16} className="text-rose-400" />
          ) : (
            <Headphones size={16} className="text-slate-200 group-hover:text-white" />
          )}
          <span className="text-[10px] text-slate-400 mt-0.5 group-hover:text-slate-200">
            Auriculares
          </span>
          {/* Active Purple Indicator Bar */}
          {!isDeafened && (
            <span className="absolute bottom-1 w-5 h-0.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/80" />
          )}
        </button>

        {/* Cámara */}
        <button
          onClick={toggleCamera}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-all cursor-pointer relative group"
        >
          {currentUser?.isCameraOn ? (
            <Video size={16} className="text-emerald-400" />
          ) : (
            <VideoOff size={16} className="text-slate-200 group-hover:text-white" />
          )}
          <span className="text-[10px] text-slate-400 mt-0.5 group-hover:text-slate-200">
            Cámara
          </span>
          {currentUser?.isCameraOn && (
            <span className="absolute bottom-1 w-5 h-0.5 rounded-full bg-emerald-400" />
          )}
        </button>

        {/* Pantalla */}
        <button
          onClick={toggleScreenShare}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-all cursor-pointer relative group"
        >
          <Monitor
            size={16}
            className={isScreenSharing ? 'text-emerald-400' : 'text-slate-200 group-hover:text-white'}
          />
          <span className="text-[10px] text-slate-400 mt-0.5 group-hover:text-slate-200">
            Pantalla
          </span>
          {isScreenSharing && (
            <span className="absolute bottom-1 w-5 h-0.5 rounded-full bg-emerald-400" />
          )}
        </button>

        {/* Invitar */}
        <button
          onClick={() => openInviteModal()}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-all cursor-pointer group"
        >
          <UserPlus size={16} className="text-slate-200 group-hover:text-white" />
          <span className="text-[10px] text-slate-400 mt-0.5 group-hover:text-slate-200">
            Invitar
          </span>
        </button>

        {/* Optional Disconnect button if connected */}
        {activeVoiceChannelId && (
          <button
            onClick={leaveVoiceChannel}
            className="flex items-center justify-center w-8 h-12 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Desconectar llamada"
          >
            <PhoneOff size={14} />
          </button>
        )}
      </div>

      {/* 3. Right: Sparkline Wave Chart + Rendimiento Excelente */}
      <div className="flex items-center gap-3">
        {/* Violet / Purple Sparkline Wave Chart */}
        <div className="w-20 h-7 flex items-center justify-center">
          <svg
            viewBox="0 0 100 30"
            className="w-full h-full overflow-visible text-purple-400"
            preserveAspectRatio="none"
          >
            <path
              d="M 0,22 Q 15,10 30,18 T 60,8 T 85,16 T 100,6"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col text-right">
          <span className="text-[10px] text-slate-400 font-medium">
            Rendimiento
          </span>
          <span className="text-xs font-bold text-emerald-400 tracking-wide">
            Excelente
          </span>
        </div>
      </div>
    </div>
  );
};
