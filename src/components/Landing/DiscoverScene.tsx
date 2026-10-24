import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SceneHeading } from './SceneHeading';
import { KovaSignal } from './KovaSignal';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface Community {
  id: string;
  name: string;
  members: string;
  tagline: string;
  x: number;
  y: number;
  size: number;
  depth: 'near' | 'far';
}

const COMMUNITIES: Community[] = [
  { id: 'nebula', name: 'Nebula', members: '1.2k', tagline: 'Diseño y prototipos entre creadores.', x: 15, y: 28, size: 11, depth: 'near' },
  { id: 'estudio-norte', name: 'Estudio Norte', members: '840', tagline: 'Música en vivo y sesiones abiertas.', x: 40, y: 14, size: 8, depth: 'far' },
  { id: 'senal-viva', name: 'Señal Viva', members: '2.4k', tagline: 'Comunidad general de Kova en español.', x: 64, y: 30, size: 13, depth: 'near' },
  { id: 'cartografos', name: 'Cartógrafos', members: '310', tagline: 'Mundos abiertos y exploración.', x: 84, y: 18, size: 7, depth: 'far' },
  { id: 'taller', name: 'Taller', members: '560', tagline: 'Código, review y pair programming.', x: 26, y: 52, size: 9, depth: 'near' },
  { id: 'aurora', name: 'Aurora', members: '1.9k', tagline: 'Fotografía de paisaje y cielo.', x: 52, y: 60, size: 10, depth: 'near' },
  { id: 'eco', name: 'Eco', members: '420', tagline: 'Ambiente, clima y acción local.', x: 76, y: 56, size: 8, depth: 'far' },
  { id: 'medianoche', name: 'Medianoche', members: '95', tagline: 'Sala de voz nocturna, siempre abierta.', x: 9, y: 72, size: 6, depth: 'far' },
  { id: 'faros', name: 'Faros', members: '730', tagline: 'Mentoría y rutas de aprendizaje.', x: 36, y: 84, size: 7, depth: 'far' },
  { id: 'vector', name: 'Vector', members: '1.1k', tagline: 'Ilustración y arte vectorial.', x: 88, y: 80, size: 9, depth: 'near' },
  { id: 'pulso', name: 'Pulso', members: '450', tagline: 'Noticias y debates del día.', x: 67, y: 74, size: 7, depth: 'far' },
  { id: 'orbita', name: 'Órbita', members: '660', tagline: 'Astronomía para curiosos.', x: 12, y: 44, size: 6, depth: 'far' },
  { id: 'bruma', name: 'Bruma', members: '210', tagline: 'Escritura y relatos compartidos.', x: 47, y: 38, size: 6, depth: 'far' },
  { id: 'forja', name: 'Forja', members: '980', tagline: 'Hardware, DIY y talleres.', x: 93, y: 46, size: 8, depth: 'near' },
  { id: 'marea', name: 'Marea', members: '340', tagline: 'Surf, mar y costas.', x: 57, y: 92, size: 6, depth: 'far' },
  { id: 'atelier', name: 'Atelier', members: '520', tagline: 'Moda y diseño de autor.', x: 79, y: 92, size: 7, depth: 'far' },
  { id: 'cenit', name: 'Cenit', members: '1.5k', tagline: 'Running y vida activa.', x: 5, y: 12, size: 8, depth: 'near' },
  { id: 'umbral', name: 'Umbral', members: '150', tagline: 'Sonido experimental y ambient.', x: 92, y: 6, size: 5, depth: 'far' },
];

/** Faint constellation lines between the brightest signals. */
const CONSTELLATION_LINKS: [string, string][] = [
  ['nebula', 'senal-viva'],
  ['nebula', 'taller'],
  ['senal-viva', 'aurora'],
  ['senal-viva', 'forja'],
  ['aurora', 'vector'],
  ['cenit', 'nebula'],
];

/**
 * SCENE 05 — DISCOVER. Communities as signals in a wide quiet field.
 * Negative space, soft depth, slow drift. Focus one to reveal its world.
 */
