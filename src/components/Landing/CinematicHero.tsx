import React, { useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { KovaSignal } from './KovaSignal';
import { AmbientParticles } from './AmbientParticles';
import { RevealText } from './RevealText';
import { usePointerParallax } from '../../hooks/usePointerParallax';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const RIDGE_1 =
  'M0,214 C90,170 170,196 260,150 C350,104 430,148 520,118 C610,88 690,132 790,96 C890,60 970,110 1060,84 C1150,58 1230,96 1330,72 C1380,60 1420,74 1440,66 L1440,480 L0,480 Z';
const RIDGE_2 =
  'M0,290 C110,246 200,272 310,228 C420,184 500,226 600,196 C700,168 790,214 890,182 C990,150 1080,196 1180,168 C1280,140 1370,180 1440,152 L1440,480 L0,480 Z';
const RIDGE_3 =
  'M0,320 C110,272 190,306 300,266 C410,226 470,268 570,240 C670,212 760,252 860,226 C960,200 1040,238 1140,214 C1240,190 1330,224 1440,196 L1440,480 L0,480 Z';
const RIDGE_4 =
  'M0,368 C120,336 210,362 330,334 C450,306 530,332 650,314 C770,296 860,322 980,302 C1100,282 1200,312 1320,290 C1380,279 1420,288 1440,282 L1440,480 L0,480 Z';
const RIDGE_5 =
  'M0,398 C120,368 220,392 340,364 C460,336 540,360 660,342 C780,324 860,348 980,330 C1100,312 1200,338 1320,318 C1370,310 1420,316 1440,310 L1440,480 L0,480 Z';

interface CinematicHeroProps {
  onEnterApp: (mode?: 'login' | 'register') => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onEnterApp }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { x, y, enabled: parallax } = usePointerParallax(1);
  const reduced = useReducedMotion();

  const progress = useScrollProgress(sectionRef, ['start start', 'end start']);
  const contentOpacity = useTransform(progress, [0, 0.72], [1, 0]);
  const contentY = useTransform(progress, [0, 1], ['0vh', '-7vh']);
  const envScale = useTransform(progress, [0, 1], [1, 1.08]);
  const envDarken = useTransform(progress, [0, 0.85], [0, 0.55]);
  const horizonGlow = useTransform(progress, [0, 1], [1, 0.25]);

  // Damped parallax — tiny, subconscious displacement per layer
  const skyX = useTransform(x, (v) => (parallax ? v * -2 : 0));
  const skyY = useTransform(y, (v) => (parallax ? v * -1 : 0));
  const r1X = useTransform(x, (v) => (parallax ? v * -3 : 0));
  const r1Y = useTransform(y, (v) => (parallax ? v * -1.5 : 0));
  const r2X = useTransform(x, (v) => (parallax ? v * -4.5 : 0));
  const r2Y = useTransform(y, (v) => (parallax ? v * -2 : 0));
  const fogX = useTransform(x, (v) => (parallax ? v * -6 : 0));
  const fogY = useTransform(y, (v) => (parallax ? v * -2.5 : 0));
  const r3X = useTransform(x, (v) => (parallax ? v * -6 : 0));
  const r3Y = useTransform(y, (v) => (parallax ? v * -3 : 0));
  const r4X = useTransform(x, (v) => (parallax ? v * -7.5 : 0));
  const r4Y = useTransform(y, (v) => (parallax ? v * -4 : 0));
  const r5X = useTransform(x, (v) => (parallax ? v * -9 : 0));
  const r5Y = useTransform(y, (v) => (parallax ? v * -5 : 0));
  const contentX = useTransform(x, (v) => (parallax ? v * 5 : 0));

  return (
    <section id="inicio" ref={sectionRef} className="relative min-h-[100svh] overflow-hidden" aria-label="Kova, entra en tu mundo">
      {/* L1 — atmospheric night sky */}
      <motion.div className="absolute inset-0" style={{ x: skyX, y: skyY }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #070809 0%, #0B0E13 40%, #12151A 66%, #15181D 84%, #1B1F26 100%)',
          }}
        />
        {/* slow silver light band across the sky */}
        <div
          className={`kova-sky-band absolute inset-x-[-20%] top-[10%] h-[14vh] ${reduced ? '' : ''}`}
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(201,209,218,.06) 35%, rgba(237,241,245,.10) 50%, rgba(201,209,218,.06) 65%, transparent 100%)',
            filter: 'blur(24px)',
          }}
          aria-hidden
        />
      </motion.div>

      {/* L2 — horizon bloom: triple-layer light */}
      <motion.div className="absolute inset-0" style={{ opacity: horizonGlow }} aria-hidden>
        <div
          className="kova-glow-breathe absolute left-1/2 h-[62vh] w-[130vw] -translate-x-1/2 bottom-[-14%]"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 50% 100%, rgba(237,241,245,.20) 0%, rgba(201,209,218,.10) 40%, transparent 72%)',
            filter: 'blur(18px)',
          }}
        />
        <div
          className="kova-glow-breathe absolute left-1/2 h-[36vh] w-[70vw] -translate-x-1/2 bottom-[-10%]"
          style={{
            background:
              'radial-gradient(ellipse 46% 42% at 50% 100%, rgba(237,241,245,.30) 0%, rgba(201,209,218,.12) 45%, transparent 74%)',
            filter: 'blur(12px)',
            animationDelay: '-3s',
          }}
        />
        <div
          className="kova-glow-breathe absolute left-1/2 h-[18vh] w-[34vw] -translate-x-1/2 bottom-[-6%]"
          style={{
            background:
              'radial-gradient(ellipse 50% 46% at 50% 100%, rgba(244,246,243,.42) 0%, rgba(237,241,245,.16) 48%, transparent 76%)',
            filter: 'blur(6px)',
            animationDelay: '-6s',
          }}
        />

        {/* god rays rising from the horizon */}
        {[
          { left: '30%', w: '2.4%', h: '58%', o: 0.10, skew: -10 },
          { left: '46%', w: '1.4%', h: '72%', o: 0.14, skew: -6 },
          { left: '62%', w: '3.2%', h: '50%', o: 0.08, skew: 8 },
          { left: '74%', w: '1.1%', h: '64%', o: 0.10, skew: 12 },
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
              background: 'linear-gradient(180deg, transparent 0%, rgba(237,241,245,.55) 100%)',
              filter: 'blur(7px)',
            }}
          />
        ))}
      </motion.div>

      {/* L3 — five ridge layers, atmospheric perspective */}
      <motion.div className="absolute inset-x-[-3%] bottom-0 h-[58vh]" style={{ x: r1X, y: r1Y, scale: envScale, opacity: horizonGlow }} aria-hidden>
        <svg viewBox="0 0 1440 480" preserveAspectRatio="none" className="h-full w-full" style={{ filter: 'blur(3px)' }}>
          <path d={RIDGE_1} fill="#15181D" opacity="0.85" />
        </svg>
      </motion.div>
      <motion.div className="absolute inset-x-[-3%] bottom-0 h-[50vh]" style={{ x: r2X, y: r2Y, scale: envScale, opacity: horizonGlow }} aria-hidden>
        <svg viewBox="0 0 1440 480" preserveAspectRatio="none" className="h-full w-full" style={{ filter: 'blur(2px)' }}>
          <path d={RIDGE_2} fill="#1B1F26" opacity="0.8" />
        </svg>
      </motion.div>

      {/* L4 — volumetric fog between ridges */}
      <motion.div className="absolute inset-0" style={{ x: fogX, y: fogY }} aria-hidden>
        <div
          className="kova-fog-a absolute inset-x-[-14%] bottom-[10%] h-[34vh]"
          style={{
            background:
              'radial-gradient(ellipse 55% 55% at 50% 60%, rgba(188,197,188,.14) 0%, rgba(188,197,188,.05) 45%, transparent 75%)',
            filter: 'blur(16px)',
          }}
        />
        <div
          className="kova-fog-b absolute inset-x-[-14%] bottom-[18%] h-[24vh]"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 45% 55%, rgba(201,209,218,.10) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <div
          className="kova-fog-a absolute inset-x-[-14%] bottom-[4%] h-[20vh]"
          style={{
            background:
              'radial-gradient(ellipse 65% 60% at 55% 60%, rgba(35,40,47,.35) 0%, transparent 72%)',
            filter: 'blur(24px)',
            animationDelay: '-9s',
          }}
        />
      </motion.div>

      <motion.div className="absolute inset-x-[-3%] bottom-0 h-[42vh]" style={{ x: r3X, y: r3Y, scale: envScale }} aria-hidden>
        <svg viewBox="0 0 1440 480" preserveAspectRatio="none" className="h-full w-full" style={{ filter: 'blur(1px)' }}>
          <path d={RIDGE_3} fill="#1B1F26" opacity="0.95" />
        </svg>
      </motion.div>
      <motion.div className="absolute inset-x-[-4%] bottom-0 h-[34vh]" style={{ x: r4X, y: r4Y, scale: envScale }} aria-hidden>
        <svg viewBox="0 0 1440 480" preserveAspectRatio="none" className="h-full w-full">
          <path d={RIDGE_4} fill="#0A0C0E" opacity="0.96" />
        </svg>
      </motion.div>
      <motion.div
        className="absolute inset-x-[-4%] bottom-0 h-[26vh]"
        style={{ x: r5X, y: r5Y, scale: envScale }}
        aria-hidden
      >
        <svg viewBox="0 0 1440 480" preserveAspectRatio="none" className="h-full w-full">
          <path d={RIDGE_5} fill="#070809" />
        </svg>
      </motion.div>

      {/* foreground occlusion + valley haze */}
      <div
        className="absolute inset-x-0 bottom-0 h-[18vh]"
        aria-hidden
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(7,8,9,.94) 80%, #070809 100%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-[14vh] h-[10vh]"
        aria-hidden
        style={{
          background: 'linear-gradient(180deg, rgba(201,209,218,.05), transparent)',
          filter: 'blur(10px)',
        }}
      />

      {/* L6 — atmospheric motes */}
      <AmbientParticles count={46} />

      {/* darken overlay as you scroll away */}
      <motion.div className="absolute inset-0 bg-[#070809] pointer-events-none" style={{ opacity: envDarken }} aria-hidden />

      {/* L7 — content */}
      <motion.div
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-5xl flex-col items-center justify-center px-6 text-center"
        style={{ opacity: contentOpacity, y: contentY, x: contentX }}
      >
        <motion.div
          className="flex items-center gap-3"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: EASE, delay: 0.35 }}
        >
          <KovaSignal size={9} pulse />
          <p className="kova-scene-label">Señal & Estructura</p>
        </motion.div>

        <div className="relative">
          <RevealText
            as="h1"
            text="KOVA"
            delay={0.15}
            className="kova-display mt-6 select-none text-[clamp(4.6rem,17vw,15rem)] font-extrabold leading-[0.9] tracking-[-0.045em] text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#F4F6F3] to-[#9AA3AE]"
          />
          <div
            className="pointer-events-none absolute inset-x-[16%] -inset-y-4 -z-10"
            aria-hidden
            style={{
              background: 'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(237,241,245,.10) 0%, transparent 70%)',
              filter: 'blur(18px)',
            }}
          />
        </div>

        <motion.p
          className="mt-7 text-[clamp(1.1rem,2.8vw,1.65rem)] font-medium leading-snug text-[rgba(244,246,243,.82)]"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.85 }}
        >
          Tu mundo. Tu gente.{' '}
          <span className="kova-serif italic text-[#EDF1F5]">Tu señal.</span>
        </motion.p>

        <motion.div
          className="mt-11 flex flex-col items-center gap-3.5 sm:flex-row"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE, delay: 1.05 }}
        >
          <button
            type="button"
            onClick={() => onEnterApp('login')}
            className="kova-btn kova-btn-primary rounded-full px-8 py-3.5 text-[14.5px]"
          >
            Entrar a Kova
          </button>
          <a href="/downloads" className="kova-btn kova-btn-ghost rounded-full px-8 py-3.5 text-[14.5px]">
            Descargar
          </a>
        </motion.div>

        <motion.p
          className="mt-9 text-[10.5px] font-semibold uppercase tracking-[.3em] text-[rgba(244,246,243,.36)]"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.35 }}
        >
          Windows · Web — Gratis
        </motion.p>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        className="absolute inset-x-0 bottom-7 z-10 flex flex-col items-center gap-2.5"
        style={{ opacity: contentOpacity }}
        aria-hidden
      >
        <div
          className="h-10 w-px"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(237,241,245,.6))' }}
        />
        <span className="text-[10px] font-semibold uppercase tracking-[.3em] text-[rgba(244,246,243,.4)]">
          Desliza
        </span>
      </motion.div>
    </section>
  );
};
