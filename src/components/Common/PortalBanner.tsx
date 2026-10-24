import React from 'react';

interface PortalBannerProps {
  className?: string;
  height?: string;
}

export const PortalBanner: React.FC<PortalBannerProps> = ({
  className = '',
  height = 'h-52 sm:h-56',
}) => {
  return (
    <div className={`relative w-full overflow-hidden select-none ${height} ${className}`}>
      {/* 1. Deep Cosmic Nebula Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0520] via-[#14062e] to-[#0a0319]" />

      {/* 2. Right Side Neon Circular Ring / Portal Glow */}
      <div className="absolute right-12 sm:right-28 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
        {/* Extreme radial bloom */}
        <div className="w-56 h-56 rounded-full bg-purple-600/30 blur-3xl absolute" />
        <div className="w-40 h-40 rounded-full bg-fuchsia-500/25 blur-xl absolute" />

        {/* The Neon Ring */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-[3px] border-fuchsia-400 shadow-[0_0_40px_rgba(217,70,239,0.8),inset_0_0_30px_rgba(168,85,247,0.6)] flex items-center justify-center relative">
          {/* Inner ethereal core glow */}
          <div className="w-full h-full rounded-full bg-gradient-to-b from-purple-500/20 via-fuchsia-900/10 to-transparent" />
        </div>

        {/* Mysterious Monolith / Obelisk standing in front of the ring */}
        <div
          className="absolute bottom-2 w-7 sm:w-8 h-28 sm:h-32 bg-gradient-to-t from-[#090314] via-[#120524] to-[#1f093d] border-t border-purple-400/40 shadow-2xl"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 85% 100%, 15% 100%, 0% 25%)',
          }}
        >
          {/* Glowing vertical line on the monolith */}
          <div className="w-[1px] h-full mx-auto bg-gradient-to-b from-fuchsia-300 via-purple-500 to-transparent opacity-70" />
        </div>
      </div>

      {/* 3. Starfield & Cosmic Dust */}
      <svg className="absolute inset-0 w-full h-full opacity-50 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8%" cy="25%" r="1" fill="#fff" opacity="0.8" />
        <circle cx="18%" cy="40%" r="1.5" fill="#f0abfc" opacity="0.9" />
        <circle cx="32%" cy="20%" r="0.75" fill="#fff" opacity="0.6" />
        <circle cx="48%" cy="35%" r="1.2" fill="#e879f9" opacity="0.8" />
        <circle cx="62%" cy="15%" r="0.8" fill="#fff" opacity="0.7" />
        <circle cx="80%" cy="45%" r="1.5" fill="#d8b4fe" opacity="0.9" />
        <circle cx="94%" cy="28%" r="1" fill="#fff" opacity="0.6" />
        <circle cx="55%" cy="50%" r="0.75" fill="#fff" opacity="0.5" />
      </svg>

      {/* 4. Jagged Mountain Silhouettes */}
      <svg
        className="absolute bottom-0 left-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 300"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="portalMountainBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b0764" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0a0314" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="portalMountainFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e0538" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#06020c" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Back Range */}
        <polygon
          points="0,300 0,160 90,130 180,170 300,100 420,180 540,110 680,180 820,130 960,190 1080,120 1200,160 1200,300"
          fill="url(#portalMountainBack)"
        />

        {/* Front Range */}
        <polygon
          points="0,300 0,220 110,180 220,230 360,160 490,240 640,170 780,250 910,170 1050,230 1200,190 1200,300"
          fill="url(#portalMountainFront)"
        />

        {/* Mountain ridge highlights */}
        <line x1="300" y1="100" x2="360" y2="160" stroke="#c084fc" strokeWidth="1" opacity="0.3" />
        <line x1="540" y1="110" x2="490" y2="240" stroke="#e879f9" strokeWidth="1" opacity="0.25" />
        <line x1="820" y1="130" x2="780" y2="250" stroke="#c084fc" strokeWidth="1" opacity="0.3" />
      </svg>

      {/* 5. Bottom smooth fade into content */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#06020c] via-[#06020c]/60 to-transparent pointer-events-none" />
    </div>
  );
};
