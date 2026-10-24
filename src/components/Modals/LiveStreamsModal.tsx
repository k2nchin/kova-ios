import React from 'react';
import {
  Video,
  X,
  Radio,
  ExternalLink,
  Volume2,
  Users,
  Eye,
  MessageSquare,
  Sparkles,
  Share2,
  Tv,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

export const LiveStreamsModal: React.FC = () => {
  const {
    isLiveStreamsOpen,
    setIsLiveStreamsOpen,
    activeServer,
    joinVoiceChannel,
    setActiveChannelId,
    setIsDMViewActive,
  } = useApp();

  if (!isLiveStreamsOpen) return null;

  // Locate the stream channels from activeServer
  const liveVoiceChannel =
    activeServer?.channels?.find((c) => c.name.includes('En Directo') || (c.type === 'voice' && c.name.includes('Directo'))) ||
    activeServer?.channels?.find((c) => c.type === 'voice');

  const liveTextChannel =
    activeServer?.channels?.find((c) => c.name.includes('avisos-directo') || c.name.includes('directo')) ||
    activeServer?.channels?.find((c) => c.type === 'text');

  const handleJoinVoice = () => {
    if (liveVoiceChannel) {
      joinVoiceChannel(liveVoiceChannel.id);
      setIsLiveStreamsOpen(false);
      toast.success(`Conectado a la sala de voz: #${liveVoiceChannel.name}`);
    } else {
      toast.info('No hay canal de voz de directo disponible en este servidor');
    }
  };

  const handleGoToChat = () => {
    if (liveTextChannel) {
      setIsDMViewActive(false);
      setActiveChannelId(liveTextChannel.id);
      setIsLiveStreamsOpen(false);
      toast.success(`Navegando a #${liveTextChannel.name}`);
    }
  };

  const simulatedChat = [
    { user: 'AlexG', color: '#a855f7', text: '¡Qué buen stream hoy! La interfaz de KOVA se ve brutal 🔥' },
    { user: 'KovaBot', color: '#06b6d4', text: '✦ Recordatorio: Puedes usar !stream y !roles en el chat comunitario' },
    { user: 'LunaPixel', color: '#ec4899', text: '¿A qué hora arrancan las partidas con la comunidad? 🎮' },
    { user: 'ZeroCoder', color: '#10b981', text: 'Unido desde KOVA desktop con audio ultra HD 🚀' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsLiveStreamsOpen(false)}
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-[#0c051a] border border-purple-500/30 shadow-[0_0_60px_rgba(147,51,234,0.25)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-16 px-6 bg-[#070210]/90 border-b border-purple-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 p-0.5 shadow-lg shadow-rose-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0c051a] rounded-[14px] flex items-center justify-center text-rose-400">
                <Radio size={20} className="animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Outfit'] tracking-wide">
                  Directos & Streams en Vivo
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                  EN VIVO
                </span>
              </div>
              <p className="text-xs text-purple-400/60">Transmisiones oficiales de JuanPi1x</p>
            </div>
          </div>

          <button
            onClick={() => setIsLiveStreamsOpen(false)}
            className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-4rem)] custom-scrollbar">
          {/* Main Broadcast Hero Player / Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-b from-purple-950/40 to-[#070210] shadow-xl">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent pointer-events-none" />

            {/* Video Preview Banner */}
            <div className="h-56 sm:h-64 relative flex flex-col justify-between p-5 bg-[#05010b]/80 border-b border-purple-950/50">
              {/* Top status badges */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/40">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    LIVE
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-medium flex items-center gap-1.5">
                    <Users size={12} className="text-purple-400" />
                    1,420 viewers
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-purple-300">
                    1080p60 • 6000 kbps
                  </span>
                </div>
              </div>

              {/* Animated visualizer center simulation */}
              <div className="flex flex-col items-center justify-center my-auto z-10 space-y-3">
                <div className="flex items-end gap-1.5 h-12">
                  <span className="w-1.5 h-6 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-10 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-12 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-1.5 h-8 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                  <span className="w-1.5 h-11 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="w-1.5 h-5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '350ms' }} />
                </div>
                <p className="text-xs text-purple-300 font-semibold tracking-wide flex items-center gap-1.5">
                  <Tv size={14} /> Transmisión Comunitaria Activa
                </p>
              </div>

              {/* Bottom stream meta */}
              <div className="z-10 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white drop-shadow-sm font-['Outfit']">
                    Desarrollando KOVA ✦ Gaming Squad & Charla con la Comunidad
                  </h4>
                  <p className="text-xs text-purple-300/80 mt-0.5">
                    Categoría: Just Chatting & Software Development
                  </p>
                </div>
              </div>
            </div>

            {/* Stream Actions */}
            <div className="p-4 bg-[#090314] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleJoinVoice}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Volume2 size={16} />
                  <span>Unirse a Voz de Directo</span>
                </button>

                <button
                  onClick={handleGoToChat}
                  className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare size={15} />
                  <span>Canal #avisos-directo</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://twitch.tv/juanpi1x"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-[#9146ff]/20 hover:bg-[#9146ff] text-[#bf94ff] hover:text-white border border-[#9146ff]/40 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <span>Twitch</span>
                  <ExternalLink size={12} />
                </a>

                <a
                  href="https://youtube.com/@juanpi1x"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-[#ff0000]/20 hover:bg-[#ff0000] text-[#ff8080] hover:text-white border border-[#ff0000]/40 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <span>YouTube</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Live Chat & Community Feed Preview */}
          <div className="p-4 rounded-2xl bg-[#090314] border border-purple-950/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-950/50">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-xs font-bold text-slate-200">Chat en Vivo del Directo</span>
              </div>
              <span className="text-[11px] text-purple-400/60 font-mono">Modo ultra-baja latencia</span>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
              {simulatedChat.map((msg, idx) => (
                <div key={idx} className="text-xs flex items-start gap-2">
                  <span className="font-bold shrink-0 text-[11px]" style={{ color: msg.color }}>
                    {msg.user}:
                  </span>
                  <span className="text-slate-300 leading-tight text-pretty">{msg.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
