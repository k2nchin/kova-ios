import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { SceneHeading } from './SceneHeading';
import { KovaSignal } from './KovaSignal';
import { ActivityPing } from './ActivityPing';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CHANNELS = [
  { name: 'general', unread: false },
  { name: 'ideas', unread: true },
  { name: 'diseno', unread: false },
  { name: 'senal-norte', unread: true },
  { name: 'archivos', unread: false },
];

const MEMBERS = [
  { initials: 'M', name: 'Mara', active: true, tint: '#15181D' },
  { initials: 'N', name: 'Nico', active: true, tint: '#23282F' },
  { initials: 'A', name: 'Alex', active: false, tint: '#1B1F26' },
  { initials: 'L', name: 'Luz', active: true, tint: '#15181D' },
  { initials: 'R', name: 'Ríos', active: true, tint: '#23282F' },
  { initials: 'S', name: 'Sol', active: false, tint: '#1B1F26' },
];

/** Small breathing waveform — the room feels audible. */
const Waveform: React.FC<{ bars?: number; reduced?: boolean }> = ({ bars = 12, reduced }) => (
  <span className="flex items-center gap-[3px]" aria-hidden>
    {Array.from({ length: bars }).map((_, i) => (
      <span
        key={i}
        className={`h-3 w-[2.5px] rounded-full bg-[rgba(237,241,245,.75)] ${reduced ? '' : 'kova-wave-bar'}`}
        style={{ animationDelay: `${i * 0.11}s`, animationDuration: `${1.1 + (i % 4) * 0.22}s` }}
      />
    ))}
  </span>
);

/**
 * Living product: the real interface breathing inside the environment —
 * a message arrives, someone reacts, presence pulses. Restrained, believable.
 */
