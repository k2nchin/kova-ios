import React, { useState } from 'react';
import { Users, Search, UserPlus, ShieldCheck, Crown, MoreHorizontal } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MembersView: React.FC = () => {
  const { currentUser, openInviteModal, activeServer } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'mods' | 'members'>('all');

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#07050d] text-zinc-200 scrollbar-none p-6 space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-purple-950/50">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-['Outfit'] tracking-tight">
              Directorio de Personas
            </h1>
            <p className="text-xs text-zinc-400">
              Miembros, moderadores y roles de la comunidad.
            </p>
          </div>
        </div>

        {/* Invite Button */}
        <button
          onClick={() => openInviteModal(activeServer?.id)}
          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-950/50 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={14} />
          <span>Invitar miembros</span>
        </button>
      </div>

      {/* Search & Role Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar miembros por nombre o rol..."
            className="w-full bg-[#0c0817] border border-purple-900/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#0c0817] border border-purple-900/30 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              roleFilter === 'all' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos (1)
          </button>
          <button
            onClick={() => setRoleFilter('mods')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              roleFilter === 'mods' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Moderadores
          </button>
          <button
            onClick={() => setRoleFilter('members')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              roleFilter === 'members' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Miembros
          </button>
        </div>
      </div>

      {/* Current User Active Card */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase font-['Outfit']">
          Miembros — 1
        </h3>

        <div className="p-3.5 rounded-2xl bg-[#0c0817] border border-purple-950/40 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-purple-500/30"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c0817]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">
                  {currentUser?.displayName || 'JuanPi1x'}
                </span>
                <Crown size={14} className="text-amber-400 fill-amber-400/20" />
                <span className="px-2 py-0.5 rounded-md bg-purple-600/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                  Propietario
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                @{currentUser?.username || 'juanpi1x'} · En línea
              </p>
            </div>
          </div>

          <button className="w-8 h-8 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
