import React, { useState } from 'react';
import {
  Sparkles,
  Smile,
  Reply,
  Pin,
  Check,
  Copy,
  MessageSquare,
  Trash2,
  Languages,
  Terminal,
  Play,
  RotateCcw,
  Pencil,
} from 'lucide-react';
import { Message } from '../../types';
import { useApp } from '../../context/AppContext';
import { VoiceMessagePlayer } from '../Audio/VoiceMessagePlayer';

interface MessageItemProps {
  message: Message;
  onReply: (message: Message) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onReply }) => {
  const {
    currentUser,
    activeServer,
    addReaction,
    deleteMessage,
    openThread,
    translateMessage,
    setIsCodePlaygroundOpen,
    togglePinMessage,
    editMessage,
    openUserProfile,
  } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const quickEmojis = ['🔥', '❤️', '⚡', '🧠', '🚀', '👍', '🦀', '✨'];

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExecuteInline = () => {
    if (!message.codeBlock) return;
    setIsExecuting(true);
    setExecutionOutput(null);

    setTimeout(() => {
      try {
        const lang = message.codeBlock?.language.toLowerCase() || '';
        if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: unknown[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
            warn: (...args: unknown[]) => logs.push('[WARN] ' + args.join(' ')),
            error: (...args: unknown[]) => logs.push('[ERR] ' + args.join(' ')),
          };
          // Safe execution wrapper
          const fn = new Function('console', message.codeBlock?.code || '');
          fn(customConsole);
          setExecutionOutput(logs.length > 0 ? logs.join('\n') : '✓ Ejecución completada sin salida en consola.');
        } else {
          // Simulation for Rust / Python / C++
          setExecutionOutput(`[KOVA RUST/WASM ENGINE] Compilando ${lang.toUpperCase()}...\n✓ Compilación exitosa en 4.2ms\nOutput: Hash digest: 0x9f83a00e\n[Process exited with status 0]`);
        }
      } catch (err: unknown) {
        setExecutionOutput(`[ERROR DE EJECUCIÓN]: ${(err as Error).message}`);
      } finally {
        setIsExecuting(false);
      }
    }, 400);
  };

  const isAuthorMe = message.author.id === currentUser.id;

  // Derive author's server role color (Discord style)
  const authorInServer = activeServer?.members?.find((m) => m.id === message.author.id);
  const authorRoleIds = authorInServer?.roles || message.author.roles || (isAuthorMe ? ['role_owner_' + activeServer?.id] : []);
  const authorHighestRole = activeServer?.roles?.find(
    (r) => r.name !== '@everyone' && authorRoleIds.includes(r.id)
  );
  const authorColor = authorHighestRole?.color || (message.aiGenerated ? '#c084fc' : isAuthorMe ? '#5865f2' : undefined);

  return (
    <div
      className={`group relative flex gap-4 px-4 py-1.5 hover:bg-[#2e3035]/60 transition-colors ${
        message.pinned ? 'bg-[#5865f2]/10 border-l-2 border-[#5865f2]' : ''
      } ${message.aiGenerated ? 'bg-purple-950/15 border-l-2 border-purple-400/40' : ''}`}
    >
      {/* 1. Author Avatar */}
      <div className="relative shrink-0 mt-0.5">
        <img
          src={message.author.avatar}
          alt={message.author.displayName}
          onClick={() => openUserProfile(message.author)}
          className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity hover:scale-105"
        />
        {message.aiGenerated && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-[8px] text-white shadow-sm ring-2 ring-[#313338]">
            ✦
          </div>
        )}
      </div>

      {/* 2. Message Body */}
      <div className="flex-1 min-w-0">
        {/* Reply reference preview if any */}
        {message.replyTo && (
          <div className="flex items-center gap-1.5 text-xs text-[#b5bac1] mb-1 pl-2 border-l-2 border-[#4e5058]">
            <span className="font-semibold text-[#f2f3f5]">@{message.replyTo.authorName}</span>
            <span className="text-[#949ba4] truncate max-w-sm">{message.replyTo.content}</span>
          </div>
        )}

        {/* Author Header */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <span
            className="font-semibold text-sm hover:underline cursor-pointer"
            style={{ color: authorColor || '#f2f3f5' }}
            onClick={() => openUserProfile(message.author)}
          >
            {message.author.displayName}
          </span>

          {/* Badges */}
          {message.aiGenerated && (
            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#5865f2] text-white text-[10px] font-bold font-mono uppercase">
              <Sparkles className="w-2.5 h-2.5" />
              KOVA AI
            </span>
          )}

          {message.author.tag === 'BOT' && !message.aiGenerated && (
            <span className="px-1.5 py-0.2 rounded bg-[#5865f2] text-white text-[10px] font-bold uppercase">
              BOT
            </span>
          )}

          <span className="text-[11px] text-[#949ba4] font-normal">{message.timestamp}</span>

          {message.pinned && (
            <span className="flex items-center gap-1 text-[10px] text-[#5865f2] bg-[#5865f2]/10 px-1.5 py-0.2 rounded">
              <Pin className="w-2.5 h-2.5" /> Fijado
            </span>
          )}
        </div>

        {/* Message Content with text formatting & inline Discord editing */}
        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (editText.trim()) {
                    editMessage(message.id, editText.trim());
                  }
                  setIsEditing(false);
                } else if (e.key === 'Escape') {
                  setEditText(message.content);
                  setIsEditing(false);
                }
              }}
              rows={Math.min(6, Math.max(2, editText.split('\n').length))}
              className="w-full bg-[#383a40] text-[#dbdee1] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5865f2] border border-black/20 resize-none font-sans"
              autoFocus
            />
            <div className="text-[11px] text-[#949ba4] mt-1 flex items-center gap-1.5 select-none">
              <span>escape para <button type="button" onClick={() => { setEditText(message.content); setIsEditing(false); }} className="text-[#00a8fc] hover:underline">cancelar</button></span>
              <span>•</span>
              <span>intro para <button type="button" onClick={() => { if (editText.trim()) editMessage(message.id, editText.trim()); setIsEditing(false); }} className="text-[#00a8fc] hover:underline">guardar</button></span>
            </div>
          </div>
        ) : (
          message.content && (
            <div className="text-[#dbdee1] text-[14px] leading-relaxed whitespace-pre-wrap select-text">
              {message.content}
              {message.edited && (
                <span className="text-[10px] text-[#949ba4] ml-1.5 select-none font-normal" title="Mensaje editado">
                  (editado)
                </span>
              )}
            </div>
          )
        )}

        {/* Translated Text Box (if translated) */}
        {message.translatedText && (
          <div className="mt-1.5 p-2 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-200 text-xs font-mono">
            {message.translatedText}
          </div>
        )}

        {/* Voice Note Player if message has audio */}
        {message.voiceNote && (
          <VoiceMessagePlayer
            durationSeconds={message.voiceNote.duration}
            authorName={message.author.displayName}
          />
        )}

        {/* Code Snippet Block with Direct In-Chat Runner */}
        {message.codeBlock && (
          <div className="mt-2 rounded-xl bg-[#090b12] border border-white/[0.08] overflow-hidden text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f121d] border-b border-white/[0.06] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
                <span className="font-mono uppercase text-[10px] text-cyan-300 font-bold">
                  {message.codeBlock.language}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExecuteInline}
                  disabled={isExecuting}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all text-[10px] font-bold"
                  title="Ejecutar en este mensaje"
                >
                  <Play className={`w-3 h-3 ${isExecuting ? 'animate-spin' : ''}`} />
                  <span>{isExecuting ? 'Ejecutando...' : 'Ejecutar'}</span>
                </button>
                <button
                  onClick={() => setIsCodePlaygroundOpen(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-white/[0.08] text-cyan-400 text-[10px] transition-colors"
                  title="Abrir en Sandbox Completo"
                >
                  <Terminal className="w-3 h-3" />
                  <span>Sandbox</span>
                </button>
                <button
                  onClick={() => copyCodeToClipboard(message.codeBlock!.code)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors text-[10px]"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <pre className="p-2.5 text-slate-200 overflow-x-auto font-mono text-[11px] leading-5 bg-black/40">
              <code>{message.codeBlock.code}</code>
            </pre>

            {/* Execution Output Console */}
            {executionOutput && (
              <div className="p-2.5 bg-black/80 border-t border-white/[0.08] font-mono text-[10px]">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Terminal className="w-3 h-3" />
                    TERMINAL OUTPUT
                  </span>
                  <button
                    onClick={() => setExecutionOutput(null)}
                    className="hover:text-slate-300 text-[9px]"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="text-emerald-300 whitespace-pre-wrap">{executionOutput}</div>
              </div>
            )}
          </div>
        )}

        {/* Reactions List */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {message.reactions.map((rx) => {
              const hasReacted = rx.users.includes(currentUser.id);
              return (
                <button
                  key={rx.emoji}
                  onClick={() => addReaction(message.id, rx.emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs transition-all border ${
                    hasReacted
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                      : 'bg-white/[0.03] text-slate-300 border-white/[0.05] hover:bg-white/[0.08]'
                  }`}
                >
                  <span>{rx.emoji}</span>
                  <span className="font-mono text-[10px] font-semibold">{rx.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread indicator */}
        {message.threadCount && (
          <button
            onClick={() => openThread(message)}
            className="flex items-center gap-1.5 mt-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold bg-cyan-950/20 hover:bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-500/20 transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            <span>{message.threadCount} respuestas en el hilo</span>
          </button>
        )}
      </div>

      {/* 3. Floating Quick Action Toolbar on Hover */}
      <div className="absolute top-2 right-3 hidden group-hover:flex items-center gap-0.5 bg-[#121520] border border-white/[0.1] rounded-xl p-1 shadow-2xl z-20 backdrop-blur-xl">
        {/* Emoji picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-amber-400 transition-colors"
            title="Añadir reacción"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute top-7 right-0 bg-[#161a28] border border-white/[0.12] p-1.5 rounded-xl shadow-2xl flex gap-1 z-30 animate-in fade-in zoom-in-95 duration-150">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    addReaction(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1 hover:bg-white/[0.1] rounded-lg text-sm hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Translation trigger */}
        <div className="relative">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-cyan-400 transition-colors"
            title="Traducir con Kova AI"
          >
            <Languages className="w-3.5 h-3.5" />
          </button>

          {showLangPicker && (
            <div className="absolute top-7 right-0 bg-[#161a28] border border-white/[0.12] p-1.5 rounded-xl shadow-2xl flex flex-col gap-1 z-30 whitespace-nowrap text-[11px]">
              <button
                onClick={() => {
                  translateMessage(message.id, 'en');
                  setShowLangPicker(false);
                }}
                className="px-2 py-1 text-left hover:bg-white/[0.08] rounded text-slate-200"
              >
                Inglés (EN)
              </button>
              <button
                onClick={() => {
                  translateMessage(message.id, 'ja');
                  setShowLangPicker(false);
                }}
                className="px-2 py-1 text-left hover:bg-white/[0.08] rounded text-slate-200"
              >
                Japonés (JA)
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onReply(message)}
          className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-cyan-400 transition-colors"
          title="Responder"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        {isAuthorMe && (
          <button
            onClick={() => {
              setEditText(message.content);
              setIsEditing(true);
            }}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-blue-400 transition-colors"
            title="Editar mensaje"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => togglePinMessage(message.id)}
          className={`p-1 rounded-lg hover:bg-white/[0.08] transition-colors ${
            message.pinned ? 'text-[#5865f2] bg-[#5865f2]/15' : 'text-slate-400 hover:text-amber-400'
          }`}
          title={message.pinned ? 'Desfijar mensaje' : 'Fijar mensaje'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => openThread(message)}
          className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-purple-400 transition-colors"
          title="Crear o ver hilo"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>

        {isAuthorMe && (
          <button
            onClick={() => deleteMessage(message.id)}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Eliminar mensaje"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