export const LivingInterface: React.FC = () => {
  const windowRef = useRef<HTMLDivElement>(null);
  const inView = useInView(windowRef, { margin: '-25%' });
  const reduced = useReducedMotion();
  const [step, setStep] = useState(reduced ? 2 : 0);

  useEffect(() => {
    if (reduced) {
      setStep(2);
      return;
    }
    if (!inView) return;
    const timings = [1700, 2600, 2000, 1600, 3400];
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      setStep(index >= timings.length - 1 ? 0 : index + 1);
      index = index >= timings.length - 1 ? 0 : index + 1;
      timer = setTimeout(advance, timings[index]);
    };
    timer = setTimeout(advance, timings[0]);
    return () => clearTimeout(timer);
  }, [inView, reduced]);

  return (
    <section id="vivo" className="relative py-28 sm:py-40" aria-label="Kova, construida para sentirse viva">
      {/* environmental light */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 62% 38% at 50% 8%, rgba(154,163,174,.10) 0%, transparent 60%), linear-gradient(180deg, #070809 0%, #080B0A 30%, #070809 100%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <SceneHeading
          index="02"
          name="Construida para sentirse viva"
          title="Construida para sentirse viva."
          serifWords={[3, 4]}
          copy="Conversaciones, comunidades y momentos moviéndose juntos, en tiempo real."
        />

        <motion.div
          ref={windowRef}
          className="relative mx-auto mt-16 max-w-5xl"
          initial={reduced ? false : { opacity: 0, y: 56, clipPath: 'inset(12% 8% 12% 8% round 24px)' }}
          whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 24px)' }}
          viewport={{ once: true, margin: '-18%' }}
          transition={{ duration: 1.4, ease: EASE }}
        >
          {/* warm rim light behind the product */}
          <div
            className="absolute -inset-x-10 -top-14 h-32"
            aria-hidden
            style={{
              background:
                'radial-gradient(ellipse 46% 100% at 50% 0%, rgba(201,209,218,.20) 0%, transparent 70%)',
              filter: 'blur(10px)',
            }}
          />

          <div className="relative overflow-hidden rounded-3xl border border-[rgba(244,246,243,.1)] bg-[#12151A] shadow-[0_50px_120px_rgba(0,0,0,.65)]">
            {/* top light edge */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              aria-hidden
              style={{ background: 'linear-gradient(90deg, transparent, rgba(237,241,245,.55), transparent)' }}
            />

            <div className="grid grid-cols-1 md:grid-cols-[64px_1fr_1.6fr_230px]">
              {/* rail — quiet geometry, no server-circle cliché */}
              <div className="hidden flex-col items-center gap-4 border-r border-[rgba(244,246,243,.06)] py-6 md:flex">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-10 w-10 rounded-xl border ${
                      i === 1
                        ? 'border-[rgba(237,241,245,.45)] bg-[#15181D]'
                        : 'border-[rgba(244,246,243,.08)] bg-[rgba(244,246,243,.03)]'
                    }`}
                    style={i === 1 ? { boxShadow: '0 0 18px rgba(201,209,218,.14)' } : undefined}
                  >
                    {i === 1 && (
                      <div className="flex h-full items-center justify-center">
                        <KovaSignal size={5} pulse={false} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* channels */}
              <div className="border-b border-[rgba(244,246,243,.06)] p-5 md:border-b-0 md:border-r">
                <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[rgba(244,246,243,.38)]">
                  Comunidad
                </p>
                <div className="mt-4 space-y-3.5">
                  {CHANNELS.map((c) => (
                    <div key={c.name} className="flex items-center gap-2.5">
                      <span className="text-[12.5px] text-[rgba(244,246,243,.55)]">#</span>
                      <span className="text-[12.5px] text-[rgba(244,246,243,.8)]">{c.name}</span>
                      {c.unread && <KovaSignal size={5} pulse={false} />}
                    </div>
                  ))}
                  <div className="flex items-center gap-2.5 pt-2">
                    <KovaSignal size={6} pulse />
                    <span className="text-[12.5px] font-medium text-[#EDF1F5]">Sala Norte</span>
                    <Waveform bars={10} reduced={reduced} />
                    <span className="ml-auto flex -space-x-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className="h-4 w-4 rounded-md border border-[#12151A] bg-[#1B1F26]" />
                      ))}
                    </span>
                  </div>
                </div>
              </div>

              {/* conversation */}
              <div className="flex flex-col p-5">
                <div className="flex items-center justify-between border-b border-[rgba(244,246,243,.06)] pb-3.5">
                  <p className="text-[12px] font-semibold tracking-tight">Salón de comunidad</p>
                  <span className="flex items-center gap-1.5 text-[10px] text-[rgba(244,246,243,.42)]">
                    <KovaSignal size={4} pulse={false} /> en vivo
                  </span>
                </div>

                <div className="mt-4 flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 shrink-0 rounded-lg" style={{ background: '#15181D' }} />
                    <div>
                      <p className="text-[11px] font-semibold">
                        Nico <span className="ml-2 font-normal text-[rgba(244,246,243,.35)]">ahora</span>
                      </p>
                      <p className="mt-1 text-[12.5px] leading-5 text-[rgba(244,246,243,.78)]">
                        ¿Entramos a la sala para cerrar el diseño?
                      </p>
                    </div>
                  </div>

                  {/* animated activity: typing → message → reaction */}
                  <AnimatePresence mode="wait" initial={false}>
                    {step === 0 && (
                      <motion.div
                        key="typing"
                        className="flex items-center gap-2 pl-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <span className="flex items-center gap-1">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="kova-typing-dot h-1 w-1 rounded-full bg-[rgba(237,241,245,.8)]"
                              style={{ animationDelay: `${i * 0.16}s` }}
                            />
                          ))}
                        </span>
                        <span className="text-[10.5px] text-[rgba(244,246,243,.45)]">Mara está escribiendo…</span>
                      </motion.div>
                    )}
                    {step >= 1 && (
                      <motion.div
                        key="maya-message"
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.65, ease: EASE }}
                      >
                        <div
                          className="h-7 w-7 shrink-0 rounded-lg"
                          style={{ background: 'linear-gradient(135deg, #1B1F26, #23282F)' }}
                        />
                        <div>
                          <p className="text-[11px] font-semibold">
                            Mara <span className="ml-2 font-normal text-[rgba(244,246,243,.35)]">ahora</span>
                          </p>
                          <p className="mt-1 text-[12.5px] leading-5 text-[rgba(244,246,243,.78)]">
                            Sí — ya dejé el enlace en <span className="text-[#EDF1F5]">#ideas</span>.
                          </p>
                          {step >= 2 && (
                            <motion.span
                              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[rgba(244,246,243,.12)] bg-[rgba(244,246,243,.05)] px-2.5 py-1 text-[11px]"
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.45, ease: EASE }}
                            >
                              ✦ 3
                            </motion.span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {step >= 3 && (
                    <AnimatePresence>
                      <motion.div
                        key="presence"
                        className="flex items-center gap-2 pl-1 text-[11px] text-[rgba(244,246,243,.55)]"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: EASE }}
                      >
                        <KovaSignal size={5} pulse={false} />
                        Luz se unió a la conversación
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>

                {/* presence strip */}
                <div className="mt-5 flex items-center justify-between border-t border-[rgba(244,246,243,.06)] pt-3.5">
                  <div className="flex -space-x-2">
                    {MEMBERS.map((m) => (
                      <div
                        key={m.name}
                        className="relative h-6 w-6 rounded-lg border-2 border-[#12151A]"
                        style={{ background: m.tint }}
                        title={`${m.name}${m.active ? ' · en línea' : ''}`}
                      >
                        <span className="flex h-full items-center justify-center text-[9px] font-bold">
                          {m.initials}
                        </span>
                        {m.active && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#12151A]"
                            style={{ background: '#70D7D0' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-[rgba(244,246,243,.38)]">6 en el espacio</span>
                </div>
              </div>

              {/* live activity column */}
              <div className="hidden border-l border-[rgba(244,246,243,.06)] p-5 md:block">
                <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[rgba(244,246,243,.38)]">
                  Actividad
                </p>
                <div className="mt-4 space-y-3">
                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-12%' }}
                    transition={{ duration: 0.7, ease: EASE, delay: 1.1 }}
                  >
                    <ActivityPing text="Alex entró a la sala" time="ahora" />
                  </motion.div>
                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-12%' }}
                    transition={{ duration: 0.7, ease: EASE, delay: 1.35 }}
                  >
                    <ActivityPing text="Maya empezó a transmitir" time="2 min" />
                  </motion.div>
                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-12%' }}
                    transition={{ duration: 0.7, ease: EASE, delay: 1.6 }}
                  >
                    <ActivityPing text="Nightstars creó un evento" time="5 min" />
                  </motion.div>
                </div>
                <div className="mt-5 border-t border-[rgba(244,246,243,.06)] pt-4">
                  <p className="text-[10.5px] font-semibold text-[rgba(244,246,243,.7)]">4 amigos en línea</p>
                  <p className="mt-1 text-[10px] leading-4 text-[rgba(244,246,243,.4)]">
                    Presencia en tiempo real en cada espacio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
