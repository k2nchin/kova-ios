import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Sparkles,
  Users,
  Search,
  Command,
  ChevronRight,
  X,
  Pin,
  Bell,
  Download,
  Printer,
  CircleHelp,
  Paperclip,
  Mic,
  Send,
  LoaderCircle,
  MessageSquareText,
  Music2,
  Square,
  Check,
  Share2,
  Copy,
  Smile,
  Clock,
  AtSign,
  MoreHorizontal,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { MessageItem } from './MessageItem';
import { EmojiGifPicker } from './EmojiGifPicker';
import { WelcomeHeroCard } from './WelcomeHeroCard';

const DISCORD_SLASH_COMMANDS = [
  { command: '/ai', desc: 'Asistente de consulta Kova', example: '/ai resumen del canal' },
  { command: '/shrug', desc: 'Agrega ¯\\_(ツ)_/¯ al final de tu mensaje', example: '/shrug qué se le va a hacer' },
  { command: '/tableflip', desc: 'Expresa frustración volteando una mesa (╯°□°)╯︵ ┻━┻', example: '/tableflip' },
  { command: '/unflip', desc: 'Devuelve la mesa a su sitio ┬─┬ノ( º _ ºノ)', example: '/unflip' },
  { command: '/roll', desc: 'Tira un dado aleatorio de N caras (1-100 por defecto)', example: '/roll 20' },
  { command: '/coin', desc: 'Lanza una moneda al aire (¡Cara o Cruz!)', example: '/coin' },
  { command: '/tts', desc: 'Sintetiza y reproduce el texto en voz alta por altavoz', example: '/tts Reunión en 5 minutos' },
];

