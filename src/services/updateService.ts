import { isDesktopApp } from '../utils/platform';

let updateCheckStarted = false;
const CHECK_EVERY_MS = 4 * 60 * 60 * 1000;

/**
 * Manual check (Ajustes → "Buscar actualizaciones"): downloads, installs and
 * restarts right away.
 */
export async function checkForKovaUpdate(
  onStatus?: (message: string) => void,
  options?: { manual?: boolean }
) {
  if (!isDesktopApp() || updateCheckStarted) return;
  updateCheckStarted = true;
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (!update) {
      if (options?.manual) onStatus?.('Kova ya está en su última versión.');
      return;
    }
    // Tauri verifies the minisign signature against the public key configured
    // in tauri.conf.json before this update object is returned.
    onStatus?.(`Kova ${update.version} está lista. Descargando actualización…`);
    let downloaded = 0;
    await update.downloadAndInstall((event) => {
      if (event.event === 'Progress') {
        downloaded += event.data.chunkLength;
        onStatus?.(`Descargando actualización… ${Math.round(downloaded / 1024 / 1024)} MB`);
      }
      if (event.event === 'Finished') onStatus?.('Actualización instalada. Reiniciando Kova…');
    });
    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
  } catch (error) {
    console.warn('[Kova updater]', error);
    onStatus?.('No se pudo actualizar Kova. La versión actual sigue intacta.');
  } finally {
    updateCheckStarted = false;
  }
}

export type LaunchUpdateState =
  | { phase: 'checking' }
  | { phase: 'downloading'; version: string; percent: number | null }
  | { phase: 'installing'; version: string };

/**
 * Launch check shown on the splash screen (like Discord): if there is a new
 * version it is downloaded, installed and Kova restarts; otherwise it resolves
 * so the app can open. Gives up quietly after `timeoutMs` without network.
 */
export async function checkAtLaunch(onState: (state: LaunchUpdateState) => void, timeoutMs = 6000) {
  if (!isDesktopApp() || updateCheckStarted) return;
  updateCheckStarted = true;
  try {
    onState({ phase: 'checking' });
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await Promise.race([
      check(),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!update) return;
    let total = 0;
    let done = 0;
    onState({ phase: 'downloading', version: update.version, percent: null });
    await update.downloadAndInstall((event) => {
      if (event.event === 'Started') total = event.data.contentLength || 0;
      if (event.event === 'Progress') {
        done += event.data.chunkLength;
        onState({ phase: 'downloading', version: update.version, percent: total ? Math.min(100, Math.round((done / total) * 100)) : null });
      }
      if (event.event === 'Finished') onState({ phase: 'installing', version: update.version });
    });
    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
  } catch (error) {
    console.warn('[Kova updater]', error);
  } finally {
    updateCheckStarted = false;
  }
}

/**
 * Discord-style background updates: checks at launch and every few hours,
 * downloads quietly, then offers a restart. Returns a stop function.
 */
export function startAutoUpdates(onReady: (version: string, restart: () => Promise<void>) => void) {
  if (!isDesktopApp()) return () => undefined;
  let stopped = false;
  let readyVersion = '';

  const run = async () => {
    if (stopped || readyVersion || updateCheckStarted) return;
    updateCheckStarted = true;
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (!update || stopped) return;
      await update.download();
      if (stopped) return;
      readyVersion = update.version;
      onReady(update.version, async () => {
        await update.install();
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
      });
    } catch (error) {
      console.warn('[Kova updater]', error);
    } finally {
      updateCheckStarted = false;
    }
  };

  // The launch screen already checked; next look is in a few hours.
  const timer = window.setInterval(() => void run(), CHECK_EVERY_MS);
  return () => { stopped = true; window.clearInterval(timer); };
}
