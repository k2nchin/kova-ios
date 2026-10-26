import React, { useEffect, useState } from 'react';
import {
  Compass,
  Search,
  Users,
  Check,
  X,
  Heart,
  Globe,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';

interface DiscoverableServer {
  id: string;
  name: string;
  category: 'dev' | 'gaming' | 'ai' | 'music' | 'community';
  acronym: string;
  icon?: string;
  banner: string;
  description: string;
  memberCount: number;
  onlineCount: number;
  channels: { id: string; name: string; type: 'text' | 'voice' }[];
}

const PUBLIC_SERVERS: DiscoverableServer[] = [
  {
    id: 'pub_kova_dev',
    name: 'Kova Official Developers',
    category: 'dev',
    acronym: 'KD',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    icon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80',
    description: 'Comunidad oficial de Kova: novedades, temas, bots y ayuda.',
    memberCount: 2450,
    onlineCount: 890,
    channels: [
      { id: 'chan_kd_rules', name: 'reglas-y-bienvenida', type: 'text' },
      { id: 'chan_kd_ann', name: 'anuncios-kova', type: 'text' },
      { id: 'chan_kd_general', name: 'general-dev', type: 'text' },
      { id: 'chan_kd_voice', name: 'Sala de Programación', type: 'voice' },
    ],
  },
  {
    id: 'pub_rust_lab',
    name: 'Rustaceans & Low Latency',
    category: 'dev',
    acronym: 'RL',
    banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    icon: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=80',
    description: 'Sistemas distribuidos, compilación nativa en Rust, pipelines WebRTC de 0.8ms y WebAssembly.',
    memberCount: 1840,
    onlineCount: 520,
    channels: [
      { id: 'chan_rl_chat', name: 'rust-chat', type: 'text' },
      { id: 'chan_rl_wasm', name: 'wasm-web', type: 'text' },
      { id: 'chan_rl_voice', name: 'Voz Rust Lab', type: 'voice' },
    ],
  },
  {
    id: 'pub_ai_agents',
    name: 'AI Agents & LLM Foundry',
    category: 'ai',
    acronym: 'AI',
    banner: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80',
    icon: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=200&auto=format&fit=crop&q=80',
    description: 'Modelos multimodales, agentes autónomos, prompt engineering y el ecosistema Gemini API.',
    memberCount: 3120,
    onlineCount: 1140,
    channels: [
      { id: 'chan_ai_general', name: 'ai-discusiones', type: 'text' },
      { id: 'chan_ai_models', name: 'modelos-gemini', type: 'text' },
      { id: 'chan_ai_voice', name: 'Mesa Redonda IA', type: 'voice' },
    ],
  },
  {
    id: 'pub_synthwave',
    name: 'Cyberpunk & Synth Lounge',
    category: 'music',
    acronym: 'CS',
    banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    icon: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    description: 'Música retro-futurista, synthwave, lo-fi beats para concentrarse y producciones sonoras en vivo.',
    memberCount: 1490,
    onlineCount: 430,
    channels: [
      { id: 'chan_synth_chat', name: 'lounge-chat', type: 'text' },
      { id: 'chan_synth_radio', name: 'Radio 24/7 Lo-Fi', type: 'voice' },
    ],
  },
  {
    id: 'pub_gaming',
    name: 'Nexus Gaming & Esports',
    category: 'gaming',
    acronym: 'NX',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    icon: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&auto=format&fit=crop&q=80',
    description: 'Partidas competitivas de Valorant, CS2, League of Legends y torneos de fin de semana con amigos.',
    memberCount: 4200,
    onlineCount: 1680,
    channels: [
      { id: 'chan_nx_general', name: 'chat-general', type: 'text' },
      { id: 'chan_nx_clips', name: 'clips-y-momentazos', type: 'text' },
      { id: 'chan_nx_voice1', name: 'Escuadrón Alfa', type: 'voice' },
      { id: 'chan_nx_voice2', name: 'Escuadrón Beta', type: 'voice' },
    ],
  },
  {
    id: 'pub_creators_latam',
    name: 'Creadores LATAM',
    category: 'community',
    acronym: 'CL',
    banner: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=800&auto=format&fit=crop&q=80',
    icon: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=200&auto=format&fit=crop&q=80',
    description: 'Streamers, editores y creadores hispanohablantes colaborando en contenido, eventos y crecimiento.',
    memberCount: 2780,
    onlineCount: 760,
    channels: [
      { id: 'chan_cl_general', name: 'plaza-creativa', type: 'text' },
      { id: 'chan_cl_feedback', name: 'feedback-de-contenido', type: 'text' },
      { id: 'chan_cl_voice', name: 'Sala de Creadores', type: 'voice' },
    ],
  },
  {
    id: 'pub_design_collective',
    name: 'Pixel & Product Collective',
    category: 'community',
    acronym: 'PP',
    banner: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=80',
    icon: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=200&auto=format&fit=crop&q=80',
    description: 'Diseño UI/UX, motion, branding y crítica constructiva para crear productos digitales memorables.',
    memberCount: 1930,
    onlineCount: 610,
    channels: [
      { id: 'chan_pp_showcase', name: 'showcase', type: 'text' },
      { id: 'chan_pp_reviews', name: 'criticas-de-diseno', type: 'text' },
      { id: 'chan_pp_voice', name: 'Mesa de Diseño', type: 'voice' },
    ],
  },
  {
    id: 'pub_focus_academy',
    name: 'Focus Academy',
    category: 'community',
    acronym: 'FA',
    banner: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    icon: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&auto=format&fit=crop&q=80',
    description: 'Sesiones de estudio, programación en pareja, intercambio de recursos y salas Pomodoro siempre activas.',
    memberCount: 3560,
    onlineCount: 980,
    channels: [
      { id: 'chan_fa_goals', name: 'metas-semanales', type: 'text' },
      { id: 'chan_fa_resources', name: 'recursos', type: 'text' },
      { id: 'chan_fa_pomodoro', name: 'Pomodoro 50/10', type: 'voice' },
    ],
  },
];

// El catálogo se activará cuando las primeras comunidades públicas estén listas.
const COMMUNITY_CATALOG_ENABLED = false;

export const ServerDiscoveryModal: React.FC = () => {
  const {
    isDiscoveryOpen,
    setIsDiscoveryOpen,
    servers,
    joinPublicServer,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [communityServers, setCommunityServers] = useState<DiscoverableServer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joiningServerId, setJoiningServerId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (isDiscoveryOpen) {
      setSearchQuery('');
      setActiveCategory('all');
    }
  }, [isDiscoveryOpen]);

  useEffect(() => {
    if (!isDiscoveryOpen) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setLoadError('');
      void api.discoverServers(searchQuery.trim()).then((items) => {
        if (cancelled) return;
        setCommunityServers(items.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: 'community' as const,
          acronym: String(item.name || 'K').split(/\s+/).slice(0, 2).map((part: string) => part[0] || '').join('').toUpperCase(),
          icon: item.icon || undefined,
          banner: item.banner || '',
          description: item.description || '',
          memberCount: Number(item.memberCount) || 1,
          onlineCount: Number(item.onlineCount) || 0,
          channels: Array.isArray(item.channels) ? item.channels : [],
        })));
      }).catch((error) => {
        if (!cancelled) {
          setCommunityServers([]);
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las comunidades.');
        }
      }).finally(() => { if (!cancelled) setIsLoading(false); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [isDiscoveryOpen, searchQuery]);

  if (!isDiscoveryOpen) return null;

  const joinedServerIds = new Set(servers.map((s) => s.id));

  const filtered = [...(COMMUNITY_CATALOG_ENABLED ? PUBLIC_SERVERS : []), ...communityServers].filter((s) => {
    const matchesCat = activeCategory === 'all' || s.category === activeCategory;
    const matchesQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleJoin = async (pubServer: DiscoverableServer) => {
    setJoiningServerId(pubServer.id);
    const joined = await joinPublicServer(pubServer.id);
    setJoiningServerId(null);
    if (joined) setIsDiscoveryOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsDiscoveryOpen(false)}
    >
      <div
        className="kova-discovery-modal w-full max-w-5xl h-[88vh] rounded-3xl bg-[#11141d] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Banner */}
        <div className="relative h-44 bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-[#11141d] p-6 flex flex-col justify-end border-b border-white/[0.08] overflow-hidden shrink-0">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setIsDiscoveryOpen(false)}
              className="p-2 rounded-xl bg-black/40 hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-300 uppercase tracking-widest">
              <Compass size={14} className="animate-spin-slow" />
              <span>Explorador de Comunidades Kova</span>
            </div>
            <h2 className="text-2xl font-black text-white font-['Outfit']">
              Encuentra tu próximo espacio de colaboración
            </h2>
            <p className="text-xs text-slate-300">
              Explora espacios públicos creados por la comunidad y únete al instante.
            </p>
            <span className="inline-flex w-fit items-center rounded-full border border-purple-300/20 bg-purple-500/15 px-2.5 py-1 text-[10px] font-bold text-purple-200">
              {isLoading ? 'Buscando comunidades…' : `${filtered.length} comunidades disponibles`}
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between gap-4 shrink-0 bg-white/[0.01]">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            {[
              { id: 'all', label: 'Todos', icon: Globe },
              { id: 'community', label: 'Comunidad', icon: Heart },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeCategory === tab.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-64 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar comunidades..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-['Outfit']"
            />
          </div>
        </div>

        {/* Server Cards Grid */}
        <div className="kova-discovery-grid flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((pubServer) => {
            const isAlreadyJoined = joinedServerIds.has(pubServer.id);

            return (
              <div
                key={pubServer.id}
                className="kova-server-card rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-purple-500/40 overflow-hidden flex flex-col transition-all shadow-md group"
              >
                {/* Banner */}
                <div className="h-28 relative overflow-hidden bg-slate-900">
                  <img
                    src={pubServer.banner}
                    alt={pubServer.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#11141d] to-transparent opacity-80" />
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between -mt-8 relative z-10 space-y-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border-2 border-[#11141d] shadow-lg overflow-hidden shrink-0 flex items-center justify-center font-bold text-white font-['Outfit']">
                        {pubServer.icon ? (
                          <img src={pubServer.icon} alt={pubServer.name} className="w-full h-full object-cover" />
                        ) : (
                          pubServer.acronym
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white font-['Outfit'] truncate">
                          {pubServer.name}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {pubServer.onlineCount} en línea
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={11} />
                            {pubServer.memberCount} miembros
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 mt-3 leading-relaxed">
                      {pubServer.description}
                    </p>
                  </div>

                  {/* Join Action */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] text-purple-300 font-mono">
                      {pubServer.channels.length} canales
                    </span>

                    {isAlreadyJoined ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check size={14} />
                        <span>Ya unido</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={joiningServerId === pubServer.id}
                        onClick={() => void handleJoin(pubServer)}
                        className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                      >
                        {joiningServerId === pubServer.id ? 'Uniéndote…' : 'Unirse al servidor'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full min-h-64 rounded-3xl border border-dashed border-purple-500/25 bg-purple-950/10 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 text-purple-300 flex items-center justify-center">
                <Compass size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white">
                  {isLoading ? 'Buscando comunidades públicas…' : loadError ? 'No se pudieron cargar las comunidades' : searchQuery ? 'No encontramos comunidades con esa búsqueda' : 'Todavía no hay comunidades públicas'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {isLoading ? 'Esto puede tardar unos segundos.' : loadError || (searchQuery ? 'Prueba con otro nombre o descripción.' : 'Cuando alguien publique un espacio, aparecerá aquí automáticamente.')}
                </p>
              </div>
              {COMMUNITY_CATALOG_ENABLED && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                >
                  Mostrar todos los servidores
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
