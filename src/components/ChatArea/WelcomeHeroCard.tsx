import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';

interface WelcomeHeroCardProps {
  channelName: string;
}

export const WelcomeHeroCard: React.FC<WelcomeHeroCardProps> = ({ channelName }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#121320]/95 via-[#141528]/95 to-[#191b34]/95 border border-purple-500/20 p-6 md:p-8 shadow-2xl overflow-hidden mb-6 group select-none backdrop-blur-md">
      {/* Ambient background glow */}
      <div className="absolute -left-10 -top-10 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-10 bottom-0 w-64 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Dismiss Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 w-7 h-7 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.06] z-10"
        title="Ocultar bienvenida"
      >
        <X size={15} />
      </button>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-10">
        {/* Glowing 3D Isometric Crystal on Pedestal */}
        <div className="relative shrink-0 w-36 h-36 flex items-center justify-center">
          {/* Animated 3D Floating Crystal & Glow Pedestal SVG */}
          <svg
            viewBox="0 0 160 160"
            className="w-full h-full overflow-visible drop-shadow-[0_10px_25px_rgba(124,58,237,0.4)]"
          >
            <defs>
              {/* Radial glow for bottom ring */}
              <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#6d28d9" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
              </radialGradient>

              {/* Crystal Top Facet */}
              <linearGradient id="facetTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>

              {/* Crystal Left Facet */}
              <linearGradient id="facetLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#4c1d95" />
              </linearGradient>

              {/* Crystal Right Facet */}
              <linearGradient id="facetRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>

              {/* Crystal Bottom Tip Facet */}
              <linearGradient id="facetBottom" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6b21a8" />
                <stop offset="100%" stopColor="#3b0764" />
              </linearGradient>
            </defs>

            {/* Base Pedestal Ring */}
            <ellipse
              cx="80"
              cy="132"
              rx="55"
              ry="12"
              fill="url(#ringGlow)"
              className="opacity-70"
            />
            <ellipse
              cx="80"
              cy="132"
              rx="46"
              ry="9"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeDasharray="4 2"
              className="opacity-80 drop-shadow-[0_0_8px_#a855f7]"
            />
            <ellipse
              cx="80"
              cy="132"
              rx="28"
              ry="5"
              fill="#6d28d9"
              className="opacity-40 blur-[2px]"
            />

            {/* Floating Crystal Group with smooth CSS float animation */}
            <g className="animate-pulse duration-[3000ms]">
              {/* Isometric Crystal Cube Faces */}
              {/* Top Face */}
              <polygon
                points="80,28 116,48 80,68 44,48"
                fill="url(#facetTop)"
                stroke="#d8b4fe"
                strokeWidth="1.2"
                strokeLinejoin="round"
                className="drop-shadow-sm"
              />

              {/* Left Face */}
              <polygon
                points="44,48 80,68 80,110 44,90"
                fill="url(#facetLeft)"
                stroke="#a855f7"
                strokeWidth="1"
                strokeLinejoin="round"
              />

              {/* Right Face */}
              <polygon
                points="80,68 116,48 116,90 80,110"
                fill="url(#facetRight)"
                stroke="#c084fc"
                strokeWidth="1"
                strokeLinejoin="round"
              />

              {/* Inner Glowing Core Specular lines */}
              <line
                x1="80"
                y1="68"
                x2="80"
                y2="110"
                stroke="#f3e8ff"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="opacity-80 drop-shadow-[0_0_4px_#ffffff]"
              />
              <line
                x1="44"
                y1="48"
                x2="80"
                y2="68"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinecap="round"
                className="opacity-70 drop-shadow-[0_0_4px_#ffffff]"
              />
              <line
                x1="116"
                y1="48"
                x2="80"
                y2="68"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinecap="round"
                className="opacity-70 drop-shadow-[0_0_4px_#ffffff]"
              />

              {/* Internal Crystal Core Star Sparkle */}
              <circle
                cx="80"
                cy="68"
                r="3"
                fill="#ffffff"
                className="drop-shadow-[0_0_8px_#ffffff]"
              />
            </g>
          </svg>
        </div>

        {/* Text Details Matching Screenshot */}
        <div className="flex flex-col text-center sm:text-left justify-center pt-1">
          {/* Eyebrow badge */}
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#a855f7] mb-1.5 font-mono">
            BIENVENIDO
          </span>

          {/* Main Title */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-['Outfit'] flex items-center justify-center sm:justify-start gap-2">
            <span>Bienvenido a KOVA</span>
            <Zap className="text-purple-400 fill-purple-400 w-6 h-6 inline-block" />
          </h2>

          {/* Subtext Paragraphs */}
          <p className="text-slate-300 text-sm mt-3 leading-relaxed">
            Este es el comienzo de este servidor.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Explora los canales y empieza a conversar.
          </p>
        </div>
      </div>
    </div>
  );
};
