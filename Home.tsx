/*
 * Design philosophy: Signal & Structure — precise dark workspace, calm hierarchy,
 * turquoise for active/confirmed states, violet for AI actions, and the chat as the
 * center of gravity. This page uses a compact space rail, a structured channel tree,
 * and a collapsible context panel.
 */
import { useMemo, useState } from "react";
import {
  AtSign,
  Bell,
  Bot,
  ChevronDown,
  ChevronRight,
  Check,
  LoaderCircle,
  CircleHelp,
  Code2,
  Command,
  Copy,
  Download,
  FileText,
  Printer,
  Hash,
  Headphones,
  Keyboard,
  Menu,
  MessageSquareText,
  Mic,
  Monitor,
  MoreHorizontal,
  Paperclip,
  PanelLeftClose,
  PanelRightClose,
  SlidersHorizontal,
  UserRound,
  VolumeX,
  Pin,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  Send,
  Settings2,
  Sparkles,
  Users,
  Video,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const spaces = [
  { label: "HQ", tone: "violet", initials: "K" },
  { label: "Lab", tone: "cyan", initials: "L" },
  { label: "Ops", tone: "amber", initials: "O" },
];

const channels = [
  { id: "general", label: "chat-general", section: "Favoritos", unread: 3, mention: false, icon: Hash },
  { id: "announcements", label: "anuncios-oficiales", section: "Favoritos", unread: 0, mention: true, icon: Radio },
  { id: "architecture", label: "pizarra-arquitectura", section: "Colaboración", unread: 0, mention: false, icon: Code2 },
  { id: "roadmap", label: "roadmap-notas", section: "Colaboración", unread: 8, mention: false, icon: Pin },
  { id: "ai", label: "kova-ai-chat", section: "Colaboración", unread: 0, mention: false, icon: Sparkles },
];

const PROFILE_STORAGE_KEY = "kova.profile.v1";
const SEARCH_HISTORY_KEY = "kova.search-history.v1";

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
  } catch {
    // Ignore storage quota/private mode errors and keep the UI usable.
  }
}

function buildConversationText(channelLabel: string, sentMessages: string[]) {
  const lines = [
    `Kova AI · #${channelLabel}`,
    `Exportado: ${new Date().toLocaleString("es-ES")}`,
    "",
    "[16:15] Elena Vance: Acabamos de medir el consumo de memoria con Tauri v2 + Rust comparado con Electron: Kova consume menos de 78 MB de RAM frente a los 650 MB que suele consumir Discord.",
    "[16:22] Alex Rivers: El nuevo tema con glassmorphism oscuro y efectos de iluminación se siente premium. Miren cómo se integra el código con syntax highlighting directo.",
    "[16:25] Kova AI Core: La conversación apunta a reducir el consumo de recursos sin sacrificar latencia. Sugiero registrar el benchmark y convertirlo en una decisión del roadmap.",
    ...sentMessages.map((message) => `[Ahora] Juanpi: ${message}`),
  ];
  return lines.join("\\n");
}

const members = [
  { name: "Juanpi", role: "Founder", status: "Construyendo Kova Desktop App", color: "#B89CFF", online: true },
  { name: "Elena Vance", role: "Core Architect", status: "Integrando plugin-webrtc", color: "#72E4D0", online: true },
  { name: "Alex Rivers", role: "UI / UX Legend", status: "Diseñando glassmorphism…", color: "#E7A86B", online: true },
  { name: "Marcus Void", role: "Audio Lab", status: "Probando Voice DSP", color: "#9DA9FF", online: false },
];

function Avatar({ label, color, image }: { label: string; color: string; image?: string }) {
  return image ? (
    <img className="avatar avatar-image" src={image} alt="" />
  ) : (
    <span className="avatar" style={{ background: color }} aria-hidden="true">{label.slice(0, 1)}</span>
  );
}

