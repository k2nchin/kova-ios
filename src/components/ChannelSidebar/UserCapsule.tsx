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
    <div className="h-[54px] rounded-2xl bg-[#11151c] border border-white/[0.06] px-2.5 flex items-center justify-between shadow-xl shrink-0 select-none font-['Plus_Jakarta_Sans',sans-serif] relative">
      {/* 1. Mic & Audio Quick Toggle Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggleMute}
          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            currentUser.isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-[#171b25] text-[#778398] hover:text-[#f4f7fb] hover:bg-[#1d2330] border border-white/[0.05]'
          }`}
          title={currentUser.isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
        >
          {currentUser.isMuted ? <MicOff size={13} /> : <Mic size={13} />}
        </button>

        <button
          onClick={toggleDeafen}
          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            currentUser.isDeafened
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-[#171b25] text-[#778398] hover:text-[#f4f7fb] hover:bg-[#1d2330] border border-white/[0.05]'
          }`}
          title={currentUser.isDeafened ? 'Activar audio' : 'Ensordecer'}
        >
          <Headphones size={13} />
        </button>
      </div>

      {/* 2. User Info (Avatar + Presence Dot + Name) */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity px-2 flex-1 min-w-0"
        onClick={() => setIsPresenceMenuOpen(!isPresenceMenuOpen)}
        title="Cambiar estado de presencia"
      >
        <div
          className="relative shrink-0 cursor-pointer hover:scale-105 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            openUserProfile(currentUser);
          }}
          title="Ver perfil de usuario"
        >
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName}
              className="w-7 h-7 rounded-lg object-cover shadow-sm ring-1 ring-white/10"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-[#b89cff] text-[#131722] flex items-center justify-center text-xs font-bold font-['Outfit'] shadow-sm">
              {(currentUser.displayName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#11151c] ${
              currentUser.status === 'online'
                ? 'bg-emerald-400'
                : currentUser.status === 'idle'
                ? 'bg-amber-400'
                : currentUser.status === 'dnd'
                ? 'bg-rose-500'
                : 'bg-slate-500'
            }`}
          />
        </div>

        <div className="truncate text-left">
          <div className="text-xs font-bold text-[#f4f7fb] truncate leading-tight font-['Outfit']">
            {currentUser.displayName || 'Juanpi'}
          </div>
          <div className="text-[10px] text-[#72e4d0] truncate font-medium">
            {currentUser.customStatus || 'En línea'}
          </div>
        </div>
      </div>

      {/* 3. Settings & Logout Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="user-settings-button cursor-pointer"
          title="Abrir configuración de usuario"
        >
          <Settings2 size={15} />
        </button>
        <button
          onClick={logout}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
          title="Cerrar sesión"
        >
          <LogOut size={14} />
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
            {statuses.map((st) => {
              const isSelected = currentUser.status === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setUserPresence(st.id);
                    setIsPresenceMenuOpen(false);
                    toast.success(`Estado cambiado a ${st.label}`);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.08] text-white'
                      : 'hover:bg-white/[0.04] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${st.dot} shrink-0`} />
                    <div>
                      <div className="font-semibold text-xs text-white">{st.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{st.desc}</div>
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-[#72e4d0] shrink-0" />}
                </button>
              );
            })}
            <div className="pt-1 mt-1 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setIsPresenceMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs text-[#72e4d0] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer font-medium"
              >
                <Settings2 size={14} />
                <span>Editar perfil y foto</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
