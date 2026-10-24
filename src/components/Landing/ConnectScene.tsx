import React from 'react';
import { motion } from 'framer-motion';
import { SceneHeading } from './SceneHeading';
import { KovaSignal } from './KovaSignal';
import { ActivityPing } from './ActivityPing';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PEOPLE = [
  { initials: 'M', angle: 0, dist: 38, tint: '#15181D', floatDelay: '0s', label: 'Mara' },
  { initials: 'N', angle: 51, dist: 47, tint: '#1B1F26', floatDelay: '-1.8s', label: 'Nico' },
  { initials: 'A', angle: 103, dist: 41, tint: '#23282F', floatDelay: '-3.4s', label: 'Alex' },
  { initials: 'L', angle: 154, dist: 49, tint: '#15181D', floatDelay: '-2.6s', label: 'Luz' },
  { initials: 'R', angle: 206, dist: 44, tint: '#1B1F26', floatDelay: '-4.2s', label: 'Ríos' },
  { initials: 'S', angle: 257, dist: 38, tint: '#23282F', floatDelay: '-1.2s', label: 'Sol' },
  { initials: 'T', angle: 309, dist: 47, tint: '#15181D', floatDelay: '-5.1s', label: 'Teo' },
];

/**
 * SCENE 03 — CONNECT. One cohesive circular composition:
 * a voice core with people around it, arcs of conversation, quiet activity.
 */
export const ConnectScene: React.FC = () => {
  const reduced = useReducedMotion();

  return (
    <section id="conectar" className="relative py-28 sm:py-40" aria-label="Kova, mantente cerca">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{ background: 'linear-gradient(180deg, #070809 0%, #080B0A 55%, #070809 100%)' }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <SceneHeading
          index="03"
          name="Mantente cerca"
          title="Mantente cerca."
          serifWords={[1]}
          copy="Voz, mensajes y presencia — siempre a un paso de los tuyos."
        />

        <div className="relative mx-auto mt-20 aspect-square w-full max-w-[560px]">
          {/* faint structural circles */}
          <div className="absolute inset-0 rounded-full border border-[rgba(244,246,243,.05)]" aria-hidden />
          <div className="absolute inset-[14%] rounded-full border border-[rgba(244,246,243,.04)]" aria-hidden />

          {/* conversation arcs */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
            {PEOPLE.slice(0, 3).map((p, i) => {
              const rad = (p.angle * Math.PI) / 180 - Math.PI / 2;
              const x = 50 + Math.cos(rad) * p.dist * 0.62;
              const y = 50 + Math.sin(rad) * p.dist * 0.62;
              return (
                <motion.circle
                  key={p.initials + i}
                  cx={x}
                  cy={y}
                  r={1.1}
                  fill="none"
                  stroke="rgba(188,197,188,.14)"
                  strokeWidth={0.18}
                  initial={reduced ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, margin: '-18%' }}
                  transition={{ duration: 1.6, ease: EASE, delay: 0.4 + i * 0.3 }}
                />
              );
            })}
          </svg>

          {/* voice core with breathing waveform */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={reduced ? false : { opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-18%' }}
            transition={{ duration: 1.2, ease: EASE }}
          >
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full sm:h-28 sm:w-28"
              style={{
                background:
                  'radial-gradient(circle at 40% 34%, rgba(237,241,245,.30) 0%, rgba(154,163,174,.14) 45%, rgba(9,11,13,.9) 100%)',
                border: '1px solid rgba(237,241,245,.35)',
                boxShadow: '0 0 70px rgba(201,209,218,.16)',
              }}
            >
              <KovaSignal size={16} pulse />
            </div>
            <div className="mt-3 flex justify-center">
              <span className="flex items-end gap-[3px]" aria-hidden>
                {Array.from({ length: 16 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-[2.5px] rounded-full bg-[rgba(237,241,245,.55)] ${reduced ? '' : 'kova-wave-bar'}`}
                    style={{
                      height: `${6 + ((i * 7) % 14)}px`,
                      animationDelay: `${i * 0.09}s`,
                      animationDuration: `${1.2 + (i % 5) * 0.18}s`,
                    }}
                  />
                ))}
              </span>
            </div>
            <p className="mt-3 text-center text-[10.5px] font-semibold uppercase tracking-[.22em] text-[rgba(244,246,243,.5)]">
              Sala Norte · 7
            </p>
          </motion.div>

          {/* people around the core */}
          {PEOPLE.map((p, i) => {
            const rad = (p.angle * Math.PI) / 180 - Math.PI / 2;
            const left = `${50 + Math.cos(rad) * p.dist}%`;
            const top = `${50 + Math.sin(rad) * p.dist}%`;
            return (
              <motion.div
                key={p.initials + i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left, top }}
                initial={reduced ? false : { opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-18%' }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.55 + i * 0.14 }}
              >
                <div
                  className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(244,246,243,.12)] sm:h-12 sm:w-12 ${reduced ? '' : 'kova-float'}`}
                  style={{ background: p.tint, animationDelay: p.floatDelay }}
                  title={p.label}
                >
                  <span className="text-[13px] font-bold">{p.initials}</span>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#070809]"
                    style={{ background: '#70D7D0' }}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* ambient activity inside the composition */}
          <motion.div
            className="absolute -left-2 top-6 sm:left-4"
            initial={reduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1, ease: EASE, delay: 1.3 }}
          >
            <ActivityPing text="Alex entró a la sala" time="ahora" />
          </motion.div>
          <motion.div
            className="absolute -right-2 bottom-16 sm:right-4"
            initial={reduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1, ease: EASE, delay: 1.7 }}
          >
            <ActivityPing text="Maya empezó a transmitir" time="2 min" signal={false} />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
