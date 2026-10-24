import React from 'react';
import { Sparkles } from 'lucide-react';

export const CommunityFooter: React.FC = () => {
  return (
    <footer className="h-9 w-full bg-[#05030a] border-t border-purple-950/30 flex items-center justify-between px-6 select-none text-[11px] text-zinc-500 font-medium z-30 shrink-0">
      {/* Left: Brand Tagline */}
      <div className="flex items-center gap-3 tracking-widest uppercase font-['Outfit'] text-[10px]">
        <span className="font-extrabold text-white tracking-widest">KOVA</span>
        <span className="text-zinc-700">—</span>
        <span className="text-zinc-400">CONECTA</span>
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-400">COMPARTE</span>
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-400">CREA</span>
      </div>

      {/* Middle Decorative Subtle Line */}
      <div className="hidden sm:block flex-1 max-w-xs mx-6 h-[1px] bg-gradient-to-r from-transparent via-purple-900/30 to-transparent" />

      {/* Right: Vision */}
      <div className="flex items-center gap-1.5 text-purple-400/70 text-[11px] font-['Outfit']">
        <Sparkles size={11} className="text-purple-400" />
        <span>Más que una comunidad.</span>
      </div>
    </footer>
  );
};
