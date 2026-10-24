import React, { useEffect, useRef } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AmbientParticlesProps {
  className?: string;
  /** Desktop density; mobile uses ~40% of it. */
  count?: number;
  /** 0 = gold atmosphere, 1 = mixed with a few cyan motes. */
  cyanRatio?: number;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
  alpha: number;
  cyan: boolean;
}

/**
 * Sparse atmospheric motes: gold warmth with rare cyan signal specks.
 * Canvas + rAF, paused off-screen and on hidden tabs, cleaned up on unmount.
 */
export const AmbientParticles: React.FC<AmbientParticlesProps> = ({
  className,
  count = 26,
  cyanRatio = 0.14,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const density = Math.max(8, Math.round((isMobile ? count * 0.4 : count) / (reduced ? 2 : 1)));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let raf = 0;
    let running = true;
    let inView = true;
    let particles: Particle[] = [];

    const seed = (width: number, height: number) => {
      particles = Array.from({ length: density }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.7,
        speed: 0.06 + Math.random() * 0.16,
        drift: 6 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.14 + Math.random() * 0.4,
        cyan: i < density * cyanRatio,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed(rect.width, rect.height);
    };

    const draw = (t: number) => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      for (const p of particles) {
        const x = p.x + Math.sin(t * 0.00006 + p.phase) * p.drift;
        const y = p.y - ((t * 0.001 * p.speed * 6) % (rect.height + 40));
        const wrappedY = (y + rect.height + 40) % (rect.height + 40) - 20;
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.0012 + p.phase * 3);
        ctx.beginPath();
        ctx.arc(x, wrappedY, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.cyan
          ? `rgba(112,215,208,${(p.alpha * twinkle).toFixed(3)})`
          : `rgba(237,241,245,${(p.alpha * twinkle).toFixed(3)})`;
        ctx.fill();
      }
    };

    const loop = (t: number) => {
      if (running && inView) draw(t);
      raf = requestAnimationFrame(loop);
    };

    resize();

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
    });
    observer.observe(canvas);

    const onVisibility = () => {
      running = document.visibilityState === 'visible';
    };

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    if (reduced) {
      // Static single paint: atmosphere without motion.
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isMobile, reduced, count, cyanRatio]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ''}`}
      aria-hidden
    />
  );
};
