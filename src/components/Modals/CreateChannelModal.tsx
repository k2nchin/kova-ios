import React, { useState } from 'react';
import { Hash, Volume2, FileText, Megaphone,
  MessagesSquare,
  RadioTower, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChannelType } from '../../types';

export const CreateChannelModal: React.FC = () => {
  const {
    isCreateChannelOpen,
    setIsCreateChannelOpen,
    activeServer,
    createChannel,
    presetChannelType,
    presetCategoryId,
  } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState<ChannelType>('text');
  const [categoryId, setCategoryId] = useState<string>('');

  React.useEffect(() => {
    if (isCreateChannelOpen) {
      setType(presetChannelType || 'text');
      setCategoryId(presetCategoryId || '');
    }
  }, [isCreateChannelOpen, presetChannelType, presetCategoryId]);

  if (!isCreateChannelOpen || !activeServer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createChannel(name.trim(), type, categoryId || undefined);
    setName('');
  };

  const channelTypes: { type: ChannelType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      type: 'text',
      label: 'Texto & Código',
      desc: 'Publica mensajes, fragmentos de código, imágenes y reacciones',
      icon: <Hash className="w-5 h-5 text-cyan-400" />,
    },
    {
      type: 'voice',
      label: 'Voz & Video HD',
      desc: 'Salas de audio WebRTC de baja latencia con pantalla 4K',
      icon: <Volume2 className="w-5 h-5 text-emerald-400" />,
    },
    {
      type: 'notes',
      label: 'Notas & Documentación',
      desc: 'Documentos colaborativos vivos en Markdown para el equipo',
      icon: <FileText className="w-5 h-5 text-amber-400" />,
    },
    {
      type: 'announcements',
      label: 'Canal de Anuncios',
      desc: 'Noticias oficiales y actualizaciones importantes',
      icon: <Megaphone className="w-5 h-5 text-rose-400" />,
    },
    {
      type: 'stage',
      label: 'Escenario',
      desc: 'Charlas y eventos en directo: hablan unos pocos, escucha todo el mundo',
      icon: <RadioTower className="w-5 h-5 text-emerald-400" />,
    },
    {
      type: 'forum',
      label: 'Foro',
      desc: 'Temas con título y etiquetas; cada uno con su propia conversación',
      icon: <MessagesSquare className="w-5 h-5 text-violet-400" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsCreateChannelOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#0d071c] border border-purple-500/25 shadow-[0_0_30px_rgba(147,51,234,0.2)] p-5 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-purple-950/40 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white font-['Outfit']">Crear un Canal</h2>
            <p className="text-[11px] text-purple-300/70">En {activeServer.name}</p>
          </div>
          <button
            onClick={() => setIsCreateChannelOpen(false)}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Type Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
              Tipo de Canal
            </label>
            <div className="grid grid-cols-2 gap-2">
              {channelTypes.map((item) => (
                <div
                  key={item.type}
                  onClick={() => setType(item.type)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    type === item.type
                      ? 'bg-purple-600/20 border-purple-500 shadow-md shadow-purple-500/10'
                      : 'bg-purple-950/20 border-purple-900/20 hover:bg-purple-900/30'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-black/40 shrink-0">{item.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-200 truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
              Nombre del Canal *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500 text-xs">#</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="nuevas-ideas"
                className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#07020e] border border-purple-900/30 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#07020e] border border-purple-900/30 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="">(Sin categoría - Canal principal)</option>
              {activeServer.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-purple-950/40">
            <button
              type="button"
              onClick={() => setIsCreateChannelOpen(false)}
              className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40 shadow-md glow-purple cursor-pointer"
            >
              Crear Canal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
