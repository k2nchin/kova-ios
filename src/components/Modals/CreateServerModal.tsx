import React, { useState } from 'react';
import {
  X,
  Users,
  Gamepad2,
  Globe,
  Briefcase,
  Sparkles,
  ArrowLeft,
  Compass,
  Link,
  Check,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

type ServerTemplate = 'amigos' | 'comunidad' | 'gaming' | 'trabajo' | 'otro';

export const CreateServerModal: React.FC = () => {
  const {
    isCreateServerOpen,
    setIsCreateServerOpen,
    createServer,
    joinServerByInvite,
    currentUser,
  } = useApp();

  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState(`Servidor de ${currentUser.displayName}`);
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<ServerTemplate>('amigos');
  const [iconUrl, setIconUrl] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
  );
  const [inviteInput, setInviteInput] = useState('');

  if (!isCreateServerOpen) return null;

  const sampleIcons = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=80',
  ];

  const templates: Array<{
    id: ServerTemplate;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'amigos',
      title: 'Para mí y mis amigos',
      description: '#general, #planes, #clips, 🔊 Sala de Charlas y Gaming',
      icon: <Users size={18} className="text-purple-400" />,
    },
    {
      id: 'comunidad',
      title: 'Comunidad o Club',
      description: '#reglas, #anuncios, #general, 🔊 Eventos',
      icon: <Globe size={18} className="text-cyan-400" />,
    },
    {
      id: 'gaming',
      title: 'Gaming & Competitivo',
      description: '#noticias, #lfg, 🔊 Squad 1, Squad 2 y Lounge',
      icon: <Gamepad2 size={18} className="text-emerald-400" />,
    },
    {
      id: 'trabajo',
      title: 'Trabajo o Estudio',
      description: '#objetivos, #proyectos, 🔊 Sala de Reuniones',
      icon: <Briefcase size={18} className="text-amber-400" />,
    },
    {
      id: 'otro',
      title: 'Personalizado',
      description: '#general y 🔊 General básico',
      icon: <Sparkles size={18} className="text-pink-400" />,
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createServer(name.trim(), description.trim(), iconUrl.trim() || undefined, template);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) {
      toast.error('Por favor ingresa un código o enlace de invitación');
      return;
    }
    const success = joinServerByInvite(inviteInput.trim());
    if (success) {
      setInviteInput('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsCreateServerOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#111420] border border-white/[0.1] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0e1019]">
          <div className="flex items-center gap-2.5">
            {mode === 'join' && (
              <button
                type="button"
                onClick={() => setMode('create')}
                className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer mr-1"
                title="Volver a crear servidor"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">
                {mode === 'create' ? 'Crear tu servidor' : 'Unirse a un servidor'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {mode === 'create'
                  ? 'Tu servidor es donde tú y tus amigos o comunidad pasan el rato.'
                  : 'Ingresa un enlace de invitación para unirte a un servidor existente.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateServerOpen(false)}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {mode === 'create' ? (
          <form
            onSubmit={handleCreateSubmit}
            className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1"
          >
            {/* 1. Server Icon Selector */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <div className="relative group">
                <img
                  src={iconUrl}
                  alt="Icono del servidor"
                  className="w-20 h-20 rounded-3xl object-cover ring-2 ring-purple-500/50 shadow-xl glow-purple transition-all group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Upload size={16} className="text-white" />
                  <span className="text-[9px] font-bold text-white uppercase mt-0.5">Icono</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {sampleIcons.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setIconUrl(img)}
                    className={`w-7 h-7 rounded-xl overflow-hidden transition-all cursor-pointer ${
                      iconUrl === img ? 'ring-2 ring-purple-400 scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Server Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Nombre del Servidor *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Cyberpunk Developers HQ"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#090b12] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
              />
            </div>

            {/* 3. Purpose / Template Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                ¿Para qué lo usarás?
              </label>
              <div className="grid grid-cols-1 gap-2">
                {templates.map((t) => {
                  const isSelected = template === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-purple-600/15 border-purple-500 shadow-md glow-purple'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${
                            isSelected ? 'bg-purple-500/25' : 'bg-white/[0.05]'
                          }`}
                        >
                          {t.icon}
                        </div>
                        <div>
                          <div
                            className={`text-xs font-bold ${
                              isSelected ? 'text-purple-300' : 'text-slate-200'
                            }`}
                          >
                            {t.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {t.description}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-purple-400 bg-purple-500 text-white'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check size={10} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions & Footer */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode('join')}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1.5"
              >
                <Link size={13} />
                <span>¿Ya tienes una invitación?</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateServerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg glow-purple disabled:opacity-40 cursor-pointer"
                >
                  Crear Servidor
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleJoinSubmit}
            className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1"
          >
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Enlace o Código de Invitación *
              </label>
              <input
                type="text"
                required
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="https://kova.gg/invite/abc1234 o código"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#090b12] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Las invitaciones tienen un formato como{' '}
                <span className="font-mono text-cyan-300">https://kova.gg/invite/xyz</span> o{' '}
                <span className="font-mono text-cyan-300">xyz</span>.
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode('create')}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={!inviteInput.trim()}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg glow-cyan disabled:opacity-40 cursor-pointer"
              >
                Unirse al Servidor
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
