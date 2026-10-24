import React, { useState } from 'react';
import { Zap, Filter, Bell, MessageSquare, Heart, Clock, Search, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ActivityView: React.FC = () => {
  const { notifications } = useApp();
  const [activeFilter, setActiveFilter] = useState<'all' | 'mentions' | 'replies'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const activity = notifications.filter((notification) => {
    const matchesFilter = activeFilter === 'all'
      || (activeFilter === 'mentions' && notification.type === 'mention')
      || (activeFilter === 'replies' && notification.type === 'friend');
    const query = searchQuery.trim().toLowerCase();
    return matchesFilter && (!query || `${notification.title} ${notification.description}`.toLowerCase().includes(query));
  });

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#07050d] text-zinc-200 scrollbar-none p-6 space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-purple-950/50">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-['Outfit'] tracking-tight">
              Actividad de la Comunidad
            </h1>
            <p className="text-xs text-zinc-400">
              Registros en tiempo real, interacciones y novedades de los miembros.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 sm:w-64">
          <Search size={14} className="text-zinc-500" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar actividad" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-600" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-950/50'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveFilter('mentions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === 'mentions'
                ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-950/50'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            Menciones
          </button>
          <button
            onClick={() => setActiveFilter('replies')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === 'replies'
                ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-950/50'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            Respuestas
          </button>
        </div>
      </div>

      {/* Real activity, fed by notifications and social events. */}
      <div className="space-y-4">
        {activity.length > 0 ? activity.map((notification) => (
          <article key={notification.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
            <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-emerald-300"><Bell size={17} /></div><div><h3 className="text-sm font-bold text-white">{notification.title}</h3><p className="mt-1 text-xs leading-5 text-zinc-400">{notification.description}</p><span className="mt-2 block text-[10px] font-medium text-zinc-500">{notification.timestamp}</span></div></div>
          </article>
        )) : <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.025] p-12 flex flex-col items-center justify-center text-center gap-3 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-purple-950/50 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
            <Clock size={24} />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-bold text-white font-['Outfit']">
              Sin actividad reciente registrada
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Cuando los miembros publiquen mensajes, organicen salas de voz o reaccionen, aparecerán aquí cronológicamente.
            </p>
          </div>
        </div>}
      </div>
    </div>
  );
};
