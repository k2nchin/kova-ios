import { useEffect, useState } from 'react';

export type VisitorPlatform = 'windows' | 'android' | 'macos' | 'ios' | 'linux' | 'unknown';

interface NavigatorUAData {
  platform?: string;
  mobile?: boolean;
}

function detectPlatform(): VisitorPlatform {
  if (typeof navigator === 'undefined') return 'unknown';

  // Modern Chromium-based browsers (including Android WebView / Tauri on Windows).
  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;
  if (uaData?.platform) {
    const p = uaData.platform.toLowerCase();
    if (p.includes('win')) return 'windows';
    if (p.includes('android')) return 'android';
    if (p.includes('mac')) return 'macos';
    if (p.includes('ios') || p.includes('ipad')) return 'ios';
    if (p.includes('linux') && !p.includes('android')) return 'linux';
  }

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('android')) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux') || ua.includes('x11')) return 'linux';
  return 'unknown';
}

export function usePlatform(): VisitorPlatform {
  const [platform, setPlatform] = useState<VisitorPlatform>('unknown');

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  return platform;
}
