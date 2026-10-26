// Makes the desktop app behave like a native app instead of a web page:
// no browser context menu, reload/print/find/zoom shortcuts, back/forward,
// dragging images out, or links opening inside the window.
import { isDesktopApp } from './platform';

const isEditable = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest('input, textarea, [contenteditable="true"], [contenteditable=""]'));
};

// Kova's own command (http/https only) opens the system browser.
const openExternal = (url: string) => {
  if (!/^https?:/i.test(url)) return;
  void import('@tauri-apps/api/core')
    .then(({ invoke }) => invoke('open_external_url', { url }))
    .catch(() => undefined);
};

/** Keys a browser reacts to but Kova shouldn't (Ctrl/Cmd + key). */
const BLOCKED_CTRL_KEYS = new Set(['r', 'p', 's', 'u', 'f', 'g', 'h', 'j', 'l', 'o', 'n', 't', 'w', '+', '=', '-', '_', '0']);
const BLOCKED_KEYS = new Set(['F3', 'F5', 'F7', 'F12', 'BrowserBack', 'BrowserForward', 'BrowserRefresh', 'BrowserSearch', 'BrowserHome']);

export function installDesktopShell() {
  if (!isDesktopApp() || typeof window === 'undefined') return;
  document.documentElement.classList.add('is-desktop-app');

  // Right click: our own menus (they call preventDefault) and text fields only.
  window.addEventListener('contextmenu', (event) => {
    if (!isEditable(event.target)) event.preventDefault();
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key;
    const ctrl = event.ctrlKey || event.metaKey;
    if (BLOCKED_KEYS.has(key)) { event.preventDefault(); return; }
    if (event.altKey && (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home')) { event.preventDefault(); return; }
    if (!ctrl) return;
    const lower = key.toLowerCase();
    // Ctrl+Shift+I/J/C (inspector) and plain browser shortcuts.
    if (event.shiftKey && ['i', 'j', 'c'].includes(lower)) { event.preventDefault(); return; }
    // Text editing keeps its own shortcuts (Ctrl+Z, C, V, X, A…).
    if (BLOCKED_CTRL_KEYS.has(lower) && !(isEditable(event.target) && ['z', 'y', 'c', 'v', 'x', 'a'].includes(lower))) {
      event.preventDefault();
    }
  }, true);

  // Ctrl + wheel / pinch would zoom the whole window.
  window.addEventListener('wheel', (event) => { if (event.ctrlKey) event.preventDefault(); }, { passive: false });

  // Images and links can't be dragged out like on a web page.
  window.addEventListener('dragstart', (event) => {
    const element = event.target as HTMLElement | null;
    if (element instanceof HTMLImageElement || element?.closest('a')) event.preventDefault();
  });
  // Dropping a file anywhere must not open it in the window.
  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('drop', (event) => event.preventDefault());

  // External links open in the system browser; middle click never opens a window.
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement | null)?.closest('a[href]') as HTMLAnchorElement | null;
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (/^https?:/i.test(href) && new URL(href, window.location.href).origin !== window.location.origin) {
      event.preventDefault();
      openExternal(link.href);
    }
  }, true);
  document.addEventListener('auxclick', (event) => {
    if (event.button === 1 && (event.target as HTMLElement | null)?.closest('a[href]')) event.preventDefault();
  }, true);

  const nativeOpen = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    const href = url ? String(url) : '';
    if (/^https?:/i.test(href)) { openExternal(href); return null; }
    return nativeOpen(url, target, features);
  }) as typeof window.open;
}