function ChannelRow({ channel, active, onSelect }: { channel: (typeof channels)[number]; active: boolean; onSelect: () => void }) {
  const Icon = channel.icon;
  return (
    <button className={`channel-row ${active ? "is-active" : ""}`} onClick={onSelect} aria-current={active ? "page" : undefined}>
      <span className="channel-icon"><Icon size={15} strokeWidth={2.1} /></span>
      <span className="channel-name">{channel.label}</span>
      {channel.mention && <span className="mention-pill"><AtSign size={11} /></span>}
      {channel.unread > 0 && <span className="unread-count">{channel.unread}</span>}
      <MoreHorizontal className="channel-more" size={16} />
    </button>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const storedProfile = readLocal(PROFILE_STORAGE_KEY, { name: "Juanpi", status: "Disponible", compactMode: false, soundEnabled: true });
  const [name, setName] = useState(storedProfile.name);
  const [status, setStatus] = useState(storedProfile.status);
  const [compactMode, setCompactMode] = useState(storedProfile.compactMode);
  const [soundEnabled, setSoundEnabled] = useState(storedProfile.soundEnabled);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");

  const saveSettings = () => {
    writeLocal(PROFILE_STORAGE_KEY, { name, status, compactMode, soundEnabled });
    setSaved(true);
    toast.success("Preferencias guardadas en este dispositivo");
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="settings-head">
          <div><span className="eyebrow">ACCOUNT / PREFERENCES</span><h2 id="settings-title">Configuración de usuario</h2><p>Personaliza cómo se siente Kova durante tus sesiones de trabajo.</p></div>
          <button className="icon-button subtle" aria-label="Cerrar configuración" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="settings-layout">
          <nav className="settings-tabs" aria-label="Secciones de configuración">
            <div className="settings-nav-label">MI CUENTA</div>
            <button className={`settings-tab ${activeTab === "perfil" ? "is-active" : ""}`} onClick={() => setActiveTab("perfil")}><UserRound size={16} /> Perfil</button>
            <button className={`settings-tab ${activeTab === "apariencia" ? "is-active" : ""}`} onClick={() => setActiveTab("apariencia")}><Monitor size={16} /> Apariencia</button>
            <div className="settings-nav-label">APP SETTINGS</div>
            <button className={`settings-tab ${activeTab === "voz" ? "is-active" : ""}`} onClick={() => setActiveTab("voz")}><Headphones size={16} /> Voz y vídeo</button>
            <button className={`settings-tab ${activeTab === "notificaciones" ? "is-active" : ""}`} onClick={() => setActiveTab("notificaciones")}><Bell size={16} /> Notificaciones</button>
            <button className={`settings-tab ${activeTab === "privacidad" ? "is-active" : ""}`} onClick={() => setActiveTab("privacidad")}><ShieldCheck size={16} /> Privacidad</button>
            <button className={`settings-tab ${activeTab === "atajos" ? "is-active" : ""}`} onClick={() => setActiveTab("atajos")}><Keyboard size={16} /> Atajos</button>
          </nav>
          <div className="settings-content">
            {activeTab === "perfil" && <><div className="profile-edit-row"><div className="settings-avatar">J<span /></div><div><strong>Tu identidad en Kova</strong><p>Visible para tu equipo y en los canales activos.</p></div><button className="secondary-button" onClick={() => toast.info("Selector de avatar próximamente")}>Cambiar avatar</button></div><label className="field-label">Nombre visible<input value={name} onChange={(event) => setName(event.target.value)} /></label><label className="field-label">Estado<select value={status} onChange={(event) => setStatus(event.target.value)}><option>Disponible</option><option>En una reunión</option><option>Concentrado</option><option>Ausente</option></select></label><div className="preference-section"><div><strong>Preferencias de interfaz</strong><p>Pequeños ajustes para reducir el ruido y mantener el foco.</p></div><PreferenceToggle label="Modo compacto" description="Reduce el espacio vertical entre mensajes." checked={compactMode} onChange={() => setCompactMode(!compactMode)} /><PreferenceToggle label="Sonidos de interacción" description="Feedback sutil al enviar, reaccionar y completar acciones." checked={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} /></div></>}
            {activeTab === "apariencia" && <SettingsSection title="Apariencia" description="Controla cómo se presenta el espacio de trabajo."><PreferenceToggle label="Tema oscuro" description="Kova usa superficies oscuras para sesiones prolongadas." checked={true} onChange={() => toast.info("Kova mantiene el tema oscuro por ahora")} /><PreferenceToggle label="Reducir movimiento" description="Minimiza las animaciones no esenciales." checked={false} onChange={() => toast.info("Preferencia lista para guardar")} /></SettingsSection>}
            {activeTab === "voz" && <SettingsSection title="Voz y vídeo" description="Configura tus dispositivos para salas y llamadas."><PreferenceToggle label="Supresión de ruido" description="Reduce ruido de fondo en conversaciones de voz." checked={true} onChange={() => toast.success("Supresión de ruido actualizada")} /><PreferenceToggle label="Mostrar previsualización de vídeo" description="Confirma tu cámara antes de entrar a una sala." checked={true} onChange={() => toast.success("Previsualización actualizada")} /></SettingsSection>}
            {activeTab === "notificaciones" && <SettingsSection title="Notificaciones" description="Elige cuándo Kova debe interrumpir tu foco."><PreferenceToggle label="Menciones directas" description="Recibe alertas cuando alguien use tu nombre." checked={true} onChange={() => toast.success("Preferencia actualizada")} /><PreferenceToggle label="Actividad del canal" description="Notifica nuevos mensajes en tus canales favoritos." checked={false} onChange={() => toast.success("Preferencia actualizada")} /></SettingsSection>}
            {activeTab === "privacidad" && <SettingsSection title="Privacidad y seguridad" description="Gestiona la visibilidad de tu actividad."><PreferenceToggle label="Mostrar estado de actividad" description="Permite que tu equipo vea si estás disponible." checked={true} onChange={() => toast.success("Visibilidad actualizada")} /><PreferenceToggle label="Confirmar enlaces externos" description="Pide confirmación antes de abrir un enlace." checked={true} onChange={() => toast.success("Protección actualizada")} /></SettingsSection>}
            {activeTab === "atajos" && <SettingsSection title="Atajos de teclado" description="Navega más rápido con comandos esenciales."><div className="shortcut-row"><span>Buscar en Kova</span><kbd>⌘ K</kbd></div><div className="shortcut-row"><span>Enviar mensaje</span><kbd>Enter</kbd></div><div className="shortcut-row"><span>Nueva línea</span><kbd>Shift + Enter</kbd></div></SettingsSection>}
          </div>
        </div>
        <footer className="settings-footer"><span>{saved ? <><Check size={14} /> Guardado</> : "Los cambios se aplican solo a este dispositivo."}</span><div><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={saveSettings}>{saved ? "Listo" : "Guardar cambios"}</button></div></footer>
      </section>
    </div>
  );
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="settings-section-page"><span className="eyebrow">PREFERENCIA</span><h3>{title}</h3><p>{description}</p><div className="settings-section-list">{children}</div></div>;
}

function PreferenceToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return <button className="preference-row" onClick={onChange} aria-pressed={checked}><span><strong>{label}</strong><small>{description}</small></span><span className={`toggle ${checked ? "is-on" : ""}`}><i /></span></button>;
}

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>(() => readLocal(SEARCH_HISTORY_KEY, []));
  const results = [
    { kind: "Mensaje", title: "78 MB de RAM frente a Electron", meta: "Elena Vance · #chat-general", icon: MessageSquareText },
    { kind: "Canal", title: "roadmap-notas", meta: "8 mensajes sin leer", icon: Hash },
    { kind: "Mensaje", title: "Audio Engine conectado con latencia < 1.2ms", meta: "Alex Rivers · #chat-general", icon: Code2 },
  ].filter((result) => `${result.title} ${result.meta}`.toLowerCase().includes(query.toLowerCase()));
  const recordSearch = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    const nextHistory = [cleanValue, ...history.filter((item) => item.toLowerCase() !== cleanValue.toLowerCase())].slice(0, 5);
    setHistory(nextHistory);
    writeLocal(SEARCH_HISTORY_KEY, nextHistory);
  };

  return <div className="global-search"><button className="global-search-trigger" onClick={() => setOpen(true)}><Search size={16} /><span>Buscar mensajes, canales o comandos…</span><kbd>⌘ K</kbd></button>{open && <div className="search-popover"><div className="search-input-wrap"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca en todo Kova…" /><button aria-label="Cerrar búsqueda" onClick={() => { setOpen(false); setQuery(""); }}><X size={15} /></button></div><div className="search-hint"><Command size={13} /> Busca por canal, autor, palabra clave o comando</div><div className="search-results">{!query && history.length > 0 && <div className="history-header"><span>RECIENTES</span><button onClick={() => { setHistory([]); writeLocal(SEARCH_HISTORY_KEY, []); }}>Limpiar</button></div>}{!query && history.map((item) => <button className="recent-search" key={item} onClick={() => setQuery(item)}><Search size={13} /><span>{item}</span></button>)}{results.length ? results.map((result) => { const Icon = result.icon; return <button className="search-result" key={result.title} onClick={() => { recordSearch(query || result.title); toast.success(`Abriendo ${result.title}`); setOpen(false); }}><span className="search-result-icon"><Icon size={15} /></span><span><strong>{result.title}</strong><small>{result.kind} · {result.meta}</small></span><ChevronRight size={15} /></button>; }) : <div className="search-empty">No encontramos coincidencias. Prueba otra palabra.</div>}</div></div>}</div>;
}

