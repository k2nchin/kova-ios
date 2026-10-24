import React, { useMemo } from 'react';
import {
  Sparkles,
  Volume2,
  Terminal,
  ArrowUpRight,
  Play,
  Radio,
  PlusCircle,
  MessageCircle,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const cleanName = (name: string) => name.replace(/^.*?[│|]\s*/, '').replace(/^#+\s*/, '');

export const PulseFeed: React.FC = () => {
  const {
    activeServer,
    messages,
    stories,
    isInVoice,
    activeVoiceChannelId,
    setActiveChannelId,
    joinVoiceChannel,
    setIsCodePlaygroundOpen,
    setIsKovaAIOpen,
    askKovaAI,
    setIsCreateStoryOpen,
    openStoryViewer,
  } = useApp();

  // Real signals computed from live state.
  const voiceChannels = useMemo(
    () => (activeServer?.channels || []).filter((channel) => channel.type === 'voice'),
    [activeServer?.channels]
  );
  const activeVoiceRooms = useMemo(
    () => voiceChannels.filter((channel) => (channel.connectedUsers?.length ?? 0) > 0),
    [voiceChannels]
  );
  const featuredRoom = isInVoice
    ? voiceChannels.find((channel) => channel.id === activeVoiceChannelId) ?? activeVoiceRooms[0]
    : activeVoiceRooms[0];
  const messagesToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return messages.filter((message) => new Date(message.timestamp).getTime() >= startOfDay.getTime()).length;
  }, [messages]);
  const onlineMembers = useMemo(
    () => activeServer?.members.filter((member) => member.status === 'online').length ?? 0,
    [activeServer?.members]
  );
  const totalUnread = useMemo(
    () => (activeServer?.channels || []).reduce((sum, channel) => sum + (channel.unreadCount || 0), 0),
    [activeServer?.channels]
  );

  const digestLine =
    activeVoiceRooms.length > 0
      ? `Hay ${activeVoiceRooms.length} sala${activeVoiceRooms.length === 1 ? '' : 's'} de voz activa${activeVoiceRooms.length === 1 ? '' : 's'}, ${messagesToday} mensaje${messagesToday === 1 ? '' : 's'} hoy y ${stories.length} historias recientes en ${activeServer?.name ?? 'tu espacio'}.`
      : `Todo tranquilo en ${activeServer?.name ?? 'tu espacio'}: ${messagesToday} mensaje${messagesToday === 1 ? '' : 's'} hoy, ${onlineMembers} miembro${onlineMembers === 1 ? '' : 's'} en línea y ${stories.length} historias recientes.`;

  const latestStories = stories.slice(0, 6);

  return (
    <div className="kova-pulse-view flex-1 h-full overflow-y-auto p-6 space-y-6 bg-[#05010b] select-none">
      {/* 1. Pulse Banner / AI Intelligence Digest */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-cyan-900/30 border border-purple-500/30 shadow-2xl overflow-hidden glow-purple">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-semibold border border-purple-500/40">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                KOVA PULSE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeVoiceRooms.length > 0 ? 'Señal en directo' : 'Señal en calma'} · {onlineMembers} en línea
              </span>
            </div>
            <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-wide">
              Pulso del Espacio: {activeServer?.name}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">{digestLine}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1.5 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{messagesToday} hoy</span>
              <span className="flex items-center gap-1"><Radio className="w-3 h-3" />{activeVoiceRooms.length} salas activas</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{onlineMembers} en línea</span>
              {totalUnread > 0 && <span className="text-purple-300">{totalUnread} sin leer</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsKovaAIOpen(true);
                askKovaAI(`Hazme un resumen ejecutivo de las actividades de hoy en ${activeServer?.name}`);
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
        {/* Active Voice Pod — real data */}
        <div className="p-5 rounded-3xl bg-[#0d071c] border border-emerald-500/30 shadow-xl space-y-4 hover:border-emerald-500/60 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Volume2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Salas de Voz</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Radio className="w-3 h-3 animate-pulse" /> {activeVoiceRooms.reduce((sum, channel) => sum + (channel.connectedUsers?.length ?? 0), 0)} conectados
            </span>
          </div>

          {featuredRoom ? (
            <>
              <div>
                <h3 className="text-sm font-bold text-white font-['Outfit']">{cleanName(featuredRoom.name)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {featuredRoom.connectedUsers?.length ?? 0} en la sala{isInVoice && activeVoiceChannelId === featuredRoom.id ? ' · estás conectado' : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveChannelId(featuredRoom.id);
                  joinVoiceChannel(featuredRoom.id);
                }}
                className="w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>{isInVoice && activeVoiceChannelId === featuredRoom.id ? 'Ya estás dentro' : 'Unirse a la Sala'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-bold text-white font-['Outfit']">Sin salas activas</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {voiceChannels.length > 0
                    ? `Hay ${voiceChannels.length} sala${voiceChannels.length === 1 ? '' : 's'} abierta${voiceChannels.length === 1 ? '' : 's'} esperando señal.`
                    : 'Este espacio todavía no tiene salas de voz.'}
                </p>
              </div>
              {voiceChannels[0] && (
                <button
                  onClick={() => {
                    setActiveChannelId(voiceChannels[0].id);
                    joinVoiceChannel(voiceChannels[0].id);
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Abrir {cleanName(voiceChannels[0].name)}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Live Code Playground Pod */}
        <div className="p-5 rounded-3xl bg-[#0d071c] border border-cyan-500/30 shadow-xl space-y-4 hover:border-cyan-500/60 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Code Playground</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              Kova Runner
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white font-['Outfit']">Comparte código en vivo</h3>
            <p className="text-xs text-slate-400 mt-0.5">Escribe, ejecuta y comparte snippets directamente en tus señales.</p>
          </div>

          <button
            onClick={() => setIsCodePlaygroundOpen(true)}
            className="w-full py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Abrir Playground</span>
          </button>
        </div>

        {/* Historias & Novedades Pod — real data */}
        <div className="p-5 rounded-3xl bg-[#0d071c] border border-pink-500/30 shadow-xl space-y-4 hover:border-pink-500/60 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Historias del Espacio</span>
            </div>
            <span className="text-[10px] font-mono text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full">
              {stories.length} activas · 24h
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white font-['Outfit']">
              {stories.length > 0 ? 'Tu gente está compartiendo' : 'Comparte tu día'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {stories.length > 0 ? 'Toca un avatar para ver la historia más reciente.' : 'Sé el primero en publicar una historia.'}
            </p>
          </div>

          {latestStories.length > 0 && (
            <div className="flex items-center gap-2">
              {latestStories.map((story, index) => (
                <button
                  key={story.id}
                  onClick={() => openStoryViewer(index)}
                  title={`Ver historia de ${story.author.displayName}`}
                  className="relative rounded-full ring-2 ring-pink-500/40 hover:ring-pink-400 transition-all hover:scale-110"
                >
                  {story.mediaUrl ? (
                    <img src={story.mediaUrl} alt={story.author.displayName} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white" style={{ background: story.backgroundColor || 'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>
                      {story.author.displayName?.slice(0, 1) ?? 'K'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

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
