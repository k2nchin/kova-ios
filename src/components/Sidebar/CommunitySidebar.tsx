import React from 'react';
import {
  Home,
  Zap,
  MessageSquare,
  Image as ImageIcon,
  Calendar,
  Users,
  Plus,
  Settings,
  Volume2,
  Video,
  Moon,
  Sparkles,
  CheckCircle2,
  Hash,
  Gamepad2,
  Music2,
  Palette,
  Smile,
  Radio,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PurpleMountainBanner } from '../Common/PurpleMountainBanner';

interface CommunitySidebarProps {
  activeView: 'home' | 'activity' | 'conversaciones' | 'media' | 'eventos' | 'personas' | 'channel';
  setActiveView: (view: 'home' | 'activity' | 'conversaciones' | 'media' | 'eventos' | 'personas' | 'channel') => void;
}

export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  activeView,
  setActiveView,
}) => {
  const {
    activeServer,
    activeChannel,
    setActiveChannelId,
    joinVoiceChannel,
    activeVoiceChannelId,
    currentUser,
    setIsSettingsOpen,
    openInviteModal,
    setIsCreateChannelOpen,
    setPresetChannelType,
    setIsDMViewActive,
    setIsMemberListOpen,
    isMemberListOpen,
  } = useApp();

  const handleNavClick = (view: 'home' | 'activity' | 'conversaciones' | 'media' | 'eventos' | 'personas') => {
    setActiveView(view);
    if (view === 'conversaciones') {
      setIsDMViewActive(true);
    } else {
      setIsDMViewActive(false);
    }
    if (view === 'personas') {
      setIsMemberListOpen(!isMemberListOpen);
    }
  };

  const handleChannelClick = (channelId: string) => {
    setActiveChannelId(channelId);
    setActiveView('channel');
    setIsDMViewActive(false);
  };

  const handleVoiceRoomClick = (roomId: string) => {
    joinVoiceChannel(roomId);
    setActiveChannelId(roomId);
    setActiveView('channel');
    setIsDMViewActive(false);
  };

  // Channel icon helper
  const getChannelIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('game') || lower.includes('gaming')) return <Gamepad2 size={16} />;
    if (lower.includes('music') || lower.includes('música')) return <Music2 size={16} />;
    if (lower.includes('diseño') || lower.includes('design')) return <Palette size={16} />;
    if (lower.includes('meme')) return <Smile size={16} />;
    return <Hash size={16} />;
  };

  // Curated spaces and rooms from mockup design
  const defaultSpaces = [
    { id: 'chan_gen', name: 'General', type: 'text' },
    { id: 'chan_gaming', name: 'Gaming', type: 'text' },
    { id: 'chan_musica', name: 'Música', type: 'text' },
    { id: 'chan_diseno', name: 'Diseño', type: 'text' },
    { id: 'chan_memes', name: 'Memes', type: 'text' },
  ];

  const defaultRooms = [
    { id: 'room_voz', name: 'Sala de voz', type: 'voice' },
    { id: 'room_stream', name: 'Stream', type: 'voice' },
    { id: 'room_afk', name: 'AFK', type: 'voice' },
  ];

  // Separate channels into text spaces & rooms
  const existingTextChannels = activeServer?.channels?.filter(
    (c) => c.type === 'text' || c.type === 'announcements' || c.type === 'notes' || c.type === 'forum'
  ) || [];

  const textChannels = existingTextChannels.length >= 3 ? existingTextChannels : defaultSpaces;

  const existingVoiceChannels = activeServer?.channels?.filter((c) => c.type === 'voice') || [];
  const voiceChannels = existingVoiceChannels.length >= 2 ? existingVoiceChannels : defaultRooms;

  return (
    <aside className="w-[260px] h-full flex flex-col bg-[#07050d] border-r border-purple-950/40 select-none shrink-0 overflow-hidden relative">
      {/* 1. Community Header Card */}
      <div className="p-2.5 pb-2">
        <div className="relative rounded-2xl overflow-hidden border border-purple-900/30 bg-[#0c0817] shadow-xl group">
          {/* Mountain Artwork Background */}
          <PurpleMountainBanner height="h-20" />

          {/* Card Info Overlay */}
          <div className="relative p-3 pt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              {/* Star Badge */}
              <div className="w-8 h-8 rounded-xl bg-[#140b2b] border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-950/60 shrink-0">
                <svg className="w-4 h-4 text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.9)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-['Outfit'] font-bold text-sm text-white truncate tracking-tight">
                    {activeServer?.name || 'JuanPi1x Community'}
                  </span>
                  <CheckCircle2 size={13} className="text-purple-400 shrink-0 fill-purple-400/20" />
                </div>
                <p className="text-[11px] text-purple-300/70 truncate">
                  {activeServer?.members?.length || 0} miembros · Comunidad pública
                </p>
              </div>
            </div>

            {/* Invite Button */}
            <button
              onClick={() => openInviteModal(activeServer?.id)}
              className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-950/50 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus size={14} className="stroke-[2.5]" />
              Invitar
            </button>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Navigation, Spaces & Rooms */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-none py-1">
        {/* Navigation Menu */}
        <nav className="space-y-0.5">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'home'
                ? 'bg-purple-950/60 text-white font-semibold border border-purple-500/20 shadow-sm shadow-purple-950/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Home size={16} className={activeView === 'home' ? 'text-purple-400' : 'text-zinc-400'} />
            <span>Inicio</span>
          </button>

          <button
            onClick={() => handleNavClick('activity')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'activity'
                ? 'bg-purple-950/60 text-white font-semibold border border-purple-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Zap size={16} className={activeView === 'activity' ? 'text-purple-400' : 'text-zinc-400'} />
            <span>Actividad</span>
          </button>

          <button
            onClick={() => handleNavClick('conversaciones')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'conversaciones'
                ? 'bg-purple-950/60 text-white font-semibold border border-purple-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <MessageSquare size={16} className={activeView === 'conversaciones' ? 'text-purple-400' : 'text-zinc-400'} />
            <span>Conversaciones</span>
          </button>

          <button
            onClick={() => handleNavClick('media')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'media'
                ? 'bg-purple-950/60 text-white font-semibold border border-purple-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <ImageIcon size={16} className={activeView === 'media' ? 'text-purple-400' : 'text-zinc-400'} />
            <span>Media</span>
          </button>

          <button
            onClick={() => handleNavClick('eventos')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'eventos'
                ? 'bg-purple-950/60 text-white font-semibold border border-purple-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Calendar size={16} className={activeView === 'eventos' ? 'text-purple-400' : 'text-zinc-400'} />
            <span>Eventos</span>
          </button>

          <button
            onClick={() => handleNavClick('personas')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeView === 'personas'
                ? 'bg-purple-950/60 text-white font-semibold border border-purple-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Users size={16} className={activeView === 'personas' ? 'text-purple-400' : 'text-zinc-400'} />
            <span>Personas</span>
          </button>
        </nav>

        {/* Section: ESPACIOS */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase font-['Outfit']">
              Espacios
            </span>
            <button
              onClick={() => {
                setPresetChannelType('text');
                setIsCreateChannelOpen(true);
              }}
              className="w-5 h-5 rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Crear espacio"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="space-y-0.5">
            {textChannels.map((channel) => {
              const isActive = activeView === 'channel' && activeChannel?.id === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-950/60 text-white font-semibold border border-purple-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={isActive ? 'text-purple-400' : 'text-zinc-400'}>
                    {getChannelIcon(channel.name)}
                  </span>
                  <span className="truncate">{channel.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: ROOMS */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase font-['Outfit']">
              Rooms
            </span>
            <button
              onClick={() => {
                setPresetChannelType('voice');
                setIsCreateChannelOpen(true);
              }}
              className="w-5 h-5 rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Crear room"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="space-y-0.5">
            {voiceChannels.length > 0 ? (
              voiceChannels.map((room) => {
                const isInThisRoom = activeVoiceChannelId === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => handleVoiceRoomClick(room.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isInThisRoom
                        ? 'bg-purple-950/70 text-purple-300 font-semibold border border-purple-500/40 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Volume2 size={16} className={isInThisRoom ? 'text-purple-400 animate-pulse' : 'text-zinc-400'} />
                    <span className="truncate">{room.name}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-1 text-[11px] text-zinc-600 italic">
                No hay rooms de voz
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom User Profile Card */}
      <div className="p-2 border-t border-purple-950/40 bg-[#090612]/90">
        <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser?.displayName || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-purple-500/30"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#07050d]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white truncate">
                  {currentUser?.displayName || 'JuanPi1x'}
                </span>
                <span className="text-[10px] text-amber-400">👑</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-none">
                En línea
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Ajustes"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
