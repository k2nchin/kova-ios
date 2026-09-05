import React, { useState, useEffect } from 'react';
import {
  Hash,
  Headphones,
  FileText,
  Radio,
  Trash2,
  X,
  Lock,
  Clock,
  Settings,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Channel } from '../../types';

const SLOWMODE_OPTIONS = [
  { label: 'Desactivado', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '5m', value: 300 },
  { label: '10m', value: 600 },
];

export const EditChannelModal: React.FC = () => {
  const {
    isEditChannelOpen,
    setIsEditChannelOpen,
    editingChannelId,
    activeServer,
    updateChannel,
    deleteChannel,
  } = useApp();

  const channel: Channel | undefined = activeServer.channels.find(
    (c) => c.id === editingChannelId
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'permissions'>('overview');
  const [channelName, setChannelName] = useState('');
  const [channelTopic, setChannelTopic] = useState('');
  const [slowmode, setSlowmode] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (channel) {
      setChannelName(channel.name);
      setChannelTopic(channel.topic || '');
      setSlowmode(channel.slowmode || 0);
      setIsPrivate(Boolean(channel.isPrivate));
      setActiveTab('overview');
    }
  }, [channel]);

  if (!isEditChannelOpen || !channel) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = channelName.toLowerCase().trim().replace(/\s+/g, '-');
    if (!formatted) return;

    updateChannel(channel.id, {
      name: formatted,
      topic: channelTopic.trim(),
      slowmode,
      isPrivate,
    });
    setIsEditChannelOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el canal #${channel.name}? Esta acción no se puede deshacer.`)) {
      setIsEditChannelOpen(false);
      deleteChannel(channel.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsEditChannelOpen(false)}
    >
      <div
        className="w-full max-w-3xl h-[75vh] rounded-3xl bg-[#11141d] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar */}
        <div className="w-full md:w-56 bg-[#0c0e15] border-r border-white/[0.08] p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <div className="p-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                {channel.type === 'voice' ? (
                  <Headphones size={15} />
                ) : channel.type === 'notes' ? (
                  <FileText size={15} />
                ) : channel.type === 'announcements' ? (
                  <Radio size={15} />
                ) : (
                  <Hash size={15} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
                  Ajustes
                </span>
                <span className="text-xs font-bold text-white truncate block font-['Outfit']">
                  #{channel.name}
                </span>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'overview'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Settings size={14} />
                <span>Vista General</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('permissions')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'permissions'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Shield size={14} />
                <span>Permisos</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Eliminar Canal</span>
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col bg-[#121520] overflow-hidden">
          {/* Header Bar */}
          <div className="h-14 border-b border-white/[0.08] px-6 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              {activeTab === 'overview' ? 'Vista General del Canal' : 'Permisos del Canal'}
            </span>
            <button
              type="button"
              onClick={() => setIsEditChannelOpen(false)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
            >
              <X size={14} />
              <span className="text-[10px] font-mono border border-white/20 rounded px-1">ESC</span>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
            {activeTab === 'overview' && (
              <>
                {/* Channel Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">NOMBRE DEL CANAL</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">#</span>
                    <input
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-['Outfit'] font-bold"
                      maxLength={40}
                      required
                    />
                  </div>
                </div>

                {/* Channel Topic */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">TEMA DEL CANAL (TOPIC)</label>
                  <textarea
                    value={channelTopic}
                    onChange={(e) => setChannelTopic(e.target.value)}
                    placeholder="Establece el tema, enlaces de referencia o reglas del canal..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 custom-scrollbar resize-none font-sans"
                    maxLength={250}
                  />
                  <div className="text-right text-[10px] text-slate-500 font-mono">
                    {channelTopic.length}/250
                  </div>
                </div>

                {/* Slowmode (Modo pausado) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-purple-400" />
                    <label className="text-xs font-semibold text-slate-300">MODO PAUSADO (SLOWMODE)</label>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Los miembros solo podrán enviar un mensaje en el intervalo seleccionado.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SLOWMODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSlowmode(opt.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                          slowmode === opt.value
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Canal Privado</h4>
                      <p className="text-[11px] text-slate-400">
                        Solo los miembros y roles seleccionados podrán ver y acceder a este canal.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPrivate((prev) => !prev)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      isPrivate ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        isPrivate ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/[0.08] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditChannelOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
