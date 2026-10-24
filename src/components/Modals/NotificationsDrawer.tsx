import React from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Tv,
  Bot,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  Radio,
} from 'lucide-react';
import { useApp, AppNotification } from '../../context/AppContext';
import { toast } from 'sonner';

export const NotificationsDrawer: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
    setActiveChannelId,
    setIsDMViewActive,
    setIsLiveStreamsOpen,
  } = useApp();

  if (!isNotificationsOpen) return null;

  const handleAction = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);

    if (notif.type === 'stream') {
      setIsNotificationsOpen(false);
      setIsLiveStreamsOpen(true);
      return;
    }

    if (notif.channelId) {
      setIsDMViewActive(false);
      setActiveChannelId(notif.channelId);
      setIsNotificationsOpen(false);
      toast.success(`Navegando al canal...`);
    } else if (notif.url) {
      window.open(notif.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'stream':
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-sm shadow-rose-950/50">
            <Radio size={18} className="animate-pulse" />
          </div>
        );
      case 'bot':
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 shadow-sm shadow-purple-950/50">
            <Bot size={18} />
          </div>
        );
      case 'system':
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-950/50">
            <Sparkles size={18} />
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsNotificationsOpen(false)}
    >
      <div
        className="w-full max-w-md h-full bg-[#0b0517] border-l border-purple-950/70 shadow-[0_0_50px_rgba(147,51,234,0.15)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 px-5 border-b border-purple-950/60 flex items-center justify-between shrink-0 bg-[#070210]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Bell size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-['Outfit'] tracking-wide">
                  Notificaciones
                </h3>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-extrabold shadow-sm shadow-purple-600/40">
                    {unreadNotificationsCount} nuevas
                  </span>
                )}
              </div>
              <p className="text-[11px] text-purple-400/60">Interacciones en JuanPi1x Community</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadNotificationsCount > 0 && (
              <button
                onClick={() => {
                  markAllNotificationsAsRead();
                  toast.success('Todas las notificaciones marcadas como leídas');
                }}
                title="Marcar todas como leídas"
                className="px-2.5 py-1.5 rounded-xl hover:bg-purple-900/30 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-500/20"
              >
                <CheckCheck size={14} />
                <span className="hidden sm:inline text-[11px]">Leídas</span>
              </button>
            )}

            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center text-slate-500 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-950/30 border border-purple-900/30 flex items-center justify-center text-purple-400/50">
                <Bell size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-300">¡Todo al día!</p>
                <p className="text-xs text-slate-500 max-w-[240px] mt-1">
                  No tienes notificaciones pendientes en este momento.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl border transition-all duration-200 group relative ${
                  !notif.read
                    ? 'bg-purple-950/20 border-purple-500/40 shadow-sm shadow-purple-950/40'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-purple-900/30'
                }`}
              >
                {!notif.read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500" />
                )}

                <div className="flex items-start gap-3">
                  {getNotificationIcon(notif.type)}

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                    </div>

                    <p className="text-xs text-slate-300/80 leading-relaxed mt-1 text-pretty">
                      {notif.description}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {notif.timestamp}
                      </span>

                      <div className="flex items-center gap-2">
                        {notif.actionLabel && (
                          <button
                            onClick={() => handleAction(notif)}
                            className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          >
                            <span>{notif.actionLabel}</span>
                            <ArrowUpRight size={12} />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            dismissNotification(notif.id);
                            toast.info('Notificación descartada');
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Descartar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
