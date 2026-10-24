type ErrorContext = { componentStack?: string; source?: string; details?: Record<string, unknown> };

const endpoint = `${import.meta.env.VITE_KOVA_API_URL || '/api'}/errors`;

export function reportKovaError(error: unknown, context: ErrorContext = {}): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const payload = {
    message: err.message.slice(0, 500),
    name: err.name,
    stack: err.stack?.slice(0, 5000),
    source: context.source || 'frontend',
    componentStack: context.componentStack?.slice(0, 3000),
    details: context.details,
    url: typeof window !== 'undefined' ? window.location.pathname : undefined,
    version: import.meta.env.VITE_APP_VERSION || '1.0.12',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    createdAt: new Date().toISOString(),
  };
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    } else void fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
  } catch { /* Reporting must never interrupt the application. */ }
}

export function installGlobalErrorReporting(): () => void {
  const onError = (event: ErrorEvent) => reportKovaError(event.error || event.message, { source: 'window' });
  const onRejection = (event: PromiseRejectionEvent) => reportKovaError(event.reason, { source: 'unhandledrejection' });
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => { window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection); };
}
