import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

/** True when the user asked the OS for reduced motion. */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}
