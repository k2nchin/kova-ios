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
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { Channel } from '../../types';

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
    joinVoiceChannel,
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

  return (
    <div className="flex-1 rounded-2xl bg-[#11151c] border border-white/[0.06] p-2.5 flex flex-col justify-between overflow-hidden shadow-xl select-none font-['Plus_Jakarta_Sans',sans-serif] relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col space-y-3">
        {/* 1. Workspace Header */}
        <div className="workspace-heading px-1 pt-1 pb-2 border-b border-white/[0.05] relative">
          <div className="workspace-brand">
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
              <div className="absolute top-full left-1 right-1 z-50 mt-1 p-1.5 rounded-2xl bg-[#141824] border border-white/[0.1] shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-100">
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
                    openInviteModal(activeServer.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer text-left font-semibold"
                >
                  <UserPlus size={14} className="text-cyan-400" />
                  <span>Invitar Amigos</span>
                </button>
                <button
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    setServerSettingsTab('roles');
                    setIsServerSettingsOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer text-left font-semibold"
                >
                  <Settings size={14} className="text-slate-400" />
                  <span>Ajustes del Servidor</span>
                </button>
                <button
                  onClick={() => {
                    setIsServerMenuOpen(false);
                    setIsAppDirectoryOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/[0.08] transition-colors cursor-pointer text-left font-semibold"
                >
                  <Bot size={14} className="text-indigo-400" />
                  <span>Directorio de Bots y Apps</span>
                </button>
                <div className="h-[1px] bg-white/[0.06] my-1" />
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
              </div>
            </>
          )}
        </div>

        {/* 2. Top Action Pills (AI & Activity) */}
        <div className="space-y-1 relative">
          <button
            onClick={() => setIsKovaAIOpen(true)}
            className="sidebar-action cursor-pointer"
            title="Ver resumen inteligente"
          >
            <Sparkles size={15} className="text-[#b89cff]" />
            <span>Resumen inteligente</span>
            <span className="new-label">AI</span>
          </button>

          <button
            onClick={() => setIsActivityOpen(!isActivityOpen)}
            className="sidebar-action cursor-pointer"
            title="Ver actividad reciente"
          >
            <Bell size={15} className="text-[#72e4d0]" />
            <span>Actividad</span>
            <span className="activity-dot" />
          </button>

          {/* Activity Drawer Popover */}
          {isActivityOpen && (
            <div className="absolute top-18 left-0 right-0 z-50 p-3 rounded-2xl bg-[#141824] border border-white/[0.1] shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                  ACTIVIDAD RECIENTE
                </span>
                <button
                  onClick={() => setIsActivityOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="space-y-1.5">
                {recentActivities.map((act) => (
                  <button
                    key={act.id}
                    onClick={() => {
                      setActiveChannelId(act.channelId);
                      setIsActivityOpen(false);
                      toast.success(`Saltando a #${act.channelName}`);
                    }}
                    className="w-full p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-left transition-colors flex items-start justify-between gap-2 cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                        {act.title}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono">
                        #{act.channelName} · {act.time}
                      </div>
                    </div>
                    <ArrowUpRight size={13} className="text-slate-500 group-hover:text-cyan-400 shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Status & Story Shortcut */}
        <div className="flex items-center gap-3 py-1.5 px-2 rounded-xl bg-[#171b25]/60 border border-white/[0.04]">
          <div
            onClick={() => setIsCreateStoryOpen(true)}
            className="flex flex-col items-center gap-1 cursor-pointer group shrink-0"
            title="Subir historia"
          >
            <div className="w-8 h-8 rounded-full bg-[#171b25] border border-dashed border-[#72e4d0]/40 group-hover:border-[#72e4d0] flex items-center justify-center text-[#72e4d0] transition-all">
              <Plus size={14} />
            </div>
            <span className="text-[9px] text-[#778398] group-hover:text-white transition-colors leading-none whitespace-nowrap">
              Historia
            </span>
          </div>

          <div
            onClick={() => setIsStatusModalOpen(true)}
            className="text-[11px] text-[#778398] leading-tight min-w-0 flex-1 cursor-pointer hover:text-white transition-colors"
          >
            {currentUser.customStatus ? (
              <span className="text-[#72e4d0] font-medium truncate block">
                {currentUser.customStatus}
              </span>
            ) : (
              'Pulsa para definir tu estado...'
            )}
          </div>
        </div>

        {/* 4. Quick Search Trigger (Ctrl+K) */}
        <div
          onClick={() => setIsCommandPaletteOpen(true)}
          className="sidebar-search cursor-pointer hover:border-white/[0.15] transition-colors"
        >
          <Search size={15} />
          <span>Buscar en Kova</span>
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
                .map((chan) => {
                  const isCurrent = activeChannel?.id === chan.id;
                  return (
                    <div
                      key={chan.id}
                      className="group/chan flex items-center justify-between rounded hover:bg-white/[0.04] transition-colors h-[32px] px-1"
                    >
                      <button
                        onClick={() => {
                          setActiveChannelId(chan.id);
                          if (chan.type === 'voice') {
                            joinVoiceChannel(chan.id);
                          }
                        }}
                        className={`channel-row flex-1 cursor-pointer ${isCurrent ? 'is-active' : ''}`}
                      >
                        <span className="channel-icon">
                          {chan.type === 'voice' ? (
                            <Headphones size={15} strokeWidth={2} />
                          ) : chan.type === 'notes' ? (
                            <FileText size={15} strokeWidth={2} />
                          ) : chan.type === 'announcements' ? (
                            <Radio size={15} strokeWidth={2} />
                          ) : (
                            <Hash size={15} strokeWidth={2} />
                          )}
                        </span>
                        <span className="channel-name truncate text-[13.5px]">{chan.name}</span>
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
                  );
                })}
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
                    {catChannels.map((chan) => {
                      const isCurrent = activeChannel?.id === chan.id;
                      return (
                        <div
                          key={chan.id}
                          className="group/chan flex items-center justify-between rounded hover:bg-white/[0.04] transition-colors h-[32px] px-1"
                        >
                          <button
                            onClick={() => {
                              setActiveChannelId(chan.id);
                              if (chan.type === 'voice') {
                                joinVoiceChannel(chan.id);
                              }
                            }}
                            className={`channel-row flex-1 cursor-pointer ${isCurrent ? 'is-active' : ''}`}
                          >
                            <span className="channel-icon">
                              {chan.type === 'voice' ? (
                                <Headphones size={15} strokeWidth={2} />
                              ) : chan.type === 'notes' ? (
                                <FileText size={15} strokeWidth={2} />
                              ) : chan.type === 'announcements' ? (
                                <Radio size={15} strokeWidth={2} />
                              ) : (
                                <Hash size={15} strokeWidth={2} />
                              )}
                            </span>
                            <span className="channel-name truncate text-[13.5px]">{chan.name}</span>
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
                      );
                    })}
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
