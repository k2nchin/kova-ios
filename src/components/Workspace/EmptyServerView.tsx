import React from 'react';
import { Hash, Volume2, FolderPlus, UserPlus, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';

export const EmptyServerView: React.FC = () => {
  const {
    activeServer,
    setIsCreateChannelOpen,
    setIsCreateCategoryOpen,
    setPresetChannelType,
    setPresetCategoryId,
    openInviteModal,
  } = useApp();

  if (!activeServer) return null;

  const handleCreateTextChannel = () => {
    setPresetChannelType('text');
    setPresetCategoryId(undefined);
    setIsCreateChannelOpen(true);
  };

  const handleCreateVoiceChannel = () => {
    setPresetChannelType('voice');
    setPresetCategoryId(undefined);
    setIsCreateChannelOpen(true);
  };

  const handleCreateCategory = () => {
    setIsCreateCategoryOpen(true);
  };

  const handleInviteFriends = () => {
    openInviteModal(activeServer.id);
  };

  const acronym =
    activeServer.acronym ||
    activeServer.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 flex flex-col items-center justify-center bg-[#090b10] text-center select-none">
      <div className="max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Server Crest / Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-purple-500/20 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-[#121520] flex items-center justify-center overflow-hidden">
                {activeServer.icon ? (
                  <img
                    src={activeServer.icon}
                    alt={activeServer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-black text-white font-['Outfit']">{acronym}</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-purple-600 text-white shadow-md">
              <Sparkles className="w-3 h-3 fill-current" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-lg md:text-xl font-bold text-white font-['Outfit'] tracking-tight">
              ¡Te damos la bienvenida a {activeServer.name}!
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Este servidor está vacío. Crea tus primeros canales o categorías para comenzar.
            </p>
          </div>
        </div>

        {/* Quick Action Grid (Discord Style Onboarding) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-left">
          {/* Action 1: Text Channel */}
          <button
            onClick={handleCreateTextChannel}
            className="group p-3 rounded-xl bg-[#11131c] border border-white/[0.06] hover:border-cyan-500/40 hover:bg-[#151928] transition-all flex items-start gap-2.5 cursor-pointer shadow-md"
          >
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-all shrink-0">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 group-hover:text-white font-['Outfit'] flex items-center gap-1">
                <span>Canal de texto</span>
                <Plus className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Mensajes, código y archivos.
              </p>
            </div>
          </button>

          {/* Action 2: Voice Room */}
          <button
            onClick={handleCreateVoiceChannel}
            className="group p-3 rounded-xl bg-[#11131c] border border-white/[0.06] hover:border-emerald-500/40 hover:bg-[#151928] transition-all flex items-start gap-2.5 cursor-pointer shadow-md"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-all shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 group-hover:text-white font-['Outfit'] flex items-center gap-1">
                <span>Sala de voz HD</span>
                <Plus className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Audio de baja latencia y video.
              </p>
            </div>
          </button>

          {/* Action 3: Category */}
          <button
            onClick={handleCreateCategory}
            className="group p-3 rounded-xl bg-[#11131c] border border-white/[0.06] hover:border-purple-500/40 hover:bg-[#151928] transition-all flex items-start gap-2.5 cursor-pointer shadow-md"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-all shrink-0">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 group-hover:text-white font-['Outfit'] flex items-center gap-1">
                <span>Crear categoría</span>
                <Plus className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Agrupa canales organizados.
              </p>
            </div>
          </button>

          {/* Action 4: Invite Friends */}
          <button
            onClick={handleInviteFriends}
            className="group p-3 rounded-xl bg-[#11131c] border border-white/[0.06] hover:border-amber-500/40 hover:bg-[#151928] transition-all flex items-start gap-2.5 cursor-pointer shadow-md"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-all shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 group-hover:text-white font-['Outfit']">
                Invitar amigos
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Copia el enlace para compartir.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
