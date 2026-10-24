import { RefObject } from 'react';
import { MotionValue, useScroll } from 'framer-motion';

type ScrollOptions = NonNullable<Parameters<typeof useScroll>[0]>;

/**
 * Thin scroll-progress wrapper so scenes share one convention.
 * Returns a 0..1 MotionValue driven by the element's journey through the viewport.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  offset?: ScrollOptions['offset']
): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target: ref, offset });
  return scrollYProgress;
}
