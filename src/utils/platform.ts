const mobileUserAgent = /Android|iPhone|iPad|iPod/i;

export const isTauriApp = () =>
  typeof window !== 'undefined' && ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);

export const isMobileDevice = () =>
  typeof navigator !== 'undefined' && mobileUserAgent.test(navigator.userAgent);

export const isDesktopApp = () => isTauriApp() && !isMobileDevice();

export const isMobileApp = () => isTauriApp() && isMobileDevice();
