import { useEffect, useLayoutEffect, useRef } from 'react';

/** Back navigations we trigger ourselves; listeners must ignore them. */
let selfPops = 0;

/**
 * iOS-style interactive "swipe from the left edge to go back".
 * The element follows the finger with transforms only (compositor, 60 fps)
 * and completes or springs back on release.
 */
export function useEdgeSwipeBack<T extends HTMLElement>(enabled: boolean, onBack: () => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onBack);
  useLayoutEffect(() => { cb.current = onBack; });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const EDGE = 24;
    let startX = 0, startY = 0, dx = 0, lastX = 0, lastT = 0, velocity = 0;
    let tracking = false, locked = false, frame = 0;

    const apply = () => {
      frame = 0;
      el.style.transform = `translate3d(${dx}px,0,0)`;
      el.style.boxShadow = '-18px 0 40px rgba(0,0,0,.45)';
    };
    const reset = (animate: boolean) => {
      el.style.transition = animate ? 'transform .25s cubic-bezier(.2,.8,.2,1)' : '';
      el.style.transform = '';
      const done = () => { el.style.transition = ''; el.style.boxShadow = ''; el.style.willChange = ''; };
      if (animate) setTimeout(done, 260); else done();
    };

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (e.touches.length !== 1 || t.clientX > EDGE) return;
      tracking = true; locked = false;
      startX = lastX = t.clientX; startY = t.clientY; dx = 0; velocity = 0; lastT = e.timeStamp;
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      const mx = t.clientX - startX, my = t.clientY - startY;
      if (!locked) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        if (Math.abs(my) > Math.abs(mx) || mx < 0) { tracking = false; return; }
        locked = true;
        el.style.transition = '';
        el.style.willChange = 'transform';
      }
      e.preventDefault();
      const dt = Math.max(1, e.timeStamp - lastT);
      velocity = (t.clientX - lastX) / dt;
      lastX = t.clientX; lastT = e.timeStamp;
      dx = Math.max(0, mx);
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      if (!locked) return;
      const width = el.offsetWidth || window.innerWidth;
      if (dx > width * 0.35 || velocity > 0.5) {
        el.style.transition = 'transform .2s ease-out';
        el.style.transform = `translate3d(${width}px,0,0)`;
        setTimeout(() => { cb.current(); reset(false); }, 190);
      } else {
        reset(true);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
      if (frame) cancelAnimationFrame(frame);
      reset(false);
    };
  }, [enabled]);

  return ref;
}

/** Drag a bottom sheet down (by its grabber/top area) to dismiss it. */
export function useSheetDragDismiss<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onClose);
  useLayoutEffect(() => { cb.current = onClose; });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startY = 0, dy = 0, active = false;
    const onStart = (e: TouchEvent) => {
      const rect = el.getBoundingClientRect();
      if (e.touches[0].clientY - rect.top > 56) return; // only the top handle area
      active = true; startY = e.touches[0].clientY; dy = 0;
      el.style.transition = '';
    };
    const onMove = (e: TouchEvent) => {
      if (!active) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      e.preventDefault();
      el.style.transform = `translate3d(0,${dy}px,0)`;
    };
    const onEnd = () => {
      if (!active) return;
      active = false;
      if (dy > el.offsetHeight * 0.25) {
        el.style.transition = 'transform .2s ease-out';
        el.style.transform = 'translate3d(0,100%,0)';
        setTimeout(() => cb.current(), 180);
      } else {
        el.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = '';
      }
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  });

  return ref;
}

/**
 * Keeps `--kova-vvh` equal to the visible viewport height so the composer
 * stays above the iOS keyboard instead of being covered by it.
 */
export function useVisualViewportHeight(enabled: boolean) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!enabled || !vv) return;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      root.style.setProperty('--kova-vvh', `${Math.round(vv.height)}px`);
      root.classList.toggle('kova-keyboard-open', window.innerHeight - vv.height > 120);
      if (vv.offsetTop) window.scrollTo(0, 0);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
    return () => {
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
      if (frame) cancelAnimationFrame(frame);
      root.style.removeProperty('--kova-vvh');
      root.classList.remove('kova-keyboard-open');
    };
  }, [enabled]);
}

/**
 * Maps the system Back action (Android back button, browser back) onto the
 * in-app stack: while a screen is pushed we keep one history entry for it.
 */
export function useBackButton(active: boolean, onBack: () => void) {
  const cb = useRef(onBack);
  useLayoutEffect(() => { cb.current = onBack; });
  useEffect(() => {
    if (!active) return;
    const marker = { kovaMobilePushed: Date.now() };
    window.history.pushState(marker, '');
    let popped = false;
    const onPop = () => {
      if (selfPops > 0) { selfPops -= 1; return; }
      popped = true; cb.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Closed from the UI: drop the entry we added so Back doesn't need two taps.
      if (!popped && window.history.state?.kovaMobilePushed === marker.kovaMobilePushed) {
        selfPops += 1;
        window.history.back();
      }
    };
  }, [active]);
}
