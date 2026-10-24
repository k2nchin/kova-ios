import React, { useState } from 'react';
import {
  Bot,
  Radio,
  Sparkles,
  Shield,
  Send,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Copy,
  Hash,
  Volume2,
  Users,
  Terminal,
  Layers,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

export const DiscordHubModal: React.FC = () => {
  const {
    isDiscordHubOpen,
    setIsDiscordHubOpen,
    activeServer,
    activeChannel,
    sendMessage,
    processBotTriggers,
    setActiveChannelId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'commands' | 'dispatcher' | 'roles'>('overview');
  const [targetChannelId, setTargetChannelId] = useState<string>(activeChannel?.id || '1546044315950911550');
  const [dispatchMessage, setDispatchMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  if (!isDiscordHubOpen) return null;

  const guildId = '783512978086821928';
  const guildName = 'JuanPi1x Community';
  const botName = 'JuanPi IA (BOT OFICIAL)';

  const availableChannels = activeServer?.channels || [];
  const textChannels = availableChannels.filter((c) => c.type === 'text' || c.type === 'announcements');
  const voiceChannels = availableChannels.filter((c) => c.type === 'voice');
  const roles = activeServer?.roles || [];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('¡Sincronización completa con JuanPi1x Community vía Discord MCP!');
    }, 800);
  };

  const handleExecuteCommand = (cmd: string) => {
    // Send command into KOVA channel and trigger the bot
    sendMessage(cmd);
    processBotTriggers(cmd, activeChannel.id);
    setIsDiscordHubOpen(false);
    toast.success(`Comando ${cmd} enviado a #${activeChannel.name}`);
  };

  const handleDispatchToDiscord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchMessage.trim()) return;

    setIsSending(true);
    const selectedChan = availableChannels.find((c) => c.id === targetChannelId) || activeChannel;

    setTimeout(() => {
      // Create message in KOVA
      sendMessage(dispatchMessage.trim());
      setIsSending(false);
      setDispatchMessage('');
      toast.success(`Mensaje transmitido a #${selectedChan.name} a través de JuanPi IA`);
    }, 600);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsDiscordHubOpen(false)}
    >
      <div
        className="w-full max-w-4xl h-[85vh] rounded-3xl bg-[#0b0517] border border-purple-500/30 shadow-[0_0_50px_rgba(147,51,234,0.25)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Brand Bar */}
        <div className="h-16 px-6 bg-[#070210]/95 border-b border-purple-950/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5865f2] to-cyan-400 p-0.5 shadow-lg shadow-[#5865f2]/30 flex items-center justify-center">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black font-['Outfit'] tracking-wide text-white">
                  DISCORD MCP & BOT HUB
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-purple-300/70">
                {guildName} · ID: <span className="font-mono text-purple-200">{guildId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/40 text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Sincronizar canales y roles con Discord"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
            <button
              onClick={() => setIsDiscordHubOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Tabs */}
        <div className="flex items-center gap-1 px-6 bg-[#080312] border-b border-purple-950/40 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-bold font-['Outfit'] flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            <Layers size={14} />
            <span>Visión General</span>
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`px-4 py-3 text-xs font-bold font-['Outfit'] flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'commands'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            <Terminal size={14} />
            <span>Comandos de JuanPi IA</span>
          </button>
          <button
            onClick={() => setActiveTab('dispatcher')}
            className={`px-4 py-3 text-xs font-bold font-['Outfit'] flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'dispatcher'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            <Send size={14} />
            <span>Despachador a Canales</span>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-3 text-xs font-bold font-['Outfit'] flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            <Shield size={14} />
            <span>Matriz de Roles ({roles.length})</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Guild Feature Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-[#100626] to-indigo-950/40 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-black font-['Outfit'] text-xl shadow-lg shadow-purple-600/30">
                    JP
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black font-['Outfit'] text-white">{guildName}</h3>
                      <CheckCircle2 size={16} className="text-sky-400" />
                    </div>
                    <p className="text-xs text-purple-300/80 mt-0.5">
                      ⚡ Servidor Oficial de JuanPi1x | Streamer & Creador
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-purple-300/70">
                      <span>Owner: <strong className="text-amber-300">JuanPi1x</strong></span>
                      <span>•</span>
                      <span>Miembros: <strong className="text-white">59 miembros</strong></span>
                      <span>•</span>
                      <span>Afk Channel: <strong className="text-purple-200">#Modo AFK</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard('https://discord.gg/juanpi1x', 'Enlace de Discord')}
                    className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Copiar Enlace</span>
                  </button>
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#0f0720]/80 border border-purple-900/30">
                  <span className="text-[11px] text-purple-400/80 font-semibold uppercase tracking-wider block">
                    Canales de Texto
                  </span>
                  <span className="text-2xl font-black font-['Outfit'] text-white mt-1 block">
                    {textChannels.length} Canales
                  </span>
                  <span className="text-[10px] text-purple-300/60 mt-0.5 block">
                    Reglas, Anuncios, Chat, etc.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0f0720]/80 border border-purple-900/30">
                  <span className="text-[11px] text-cyan-400/80 font-semibold uppercase tracking-wider block">
                    Salas de Voz
                  </span>
                  <span className="text-2xl font-black font-['Outfit'] text-white mt-1 block">
                    {voiceChannels.length} Salas
                  </span>
                  <span className="text-[10px] text-purple-300/60 mt-0.5 block">
                    Autónomas, Stream & Chill
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0f0720]/80 border border-purple-900/30">
                  <span className="text-[11px] text-amber-400/80 font-semibold uppercase tracking-wider block">
                    Roles del Servidor
                  </span>
                  <span className="text-2xl font-black font-['Outfit'] text-white mt-1 block">
                    {roles.length} Roles
                  </span>
                  <span className="text-[10px] text-purple-300/60 mt-0.5 block">
                    Owner, Bot, Streamers, VIP...
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0f0720]/80 border border-purple-900/30">
                  <span className="text-[11px] text-emerald-400/80 font-semibold uppercase tracking-wider block">
                    Motor & Latencia
                  </span>
                  <span className="text-2xl font-black font-['Outfit'] text-white mt-1 block">
                    1.1 ms
                  </span>
                  <span className="text-[10px] text-purple-300/60 mt-0.5 block">
                    Rust Core + Discord MCP
                  </span>
                </div>
              </div>

              {/* Bot Status & Sync Details */}
              <div className="p-5 rounded-2xl bg-[#080214] border border-purple-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Zap size={16} className="text-cyan-400" />
                    <h4 className="text-sm font-bold text-white font-['Outfit']">
                      Estado de Integración con Discord MCP
                    </h4>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">Conexión Verificada</span>
                </div>

                <p className="text-xs text-purple-300/70 leading-relaxed">
                  KOVA está sincronizado bidireccionalmente con el servidor de Discord <strong className="text-white">JuanPi1x Community</strong> a través del servidor MCP de Discord. Todos los canales creados o editados en Discord están disponibles nativamente con soporte para audio de baja latencia WASAPI y mensajería en tiempo real.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 flex items-center justify-between">
                    <span className="text-xs text-purple-300">Bot Activo:</span>
                    <span className="text-xs font-bold text-cyan-300 font-mono">JuanPi IA</span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 flex items-center justify-between">
                    <span className="text-xs text-purple-300">Protocolo:</span>
                    <span className="text-xs font-bold text-purple-200 font-mono">MCP Tool Gateway</span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 flex items-center justify-between">
                    <span className="text-xs text-purple-300">Permisos:</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">Administrador (8)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. COMMANDS TAB */}
          {activeTab === 'commands' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Outfit']">
                    Comandos Disponibles de JuanPi IA
                  </h3>
                  <p className="text-xs text-purple-300/70">
                    Haz clic en "Ejecutar" para lanzar el comando directamente en el canal actual (#{activeChannel.name}).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    cmd: '!stream',
                    title: 'Estado del Directo',
                    desc: 'Muestra si JuanPi1x está en vivo, enlace a Twitch/YouTube y juego actual.',
                    color: 'text-rose-400 border-rose-500/30 bg-rose-950/20',
                  },
                  {
                    cmd: '!redes',
                    title: 'Redes Sociales Oficiales',
                    desc: 'Despliega los enlaces de Twitch, YouTube, Discord, Twitter/X, Instagram y TikTok.',
                    color: 'text-purple-400 border-purple-500/30 bg-purple-950/20',
                  },
                  {
                    cmd: '!roles',
                    title: 'Auto-Roles del Servidor',
                    desc: 'Menú interactivo de selección de roles (Streamers, Gamer Squad, Avisos Directos, VIP).',
                    color: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
                  },
                  {
                    cmd: '!tickets',
                    title: 'Ticket con Administración',
                    desc: 'Abre un ticket privado de atención directa con JuanPi1x y el equipo de moderadores.',
                    color: 'text-sky-400 border-sky-500/30 bg-sky-950/20',
                  },
                  {
                    cmd: '!partida apex',
                    title: 'Buscar Partida / Squad',
                    desc: 'Convoca jugadores para jugar Apex, Overwatch, Valorant, Roblox o torneos.',
                    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
                  },
                  {
                    cmd: '!vip',
                    title: 'Ventajas de VIP PASS',
                    desc: 'Beneficios exclusivos para miembros VIP, acceso al chat VIP y lounge privado.',
                    color: 'text-yellow-400 border-yellow-500/30 bg-yellow-950/20',
                  },
                  {
                    cmd: '!bot',
                    title: 'Diagnóstico del Bot & MCP',
                    desc: 'Verifica la latencia de red, estado del motor Rust y el gateway de Discord.',
                    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
                  },
                  {
                    cmd: '!ayuda',
                    title: 'Lista de Comandos',
                    desc: 'Despliega la guía completa de comandos y utilidades comunitarias.',
                    color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/20',
                  },
                ].map((item) => (
                  <div
                    key={item.cmd}
                    className={`p-4 rounded-2xl border ${item.color} flex flex-col justify-between gap-3`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm tracking-wide text-white">
                          {item.cmd}
                        </span>
                        <span className="text-[11px] font-semibold text-purple-300/80">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-purple-200/70 mt-1 leading-relaxed">{item.desc}</p>
                    </div>

                    <button
                      onClick={() => handleExecuteCommand(item.cmd)}
                      className="w-full py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Terminal size={12} />
                      <span>Ejecutar en #{activeChannel.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. DISPATCHER TAB */}
          {activeTab === 'dispatcher' && (
            <form onSubmit={handleDispatchToDiscord} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  Despachar Mensaje o Anuncio con JuanPi IA
                </h3>
                <p className="text-xs text-purple-300/70">
                  Transmite anuncios o mensajes oficiales a cualquiera de los canales de la comunidad mediante el bot.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-1.5">
                    Canal de Destino
                  </label>
                  <select
                    value={targetChannelId}
                    onChange={(e) => setTargetChannelId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#070210] border border-purple-800/40 text-sm text-white focus:outline-none focus:border-cyan-400 font-medium"
                  >
                    {textChannels.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0b0517]">
                        #{c.name} {c.topic ? `— ${c.topic.slice(0, 40)}...` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-1.5">
                    Contenido del Mensaje
                  </label>
                  <textarea
                    value={dispatchMessage}
                    onChange={(e) => setDispatchMessage(e.target.value)}
                    rows={4}
                    placeholder="Escribe el mensaje o aviso que JuanPi IA publicará en el canal..."
                    className="w-full px-4 py-3 rounded-2xl bg-[#070210] border border-purple-800/40 text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-purple-400/40 resize-none font-medium leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-purple-300/60">
                    <Sparkles size={14} className="text-cyan-400" />
                    <span>El mensaje se firmará como JuanPi IA (Bot Oficial)</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSending || !dispatchMessage.trim()}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send size={14} />
                    <span>{isSending ? 'Transmitiendo...' : 'Enviar Mensaje'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 4. ROLES TAB */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  Roles Oficiales de JuanPi1x Community
                </h3>
                <p className="text-xs text-purple-300/70">
                  Roles sincronizados directamente desde la API de Discord con sus colores hexadecimales originales.
                </p>
              </div>

              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="p-3.5 rounded-2xl bg-[#0a0416] border border-purple-900/30 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: role.color || '#99AAB5' }}
                      />
                      <div>
                        <span
                          className="text-sm font-bold font-['Outfit']"
                          style={{ color: role.color || '#ffffff' }}
                        >
                          {role.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-purple-400/70 font-mono mt-0.5">
                          <span>ID: {role.id}</span>
                          <span>•</span>
                          <span>Color: {role.color}</span>
                          {role.hoist && <span className="text-cyan-400">• Separado (Hoist)</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {role.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-800/30 text-[9px] font-mono text-purple-300"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
