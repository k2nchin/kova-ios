import React, { useEffect, useState } from 'react';
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
  FileText,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Message } from '../../types';
import { useApp } from '../../context/AppContext';
import { VoiceMessagePlayer } from '../Audio/VoiceMessagePlayer';
import { Avatar } from '../Common/Avatar';

interface MessageItemProps {
  message: Message;
  onReply: (message: Message) => void;
  /** Continues a run of messages from the same author: no avatar or name row. */
  isGrouped?: boolean;
}

// "Hoy a las 11:24 p. m." -> "11:24 p. m."
const shortTime = (timestamp: string) => timestamp.replace(/^hoy a las\s*/i, '');

export const MessageItem: React.FC<MessageItemProps> = ({ message, onReply, isGrouped = false }) => {
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
    sendMessage,
  } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  useEffect(() => {
    setEditText(message.content);
  }, [message.content]);

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
      setExecutionOutput(
        'Ejecución local desactivada por seguridad. Configura un runner aislado en el backend para ejecutar código.'
      );
      setIsExecuting(false);
    }, 150);
  };

  const isBotMessage = message.author.tag === 'BOT' || message.aiGenerated || /kova\s*bot|kova\s*ia/i.test(message.author.displayName || '');
  // Automated replies always stay on the incoming side, even if a legacy
  // local message was persisted with the current user's id.
  const isAuthorMe = message.author.id === currentUser.id && !isBotMessage;

  // Derive author's server role color (Discord style)
  const authorInServer = activeServer?.members?.find((m) => m.id === message.author.id);
  const authorRoleIds = authorInServer?.roles || message.author.roles || (isAuthorMe ? ['role_owner_' + activeServer?.id] : []);
  const authorHighestRole = activeServer?.roles?.find(
    (r) => r.name !== '@everyone' && authorRoleIds.includes(r.id)
  );
  // Only real role colors tint names; everyone else reads in chrome.
  const authorColor = authorHighestRole?.color;
  const isOwner = message.author.id === activeServer?.ownerId;

  return (
    <div
      className={`kova-message-item ${isAuthorMe ? 'kova-message-mine' : ''} ${isBotMessage ? 'kova-message-bot' : ''} ${isGrouped ? 'is-grouped' : 'is-first-of-group'} group relative flex gap-4 px-4 py-2 transition-colors ${
        message.pinned ? 'bg-white/[0.03] border-l-2 border-[#c2c4c8]' : ''
      }`}
    >
      {/* 1. Author Avatar (or the time, when continuing a group) */}
      <div className="relative shrink-0 mt-0.5">
        {isGrouped ? (
          <span className="kova-message-gutter-time">{shortTime(message.timestamp)}</span>
        ) : (
          <Avatar
            src={message.author.avatar}
            name={message.author.displayName || message.author.username}
            size={40}
            className="kova-message-avatar"
            onClick={() => openUserProfile(message.author)}
          />
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
        {!isGrouped && (
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className="font-semibold text-sm hover:underline cursor-pointer flex items-center gap-1"
            style={{ color: authorColor || '#f2f3f5' }}
            onClick={() => openUserProfile(message.author)}
          >
            {message.author.displayName}
            {isOwner && (
              <span className="text-[10px] font-medium text-[#797b7e] border border-white/10 rounded-full px-1.5 py-px" title="Creador del espacio">Creador</span>
            )}
          </span>

          {/* Discord Standard BOT Tag */}
          {message.author.tag === 'BOT' && (
            <span className="px-1.5 py-px rounded-full bg-[#c2c4c8] text-[#0a0a0b] text-[10px] font-bold">
              Bot
            </span>
          )}

          <span className="text-[11px] text-[#797b7e] font-normal ml-0.5">{shortTime(message.timestamp)}</span>

          {message.pinned && (
            <span className="flex items-center gap-1 text-[10px] text-[#7c3aed] bg-[#7c3aed]/10 px-1.5 py-0.2 rounded">
              <Pin className="w-2.5 h-2.5" /> Fijado
            </span>
          )}
        </div>
        )}

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
          message.content && !message.botCard && (
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

        {message.botCard && (
          <section className={`kova-bot-card kova-bot-card-${message.botCard.tone || 'neutral'}`}>
            <div className="kova-bot-card-glow" />
            <div className="relative">
              <div className="kova-bot-eyebrow"><Sparkles size={12} /> {message.botCard.eyebrow}</div>
              <h4>{message.botCard.title}</h4>
              {message.botCard.description && <div className="kova-bot-description whitespace-pre-wrap">{message.botCard.description}</div>}
              {!!message.botCard.facts?.length && <div className="kova-bot-facts">{message.botCard.facts.map((fact) => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div>}
              {!!message.botCard.suggestions?.length && <div className="kova-bot-suggestions">{message.botCard.suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)}>{suggestion}</button>)}</div>}
              {message.botCard.footer && <p className="kova-bot-footer">{message.botCard.footer}</p>}
            </div>
          </section>
        )}

        {/* Interactive Action Card if present (e.g. Ver reglas) */}
        {message.actionCard && (
          <div className="mt-2.5">
            <button
              onClick={() => {
                toast.info('📜 Reglas de KOVA Suite: 1. Respeto mutuo 2. No spam 3. Código limpio y de calidad');
              }}
              className="flex items-center justify-between w-64 max-w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-purple-500/30 text-xs text-slate-200 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={15} className="text-purple-400" />
                <span className="font-semibold">{message.actionCard.title}</span>
              </div>
              <ChevronRight size={14} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
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

        {/* File attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) => {
              if (att.type === 'image' && att.url) {
                return (
                  <a key={att.id} href={att.url} target="_blank" rel="noreferrer" title={att.name} className="block rounded-xl overflow-hidden border border-white/10 hover:border-white/25 transition-colors">
                    <img src={att.url} alt={att.name} loading="lazy" className="max-w-[280px] max-h-[200px] object-cover" />
                  </a>
                );
              }
              if (att.type === 'video' && att.url) {
                return (
                  <video key={att.id} src={att.url} controls preload="metadata" className="max-w-[280px] rounded-xl border border-white/10" />
                );
              }
              if (att.type === 'audio' && att.url) {
                return (
                  <audio key={att.id} src={att.url} controls preload="metadata" className="w-[260px] h-10 rounded-lg" />
                );
              }
              return (
                <div key={att.id} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#0d1016] px-3.5 py-2.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-400/25 flex items-center justify-center text-purple-300">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 max-w-[200px]">
                    <p className="truncate text-xs font-semibold text-[#f2f3f5]">{att.name}</p>
                    <p className="text-[10px] text-slate-400">{att.size}</p>
                  </div>
                  {att.url && (
                    <a href={att.url} download={att.name} className="ml-1 p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors" title="Descargar">
                      <Copy size={13} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
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

        {/* Reactions List + Responder Button */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {message.reactions.map((rx) => {
            const hasReacted = rx.users.includes(currentUser.id);
            return (
              <button
                key={rx.emoji}
                onClick={() => addReaction(message.id, rx.emoji)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all border cursor-pointer ${
                  hasReacted
                    ? 'bg-purple-900/40 text-purple-200 border-purple-500/50 shadow-sm shadow-purple-900/30'
                    : 'bg-purple-950/20 text-purple-300/80 border-purple-900/30 hover:bg-purple-900/30'
                }`}
              >
                <span>{rx.emoji}</span>
                <span className="font-mono text-[10px] font-bold">{rx.count}</span>
              </button>
            );
          })}

        </div>

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
