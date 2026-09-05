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
        className="w-full max-w-sm rounded-2xl bg-[#13151f] border border-white/[0.1] shadow-2xl p-4.5 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-['Outfit']">Crear Categoría</h2>
              <p className="text-[11px] text-slate-400">En {activeServer.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateCategoryOpen(false)}
            className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono mb-1.5">
              Nombre de la Categoría
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="EJ. CANALES DE TEXTO, VOZ"
              autoFocus
              className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/[0.08] focus:border-purple-500/60 focus:outline-none text-slate-100 text-xs placeholder-slate-600 transition-colors uppercase"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Agrupa tus canales organizadamente al estilo Discord.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreateCategoryOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20"
            >
              Crear Categoría
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
