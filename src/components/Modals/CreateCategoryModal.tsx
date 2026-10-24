import React, { useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CreateCategoryModal: React.FC = () => {
  const { isCreateCategoryOpen, setIsCreateCategoryOpen, activeServer, createCategory } = useApp();
  const [name, setName] = useState('');

  if (!isCreateCategoryOpen || !activeServer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCategory(name.trim().toUpperCase());
    setName('');
    setIsCreateCategoryOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsCreateCategoryOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#0d071c] border border-purple-500/25 shadow-[0_0_30px_rgba(147,51,234,0.2)] p-5 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-purple-950/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit']">Crear Categoría</h2>
              <p className="text-[11px] text-purple-300/70">En {activeServer.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateCategoryOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-slate-300 uppercase font-mono mb-1.5">
              Nombre de la Categoría
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="EJ. CANALES DE TEXTO, VOZ"
              autoFocus
              className="w-full px-3.5 py-2 rounded-xl bg-[#07020e] border border-purple-900/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none text-slate-100 text-xs placeholder-slate-500 transition-colors uppercase"
            />
            <p className="text-[10px] text-slate-400 mt-1.5">
              Agrupa tus canales organizadamente al estilo Discord.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-950/40">
            <button
              type="button"
              onClick={() => setIsCreateCategoryOpen(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md glow-purple cursor-pointer"
            >
              Crear Categoría
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