function AppRail({ onCollapse, onSettings }: { onCollapse: () => void; onSettings: () => void }) {
  return (
    <aside className="app-rail" aria-label="Espacios de trabajo">
      <button className="brand-mark" aria-label="Kova AI">
        <img src="/manus-storage/kova-signal-mark_993615dc.png" alt="Kova" />
      </button>
      <div className="rail-divider" />
      <div className="space-stack">
        {spaces.map((space, index) => (
          <button key={space.label} className={`space-orb ${index === 0 ? "is-selected" : ""} tone-${space.tone}`} aria-label={`Espacio ${space.label}`}>
            {space.initials}
            {index === 0 && <span className="space-live" />}
          </button>
        ))}
        <button className="space-add" aria-label="Añadir espacio" onClick={() => toast.info("Los espacios nuevos estarán disponibles pronto.")}><Plus size={17} /></button>
      </div>
      <div className="rail-bottom">
        <button className="rail-button" aria-label="Ayuda" onClick={() => toast.info("Centro de ayuda de Kova AI")}><CircleHelp size={18} /></button>
        <button className="rail-button" aria-label="Configuración" onClick={onSettings}><Settings2 size={18} /></button>
        <button className="profile-mini" aria-label="Perfil de Juanpi"><span>J</span><i /></button>
      </div>
      <button className="rail-collapse" aria-label="Colapsar barra lateral" onClick={onCollapse}><PanelLeftClose size={16} /></button>
    </aside>
  );
}

