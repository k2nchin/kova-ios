import React, { useState } from 'react';
import {
  Volume2,
  Radio,
  Sparkles,
  Mic,
  MicOff,
  PhoneOff,
  Video,
  Monitor,
  Music,
  Compass,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/soundEffects';

interface RadarNode {
  id: string;
  name: string;
  avatar: string;
  x: number; // -120 to 120
  y: number; // -120 to 120
  isSpeaking: boolean;
  isMuted?: boolean;
}

export const SpatialAudioRadar: React.FC = () => {
  const { currentUser, toggleMute, toggleCamera, toggleScreenShare, leaveVoiceChannel, activeChannel, activeServer } =
    useApp();

  const otherVoiceMembers = (activeServer?.members || []).filter((m) => m.id !== currentUser.id);

  const [nodes, setNodes] = useState<RadarNode[]>(() => {
    return otherVoiceMembers.map((m, idx) => ({
      id: m.id,
      name: m.displayName,
      avatar: m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      x: idx === 0 ? -70 : idx === 1 ? 75 : 10,
      y: idx === 0 ? -40 : idx === 1 ? -30 : -90,
      isSpeaking: false,
    }));
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left - centerX;
    const mouseY = e.clientY - rect.top - centerY;

    // Limit to circular radar bounds
    const dist = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
    const maxRadius = 140;

    let clampedX = mouseX;
    let clampedY = mouseY;
    if (dist > maxRadius) {
      clampedX = (mouseX / dist) * maxRadius;
      clampedY = (mouseY / dist) * maxRadius;
    }

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingId ? { ...n, x: clampedX, y: clampedY } : n))
    );
  };

  const stopDrag = () => {
    setDraggingId(null);
  };

  return (
    <div className="flex-1 h-full w-full bg-[#080a10]/95 flex flex-col justify-between p-3 md:p-4 select-none relative overflow-hidden">
      {/* 1. Header */}
      <div className="flex items-center justify-between z-10 border-b border-white/[0.06] pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xs md:text-sm font-bold text-white font-['Outfit'] flex items-center gap-1.5">
              <span>Radar 3D</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                HRTF
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-1 rounded-lg border border-white/[0.06]">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-emerald-300">0.9ms</span>
          <span>•</span>
          <span>Opus 3D</span>
        </div>
      </div>

      {/* 2. Circular Radar Stage */}
      <div
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        className="flex-1 flex items-center justify-center relative cursor-crosshair min-h-[160px]"
      >
        {/* Radar Rings & Grid Lines */}
        <div className="w-[200px] h-[200px] md:w-[260px] md:h-[260px] rounded-full border border-cyan-500/20 absolute flex items-center justify-center animate-pulse duration-[4000ms]">
          <div className="w-[140px] h-[140px] md:w-[180px] md:h-[180px] rounded-full border border-purple-500/20 flex items-center justify-center">
            <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full border border-white/[0.08]" />
          </div>
        </div>

        {/* Crosshair lines */}
        <div className="absolute w-[220px] md:w-[280px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="absolute h-[220px] md:h-[280px] w-[1px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />

        {/* Center Node (Current User / You) */}
        <div className="relative z-20 flex flex-col items-center group">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt="You"
              className="w-14 h-14 rounded-full object-cover ring-4 ring-purple-500 shadow-2xl glow-purple"
            />
            <div className="absolute -inset-1 rounded-full border-2 border-purple-400 animate-ping opacity-50 pointer-events-none" />
          </div>
          <span className="text-xs font-bold text-white bg-purple-900/60 px-2 py-0.5 rounded-md border border-purple-500/40 mt-1 shadow-md">
            Tú (Centro 3D)
          </span>
        </div>

        {/* Orbiting Draggable Participant Nodes */}
        {nodes.map((node) => {
          const panL = Math.max(0, Math.min(100, Math.round(50 - (node.x / 140) * 50)));
          const panR = 100 - panL;

          return (
            <div
              key={node.id}
              onMouseDown={() => setDraggingId(node.id)}
              style={{
                transform: `translate(${node.x}px, ${node.y}px)`,
              }}
              className="absolute z-30 flex flex-col items-center cursor-grab active:cursor-grabbing transition-transform duration-75 group"
            >
              <div className="relative">
                <img
                  src={node.avatar}
                  alt={node.name}
                  className={`w-12 h-12 rounded-full object-cover ring-2 shadow-xl ${
                    node.isSpeaking
                      ? 'ring-emerald-400 glow-voice'
                      : 'ring-cyan-500/50 group-hover:ring-cyan-400'
                  }`}
                />
                {node.isSpeaking && (
                  <div className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                )}
              </div>

              {/* Tag & Soundstage Indicator */}
              <div className="flex flex-col items-center mt-1">
                <span className="text-[11px] font-bold text-slate-100 bg-[#121520]/90 px-2 py-0.5 rounded-lg border border-white/[0.1] shadow-lg whitespace-nowrap">
                  {node.name.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono text-cyan-300 bg-black/60 px-1.5 rounded mt-0.5">
                  L:{panL}% | R:{panR}%
                </span>
              </div>
            </div>
          );
        })}

        {nodes.length === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-[#0e111a]/90 border border-white/[0.1] text-center z-30 shadow-2xl backdrop-blur-md whitespace-nowrap">
            <p className="text-xs text-slate-300 font-semibold">
              Eres el único en la sala de audio espacial
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cuando se unan miembros a tu servidor, podrás moverlos en 360°.
            </p>
          </div>
        )}
      </div>

      {/* 3. Floating Radar Controls Bar */}
      <div className="flex items-center justify-center gap-3 z-10 pt-4 border-t border-white/[0.06]">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-2xl transition-all shadow-lg ${
            currentUser.isMuted
              ? 'bg-rose-500 text-white'
              : 'bg-white/[0.08] hover:bg-white/[0.12] text-slate-200'
          }`}
          title={currentUser.isMuted ? 'Activar micrófono' : 'Silenciar'}
        >
          {currentUser.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-3 rounded-2xl transition-all shadow-lg ${
            currentUser.isCameraOn ? 'bg-purple-600 text-white' : 'bg-white/[0.08] text-slate-200'
          }`}
          title="Cámara"
        >
          <Video className="w-5 h-5" />
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-2xl transition-all shadow-lg ${
            currentUser.isScreenSharing ? 'bg-cyan-600 text-white' : 'bg-white/[0.08] text-slate-200'
          }`}
          title="Compartir Pantalla"
        >
          <Monitor className="w-5 h-5" />
        </button>

        <button
          onClick={leaveVoiceChannel}
          className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
          title="Desconectar llamada"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
