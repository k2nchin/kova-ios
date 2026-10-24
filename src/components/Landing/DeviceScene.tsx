import React from 'react';
import { motion } from 'framer-motion';
import { SceneHeading } from './SceneHeading';
import { KovaSignal } from './KovaSignal';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const SYNCED_MESSAGES = [
  { author: 'Mara', text: 'El directo empieza en cinco.', tint: '#1B1F26' },
  { author: 'Vos', text: 'Ya entré desde la web 🌐', tint: '#23282F', mine: true },
];

/**
 * SCENE 06 — DEVICES. Continuity, not a platform grid:
 * desktop at the center, web surface behind, phone arriving from the side.
 * Only real platforms: Windows app + web today.
 */
export const DeviceScene: React.FC = () => {
  const reduced = useReducedMotion();

  return (
    <section id="dispositivos" className="relative py-28 sm:py-40" aria-label="Kova, donde estés">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 55% 32% at 50% 34%, rgba(154,163,174,.09) 0%, transparent 62%), linear-gradient(180deg, #070809 0%, #080B0A 55%, #070809 100%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <SceneHeading
          index="06"
          name="Donde estés"
          title="Donde estés."
          serifWords={[1]}
          copy="La misma conversación, viva en tu escritorio y en el navegador. Tu gente te sigue a todos lados."
        />

        <div className="relative mx-auto mt-20 max-w-4xl pb-24 sm:pb-32">
          {/* web surface behind */}
          <motion.div
            className="absolute -right-4 -top-10 hidden w-72 rounded-2xl border border-[rgba(244,246,243,.07)] bg-[rgba(18,21,26,.5)] p-3 opacity-50 sm:block lg:-right-16"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 0.5, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1, ease: EASE, delay: 0.3 }}
            aria-hidden
          >
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[rgba(244,246,243,.2)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[rgba(244,246,243,.14)]" />
              <div className="ml-1 h-3 flex-1 rounded bg-[rgba(244,246,243,.06)]" />
            </div>
            <div className="mt-3 h-16 rounded-lg bg-[rgba(244,246,243,.04)]" />
          </motion.div>

          {/* desktop app window */}
          <motion.div
            className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[rgba(244,246,243,.1)] bg-[#12151A] shadow-[0_44px_110px_rgba(0,0,0,.6)]"
            initial={reduced ? false : { opacity: 0, y: 44 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1.2, ease: EASE }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              aria-hidden
              style={{ background: 'linear-gradient(90deg, transparent, rgba(237,241,245,.5), transparent)' }}
            />
            {/* window title */}
            <div className="flex items-center gap-2.5 border-b border-[rgba(244,246,243,.06)] px-4 py-2.5">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-full bg-[rgba(244,246,243,.16)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[rgba(244,246,243,.12)]" />
              </span>
              <p className="text-[10.5px] font-medium text-[rgba(244,246,243,.5)]">Kova para Windows</p>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-semibold"># directo</p>
                <span className="flex items-center gap-1.5 text-[10px] text-[rgba(244,246,243,.42)]">
                  <KovaSignal size={4} pulse={false} /> Sala abierta
                </span>
              </div>

              <div className="mt-4 space-y-3.5">
                {SYNCED_MESSAGES.map((m) => (
                  <div key={m.text} className={`flex items-start gap-3 ${m.mine ? 'flex-row-reverse' : ''}`}>
                    <div
                      className="h-7 w-7 shrink-0 rounded-lg"
                      style={{ background: m.tint }}
                      aria-hidden
                    />
                    <div className={m.mine ? 'text-right' : ''}>
                      <p className="text-[11px] font-semibold">{m.author}</p>
                      <p className="mt-1 inline-block rounded-xl border border-[rgba(244,246,243,.08)] bg-[rgba(244,246,243,.04)] px-3 py-1.5 text-[12px] leading-5 text-[rgba(244,246,243,.82)]">
                        {m.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* phone arriving from the side */}
          <motion.div
            className="absolute -bottom-2 right-2 sm:-bottom-6 sm:right-8 lg:right-20"
            initial={reduced ? false : { opacity: 0, y: 56, rotate: -10 }}
            whileInView={{ opacity: 1, y: 0, rotate: -5 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 1.3, ease: EASE, delay: 0.45 }}
          >
            <div
              className="w-[148px] rounded-[26px] border border-[rgba(244,246,243,.16)] bg-[#0C0F13] p-2 shadow-[0_34px_80px_rgba(0,0,0,.6)] sm:w-[168px]"
              role="img"
              aria-label="Kova web en el teléfono, misma conversación sincronizada"
            >
              <div className="rounded-[20px] bg-[#12151A] p-3">
                <div className="mx-auto h-1 w-8 rounded-full bg-[rgba(244,246,243,.16)]" aria-hidden />
                <div className="mt-3 flex items-center gap-2">
                  <KovaSignal size={4} pulse={false} />
                  <p className="text-[8.5px] font-semibold">kova web</p>
                </div>
                <div className="mt-3 space-y-2.5">
                  {SYNCED_MESSAGES.map((m) => (
                    <div key={`phone-${m.text}`} className={m.mine ? 'text-right' : ''}>
                      <p className="text-[7.5px] font-semibold text-[rgba(244,246,243,.6)]">{m.author}</p>
                      <p
                        className={`mt-0.5 inline-block rounded-lg border border-[rgba(244,246,243,.08)] px-2 py-1 text-[8.5px] leading-4 text-[rgba(244,246,243,.82)] ${
                          m.mine ? 'bg-[rgba(35,40,47,.25)]' : 'bg-[rgba(244,246,243,.05)]'
                        }`}
                      >
                        {m.text}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-[rgba(244,246,243,.06)] pt-2 text-center text-[7.5px] uppercase tracking-[.2em] text-[rgba(244,246,243,.35)]">
                  sincronizado
                </p>
              </div>
            </div>
          </motion.div>

          {/* honest platform line */}
          <motion.p
            className="mt-10 text-center text-[11.5px] text-[rgba(244,246,243,.42)]"
            initial={reduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 1, ease: EASE, delay: 0.8 }}
          >
            Windows y web, disponibles hoy. Android e iOS ya en camino.
          </motion.p>
        </div>
      </div>
    </section>
  );
};