function WorkspaceSidebar({ activeChannel, setActiveChannel, collapsed, setCollapsed, onSettings }: { activeChannel: string; setActiveChannel: (id: string) => void; collapsed: boolean; setCollapsed: (value: boolean) => void; onSettings: () => void }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ Favoritos: true, Colaboración: true, "Audio y vídeo": true });
  const grouped = useMemo(() => channels.reduce<Record<string, typeof channels>>((acc, channel) => {
    acc[channel.section] = [...(acc[channel.section] ?? []), channel];
    return acc;
  }, {}), []);

  return (
    <aside className={`workspace-sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="Navegación del espacio">
      <div className="workspace-head">
        <div className="workspace-heading">
          <div className="workspace-brand"><span className="wordmark">KOV<span>A</span></span><span className="wordmark-sub">AI WORKSPACE</span></div>
          <button className="workspace-name">Kova Official HQ <ChevronDown size={15} /></button>
        </div>
        <button className="icon-button subtle" aria-label="Cerrar navegación" onClick={() => setCollapsed(true)}><PanelLeftClose size={17} /></button>
      </div>
      <div className="sidebar-search">
        <Search size={16} />
        <span>Buscar en Kova</span>
        <kbd>⌘ K</kbd>
      </div>
      <nav className="channel-nav">
        <button className="sidebar-action"><Sparkles size={16} /> <span>Resumen inteligente</span><span className="new-label">NUEVO</span></button>
        <button className="sidebar-action"><Bell size={16} /> <span>Actividad</span><span className="activity-dot" /></button>
        {Object.entries(grouped).map(([section, items]) => (
          <div className="channel-section" key={section}>
            <button className="section-label" onClick={() => setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))}>
              {openSections[section] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <span>{section}</span>
              <span className="section-line" />
            </button>
            {openSections[section] && items.map((channel) => (
              <ChannelRow key={channel.id} channel={channel} active={activeChannel === channel.id} onSelect={() => setActiveChannel(channel.id)} />
            ))}
          </div>
        ))}
        <div className="channel-section">
          <button className="section-label" onClick={() => setOpenSections((prev) => ({ ...prev, "Audio y vídeo": !prev["Audio y vídeo"] }))}>
            {openSections["Audio y vídeo"] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <span>Audio y vídeo</span><span className="section-line" />
          </button>
          {openSections["Audio y vídeo"] && (
            <>
              <button className="voice-row"><span className="voice-live-dot" /><Headphones size={15} /><span>Voz Devs</span><span className="voice-count">3</span></button>
              <button className="voice-row"><span className="voice-live-dot is-muted" /><Volume2 size={15} /><span>Chill & Música</span></button>
            </>
          )}
        </div>
      </nav>
      <div className="user-dock">
        <Avatar label="J" color="#B89CFF" />
        <div className="user-copy"><strong>Juanpi</strong><span>Disponible · Founder</span></div>
        <div className="user-actions"><button className="user-settings-button" aria-label="Abrir configuración de usuario" onClick={onSettings}><Settings2 size={16} /></button><button className="icon-button subtle" aria-label="Más opciones de usuario" onClick={() => toast.info("Más opciones de usuario próximamente")}><MoreHorizontal size={17} /></button></div>
      </div>
      <button className="mobile-close" aria-label="Cerrar menú" onClick={() => setCollapsed(true)}><X size={18} /></button>
    </aside>
  );
}

function CodeBlock() {
  return (
    <div className="code-block">
      <div className="code-toolbar"><span><Code2 size={13} /> RUST</span><div><button onClick={() => toast.success("Código enviado al sandbox") }><Zap size={13} /> Ejecutar</button><button onClick={() => toast.info("Sandbox aislado listo para conectar")}>Sandbox</button><button onClick={() => toast.success("Código copiado") }><Copy size={13} /> Copiar</button></div></div>
      <pre><code><span className="code-keyword">pub fn</span> start_low_latency_audio_stream(sample_rate: u32) -&gt; Result&lt;String, String&gt; {'{'}{`\n`}
  println!(<span className="code-string">"Iniciando DSP con {`{`}Hz{`}`}"</span>, sample_rate);{`\n`}
  Ok(<span className="code-string">"Audio Engine conectado con latencia &lt; 1.2ms"</span>.to_string()){`\n`}
{'}'}</code></pre>
    </div>
  );
}

function Message({ author, role, time, avatar, color, children, reactions, ai }: { author: string; role?: string; time: string; avatar: string; color: string; children: React.ReactNode; reactions?: string[]; ai?: boolean }) {
  return (
    <article className={`message ${ai ? "message-ai" : ""}`}>
      <Avatar label={avatar} color={color} image={ai ? "/manus-storage/kova-ai-avatar_839f2836.jpg" : undefined} />
      <div className="message-body">
        <div className="message-meta"><strong>{author}</strong>{role && <span className="role-tag">{role}</span>}<time>{time}</time></div>
        <div className="message-content">{children}</div>
        {reactions && <div className="reactions">{reactions.map((reaction) => <button key={reaction} onClick={() => toast.success(`Reacción ${reaction} añadida`)}>{reaction}</button>)}<button className="reaction-add" onClick={() => toast.info("Añade una reacción")}>+</button></div>}
      </div>
    </article>
  );
}

function MobileChannelDock({ activeChannel, setActiveChannel }: { activeChannel: string; setActiveChannel: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const active = channels.find((channel) => channel.id === activeChannel) ?? channels[0];
  return <>
    {open && <div className="mobile-drawer-backdrop" onClick={() => setOpen(false)} />}
    {open && <section className="mobile-channel-drawer" aria-label="Cambiar de canal"><div className="drawer-handle" /><div className="drawer-head"><div><span className="eyebrow">KOVA WORKSPACE</span><h2>Cambiar de canal</h2></div><button className="icon-button subtle" onClick={() => setOpen(false)} aria-label="Cerrar canales"><X size={18} /></button></div><div className="drawer-channel-list">{channels.map((channel) => { const Icon = channel.icon; return <button key={channel.id} className={`drawer-channel ${activeChannel === channel.id ? "is-active" : ""}`} onClick={() => { setActiveChannel(channel.id); setOpen(false); }}><span className="drawer-channel-icon"><Icon size={16} /></span><span><strong>{channel.label}</strong><small>{channel.section}</small></span>{channel.unread > 0 && <em>{channel.unread}</em>}</button>; })}<div className="drawer-section-label">AUDIO Y VÍDEO</div><button className="drawer-channel"><span className="drawer-channel-icon voice-dot-small" /><span><strong>Voz Devs</strong><small>3 personas activas</small></span></button><button className="drawer-channel"><span className="drawer-channel-icon"><VolumeX size={16} /></span><span><strong>Chill & Música</strong><small>Silenciado</small></span></button></div></section>}
    <nav className="mobile-channel-dock" aria-label="Navegación móvil"><button className="mobile-current-channel" onClick={() => setOpen(true)}><span className="mobile-channel-icon"><Hash size={16} /></span><span><small>CANAL ACTUAL</small><strong>{active.label}</strong></span><ChevronDown size={16} /></button><button className="mobile-dock-action" onClick={() => setOpen(true)} aria-label="Abrir canales"><Menu size={18} /><span>Canales</span></button></nav>
  </>;
}

function MainChannel({ activeChannel, rightPanelOpen, setRightPanelOpen }: { activeChannel: string; rightPanelOpen: boolean; setRightPanelOpen: (value: boolean) => void }) {
  const [draft, setDraft] = useState("");
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const channelLabel = channels.find((channel) => channel.id === activeChannel)?.label ?? "chat-general";
  const sendMessage = () => {
    const message = draft.trim();
    if (!message) return;
    setSentMessages((prev) => [...prev, message]);
    setDraft("");
    setIsTyping(true);
    toast.success("Mensaje enviado al canal");
    window.setTimeout(() => setIsTyping(false), 1900);
  };
  const runAiAction = (action: string, message: string) => {
    setLoadingAction(action);
    window.setTimeout(() => { setLoadingAction(null); toast.success(message); }, 1100);
  };
  const exportConversation = (format: "txt" | "pdf") => {
    const text = buildConversationText(channelLabel, sentMessages);
    if (format === "txt") {
      const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `kova-${channelLabel}-conversation.txt`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Conversación exportada como texto");
      return;
    }
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!printWindow) {
      toast.error("Permite las ventanas emergentes para crear el PDF");
      return;
    }
    printWindow.document.write(`<html><head><title>Kova AI · #${channelLabel}</title><style>body{font-family:Arial,sans-serif;color:#18202a;max-width:780px;margin:48px auto;line-height:1.55}h1{font-size:24px;border-bottom:2px solid #72e4d0;padding-bottom:12px}pre{white-space:pre-wrap;font:14px/1.6 Arial}</style></head><body><h1>Kova AI · #${channelLabel}</h1><pre>${text.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character] ?? character)}</pre><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    printWindow.document.close();
    toast.success("Preparando impresión para guardar como PDF");
  };

  return (
    <main className="channel-main">
      <header className="channel-header">
        <div className="channel-title-wrap">
          <div className="channel-title"><Hash size={20} /><h1>{channelLabel}</h1><span className="header-status">Público</span></div>
          <p>Conversaciones libres sobre el proyecto, ideas e innovación.</p>
        </div>
        <div className="header-actions">
          <GlobalSearch />
          <button className="action-button ai-action" disabled={Boolean(loadingAction)} onClick={() => runAiAction("summary", "Resumen generado: 12 mensajes · 3 decisiones · 2 tareas") }>{loadingAction === "summary" ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />} <span>Resumir canal</span></button>
          <button className="action-button" disabled={Boolean(loadingAction)} onClick={() => runAiAction("minutes", "La minuta está lista para revisar") }>{loadingAction === "minutes" ? <LoaderCircle className="spin" size={15} /> : <MessageSquareText size={15} />} <span>Generar minuta</span></button>
          <button className={`icon-button ${rightPanelOpen ? "is-active" : ""}`} aria-label="Mostrar miembros" onClick={() => setRightPanelOpen(!rightPanelOpen)}><Users size={17} /></button>
        </div>
      </header>
      <div className="channel-toolbar"><span><span className="live-dot" /> 14 personas activas</span><span className="toolbar-separator" /><button onClick={() => toast.info("Canal fijado en favoritos")}><Pin size={14} /> Fijar canal</button><button onClick={() => toast.info("Notificaciones silenciadas por 1 hora")}><Bell size={14} /> Silenciar</button><span className="toolbar-spacer" /><button onClick={() => exportConversation("txt")}><Download size={14} /> TXT</button><button onClick={() => exportConversation("pdf")}><Printer size={14} /> PDF</button></div>
      <div className="conversation-scroll">
        <div className="welcome-banner">
          <div className="welcome-glyph"><Hash size={28} /></div>
          <div><span className="eyebrow">CANAL DE EQUIPO</span><h2>Bienvenido a #{channelLabel}</h2><p>Este es el comienzo del canal. Comparte ideas, código y decisiones con el equipo de Kova.</p></div>
          <button className="icon-button subtle" aria-label="Más información"><CircleHelp size={17} /></button>
        </div>
        <div className="date-divider"><span>HOY · 16 DE JUNIO</span></div>
        <Message author="Elena Vance" time="16:15" avatar="E" color="#72E4D0" reactions={["🔥 5", "⚡ 4", "💡 3"]}>
          <p>Acabamos de medir el consumo de memoria con Tauri v2 + Rust comparado con Electron: Kova consume menos de <strong>78 MB de RAM</strong> frente a los 650 MB que suele consumir Discord.</p>
          <button className="thread-link" onClick={() => toast.info("Abriendo hilo de 2 respuestas")}>▱ 2 respuestas en el hilo</button>
        </Message>
        <Message author="Alex Rivers" time="16:22" avatar="A" color="#E7A86B" reactions={["💙 4", "✨ 3"]}>
          <p>El nuevo tema con glassmorphism oscuro y efectos de iluminación se siente premium. Miren cómo se integra el código con syntax highlighting directo:</p>
          <CodeBlock />
        </Message>
        {isTyping && <div className="typing-indicator" aria-live="polite"><img className="avatar avatar-image" src="/manus-storage/kova-ai-avatar_839f2836.jpg" alt="" /><div><strong>Kova AI está escribiendo</strong><span className="typing-dots"><i /><i /><i /></span></div></div>}
        <Message author="Kova AI Core" role="KOVA AI" time="16:25" avatar="K" color="#72E4D0" ai reactions={["✦ 6"]}>
          <p><strong>Resumen rápido:</strong> la conversación apunta a reducir el consumo de recursos sin sacrificar latencia. Sugiero registrar el benchmark y convertirlo en una decisión del roadmap.</p>
          <div className="ai-actions"><button disabled={Boolean(loadingAction)} onClick={() => runAiAction("decision", "Resumen guardado en roadmap")}>{loadingAction === "decision" ? <LoaderCircle className="spin" size={12} /> : null}Guardar decisión</button><button disabled={Boolean(loadingAction)} onClick={() => runAiAction("task", "Tarea creada para el equipo")}>{loadingAction === "task" ? <LoaderCircle className="spin" size={12} /> : null}Crear tarea</button></div>
        </Message>
        {sentMessages.map((message, index) => <Message key={`${message}-${index}`} author="Juanpi" time="Ahora" avatar="J" color="#B89CFF" reactions={[]}><p>{message}</p></Message>)}
      </div>
      <div className="composer-wrap">
        <div className="composer">
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder={`Escribe en #${channelLabel} o usa /ai para Kova`} rows={1} aria-label="Escribir mensaje" />
          <div className="composer-footer"><div className="composer-tools"><button aria-label="Adjuntar archivo"><Paperclip size={17} /></button><button aria-label="Grabar nota de voz"><Mic size={17} /></button><button className="slash-button" onClick={() => setDraft((value) => `${value}/ai `)}>/ai</button><span className="composer-hint">Enter para enviar · Shift + Enter para nueva línea</span></div><button className="send-button" aria-label="Enviar mensaje" onClick={sendMessage}><Send size={17} /></button></div>
        </div>
      </div>
    </main>
  );
}

