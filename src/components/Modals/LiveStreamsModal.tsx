import React from 'react';
import { X, Radio, Tv } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LiveStreamsModal: React.FC = () => {
  const { isLiveStreamsOpen, setIsLiveStreamsOpen, activeServer } = useApp();

  if (!isLiveStreamsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsLiveStreamsOpen(false)}
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-[#0c051a] border border-purple-500/30 shadow-[0_0_60px_rgba(147,51,234,0.25)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-16 px-6 bg-[#070210]/90 border-b border-purple-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 p-0.5 shadow-lg shadow-rose-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0c051a] rounded-[14px] flex items-center justify-center text-rose-400">
                <Radio size={20} />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit'] tracking-wide">
                Directos & Streams en Vivo
              </h3>
              <p className="text-xs text-purple-400/60">
                Transmisiones de {activeServer?.name || 'este servidor'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLiveStreamsOpen(false)}
            className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Empty State */}
        <div className="p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-300">
            <Tv size={26} />
          </div>
          <h4 className="text-sm font-bold text-slate-200">No hay transmisiones en vivo</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            Cuando alguien del servidor empiece una transmisión, aparecerá aquí.
          </p>
        </div>
      </div>
    </div>
  );
};
