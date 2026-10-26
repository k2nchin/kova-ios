import React, { useState, useRef, useEffect } from 'react';
import { isVoiceLike } from '../../utils/channels';
import {
  Hash,
  Clock,
  Languages,
  BarChart3,
  Megaphone,
  Sparkles,
  Users,
  Search,
  Command,
  ChevronRight,
  X,
  Pin,
  Bell,
  CircleHelp,
  Paperclip,
  Mic,
  Send,
  MessageSquareText,
  Check,
  Share2,
  Smile,
  AtSign,
  MoreHorizontal,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { PollComposer } from './PollCard';
import { startVoiceNote, type VoiceNoteRecording } from '../../services/voiceNote';
import { FollowChannelModal } from '../Community/FollowChannelModal';
import { ChannelAccessPanel } from '../Settings/ChannelAccessPanel';
import { MessageSearch } from './MessageSearch';
import { CatchUpBar } from './CatchUpBar';
import { WhenPicker } from '../Common/WhenPicker';
import '../../styles/messageSearch.css';
import { MessageItem } from './MessageItem';
import { EmojiGifPicker } from './EmojiGifPicker';
import { Avatar } from '../Common/Avatar';
import { Attachment } from '../../types';
import { uploadFile } from '../../services/apiClient';

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 5;

const formatAttachmentSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

// Uploads the file to Kova storage so every member can open it, not just the sender.
const fileToAttachment = async (file: File, index: number): Promise<Attachment> => {
  const mediaMatch = /^(image|video|audio)\//.exec(file.type);
  return {
    id: `att_${Date.now()}_${index}`,
    name: file.name,
    size: formatAttachmentSize(file.size),
    url: await uploadFile(file, 'attachment'),
    type: (mediaMatch?.[1] as Attachment['type']) || 'file',
  };
};

const KOVA_QUICK_ACTIONS = [
  { command: '/roles', desc: 'Menú interactivo de selección de auto-roles', example: '/roles' },
  { command: '/bot', desc: 'Diagnóstico y estado de Kova Bot', example: '/bot' },
  { command: '/partida', desc: 'Convoca una escuadra para jugar (Apex, Overwatch, etc.)', example: '/partida apex' },
  { command: '/vip', desc: 'Ventajas del rango VIP Pass en la comunidad', example: '/vip' },
  { command: '/ticket', desc: 'Abre un ticket de soporte privado con administración', example: '/ticket' },
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
    openInviteModal,
    setIsSoundboardOpen,
    messages,
    sendMessage,
    summarizeChannel,
    generateMinutesToNotes,
    askKovaAI,
    processBotTriggers,
    typingUsers,
    setTyping,
    setIsCommandPaletteOpen,
    realtimeConnected,
    presenceByUser,
    currentUser,
    loadOlderMessages,
    scheduleMessage,
    autoTranslateChannels,
    toggleAutoTranslate,
  } = useApp();

  // People here now: you, plus members the realtime gateway reports online.
  const onlineMembers = [
    currentUser,
    ...(activeServer?.members || []).filter((member) => member.id !== currentUser.id && realtimeConnected && presenceByUser[member.id] === 'online'),
  ];

  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isChannelPinned, setIsChannelPinned] = useState(false);
  const [isChannelMuted, setIsChannelMuted] = useState(false);
  const [isChannelInfoOpen, setIsChannelInfoOpen] = useState(false);
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [isFollowOpen, setIsFollowOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  // Ctrl+F searches messages (the browser's own find bar is disabled).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [slowmodeCooldown, setSlowmodeCooldown] = useState(0);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Real voice note recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const channelLabel = activeChannel.name;
  // Bot social-feed responses belong only in the dedicated social channel.
  // Older local sessions may have them persisted under a renamed test channel;
  // keep those messages out of the regular conversation view.
  const visibleMessages = /redes|social/i.test(activeChannel.name)
    ? messages
    : messages.filter((message) => {
        const content = String(message.content || '').toLowerCase();
        const isBotAuthor = message.aiGenerated || /bot|ia/i.test(`${message.author?.username || ''} ${message.author?.displayName || ''}`) || /^🤖\s*\*\*kova bot/i.test(content);
        return !(isBotAuthor && (content.includes('redes sociales oficiales')));
      });

  // Discord slowmode countdown timer
  useEffect(() => {
    if (slowmodeCooldown <= 0) return;
    const interval = setInterval(() => {
      setSlowmodeCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [slowmodeCooldown]);

  // Older history: loads when you reach the top (or press the button) and
  // keeps the message you were reading in place.
  const [olderState, setOlderState] = useState<'idle' | 'loading' | 'end'>('idle');
  useEffect(() => { setOlderState('idle'); }, [activeChannel?.id]);
  const loadOlder = async () => {
    const el = scrollRef.current;
    if (!el || olderState !== 'idle' || !activeChannel) return;
    setOlderState('loading');
    const previousHeight = el.scrollHeight;
    try {
      const added = await loadOlderMessages(activeChannel.id);
      requestAnimationFrame(() => { el.scrollTop += el.scrollHeight - previousHeight; });
      setOlderState(added < 50 ? 'end' : 'idle');
    } catch {
      setOlderState('idle');
      toast.error('No se pudieron cargar los mensajes anteriores.');
    }
  };
  const onConversationScroll = () => {
    const el = scrollRef.current;
    if (el && el.scrollTop < 80 && messages.length >= 50) void loadOlder();
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) {
      el.scrollTop = el.scrollHeight;
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

  // Real voice notes: record the mic, upload the audio, send it as a playable attachment.
  const voiceRecordingRef = useRef<VoiceNoteRecording | null>(null);
  const handleStartRecording = async () => {
    try {
      voiceRecordingRef.current = await startVoiceNote();
      setIsRecordingVoice(true);
    } catch (error) {
      toast.error(error instanceof Error && error.name !== 'NotAllowedError' ? error.message : 'Permite el micrófono para grabar notas de voz.');
    }
  };

  const handleCancelRecording = () => {
    voiceRecordingRef.current?.cancel();
    voiceRecordingRef.current = null;
    setIsRecordingVoice(false);
  };

  const handleSendVoiceNote = async () => {
    const recording = voiceRecordingRef.current;
    voiceRecordingRef.current = null;
    setIsRecordingVoice(false);
    if (!recording) return;
    const result = await recording.stop();
    if (!result) { toast.info('La nota de voz estaba vacía.'); return; }
    const sending = toast.loading('Enviando nota de voz…');
    try {
      const url = await uploadFile(result.file, 'attachment');
      sendMessage('', undefined, replyingTo?.id, undefined, [{ id: `att_voice_${Date.now()}`, url, name: result.file.name, type: 'audio', size: formatAttachmentSize(result.file.size), duration: result.duration, voice: true }]);
      toast.dismiss(sending);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la nota de voz.', { id: sending });
    }
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

  const addFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    const room = MAX_ATTACHMENT_COUNT - pendingAttachments.length;
    if (room <= 0) {
      toast.error(`Máximo ${MAX_ATTACHMENT_COUNT} archivos por mensaje.`);
      return;
    }
    const accepted = files.slice(0, room);
    const rejectedSize = accepted.filter((f) => f.size > MAX_ATTACHMENT_BYTES);
    const valid = accepted.filter((f) => f.size <= MAX_ATTACHMENT_BYTES);
    if (rejectedSize.length) toast.error(`${rejectedSize.map((f) => f.name).join(', ')} supera los 25 MB.`);
    if (files.length > room) toast.error(`Solo se agregaron ${room} — máximo ${MAX_ATTACHMENT_COUNT} por mensaje.`);
    if (!valid.length) return;
    const toastId = toast.loading(valid.length === 1 ? `Subiendo ${valid[0].name}…` : `Subiendo ${valid.length} archivos…`);
    try {
      const attachments = await Promise.all(valid.map((file, i) => fileToAttachment(file, i)));
      setPendingAttachments((prev) => [...prev, ...attachments]);
      toast.success(attachments.length === 1 ? `Adjuntado: ${attachments[0].name}` : `${attachments.length} archivos adjuntados`, { id: toastId });
    } catch (err) {
      console.warn('[Kova Attachments]', err);
      toast.error(err instanceof Error ? err.message : 'No se pudo adjuntar el archivo.', { id: toastId });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    void addFiles(e.target.files ?? []);
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleComposerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    void addFiles(e.dataTransfer.files);
  };

  const lastTypingEmitRef = useRef(0);

  const handleSendMessage = () => {
    lastTypingEmitRef.current = 0;
    setTyping(false);
    const text = draft.trim();
    if (!text && pendingAttachments.length === 0) return;

    if (slowmodeCooldown > 0) {
      toast.error(`Modo pausado activado. Espera ${slowmodeCooldown}s antes de enviar otro mensaje.`);
      return;
    }

    let fullText = text;

    // Slash commands parsing
    if (text.startsWith('/roles')) {
      fullText = '!roles';
    } else if (text.startsWith('/bot')) {
      fullText = '!bot';
    } else if (text.startsWith('/ticket')) {
      fullText = '!tickets';
    } else if (text.startsWith('/partida')) {
      const rest = text.replace(/^\/partida\s*/, '').trim();
      fullText = rest ? `!partida ${rest}` : '!partida';
    } else if (text.startsWith('/vip')) {
      fullText = '!vip';
    } else if (text.startsWith('/shrug')) {
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

    // /ai is private: the question goes to the Kova IA panel, not to the channel.
    if (text.startsWith('/ai')) {
      const prompt = text.replace('/ai', '').trim();
      setDraft('');
      setIsTyping(true);
      void askKovaAI(prompt || 'Resumen y análisis').finally(() => setIsTyping(false));
      return;
    }

    const attachments = pendingAttachments;
    sendMessage(
      fullText,
      undefined,
      replyingTo?.id,
      undefined,
      attachments.length ? attachments : undefined
    );
    setDraft('');
    setReplyingTo(null);
    setPendingAttachments([]);
    setIsEmojiPickerOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Apply slowmode if configured on channel
    if (activeChannel.slowmode && activeChannel.slowmode > 0) {
      setSlowmodeCooldown(activeChannel.slowmode);
    }

    // Process Discord / Custom Bot commands and triggers
    processBotTriggers(fullText, activeChannel.id);
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
    <main
      className="kova-channel-main channel-main flex-1 h-full w-full bg-[#06020e] flex flex-col justify-between overflow-hidden relative font-['Plus_Jakarta_Sans',sans-serif]"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        dragCounterRef.current += 1;
        if (dragCounterRef.current === 1) setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
        if (dragCounterRef.current === 0) setIsDragOver(false);
      }}
      onDrop={handleComposerDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-40 m-4 rounded-3xl border-2 border-dashed border-purple-500/60 bg-[#0d071c]/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-200">
            <Paperclip size={24} />
          </div>
          <p className="text-sm font-bold text-purple-100">Soltá los archivos para adjuntarlos</p>
          <p className="text-xs text-purple-300/70">Imágenes, video, audio o documentos · hasta 5 de 8 MB</p>
        </div>
      )}
      {/* 1. Modern Channel Header matching reference screenshot */}
      <header className="kova-stage-head">
        <div className="kova-stage-title">
          <Hash size={20} aria-hidden="true" />
          <div>
            <h1>{channelLabel}</h1>
            <p>{activeChannel.topic || `Conversación en ${activeServer?.name || 'tu espacio'}`}</p>
          </div>
        </div>

        <div className="kova-stage-actions">
          {onlineMembers.length > 0 && (
            <button type="button" className="kova-stage-presence" onClick={() => setIsMemberListOpen(true)} title="Ver miembros en línea">
              <span className="kova-stage-stack">
                {onlineMembers.slice(0, 3).map((member) => (
                  <Avatar key={member.id} src={member.avatar} name={member.displayName || member.username} size={24} />
                ))}
              </span>
              <span>{onlineMembers.length} en línea</span>
            </button>
          )}
          {activeChannel.type === 'announcements' && (
            <button type="button" className="kova-follow-btn" onClick={() => setIsFollowOpen(true)} title="Seguir estos anuncios desde otro espacio" aria-label="Seguir anuncios">
              <Megaphone size={15} /> <span>Seguir</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => toggleAutoTranslate(activeChannel.id)}
            className={autoTranslateChannels.has(activeChannel.id) ? 'is-active' : ''}
            title={autoTranslateChannels.has(activeChannel.id) ? 'Desactivar traducción automática' : 'Traducir automáticamente este canal'}
            aria-label="Traducción automática"
            aria-pressed={autoTranslateChannels.has(activeChannel.id)}
          >
            <Languages size={17} />
          </button>
          <button type="button" onClick={() => setIsSearchOpen(true)} title="Buscar mensajes (Ctrl+F)" aria-label="Buscar mensajes">
            <Search size={17} />
          </button>
          <button type="button" onClick={() => setIsPinnedDrawerOpen(true)} title="Mensajes fijados" aria-label="Mensajes fijados">
            <Pin size={17} />
          </button>
          <button
            type="button"
            onClick={() => setIsMemberListOpen(!isMemberListOpen)}
            className={`kova-stage-desktop ${isMemberListOpen ? 'is-active' : ''}`}
            title={isMemberListOpen ? 'Ocultar miembros' : 'Mostrar miembros'}
            aria-pressed={isMemberListOpen}
          >
            <Users size={17} />
          </button>
          <button type="button" onClick={() => setIsChannelInfoOpen(true)} title="Ajustes del canal" aria-label="Ajustes del canal">
            <MoreHorizontal size={17} />
          </button>
        </div>
      </header>

      {/* 2. Conversation Scroll Area */}
      <CatchUpBar />
      <div ref={scrollRef} onScroll={onConversationScroll} className="conversation-scroll flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">

        {/* Reglas destacadas en canal de reglas */}
        {activeChannel?.name.toLowerCase().includes('regla') && (
          <div className="mx-auto max-w-4xl rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-orange-950/20 p-4 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <CircleHelp size={18} className="text-amber-300" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-amber-200 font-['Outfit']">Reglas del servidor</h4>
                <p className="text-xs text-amber-100/80 mt-1">
                  {activeChannel.topic || 'Lee y respeta las normas de la comunidad para mantener un espacio seguro y divertido para todos.'}
                </p>
                <ul className="mt-2 list-disc list-inside text-[11px] text-amber-100/70 space-y-0.5">
                  <li>No spam ni publicidad no solicitada</li>
                  <li>Respeto absoluto entre miembros</li>
                  <li>Sin contenido explícito, hate o acoso</li>
                  <li>Sigue las indicaciones del staff y moderadores</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Roles destacados en canal de roles */}
        {activeChannel?.name.toLowerCase().includes('rol') && (
          <div className="mx-auto max-w-4xl rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-teal-950/20 p-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Users size={18} className="text-emerald-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-emerald-200 font-['Outfit']">Roles de la comunidad</h4>
                <p className="text-xs text-emerald-100/80 mt-1">
                  {activeChannel.topic || 'Selecciona roles para personalizar tu experiencia en el servidor.'}
                </p>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(activeServer?.roles || []).slice(0,6).map(r => (
                    <div key={r.id} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/20 border border-emerald-900/40">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color || '#10b981' }} />
                      <span className="text-[11px] text-emerald-100 truncate">{r.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Messages Feed */}
        {visibleMessages.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-[22px_22px_22px_8px] bg-purple-950/40 border border-purple-800/40 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <img src="/kova-chrome-cube.png" alt="" className="w-10 h-10 object-contain rounded-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-['Outfit']">
                El flujo {channelLabel} está listo
              </h2>
              <p className="text-xs text-purple-300/60 max-w-sm mt-1">
                Abre la señal con el primer mensaje. Desde aquí pueden nacer conversaciones, ideas y momentos en vivo.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.length >= 50 && olderState !== 'end' && (
              <div className="kova-older">
                <button type="button" onClick={() => void loadOlder()} disabled={olderState === 'loading'}>
                  {olderState === 'loading' ? 'Cargando mensajes anteriores…' : 'Cargar mensajes anteriores'}
                </button>
              </div>
            )}
            {olderState === 'end' && <p className="kova-older-end">Este es el principio de #{activeChannel?.name}.</p>}
            {visibleMessages.map((message, index) => (
              <MessageItem
                key={message.id}
                message={message}
                isGrouped={index > 0 && !message.replyTo && visibleMessages[index - 1].author.id === message.author.id}
                onReply={(m) => setReplyingTo({ id: m.id, authorName: m.author.displayName })}
              />
            ))}
          </div>
        )}

        {/* Typing indicator (other members, via realtime gateway) */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator mt-2" aria-live="polite">
            <div>
              <strong>
                {typingUsers.length === 1
                  ? `${typingUsers[0]} está escribiendo`
                  : typingUsers.length <= 3
                    ? `${typingUsers.join(', ')} están escribiendo`
                    : 'Varias personas están escribiendo'}
              </strong>
              <span className="typing-dots">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        )}

        {/* Kova AI typing indicator */}
        {isTyping && (
          <div className="typing-indicator mt-2" aria-live="polite">
            <span className="avatar" style={{ background: '#7c3aed' }}>✦</span>
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

      {/* Pending Attachments Preview Bar */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2.5 bg-[#141824] border-t border-white/[0.06] flex flex-wrap gap-2">
          {pendingAttachments.map((att) => (
            <div
              key={att.id}
              className="group relative flex items-center gap-2.5 rounded-xl border border-cyan-400/25 bg-[#0d1220] pl-1.5 pr-8 py-1.5"
            >
              {att.type === 'image' && att.url ? (
                <img src={att.url} alt={att.name} className="w-10 h-10 rounded-lg object-cover border border-cyan-400/30" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center text-cyan-300">
                  {att.type === 'audio' ? <Mic size={16} /> : att.type === 'video' ? <ImageIcon size={16} /> : <Paperclip size={16} />}
                </div>
              )}
              <div className="min-w-0 max-w-[180px]">
                <p className="truncate text-xs font-semibold text-cyan-100">{att.name}</p>
                <p className="text-[10px] text-slate-400">{att.size}</p>
              </div>
              <button
                type="button"
                onClick={() => removePendingAttachment(att.id)}
                className="absolute top-1.5 right-1.5 p-1 text-slate-500 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                aria-label={`Quitar ${att.name}`}
              >
                <X size={13} />
              </button>
            </div>
          ))}
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
          expressions={activeServer?.expressions}
          onSelectSticker={(sticker) => {
            if (activeChannel.canSend === false) return;
            sendMessage(`[sticker:${sticker.id}]`);
            setIsEmojiPickerOpen(false);
          }}
        />

        {/* Kova quick-action autocomplete */}
        {draft.startsWith('/') && !draft.includes(' ') && (
          <div className="absolute left-4 bottom-[calc(100%+8px)] z-40 w-96 rounded-2xl bg-[#141824] border border-white/10 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono flex items-center gap-1">
              <Command size={12} className="text-purple-400" />
              <span>Acciones rápidas Kova</span>
            </div>
            <div className="space-y-1 mt-1 max-h-48 overflow-y-auto custom-scrollbar">
              {KOVA_QUICK_ACTIONS.filter((cmd) => cmd.command.startsWith(draft.toLowerCase())).map(
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
            <div className="kova-message-composer flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#111416]/95 border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl focus-within:border-white/35 transition-all w-full">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Plus Button in Circle on Left */}
              <button
                type="button"
                aria-label="Adjuntar archivo o imagen"
                onClick={() => fileInputRef.current?.click()}
                title="Adjuntar archivo o medios"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/65 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/10"
              >
                <Plus size={16} />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  const now = Date.now();
                  if (e.target.value && now - lastTypingEmitRef.current > 3000) {
                    lastTypingEmitRef.current = now;
                    setTyping(true);
                  }
                }}
                onBlur={() => { lastTypingEmitRef.current = 0; setTyping(false); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  activeChannel.canSend === false
                    ? '🔒 Solo lectura: no puedes escribir en este canal'
                    : slowmodeCooldown > 0
                    ? `Modo pausado (${slowmodeCooldown}s)...`
                    : `Escribe un mensaje...`
                }
                disabled={slowmodeCooldown > 0 || activeChannel.canSend === false}
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-white/35 focus:outline-none min-w-0 px-2 font-medium"
              />

              {/* Right tools: Paperclip, Emoji, Soundboard/Tools, Circular Purple Send Button */}
              <div className="flex items-center gap-1.5 shrink-0 pr-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Adjuntar archivo"
                  className="kova-composer-extra w-8 h-8 flex items-center justify-center rounded-full text-white/45 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Paperclip size={16} />
                </button>

                {!isVoiceLike(activeChannel.type) && activeChannel.canSend !== false && !activeChannel.id.startsWith('dm') && (
                  <button
                    type="button"
                    onClick={() => setIsPollOpen(true)}
                    title="Crear encuesta"
                    aria-label="Crear encuesta"
                    className="kova-composer-extra w-8 h-8 flex items-center justify-center rounded-full text-white/45 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <BarChart3 size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                  title="Emojis"
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                    isEmojiPickerOpen ? 'text-white bg-white/15' : 'text-white/45 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Smile size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSoundboardOpen(true)}
                  title="Efectos de sonido KOVA"
                  className="kova-composer-extra w-8 h-8 flex items-center justify-center rounded-full text-white/45 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Sparkles size={16} />
                </button>

                {draft.trim() && !draft.trim().startsWith('/') && pendingAttachments.length === 0 && (
                  <span className="relative">
                    <button
                      type="button"
                      onClick={() => setIsScheduleOpen((open) => !open)}
                      title="Programar envío"
                      aria-label="Programar envío"
                      aria-expanded={isScheduleOpen}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-white/45 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Clock size={16} />
                    </button>
                    {isScheduleOpen && (
                      <span className="kwp-anchor-up">
                        <WhenPicker
                          title="Programar envío"
                          confirmLabel="Programar"
                          onClose={() => setIsScheduleOpen(false)}
                          onPick={(when) => {
                            setIsScheduleOpen(false);
                            const text = draft.trim();
                            void scheduleMessage(activeChannel.id, text, when).then((ok) => { if (ok) setDraft(''); });
                          }}
                        />
                      </span>
                    )}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={slowmodeCooldown > 0 || (!draft.trim() && pendingAttachments.length === 0)}
                  title="Enviar mensaje"
                  className="w-9 h-9 rounded-full bg-white text-black hover:bg-white/80 flex items-center justify-center shadow-lg shadow-black/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  <Send size={15} className="translate-x-0.5" />
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
                <p className="text-slate-400 mt-0.5">{visibleMessages.length} mensajes compartidos</p>
              </div>

              <ChannelAccessPanel server={activeServer} channel={activeChannel} />
              <div className="pt-2 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    setIsChannelInfoOpen(false);
                    openInviteModal(activeServer.id);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 transition-all font-semibold cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>Invitar personas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <MessageSearch open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      {isFollowOpen && <FollowChannelModal channel={activeChannel} onClose={() => setIsFollowOpen(false)} />}
      {isPollOpen && <PollComposer channelId={activeChannel.id} onClose={() => setIsPollOpen(false)} />}
    </main>
  );
};
