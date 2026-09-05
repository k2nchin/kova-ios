import React, { useState } from 'react';
import { Hash, Volume2, FileText, Megaphone, X } from 'lucide-react';
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
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsCreateChannelOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#13151f] border border-white/[0.1] shadow-2xl p-4.5 space-y-3.5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 font-['Outfit']">Crear un Canal</h2>
            <p className="text-[11px] text-slate-400">En {activeServer.name}</p>
          </div>
          <button
            onClick={() => setIsCreateChannelOpen(false)}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Type Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
              Tipo de Canal
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {channelTypes.map((item) => (
                <div
                  key={item.type}
                  onClick={() => setType(item.type)}
                  className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    type === item.type
                      ? 'bg-purple-600/15 border-purple-500/60 shadow-sm'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
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
                className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-[#0b0c10] border border-white/[0.1] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
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
              className="w-full px-3 py-1.5 rounded-xl bg-[#0b0c10] border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-purple-500"
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
          <div className="flex justify-end gap-2 pt-1 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsCreateChannelOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40 shadow-md glow-purple"
            >
              Crear Canal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
