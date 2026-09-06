import React, { useEffect, useRef } from 'react';

export type BackgroundTheme =
  | 'crimson'
  | 'oled'
  | 'abyss'
  | 'emerald'
  | 'amethyst'
  | 'amber'
  | 'nebula'
  | 'matrix'
  | 'synthwave'
  | 'discord';

interface ThemeBackgroundProps {
  theme: BackgroundTheme;
}

export const ThemeBackground: React.FC<ThemeBackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (theme !== 'matrix') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const characters = '0123456789ABCDEFKOVAΨΩλπ∑∆¥$#@!*';
    const fontSize = 15;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(2, 11, 5, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        if (Math.random() > 0.85) {
          ctx.fillStyle = '#a7f3d0';
        } else {
          ctx.fillStyle = '#10b981';
        }

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  // 1. CRIMSON (BLOOD MOON / CYBERNETIC SCARLET)
  if (theme === 'crimson') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070103]">
        {/* Intense Cyber Crimson Orbs & Auras */}
        <div className="absolute -top-24 -left-20 w-[55vw] h-[55vw] rounded-full bg-rose-600/25 blur-[120px] animate-pulse duration-[6000ms]" />
        <div className="absolute top-1/4 right-[-10%] w-[50vw] h-[50vw] rounded-full bg-red-600/20 blur-[130px] animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-32 left-1/3 w-[60vw] h-[60vw] rounded-full bg-rose-700/20 blur-[140px] animate-pulse duration-[10000ms]" />
        
        {/* Scarlet Grid Cyber Mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(244,63,94,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(244,63,94,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-80" />
        
        {/* Radiant Blood Moon Spotlight */}
        <div className="absolute top-0 inset-x-0 h-[450px] bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.3)_0%,rgba(159,18,57,0.12)_45%,transparent_75%)] pointer-events-none" />
        {/* Subtle Ember dust gradient sweep */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(251,113,133,0.15)_0%,transparent_50%)] pointer-events-none" />
        {/* Soft Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,1,2,0.75)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 2. ABYSS (BIOLUMINESCENT DEEP OCEAN / ELECTRIC CYAN & SAPPHIRE)
  if (theme === 'abyss') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020712]">
        {/* Electric Azure & Cyan Glowing Vortices */}
        <div className="absolute -top-32 -left-10 w-[55vw] h-[55vw] rounded-full bg-cyan-500/25 blur-[120px] animate-pulse duration-[7000ms]" />
        <div className="absolute top-1/3 -right-20 w-[60vw] h-[60vw] rounded-full bg-blue-600/30 blur-[140px] animate-pulse duration-[9000ms]" />
        <div className="absolute -bottom-24 left-1/4 w-[50vw] h-[50vw] rounded-full bg-sky-500/22 blur-[130px] animate-pulse duration-[11000ms]" />
        
        {/* Oceanic Deep Digital Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.07)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_50%,#000_65%,transparent_100%)] pointer-events-none opacity-85" />

        {/* Top Mariana Trench Light Caustics */}
        <div className="absolute top-0 inset-x-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.28)_0%,rgba(2,132,199,0.12)_50%,transparent_80%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(1,4,11,0.75)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 3. EMERALD (CYBER MATRIX FOREST / NEON JADE)
  if (theme === 'emerald') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#010c05]">
        {/* Toxic / Jade High-Energy Orbs */}
        <div className="absolute -top-28 -left-10 w-[55vw] h-[55vw] rounded-full bg-emerald-500/25 blur-[120px] animate-pulse duration-[7000ms]" />
        <div className="absolute top-1/3 -right-20 w-[55vw] h-[55vw] rounded-full bg-teal-500/22 blur-[130px] animate-pulse duration-[9000ms]" />
        <div className="absolute -bottom-28 left-1/3 w-[60vw] h-[60vw] rounded-full bg-green-600/20 blur-[140px] animate-pulse duration-[11000ms]" />

        {/* Cyber Forest Geometric Matrix Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(52,211,153,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(52,211,153,0.07)_1px,transparent_1px)] bg-[size:46px_46px] [mask-image:radial-gradient(ellipse_65%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-80" />

        {/* Jade Neon Crown */}
        <div className="absolute top-0 inset-x-0 h-[460px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.28)_0%,rgba(5,150,105,0.14)_45%,transparent_75%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(1,10,4,0.75)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 4. AMETHYST (ULTRAVIOLET / COSMIC OBSIDIAN PURPLE)
  if (theme === 'amethyst') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#090212]">
        {/* Royal Violet & Fuchsia Plasma Auras */}
        <div className="absolute -top-32 -left-14 w-[60vw] h-[60vw] rounded-full bg-purple-600/30 blur-[120px] animate-pulse duration-[6500ms]" />
        <div className="absolute top-1/3 -right-24 w-[55vw] h-[55vw] rounded-full bg-fuchsia-600/24 blur-[130px] animate-pulse duration-[8500ms]" />
        <div className="absolute -bottom-28 left-1/4 w-[65vw] h-[65vw] rounded-full bg-violet-600/25 blur-[140px] animate-pulse duration-[10500ms]" />

        {/* Amethyst Sacred Cyber Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(192,132,252,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(192,132,252,0.07)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-85" />

        {/* Ultraviolet Crown Spotlight */}
        <div className="absolute top-0 inset-x-0 h-[460px] bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.32)_0%,rgba(126,34,206,0.15)_45%,transparent_75%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.18)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(7,1,14,0.75)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 5. AMBER (SOLAR ECLIPSE / MOLTEN CYBER DUSK)
  if (theme === 'amber') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0c0602]">
        {/* Radiant Solar Flare Orbs */}
        <div className="absolute -top-32 -left-12 w-[60vw] h-[60vw] rounded-full bg-amber-500/28 blur-[120px] animate-pulse duration-[7000ms]" />
        <div className="absolute top-1/4 -right-20 w-[55vw] h-[55vw] rounded-full bg-orange-600/25 blur-[130px] animate-pulse duration-[9000ms]" />
        <div className="absolute -bottom-28 left-1/3 w-[60vw] h-[60vw] rounded-full bg-yellow-600/22 blur-[140px] animate-pulse duration-[11000ms]" />

        {/* Solar Cyber Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(251,191,36,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(251,191,36,0.07)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-85" />

        {/* Molten Horizon Glow */}
        <div className="absolute top-0 inset-x-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.3)_0%,rgba(217,119,6,0.14)_45%,transparent_75%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(9,4,1,0.75)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 6. MATRIX (HIGH DENSITY DIGITAL DATA RAIN + CRT SCANLINES + GLOW)
  if (theme === 'matrix') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#010904]">
        {/* Terminal Ambient Green Glow */}
        <div className="absolute -top-32 left-1/4 w-[60vw] h-[60vw] rounded-full bg-emerald-500/20 blur-[130px] animate-pulse duration-[7000ms]" />
        <div className="absolute -bottom-32 right-1/4 w-[60vw] h-[60vw] rounded-full bg-green-500/18 blur-[140px] animate-pulse duration-[9000ms]" />
        
        {/* Canvas Digital Rain */}
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none opacity-85 mix-blend-screen"
        />

        {/* CRT Scanline Texture & Vignette */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(1,7,3,0.85)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 7. NEBULA (COSMIC GALAXY / MULTI-TONE AURORA BOREALIS)
  if (theme === 'nebula') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070513]">
        {/* Cosmic Nebula Swirls: Purple, Cyan, Magenta, Deep Blue */}
        <div className="absolute -top-24 -left-16 w-[65vw] h-[65vw] rounded-full bg-purple-600/35 blur-[120px] animate-pulse duration-[6000ms]" />
        <div className="absolute top-1/4 -right-20 w-[60vw] h-[60vw] rounded-full bg-cyan-500/30 blur-[130px] animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-28 left-1/4 w-[65vw] h-[65vw] rounded-full bg-pink-600/28 blur-[135px] animate-pulse duration-[10000ms]" />
        <div className="absolute top-1/2 left-1/3 w-[45vw] h-[45vw] rounded-full bg-indigo-600/25 blur-[125px] animate-pulse duration-[12000ms]" />

        {/* Star-dust subtle celestial texture */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />
        
        {/* Top Atmospheric Aurora */}
        <div className="absolute top-0 inset-x-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.32)_0%,rgba(6,182,212,0.18)_45%,transparent_75%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(6,4,16,0.75)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 8. SYNTHWAVE (OUTRUN 80s / RETRO NEON GRID & GIANT SUN)
  if (theme === 'synthwave') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#18032e] via-[#0d041c] to-[#04010a]">
        {/* Glowing Retro Synthwave Sun */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-b from-yellow-300 via-pink-500 to-purple-600 opacity-60 blur-[30px] pointer-events-none" />
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-b from-yellow-300 via-pink-500 to-purple-600 opacity-30 blur-[90px] pointer-events-none" />

        {/* Sun Blinds / Venetian Horizon Stripes */}
        <div className="absolute top-[210px] left-1/2 -translate-x-1/2 w-[340px] h-[142px] overflow-hidden pointer-events-none">
          <div className="w-full h-2 bg-[#0d041c] mb-2" />
          <div className="w-full h-2.5 bg-[#0d041c] mb-2.5" />
          <div className="w-full h-3 bg-[#0d041c] mb-3" />
          <div className="w-full h-3.5 bg-[#0d041c] mb-3.5" />
          <div className="w-full h-4 bg-[#0d041c]" />
        </div>

        {/* Ambient Neon Lasers */}
        <div className="absolute -top-20 -left-20 w-[55vw] h-[55vw] rounded-full bg-fuchsia-600/28 blur-[120px]" />
        <div className="absolute -top-20 -right-20 w-[55vw] h-[55vw] rounded-full bg-cyan-500/25 blur-[120px]" />

        {/* 3D Perspective Outrun Laser Grid at Bottom */}
        <div className="absolute bottom-0 inset-x-0 h-[48%] [perspective:350px] overflow-hidden pointer-events-none">
          <div 
            className="w-full h-[200%] origin-top [transform:rotateX(68deg)] border-t-2 border-pink-500/50"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(236,72,153,0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(236,72,153,0.4) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />
          {/* Laser Horizon Light Strip */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-500 shadow-[0_0_20px_#ec4899]" />
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-pink-500/25 to-transparent" />
        </div>
      </div>
    );
  }

  // 9. DISCORD (MODERN GAMER BLURPLE / NITRO GLASS GLOW)
  if (theme === 'discord') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#1e1f22]">
        {/* Discord Blurple Glowing Orbs */}
        <div className="absolute -top-24 -left-16 w-[60vw] h-[60vw] rounded-full bg-[#5865F2]/28 blur-[130px] animate-pulse duration-[7000ms]" />
        <div className="absolute top-1/3 -right-20 w-[55vw] h-[55vw] rounded-full bg-[#5865F2]/24 blur-[130px] animate-pulse duration-[9000ms]" />
        <div className="absolute -bottom-24 left-1/3 w-[60vw] h-[60vw] rounded-full bg-[#4752C4]/25 blur-[140px] animate-pulse duration-[11000ms]" />
        
        {/* Subtle Gamer Dot Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(88,101,242,0.18)_1px,transparent_1px)] bg-[size:36px_36px] opacity-70 pointer-events-none" />

        {/* Discord Brand Gradient Crown */}
        <div className="absolute top-0 inset-x-0 h-[450px] bg-[radial-gradient(ellipse_at_top,rgba(88,101,242,0.3)_0%,rgba(71,82,196,0.12)_45%,transparent_75%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(24,25,28,0.75)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 10. OLED (CARBON FIBER STEALTH & ZERO BLEED ULTRA-BLACK)
  return (
    <div className="fixed inset-0 pointer-events-none z-0 bg-[#000000] overflow-hidden">
      {/* Sleek Carbon Hex / Dot Matrix Weave Pattern for True OLED Depth */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #000000 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }}
      />
      {/* Very faint edge framing */}
      <div className="absolute inset-0 border border-white/[0.04] pointer-events-none" />
    </div>
  );
};
