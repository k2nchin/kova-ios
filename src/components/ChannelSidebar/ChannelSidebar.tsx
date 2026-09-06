import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Hash,
  FileText,
  Radio,
  Bell,
  Search,
  Plus,
  AtSign,
  Headphones,
  Trash2,
  X,
  FolderPlus,
  Settings,
  UserPlus,
  Sparkles,
  ArrowUpRight,
  Bot,
  Mic,
  MicOff,
  Volume2,
  Shield,
  LogOut,
  PhoneOff,
  Music2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { Channel, User } from '../../types';

export const ChannelSidebar: React.FC = () => {
  const {
    activeServer,
    activeChannel,
    setActiveChannelId,
    deleteChannel,
    deleteCategory,
    deleteServer,
    currentUser,
    setCurrentUser,
    toggleMute,
    toggleDeafen,
    joinVoiceChannel,
    leaveVoiceChannel,
    isInVoice,
    activeVoiceChannelId,
    setIsSoundboardOpen,
    openUserProfile,
    setIsCreateChannelOpen,
    setIsCreateCategoryOpen,
    setPresetChannelType,
    setPresetCategoryId,
    setIsSettingsOpen,
    setIsKovaAIOpen,
    setIsCommandPaletteOpen,
    setIsCreateStoryOpen,
    openInviteModal,
    setIsServerSettingsOpen,
    setServerSettingsTab,
    setIsEditChannelOpen,
    setEditingChannelId,
    setIsAppDirectoryOpen,
  } = useApp();

  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState('');

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleSaveStatus = (statusText: string) => {
    setCurrentUser({
      ...currentUser,
      customStatus: statusText,
    });
    setIsStatusModalOpen(false);
    toast.success('Estado actualizado');
  };

  const recentActivities = [
    {
      id: 'act_1',
      title: 'Elena Vance compartió código Rust',
      channelName: 'chat-general',
      channelId: 'chan_general',
      time: 'Hace 5m',
    },
    {
      id: 'act_2',
      title: 'Marcus Void se unió a Voz Principal',
      channelName: 'Voz Principal (HD)',
      channelId: 'chan_voice_main',
      time: 'Hace 18m',
    },
    {
      id: 'act_3',
      title: 'Nueva nota de roadmap creada',
      channelName: 'roadmap-notas',
      channelId: 'chan_notes',
      time: 'Hace 1h',
    },
  ];

  const renderVoiceUsers = (chan: Channel) => {
    if (chan.type !== 'voice') return null;

    const usersInChannel: {
      id: string;
      displayName: string;
      avatar?: string;
      isSpeaking?: boolean;
      isMuted?: boolean;
      isDeafened?: boolean;
      isScreenSharing?: boolean;
      userObj?: User;
    }[] = [];

    // 1. Current user if connected to this voice channel
    if (activeVoiceChannelId === chan.id) {
      usersInChannel.push({
        id: currentUser.id,
        displayName: currentUser.displayName || 'Tú',
        avatar: currentUser.avatar,
        isSpeaking: currentUser.isSpeaking,
        isMuted: currentUser.isMuted,
        isDeafened: currentUser.isDeafened,
        isScreenSharing: currentUser.isScreenSharing,
        userObj: currentUser,
      });
    }

    // 2. Real server members connected in channel
    const connectedMemberIds = chan.connectedUsers || [];
    for (const mId of connectedMemberIds) {
      if (mId === currentUser.id) continue;
      const member = activeServer.members?.find((m) => m.id === mId);
      if (member) {
        usersInChannel.push({
          id: member.id,
          displayName: member.displayName,
          avatar: member.avatar,
          isSpeaking: false,
          isMuted: false,
          isDeafened: false,
          isScreenSharing: false,
          userObj: member,
        });
      }
    }

    if (usersInChannel.length === 0) return null;

    return (
      <div className="pl-6 pr-1 pb-1 space-y-0.5 animate-in fade-in duration-150">
        {usersInChannel.map((u) => (
          <div
            key={u.id}
            onClick={(e) => {
              e.stopPropagation();
              if (u.userObj) openUserProfile(u.userObj);
            }}
            className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer group/user"
            title={`Ver perfil de ${u.displayName}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                {u.avatar ? (
                  <img
                    src={u.avatar}
                    alt={u.displayName}
                    className={`w-5 h-5 rounded-full object-cover transition-all ${
                      u.isSpeaking ? 'ring-2 ring-emerald-400 shadow-[0_0_8px_#34d399]' : ''
                    }`}
                  />
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-700 text-[9px] font-bold text-white flex items-center justify-center ${
                      u.isSpeaking ? 'ring-2 ring-emerald-400 shadow-[0_0_8px_#34d399]' : ''
                    }`}
                  >
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {u.isSpeaking && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-1 ring-[#11151c] animate-pulse" />
                )}
              </div>
              <span
                className={`text-[12px] truncate transition-colors ${
                  u.isSpeaking ? 'text-emerald-400 font-semibold' : 'text-slate-300 group-hover/user:text-white'
                }`}
              >
                {u.displayName}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-slate-400">
              {u.isScreenSharing && (
                <span className="text-[8px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold font-mono">
                  LIVE
                </span>
              )}
              {u.isMuted && <MicOff size={11} className="text-rose-400" />}
              {u.isDeafened && <Headphones size={11} className="text-rose-400" />}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderChannelRow = (chan: Channel) => {
    const isCurrent = activeChannel?.id === chan.id;
    const isVoiceConnected = chan.type === 'voice' && activeVoiceChannelId === chan.id;

    return (
      <div key={chan.id} className="space-y-0.5">
        <div className="group/chan flex items-center justify-between rounded hover:bg-white/[0.04] transition-colors h-[32px] px-1">
          <button
            onClick={() => {
              if (chan.type === 'voice') {
                if (isVoiceConnected) {
                  // User clicked the voice channel they are currently in -> Leave voice and return to text channel
                  leaveVoiceChannel();
                  const firstText = activeServer.channels.find((c) => c.type === 'text' || c.type === 'announcements');
                  if (firstText) {
                    setActiveChannelId(firstText.id);
                  }
                  toast.info(`Te has desconectado de ${chan.name}`);
                  return;
                }
                setActiveChannelId(chan.id);
                joinVoiceChannel(chan.id);
              } else {
                setActiveChannelId(chan.id);
              }
            }}
            className={`channel-row flex-1 cursor-pointer ${isCurrent ? 'is-active' : ''}`}
            title={chan.type === 'voice' ? (isVoiceConnected ? 'Hacer clic para desconectar de la voz' : 'Hacer clic para entrar al canal de voz') : undefined}
          >
            <span className="channel-icon">
              {chan.type === 'voice' ? (
                isVoiceConnected ? (
                  <Volume2 size={15} className="text-emerald-400 animate-pulse" />
                ) : (
                  <Headphones size={15} strokeWidth={2} />
                )
              ) : chan.type === 'notes' ? (
                <FileText size={15} strokeWidth={2} />
              ) : chan.type === 'announcements' ? (
                <Radio size={15} strokeWidth={2} />
              ) : (
                <Hash size={15} strokeWidth={2} />
              )}
            </span>
            <span className={`channel-name truncate text-[13.5px] ${isVoiceConnected ? 'text-emerald-400 font-semibold' : ''}`}>
              {chan.name}
            </span>
            {isVoiceConnected && (
              <span className="ml-auto mr-1 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold tracking-tight">
                EN VOZ
              </span>
            )}
            {chan.type === 'announcements' && (
              <span className="mention-pill">
                <AtSign size={10} />
              </span>
            )}
          </button>

          <div className="flex items-center opacity-0 group-hover/chan:opacity-100 transition-opacity mr-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingChannelId(chan.id);
                setIsEditChannelOpen(true);
              }}
              className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/[0.08] transition-all cursor-pointer"
              title="Editar canal"
            >
              <Settings size={12} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`¿Eliminar canal #${chan.name}?`)) {
                  deleteChannel(chan.id);
                }
              }}
              className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-all cursor-pointer"
              title="Eliminar canal"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Nested Connected Voice Participants List */}
        {renderVoiceUsers(chan)}
      </div>
    );
  };

  return (
    <div className="flex-1 rounded-2xl bg-[#11151c] border border-white/[0.06] p-2.5 flex flex-col justify-between overflow-hidden shadow-xl select-none font-['Plus_Jakarta_Sans',sans-serif] relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col space-y-3">
        {/* 1. Workspace Header */}
        <div className="workspace-heading px-1 pt-1 pb-2 border-b border-white/[0.05] relative">
          <div className="workspace-brand flex items-center gap-2">
            <img
              src="/kova-logo.png"
              alt="Kova"
              className="w-5 h-5 object-contain"
            />
            <span className="wordmark">
              KOV<span>A</span>
            </span>
            <span className="wordmark-sub">DISCORD SUITE</span>
          </div>
          <button
            onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
            className="workspace-name hover:opacity-85 transition-opacity cursor-pointer flex items-center justify-between w-full"
            title="Opciones del servidor"
          >
            <span className="truncate">{activeServer.name}</span>
            <ChevronDown size={14} className={`text-[#778398] transition-transform ${isServerMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Discord Style Server Context Menu Dropdown */}
          {isServerMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsServerMenuOpen(false)} />
              <div className="absolute top-full left-1 right-1 z-50 mt-1 p-1.5 rounded-2xl bg-[#141824] border border-white/[0.1] shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-100 text-slate-200">
                <button
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    openInviteModal(activeServer.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-cyan-300 hover:bg-cyan-500/15 transition-colors cursor-pointer text-left font-semibold"
                >
                  <UserPlus size={14} />
                  <span>Invitar personas</span>
                </button>
                <button
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    setPresetChannelType('text');
                    setPresetCategoryId(undefined);
                    setIsCreateChannelOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer text-left font-semibold group"
                >
                  <Plus size={14} className="text-purple-400 group-hover:text-white" />
                  <span>Crear Canal</span>
                </button>
                <button
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    setIsCreateCategoryOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer text-left font-semibold group"
                >
                  <FolderPlus size={14} className="text-purple-400 group-hover:text-white" />
                  <span>Crear Categoría</span>
                </button>
                <button
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    toast.info(`Notificaciones configuradas para ${activeServer.name}`);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/[0.08] transition-colors cursor-pointer text-left font-medium"
                >
                  <Bell size={14} className="text-slate-400" />
                  <span>Ajustes de Notificaciones</span>
                </button>
                <div className="h-[1px] bg-white/[0.06] my-1" />
                <button
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    setServerSettingsTab('overview');
                    setIsServerSettingsOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer text-left font-semibold"
                >
                  <Settings size={14} className="text-slate-400" />
                  <span>Configuración del Servidor</span>
                </button>
                <button
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    setServerSettingsTab('roles');
                    setIsServerSettingsOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer text-left font-semibold"
                >
                  <Shield size={14} className="text-amber-400" />
                  <span>Roles y Permisos</span>
                </button>
                <button
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    setIsAppDirectoryOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer text-left font-semibold"
                >
                  <Bot size={14} className="text-indigo-400" />
                  <span>Integraciones y Bots</span>
                </button>
                <div className="h-[1px] bg-white/[0.06] my-1" />
                {activeServer.ownerId === currentUser.id ? (
                  <button
                    onClick={() => {
                      setIsServerMenuOpen(false);
                      if (window.confirm(`¿Seguro que deseas eliminar el servidor "${activeServer.name}"?`)) {
                        deleteServer(activeServer.id);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer text-left font-semibold"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar Servidor</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsServerMenuOpen(false);
                      deleteServer(activeServer.id);
                      toast.info(`Has salido del servidor "${activeServer.name}"`);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-amber-400 hover:bg-amber-500/15 transition-colors cursor-pointer text-left font-semibold"
                  >
                    <LogOut size={14} />
                    <span>Salir del Servidor</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Quick Search Trigger (Ctrl+K) */}
        <div
          onClick={() => setIsCommandPaletteOpen(true)}
          className="sidebar-search cursor-pointer hover:border-white/[0.15] transition-colors"
        >
          <Search size={15} />
          <span>Buscar canal...</span>
          <kbd>Ctrl + K</kbd>
        </div>

        {/* 5. Dynamic Channel Tree */}
        <nav className="space-y-3 pt-1">
          {/* If server is completely empty (no channels and no categories) */}
          {activeServer.channels.length === 0 && activeServer.categories.length === 0 && (
            <div className="p-4 rounded-2xl bg-[#141824]/60 border border-white/[0.04] text-center space-y-3 my-2">
              <div className="w-9 h-9 mx-auto rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Hash size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 font-['Outfit']">Sin canales aún</p>
                <p className="text-[11px] text-slate-400 mt-1">Crea tu primer canal o categoría para comenzar.</p>
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setPresetChannelType('text');
                    setPresetCategoryId(undefined);
                    setIsCreateChannelOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Crear Canal</span>
                </button>
                <button
                  onClick={() => setIsCreateCategoryOpen(true)}
                  className="w-full py-1.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 border border-white/[0.06] cursor-pointer"
                >
                  <FolderPlus size={14} />
                  <span>Crear Categoría</span>
                </button>
              </div>
            </div>
          )}

          {/* Uncategorized Channels (Rendered at top above categories, like Discord) */}
          {activeServer.channels.filter(
            (c) => !c.categoryId || !activeServer.categories.some((cat) => cat.id === c.categoryId)
          ).length > 0 && (
            <div className="channel-section space-y-0.5">
              {activeServer.channels
                .filter(
                  (c) => !c.categoryId || !activeServer.categories.some((cat) => cat.id === c.categoryId)
                )
                .map((chan) => renderChannelRow(chan))}
            </div>
          )}

          {/* Server Categories */}
          {activeServer.categories.map((cat) => {
            const isCollapsed = !!collapsedCategories[cat.id];
            const catChannels = activeServer.channels.filter((c) => c.categoryId === cat.id);

            return (
              <div key={cat.id} className="channel-section">
                {/* Category Header */}
                <div className="flex items-center justify-between section-label pr-1 py-1 group/cat select-none">
                  <button
                    className="flex items-center gap-1.5 flex-1 text-left cursor-pointer truncate text-[11px] font-bold tracking-wider uppercase font-['Plus_Jakarta_Sans',sans-serif]"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                    <span className="truncate">{cat.name}</span>
                  </button>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setPresetCategoryId(cat.id);
                        setPresetChannelType('text');
                        setIsCreateChannelOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/[0.08] transition-colors cursor-pointer"
                      title={`Crear canal en ${cat.name}`}
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar la categoría "${cat.name}"? Los canales se mantendrán.`)) {
                          deleteCategory(cat.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Eliminar categoría"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Category Channels */}
                {!isCollapsed && (
                  <div className="space-y-0.5 pt-0.5">
                    {catChannels.map((chan) => renderChannelRow(chan))}
                    {catChannels.length === 0 && (
                      <button
                        onClick={() => {
                          setPresetCategoryId(cat.id);
                          setPresetChannelType('text');
                          setIsCreateChannelOpen(true);
                        }}
                        className="w-full py-1 px-2 rounded-lg text-[11px] text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-all text-left flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={11} />
                        <span>Añadir canal...</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Subtle Add Channel / Category shortcuts */}
          {(activeServer.channels.length > 0 || activeServer.categories.length > 0) && (
            <div className="pt-2 mt-1 border-t border-white/[0.04] flex items-center justify-between px-1 text-[11px] text-slate-400">
              <button
                onClick={() => {
                  setPresetCategoryId(undefined);
                  setPresetChannelType('text');
                  setIsCreateChannelOpen(true);
                }}
                className="py-1 px-2 rounded-lg hover:bg-white/[0.06] hover:text-white transition-all flex items-center gap-1 cursor-pointer font-medium"
                title="Crear un canal"
              >
                <Plus size={11} />
                <span>Canal</span>
              </button>
              <button
                onClick={() => setIsCreateCategoryOpen(true)}
                className="py-1 px-2 rounded-lg hover:bg-white/[0.06] hover:text-white transition-all flex items-center gap-1 cursor-pointer font-medium"
                title="Crear una categoría"
              >
                <FolderPlus size={11} />
                <span>Categoría</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* 5. Discord Style Active Voice Connection Status Bar */}
      {activeVoiceChannelId && (
        <div className="mb-2 p-2.5 rounded-xl bg-[#111f18] border border-emerald-500/30 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-150 shrink-0 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-emerald-400 leading-none truncate font-['Outfit']">
                Voz conectada
              </span>
              <span className="text-[10px] text-slate-400 font-mono leading-tight truncate mt-0.5">
                {activeServer.channels.find((c) => c.id === activeVoiceChannelId)?.name || 'Canal de voz'} · RTC 11ms
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Soundboard FX button */}
            <button
              onClick={() => setIsSoundboardOpen(true)}
              className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-pink-400 hover:text-pink-300 transition-all cursor-pointer"
              title="Abrir Soundboard"
            >
              <Music2 size={13} />
            </button>

            {/* Disconnect red phone button */}
            <button
              onClick={() => {
                leaveVoiceChannel();
                const firstText = activeServer.channels.find((c) => c.type === 'text' || c.type === 'announcements');
                if (firstText) {
                  setActiveChannelId(firstText.id);
                }
                toast.info('Te has desconectado del canal de voz');
              }}
              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
              title="Desconectarse del canal de voz"
            >
              <PhoneOff size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 6. User Profile & Settings Footer (Discord Style) */}
      <div className="pt-2 mt-2 border-t border-white/[0.06] flex items-center justify-between px-1.5 py-1 rounded-xl bg-[#090b10] shrink-0">
        <div
          onClick={() => openUserProfile(currentUser)}
          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer hover:bg-white/[0.04] p-1 -ml-1 rounded-lg transition-colors group"
          title="Ver tu perfil de usuario"
        >
          <div className="relative shrink-0">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#090b10] ${
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

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate leading-tight group-hover:text-purple-300 transition-colors">
              {currentUser.displayName}
            </span>
            <span className="text-[10px] text-slate-400 truncate font-mono">
              @{currentUser.username}
            </span>
          </div>
        </div>

        {/* Action icons: Soundboard, Mic, Headphones, User Settings */}
        <div className="flex items-center gap-0.5 shrink-0 text-slate-400">
          <button
            onClick={() => setIsSoundboardOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] hover:text-pink-400 transition-colors cursor-pointer text-slate-400"
            title="Panel de Sonidos (Soundboard)"
          >
            <Music2 size={15} />
          </button>

          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer ${
              currentUser.isMuted ? 'text-rose-400 hover:text-rose-300' : 'hover:text-white'
            }`}
            title={currentUser.isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
          >
            {currentUser.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          <button
            onClick={toggleDeafen}
            className={`p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer ${
              currentUser.isDeafened ? 'text-rose-400 hover:text-rose-300' : 'hover:text-white'
            }`}
            title={currentUser.isDeafened ? 'Desensordecer' : 'Ensordecer'}
          >
            <Headphones size={15} className={currentUser.isDeafened ? 'text-rose-400' : ''} />
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer text-slate-400 hover:rotate-45 transition-transform duration-200"
            title="Ajustes de Usuario (Configuración)"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Status Modal */}
      {isStatusModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setIsStatusModalOpen(false)}
        >
          <div
            className="w-80 rounded-2xl bg-[#141923] border border-white/[0.1] p-4 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-white font-['Outfit']">Definir estado personalizado</h3>
            <input
              type="text"
              value={customStatusInput}
              onChange={(e) => setCustomStatusInput(e.target.value)}
              placeholder="¿Qué estás haciendo o pensando?"
              className="w-full px-3 py-2 rounded-xl bg-[#0e1219] border border-white/[0.08] text-xs text-white placeholder-[#778398] outline-none focus:border-[#72e4d0]"
            />
            <div className="flex gap-1.5 flex-wrap pt-1">
              {['Disponible', 'Construyendo Kova', 'En llamada 🎧', 'Concentrado 🧠'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCustomStatusInput(s)}
                  className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] text-slate-300 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#778398] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveStatus(customStatusInput)}
                className="px-4 py-1.5 rounded-lg bg-[#72e4d0] text-[#0b0d12] text-xs font-bold shadow-md hover:opacity-90 cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
