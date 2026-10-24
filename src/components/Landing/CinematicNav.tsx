import React, { useEffect, useState } from 'react';

interface CinematicNavProps {
  onEnterApp: (mode?: 'login' | 'register') => void;
}

/**
 * Minimal cinematic nav: almost invisible over the hero,
 * settling into a quiet dark blur band after the first screen.
 */
export const CinematicNav: React.FC<CinematicNavProps> = ({ onEnterApp }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)] ${
        scrolled
          ? 'border-b border-[rgba(244,246,243,.06)] bg-[rgba(7,8,9,.62)] backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#inicio" className="flex items-center gap-2.5" aria-label="Kova, ir al inicio">
          <img src="/kova-cube-monogram-v3.png" alt="" className="h-6 w-6 object-contain" aria-hidden />
          <span className="kova-display text-[15px] font-bold tracking-[0.16em]">KOVA</span>
          <span className="kova-scene-label hidden lg:inline" style={{ letterSpacing: '.24em', fontSize: '9.5px' }}>
            Signal & Structure
          </span>
        </a>

        <div className="hidden items-center gap-8 text-[13px] text-[rgba(244,246,243,.64)] md:flex">
          <a href="#vivo" className="transition-colors duration-300 hover:text-[#F4F6F3]">Vivo</a>
          <a href="#descubre" className="transition-colors duration-300 hover:text-[#F4F6F3]">Descubrir</a>
          <a href="/downloads" className="transition-colors duration-300 hover:text-[#F4F6F3]">Descargar</a>
        </div>

        <button
          type="button"
          onClick={() => onEnterApp('login')}
          className="kova-btn kova-btn-primary rounded-full px-4 py-1.5 text-[12.5px] sm:px-5 sm:py-2"
        >
          Abrir Kova
        </button>
      </nav>
    </header>
  );
};
