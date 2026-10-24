import React from 'react';

interface PurpleMountainBannerProps {
  className?: string;
  height?: string;
  showStar?: boolean;
}

export const PurpleMountainBanner: React.FC<PurpleMountainBannerProps> = ({
  className = '',
  height = 'h-48',
  showStar = false,
}) => {
  return (
    <div className={`relative w-full overflow-hidden select-none ${height} ${className}`}>
      {/* Sky & Nebula Atmospheric Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e0720] via-[#1a0b36] to-[#0a0717]" />
      
      {/* Radial Purple Glow Behind Mountains */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-full rounded-full opacity-65 pointer-events-none blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.45) 0%, rgba(126, 34, 206, 0.2) 50%, transparent 80%)'
        }}
      />
      
      {/* Subtle Starfield */}
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12%" cy="20%" r="1" fill="#fff" opacity="0.8" />
        <circle cx="28%" cy="14%" r="1.5" fill="#e9d5ff" opacity="0.9" />
        <circle cx="45%" cy="30%" r="0.75" fill="#fff" opacity="0.6" />
        <circle cx="68%" cy="18%" r="1.2" fill="#c084fc" opacity="0.8" />
        <circle cx="82%" cy="24%" r="0.8" fill="#fff" opacity="0.7" />
        <circle cx="91%" cy="12%" r="1.5" fill="#e9d5ff" opacity="0.9" />
        <circle cx="35%" cy="40%" r="0.75" fill="#fff" opacity="0.5" />
        <circle cx="75%" cy="35%" r="1" fill="#fff" opacity="0.7" />
      </svg>

      {/* Layer 1: Distant Jagged Mountains */}
      <svg
        className="absolute bottom-0 left-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bgMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0c071a" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="midMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b0764" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#07040e" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id="foreMountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#240742" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#05030a" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Far Range */}
        <polygon
          points="0,400 0,220 80,190 150,230 240,160 350,240 460,140 580,220 690,120 780,210 880,150 990,230 1100,170 1200,210 1200,400"
          fill="url(#bgMountainGrad)"
        />

        {/* Mid Range */}
        <polygon
          points="0,400 0,270 90,240 180,280 290,210 390,290 510,190 620,280 730,170 840,270 960,200 1080,280 1200,240 1200,400"
          fill="url(#midMountainGrad)"
        />

        {/* Foreground Sharp Ridges */}
        <polygon
          points="0,400 0,320 120,270 230,340 370,260 480,330 630,240 760,330 890,250 1020,340 1140,290 1200,320 1200,400"
          fill="url(#foreMountainGrad)"
        />

        {/* Subtle illuminated slope facets */}
        <polygon points="460,140 510,190 480,330 460,250" fill="#a855f7" opacity="0.15" />
        <polygon points="690,120 730,170 630,240 680,210" fill="#c084fc" opacity="0.2" />
        <polygon points="880,150 960,200 890,250 860,230" fill="#c084fc" opacity="0.12" />
      </svg>

      {/* Bottom fog fade to blend smoothly into content */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#090713] via-[#090713]/70 to-transparent pointer-events-none" />

      {/* Optional Central Glowing Star */}
      {showStar && (
        <div className="absolute top-1/2 left-8 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-purple-600/40 blur-xl absolute" />
          <svg className="w-12 h-12 text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.8)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
          </svg>
        </div>
      )}
    </div>
  );
};
