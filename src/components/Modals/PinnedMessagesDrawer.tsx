import React, { useState } from 'react';
import { Bookmark, X, Trash2, ArrowUpRight, Copy, Search, Sparkles } from 'lucide-react';
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
  const { messages, activeChannel, togglePinMessage, setActiveChannelId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const pinnedMessages = messages.filter((m) => m.pinned);

  const filteredMessages = pinnedMessages.filter(
    (m) =>
      m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.author.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Mensaje copiado al portapapeles');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-[#0b0517] border-l border-purple-950/70 shadow-[0_0_50px_rgba(147,51,234,0.15)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 px-5 border-b border-purple-950/60 flex items-center justify-between shrink-0 bg-[#070210]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Bookmark size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-['Outfit'] tracking-wide">
                  Mensajes Guardados
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-600/40 text-purple-200 border border-purple-500/30 text-[10px] font-bold">
                  {pinnedMessages.length}
                </span>
              </div>
              <p className="text-[11px] text-purple-400/60">Tus favoritos y notas fijadas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        {pinnedMessages.length > 0 && (
          <div className="p-3 border-b border-purple-950/40 bg-[#080212]">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/50"
              />
              <input
                type="text"
                placeholder="Buscar en guardados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#120722] border border-purple-900/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-purple-400/40 focus:outline-hidden focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Message List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center text-slate-500 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-950/30 border border-purple-900/30 flex items-center justify-center text-purple-400/50">
                <Bookmark size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-300">
                  {searchTerm ? 'Sin coincidencias' : 'No hay mensajes guardados'}
                </p>
                <p className="text-xs text-slate-500 max-w-[230px] mt-1">
                  {searchTerm
                    ? 'Prueba con otro término de búsqueda.'
                    : 'Pasa el cursor sobre cualquier mensaje en el chat y pulsa "Fijar" para guardarlo en tus favoritos.'}
                </p>
              </div>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/25 hover:border-purple-500/50 transition-all space-y-2 group shadow-sm shadow-purple-950/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={msg.author.avatar}
                      alt={msg.author.displayName}
                      className="w-6 h-6 rounded-full object-cover border border-purple-500/30"
                    />
                    <span className="text-xs font-bold text-slate-200">
                      {msg.author.displayName}
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-400/50 font-mono">{msg.timestamp}</span>
                </div>

                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>

                <div className="pt-2 border-t border-purple-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        togglePinMessage(msg.id);
                        toast.info('Mensaje quitado de favoritos');
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Quitar</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(msg.content)}
                      className="text-[11px] text-slate-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>Copiar</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      toast.success(`Saltando al mensaje en #${activeChannel.name}...`);
                    }}
                    className="text-[11px] text-purple-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ir al mensaje</span>
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
