import React, { useState } from 'react';
import {
  X,
  Bot,
  Plus,
  Sparkles,
  Music,
  Shield,
  Smile,
  Flame,
  Gamepad2,
  Check,
  Search,
  Trash2,
  Cpu,
  ChevronRight,
  Send,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KovaBot } from '../../types';
import { toast } from 'sonner';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80',
];

export const AppDirectoryModal: React.FC = () => {
  const {
    isAppDirectoryOpen,
    setIsAppDirectoryOpen,
    activeServer,
    bots,
    installBotToServer,
    uninstallBotFromServer,
    createCustomBot,
    deleteCustomBot,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'directory' | 'create' | 'installed'>('directory');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Custom Bot Creator Form State
  const [newBotName, setNewBotName] = useState('');
  const [newBotUsername, setNewBotUsername] = useState('');
  const [newBotDesc, setNewBotDesc] = useState('');
  const [newBotPrefix, setNewBotPrefix] = useState('!');
  const [newBotAvatar, setNewBotAvatar] = useState(PRESET_AVATARS[0]);
  const [newBotCategory, setNewBotCategory] = useState<KovaBot['category']>('ai');
  const [isAiPowered, setIsAiPowered] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState(
    'Eres un bot amigable y experto en tecnología para la comunidad de Kova. Responde con energía y buen formato markdown.'
  );
  const [autoResponses, setAutoResponses] = useState<Array<{ trigger: string; response: string }>>([
    { trigger: 'hola', response: '¡Hola! Bienvenido a nuestro servidor de Kova 🚀' },
  ]);
  const [newTrigger, setNewTrigger] = useState('');
  const [newResponse, setNewResponse] = useState('');

  if (!isAppDirectoryOpen) return null;

  const categories = [
    { id: 'all', label: 'Todos', icon: Bot },
    { id: 'ai', label: 'Utilidades', icon: Sparkles },
    { id: 'music', label: 'Música', icon: Music },
    { id: 'moderation', label: 'Moderación', icon: Shield },
    { id: 'fun', label: 'Memes & Juegos', icon: Smile },
    { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  ];

  // Filtered bots for directory tab
  const filteredBots = bots.filter((b) => {
    const matchesCat = selectedCategory === 'all' || b.category === selectedCategory;
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.prefix.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Installed bots in current server
  const installedBots = bots.filter((b) => (b.installedServers || []).includes(activeServer.id));

  const handleAddAutoResponse = () => {
    if (!newTrigger.trim() || !newResponse.trim()) {
      toast.error('Indica un detonador y una respuesta');
      return;
    }
    setAutoResponses((prev) => [...prev, { trigger: newTrigger.trim(), response: newResponse.trim() }]);
    setNewTrigger('');
    setNewResponse('');
  };

  const handleCreateBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) {
      toast.error('El nombre del bot es requerido');
      return;
    }

    createCustomBot({
      name: newBotName.trim(),
      username: (newBotUsername.trim() || newBotName.toLowerCase().replace(/\s+/g, '_')).replace('@', ''),
      tag: 'BOT',
      avatar: newBotAvatar,
      description: newBotDesc.trim() || 'Bot personalizado creado en Kova.',
      category: newBotCategory,
      prefix: newBotPrefix.trim() || '!',
      isAiPowered,
      systemPrompt: isAiPowered ? systemPrompt.trim() : undefined,
      autoResponses,
      commands: [
        {
          name: `${newBotPrefix.trim() || '!'}help`,
          description: `Muestra los comandos disponibles para ${newBotName}`,
          usage: `${newBotPrefix.trim() || '!'}help`,
        },
      ],
    });

    // Reset form
    setNewBotName('');
    setNewBotUsername('');
    setNewBotDesc('');
    setActiveTab('installed');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsAppDirectoryOpen(false)}
    >
      <div
        className="w-full max-w-4xl h-[680px] rounded-3xl bg-[#11131c] border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Top Header */}
        <header className="h-16 px-6 border-b border-white/[0.06] bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-[#11131c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-['Outfit']">
                  Directorio de Aplicaciones y Bots
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-semibold">
                  Discord & Kova Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gestiona bots para <strong className="text-slate-200">#{activeServer.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAppDirectoryOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* 2. Top Tabs */}
        <div className="px-6 border-b border-white/[0.06] bg-[#0c0e15] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('directory')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'directory'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'directory' ? 'text-purple-400' : ''} />
              <span>Explorar Bots Populares</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'create'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus size={14} className={activeTab === 'create' ? 'text-purple-400' : ''} />
              <span>Crear Bot Personalizado</span>
            </button>

            <button
              onClick={() => setActiveTab('installed')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'installed'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu size={14} className={activeTab === 'installed' ? 'text-purple-400' : ''} />
              <span>Instalados en {activeServer.name} ({installedBots.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-purple-400 font-mono hidden sm:block">
            Gemini 3.6 Flash Integrado ⚡
          </div>
        </div>

        {/* 3. Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#111420]">
          {/* TAB 1: DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-6">
              {/* Search & Category Filter Pills */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar bots por nombre, función o prefijo (!play, !level)..."
                    className="w-full pl-9 pr-4 py-2 bg-[#171b26] border border-white/[0.08] rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {categories.map((c) => {
                    const Icon = c.icon;
                    const isSel = selectedCategory === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSel
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        <Icon size={12} />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBots.map((bot) => {
                  const isInstalled = (bot.installedServers || []).includes(activeServer.id);
                  return (
                    <div
                      key={bot.id}
                      className="p-4 rounded-3xl bg-[#141826] border border-white/[0.06] hover:border-purple-500/30 transition-all flex flex-col justify-between shadow-lg space-y-3 group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={bot.avatar}
                                alt={bot.name}
                                className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/10 shadow-md group-hover:scale-105 transition-transform"
                              />
                              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-[#5865f2] text-white text-[8px] font-bold font-mono uppercase">
                                BOT
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-bold text-white font-['Outfit']">
                                  {bot.name}
                                </h3>
                                {bot.verified && (
                                  <span title="Bot verificado" className="text-emerald-400">
                                    <Check size={13} />
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Por {bot.developerName || 'Kova Community'}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.06] text-purple-300 font-mono font-semibold">
                            {bot.prefix}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mt-3">
                          {bot.description}
                        </p>

                        {/* Commands Badges */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {(bot.commands || []).slice(0, 3).map((cmd, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.04]"
                              title={cmd.description}
                            >
                              {cmd.name}
                            </span>
                          ))}
                          {(bot.commands || []).length > 3 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 text-slate-500">
                              +{(bot.commands || []).length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Install / Remove Button */}
                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {bot.isAiPowered ? '🧠 Impulsado por Gemini' : '⚡ Comandos nativos'}
                        </span>

                        {isInstalled ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                              <Check size={13} /> Instalado
                            </span>
                            <button
                              type="button"
                              onClick={() => uninstallBotFromServer(bot.id, activeServer.id)}
                              className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Desinstalar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => installBotToServer(bot.id, activeServer.id)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus size={13} />
                            <span>Añadir a {activeServer.name}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE CUSTOM BOT */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateBot} className="space-y-6 max-w-2xl mx-auto">
              <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-[#141826] border border-purple-500/30 space-y-1">
                <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  <span>Estudio de Bots Personalizados Kova</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Crea tu propio bot conectado a Kova IA o con respuestas automáticas por palabras clave.
                </p>
              </div>

              {/* Bot Identity Inputs */}
              <div className="p-4 rounded-3xl bg-[#141826] border border-white/[0.06] space-y-4">
                <h4 className="text-xs font-bold text-white font-['Outfit'] uppercase tracking-wider text-slate-400">
                  1. Identidad del Bot
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-200">Nombre del Bot *</label>
                    <input
                      type="text"
                      value={newBotName}
                      onChange={(e) => setNewBotName(e.target.value)}
                      placeholder="Ej. CyberCompanion, Jarvis, WaifuAI"
                      className="w-full px-3 py-2 bg-[#0c0e15] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-200">Usuario / Tag</label>
                    <input
                      type="text"
                      value={newBotUsername}
                      onChange={(e) => setNewBotUsername(e.target.value)}
                      placeholder="Ej. cyber_companion"
                      className="w-full px-3 py-2 bg-[#0c0e15] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-200">Descripción del Bot</label>
                  <textarea
                    rows={2}
                    value={newBotDesc}
                    onChange={(e) => setNewBotDesc(e.target.value)}
                    placeholder="¿Qué hace tu bot y cómo ayuda en el servidor?"
                    className="w-full px-3 py-2 bg-[#0c0e15] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-200">Prefijo de Comando</label>
                    <input
                      type="text"
                      value={newBotPrefix}
                      onChange={(e) => setNewBotPrefix(e.target.value)}
                      placeholder="!"
                      className="w-full px-3 py-2 bg-[#0c0e15] border border-white/[0.1] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-200">Categoría</label>
                    <select
                      value={newBotCategory}
                      onChange={(e) => setNewBotCategory(e.target.value as KovaBot['category'])}
                      className="w-full px-3 py-2 bg-[#0c0e15] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="ai">Inteligencia Artificial</option>
                      <option value="moderation">Moderación</option>
                      <option value="fun">Memes & Entretenimiento</option>
                      <option value="gaming">Gaming & Rol</option>
                      <option value="utility">Utilidad</option>
                    </select>
                  </div>
                </div>

                {/* Avatar Selection */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-200 block">
                    Selecciona o ingresa Avatar
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={newBotAvatar}
                      alt="Avatar seleccionado"
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500 shadow-md"
                    />
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {PRESET_AVATARS.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt="Preset"
                          onClick={() => setNewBotAvatar(url)}
                          className={`w-9 h-9 rounded-xl object-cover cursor-pointer transition-all ${
                            newBotAvatar === url
                              ? 'ring-2 ring-purple-400 scale-105'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bot Behavior: Gemini AI or Trigger Responses */}
              <div className="p-4 rounded-3xl bg-[#141826] border border-white/[0.06] space-y-4">
                <h4 className="text-xs font-bold text-white font-['Outfit'] uppercase tracking-wider text-slate-400">
                  2. Motor de Inteligencia y Respuestas
                </h4>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0c0e15] border border-white/[0.06]">
                  <div>
                    <strong className="text-xs text-white block">Impulsado por Google Gemini</strong>
                    <span className="text-[11px] text-slate-400">
                      El bot razonará respuestas inteligentes contextuales usando el modelo oficial.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiPowered(!isAiPowered)}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                      isAiPowered ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        isAiPowered ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {isAiPowered && (
                  <div className="space-y-1 animate-in fade-in duration-150">
                    <label className="text-xs font-semibold text-slate-200">
                      Personalidad / Instrucción de Sistema (Prompt)
                    </label>
                    <textarea
                      rows={3}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Define cómo debe hablar el bot, su tono (sarcástico, profesional, entusiasta)..."
                      className="w-full px-3 py-2 bg-[#0c0e15] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 resize-none font-sans"
                    />
                  </div>
                )}

                {/* Custom Auto-Responses */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-200 block">
                    Respuestas Automáticas por Palabra Clave (Auto-Responses)
                  </label>

                  <div className="space-y-1.5">
                    {autoResponses.map((ar, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#0c0e15] border border-white/[0.06] text-xs"
                      >
                        <div className="truncate">
                          <span className="font-mono text-purple-400">"{ar.trigger}"</span>
                          <span className="text-slate-500 mx-1.5">➔</span>
                          <span className="text-slate-300">{ar.response}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAutoResponses(autoResponses.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Auto Response Inputs */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newTrigger}
                      onChange={(e) => setNewTrigger(e.target.value)}
                      placeholder="Detonador (ej. reglas)"
                      className="w-1/3 px-3 py-1.5 bg-[#0c0e15] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      placeholder="Respuesta (ej. Regla 1: Ser amables)"
                      className="flex-1 px-3 py-1.5 bg-[#0c0e15] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddAutoResponse}
                      className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.15] text-white rounded-xl text-xs font-bold"
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('directory')}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus size={14} />
                  <span>Crear e Instalar en {activeServer.name}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: INSTALLED BOTS IN THIS SERVER */}
          {activeTab === 'installed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Outfit']">
                    Bots Activos en #{activeServer.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Estos bots tienen permisos para interactuar en los canales de texto y voz del servidor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Plus size={13} />
                  <span>Crear Nuevo Bot</span>
                </button>
              </div>

              {installedBots.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-[#141826] border border-white/[0.06] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                    <Bot size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-white">No hay bots instalados en este servidor</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Visita el Directorio de Bots para instalar Lofi Girl, MEE6, Dank Memer o crear tu propio bot personalizado.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5"
                  >
                    <span>Explorar Directorio</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {installedBots.map((bot) => (
                    <div
                      key={bot.id}
                      className="p-4 rounded-3xl bg-[#141826] border border-white/[0.06] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={bot.avatar}
                          alt={bot.name}
                          className="w-11 h-11 rounded-2xl object-cover ring-1 ring-white/10"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white font-['Outfit']">
                              {bot.name}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded bg-[#5865f2] text-white text-[9px] font-bold font-mono uppercase">
                              BOT
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-purple-300 font-mono">
                              Prefijo: {bot.prefix}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{bot.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {bot.createdBy && (
                          <button
                            type="button"
                            onClick={() => deleteCustomBot(bot.id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Eliminar bot permanentemente"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => uninstallBotFromServer(bot.id, activeServer.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Expulsar de este Servidor
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
