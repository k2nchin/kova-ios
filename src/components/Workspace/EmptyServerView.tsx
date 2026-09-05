import React from 'react';
import {
  Hash,
  Volume2,
  FolderPlus,
  UserPlus,
  Sparkles,
  Plus,
  Compass,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const EmptyServerView: React.FC = () => {
  const {
    servers,
    activeServer,
    setIsCreateServerOpen,
    setIsCreateChannelOpen,
    setIsCreateCategoryOpen,
    setPresetChannelType,
    setPresetCategoryId,
    openInviteModal,
    setIsDiscoveryOpen,
  } = useApp();

  // If there are NO servers at all, show the server creation hero!
  if (!activeServer || servers.length === 0) {
    return (
      <div className="flex-1 h-full overflow-y-auto p-6 flex flex-col items-center justify-center bg-[#090b10] text-center select-none font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Glowing 3D Island Icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#6d28d9] via-[#8b5cf6] to-[#a855f7] p-0.5 shadow-2xl shadow-purple-950/80 mx-auto flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-[#0c0e16] flex items-center justify-center text-white">
              <Plus size={36} className="text-purple-400 stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
              Crea tu propio servidor
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Tu servidor es donde tú y tus amigos o compañeros pueden comunicarse por voz, compartir pantalla en alta fidelidad y colaborar en tiempo real.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => setIsCreateServerOpen(true)}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#8b5cf6] hover:from-[#7c3aed] hover:to-[#9333ea] text-white text-xs font-bold shadow-lg shadow-purple-950/60 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={16} className="stroke-[2.5]" />
              <span>Crear mi servidor</span>
            </button>

            <button
              onClick={() => setIsDiscoveryOpen(true)}
              className="py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Compass size={16} className="text-purple-400" />
              <span>Explorar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If server exists but has no channels
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
    <div className="flex-1 h-full overflow-y-auto p-6 flex flex-col items-center justify-center bg-[#090b10] text-center select-none font-['Plus_Jakarta_Sans',sans-serif]">
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
              Este servidor está listo. Crea tus primeros canales o categorías para comenzar.
            </p>
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-left">
          {/* Action 1: Text Channel */}
          <button
            onClick={handleCreateTextChannel}
            className="group p-3 rounded-xl bg-[#11131c] border border-white/[0.06] hover:border-purple-500/40 hover:bg-[#151928] transition-all flex items-start gap-2.5 cursor-pointer shadow-md"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-all shrink-0">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 group-hover:text-white font-['Outfit'] flex items-center gap-1">
                <span>Canal de texto</span>
                <Plus className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Mensajes, código y archivos.
              </p>
            </div>
          </button>

          {/* Action 2: Voice Channel */}
          <button
            onClick={handleCreateVoiceChannel}
            className="group p-3 rounded-xl bg-[#11131c] border border-white/[0.06] hover:border-emerald-500/40 hover:bg-[#151928] transition-all flex items-start gap-2.5 cursor-pointer shadow-md"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-all shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 group-hover:text-white font-['Outfit'] flex items-center gap-1">
                <span>Canal de voz (HD)</span>
                <Plus className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                WebRTC 96kHz y antirruido.
              </p>
            </div>
          </button>

          {/* Action 3: New Category */}
          <button
            onClick={handleCreateCategory}
            className="group p-3 rounded-xl bg-[#11131c] border border-white/[0.06] hover:border-amber-500/40 hover:bg-[#151928] transition-all flex items-start gap-2.5 cursor-pointer shadow-md"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-all shrink-0">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 group-hover:text-white font-['Outfit'] flex items-center gap-1">
                <span>Nueva categoría</span>
                <Plus className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Organiza tus canales.
              </p>
            </div>
          </button>

          {/* Action 4: Invite People */}
          <button
            onClick={handleInviteFriends}
            className="group p-3 rounded-xl bg-[#11131c] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-[#151928] transition-all flex items-start gap-2.5 cursor-pointer shadow-md"
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-all shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 group-hover:text-white font-['Outfit'] flex items-center gap-1">
                <span>Invitar personas</span>
                <Plus className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Genera un enlace para unirse.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
