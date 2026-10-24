import React, { useState } from 'react';
import {
  Users,
  Calendar,
  ChevronRight,
  Hash,
  Search,
  Pin,
  Bell,
  Settings,
  Plus,
  Paperclip,
  Smile,
  Send,
  Heart,
  Flame,
  FolderPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PortalBanner } from '../Common/PortalBanner';

export const KovaChatStage: React.FC = () => {
  const {
    activeServer,
    activeChannel,
    messages,
    sendMessage,
    addReaction,
    currentUser,
    setIsCreateServerOpen,
    setIsCreateChannelOpen,
    setPresetChannelType,
    openInviteModal,
  } = useApp();

  const [inputText, setInputText] = useState('');

  const channelMessages = messages.filter((m) => m.channelId === activeChannel?.id);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#070212] overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Fixed Channel Header Bar */}
      <div className="h-12 px-5 flex items-center justify-between border-b border-purple-950/30 bg-[#070212]/80 backdrop-blur-md text-xs shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Hash size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                #{activeChannel?.name || 'sin-canal'}
              </span>
            </div>
            <p className="text-zinc-500 text-[10px] hidden sm:block leading-none">
              {activeChannel?.topic || 'Canal de conversación'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-zinc-400">
          <button className="w-8 h-8 rounded-xl hover:bg-white/[0.06] hover:text-white flex items-center justify-center transition-colors cursor-pointer" title="Buscar">
            <Search size={14} />
          </button>
          <button className="w-8 h-8 rounded-xl hover:bg-white/[0.06] hover:text-white flex items-center justify-center transition-colors cursor-pointer" title="Mensajes fijados">
            <Pin size={14} />
          </button>
          <button className="w-8 h-8 rounded-xl hover:bg-white/[0.06] hover:text-white flex items-center justify-center transition-colors cursor-pointer" title="Notificaciones">
            <Bell size={14} />
          </button>
          <button className="w-8 h-8 rounded-xl hover:bg-white/[0.06] hover:text-white flex items-center justify-center transition-colors cursor-pointer" title="Ajustes del canal">
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body: Banner Card + Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        {/* Banner Card at top of channel */}
        <div className="relative rounded-3xl overflow-hidden border border-purple-900/30 bg-[#0d0520] shadow-xl mb-4">
          <PortalBanner height="h-40 sm:h-44" />

          {/* Banner Overlay */}
          <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#1a0738]/80 border border-purple-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(192,132,252,0.4)] shrink-0">
                <svg className="w-5 h-5 text-purple-300 drop-shadow-[0_0_10px_rgba(232,121,249,0.9)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
                </svg>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight font-['Outfit'] drop-shadow">
                    {activeServer?.name || 'Tu Comunidad'}
                  </h1>
                  {activeServer && (
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold shadow-sm">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-purple-200/80 drop-shadow">
                  {activeServer?.description || 'Personaliza tu espacio, crea canales y comparte con tus amigos.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-purple-500/10 text-xs text-purple-200/80">
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-purple-400" />
                  <span>
                    <strong>{activeServer?.members?.length || 1}</strong> {activeServer?.members?.length === 1 ? 'Miembro' : 'Miembros'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span><strong>1</strong> En línea</span>
                </div>
              </div>

              {activeServer ? (
                <button
                  onClick={() => openInviteModal(activeServer.id)}
                  className="px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-[11px] font-bold shadow-lg shadow-purple-950/60 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>Invitar</span>
                  <ChevronRight size={13} />
                </button>
              ) : (
                <button
                  onClick={() => setIsCreateServerOpen(true)}
                  className="px-3.5 py-1 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shadow-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Crear Servidor</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Real Messages or Clean State */}
        {!activeChannel ? (
          <div className="py-12 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <FolderPlus size={24} />
            </div>
            <div className="space-y-1 max-w-md">
              <h2 className="text-sm font-bold text-white font-['Outfit']">
                No hay ningún canal seleccionado
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Crea tu primer canal de texto o selecciona uno en la barra lateral para comenzar a hablar.
              </p>
            </div>
            <button
              onClick={() => {
                setPresetChannelType('text');
                setIsCreateChannelOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Crear canal</span>
            </button>
          </div>
        ) : channelMessages.length === 0 ? (
          /* Clean State */
          <div className="py-12 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Hash size={24} />
            </div>
            <div className="space-y-0.5 max-w-md">
              <h2 className="text-sm font-bold text-white font-['Outfit']">
                ¡Te damos la bienvenida a #{activeChannel.name}!
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Este es el comienzo de <strong>#{activeChannel.name}</strong>. Escribe un mensaje abajo para dar inicio a la conversación.
              </p>
            </div>
          </div>
        ) : (
          channelMessages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 group hover:bg-white/[0.02] p-2 rounded-2xl transition-colors">
              <img
                src={msg.author.avatar}
                alt={msg.author.displayName}
                className="w-8 h-8 rounded-full object-cover border border-purple-500/30 shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{msg.author.displayName}</span>
                  {msg.author.id === currentUser.id && <span className="text-[10px] text-amber-400">👑</span>}
                  <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed">{msg.content}</p>
                <div className="flex items-center gap-2 pt-0.5 text-[11px] text-zinc-400">
                  <button
                    onClick={() => addReaction(msg.id, '❤️')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg border bg-white/[0.03] border-white/[0.05] hover:text-white cursor-pointer transition-colors"
                  >
                    <Heart size={11} />
                    <span>{msg.reactions.find((r) => r.emoji === '❤️')?.count || 0}</span>
                  </button>
                  <button
                    onClick={() => addReaction(msg.id, '🔥')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg border bg-white/[0.03] border-white/[0.05] hover:text-white cursor-pointer transition-colors"
                  >
                    <Flame size={11} />
                    <span>{msg.reactions.find((r) => r.emoji === '🔥')?.count || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Bottom Chat Input Bar */}
      <div className="p-3 pt-1 border-t border-purple-950/20 bg-[#070212]/90">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 p-2 rounded-2xl bg-[#0e0622] border border-purple-900/40 shadow-xl focus-within:border-purple-500/60 transition-colors"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!activeChannel}
            placeholder={activeChannel ? `Escribe un mensaje en #${activeChannel.name}...` : 'Crea o selecciona un canal para escribir...'}
            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none px-3 disabled:opacity-50"
          />

          <div className="flex items-center gap-1 text-zinc-400 shrink-0">
            <button
              type="button"
              className="w-7 h-7 rounded-lg hover:bg-white/[0.06] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Adjuntar archivo"
            >
              <Paperclip size={15} />
            </button>
            <button
              type="button"
              className="w-7 h-7 rounded-lg hover:bg-white/[0.06] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Emojis"
            >
              <Smile size={15} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!activeChannel || !inputText.trim()}
            className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-lg shadow-purple-950/60 transition-transform active:scale-95 cursor-pointer shrink-0"
            title="Enviar mensaje"
          >
            <Send size={13} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
