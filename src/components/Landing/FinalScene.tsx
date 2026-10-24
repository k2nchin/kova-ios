import React, { useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { KovaSignal } from './KovaSignal';
import { AmbientParticles } from './AmbientParticles';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const RIDGE_FAR =
  'M0,214 C90,170 170,196 260,150 C350,104 430,148 520,118 C610,88 690,132 790,96 C890,60 970,110 1060,84 C1150,58 1230,96 1330,72 C1380,60 1420,74 1440,66 L1440,480 L0,480 Z';
const RIDGE_MID =
  'M0,320 C110,272 190,306 300,266 C410,226 470,268 570,240 C670,212 760,252 860,226 C960,200 1040,238 1140,214 C1240,190 1330,224 1440,196 L1440,480 L0,480 Z';

interface FinalSceneProps {
  onEnterApp: (mode?: 'login' | 'register') => void;
}

/**
 * SCENE 07 — SUNRISE. Same world as the opening, changed light:
 * pre-dawn mystery resolved into a warm, open morning.
 * The Signal travels to center and resolves into the Kova mark.
 */
export const FinalScene: React.FC<FinalSceneProps> = ({ onEnterApp }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const p = useScrollProgress(sectionRef, ['start end', 'end end']);

  const sunrise = useTransform(p, [0, 1], [0, 1]);
  const horizonGlow = useTransform(sunrise, (v) => v);
  const signalTravel = useTransform(p, [0.1, 0.55], ['46vw', '0vw']);
  const signalY = useTransform(p, [0.1, 0.55], ['18vh', '0vh']);
  const signalOpacity = useTransform(p, [0.35, 0.6], [1, 0]);
  const markOpacity = useTransform(p, [0.42, 0.62], [0, 1]);
  const markScale = useTransform(p, [0.42, 0.62], [0.86, 1]);
  const contentOpacity = useTransform(p, [0.55, 0.75], [0, 1]);
  const contentY = useTransform(p, [0.55, 0.8], [26, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[110svh] items-end justify-center overflow-hidden pt-32"
      aria-label="Tu mundo te espera"
    >
      {/* sunrise sky — silver dawn, multi-layer */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #070809 0%, #0C0F14 30%, #15181D 58%, #23282F 80%, #1B1F26 100%)',
        }}
        aria-hidden
      />
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: horizonGlow,
          background:
            'radial-gradient(ellipse 60% 40% at 50% 98%, rgba(237,241,245,.38) 0%, rgba(201,209,218,.16) 30%, transparent 70%)',
        }}
        aria-hidden
      />
      <motion.div
        className="kova-glow-breathe absolute left-1/2 bottom-[-10%] h-[34vh] w-[80vw] -translate-x-1/2"
        style={{
          opacity: horizonGlow,
          background:
            'radial-gradient(ellipse 48% 44% at 50% 100%, rgba(244,246,243,.5) 0%, rgba(237,241,245,.18) 45%, transparent 76%)',
          filter: 'blur(10px)',
        }}
        aria-hidden
      />
      {/* dawn rays */}
      <motion.div className="absolute inset-0" style={{ opacity: horizonGlow }} aria-hidden>
        {[
          { left: '38%', w: '1.6%', h: '52%', o: 0.10, skew: -8 },
          { left: '54%', w: '2.6%', h: '64%', o: 0.13, skew: 5 },
          { left: '70%', w: '1.2%', h: '46%', o: 0.09, skew: 14 },
        ].map((ray, i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{
              left: ray.left,
              width: ray.w,
              height: ray.h,
              opacity: ray.o,
              transform: `skewX(${ray.skew}deg)`,
              background: 'linear-gradient(180deg, transparent 0%, rgba(244,246,243,.6) 100%)',
              filter: 'blur(8px)',
            }}
          />
        ))}
      </motion.div>

      {/* ridges catching first light */}
      <div className="absolute inset-x-[-3%] bottom-0 h-[48vh]" aria-hidden>
        <svg viewBox="0 0 1440 480" preserveAspectRatio="none" className="h-full w-full" style={{ filter: 'blur(2px)' }}>
          <path d={RIDGE_FAR} fill="#1B1F26" opacity="0.9" />
        </svg>
      </div>
      <div className="absolute inset-x-[-3%] bottom-0 h-[40vh]" aria-hidden>
        <svg viewBox="0 0 1440 480" preserveAspectRatio="none" className="h-full w-full" style={{ filter: 'blur(1px)' }}>
          <path d={RIDGE_MID} fill="#15181D" />
        </svg>
      </div>
      <div className="absolute inset-x-[-3%] bottom-0 h-[30vh]" aria-hidden>
        <svg viewBox="0 0 1440 480" preserveAspectRatio="none" className="h-full w-full">
          <path
            d="M0,398 C120,368 220,392 340,364 C460,336 540,360 660,342 C780,324 860,348 980,330 C1100,312 1200,338 1320,318 C1370,310 1420,316 1440,310 L1440,480 L0,480 Z"
            fill="#0A0C0E"
          />
        </svg>
      </div>
      <div className="absolute inset-x-[-3%] bottom-0 h-[36vh]" aria-hidden>
        <svg viewBox="0 0 1440 480" preserveAspectRatio="none" className="h-full w-full">
          <path d={RIDGE_MID} fill="#15181D" />
        </svg>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-[14vh]"
        aria-hidden
        style={{ background: 'linear-gradient(180deg, transparent, rgba(7,8,9,.85))' }}
      />

      <AmbientParticles count={18} />

      {/* center stage: signal resolves into the mark */}
      <div className="relative z-10 flex w-full flex-col items-center pb-28">
        <div className="relative flex h-40 items-center justify-center">
          {!reduced && (
            <motion.div
              className="absolute"
              style={{ x: signalTravel, y: signalY, opacity: signalOpacity }}
              aria-hidden
            >
              <KovaSignal size={12} pulse={false} />
            </motion.div>
          )}
          <motion.div
            className="absolute flex items-center"
            style={{ opacity: reduced ? 1 : markOpacity, scale: reduced ? 1 : markScale }}
          >
            <img
              src="/kova-cube-monogram-v3.png"
              alt="Logo de Kova"
              className="h-16 w-16 object-contain drop-shadow-[0_0_28px_rgba(237,241,245,.22)] sm:h-20 sm:w-20"
            />
          </motion.div>
        </div>

        <motion.div
          className="mt-4 flex flex-col items-center text-center"
          style={reduced ? undefined : { opacity: contentOpacity, y: contentY }}
        >
          <h2 className="kova-display text-[clamp(2.6rem,7vw,5.4rem)] font-extrabold leading-[1.02] tracking-[-0.035em]">
            Tu mundo{' '}
            <span className="kova-serif italic font-normal text-[#EDF1F5]">te espera.</span>
          </h2>
          <p className="mt-5 max-w-md text-[14.5px] leading-7 text-[rgba(244,246,243,.62)]">
            La señal ya está encendida. Solo falta que entres.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3.5 sm:flex-row">
            <button
              type="button"
              onClick={() => onEnterApp('login')}
              className="kova-btn kova-btn-primary rounded-full px-8 py-3.5 text-[14.5px]"
            >
              Entrar a Kova
            </button>
            <a href="/downloads" className="kova-btn kova-btn-ghost rounded-full px-8 py-3.5 text-[14.5px]">
              Descargar Kova
            </a>
          </div>

          <p className="kova-scene-label mt-12" style={{ letterSpacing: '.32em' }}>
            Kova — Signal & Structure
          </p>
        </motion.div>
      </div>

      {/* footer */}
      <footer className="absolute inset-x-0 bottom-0 z-10 border-t border-[rgba(244,246,243,.06)]">
        <motion.div
          className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-[11.5px] text-[rgba(244,246,243,.45)] sm:flex-row sm:px-8"
          initial={reduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE }}
        >
          <p>© 2026 Kova</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Pie de página">
            <a href="#vivo" className="transition-colors hover:text-[#F4F6F3]">Vivo</a>
            <a href="#descubre" className="transition-colors hover:text-[#F4F6F3]">Descubrir</a>
            <a href="/downloads" className="transition-colors hover:text-[#F4F6F3]">Descargar</a>
            <button type="button" onClick={() => onEnterApp('login')} className="transition-colors hover:text-[#F4F6F3]">
              Iniciar sesión
            </button>
            <button type="button" onClick={() => onEnterApp('register')} className="transition-colors hover:text-[#F4F6F3]">
              Crear cuenta
            </button>
          </nav>
        </motion.div>
      </footer>
    </section>
  );
};
