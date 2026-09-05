import React, { useState } from 'react';
import { Mic, MicOff, Headphones, Settings2, LogOut, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserStatus } from '../../types';
import { toast } from 'sonner';

export const UserCapsule: React.FC = () => {
  const { currentUser, toggleMute, toggleDeafen, setIsSettingsOpen, logout, setUserPresence, openUserProfile } = useApp();
  const [isPresenceMenuOpen, setIsPresenceMenuOpen] = useState(false);

  const statuses: { id: UserStatus; label: string; dot: string; desc: string }[] = [
    { id: 'online', label: 'En línea', dot: 'bg-emerald-400', desc: 'Visible para todos tus amigos y servidores' },
    { id: 'idle', label: 'Ausente', dot: 'bg-amber-400', desc: 'Aparece ausente temporalmente' },
    { id: 'dnd', label: 'No molestar', dot: 'bg-rose-500', desc: 'Silencia las alertas y notificaciones sonoras' },
    { id: 'offline', label: 'Invisible', dot: 'bg-slate-500', desc: 'Apareces desconectado, pero puedes usar Kova' },
  ];

  return (
    <div className="h-[52px] rounded-2xl bg-[#11151c] border border-white/[0.06] px-2 flex items-center justify-between shadow-xl shrink-0 select-none font-['Plus_Jakarta_Sans',sans-serif] relative">
      {/* 1. User Info (Left - Discord layout) */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-white/[0.04] p-1 rounded-xl transition-all flex-1 min-w-0 mr-1"
        onClick={() => openUserProfile(currentUser)}
        title="Ver y editar tu perfil"
      >
        <div className="relative shrink-0">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName}
              className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-white/10"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold font-['Outfit'] shadow-sm">
              {(currentUser.displayName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsPresenceMenuOpen(!isPresenceMenuOpen);
            }}
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#11151c] cursor-pointer hover:scale-110 transition-transform ${
              currentUser.status === 'online'
                ? 'bg-emerald-400'
                : currentUser.status === 'idle'
                ? 'bg-amber-400'
                : currentUser.status === 'dnd'
                ? 'bg-rose-500'
                : 'bg-slate-500'
            }`}
            title="Cambiar estado de presencia"
          />
        </div>

        <div className="truncate text-left min-w-0">
          <div className="text-xs font-bold text-[#f4f7fb] truncate leading-tight font-['Outfit']">
            {currentUser.displayName || 'Juanpi'}
          </div>
          <div className="text-[10px] text-[#72e4d0] truncate font-medium">
            {currentUser.customStatus ||
              (currentUser.status === 'online'
                ? 'En línea'
                : currentUser.status === 'idle'
                ? 'Ausente'
                : currentUser.status === 'dnd'
                ? 'No molestar'
                : 'Invisible')}
          </div>
        </div>
      </div>

      {/* 2. Controls (Right: Mic, Deafen, Settings, Logout) */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={toggleMute}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            currentUser.isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'text-[#949ba4] hover:text-[#f4f7fb] hover:bg-white/[0.08]'
          }`}
          title={currentUser.isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
        >
          {currentUser.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
        </button>

        <button
          onClick={toggleDeafen}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            currentUser.isDeafened
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'text-[#949ba4] hover:text-[#f4f7fb] hover:bg-white/[0.08]'
          }`}
          title={currentUser.isDeafened ? 'Activar audio' : 'Ensordecer'}
        >
          <Headphones size={14} />
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#949ba4] hover:text-[#f4f7fb] hover:bg-white/[0.08] transition-all cursor-pointer"
          title="Ajustes de usuario"
        >
          <Settings2 size={14} />
        </button>

        <button
          onClick={logout}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
          title="Cerrar sesión"
        >
          <LogOut size={13} />
        </button>
      </div>

      {/* Discord-style Presence Dropdown Menu */}
      {isPresenceMenuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsPresenceMenuOpen(false)} />
          <div className="absolute bottom-16 left-0 w-64 p-2 rounded-2xl bg-[#141824] border border-white/[0.1] shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              ESTADO DE PRESENCIA
            </div>

            {statuses.map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setUserPresence(st.id);
                  setIsPresenceMenuOpen(false);
                  toast.success(`Estado cambiado a: ${st.label}`);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                  currentUser.status === st.id
                    ? 'bg-white/[0.08] text-white'
                    : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${st.dot} shrink-0`} />
                  <div>
                    <div className="text-xs font-bold font-['Outfit'] leading-tight">{st.label}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{st.desc}</div>
                  </div>
                </div>
                {currentUser.status === st.id && <Check size={14} className="text-[#72e4d0] shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
