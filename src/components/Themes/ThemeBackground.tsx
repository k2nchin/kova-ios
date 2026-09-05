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

  // 1. CRIMSON ABYSS (DARK ROJO PROFUNDO / BLOOD MOON)
  if (theme === 'crimson') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070102]">
        {/* Deep Blood Red Aura Orbs */}
        <div className="absolute -top-32 -left-20 w-[60vw] h-[60vw] rounded-full bg-rose-950/35 blur-[140px] animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-36 -right-24 w-[65vw] h-[65vw] rounded-full bg-red-900/25 blur-[160px] animate-pulse duration-[10000ms]" />
        <div className="absolute top-[40%] left-[35%] w-[45vw] h-[45vw] rounded-full bg-rose-900/20 blur-[150px] animate-pulse duration-[12000ms]" />
        {/* Blood Moon Radial Horizon */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(225,29,72,0.12)_0%,transparent_70%)] pointer-events-none" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(6,1,2,0.85)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 2. ABYSSAL DEEP BLUE (MIDNIGHT SAPPHIRE)
  if (theme === 'abyss') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#01050d]">
        <div className="absolute -top-32 -left-20 w-[60vw] h-[60vw] rounded-full bg-blue-950/40 blur-[140px] animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-36 -right-24 w-[65vw] h-[65vw] rounded-full bg-sky-950/30 blur-[160px] animate-pulse duration-[10000ms]" />
        <div className="absolute top-[40%] left-[30%] w-[45vw] h-[45vw] rounded-full bg-indigo-950/25 blur-[140px] animate-pulse duration-[12000ms]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(2,132,199,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(1,5,13,0.85)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 3. DEEP FOREST EMERALD (MIDNIGHT PINE)
  if (theme === 'emerald') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#010904]">
        <div className="absolute -top-32 -left-20 w-[60vw] h-[60vw] rounded-full bg-emerald-950/40 blur-[140px] animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-36 -right-24 w-[65vw] h-[65vw] rounded-full bg-green-950/30 blur-[160px] animate-pulse duration-[10000ms]" />
        <div className="absolute top-[40%] left-[30%] w-[45vw] h-[45vw] rounded-full bg-teal-950/25 blur-[140px] animate-pulse duration-[12000ms]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(1,9,4,0.85)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 4. AMETHYST VOID (GOTHIC OBSIDIAN PURPLE)
  if (theme === 'amethyst') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#07020d]">
        <div className="absolute -top-32 -left-20 w-[60vw] h-[60vw] rounded-full bg-purple-950/45 blur-[140px] animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-36 -right-24 w-[65vw] h-[65vw] rounded-full bg-fuchsia-950/30 blur-[160px] animate-pulse duration-[10000ms]" />
        <div className="absolute top-[40%] left-[30%] w-[45vw] h-[45vw] rounded-full bg-violet-950/25 blur-[140px] animate-pulse duration-[12000ms]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(147,51,234,0.14)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(7,2,13,0.85)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 5. CYBER AMBER (ECLIPSE DUSK GOLD)
  if (theme === 'amber') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0a0501]">
        <div className="absolute -top-32 -left-20 w-[60vw] h-[60vw] rounded-full bg-amber-950/40 blur-[140px] animate-pulse duration-[8000ms]" />
        <div className="absolute -bottom-36 -right-24 w-[65vw] h-[65vw] rounded-full bg-orange-950/30 blur-[160px] animate-pulse duration-[10000ms]" />
        <div className="absolute top-[40%] left-[30%] w-[45vw] h-[45vw] rounded-full bg-yellow-950/20 blur-[140px] animate-pulse duration-[12000ms]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(10,5,1,0.85)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 6. MATRIX
  if (theme === 'matrix') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020b05]">
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none opacity-60 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40 pointer-events-none" />
      </div>
    );
  }

  // 7. NEBULA
  if (theme === 'nebula') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#090714]">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-purple-600/25 blur-[130px] animate-pulse duration-[7000ms]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-600/20 blur-[150px] animate-pulse duration-[9000ms]" />
        <div className="absolute top-[35%] left-[30%] w-[45vw] h-[45vw] rounded-full bg-indigo-600/20 blur-[140px] animate-pulse duration-[11000ms]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,7,20,0.6)_100%)] pointer-events-none" />
      </div>
    );
  }

  // 8. SYNTHWAVE
  if (theme === 'synthwave') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#140526] via-[#090514] to-[#040208]">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full bg-gradient-to-b from-amber-400 via-pink-500 to-purple-600 opacity-20 blur-[110px]" />
        <div className="absolute bottom-0 inset-x-0 h-64 bg-[linear-gradient(to_bottom,transparent_0%,rgba(236,72,153,0.12)_100%)] border-t border-pink-500/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/15 blur-[120px]" />
      </div>
    );
  }

  // 9. DISCORD
  if (theme === 'discord') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#313338]">
        <div className="absolute top-[-15%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-[#5865f2]/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[40vw] h-[40vw] rounded-full bg-[#5865f2]/08 blur-[150px]" />
      </div>
    );
  }

  // 10. OLED: Pure pitch black with zero light bleed
  return (
    <div className="fixed inset-0 pointer-events-none z-0 bg-[#000000]" />
  );
};
