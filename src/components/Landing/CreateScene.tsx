import React from 'react';
import { motion } from 'framer-motion';
import { SceneHeading } from './SceneHeading';
import { KovaSignal } from './KovaSignal';
import { ActivityPing } from './ActivityPing';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FOUNDERS = [
  { initials: 'M', tint: '#15181D', pos: { left: '17%', top: '24%' }, delay: 0.5 },
  { initials: 'N', tint: '#1B1F26', pos: { left: '78%', top: '20%' }, delay: 0.62 },
  { initials: 'A', tint: '#23282F', pos: { left: '86%', top: '58%' }, delay: 0.74 },
  { initials: 'L', tint: '#15181D', pos: { left: '12%', top: '62%' }, delay: 0.86 },
];

const CHANNELS = [
  { name: 'general', x: '18%', y: '38%', delay: 1.0 },
  { name: 'proyectos', x: '62%', y: '18%', delay: 1.1 },
  { name: 'voz: encuentro', x: '70%', y: '44%', delay: 1.2 },
  { name: 'senal', x: '26%', y: '74%', delay: 1.3 },
  { name: 'eventos', x: '58%', y: '76%', delay: 1.4 },
];

/**
 * SCENE 04 — CREATE. A community assembling itself:
 * space → members → channels → event → activity.
 */
export const CreateScene: React.FC = () => {
  const reduced = useReducedMotion();

  return (
    <section className="relative py-28 sm:py-40" aria-label="Kova, construyan juntos">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 34% at 50% 50%, rgba(35,40,47,.14) 0%, transparent 65%), linear-gradient(180deg, #070809 0%, #080B0A 50%, #070809 100%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <SceneHeading
          index="04"
          name="Construyan juntos"
          title="Construyan algo juntos."
          serifWords={[2]}
          copy="Un espacio que se organiza solo: gente, canales y momentos que empiezan a latir."
        />

        {/* constellation stage */}
        <div className="relative mx-auto mt-20 h-[440px] max-w-3xl sm:h-[480px]">
          {/* connective lines */}
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {CHANNELS.map((c, i) => (
              <motion.line
                key={c.name}
                x1="50%"
                y1="50%"
                x2={c.x}
                y2={c.y}
                stroke="rgba(188,197,188,.12)"
                strokeWidth={1}
                initial={reduced ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: '-15%' }}
                transition={{ duration: 1.1, ease: EASE, delay: c.delay }}
                style={{ transformOrigin: 'center' }}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* central space */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={reduced ? false : { opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1, ease: EASE }}
          >
            <div
              className="relative flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-[26px] border border-[rgba(237,241,245,.4)]"
              style={{
                background:
                  'radial-gradient(circle at 42% 30%, rgba(237,241,245,.2) 0%, rgba(21,24,29,.9) 55%, rgba(8,18,12,.95) 100%)',
                boxShadow: '0 24px 70px rgba(0,0,0,.5), 0 0 50px rgba(201,209,218,.12)',
              }}
            >
              <KovaSignal size={10} pulse={false} />
              <p className="kova-display text-[11px] font-bold tracking-[.08em]">NEBULA</p>
              <p className="text-[9px] uppercase tracking-[.2em] text-[rgba(244,246,243,.45)]">espacio</p>
            </div>
          </motion.div>

          {/* members appear */}
          {FOUNDERS.map((f) => (
            <motion.div
              key={f.initials}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={f.pos}
              initial={reduced ? false : { opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: f.delay }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(244,246,243,.12)] text-[12px] font-bold"
                style={{ background: f.tint }}
              >
                {f.initials}
              </div>
            </motion.div>
          ))}

          {/* channels organize */}
          {CHANNELS.map((c) => (
            <motion.div
              key={c.name}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: c.x, top: c.y }}
              initial={reduced ? false : { opacity: 0, x: 8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 0.8, ease: EASE, delay: c.delay }}
            >
              <div className="flex items-center gap-2 rounded-full border border-[rgba(244,246,243,.09)] bg-[rgba(9,11,13,.8)] px-3 py-1.5">
                <span className="text-[10.5px] text-[rgba(237,241,245,.65)]">#</span>
                <span className="text-[11px] text-[rgba(244,246,243,.72)]">{c.name}</span>
              </div>
            </motion.div>
          ))}

          {/* event appears */}
          <motion.div
            className="absolute bottom-[6%] left-1/2 -translate-x-1/2"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.9, ease: EASE, delay: 1.65 }}
          >
            <div className="flex items-center gap-3 rounded-2xl border border-[rgba(237,241,245,.25)] bg-[rgba(18,21,26,.9)] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,.45)]">
              <KovaSignal size={7} pulse />
              <div>
                <p className="text-[11.5px] font-semibold">Noche de señal</p>
                <p className="text-[10px] text-[rgba(244,246,243,.45)]">Viernes · 21:00 · voz abierta</p>
              </div>
            </div>
          </motion.div>

          {/* ambient activity */}
          <motion.div
            className="absolute right-0 top-2 sm:right-6"
            initial={reduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1, ease: EASE, delay: 2 }}
          >
            <ActivityPing text="Nightstars creó un evento" time="hace un momento" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
