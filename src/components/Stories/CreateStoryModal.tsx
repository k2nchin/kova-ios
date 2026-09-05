import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Sparkles, Send, Palette, Type, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';

export const CreateStoryModal: React.FC = () => {
  const { isCreateStoryOpen, setIsCreateStoryOpen, addStory, currentUser } = useApp();

  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedBg, setSelectedBg] = useState('from-purple-900 via-indigo-900 to-black');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCreateStoryOpen) return null;

  const bgPresets = [
    { id: 'from-purple-900 via-indigo-900 to-black', label: 'Nebula Neon' },
    { id: 'from-cyan-900 via-slate-900 to-black', label: 'Cyber Cyan' },
    { id: 'from-pink-900 via-purple-950 to-black', label: 'Synthwave' },
    { id: 'from-emerald-950 via-slate-900 to-black', label: 'Matrix' },
    { id: 'from-amber-950 via-stone-900 to-black', label: 'Sunset Glow' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      toast.success('Foto cargada para la historia');
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !mediaUrl) {
      toast.error('Por favor escribe un mensaje o sube una foto para tu historia');
      return;
    }

    addStory(mediaUrl || undefined, text.trim() || undefined, selectedBg);
    toast.success('¡Historia publicada con éxito!');
    setText('');
    setMediaUrl('');
    setIsCreateStoryOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsCreateStoryOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#121520] border border-white/[0.1] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit']">Crear Historia</h2>
              <p className="text-[11px] text-slate-400">Comparte lo que estás construyendo o pensando</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateStoryOpen(false)}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Story Preview Card */}
        <div className="p-5 flex flex-col items-center bg-[#090b10]">
          <div
            className={`w-64 h-80 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden bg-gradient-to-b ${selectedBg} border border-white/20`}
          >
            {mediaUrl && (
              <img
                src={mediaUrl}
                alt="Story preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />

            {/* Author bar inside preview */}
            <div className="relative z-10 flex items-center gap-2">
              <img
                src={currentUser.avatar}
                alt="Me"
                className="w-7 h-7 rounded-full object-cover ring-2 ring-white/50"
              />
              <span className="text-xs font-bold text-white shadow-sm font-['Outfit']">
                {currentUser.displayName || 'Juanpi'}
              </span>
            </div>

            {/* Centered text preview */}
            <div className="relative z-10 my-auto text-center px-2">
              <p className="text-sm font-semibold text-white drop-shadow-md whitespace-pre-wrap leading-snug">
                {text || 'Escribe tu mensaje aquí...'}
              </p>
            </div>

            {mediaUrl && (
              <button
                type="button"
                onClick={() => setMediaUrl('')}
                className="relative z-10 self-center px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-rose-300 text-[10px] font-semibold border border-rose-500/30 transition-all cursor-pointer"
              >
                Quitar imagen
              </button>
            )}
          </div>
        </div>

        {/* Controls & Form */}
        <form onSubmit={handlePublish} className="p-5 space-y-4 bg-[#121520]">
          {/* Text Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Type size={12} /> Texto de la historia
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="¿Qué estás haciendo hoy? Escribe un estado, anuncio o clip..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#72e4d0] resize-none"
            />
          </div>

          {/* Background Gradients Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Palette size={12} /> Color de fondo
            </label>
            <div className="flex gap-2">
              {bgPresets.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setSelectedBg(bg.id)}
                  className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${bg.id} border-2 transition-transform cursor-pointer ${
                    selectedBg === bg.id ? 'border-white scale-110 shadow-lg' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                  title={bg.label}
                />
              ))}
            </div>
          </div>

          {/* Media upload option */}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs text-slate-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
            >
              <Upload size={14} />
              <span>{mediaUrl ? 'Cambiar imagen' : 'Subir foto/captura'}</span>
            </button>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateStoryOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer glow-purple"
            >
              <Send size={13} />
              <span>Publicar Historia</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
