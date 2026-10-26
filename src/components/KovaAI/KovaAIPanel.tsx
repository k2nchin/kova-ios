import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, RefreshCw, Copy, Check } from 'lucide-react';
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
    { label: '💡 Ideas para el espacio', prompt: 'Dame ideas para animar la conversación en este espacio' },
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
        className="w-full max-w-2xl h-[620px] rounded-3xl bg-[#0d071c] border border-purple-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(147,51,234,0.15)] flex flex-col overflow-hidden glow-purple animate-in zoom-in-95 duration-150 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div className="h-14 px-6 border-b border-purple-950/40 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#0d071c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>Kova IA</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Oficial
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Asistente oficial inteligente</p>
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
        <div className="px-6 py-2 border-t border-purple-950/40 bg-[#080312] flex items-center gap-2 overflow-x-auto">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => askKovaAI(q.prompt)}
              className="px-3 py-1 rounded-full bg-purple-950/40 hover:bg-purple-600/30 text-purple-200 hover:text-white border border-purple-900/40 text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* 4. Prompt Input Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-[#06020e] border-t border-purple-950/40">
          <div className="flex items-center gap-2 bg-[#0d071c] border border-purple-500/30 focus-within:border-purple-500/70 rounded-2xl px-4 py-2.5 shadow-lg transition-colors">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Haz una pregunta a Kova AI o pide una acción..."
              className="flex-1 bg-transparent text-xs text-purple-100 placeholder-purple-400/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isAILoading}
              className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-40 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
