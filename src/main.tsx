import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installGlobalErrorReporting } from './services/errorReporter';
import { installDesktopShell } from './utils/desktopShell';

installGlobalErrorReporting();
installDesktopShell();
import './index.css';
import './styles/chromeTheme.css';
import './styles/appShell.css';

// Register the offline shell only on deployed HTTPS builds (never in dev or
// inside the Tauri desktop app, which loads from a custom protocol).
if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('https')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Avatars whose URL is empty or broken show the person's initial instead of a broken image.
if (typeof window !== 'undefined') {
  const initialAvatar = (name: string) => {
    const letter = (name.trim()[0] || '?').toUpperCase().replace(/[<>&"']/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f4f5"/><stop offset="1" stop-color="#a1a1aa"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><text x="32" y="42" font-family="system-ui,sans-serif" font-size="28" font-weight="800" text-anchor="middle" fill="#09090b">${letter}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };
  const fix = (img: HTMLImageElement) => {
    if (img.dataset.kovaFallback) return;
    if (!img.alt) { img.classList.add('kova-img-broken'); return; } // decorative image: just hide it
    img.dataset.kovaFallback = '1';
    img.classList.remove('kova-img-broken');
    img.src = initialAvatar(img.alt);
  };
  window.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement) fix(event.target);
  }, true);
  const scan = (root: ParentNode) => root.querySelectorAll?.('img:not([src]), img[src=""]').forEach((n) => fix(n as HTMLImageElement));
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'attributes' && r.target instanceof HTMLImageElement) {
        const img = r.target;
        if (!img.getAttribute('src')) { delete img.dataset.kovaFallback; fix(img); }
        else if (img.dataset.kovaFallback && !img.src.startsWith('data:image/svg')) delete img.dataset.kovaFallback;
      }
      r.addedNodes.forEach((n) => { if (n instanceof HTMLImageElement) { if (!n.getAttribute('src')) fix(n); } else if (n instanceof Element) scan(n); });
    }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
}
