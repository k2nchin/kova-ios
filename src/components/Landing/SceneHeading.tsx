import React from 'react';
import { motion } from 'framer-motion';
import { KovaSignal } from './KovaSignal';
import { RevealText } from './RevealText';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface SceneHeadingProps {
  index: string;
  name: string;
  title: string;
  serifWords?: number[];
  copy?: string;
  align?: 'left' | 'center';
}

export const SceneHeading: React.FC<SceneHeadingProps> = ({
  index,
  name,
  title,
  serifWords,
  copy,
  align = 'center',
}) => {
  const reduced = useReducedMotion();
  const centered = align === 'center';

  return (
    <div className={`${centered ? 'mx-auto text-center' : 'text-left'} max-w-3xl`}>
      <motion.div
        className={`flex items-center gap-3 ${centered ? 'justify-center' : ''}`}
        initial={reduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-12%' }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <KovaSignal size={7} pulse />
        <p className="kova-scene-label">
          Escena {index} — {name}
        </p>
      </motion.div>

      <RevealText
        as="h2"
        text={title}
        serifWords={serifWords}
        className="kova-display mt-5 text-[clamp(2.4rem,6vw,4.6rem)] font-bold leading-[1.02] tracking-[-0.03em] text-[#F4F6F3]"
      />

      {copy && (
        <motion.p
          className={`mt-5 max-w-xl text-[15px] leading-7 text-[rgba(244,246,243,.62)] ${centered ? 'mx-auto' : ''}`}
          initial={reduced ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-12%' }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
        >
          {copy}
        </motion.p>
      )}
    </div>
  );
};
