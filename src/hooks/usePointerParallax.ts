import { useEffect, useState } from 'react';
import { MotionValue, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

const SPRING = { stiffness: 42, damping: 18, mass: 0.9 };

export interface PointerParallax {
  /** Normalized pointer position, roughly -0.5..0.5 (damped). */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** False on touch devices or with reduced motion. */
  enabled: boolean;
}

/**
 * Subconscious pointer parallax: normalized coordinates smoothed by a spring.
 * Never attach raw pointer position to transforms — always read these springs.
 */
export function usePointerParallax(strength = 1): PointerParallax {
  const reduced = useReducedMotion();
  const [finePointer, setFinePointer] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
  );
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: fine)');
    const onChange = () => setFinePointer(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!finePointer || reduced) return;
    const onMove = (event: PointerEvent) => {
      rawX.set((event.clientX / window.innerWidth - 0.5) * strength);
      rawY.set((event.clientY / window.innerHeight - 0.5) * strength);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [finePointer, reduced, strength, rawX, rawY]);

  return { x, y, enabled: finePointer && !reduced };
}
