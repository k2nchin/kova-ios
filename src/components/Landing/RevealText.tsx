import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface RevealTextProps {
  text: string;
  className?: string;
  delay?: number;
  /** Word indices rendered in the editorial serif (e.g. the accent words). */
  serifWords?: number[];
  as?: 'span' | 'h1' | 'h2' | 'p';
}

/** Mask reveal: each word rises out of its own clip, staggered. */
export const RevealText: React.FC<RevealTextProps> = ({
  text,
  className,
  delay = 0,
  serifWords,
  as = 'span',
}) => {
  const reduced = useReducedMotion();
  const words = text.split(' ');
  const Tag = as as React.ElementType;

  if (reduced) {
    return (
      <Tag className={className}>
        {words.map((word, i) => (
          <React.Fragment key={`${word}-${i}`}>
            <span className={serifWords?.includes(i) ? 'kova-serif italic' : undefined}>{word}</span>
            {i < words.length - 1 ? ' ' : null}
          </React.Fragment>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden
          style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}
        >
          <motion.span
            style={{ display: 'inline-block', willChange: 'transform' }}
            className={serifWords?.includes(i) ? 'kova-serif italic' : undefined}
            initial={{ y: '115%' }}
            whileInView={{ y: '0%' }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.055 }}
          >
            {word}
            {i < words.length - 1 ? '\u00A0' : null}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
};
