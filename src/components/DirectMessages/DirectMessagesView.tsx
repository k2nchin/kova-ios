import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  Phone,
  Video,
  Search,
  UserPlus,
  Circle,
  MoreVertical,
  Send,
  Sparkles,
  PhoneOff,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { User, DMConversation } from '../../types';

export const DirectMessagesView: React.FC = () => {
  const {
    currentUser,
    dmConversations,
    activeDMUserId,
    setActiveDMUserId,
    sendDirectMessage,
    joinVoiceChannel,
    leaveVoiceChannel,
    isInVoice,
    friends,
    addFriend,
    removeFriend,
    pendingFriendRequests,
    sendFriendRequest,
    cancelFriendRequest,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'add'>('all');
  const [friendQuery, setFriendQuery] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [messageDraft, setMessageDraft] = useState('');

  // Selected conversation
  const activeConversation = dmConversations.find((c) => c.user.id === activeDMUserId);
  const activeFriend = friends.find((f) => f.id === activeDMUserId);
  const activeUser = activeConversation?.user || activeFriend || null;

  const filteredFriends = friends.filter((f) => {
    const matchesQuery = f.displayName.toLowerCase().includes(friendQuery.toLowerCase());
    if (activeTab === 'online') return matchesQuery && f.status === 'online';
    return matchesQuery;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageDraft.trim() || !activeUser) return;
    sendDirectMessage(activeUser.id, messageDraft.trim());
    setMessageDraft('');
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendInput.trim()) return;
    sendFriendRequest(addFriendInput.trim());
    setAddFriendInput('');
    setActiveTab('pending');
  };

  return (
    <div className="flex-1 h-full flex overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif] bg-[#0f1219]">
      {/* 1. Left DMs / Friends Navigation Column */}
      <div className="w-64 border-r border-white/[0.06] bg-[#11151c] flex flex-col justify-between shrink-0">
        <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
          {/* Top 'Amigos' button */}
          <button
            onClick={() => setActiveDMUserId(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeDMUserId === null
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Users size={16} />
            <span>Amigos</span>
          </button>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 pt-2">
            <span>MENSAJES DIRECTOS</span>
          </div>

          {/* DM Conversations List */}
          <div className="space-y-1">
            {dmConversations.length === 0 ? (
              <div className="p-3 text-center">
                <p className="text-[11px] text-slate-500 italic">Sin mensajes directos aún</p>
              </div>
            ) : (
              dmConversations.map((dm) => {
                const isSelected = activeDMUserId === dm.user.id;
                return (
                  <button
                    key={dm.id}
                    onClick={() => setActiveDMUserId(dm.user.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-white/[0.08] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={dm.user.avatar}
                        alt={dm.user.displayName}
                        className="w-8 h-8 rounded-xl object-cover"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#11151c] ${
                          dm.user.status === 'online'
                            ? 'bg-emerald-400'
                            : dm.user.status === 'idle'
                            ? 'bg-amber-400'
                            : dm.user.status === 'dnd'
                            ? 'bg-rose-500'
                            : 'bg-slate-500'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate flex items-center justify-between">
                        <span className="truncate">{dm.user.displayName}</span>
                        {dm.lastMessageTime && (
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            {dm.lastMessageTime}
                          </span>
                        )}
                      </div>
                      {dm.lastMessage && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {dm.lastMessage}
                        </div>
                      )}
                    </div>

                    {dm.unreadCount ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                        {dm.unreadCount}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Center Content: Either Friends Tab OR 1-on-1 Private Chat */}
      {activeUser ? (
        /* Private DM Chat Area */
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#0c0e16]">
          {/* Header */}
          <div className="h-14 px-5 border-b border-white/[0.06] bg-[#111420] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={activeUser.avatar}
                  alt={activeUser.displayName}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10"
                />
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#111420] ${
                    activeUser.status === 'online'
                      ? 'bg-emerald-400'
                      : activeUser.status === 'idle'
                      ? 'bg-amber-400'
                      : activeUser.status === 'dnd'
                      ? 'bg-rose-500'
                      : 'bg-slate-500'
                  }`}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  {activeUser.displayName}
                </h3>
                <p className="text-[11px] text-[#72e4d0]">
                  {activeUser.customStatus || 'En línea'}
                </p>
              </div>
            </div>

            {/* Call Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (isInVoice) {
                    leaveVoiceChannel();
                    toast.info('Llamada finalizada');
                  } else {
                    joinVoiceChannel('chan_voice_main');
                    toast.success(`Iniciando llamada privada con ${activeUser.displayName}...`);
                  }
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isInVoice
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border-white/[0.08]'
                }`}
                title={isInVoice ? 'Colgar llamada' : 'Iniciar llamada de voz'}
              >
                {isInVoice ? <PhoneOff size={15} /> : <Phone size={15} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  toast.success(`Iniciando videollamada HD con ${activeUser.displayName}...`);
                  joinVoiceChannel('chan_voice_main');
                }}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer"
                title="Iniciar videollamada"
              >
                <Video size={15} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
            {/* Conversation starter profile banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/30 to-indigo-950/20 border border-white/[0.06] mb-4 space-y-2">
              <img
                src={activeUser.avatar}
                alt={activeUser.displayName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/40"
              />
              <h2 className="text-lg font-black text-white font-['Outfit']">
                {activeUser.displayName}
              </h2>
              <p className="text-xs text-slate-400">{activeUser.bio || 'Miembro oficial de Kova.'}</p>
              <div className="text-[11px] text-slate-500 font-mono">
                Este es el comienzo de tu historial de mensajes directos privados.
              </div>
            </div>

            {/* Message Bubble Feed */}
            {activeConversation?.messages.map((m) => {
              const isMe = m.authorId === currentUser.id;
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <img
                      src={activeUser.avatar}
                      alt={activeUser.displayName}
                      className="w-8 h-8 rounded-xl object-cover shrink-0 mt-0.5"
                    />
                  )}
                  <div
                    className={`max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                        : 'bg-[#151924] border border-white/[0.08] text-slate-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div
                      className={`text-[9px] mt-1 font-mono text-right ${
                        isMe ? 'text-purple-200' : 'text-slate-500'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DM Composer */}
          <form onSubmit={handleSendMessage} className="p-4 bg-[#111420] border-t border-white/[0.06]">
            <div className="flex items-center gap-2 bg-[#171b26] border border-white/[0.08] focus-within:border-purple-500 rounded-2xl px-4 py-2.5 shadow-lg">
              <input
                type="text"
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                placeholder={`Enviar mensaje a @${activeUser.displayName}...`}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!messageDraft.trim()}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-all cursor-pointer shadow-md"
              >
                <Send size={13} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Friends Dashboard View */
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0e16]">
          {/* Header Tabs */}
          <div className="h-14 px-6 border-b border-white/[0.06] bg-[#111420] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-purple-400" />
              <span className="font-bold text-sm text-white font-['Outfit'] pr-3 border-r border-white/[0.1]">
                Amigos
              </span>

              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white/[0.1] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  Todos ({friends.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('online')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                    activeTab === 'online'
                      ? 'bg-white/[0.1] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  En línea ({friends.filter((f) => f.status === 'online').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'pending'
                      ? 'bg-white/[0.1] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>Pendiente</span>
                  {pendingFriendRequests.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                      {pendingFriendRequests.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'add'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                  }`}
                >
                  <UserPlus size={13} />
                  <span>Añadir amigo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'pending' ? (
            /* Pending friend requests screen */
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                SOLICITUDES PENDIENTES — {pendingFriendRequests.length}
              </div>
              {pendingFriendRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-xs text-slate-500">No hay solicitudes de amistad pendientes.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingFriendRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#111420] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-300">
                          {req.username.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-['Outfit']">
                            {req.username} <span className="text-slate-500 font-mono text-[10px]">#{req.tag}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Solicitud de amistad enviada (saliente)</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => cancelFriendRequest(req.id)}
                        className="p-2 rounded-xl bg-white/[0.03] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-white/[0.06]"
                        title="Cancelar solicitud"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'add' ? (
            /* Add friend screen */
            <div className="p-8 max-w-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-['Outfit']">Añadir Amigo</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Puedes enviar una solicitud de amistad con su nombre de usuario de Kova y su etiqueta (ej. usuario#0001).
                </p>
              </div>

              <form onSubmit={handleAddFriend} className="flex gap-2">
                <input
                  type="text"
                  value={addFriendInput}
                  onChange={(e) => setAddFriendInput(e.target.value)}
                  placeholder="Introduce un nombre de usuario#0000"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#141824] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={!addFriendInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-md"
                >
                  Enviar solicitud
                </button>
              </form>
            </div>
          ) : (
            /* Friends List Screen */
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
              {/* Search Friends Input */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-xs text-slate-400 focus-within:border-purple-500">
                <Search size={14} />
                <input
                  type="text"
                  value={friendQuery}
                  onChange={(e) => setFriendQuery(e.target.value)}
                  placeholder="Buscar amigos..."
                  className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Friends items */}
              {filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                    <Users size={28} className="text-purple-400/60" />
                  </div>
                  <h3 className="text-sm font-bold text-white font-['Outfit'] mb-1">
                    No tienes amigos añadidos todavía
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
                    Kova está esperando a tus amigos. Envía solicitudes con su nombre de usuario para chatear y llamar en privado.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer glow-purple"
                  >
                    <UserPlus size={14} />
                    <span>Añadir un amigo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    TODOS LOS AMIGOS — {filteredFriends.length}
                  </div>

                  {filteredFriends.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#111420] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={f.avatar}
                            alt={f.displayName}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#111420] ${
                              f.status === 'online'
                                ? 'bg-emerald-400'
                                : f.status === 'idle'
                                ? 'bg-amber-400'
                                : f.status === 'dnd'
                                ? 'bg-rose-500'
                                : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-['Outfit']">
                            {f.displayName} <span className="text-slate-500 text-[10px]">#{f.tag}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{f.customStatus || 'En línea'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveDMUserId(f.id)}
                          className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all cursor-pointer"
                          title="Enviar Mensaje Directo"
                        >
                          <MessageSquare size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toast.success(`Llamando a ${f.displayName}...`);
                            joinVoiceChannel('chan_voice_main');
                          }}
                          className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
                          title="Llamada de voz"
                        >
                          <Phone size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFriend(f.id)}
                          className="p-2 rounded-xl bg-white/[0.03] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/[0.06] transition-colors cursor-pointer"
                          title="Eliminar amigo"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
