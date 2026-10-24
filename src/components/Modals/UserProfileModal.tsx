import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Volume2,
  Pencil,
  Plus,
  Rocket,
  Store,
  UserPlus,
  Crown,
  Check,
  Smile,
  Gamepad2,
  Code2,
  Gift,
  Leaf,
  Swords,
  Flame,
  Calendar,
  Send,
  Radio,
  CheckCircle2,
  Ban,
  Flag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { api } from '../../services/apiClient';

export const UserProfileModal: React.FC = () => {
  const {
    profileModalUser,
    closeUserProfile,
    currentUser,
    activeServer,
    updateUserProfile,
    setIsSettingsOpen,
    toggleMemberRole,
    sendDirectMessage,
    addFriend,
    joinVoiceChannel,
    activeVoiceChannelId,
  } = useApp();

  const [showPromo, setShowPromo] = useState(true);
  const [isEditingThought, setIsEditingThought] = useState(false);
  const [thoughtInput, setThoughtInput] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [quickMsgInput, setQuickMsgInput] = useState('');
  const [userNote, setUserNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  if (!profileModalUser) return null;

  const isMe = profileModalUser.id === currentUser.id;
  const user = isMe ? currentUser : profileModalUser;

  const isOwner = user.id === activeServer?.ownerId;
  const isOwnerOrAdmin = currentUser.id === activeServer?.ownerId;

  // Server roles
  const serverRoles: Role[] = activeServer?.roles || [];
  const memberRoles = serverRoles.filter((r) => (user.roles || []).includes(r.id));

  // Handle thought bubble edit
  const handleSaveThought = () => {
    if (thoughtInput.trim()) {
      updateUserProfile({ thoughtBubble: thoughtInput.trim() });
      toast.success('Bocadillo de estado actualizado');
    }
    setIsEditingThought(false);
  };

  const handleKovaPulseClick = () => {
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#f47fff', '#5865f2', '#00a8fc', '#23a55a'],
    });
    toast.success('¡Pulso Kova activado! Tu perfil ahora tiene una identidad propia.');
  };

  const handleEditProfile = () => {
    closeUserProfile();
    setIsSettingsOpen(true);
  };

  const handleSendQuickMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickMsgInput.trim()) return;
    const msg = quickMsgInput.trim();
    setQuickMsgInput('');
    closeUserProfile();
    sendDirectMessage(user.id, msg);
    toast.success(`Mensaje enviado a ${user.displayName}`);
  };

  const handleBlockUser = async () => {
    try {
      await api.blockUser(user.id);
      toast.success(`${user.displayName} fue bloqueado.`);
      closeUserProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo bloquear esta cuenta.');
    }
  };

  const handleReportUser = async () => {
    try {
      await api.reportUser(user.id, 'Reporte desde perfil');
      toast.success('Reporte recibido. El equipo de Kova lo revisará.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar el reporte.');
    }
  };

  // Status dot & badge rendering (compact 16px)
  const renderStatusBadge = () => {
    switch (user.status) {
      case 'dnd':
        return (
          <div
            className="w-4 h-4 bg-[#f23f43] rounded-full ring-[2.5px] ring-[#111214] flex items-center justify-center shadow-md"
            title="No molestar"
          >
            <div className="w-1.5 h-0.5 bg-white rounded-full" />
          </div>
        );
      case 'idle':
        return (
          <div
            className="w-4 h-4 bg-[#f0b232] rounded-full ring-[2.5px] ring-[#111214] flex items-center justify-center shadow-md"
            title="Ausente"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#111214] -mt-0.5 -ml-0.5" />
          </div>
        );
      case 'offline':
        return (
          <div
            className="w-4 h-4 bg-[#80848e] rounded-full ring-[2.5px] ring-[#111214] flex items-center justify-center shadow-md"
            title="Desconectado"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#111214]" />
          </div>
        );
      case 'online':
      default:
        return (
          <div
            className="w-4 h-4 bg-[#23a55a] rounded-full ring-[2.5px] ring-[#111214] shadow-md"
            title="En línea"
          />
        );
    }
  };

  // Default badges list
  const badges = user.badges || ['pulse', 'signal', 'leaf', 'gift', 'dev', 'quest', 'gaming'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={closeUserProfile}
    >
      <div
        className="kova-user-profile-modal w-full max-w-[430px] rounded-[28px] bg-[#0d071c] border border-purple-500/25 shadow-[0_0_35px_rgba(147,51,234,0.2)] overflow-hidden relative animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Banner */}
        <div
          className="h-16 w-full relative overflow-hidden bg-cover bg-center shrink-0"
          style={{
            backgroundImage: user.banner
              ? `url(${user.banner})`
              : 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
          }}
        >
          {/* Close button */}
          <button
            onClick={closeUserProfile}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/80 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-sm flex items-center justify-center"
          >
            <X size={13} />
          </button>
        </div>

        {/* 2. Avatar & Badges Header Row */}
        <div className="px-3.5 relative flex items-end justify-between -mt-8 mb-2">
          {/* Avatar with Status */}
          <div className="relative shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-[#0d071c] bg-[#0d071c] shadow-xl"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-xl font-black ring-4 ring-[#0d071c] shadow-xl font-['Outfit']">
                {(user.displayName || 'U').slice(0, 1)}
              </div>
            )}
            <div className="absolute bottom-0 right-0">
              {renderStatusBadge()}
            </div>
          </div>

          {/* Badges Pill (Top Right) */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-950/40 border border-purple-500/20 shadow-md">
            {badges.includes('pulse') && (
              <span
                className="w-4 h-4 rounded-md flex items-center justify-center bg-purple-500/20 text-[#f47fff] hover:scale-110 transition-transform cursor-pointer"
                title="Miembro Kova Pulse"
              >
                <Flame size={11} className="fill-[#f47fff]" />
              </span>
            )}
            {badges.includes('signal') && (
              <span
                className="w-4 h-4 rounded-md flex items-center justify-center bg-cyan-500/20 text-[#00a8fc] hover:scale-110 transition-transform cursor-pointer"
                title="Emisario de Señales Kova"
              >
                <Sparkles size={11} />
              </span>
            )}
            {badges.includes('leaf') && (
              <span
                className="w-4 h-4 rounded-md flex items-center justify-center bg-emerald-500/20 text-[#23a55a] hover:scale-110 transition-transform cursor-pointer"
                title="Guardián de la Naturaleza"
              >
                <Leaf size={11} />
              </span>
            )}
            {badges.includes('gift') && (
              <span
                className="w-4 h-4 rounded-md flex items-center justify-center bg-blue-500/20 text-[#5865f2] hover:scale-110 transition-transform cursor-pointer"
                title="Partidario Temprano"
              >
                <Gift size={11} />
              </span>
            )}
            {badges.includes('dev') && (
              <span
                className="w-4 h-4 rounded-md flex items-center justify-center bg-indigo-500/20 text-indigo-300 hover:scale-110 transition-transform cursor-pointer"
                title="Desarrollador Activo de Kova"
              >
                <Code2 size={11} />
              </span>
            )}
            {badges.includes('quest') && (
              <span
                className="w-4 h-4 rounded-md flex items-center justify-center bg-rose-500/20 text-rose-400 hover:scale-110 transition-transform cursor-pointer"
                title="Cazador de Misiones"
              >
                <Swords size={11} />
              </span>
            )}
            {badges.includes('gaming') && (
              <span
                className="w-4 h-4 rounded-md flex items-center justify-center bg-amber-500/20 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                title="Gamer Kova"
              >
                <Gamepad2 size={11} />
              </span>
            )}
          </div>
        </div>

        {/* 3. Main Body Container (Clean, compact, no white scrollbars) */}
        <div className="px-3.5 pb-3.5 space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar">
          {/* Identity: Display Name & Username & Thought Bubble */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <h2 className="text-[15px] font-bold text-white font-['Outfit'] tracking-tight flex items-center gap-1 truncate leading-tight">
                <span>{user.displayName || 'Usuario'}</span>
                {isOwner && <Crown size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
                {isMe && currentUser.badges?.includes('verified_dev') && <CheckCircle2 size={14} className="text-sky-400 fill-sky-400/20 animate-pulse shrink-0" />}
              </h2>
              <span className="text-slate-400 text-[10px]">ツ</span>
            </div>
            <div className="text-[11px] text-[#949ba4] font-medium leading-none">
              {user.username || 'invitado_kova'}
            </div>
            {isMe && (
              <div className="pt-1">
                {isEditingNickname ? (
                  <div className="flex items-center gap-1 bg-[#0d071c] border border-purple-500/50 rounded-xl px-2.5 py-1">
                    <input
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      placeholder="Apodo..."
                      className="flex-1 bg-transparent outline-none text-xs text-white"
                    />
                    <button onClick={() => { updateUserProfile({ displayName: nicknameInput || user.displayName }); setIsEditingNickname(false); toast.success('Apodo actualizado'); }} className="text-xs text-emerald-400">Guardar</button>
                    <button onClick={() => setIsEditingNickname(false)} className="text-xs text-slate-400">Cancelar</button>
                  </div>
                ) : (
                  <button onClick={() => { setNicknameInput(user.displayName || ''); setIsEditingNickname(true); }} className="text-[10px] text-purple-300 hover:text-purple-200 flex items-center gap-1">
                    <Pencil size={10} /> Cambiar apodo
                  </button>
                )}
              </div>
            )}

            {/* Custom Status / Thought Bubble */}
            <div className="pt-1">
              {isEditingThought ? (
                <div className="flex items-center gap-1 bg-[#0d071c] border border-purple-500/50 rounded-xl px-2.5 py-1 shadow-sm">
                  <input
                    type="text"
                    value={thoughtInput}
                    onChange={(e) => setThoughtInput(e.target.value)}
                    placeholder="¿Qué estás pensando?"
                    className="bg-transparent text-[10px] text-white outline-none w-full placeholder-slate-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveThought()}
                  />
                  <button
                    type="button"
                    onClick={handleSaveThought}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5"
                  >
                    <Check size={11} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (isMe) {
                      setThoughtInput(user.thoughtBubble || '');
                      setIsEditingThought(true);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.8 rounded-lg bg-purple-950/30 border border-purple-500/20 text-[10px] text-slate-300 ${
                    isMe ? 'cursor-pointer hover:border-purple-500/40 hover:text-white' : ''
                  }`}
                  title={isMe ? 'Haz clic para editar estado' : undefined}
                >
                  <Smile size={11} className="text-purple-400 shrink-0" />
                  <span className="truncate max-w-[200px] italic">
                    {user.thoughtBubble || user.customStatus || 'Definir un estado...'}
                  </span>
                  {isMe && <Pencil size={9} className="text-slate-500 ml-0.5" />}
                </div>
              )}
            </div>
          </div>

          <div className="h-[1px] bg-purple-950/40" />

          {/* 4. Kova Pulse identity card */}
          {showPromo && (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/25 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-300 font-['Outfit'] flex items-center gap-1">
                  <Sparkles size={11} className="text-[#f47fff]" />
                  <span>Activa tu pulso Kova</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPromo(false)}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                >
                  <X size={11} />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleKovaPulseClick}
                  className="flex-1 py-1 px-2 rounded-lg bg-purple-600/40 hover:bg-purple-600/60 text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer border border-purple-500/30"
                >
                  <Rocket size={11} className="text-[#f47fff]" />
                  <span>Activar pulso</span>
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Tienda de temas próximamente')}
                  className="flex-1 py-1 px-2 rounded-lg bg-purple-950/30 hover:bg-purple-900/40 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer border border-purple-500/20"
                >
                  <Store size={11} />
                  <span>Explorar estilos</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. Sobre mí (About Me) */}
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-purple-400 uppercase font-mono tracking-wider">
              SOBRE MÍ
            </div>
            <div className="p-2 rounded-xl bg-[#07020e] border border-purple-900/30 text-[11px] text-slate-200 leading-relaxed whitespace-pre-line font-normal">
              {user.bio || 'Sin biografía aún.'}
            </div>
          </div>

          {/* 6. Miembro desde (Member Since) */}
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-purple-400 uppercase font-mono tracking-wider">
              MIEMBRO DESDE
            </div>
            <div className="p-2 rounded-xl bg-[#07020e] border border-purple-900/30 flex items-center gap-2 text-[10px] text-slate-300">
              <Calendar size={13} className="text-purple-400 shrink-0" />
              <span>Miembro de Kova</span>
            </div>
          </div>

          {/* 7. Voice Channel Activity Card */}
          {activeServer?.channels?.some((c) => c.type === 'voice') && (
            <div className="p-2.5 rounded-xl bg-[#07020e] border border-purple-900/30 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-purple-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Radio size={11} className="text-emerald-400 animate-pulse" />
                  <span>Sala de voz disponible</span>
                </span>
              </div>

              <div className="min-w-0 flex-1 text-left">
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5 truncate">
                  <Volume2 size={12} className="text-purple-400 shrink-0" />
                  <span className="truncate">
                    {activeServer?.channels?.find((c) => c.type === 'voice')?.name || 'Sala de voz'}
                  </span>
                </div>
                <div className="text-[9px] text-purple-400/80 flex items-center gap-1 mt-0.5">
                  <span>Audio HD WebRTC</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const voiceCh = activeServer?.channels?.find((c) => c.type === 'voice');
                  if (voiceCh) {
                    joinVoiceChannel(voiceCh.id);
                    closeUserProfile();
                    toast.success(`Conectado a ${voiceCh.name}`);
                  }
                }}
                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold transition-all cursor-pointer shadow-md glow-purple flex items-center justify-center gap-1.5"
              >
                <Volume2 size={12} />
                <span>Entrar a la voz</span>
              </button>
            </div>
          )}

          {/* 8. Roles Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] font-bold text-[#949ba4] uppercase tracking-wider font-mono">
              <span>ROLES</span>
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                  className="text-purple-400 hover:text-purple-300 text-[9px] flex items-center gap-0.5 cursor-pointer font-sans"
                >
                  <Plus size={10} />
                  <span>Alternar</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {memberRoles.length > 0 ? (
                memberRoles.map((r) => (
                  <span
                    key={r.id}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-950/40 text-purple-200 border border-purple-900/40 flex items-center gap-1.5 shadow-sm"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="text-purple-400/50">|</span>
                    <span>{r.name}</span>
                    {isOwnerOrAdmin && (
                      <button
                        type="button"
                        onClick={() => toggleMemberRole(activeServer.id, user.id, r.id)}
                        className="hover:text-white cursor-pointer ml-0.5 text-[10px] opacity-60 hover:opacity-100"
                        title="Remover rol"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-purple-400/50 italic">Sin roles asignados</span>
              )}
            </div>

            {/* Quick role toggle dropdown */}
            {isRoleDropdownOpen && isOwnerOrAdmin && (
              <div className="p-1.5 rounded-xl bg-[#1c1d22] border border-white/10 shadow-xl space-y-0.5 max-h-28 overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-100">
                <span className="text-[8px] text-slate-400 uppercase font-mono px-1.5 py-0.5 block">
                  Roles en {activeServer.name}
                </span>
                {serverRoles.map((role) => {
                  const hasRole = (user.roles || []).includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleMemberRole(activeServer.id, user.id, role.id)}
                      className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-left text-[10px] text-slate-200 hover:bg-white/[0.08] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="truncate font-semibold">{role.name}</span>
                      </div>
                      {hasRole && <Check size={11} className="text-purple-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 9. Nota (Private Note) */}
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-purple-400 uppercase font-mono tracking-wider">
              NOTA
            </div>
            {isEditingNote ? (
              <div className="p-2 rounded-xl bg-[#07020e] border border-purple-500/40">
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  onBlur={() => setIsEditingNote(false)}
                  placeholder="Escribe una nota privada sobre este usuario..."
                  className="w-full bg-transparent text-[10px] text-slate-200 placeholder-slate-500 outline-none resize-none h-12"
                  autoFocus
                />
              </div>
            ) : (
              <div
                onClick={() => setIsEditingNote(true)}
                className="p-2 rounded-xl bg-[#07020e] border border-purple-900/30 text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
              >
                {userNote || 'Haz clic para añadir una nota...'}
              </div>
            )}
          </div>

          {/* 10. Bottom Actions: Quick Message or Edit Profile */}
          <div className="pt-1">
            {isMe ? (
              <button
                type="button"
                onClick={handleEditProfile}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md glow-purple cursor-pointer"
              >
                <Pencil size={12} />
                <span>Editar perfil</span>
              </button>
            ) : (
              <div className="space-y-1.5">
                {/* Quick DM Input */}
                <form onSubmit={handleSendQuickMessage} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={quickMsgInput}
                    onChange={(e) => setQuickMsgInput(e.target.value)}
                    placeholder={`Enviar mensaje a @${user.displayName}...`}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#07020e] border border-purple-900/30 focus:border-purple-500 text-[10px] text-white placeholder-slate-500 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!quickMsgInput.trim()}
                    className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white cursor-pointer transition-all shrink-0 shadow-md glow-purple"
                    title="Enviar mensaje directo"
                  >
                    <Send size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addFriend(user.id);
                    }}
                    className="p-2 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 border border-purple-500/20 cursor-pointer transition-all shrink-0"
                    title="Añadir amigo"
                  >
                    <UserPlus size={12} />
                  </button>
                </form>
                <div className="grid grid-cols-2 gap-1.5">
                  <button type="button" onClick={handleReportUser} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.08]">
                    <Flag size={12} /> Reportar
                  </button>
                  <button type="button" onClick={handleBlockUser} className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] font-semibold text-rose-300 transition hover:bg-rose-500/20">
                    <Ban size={12} /> Bloquear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
