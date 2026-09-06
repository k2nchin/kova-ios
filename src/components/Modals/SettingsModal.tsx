import React, { useState, useRef } from 'react';
import {
  UserRound,
  Monitor,
  Headphones,
  Bell,
  ShieldCheck,
  Keyboard,
  X,
  Check,
  LogOut,
  FolderKanban,
  Trash2,
  Plus,
  Sparkles,
  Shuffle,
  Image as ImageIcon,
  Upload,
  Camera,
  Lock,
  Smartphone,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { BackgroundTheme } from '../Themes/ThemeBackground';

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="preference-row flex items-center justify-between p-3.5 rounded-2xl bg-[#141824] border border-white/[0.06] hover:border-white/[0.1] transition-all">
      <div className="pr-4">
        <strong className="text-xs font-bold text-slate-200 block">{label}</strong>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{description}</p>
      </div>
      <button
        type="button"
        className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative shrink-0 ${
          checked ? 'bg-emerald-500' : 'bg-slate-700'
        }`}
        aria-pressed={checked}
        onClick={onChange}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="border-b border-white/[0.06] pb-3">
        <h3 className="text-sm font-bold text-white font-['Outfit']">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    currentUser,
    updateUserProfile,
    logout,
    servers,
    deleteServer,
    setIsCreateServerOpen,
    theme,
    setTheme,
    preferences,
    updatePreference,
    isTwoFactorEnabled,
    setIsTwoFactorSetupOpen,
    setIsTwoFactorBackupOpen,
    setIsTwoFactorDisableOpen,
  } = useApp();

  const [name, setName] = useState(currentUser.displayName || 'Juanpi');
  const [status, setStatus] = useState(currentUser.customStatus || 'Disponible');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [banner, setBanner] = useState(currentUser.banner || '');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'perfil' | 'apariencia' | 'voz' | 'notificaciones' | 'privacidad' | 'atajos' | 'espacios'>('perfil');

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  if (!isSettingsOpen) return null;

  // Handle local image upload for profile avatar
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
      updateUserProfile({ avatar: result });
      toast.success('¡Foto de perfil actualizada con éxito!');
    };
    reader.readAsDataURL(file);
  };

  // Handle local image upload for profile banner
  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen para el banner');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBanner(result);
      updateUserProfile({ banner: result });
      toast.success('¡Banner de perfil actualizado!');
    };
    reader.readAsDataURL(file);
  };

  const saveSettings = () => {
    updateUserProfile({
      displayName: name.trim() || 'Juanpi',
      customStatus: status.trim(),
      bio: bio.trim(),
      avatar: avatar || currentUser.avatar,
      banner: banner || currentUser.banner,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) setIsSettingsOpen(false);
      }}
    >
      <section
        className="w-full max-w-4xl h-[88vh] rounded-3xl bg-[#111420] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Modal Header */}
        <header className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#0d0f18]">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#72e4d0] uppercase font-bold">
              AJUSTES DE USUARIO & CONFIGURACIÓN
            </span>
            <h2 id="settings-title" className="text-base font-bold text-white font-['Outfit']">
              Preferencias de Kova
            </h2>
          </div>
          <button
            className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar configuración"
            onClick={() => setIsSettingsOpen(false)}
          >
            <X size={18} />
          </button>
        </header>

        {/* Modal Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <nav
            className="w-56 border-r border-white/[0.06] bg-[#0c0e17] p-3 space-y-1 overflow-y-auto custom-scrollbar shrink-0"
            aria-label="Secciones de configuración"
          >
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1.5">
              MI CUENTA
            </div>
            <button
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              onClick={() => setActiveTab('perfil')}
            >
              <UserRound size={15} /> Perfil & Avatar
            </button>
            <button
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'apariencia'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              onClick={() => setActiveTab('apariencia')}
            >
              <Monitor size={15} /> Apariencia & Temas
            </button>

            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-3 pb-1.5">
              AJUSTES DE APLICACIÓN
            </div>
            <button
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'voz'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              onClick={() => setActiveTab('voz')}
            >
              <Headphones size={15} /> Voz y vídeo HD
            </button>
            <button
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'notificaciones'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              onClick={() => setActiveTab('notificaciones')}
            >
              <Bell size={15} /> Notificaciones
            </button>
            <button
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'privacidad'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              onClick={() => setActiveTab('privacidad')}
            >
              <ShieldCheck size={15} /> Privacidad y seguridad
            </button>
            <button
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'atajos'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              onClick={() => setActiveTab('atajos')}
            >
              <Keyboard size={15} /> Atajos de teclado
            </button>

            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-3 pb-1.5">
              ESPACIOS
            </div>
            <button
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'espacios'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              onClick={() => setActiveTab('espacios')}
            >
              <FolderKanban size={15} /> Mis Espacios ({servers.length})
            </button>
          </nav>

          {/* Right Content Area */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#111420]">
            {/* TAB: PERFIL */}
            {activeTab === 'perfil' && (
              <div className="space-y-6 max-w-2xl">
                {/* 1. Discord Profile Card Preview */}
                <div className="rounded-3xl bg-[#141826] border border-white/[0.08] overflow-hidden shadow-2xl">
                  {/* Banner Image */}
                  <div className="h-28 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-950 relative overflow-hidden group">
                    {banner ? (
                      <img src={banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-700 via-indigo-950 to-[#0d0f18]" />
                    )}
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-[11px] font-semibold border border-white/20 backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                      title="Subir imagen de banner"
                    >
                      <ImageIcon size={13} />
                      <span>Cambiar banner</span>
                    </button>
                  </div>

                  {/* Profile Avatar & Actions */}
                  <div className="px-6 pb-6 pt-0 relative">
                    <div className="flex items-end justify-between -mt-12 mb-3">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-3xl p-1 bg-[#141826] ring-4 ring-[#141826] shadow-2xl overflow-hidden">
                          {avatar ? (
                            <img src={avatar} alt={name} className="w-full h-full rounded-2xl object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-bold text-white text-2xl">
                              {(name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {/* Camera upload badge */}
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 p-2 rounded-xl bg-[#72e4d0] text-black shadow-lg hover:scale-110 transition-transform cursor-pointer ring-2 ring-[#141826]"
                          title="Cargar foto desde tu ordenador"
                        >
                          <Camera size={14} />
                        </button>
                      </div>

                      {/* Photo Upload Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Hidden file inputs */}
                        <input
                          type="file"
                          ref={avatarFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarFileUpload}
                        />
                        <input
                          type="file"
                          ref={bannerFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerFileUpload}
                        />

                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                        >
                          <Upload size={14} />
                          <span>Subir foto</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-all cursor-pointer"
                        >
                          <Sparkles size={14} className="text-cyan-400" />
                          <span>Presets</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                        <span>{name || 'Juanpi'}</span>
                        <span className="text-xs text-slate-500 font-mono font-normal">
                          #{currentUser.tag || '0001'}
                        </span>
                      </h3>
                      <p className="text-xs text-[#72e4d0] mt-0.5">{status || 'En línea'}</p>
                    </div>
                  </div>
                </div>

                {/* Avatar Gallery Drawer */}
                {isAvatarPickerOpen && (
                  <div className="p-4 rounded-2xl bg-[#141824] border border-white/[0.08] space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-cyan-400" />
                        <span>Elige un avatar prediseñado o genera uno al azar</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const seed = `Kova_${Math.random().toString(36).substring(2, 8)}`;
                          const generated = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                          setAvatar(generated);
                          updateUserProfile({ avatar: generated });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30 transition-all cursor-pointer"
                      >
                        <Shuffle size={12} />
                        <span>Generar aleatorio</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {[
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                        'https://api.dicebear.com/7.x/bottts/svg?seed=CyberKova1',
                        'https://api.dicebear.com/7.x/bottts/svg?seed=NeonRunner',
                        'https://api.dicebear.com/7.x/bottts/svg?seed=AuraMaster',
                        'https://api.dicebear.com/7.x/bottts/svg?seed=JuanpiFounder',
                      ].map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAvatar(imgUrl);
                            updateUserProfile({ avatar: imgUrl });
                          }}
                          className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
                            avatar === imgUrl
                              ? 'border-cyan-400 ring-2 ring-cyan-400/30 scale-105'
                              : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={imgUrl} alt="Avatar option" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
                      <input
                        type="url"
                        value={customAvatarInput}
                        onChange={(e) => setCustomAvatarInput(e.target.value)}
                        placeholder="O pega aquí la URL web de una imagen..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-[#0e111a] border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!customAvatarInput.trim()) return;
                          setAvatar(customAvatarInput.trim());
                          updateUserProfile({ avatar: customAvatarInput.trim() });
                          setCustomAvatarInput('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}

                {/* Profile Form Fields */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Nombre visible
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre en Kova..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Estado personalizado
                    </label>
                    <input
                      type="text"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      placeholder="¿Qué estás construyendo hoy? Ej. Desarrollando nueva app..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Sobre mí (Biografía)
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Cuéntale a tu comunidad sobre tus proyectos, intereses y roles..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#141824] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: APARIENCIA */}
            {activeTab === 'apariencia' && (
              <SettingsSection
                title="Temas & Entorno Visual Activo"
                description="Haz clic en cualquier tema para transformar instantáneamente la interfaz de Kova."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {[
                    {
                      id: 'crimson' as BackgroundTheme,
                      name: 'Dark Rojo Carmesí',
                      desc: 'Negro obsidiana profundo con sutil atmósfera sangre, rojo carmesí y acentos rubí.',
                      badge: 'Nuevo · Dark Red',
                      previewBg: 'bg-gradient-to-br from-red-950/90 via-[#0a0104] to-[#120207] border-rose-500/40',
                      dotColor: 'bg-rose-500 shadow-sm shadow-rose-500/50',
                    },
                    {
                      id: 'oled' as BackgroundTheme,
                      name: 'OLED Pure Black',
                      desc: 'Negro absoluto ultra profundo, contraste infinito y máxima ligereza.',
                      badge: 'Ultra Oscuro',
                      previewBg: 'bg-[#000000] border-cyan-500/40',
                      dotColor: 'bg-cyan-400',
                    },
                    {
                      id: 'abyss' as BackgroundTheme,
                      name: 'Abyssal Deep Blue',
                      desc: 'Azul noche abisal ultra profundo, zafiro medianoche y destellos cian.',
                      badge: 'Océano Profundo',
                      previewBg: 'bg-gradient-to-br from-blue-950/90 via-[#01050d] to-[#020917] border-sky-500/40',
                      dotColor: 'bg-sky-400',
                    },
                    {
                      id: 'emerald' as BackgroundTheme,
                      name: 'Deep Forest Emerald',
                      desc: 'Bosque nocturno profundo, jade carbón y verde esmeralda místico.',
                      badge: 'Verde Nocturno',
                      previewBg: 'bg-gradient-to-br from-emerald-950/90 via-[#010904] to-[#031308] border-emerald-500/40',
                      dotColor: 'bg-emerald-400',
                    },
                    {
                      id: 'amethyst' as BackgroundTheme,
                      name: 'Amethyst Gothic Void',
                      desc: 'Obsidiana púrpura gótica, violeta místico profundo y auras amatista.',
                      badge: 'Gótico Dark',
                      previewBg: 'bg-gradient-to-br from-purple-950/90 via-[#07020d] to-[#0e041a] border-purple-500/40',
                      dotColor: 'bg-purple-400',
                    },
                    {
                      id: 'amber' as BackgroundTheme,
                      name: 'Cyber Amber Eclipse',
                      desc: 'Carbón volcánico profundo con destellos ámbar fundido y dorado cálido.',
                      badge: 'Eclipse Gold',
                      previewBg: 'bg-gradient-to-br from-amber-950/90 via-[#0a0501] to-[#140a02] border-amber-500/40',
                      dotColor: 'bg-amber-400',
                    },
                    {
                      id: 'nebula' as BackgroundTheme,
                      name: 'Nebula Cyber-Glow',
                      desc: 'Auras cósmicas animadas en violeta neón, cian e índigo ambiental.',
                      badge: 'Neón Animado',
                      previewBg: 'bg-gradient-to-br from-purple-950/90 via-[#0d0718] to-indigo-950/90 border-purple-500/40',
                      dotColor: 'bg-purple-400',
                    },
                    {
                      id: 'matrix' as BackgroundTheme,
                      name: 'Matrix Digital Rain',
                      desc: 'Lluvia de caracteres de código terminal verde a 60fps activos.',
                      badge: 'Matrix FX',
                      previewBg: 'bg-[#020b05] border-emerald-500/40',
                      dotColor: 'bg-emerald-400',
                    },
                    {
                      id: 'synthwave' as BackgroundTheme,
                      name: 'Synthwave 80s Dusk',
                      desc: 'Horizonte retro-futurista en magenta, rosa fucsia y rejilla neon.',
                      badge: 'Retro-Wave',
                      previewBg: 'bg-gradient-to-b from-[#180528] to-[#040409] border-pink-500/40',
                      dotColor: 'bg-pink-400',
                    },
                    {
                      id: 'discord' as BackgroundTheme,
                      name: 'Discord Classic Dark',
                      desc: 'El clásico tema oscuro Blurple de Discord con tonos grafito.',
                      badge: 'Discord UI',
                      previewBg: 'bg-[#313338] border-indigo-500/40',
                      dotColor: 'bg-[#5865f2]',
                    },
                  ].map((thm) => {
                    const isSelected = theme === thm.id;
                    return (
                      <button
                        type="button"
                        key={thm.id}
                        onClick={() => {
                          setTheme(thm.id);
                          toast.success(`Tema ${thm.name} activado`);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden flex flex-col justify-between ${
                          thm.previewBg
                        } ${
                          isSelected
                            ? 'ring-2 ring-[#72e4d0] border-transparent shadow-2xl scale-[1.02]'
                            : 'opacity-85 hover:opacity-100 hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${thm.dotColor}`} />
                            <span>{thm.name}</span>
                          </span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.1] text-white font-mono">
                            {thm.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">{thm.desc}</p>
                        {isSelected && (
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#72e4d0] font-bold">
                            <Check size={14} />
                            <span>Tema en uso actualmente</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    OPCIONES DE PANTALLA
                  </div>
                  <PreferenceToggle
                    label="Modo compacto de mensajes"
                    description="Reduce el espaciado vertical entre mensajes para ver más contenido en pantalla."
                    checked={preferences.compactMode}
                    onChange={() => updatePreference('compactMode', !preferences.compactMode)}
                  />
                  <PreferenceToggle
                    label="Reducir movimiento"
                    description="Minimiza las animaciones y transiciones para máxima velocidad y menor fatiga visual."
                    checked={preferences.reducedMotion}
                    onChange={() => updatePreference('reducedMotion', !preferences.reducedMotion)}
                  />
                  <PreferenceToggle
                    label="Efectos sonoros de interfaz"
                    description="Reproduce sonidos sutiles al enviar mensajes, entrar a voz y recibir alertas."
                    checked={preferences.soundEnabled}
                    onChange={() => updatePreference('soundEnabled', !preferences.soundEnabled)}
                  />
                </div>
              </SettingsSection>
            )}

            {/* TAB: VOZ Y VÍDEO */}
            {activeTab === 'voz' && (
              <SettingsSection
                title="Voz y vídeo HD"
                description="Ajustes de calidad para llamadas privadas y canales de voz."
              >
                <PreferenceToggle
                  label="Supresión de ruido neuronal Crisp"
                  description="Filtra tecleos, ruidos de fondo y eco mediante procesamiento en tiempo real."
                  checked={preferences.noiseSuppression}
                  onChange={() => updatePreference('noiseSuppression', !preferences.noiseSuppression)}
                />
                <PreferenceToggle
                  label="Previsualización de cámara antes de transmitir"
                  description="Muestra tu cámara antes de activarla en salas compartidas."
                  checked={preferences.videoPreview}
                  onChange={() => updatePreference('videoPreview', !preferences.videoPreview)}
                />
              </SettingsSection>
            )}

            {/* TAB: NOTIFICACIONES */}
            {activeTab === 'notificaciones' && (
              <SettingsSection
                title="Notificaciones & Avisos"
                description="Elige cuándo Kova debe avisarte de nueva actividad."
              >
                <PreferenceToggle
                  label="Menciones directas (@nombre)"
                  description="Recibe notificación sonora y visual cuando alguien te mencione en canales o DMs."
                  checked={preferences.directMentions}
                  onChange={() => updatePreference('directMentions', !preferences.directMentions)}
                />
                <PreferenceToggle
                  label="Actividad global del servidor"
                  description="Muestra badges de mensajes no leídos en canales con nuevos mensajes."
                  checked={preferences.channelActivity}
                  onChange={() => updatePreference('channelActivity', !preferences.channelActivity)}
                />
              </SettingsSection>
            )}

            {/* TAB: PRIVACIDAD */}
            {activeTab === 'privacidad' && (
              <SettingsSection
                title="Privacidad & Seguridad"
                description="Controla la visibilidad de tu cuenta y la seguridad de inicio de sesión."
              >
                {/* Two-Factor Authentication (2FA) Official Discord Card */}
                <div
                  className={`p-5 rounded-3xl border transition-all ${
                    isTwoFactorEnabled
                      ? 'bg-emerald-950/20 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                      : 'bg-gradient-to-br from-[#141824] to-[#121422] border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                          isTwoFactorEnabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {isTwoFactorEnabled ? <ShieldCheck size={22} /> : <Lock size={22} />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-['Outfit']">
                            Autenticación en dos pasos (2FA)
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isTwoFactorEnabled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-700/50 text-slate-400 border border-white/[0.06]'
                            }`}
                          >
                            {isTwoFactorEnabled ? 'Activado' : 'Desactivado'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                          {isTwoFactorEnabled
                            ? 'Tu cuenta está protegida con verificación mediante app de autenticación móvil (Google Authenticator, Authy) y códigos de respaldo.'
                            : 'Protege tu cuenta de Kova con una capa adicional de seguridad. Al iniciar sesión, deberás introducir tu contraseña y un código de 6 dígitos de tu teléfono.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isTwoFactorEnabled ? (
                    <div className="mt-4 pt-4 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                        <Smartphone size={14} />
                        <span>Google Authenticator / Authy conectado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsTwoFactorBackupOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors cursor-pointer"
                        >
                          <KeyRound size={14} />
                          <span>Ver códigos de respaldo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsTwoFactorDisableOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <ShieldAlert size={14} />
                          <span>Desactivar 2FA</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                      <ul className="text-[11px] text-slate-400 space-y-1">
                        <li className="flex items-center gap-1.5">
                          <Check size={12} className="text-purple-400" />
                          <span>Compatible con Google Authenticator, Authy y 1Password</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check size={12} className="text-purple-400" />
                          <span>Incluye 8 códigos de respaldo descargables</span>
                        </li>
                      </ul>
                      <button
                        type="button"
                        onClick={() => setIsTwoFactorSetupOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        <ShieldCheck size={15} />
                        <span>Activar autenticación en dos pasos</span>
                      </button>
                    </div>
                  )}
                </div>

                <PreferenceToggle
                  label="Mostrar estado de actividad en tiempo real"
                  description="Permite que otros vean si estás en línea, en llamada o concentrado."
                  checked={preferences.activityStatus}
                  onChange={() => updatePreference('activityStatus', !preferences.activityStatus)}
                />
                <PreferenceToggle
                  label="Protección contra enlaces externos desconocidos"
                  description="Solicita confirmación antes de abrir URLs externas fuera de Kova."
                  checked={preferences.confirmExternalLinks}
                  onChange={() => updatePreference('confirmExternalLinks', !preferences.confirmExternalLinks)}
                />
              </SettingsSection>
            )}

            {/* TAB: ATAJOS */}
            {activeTab === 'atajos' && (
              <SettingsSection
                title="Atajos de Teclado Esenciales"
                description="Atajos rápidos para navegar y controlar Kova con el teclado."
              >
                <div className="space-y-2">
                  {[
                    { label: 'Buscar canales y mensajes (Command Palette)', key: 'Ctrl + K' },
                    { label: 'Abrir Asistente Kova AI', key: 'Ctrl + J' },
                    { label: 'Enviar mensaje en chat', key: 'Enter' },
                    { label: 'Insertar salto de línea', key: 'Shift + Enter' },
                    { label: 'Silenciar micrófono', key: 'Ctrl + Shift + M' },
                    { label: 'Ensordecer audio', key: 'Ctrl + Shift + D' },
                    { label: 'Cerrar modal o panel activo', key: 'Esc' },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#141824] border border-white/[0.06]"
                    >
                      <span className="text-xs text-slate-300">{s.label}</span>
                      <kbd className="px-2.5 py-1 rounded-lg bg-[#0e111a] border border-white/[0.1] text-xs font-mono font-bold text-purple-300">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </SettingsSection>
            )}

            {/* TAB: MIS ESPACIOS */}
            {activeTab === 'espacios' && (
              <SettingsSection
                title="Gestión de Servidores y Espacios"
                description="Administra los servidores que has creado en tu cuenta."
              >
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141824] border border-white/[0.08] mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-white font-['Outfit']">Crear un nuevo servidor</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Crea un espacio vacío y añade tus propios canales como en Discord.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsCreateServerOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    <Plus size={14} />
                    <span>Nuevo Servidor</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {servers.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No tienes servidores creados aún. Haz clic en "Nuevo Servidor" para comenzar.
                    </div>
                  ) : (
                    servers.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#141824] border border-white/[0.06] hover:border-white/[0.12] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-xs font-bold text-cyan-300">
                            {s.acronym || s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{s.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {s.channels.length} canales · {s.description || 'Sin descripción'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`¿Seguro que deseas eliminar el servidor "${s.name}"?`)) {
                              deleteServer(s.id);
                              toast.success(`Servidor "${s.name}" eliminado`);
                            }
                          }}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar este servidor"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </SettingsSection>
            )}


          </div>
        </div>

        {/* Modal Footer */}
        <footer className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-between shrink-0 bg-[#0d0f18]">
          <button
            type="button"
            onClick={() => {
              setIsSettingsOpen(false);
              logout();
              toast.info('Sesión cerrada');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-semibold border border-rose-500/25 transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span>Cerrar sesión</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              onClick={() => setIsSettingsOpen(false)}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer glow-purple"
              onClick={saveSettings}
            >
              {saved ? (
                <>
                  <Check size={14} /> Guardado
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
