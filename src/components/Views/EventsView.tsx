import React, { useState } from 'react';
import { Calendar, Plus, Clock, MapPin, Users, ChevronRight } from 'lucide-react';

export const EventsView: React.FC = () => {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'mine'>('upcoming');

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#07050d] text-zinc-200 scrollbar-none p-6 space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-purple-950/50">
            <Calendar size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-['Outfit'] tracking-tight">
              Eventos y Torneos
            </h1>
            <p className="text-xs text-zinc-400">
              Actividades programadas, torneos de gaming y sesiones en salas de voz.
            </p>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-[#0c0817] border border-purple-900/30 p-1 rounded-xl">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'upcoming' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Próximos
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'past' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pasados
            </button>
            <button
              onClick={() => setFilter('mine')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'mine' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mis eventos
            </button>
          </div>

          <button className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-950/50 cursor-pointer">
            <Plus size={14} />
            <span>Crear evento</span>
          </button>
        </div>
      </div>

      {/* Clean Events State */}
      <div className="rounded-3xl border border-dashed border-purple-900/40 bg-[#0c0817]/40 p-14 flex flex-col items-center justify-center text-center gap-3 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-purple-950/50 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
          <Calendar size={28} />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-sm font-bold text-white font-['Outfit']">
            No hay eventos programados
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Organiza partidas, noches de música o sesiones de trabajo y notifica a los miembros de la comunidad.
          </p>
        </div>
        <button className="mt-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors">
          <Plus size={14} />
          <span>Programar nuevo evento</span>
        </button>
      </div>
    </div>
  );
};
