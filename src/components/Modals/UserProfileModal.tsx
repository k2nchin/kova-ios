import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Volume2,
  Info,
  MoreHorizontal,
  Pencil,
  Plus,
  Rocket,
  Store,
  MessageSquare,
  UserPlus,
  Crown,
  Check,
  Smile,
  Shield,
  Gamepad2,
  Code2,
  Gift,
  Leaf,
  Swords,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role, User } from '../../types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

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

  const handleNitroClick = () => {
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#f47fff', '#5865f2', '#00a8fc', '#23a55a'],
    });
    toast.success('¡Kova Nitro Boost activado!');
  };

  const handleEditProfile = () => {
    closeUserProfile();
    setIsSettingsOpen(true);
  };

  const handleSendMessage = () => {
    closeUserProfile();
    sendDirectMessage(user.id, '¡Hola!');
    toast.success(`Chat abierto con ${user.displayName}`);
  };

  // Status dot & badge rendering (compact 18px)
  const renderStatusBadge = () => {
    switch (user.status) {
      case 'dnd':
        return (
          <div
            className="w-4.5 h-4.5 bg-[#f23f43] rounded-full ring-[3px] ring-[#111214] flex items-center justify-center shadow-md"
            title="No molestar"
          >
            <div className="w-2 h-0.5 bg-white rounded-full" />
          </div>
        );
      case 'idle':
        return (
          <div
            className="w-4.5 h-4.5 bg-[#f0b232] rounded-full ring-[3px] ring-[#111214] flex items-center justify-center shadow-md"
            title="Ausente"
          >
            <div className="w-2 h-2 rounded-full bg-[#111214] -mt-0.5 -ml-0.5" />
          </div>
        );
      case 'offline':
        return (
          <div
            className="w-4.5 h-4.5 bg-[#80848e] rounded-full ring-[3px] ring-[#111214] flex items-center justify-center shadow-md"
            title="Desconectado"
          >
            <div className="w-2 h-2 rounded-full bg-[#111214]" />
          </div>
        );
      case 'online':
      default:
        return (
          <div
            className="w-4.5 h-4.5 bg-[#23a55a] rounded-full ring-[3px] ring-[#111214] shadow-md"
            title="En línea"
          />
        );
    }
  };

  // Default badges list
  const badges = user.badges || ['nitro', 'hypesquad', 'leaf', 'gift', 'dev', 'quest', 'gaming'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={closeUserProfile}
    >
      <div
        className="w-full max-w-[300px] rounded-2xl bg-[#111214] border border-[#26282d] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Banner */}
        <div
          className="h-16 w-full relative overflow-hidden bg-cover bg-center shrink-0"
          style={{
            backgroundImage: user.banner
              ? `url(${user.banner})`
              : 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)',
          }}
        >
          {/* Close button */}
          <button
            onClick={closeUserProfile}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
          >
            <X size={13} />
          </button>
        </div>

        {/* 2. Avatar & Floating Thought Bubble Row */}
        <div className="px-3.5 relative flex items-start justify-between -mt-8 mb-1.5">
          {/* Avatar with Status */}
          <div className="relative shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-14 h-14 rounded-full object-cover ring-4 ring-[#111214] bg-[#111214] shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#5865F2] text-white flex items-center justify-center text-xl font-black ring-4 ring-[#111214] shadow-md font-['Outfit']">
                {(user.displayName || 'U').slice(0, 1)}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5">
              {renderStatusBadge()}
            </div>
          </div>

          {/* Thought Bubble ("Bocadillo de estado") */}
          <div className="flex-1 ml-2.5 mt-2 relative">
            <div className="absolute -left-1.5 top-2.5 w-1 h-1 rounded-full bg-[#232428] border border-white/10" />
            <div className="absolute -left-2.5 top-3.5 w-0.5 h-0.5 rounded-full bg-[#232428] border border-white/10" />

            {isEditingThought ? (
              <div className="flex items-center gap-1 bg-[#232428] border border-purple-500/50 rounded-xl px-2 py-1 shadow-md">
                <input
                  type="text"
                  value={thoughtInput}
                  onChange={(e) => setThoughtInput(e.target.value)}
                  placeholder="¿Qué piensas?"
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
                className={`group bg-[#232428] hover:bg-[#2b2d31] border border-white/[0.08] rounded-xl px-2.5 py-1 shadow-md transition-all ${
                  isMe ? 'cursor-pointer hover:border-purple-500/40' : ''
                }`}
                title={isMe ? 'Haz clic para cambiar tu estado' : undefined}
              >
                <div className="flex items-center gap-1 text-[10px] text-[#dbdee1] leading-tight">
                  <span className="text-purple-400 text-[10px] shrink-0">
                    {isMe ? <Plus size={10} className="inline" /> : <Smile size={10} className="inline" />}
                  </span>
                  <span className="italic truncate max-w-[130px]">
                    {user.thoughtBubble || user.customStatus || 'Elige una criatura mítica...'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Main Content Container (Compact, sleek scrollbar) */}
        <div className="px-3.5 pb-3.5 space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar">
          {/* Identity: Display Name & Username */}
          <div>
            <div className="flex items-center gap-1">
              <h2 className="text-[14px] font-bold text-white font-['Outfit'] tracking-tight flex items-center gap-1 truncate">
                <span>{user.displayName || 'juanpi1x ツ'}</span>
                {isOwner && <Crown size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
              </h2>
              <span className="text-slate-400 text-[10px] hover:text-white transition-colors cursor-pointer">
                ツ
              </span>
            </div>
            <div className="text-[11px] text-[#949ba4] font-medium">
              {user.username || 'invitado_kova'}
            </div>
          </div>

          {/* Badges Bar (Discord Style Badges) */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1e1f22] border border-white/[0.05] w-fit">
            {badges.includes('nitro') && (
              <span
                className="w-4.5 h-4.5 rounded-md flex items-center justify-center bg-purple-500/20 text-[#f47fff] hover:scale-110 transition-transform cursor-pointer"
                title="Suscriptor de Kova Nitro"
              >
                <Flame size={11} className="fill-[#f47fff]" />
              </span>
            )}
            {badges.includes('hypesquad') && (
              <span
                className="w-4.5 h-4.5 rounded-md flex items-center justify-center bg-cyan-500/20 text-[#00a8fc] hover:scale-110 transition-transform cursor-pointer"
                title="HypeSquad Bravery"
              >
                <Sparkles size={11} />
              </span>
            )}
            {badges.includes('leaf') && (
              <span
                className="w-4.5 h-4.5 rounded-md flex items-center justify-center bg-emerald-500/20 text-[#23a55a] hover:scale-110 transition-transform cursor-pointer"
                title="Guardián de la Naturaleza"
              >
                <Leaf size={11} />
              </span>
            )}
            {badges.includes('gift') && (
              <span
                className="w-4.5 h-4.5 rounded-md flex items-center justify-center bg-blue-500/20 text-[#5865f2] hover:scale-110 transition-transform cursor-pointer"
                title="Partidario Temprano"
              >
                <Gift size={11} />
              </span>
            )}
            {badges.includes('dev') && (
              <span
                className="w-4.5 h-4.5 rounded-md flex items-center justify-center bg-indigo-500/20 text-indigo-300 hover:scale-110 transition-transform cursor-pointer"
                title="Desarrollador Activo"
              >
                <Code2 size={11} />
              </span>
            )}
            {badges.includes('quest') && (
              <span
                className="w-4.5 h-4.5 rounded-md flex items-center justify-center bg-rose-500/20 text-rose-400 hover:scale-110 transition-transform cursor-pointer"
                title="Cazador de Misiones"
              >
                <Swords size={11} />
              </span>
            )}
            {badges.includes('gaming') && (
              <span
                className="w-4.5 h-4.5 rounded-md flex items-center justify-center bg-amber-500/20 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                title="Gamer Kova"
              >
                <Gamepad2 size={11} />
              </span>
            )}
          </div>

          {/* 4. "Tunea tu perfil" Card (Nitro / Store Banner) */}
          {showPromo && (
            <div className="p-2.5 rounded-xl bg-[#1e1f22] border border-[#a855f7]/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white font-['Outfit'] flex items-center gap-1">
                  <Sparkles size={11} className="text-[#f47fff]" />
                  <span>Tunea tu perfil</span>
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
                  onClick={handleNitroClick}
                  className="flex-1 py-1 px-2 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Rocket size={11} className="text-[#f47fff]" />
                  <span>Obtener Nitro</span>
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Tienda disponible próximamente')}
                  className="flex-1 py-1 px-2 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Store size={11} className="text-slate-300" />
                  <span>Tienda</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. Bio / Sobre mí */}
          <div>
            <div className="text-[11px] text-[#dbdee1] leading-relaxed whitespace-pre-line font-normal">
              {user.bio || 'Tired of life 🥷\nAparataje Music Group'}
            </div>
          </div>

          {/* 6. Voice Channel Card ("En canal de voz") */}
          <div className="p-2 rounded-xl bg-[#1e1f22] border border-white/[0.05] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-[#949ba4] font-semibold">
              <span className="flex items-center gap-1">
                <span>En canal de voz</span>
                <Info size={11} />
              </span>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-300"
                onClick={() => toast.info('Detalles de sala de voz')}
              >
                <MoreHorizontal size={11} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Stacked avatars */}
              <div className="flex -space-x-1.5 shrink-0">
                <div className="w-5 h-5 rounded-full ring-2 ring-[#1e1f22] bg-emerald-500 flex items-center justify-center text-[9px] text-white font-bold">
                  🐲
                </div>
                <div className="w-5 h-5 rounded-full ring-2 ring-[#1e1f22] bg-purple-600 flex items-center justify-center text-[9px] text-white font-bold">
                  🥷
                </div>
                <div className="w-5 h-5 rounded-full ring-2 ring-[#1e1f22] bg-slate-700 flex items-center justify-center text-[8px] text-slate-300 font-mono">
                  +2
                </div>
              </div>

              <div className="min-w-0 flex-1 text-left">
                <div className="text-[11px] font-bold text-white flex items-center gap-1 truncate">
                  <Volume2 size={11} className="text-[#23a55a] shrink-0" />
                  <span className="truncate">/vc1</span>
                  <span className="text-[9px] font-normal text-[#949ba4] truncate">
                    en {activeServer?.name || 'dfghj'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 flex items-center gap-1">
                  <span>Establece un estado de canal</span>
                  <Pencil size={9} />
                </div>
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
                } else {
                  toast.info('Conectando a canal de voz...');
                }
              }}
              className="w-full py-1 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm"
            >
              Abrir voz
            </button>
          </div>

          {/* 7. Roles Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#949ba4] uppercase tracking-wider font-mono">
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
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#2b2d31] text-slate-200 border border-white/[0.04] flex items-center gap-1 shadow-sm"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="text-slate-400">|</span>
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
                <>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#2b2d31] text-slate-200 border border-white/[0.04] flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3498db] shrink-0" />
                    <span className="text-slate-400">|</span>
                    <span>Men</span>
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#2b2d31] text-slate-200 border border-white/[0.04] flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#546e7a] shrink-0" />
                    <span className="text-slate-400">|</span>
                    <span>Comunidad</span>
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#2b2d31] text-slate-200 border border-white/[0.04] flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f1c40f] shrink-0" />
                    <span className="text-slate-400">|</span>
                    <span>Amigos</span>
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#2b2d31] text-slate-200 border border-white/[0.04] flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e74c3c] shrink-0" />
                    <span className="text-slate-400">/</span>
                    <span>+18</span>
                  </span>
                </>
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

          {/* 8. Bottom Action Button ("Editar perfil" or "Enviar mensaje") */}
          <div className="pt-1">
            {isMe ? (
              <button
                type="button"
                onClick={handleEditProfile}
                className="w-full py-1.5 px-3 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Pencil size={12} />
                <span>Editar perfil</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <MessageSquare size={12} />
                  <span>Enviar mensaje</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addFriend(user.displayName);
                    toast.success(`Solicitud enviada a ${user.displayName}`);
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-white text-[11px] font-semibold flex items-center justify-center transition-all cursor-pointer"
                  title="Añadir amigo"
                >
                  <UserPlus size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
