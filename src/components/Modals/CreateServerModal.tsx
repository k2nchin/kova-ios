import React, { useState } from 'react';
import { Plus, X, Sparkles, Image, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CreateServerModal: React.FC = () => {
  const { isCreateServerOpen, setIsCreateServerOpen, createServer } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  if (!isCreateServerOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createServer(name.trim(), description.trim(), iconUrl.trim() || undefined);
    setName('');
    setDescription('');
    setIconUrl('');
  };

  const sampleIcons = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={() => setIsCreateServerOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[#13151f] border border-white/[0.1] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">Crear tu Servidor</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Personaliza tu nuevo espacio comunitario o de equipo en Kova.
            </p>
          </div>
          <button
            onClick={() => setIsCreateServerOpen(false)}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Server Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Nombre del Servidor *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cyberpunk Developers HQ"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0c10] border border-white/[0.1] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Descripción Corta
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿De qué trata este servidor?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0c10] border border-white/[0.1] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Preset Icons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Elegir Icono
            </label>
            <div className="flex gap-3">
              {sampleIcons.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt="icon"
                  onClick={() => setIconUrl(img)}
                  className={`w-12 h-12 rounded-2xl object-cover cursor-pointer hover:scale-105 transition-all ${
                    iconUrl === img ? 'ring-2 ring-purple-500 shadow-lg glow-purple' : 'opacity-70'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsCreateServerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40 shadow-md glow-purple"
            >
              Crear Servidor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
