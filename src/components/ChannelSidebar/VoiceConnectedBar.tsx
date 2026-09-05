import React from 'react';
import { Radio, PhoneOff, ScreenShare, Sparkles, Volume2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/soundEffects';
import { toast } from 'sonner';

export const VoiceConnectedBar: React.FC = () => {
  const {
    isInVoice,
    activeVoiceChannelId,
    activeServer,
    leaveVoiceChannel,
    toggleScreenShare,
    currentUser,
    setActiveChannelId,
  } = useApp();

  if (!isInVoice || !activeVoiceChannelId) return null;

  const currentChannel = activeServer.channels.find((c) => c.id === activeVoiceChannelId);

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playLeaveVoice();
    leaveVoiceChannel();
    toast.info('Desconectado del canal de voz');
  };

  const handleOpenVoiceView = () => {
    if (activeVoiceChannelId) {
      setActiveChannelId(activeVoiceChannelId);
    }
  };

  return (
    <div
      onClick={handleOpenVoiceView}
      className="rounded-2xl bg-[#0e161b] border border-emerald-500/30 p-2.5 flex items-center justify-between shadow-lg select-none cursor-pointer hover:border-emerald-500/50 transition-all font-['Plus_Jakarta_Sans',sans-serif] group"
    >
      {/* Left Info: Status & Channel */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 relative">
          <Radio size={16} className="animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-[#0e161b]" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[11px] font-bold text-emerald-400 font-['Outfit']">Voz Conectada</span>
            <span className="text-[9px] text-emerald-500/80 font-mono">18ms</span>
          </div>
          <div className="text-[10px] text-slate-300 truncate mt-1 flex items-center gap-1">
            <span className="font-semibold text-white truncate">
              {currentChannel ? `#${currentChannel.name}` : 'Sala de Voz HD'}
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400 truncate">{activeServer.name}</span>
          </div>
        </div>
      </div>

      {/* Right Actions: Screen Share & Disconnect */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleScreenShare();
          }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            currentUser.isScreenSharing
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title={currentUser.isScreenSharing ? 'Dejar de compartir pantalla' : 'Compartir pantalla'}
        >
          <ScreenShare size={13} />
        </button>

        <button
          type="button"
          onClick={handleDisconnect}
          className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-rose-500/30"
          title="Desconectarse"
        >
          <PhoneOff size={13} />
        </button>
      </div>
    </div>
  );
};
