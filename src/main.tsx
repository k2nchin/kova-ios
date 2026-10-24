import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installGlobalErrorReporting } from './services/errorReporter';

installGlobalErrorReporting();
import './index.css';

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
