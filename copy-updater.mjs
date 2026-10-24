import { cpSync, existsSync, mkdirSync } from 'node:fs';

// Merge the update/download binaries into dist/ so Vercel can serve them,
// without embedding them into the desktop app bundle (Tauri only bundles `public/`).
mkdirSync('dist', { recursive: true });
for (const [source, destination, required] of [
  ['updater-static/updates', 'dist/updates', true],
  // Git does not preserve empty directories, so this optional path may be absent.
  ['updater-static/downloads', 'dist/downloads', false],
]) {
  if (!existsSync(source)) {
    if (required) throw new Error(`Missing required release assets directory: ${source}`);
    continue;
  }
  cpSync(source, destination, { recursive: true });
}
console.log('Updater assets copied to dist.');
