import React, { useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { KovaSignal } from './KovaSignal';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * SIGNATURE TRANSITION — WORLD → SIGNAL → PERSON → KOVA.
 * A 260vh container with a sticky stage. Native scroll drives:
 * the world softens away, a signal grows into a presence dot,
 * and the interface fragments assemble around it.
 */
export const SignalIntro: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const p = useScrollProgress(sectionRef, ['start start', 'end end']);

  // World dissolves
  const worldOpacity = useTransform(p, [0, 0.3], [1, 0]);
  const worldBlur = useTransform(p, [0, 0.3], ['blur(0px)', 'blur(10px)']);
  const worldScale = useTransform(p, [0, 0.3], [1, 1.1]);

  // Signal emerges and grows
  const signalScale = useTransform(p, [0.12, 0.62], [1, 8.5]);
  const signalOpacity = useTransform(p, [0.05, 0.14, 0.55, 0.72], [0, 1, 1, 0]);
  const glowOpacity = useTransform(p, [0.2, 0.55], [0.25, 0.8]);

  // Labels across phases
  const labelAOpacity = useTransform(p, [0.06, 0.14, 0.24, 0.3], [0, 1, 1, 0]);
  const labelBOpacity = useTransform(p, [0.32, 0.42, 0.5], [0, 1, 0]);
  const labelCOpacity = useTransform(p, [0.6, 0.7, 0.78], [0, 1, 0]);

  // Presence + interface fragments
  const presenceOpacity = useTransform(p, [0.42, 0.52, 0.85, 0.95], [0, 1, 1, 0]);
  const presenceScale = useTransform(p, [0.42, 0.56], [0.85, 1]);
  const panelAOpacity = useTransform(p, [0.58, 0.68, 0.85, 0.95], [0, 1, 1, 0]);
  const panelAX = useTransform(p, [0.58, 0.72], ['-6vw', '0vw']);
  const panelBOpacity = useTransform(p, [0.62, 0.72, 0.85, 0.95], [0, 1, 1, 0]);
  const panelBX = useTransform(p, [0.62, 0.76], ['5vw', '0vw']);

  if (reduced) {
    return (
      <section ref={sectionRef} className="relative flex min-h-[110svh] items-center justify-center px-6">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-5">
            <KovaSignal size={16} pulse={false} />
            <p className="kova-scene-label">Una señal</p>
          </div>
          <div className="flex flex-col items-center gap-5">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(112,215,208,.35)]"
              style={{ background: 'radial-gradient(circle, rgba(201,209,218,.16), transparent 70%)' }}
            >
              <KovaSignal size={11} pulse={false} />
            </div>
            <p className="kova-scene-label">Una persona · En línea</p>
          </div>
          <h2 className="kova-display max-w-xl text-[clamp(1.8rem,4.5vw,3.2rem)] font-bold leading-tight tracking-[-0.03em]">
            Cada señal de Kova es una persona real.
          </h2>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[260svh]" aria-label="La señal de Kova">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* World remnant — denser environment */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: worldOpacity, filter: worldBlur, scale: worldScale }}
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, #070809 0%, #0B0E13 44%, #12151A 68%, #15181D 86%, #1B1F26 100%)',
            }}
          />
          <div
            className="kova-glow-breathe absolute left-1/2 h-[42vh] w-[90vw] -translate-x-1/2 bottom-[-12%]"
            style={{
              background:
                'radial-gradient(ellipse 50% 42% at 50% 100%, rgba(237,241,245,.22) 0%, rgba(201,209,218,.08) 42%, transparent 72%)',
              filter: 'blur(14px)',
            }}
          />
          <div
            className="kova-fog-a absolute inset-x-[-14%] bottom-[8%] h-[26vh]"
            style={{
              background:
                'radial-gradient(ellipse 55% 55% at 50% 60%, rgba(188,197,188,.12) 0%, transparent 75%)',
              filter: 'blur(18px)',
            }}
          />
          <svg
            viewBox="0 0 1440 480"
            preserveAspectRatio="none"
            className="absolute inset-x-[-3%] bottom-0 h-[46vh] w-[106%]"
          >
            <path
              d="M0,290 C110,246 200,272 310,228 C420,184 500,226 600,196 C700,168 790,214 890,182 C990,150 1080,196 1180,168 C1280,140 1370,180 1440,152 L1440,480 L0,480 Z"
              fill="#1B1F26"
              opacity="0.9"
            />
          </svg>
          <svg
            viewBox="0 0 1440 480"
            preserveAspectRatio="none"
            className="absolute inset-x-[-3%] bottom-0 h-[34vh] w-[106%]"
          >
            <path
              d="M0,398 C120,368 220,392 340,364 C460,336 540,360 660,342 C780,324 860,348 980,330 C1100,312 1200,338 1320,318 C1370,310 1420,316 1440,310 L1440,480 L0,480 Z"
              fill="#0A0C0E"
            />
          </svg>
        </motion.div>

        {/* Ambient warm glow growing with the signal */}
        <motion.div
          className="absolute h-[60vmin] w-[60vmin] rounded-full"
          style={{
            opacity: glowOpacity,
            background:
              'radial-gradient(circle, rgba(201,209,218,.22) 0%, rgba(154,163,174,.08) 40%, transparent 70%)',
          }}
          aria-hidden
        />

        {/* THE SIGNAL — grows into presence */}
        <motion.div
          className="relative flex items-center justify-center"
          style={{ scale: signalScale, opacity: signalOpacity }}
        >
          <KovaSignal size={12} pulse={false} />
        </motion.div>

        {/* Label A: a signal */}
        <motion.p
          className="kova-display absolute top-[30%] px-6 text-center text-[clamp(1.5rem,4vw,2.6rem)] font-semibold tracking-[-0.02em] text-[#EDF1F5]"
          style={{ opacity: labelAOpacity }}
        >
          Una señal.
        </motion.p>

        {/* Label B: a person */}
        <motion.p
          className="kova-display absolute top-[30%] px-6 text-center text-[clamp(1.5rem,4vw,2.6rem)] font-semibold tracking-[-0.02em]"
          style={{ opacity: labelBOpacity }}
        >
          Una persona.
        </motion.p>

        {/* Presence identity around the signal */}
        <motion.div
          className="absolute flex flex-col items-center gap-4"
          style={{ opacity: presenceOpacity, scale: presenceScale }}
        >
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full"
            style={{
              background:
                'radial-gradient(circle at 38% 32%, rgba(237,241,245,.28) 0%, rgba(154,163,174,.12) 45%, rgba(9,11,13,.85) 100%)',
              border: '1px solid rgba(112,215,208,.4)',
              boxShadow: '0 0 60px rgba(201,209,218,.12), inset 0 0 24px rgba(7,8,9,.6)',
            }}
          >
            <span className="kova-display text-2xl font-bold tracking-tight text-[#F4F6F3]">M</span>
            <span
              className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 rounded-full border-2 border-[#12151A]"
              style={{ background: 'radial-gradient(circle at 35% 30%, #F4F6F3 0%, #70D7D0 60%, #3FA9A2 100%)' }}
            />
          </div>
          <p className="text-[12.5px] font-medium text-[rgba(244,246,243,.78)]">
            Mara <span className="text-[#70D7D0]">· En línea</span>
          </p>
        </motion.div>

        {/* Interface fragment — conversation */}
        <motion.div
          className="absolute right-[8%] top-[24%] hidden w-72 rounded-2xl border border-[rgba(244,246,243,.09)] bg-[rgba(18,21,26,.88)] p-4 shadow-[0_30px_80px_rgba(0,0,0,.5)] sm:block"
          style={{ opacity: panelAOpacity, x: panelAX }}
          aria-hidden
        >
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[rgba(244,246,243,.4)]">
            # reunion
          </p>
          <div className="mt-3 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="h-6 w-6 rounded-md bg-[#1B1F26]" />
              <div>
                <p className="text-[11px] font-semibold">Mara</p>
                <p className="text-[11.5px] leading-5 text-[rgba(244,246,243,.62)]">Entramos a voz en cinco?</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="h-6 w-6 rounded-md bg-[#23282F]" />
              <div>
                <p className="text-[11px] font-semibold">Nico</p>
                <p className="text-[11.5px] leading-5 text-[rgba(244,246,243,.62)]">Listo, ya estoy dentro.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interface fragment — voice room */}
        <motion.div
          className="absolute bottom-[22%] left-[8%] hidden w-64 rounded-2xl border border-[rgba(244,246,243,.09)] bg-[rgba(18,21,26,.88)] p-4 shadow-[0_30px_80px_rgba(0,0,0,.5)] sm:block"
          style={{ opacity: panelBOpacity, x: panelBX }}
          aria-hidden
        >
          <div className="flex items-center gap-2.5">
            <KovaSignal size={8} pulse={false} />
            <p className="text-[11px] font-semibold">Sala Norte</p>
            <span className="text-[10px] text-[rgba(244,246,243,.42)]">3 en vivo</span>
          </div>
          <div className="mt-3 flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-7 w-7 rounded-lg border border-[rgba(244,246,243,.1)] bg-[#15181D]" />
            ))}
          </div>
        </motion.div>

        {/* Label C: your people */}
        <motion.p
          className="kova-display absolute bottom-[12%] px-6 text-center text-[clamp(1.35rem,3.4vw,2.2rem)] font-semibold tracking-[-0.02em] text-[#F4F6F3]"
          style={{ opacity: labelCOpacity }}
        >
          Tu gente, con vida propia.
        </motion.p>
      </div>
    </section>
  );
};
