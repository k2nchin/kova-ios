import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, Zap, Code, RefreshCw, Copy, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const KovaAIPanel: React.FC = () => {
  const { isKovaAIOpen, setIsKovaAIOpen, aiHistory, askKovaAI, isAILoading, activeChannel } = useApp();
  const [prompt, setPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isKovaAIOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isAILoading) return;
    askKovaAI(prompt);
    setPrompt('');
  };

  const quickPrompts = [
    { label: '✨ Resumir canal actual', prompt: `Resume los puntos más relevantes del canal #${activeChannel.name}` },
    { label: '🦀 Ejemplo Tauri v2 Rust', prompt: 'Escribe un comando tauri en Rust para medir latencia de audio WebRTC' },
    { label: '💡 Ideas de monetización ética', prompt: '¿Cómo puede Kova ser rentable sin vender datos ni saturar de publicidad?' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl h-[620px] rounded-3xl bg-[#11131c] border border-purple-500/30 shadow-2xl flex flex-col overflow-hidden glow-purple animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div className="h-14 px-6 border-b border-white/[0.08] bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#11131c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>Kova AI Assistant</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Gemini & Rust Core
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Inteligencia contextual integrada en tiempo real</p>
            </div>
          </div>

          <button
            onClick={() => setIsKovaAIOpen(false)}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Chat Conversation History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {aiHistory.map((item) => {
            const isAI = item.sender === 'ai';
            return (
              <div
                key={item.id}
                className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-300">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed ${
                    isAI
                      ? 'bg-[#181b26] border border-white/[0.08] text-slate-200'
                      : 'bg-purple-600 text-white shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap selection:bg-purple-500/40">{item.text}</div>
                  {isAI && (
                    <div className="flex justify-end pt-2 mt-2 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleCopy(item.text, item.id)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar texto</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isAILoading && (
            <div className="flex gap-3 items-center text-purple-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span className="animate-pulse font-mono text-[11px]">Kova AI está pensando...</span>
            </div>
          )}
        </div>

        {/* 3. Quick Suggestion Chips */}
        <div className="px-6 py-2 border-t border-white/[0.06] bg-[#0e1017] flex items-center gap-2 overflow-x-auto">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => askKovaAI(q.prompt)}
              className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-purple-600/20 text-slate-300 hover:text-purple-300 border border-white/[0.08] hover:border-purple-500/30 text-[11px] font-medium whitespace-nowrap transition-all"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* 4. Prompt Input Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-[#0c0d13] border-t border-white/[0.06]">
          <div className="flex items-center gap-2 bg-[#161822] border border-purple-500/30 focus-within:border-purple-500/70 rounded-2xl px-4 py-2.5 shadow-lg transition-colors">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Haz una pregunta a Kova AI o pide una acción..."
              className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isAILoading}
              className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-40 transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
