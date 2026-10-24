import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

const isTauri = () =>
  typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (isTauri()) {
      if (await isPermissionGranted()) return true;
      return (await requestPermission()) === 'granted';
    }

    // Browser / web fallback (used by the installed web build and the mobile webview when
    // the Tauri plugin is unavailable).
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  } catch (error) {
    console.warn('[Kova Notifications] No se pudo solicitar permiso:', error);
    return false;
  }
}

export async function showNotification(title: string, body: string): Promise<void> {
  try {
    if (isTauri()) {
      if (!(await requestNotificationPermission())) return;
      await sendNotification({ title, body });
      return;
    }

    if (!(await requestNotificationPermission())) return;
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification(title, { body });
    } else {
      new Notification(title, { body });
    }
  } catch (error) {
    console.warn('[Kova Notifications] No se pudo mostrar la notificación:', error);
  }
}