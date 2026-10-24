import React from 'react';
import { ChevronRight, ArrowRight, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PurpleMountainBanner } from '../Common/PurpleMountainBanner';
import { toast } from 'sonner';

interface CommunityRightSidebarProps {
  onSelectTag?: (tag: string) => void;
  onJoinVoice?: () => void;
  onViewAllMembers?: () => void;
  onViewAllEvents?: () => void;
}

interface MemberItem {
  id: string;
  name: string;
  avatar: string;
  status: string;
  activity: string;
  isOwner?: boolean;
}

interface EventItem {
  id: string;
  dayName: string;
  dayNumber: string;
  title: string;
  time: string;
  category: string;
}

export const CommunityRightSidebar: React.FC<CommunityRightSidebarProps> = ({
  onSelectTag,
  onJoinVoice,
  onViewAllMembers,
  onViewAllEvents,
}) => {
  const { currentUser, activeServer, joinVoiceChannel, setActiveChannelId } = useApp();

  const handleVoicePromoClick = () => {
    const voiceChannel = activeServer?.channels?.find((c) => c.type === 'voice');
    if (voiceChannel) {
      joinVoiceChannel(voiceChannel.id);
      setActiveChannelId(voiceChannel.id);
    }
    if (onJoinVoice) onJoinVoice();
  };

  const handleJoinEvent = (title: string) => {
    toast.success(`Te has inscrito a: ${title}`);
  };

  const discoverTags = ['general', 'gaming', 'música', 'diseño', 'memes', 'eventos'];

  const membersList: MemberItem[] = [
    {
      id: 'm1',
      name: currentUser?.displayName || 'JuanPi1x',
      avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      status: 'En línea',
      activity: 'General',
      isOwner: true,
    },
    {
      id: 'm2',
      name: 'Zexy',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      status: 'En línea',
      activity: 'Gaming',
    },
    {
      id: 'm3',
      name: 'Luna',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      status: 'En línea',
      activity: 'Música',
    },
    {
      id: 'm4',
      name: 'Rayo',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      status: 'En línea',
      activity: 'Desarrollo',
    },
    {
      id: 'm5',
      name: 'Danii',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      status: 'En línea',
      activity: 'General',
    },
    {
      id: 'm6',
      name: 'Santi',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      status: 'En línea',
      activity: 'Música',
    },
    {
      id: 'm7',
      name: 'Valee',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
      status: 'En línea',
      activity: 'General',
    },
  ];

  const eventsList: EventItem[] = [
    {
      id: 'e1',
      dayName: 'SAB',
      dayNumber: '10',
      title: 'Torneo de Fortnite',
      time: '8:00 PM',
      category: 'Gaming',
    },
    {
      id: 'e2',
      dayName: 'DOM',
      dayNumber: '11',
      title: 'Noche de Música',
      time: '7:00 PM',
      category: 'Música',
    },
  ];

  return (
    <aside className="w-[280px] h-full flex flex-col bg-[#07050d] border-l border-purple-950/40 select-none shrink-0 overflow-y-auto scrollbar-none p-3 space-y-4">
      {/* 1. Miembros en línea */}
      <div className="p-3 rounded-2xl bg-[#0c0817] border border-purple-950/40 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
          <span className="text-xs font-bold text-white font-['Outfit']">
            Miembros en linea
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
            <span>42</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </div>

        {/* Member List */}
        <div className="space-y-1">
          {membersList.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/[0.04] transition-colors"
            >
              <div className="relative shrink-0">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-7 h-7 rounded-full object-cover border border-purple-500/30"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0c0817]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-white truncate">
                    {member.name}
                  </span>
                  {member.isOwner && <span className="text-[10px] text-amber-400">👑</span>}
                </div>
                <p className="text-[10px] text-zinc-400 truncate leading-tight">
                  {member.status} · {member.activity}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onViewAllMembers}
          className="w-full text-left text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer pt-1 transition-colors"
        >
          <span>Ver todos los miembros</span>
          <ChevronRight size={12} />
        </button>
      </div>

      {/* 2. Eventos próximos */}
      <div className="p-3 rounded-2xl bg-[#0c0817] border border-purple-950/40 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
          <span className="text-xs font-bold text-white font-['Outfit']">
            Eventos próximos
          </span>
          <button
            onClick={onViewAllEvents}
            className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            <span>Ver todos</span>
            <ChevronRight size={11} />
          </button>
        </div>

        {/* Event Cards */}
        <div className="space-y-2">
          {eventsList.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-2 rounded-xl bg-[#120c24] border border-purple-900/30 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Date Badge */}
                <div className="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-500/30 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-purple-400 leading-none">
                    {event.dayName}
                  </span>
                  <span className="text-xs font-extrabold text-white leading-tight">
                    {event.dayNumber}
                  </span>
                </div>

                {/* Event info */}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {event.title}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {event.time} · {event.category}
                  </p>
                </div>
              </div>

              {/* Join Button */}
              <button
                onClick={() => handleJoinEvent(event.title)}
                className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer shrink-0 ml-2"
              >
                Unirse
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Promo Banner: Únete a los canales de voz */}
      <div className="relative rounded-2xl overflow-hidden border border-purple-900/30 bg-[#0c0817] shadow-lg group">
        <PurpleMountainBanner height="h-28" />

        <div className="absolute inset-0 p-3 flex items-end justify-between z-10">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-white font-['Outfit'] drop-shadow">
              Únete a los canales de voz
            </h3>
            <p className="text-[10px] text-purple-200/80 drop-shadow">
              Habla, juega, comparte.
            </p>
          </div>

          <button
            onClick={handleVoicePromoClick}
            className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-950 transition-transform active:scale-95 group-hover:scale-105 cursor-pointer shrink-0"
            title="Conectar a voz"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 4. Descubre (Tags) */}
      <div className="p-3 rounded-2xl bg-[#0c0817] border border-purple-950/40 space-y-2 shadow-lg">
        <span className="text-xs font-bold text-white font-['Outfit']">
          Descubre
        </span>

        <div className="flex flex-wrap gap-1.5">
          {discoverTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag && onSelectTag(tag)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-purple-600/20 text-zinc-400 hover:text-purple-300 text-[11px] font-medium border border-white/[0.04] hover:border-purple-500/30 transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
