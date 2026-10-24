import { useEffect, useState } from 'react';

export interface LatestReleaseInfo {
  version: string;
  notes: string;
  pubDate: string | null;
  windowsUrl: string | null;
  windowsSha256: string | null;
}

const LATEST_FEED_URL = '/updates/latest.json';

export function useLatestRelease(): { release: LatestReleaseInfo | null; loading: boolean } {
  const [release, setRelease] = useState<LatestReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(LATEST_FEED_URL, { cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { version?: string; notes?: string; pub_date?: string; platforms?: Record<string, { url?: string; sha256?: string }> }) => {
        if (cancelled) return;
        const windows = data.platforms?.['windows-x86_64'];
        setRelease({
          version: data.version ?? '',
          notes: data.notes ?? '',
          pubDate: data.pub_date ?? null,
          windowsUrl: windows?.url ?? null,
          windowsSha256: windows?.sha256 ?? null,
        });
      })
      .catch(() => {
        // Keep static fallback constants when the feed is unavailable.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { release, loading };
}
