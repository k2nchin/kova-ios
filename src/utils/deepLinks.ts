// The deep-link plugin's getCurrent() keeps returning the URL Kova was opened
// with, so each URL is handled at most once per app run.
const handled = new Set<string>();

export const claimDeepLink = (url: string): boolean => {
  if (!url || handled.has(url)) return false;
  handled.add(url);
  return true;
};

/** Subscribes to deep links (initial + new). Safe if disposed before it resolves. */
export const listenDeepLinks = (onUrl: (url: string) => void): (() => void) => {
  let disposed = false;
  let unlisten: (() => void) | undefined;
  void import('@tauri-apps/plugin-deep-link').then(async ({ getCurrent, onOpenUrl }) => {
    if (disposed) return;
    const stop = await onOpenUrl((urls) => urls.forEach((url) => { if (claimDeepLink(url)) onUrl(url); }));
    if (disposed) { stop(); return; }
    unlisten = stop;
    (await getCurrent())?.forEach((url) => { if (!disposed && claimDeepLink(url)) onUrl(url); });
  }).catch(() => undefined);
  return () => { disposed = true; unlisten?.(); };
};