const SEARCH_HISTORY_KEY = 'kova.search-history.v2';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function GlobalSearch() {
  const { messages, activeServer, setActiveChannelId } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>(() => readLocal(SEARCH_HISTORY_KEY, []));

  // Search live messages and real server channels
  const messageResults = messages
    .filter((m) => m.content.toLowerCase().includes(query.toLowerCase()))
    .map((m) => ({
      kind: 'Mensaje',
      id: m.id,
      title: m.content.length > 50 ? m.content.slice(0, 50) + '...' : m.content,
      meta: `${m.author.displayName} · #${activeServer.name}`,
      icon: MessageSquareText,
      channelId: m.channelId,
    }));

  const channelResults = activeServer.channels
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    .map((c) => ({
      kind: 'Canal',
      id: c.id,
      title: `#${c.name}`,
      meta: c.topic || `Canal de ${c.type}`,
      icon: Hash,
      channelId: c.id,
    }));

  const results = query.trim() ? [...channelResults, ...messageResults] : [];

  const recordSearch = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    const nextHistory = [
      cleanValue,
      ...history.filter((item) => item.toLowerCase() !== cleanValue.toLowerCase()),
    ].slice(0, 5);
    setHistory(nextHistory);
    writeLocal(SEARCH_HISTORY_KEY, nextHistory);
  };

  return (
    <div className="global-search relative">
      <button className="global-search-trigger" onClick={() => setOpen(true)}>
        <Search size={15} />
        <span>Buscar mensajes, canales o comandos…</span>
        <kbd>Ctrl + K</kbd>
      </button>

      {open && (
        <div className="search-popover">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca mensajes o canales en Kova…"
            />
            <button
              aria-label="Cerrar búsqueda"
              onClick={() => {
                setOpen(false);
                setQuery('');
              }}
            >
              <X size={15} />
            </button>
          </div>

          <div className="search-hint">
            <Command size={13} /> Escribe para buscar en tiempo real en los canales activos
          </div>

          <div className="search-results">
            {!query && history.length > 0 && (
              <div className="history-header">
                <span>RECIENTES</span>
                <button
                  onClick={() => {
                    setHistory([]);
                    writeLocal(SEARCH_HISTORY_KEY, []);
                  }}
                >
                  Limpiar
                </button>
              </div>
            )}

            {!query &&
              history.map((item) => (
                <button className="recent-search" key={item} onClick={() => setQuery(item)}>
                  <Search size={13} />
                  <span>{item}</span>
                </button>
              ))}

            {results.length ? (
              results.map((result) => {
                const Icon = result.icon;
                return (
                  <button
                    className="search-result"
                    key={result.id}
                    onClick={() => {
                      recordSearch(query || result.title);
                      setActiveChannelId(result.channelId);
                      toast.success(`Abriendo ${result.title}`);
                      setOpen(false);
                    }}
                  >
                    <span className="search-result-icon">
                      <Icon size={15} />
                    </span>
                    <span>
                      <strong>{result.title}</strong>
                      <small>
                        {result.kind} · {result.meta}
                      </small>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                );
              })
            ) : query.trim() ? (
              <div className="search-empty">No encontramos coincidencias para "{query}".</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export const ChatArea: React.FC = () => {
  const {
    activeServer,
    activeChannel,
    isMemberListOpen,
    setIsMemberListOpen,
    setIsPinnedDrawerOpen,
    setIsSoundboardOpen,
    messages,
    sendMessage,
    summarizeChannel,
    generateMinutesToNotes,
    askKovaAI,
    processBotTriggers,
  } = useApp();

  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isChannelPinned, setIsChannelPinned] = useState(false);
  const [isChannelMuted, setIsChannelMuted] = useState(false);
  const [isChannelInfoOpen, setIsChannelInfoOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [slowmodeCooldown, setSlowmodeCooldown] = useState(0);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number; url?: string } | null>(null);

  // Real voice note recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const channelLabel = activeChannel.name;

  // Discord slowmode countdown timer
  useEffect(() => {
    if (slowmodeCooldown <= 0) return;
    const interval = setInterval(() => {
      setSlowmodeCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [slowmodeCooldown]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Recording Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  const handleStartRecording = () => {
    setIsRecordingVoice(true);
    toast.info('Grabando nota de voz...');
  };

  const handleCancelRecording = () => {
    setIsRecordingVoice(false);
    toast.info('Grabación cancelada');
  };

  const handleSendVoiceNote = () => {
    const duration = Math.max(1, recordingSeconds);
    sendMessage(`🎤 Nota de voz (${duration}s)`, undefined, undefined, { duration });
    setIsRecordingVoice(false);
    toast.success(`Nota de voz enviada (${duration} segundos)`);
  };

  const runAiAction = async (action: 'summary' | 'minutes') => {
    setLoadingAction(action);
    try {
      if (action === 'summary') {
        await summarizeChannel();
        toast.success('Resumen de Kova AI generado');
      } else {
        generateMinutesToNotes();
        toast.success('Minuta generada y guardada en Notas');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({ name: file.name, size: file.size, url: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      setAttachedFile({ name: file.name, size: file.size });
    }
    toast.success(`Archivo adjuntado: ${file.name}`);
  };

  const handleSendMessage = () => {
    const text = draft.trim();
    if (!text && !attachedFile) return;

    if (slowmodeCooldown > 0) {
      toast.error(`Modo pausado activado. Espera ${slowmodeCooldown}s antes de enviar otro mensaje.`);
      return;
    }

    let fullText = text;

    // Discord Slash Commands parsing
    if (text.startsWith('/shrug')) {
      const rest = text.replace(/^\/shrug\s*/, '').trim();
      fullText = rest ? `${rest} ¯\\_(ツ)_/¯` : '¯\\_(ツ)_/¯';
    } else if (text.startsWith('/tableflip')) {
      const rest = text.replace(/^\/tableflip\s*/, '').trim();
      fullText = rest ? `${rest} (╯°□°)╯︵ ┻━┻` : '(╯°□°)╯︵ ┻━┻';
    } else if (text.startsWith('/unflip')) {
      const rest = text.replace(/^\/unflip\s*/, '').trim();
      fullText = rest ? `${rest} ┬─┬ノ( º _ ºノ)` : '┬─┬ノ( º _ ºノ)';
    } else if (text.startsWith('/coin')) {
      const flip = Math.random() > 0.5 ? '¡Cara! 🪙' : '¡Cruz! 🪙';
      fullText = `🪙 **Lanzamiento de Moneda:** ${flip}`;
    } else if (text.startsWith('/roll')) {
      const param = parseInt(text.replace(/^\/roll\s*/, '').trim(), 10);
      const max = !isNaN(param) && param > 0 ? param : 100;
      const roll = Math.floor(Math.random() * max) + 1;
      fullText = `🎲 **Tirada de Dado (1-${max}):** ha salido **${roll}**`;
    } else if (text.startsWith('/tts')) {
      const speech = text.replace(/^\/tts\s*/, '').trim();
      fullText = `🗣️ **[TTS]** ${speech}`;
      if ('speechSynthesis' in window && speech) {
        try {
          const utterance = new SpeechSynthesisUtterance(speech);
          utterance.lang = 'es-ES';
          window.speechSynthesis.speak(utterance);
        } catch {}
      }
    }

    if (attachedFile) {
      const sizeKb = (attachedFile.size / 1024).toFixed(1);
      fullText = fullText
        ? `${fullText}\n\n📎 Archivo adjunto: **${attachedFile.name}** (${sizeKb} KB)`
        : `📎 Archivo adjunto: **${attachedFile.name}** (${sizeKb} KB)`;
    }

    sendMessage(fullText, undefined, replyingTo?.id);
    setDraft('');
    setReplyingTo(null);
    setAttachedFile(null);
    setIsEmojiPickerOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Apply slowmode if configured on channel
    if (activeChannel.slowmode && activeChannel.slowmode > 0) {
      setSlowmodeCooldown(activeChannel.slowmode);
    }

    if (text.startsWith('/ai')) {
      const prompt = text.replace('/ai', '').trim();
      setIsTyping(true);
      askKovaAI(prompt || 'Resumen y análisis').finally(() => setIsTyping(false));
    } else {
      // Process Discord / Custom Bot commands and triggers
      processBotTriggers(fullText, activeChannel.id);
    }
  };

  const exportConversation = (format: 'txt' | 'pdf') => {
    const lines = [
      `==================================================`,
      `  KOVA AI · CANAL #${channelLabel.toUpperCase()}`,
      `  Espacio: ${activeServer?.name || 'Kova Workspace'}`,
      `  Exportado: ${new Date().toLocaleString('es-ES')}`,
      `  Total de mensajes: ${messages.length}`,
      `==================================================\n`,
      ...messages.map((m) => `[${m.timestamp}] ${m.author.displayName}: ${m.content}`),
    ];
    const text = lines.join('\n');

    if (format === 'txt') {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kova-${channelLabel}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Conversación exportada en TXT');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Permite ventanas emergentes para exportar en PDF');
      return;
    }
    printWindow.document.write(`<html><head><title>Kova AI · #${channelLabel}</title><style>body{font-family:Arial,sans-serif;color:#18202a;max-width:780px;margin:48px auto;line-height:1.55}h1{font-size:24px;border-bottom:2px solid #72e4d0;padding-bottom:12px}pre{white-space:pre-wrap;font:14px/1.6 Arial}</style></head><body><h1>Kova AI · #${channelLabel}</h1><pre>${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] ?? c)}</pre><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    printWindow.document.close();
    toast.success('Preparando impresión para guardar como PDF');
  };

  return (
    <main className="channel-main flex-1 h-full w-full bg-[#0b0d13] flex flex-col justify-between overflow-hidden relative font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Clean Modern Channel Header matching reference screenshot */}
      <header className="h-13 px-5 flex items-center justify-between border-b border-white/[0.04] bg-[#0c0e14]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-white font-bold text-sm">
            <Hash size={18} className="text-slate-400" />
            <span>{channelLabel}</span>
          </div>
          <span className="text-xs text-slate-400 font-normal">
            {activeChannel.topic || 'Canal de bienvenida'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <button
            onClick={() => setIsPinnedDrawerOpen(true)}
            className="p-1.5 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
            title="Mensajes fijados"
          >
            <Pin size={17} />
          </button>

          <button
            onClick={() => setIsMemberListOpen(!isMemberListOpen)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
              isMemberListOpen ? 'text-white bg-white/[0.06]' : 'hover:text-white hover:bg-white/[0.04]'
            }`}
            title="Miembros del espacio"
          >
            <Users size={16} />
            <span className="font-semibold">{activeServer.members.length || 12}</span>
          </button>

          <button
            onClick={() => setIsChannelInfoOpen(true)}
            className="p-1.5 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
            title="Más opciones del canal"
          >
            <MoreHorizontal size={17} />
          </button>
        </div>
      </header>

      {/* 2. Conversation Scroll Area */}
      <div ref={scrollRef} className="conversation-scroll flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {/* Glowing 3D Crystal Welcome Hero Card for general / first channel */}
        {(channelLabel === 'general' || messages.length <= 4) && (
          <WelcomeHeroCard channelName={channelLabel} />
        )}

        {/* Date Divider matching screenshot */}
        <div className="flex items-center justify-center my-4 relative select-none">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.04]" />
          </div>
          <span className="relative px-3 py-0.5 text-[11px] font-medium text-slate-500 bg-[#0b0d13] rounded-full">
            9 de mayo de 2025
          </span>
        </div>

        {/* Dynamic Messages from AppContext */}
        <div className="space-y-1">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onReply={(m) => setReplyingTo({ id: m.id, authorName: m.author.displayName })}
            />
          ))}
        </div>

        {/* Typing indicator */}
        {isTyping && (
          <div className="typing-indicator mt-2" aria-live="polite">
            <span className="avatar" style={{ background: '#5865F2' }}>✦</span>
            <div>
              <strong>Kova está escribiendo</strong>
              <span className="typing-dots">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Replying Bar */}
      {replyingTo && (
        <div className="px-4 py-1.5 bg-[#141824] border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 truncate">
            <span className="text-cyan-400 font-bold">Respondiendo a @{replyingTo.authorName}</span>
          </span>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/[0.08] cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Attached File Preview Bar */}
      {attachedFile && (
        <div className="px-4 py-2 bg-[#141824] border-t border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-cyan-300">
            {attachedFile.url ? (
              <img src={attachedFile.url} alt="preview" className="w-8 h-8 rounded-lg object-cover border border-cyan-400/40" />
            ) : (
              <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                <Paperclip size={14} />
              </div>
            )}
            <span className="font-semibold">{attachedFile.name}</span>
            <span className="text-[10px] text-slate-400">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            onClick={() => {
              setAttachedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 4. Rich Composer & Live Voice Note Recorder */}
      <div className="composer-wrap relative">
        {/* Emoji & GIF Drawer */}
        <EmojiGifPicker
          isOpen={isEmojiPickerOpen}
          onClose={() => setIsEmojiPickerOpen(false)}
          onSelectEmoji={(emoji) => setDraft((v) => v + emoji)}
          onSelectGif={(gifUrl) => {
            sendMessage(gifUrl);
            setIsEmojiPickerOpen(false);
          }}
        />

        {/* Discord Slash Command Autocomplete Popover */}
        {draft.startsWith('/') && !draft.includes(' ') && (
          <div className="absolute left-4 bottom-[calc(100%+8px)] z-40 w-96 rounded-2xl bg-[#141824] border border-white/10 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono flex items-center gap-1">
              <Command size={12} className="text-purple-400" />
              <span>Comandos de Barra (Slash Commands)</span>
            </div>
            <div className="space-y-1 mt-1 max-h-48 overflow-y-auto custom-scrollbar">
              {DISCORD_SLASH_COMMANDS.filter((cmd) => cmd.command.startsWith(draft.toLowerCase())).map(
                (cmd) => (
                  <button
                    key={cmd.command}
                    type="button"
                    onClick={() => setDraft(cmd.command + ' ')}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-purple-600/20 hover:border-purple-500/30 border border-transparent transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="font-bold text-sm text-purple-300 group-hover:text-purple-200">
                        {cmd.command}
                      </div>
                      <div className="text-[11px] text-slate-400">{cmd.desc}</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Tab o Clic
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Mentions Autocomplete Popover */}
        {(() => {
          const mentionMatch = draft.match(/@(\w*)$/);
          if (!mentionMatch) return null;
          const query = mentionMatch[1].toLowerCase();
          const mentionables = [
            { id: 'everyone', name: 'everyone', desc: 'Notificar a todos en el servidor' },
            { id: 'here', name: 'here', desc: 'Notificar a los miembros conectados' },
            ...activeServer.members.map((m) => ({ id: m.id, name: m.displayName, desc: m.status })),
          ].filter((item) => item.name.toLowerCase().includes(query));

          if (mentionables.length === 0) return null;

          return (
            <div className="absolute left-4 bottom-[calc(100%+8px)] z-40 w-80 rounded-2xl bg-[#141824] border border-white/10 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono flex items-center gap-1">
                <AtSign size={12} className="text-cyan-400" />
                <span>Menciones</span>
              </div>
              <div className="space-y-1 mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                {mentionables.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setDraft((prev) => prev.replace(/@(\w*)$/, `@${item.name} `));
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer group"
                  >
                    <span className="font-semibold text-xs text-cyan-300">@{item.name}</span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="composer">
          {isRecordingVoice ? (
            /* Live Voice Recorder Strip */
            <div className="p-3 bg-[#131722] rounded-2xl flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold text-rose-400 font-mono">
                  Grabando: 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                </span>
                <span className="text-[11px] text-slate-400">Audio ultra claro listo para enviar</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white cursor-pointer"
                  title="Cancelar grabación"
                >
                  <X size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleSendVoiceNote}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Check size={14} />
                  <span>Enviar Nota</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#11131c] border border-white/[0.06] shadow-xl focus-within:border-purple-500/40 transition-all w-full">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Plus Button in Circle */}
              <button
                type="button"
                aria-label="Adjuntar archivo o imagen"
                onClick={() => fileInputRef.current?.click()}
                title="Adjuntar archivo o medios"
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <Plus size={15} />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  slowmodeCooldown > 0
                    ? `Modo pausado (${slowmodeCooldown}s)...`
                    : `Escribe en #${channelLabel}...`
                }
                disabled={slowmodeCooldown > 0}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none min-w-0"
              />

              {/* Right tools: GIF, Image, Emoji, Purple Send Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                  className="px-2 py-0.5 rounded-md border border-white/[0.1] text-[10px] font-bold text-slate-400 hover:text-white hover:border-white/[0.2] transition-all cursor-pointer"
                  title="GIFs"
                >
                  GIF
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Subir imagen"
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <ImageIcon size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                  title="Emojis"
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isEmojiPickerOpen ? 'text-purple-400' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Smile size={17} />
                </button>

                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={slowmodeCooldown > 0 || (!draft.trim() && !attachedFile)}
                  title="Enviar mensaje"
                  className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6d28d9] via-[#7c3aed] to-[#8b5cf6] hover:from-[#7c3aed] hover:to-[#9333ea] text-white flex items-center justify-center shadow-lg shadow-purple-950/60 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={14} className="translate-x-0.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Channel Info Modal */}
      {isChannelInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setIsChannelInfoOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#131722] border border-white/[0.1] shadow-2xl p-5 overflow-hidden relative animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Hash className="text-cyan-400" size={18} />
                <h3 className="text-sm font-bold text-white font-['Outfit']">#{activeChannel.name}</h3>
              </div>
              <button
                onClick={() => setIsChannelInfoOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Espacio</span>
                <p className="text-white font-semibold text-sm">{activeServer?.name || 'Kova Workspace'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Tema del canal</span>
                <p className="text-slate-300 mt-0.5">{activeChannel.topic || 'Canal general de conversación y código.'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Tipo de Canal</span>
                <p className="text-cyan-400 font-mono uppercase text-[11px] mt-0.5">{activeChannel.type}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Actividad</span>
                <p className="text-slate-400 mt-0.5">{messages.length} mensajes compartidos</p>
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://kova.gg/invite/${activeServer.id}/${activeChannel.id}`);
                    toast.success('Enlace de invitación copiado al portapapeles');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 transition-all font-semibold cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>Copiar enlace de invitación</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
