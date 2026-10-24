import React, { useEffect, useRef, useState } from 'react';
import { X, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface VoiceChatPanelProps {
  channelName: string;
  onClose: () => void;
}

/** Right-side 360px chat for the voice room. Reuses the exact same chat
 *  contract as the rest of the app (sendMessage / messages from context). */
export const VoiceChatPanel: React.FC<VoiceChatPanelProps> = ({ channelName, onClose }) => {
  const { messages, sendMessage } = useApp();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft.trim());
    setDraft('');
  };

  return (
    <aside
      role="complementary"
      aria-label={`Chat de ${channelName}`}
      className="voice-chat-panel absolute right-0 top-0 z-30 flex h-full w-[min(360px,calc(100vw-24px))] flex-col border-l border-white/[0.07] bg-[#0e0f12]/95 backdrop-blur-[16px] select-none"
    >
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
        <div>
          <p className="text-[13px] font-semibold text-[#f5f7fa]">Chat de la sala</p>
          <p className="truncate text-[11px] text-[#646a76]">{channelName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar chat"
          className="rounded-xl p-2 text-[#646a76] transition hover:bg-white/[0.06] hover:text-[#f5f7fa]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-xs font-semibold text-[#9a9faa]">Sin mensajes aún</p>
            <p className="max-w-[240px] text-[11px] leading-4 text-[#646a76]">
              Comparte enlaces o notas mientras hablan en la sala.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-1">
              <div className="flex items-center gap-2">
                {message.author.avatar ? (
                  <img src={message.author.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.06] text-[9px] font-bold text-[#9a9faa]">
                    {message.author.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-[11px] font-semibold text-[#f5f7fa]">{message.author.displayName}</span>
                <span className="text-[10px] text-[#646a76]">{message.timestamp}</span>
              </div>
              <p className="break-words rounded-2xl rounded-tl-md border border-white/[0.05] bg-white/[0.03] px-3.5 py-2 text-[12px] leading-5 text-[#c6cad2]">
                {message.content}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/[0.07] p-4">
        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-black/30 px-4 py-2.5 transition focus-within:border-[#21ddb2]/40">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Mensaje en ${channelName}…`}
            aria-label={`Mensaje en ${channelName}`}
            className="w-full bg-transparent text-xs text-[#f5f7fa] outline-none placeholder:text-[#646a76]"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Enviar mensaje"
            className="shrink-0 rounded-xl p-1.5 text-[#21ddb2] transition hover:bg-[#21ddb2]/10 disabled:opacity-30"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </aside>
  );
};
