import React from 'react';
import { Pin, X, Trash2, ArrowUpRight, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

interface PinnedMessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PinnedMessagesDrawer: React.FC<PinnedMessagesDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { messages, activeChannel, togglePinMessage } = useApp();

  if (!isOpen) return null;

  const pinnedMessages = messages.filter((m) => m.pinned);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs p-2 select-none animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm h-full rounded-2xl bg-[#111420] border border-white/[0.1] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#161a28]">
          <div className="flex items-center gap-2">
            <Pin size={16} className="text-amber-400 fill-current" />
            <div>
              <h3 className="text-sm font-bold text-white font-['Outfit']">Mensajes Fijados</h3>
              <p className="text-[11px] text-slate-400">#{activeChannel.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {pinnedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 space-y-2">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <Pin size={24} className="text-slate-600" />
              </div>
              <p className="text-xs font-semibold">No hay mensajes fijados en este canal</p>
              <p className="text-[10px] max-w-[200px]">
                Coloca el cursor sobre cualquier mensaje y pulsa "Fijar" para guardarlo aquí.
              </p>
            </div>
          ) : (
            pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-3.5 rounded-2xl bg-[#151926] border border-white/[0.08] space-y-2 group hover:border-amber-500/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={msg.author.avatar}
                      alt={msg.author.displayName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-slate-200">
                      {msg.author.displayName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>

                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <button
                    onClick={() => {
                      togglePinMessage(msg.id);
                      toast.info('Mensaje desfijado');
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Desfijar</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      toast.success('Saltando al mensaje...');
                    }}
                    className="text-[11px] text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Saltar</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
