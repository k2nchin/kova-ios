import React, { useState } from 'react';
import { X, Send, MessageSquare, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MessageItem } from './MessageItem';

export const ThreadDrawer: React.FC = () => {
  const { activeThread, closeThread, sendThreadMessage } = useApp();
  const [inputContent, setInputContent] = useState('');

  if (!activeThread) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;
    sendThreadMessage(inputContent);
    setInputContent('');
  };

  return (
    <div className="w-80 h-full bg-[#11131a] border-l border-white/[0.08] flex flex-col z-30 shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-12 px-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs text-slate-100 truncate">
            {activeThread.title}
          </span>
        </div>
        <button
          onClick={closeThread}
          className="p-1 rounded-md hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeThread.messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} onReply={() => {}} />
        ))}
      </div>

      {/* Thread Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Responder en el hilo..."
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputContent.trim()}
            className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-colors disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