export const DiscoverScene: React.FC = () => {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<Community | null>(null);

  return (
    <section id="descubre" className="relative py-28 sm:py-40" aria-label="Kova, encuentra tu señal">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 60% 30% at 72% 30%, rgba(154,163,174,.07) 0%, transparent 60%), linear-gradient(180deg, #070809 0%, #080B0A 55%, #070809 100%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <SceneHeading
          index="05"
          name="Encuentra tu señal"
          title="Encuentra tu señal."
          serifWords={[2]}
          copy="Miles de comunidades latiendo en silencio. Buscá la luz que se parezca a vos."
        />

        {/* the field */}
        <div className="relative mx-auto mt-14 h-[62vh] min-h-[420px] max-w-5xl overflow-hidden rounded-[32px] border border-[rgba(244,246,243,.06)]">
          {/* depth grid lines */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            aria-hidden
            style={{
              backgroundImage:
                'linear-gradient(rgba(188,197,188,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(188,197,188,.05) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }}
          />

          {/* constellation lines */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            {CONSTELLATION_LINKS.map(([fromId, toId], i) => {
              const from = COMMUNITIES.find((c) => c.id === fromId);
              const to = COMMUNITIES.find((c) => c.id === toId);
              if (!from || !to) return null;
              return (
                <motion.line
                  key={`${fromId}-${toId}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="rgba(188,197,188,.14)"
                  strokeWidth={0.18}
                  vectorEffect="non-scaling-stroke"
                  initial={reduced ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, margin: '-18%' }}
                  transition={{ duration: 1.6, ease: EASE, delay: 0.5 + i * 0.25 }}
                />
              );
            })}
          </svg>

          {COMMUNITIES.map((c, i) => {
            const isSelected = selected?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(isSelected ? null : c)}
                onFocus={() => setSelected(c)}
                aria-label={`Comunidad ${c.name}, ${c.members} personas`}
                className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-3 transition-transform duration-300 [transition-timing-function:cubic-bezier(.22,1,.36,1)] focus:outline-none"
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
              >
                <span
                  className="block"
                  style={{
                    animation: reduced
                      ? undefined
                      : `kova-drift ${11 + i * 1.7}s ease-in-out ${-i * 1.3}s infinite`,
                  }}
                >
                  <span
                    className={
                      c.depth === 'far'
                        ? 'block opacity-55 [filter:blur(1.2px)]'
                        : 'block'
                    }
                  >
                    <KovaSignal size={c.size} pulse={!reduced && c.depth === 'near'} />
                  </span>
                </span>
                <span
                  className={`mt-2 block text-[10.5px] font-medium tracking-wide transition-opacity duration-300 ${
                    isSelected ? 'text-[#EDF1F5] opacity-100' : 'text-[rgba(244,246,243,.55)] opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {c.name}
                </span>
              </button>
            );
          })}

          {/* community preview */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.id}
                className="absolute z-10 w-64 rounded-2xl border border-[rgba(244,246,243,.12)] bg-[rgba(9,11,13,.92)] p-4 shadow-[0_24px_70px_rgba(0,0,0,.55)]"
                style={{
                  left: `${Math.min(Math.max(selected.x, 18), 82)}%`,
                  top: `${Math.min(Math.max(selected.y, 20), 78)}%`,
                  transform: 'translate(-50%, 12px)',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.45, ease: EASE }}
                role="status"
              >
                <div className="flex items-center justify-between">
                  <p className="kova-display text-[13px] font-bold tracking-tight">{selected.name}</p>
                  <span className="text-[10px] text-[rgba(244,246,243,.45)]">{selected.members} personas</span>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-5 text-[rgba(244,246,243,.62)]">{selected.tagline}</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-[rgba(237,241,245,.7)]">
                  <KovaSignal size={4} pulse={false} />
                  {selected.depth === 'near' ? 'activa ahora' : 'descubriendo'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[.28em] text-[rgba(244,246,243,.3)]">
            Tocá una señal para ver su mundo
          </p>
        </div>
      </div>
    </section>
  );
};
