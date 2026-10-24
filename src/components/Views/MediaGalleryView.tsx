import React, { useState } from 'react';
import { Image as ImageIcon, UploadCloud, Search, Film, Music, Grid, Plus } from 'lucide-react';

export const MediaGalleryView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'images' | 'videos' | 'audio'>('all');
  const [search, setSearch] = useState('');

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#07050d] text-zinc-200 scrollbar-none p-6 space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-950/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-purple-950/50">
            <ImageIcon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-['Outfit'] tracking-tight">
              Galería y Media
            </h1>
            <p className="text-xs text-zinc-400">
              Archivos compartidos, fotos, clips de partidas y grabaciones de audio.
            </p>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-[#0c0817] border border-purple-900/30 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todo
            </button>
            <button
              onClick={() => setFilter('images')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'images' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Imágenes
            </button>
            <button
              onClick={() => setFilter('videos')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'videos' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setFilter('audio')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === 'audio' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Audio
            </button>
          </div>

          <button className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-950/50 cursor-pointer">
            <Plus size={14} />
            <span>Subir media</span>
          </button>
        </div>
      </div>

      {/* Clean Gallery Grid State */}
      <div className="rounded-3xl border border-dashed border-purple-900/40 bg-[#0c0817]/40 p-14 flex flex-col items-center justify-center text-center gap-3 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-purple-950/50 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
          <UploadCloud size={28} />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-sm font-bold text-white font-['Outfit']">
            No hay archivos multimedia aún
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Arrastra y suelta imágenes, clips de video o audios para guardarlos y compartirlos con tu comunidad.
          </p>
        </div>
        <button className="mt-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors">
          <UploadCloud size={14} />
          <span>Explorar mis archivos</span>
        </button>
      </div>
    </div>
  );
};