function MemberPanel({ onClose }: { onClose: () => void }) {
  return (
    <aside className="member-panel">
      <div className="member-head"><div><span className="eyebrow">EN ESTE CANAL</span><h2>Equipo activo <span>14</span></h2></div><button className="icon-button subtle" aria-label="Cerrar panel" onClick={onClose}><PanelRightClose size={17} /></button></div>
      <div className="presence-summary"><div className="presence-ring"><span>14</span></div><div><strong>14 activos ahora</strong><span>La colaboración está en movimiento.</span></div></div>
      <div className="member-group"><div className="member-group-label"><span>FUNDADOR</span><small>1</small></div>{members.slice(0, 1).map((member) => <MemberRow member={member} key={member.name} />)}</div>
      <div className="member-group"><div className="member-group-label"><span>CORE TEAM</span><small>3</small></div>{members.slice(1).map((member) => <MemberRow member={member} key={member.name} />)}</div>
      <div className="member-note"><Sparkles size={16} /><span>Kova AI está disponible para resumir, encontrar decisiones y convertir conversaciones en tareas.</span></div>
    </aside>
  );
}

function MemberRow({ member }: { member: (typeof members)[number] }) {
  return <button className="member-row" onClick={() => toast.info(`Perfil de ${member.name}`)}><span className="member-avatar-wrap"><Avatar label={member.name} color={member.color} /><i className={member.online ? "online" : "offline"} /></span><span className="member-copy"><strong>{member.name}</strong><span>{member.status}</span></span><span className="member-role">{member.role}</span></button>;
}

export default function Home() {
  const [activeChannel, setActiveChannel] = useState("general");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="kova-shell">
      <AppRail onCollapse={() => setSidebarCollapsed(true)} onSettings={() => setSettingsOpen(true)} />
      <WorkspaceSidebar activeChannel={activeChannel} setActiveChannel={setActiveChannel} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} onSettings={() => setSettingsOpen(true)} />
      {sidebarCollapsed && <button className="sidebar-reopen" aria-label="Mostrar navegación" onClick={() => setSidebarCollapsed(false)}><Menu size={18} /></button>}
      <MainChannel activeChannel={activeChannel} rightPanelOpen={rightPanelOpen} setRightPanelOpen={setRightPanelOpen} />
      {rightPanelOpen && <MemberPanel onClose={() => setRightPanelOpen(false)} />}
      <MobileChannelDock activeChannel={activeChannel} setActiveChannel={setActiveChannel} />
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
