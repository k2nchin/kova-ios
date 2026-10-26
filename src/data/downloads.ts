// Single source of truth for public download assets.
// Keep in sync with `public/updates/latest.json` (updater feed).

export const KOVA_VERSION = '1.0.27';

export const WINDOWS_INSTALLER_URL = 'https://kova-k2nchin.vercel.app/updates/Kova_1.0.27_x64-setup.exe';

export const WINDOWS_INSTALLER_SIZE_MB = '14.5 MB';

export type PlatformSupport = 'ready' | 'coming-soon';

export const PLATFORM_STATUS = {
  windows: 'ready' as PlatformSupport,
  android: 'coming-soon' as PlatformSupport,
  windowsPortable: 'coming-soon' as PlatformSupport,
  macos: 'coming-soon' as PlatformSupport,
  ios: 'coming-soon' as PlatformSupport,
};
