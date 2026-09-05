import React from 'react';
import {
  Sparkles,
  Flame,
  Volume2,
  Terminal,
  ArrowUpRight,
  Play,
  FileText,
  Radio,
  Zap,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PulseFeed: React.FC = () => {
  const {
    activeServer,
    setActiveChannelId,
    joinVoiceChannel,
    setIsCodePlaygroundOpen,
    setIsKovaAIOpen,
    askKovaAI,
    setIsCreateStoryOpen,
  } = useApp();

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 space-y-6 bg-[#090b10]/95 select-none">
      {/* 1. Pulse Banner / AI Intelligence Digest */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-cyan-900/30 border border-purple-500/30 shadow-2xl overflow-hidden glow-purple">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-semibold border border-purple-500/40">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                KOVA PULSE AI
              </span>
              <span className="text-xs text-slate-400 font-mono">Actualizado hace 2 min</span>
            </div>
            <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-wide">
              Pulso del Espacio: {activeServer.name}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              El equipo completó la migración del motor de audio a <strong>Tauri v2 + Rust</strong> (68MB RAM).
              Elena y Marcus están en la sala de audio probando el cancelador de ruido Kova Crisp.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsKovaAIOpen(true);
                askKovaAI(`Hazme un resumen ejecutivo de las actividades de hoy en ${activeServer.name}`);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Resumen Ejecutivo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid of Active Space Pods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Active Voice Pod */}
        <div className="p-5 rounded-3xl bg-[#11131c] border border-emerald-500/30 shadow-xl space-y-4 hover:border-emerald-500/60 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Volume2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Sala de Voz Activa</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Radio className="w-3 h-3 animate-pulse" /> 2 Conectados
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white font-['Outfit']">Voz Devs (0.1ms Latency)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Discutiendo shaders WebGPU y WebRTC Mesh</p>
          </div>

          <button
            onClick={() => {
              setActiveChannelId('chan_voice_dev');
              joinVoiceChannel('chan_voice_dev');
            }}
            className="w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <span>Unirse a la Sala</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Code Playground Pod */}
        <div className="p-5 rounded-3xl bg-[#11131c] border border-cyan-500/30 shadow-xl space-y-4 hover:border-cyan-500/60 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Code Snippet Destacado</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              Rust & JS
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white font-['Outfit']">Audio DSP Streamer</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pipeline de audio ultra-rápido en Rust compilado a WASM</p>
          </div>

          <button
            onClick={() => setIsCodePlaygroundOpen(true)}
            className="w-full py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar en Playground</span>
          </button>
        </div>

        {/* Historias & Novedades Pod */}
        <div className="p-5 rounded-3xl bg-[#11131c] border border-pink-500/30 shadow-xl space-y-4 hover:border-pink-500/60 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Historias & Estados</span>
            </div>
            <span className="text-[10px] font-mono text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full">
              Stories 24h
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white font-['Outfit']">Comparte tu Día</h3>
            <p className="text-xs text-slate-400 mt-0.5">Sube fotos o estados con degradados estilo Instagram/Discord</p>
          </div>

          <button
            onClick={() => setIsCreateStoryOpen(true)}
            className="w-full py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Subir una Historia</span>
          </button>
        </div>
      </div>
    </div>
  );
};
