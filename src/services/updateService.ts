import { isDesktopApp } from '../utils/platform';

let updateCheckStarted = false;

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
