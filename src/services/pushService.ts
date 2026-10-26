// Web Push for the browser/PWA build (the desktop app uses native notifications).
import { api } from './apiClient';

const isTauri = () => typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

export const pushSupported = () =>
  !isTauri() && typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const toKey = (base64: string) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

const registration = async () => (await navigator.serviceWorker.getRegistration()) || navigator.serviceWorker.register('/sw.js');

export async function isPushEnabled() {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  return Boolean(await (await registration()).pushManager.getSubscription());
}

/** Asks permission (must run from a click) and registers this device. */
export async function enablePush() {
  if (!pushSupported()) throw new Error('Este navegador no admite notificaciones push. En iPhone, añade Kova a la pantalla de inicio primero.');
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('Permite las notificaciones de Kova en el navegador.');
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const { publicKey } = await api.getPushKey();
  const subscription = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey) });
  await api.subscribePush(subscription.toJSON());
}

export async function disablePush() {
  if (!pushSupported()) return;
  const subscription = await (await registration()).pushManager.getSubscription();
  if (!subscription) return;
  await api.unsubscribePush(subscription.endpoint).catch(() => undefined);
  await subscription.unsubscribe();
}

/** Keeps the server copy fresh after login (subscriptions can rotate). */
export async function refreshPush() {
  if (!(await isPushEnabled().catch(() => false))) return;
  const subscription = await (await registration()).pushManager.getSubscription();
  if (subscription) await api.subscribePush(subscription.toJSON()).catch(() => undefined);
}
