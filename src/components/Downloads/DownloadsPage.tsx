import React, { useState } from 'react';
import { ArrowLeft, Check, Copy, Download, ExternalLink, FileArchive, ShieldCheck, Smartphone, Sparkles, Terminal } from 'lucide-react';
import { KOVA_VERSION, WINDOWS_INSTALLER_SIZE_MB, WINDOWS_INSTALLER_URL } from '../../data/downloads';
import { usePlatform, type VisitorPlatform } from '../../hooks/usePlatform';
import { useLatestRelease } from '../../hooks/useLatestRelease';

interface DownloadsPageProps {
  onBack: () => void;
  onEnterApp: (mode?: 'login' | 'register') => void;
}

const PLATFORM_LABELS: Record<VisitorPlatform, string> = {
  windows: 'Windows',
  android: 'Android',
  macos: 'macOS',
  ios: 'iOS',
  linux: 'Linux',
  unknown: '',
};

function formatPubDate(iso: string | null): string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({ onBack, onEnterApp }) => {
  const platform = usePlatform();
  const { release } = useLatestRelease();
  const [copied, setCopied] = useState(false);
  const isWindowsVisitor = platform === 'windows';

  const version = release?.version || KOVA_VERSION;
  const installerUrl = release?.windowsUrl || WINDOWS_INSTALLER_URL;
  const sha256 = release?.windowsSha256;

  const copySha256 = async () => {
    if (!sha256) return;
    try {
      await navigator.clipboard.writeText(sha256);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context); ignore silently.
    }
  };

  return (
  <div className="min-h-screen overflow-x-hidden bg-[#070809] text-white selection:bg-white selection:text-black">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.14),transparent_38%)]" />
    <div className="pointer-events-none fixed inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:56px_56px]" />
    <header className="relative z-10 border-b border-white/10 bg-white/[0.04] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Volver a Kova</button>
        <button onClick={() => onEnterApp('login')} className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold transition hover:bg-white/[0.08]">Iniciar sesión</button>
      </div>
    </header>
    <main className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <img src="/kova-chrome-cube.png" alt="Kova" className="mx-auto mb-7 h-16 w-16 object-contain" />
        <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-zinc-500">Kova para tus dispositivos</p>
        <h1 className="text-5xl font-black tracking-[-0.065em] sm:text-7xl">Descarga Kova.</h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">Tu gente, tus comunidades y tus conversaciones en un solo lugar. Elige tu plataforma y empieza en segundos.</p>
      </div>

      {platform !== 'unknown' && !isWindowsVisitor && (
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-sm text-zinc-300">
          Estás en {PLATFORM_LABELS[platform]}. Kova para {PLATFORM_LABELS[platform]} está en camino — mientras tanto puedes usar la <button onClick={() => onEnterApp('login')} className="font-bold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white">versión web</button>.
        </div>
      )}

      <section className="mx-auto mt-14 grid max-w-5xl gap-4 lg:grid-cols-[1.3fr_.7fr]">
        <article className={`relative overflow-hidden rounded-[32px] border bg-gradient-to-br from-white/[0.13] to-white/[0.045] p-7 shadow-2xl sm:p-9 ${isWindowsVisitor ? 'border-white/30 ring-1 ring-white/20' : 'border-white/20'}`}>
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/[0.08] blur-3xl" />
          <div className="relative flex h-full flex-col">
            <div className="mb-10 flex items-start justify-between gap-4"><div>{isWindowsVisitor && <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-black"><Check className="h-3 w-3" />Detectamos tu plataforma</div>}<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200"><Sparkles className="h-3.5 w-3.5" />Versión estable</div><h2 className="text-3xl font-black tracking-tight">Kova para Windows</h2><p className="mt-2 text-sm text-zinc-400">Instalador oficial para Windows 10 y 11.</p></div><div className="hidden rounded-2xl border border-white/10 bg-black/20 p-3 sm:block"><Download className="h-6 w-6 text-zinc-300" /></div></div>
            <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500"><span>v{version}</span><span>x64</span><span>Windows 10/11</span><span>{WINDOWS_INSTALLER_SIZE_MB}</span></div><a href={installerUrl} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-black transition hover:bg-zinc-200"><Download className="h-4 w-4" />Descargar instalador</a></div>
          </div>
        </article>
        <article className={`rounded-[32px] border p-7 sm:p-9 ${platform === 'android' ? 'border-white/25 bg-white/[0.06] ring-1 ring-white/15' : 'border-white/10 bg-white/[0.045]'}`}><Smartphone className="mb-8 h-6 w-6 text-zinc-300" /><h2 className="text-2xl font-black tracking-tight">Android</h2><p className="mt-2 text-sm leading-6 text-zinc-400">La versión móvil llegará próximamente con una experiencia táctil propia.</p><div className="mt-10 inline-flex rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-zinc-500">Próximamente</div></article>
      </section>

      {(release?.notes || sha256) && (
        <section className="mx-auto mt-5 max-w-5xl rounded-[32px] border border-white/10 bg-white/[0.04] p-7 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><Terminal className="h-5 w-5 text-zinc-300" /></div>
              <div>
                <p className="text-sm font-black tracking-tight">Novedades de v{version}</p>
                {release?.pubDate && <p className="mt-0.5 text-xs text-zinc-500">Publicado el {formatPubDate(release.pubDate)}</p>}
              </div>
            </div>
            <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200">Última versión</div>
          </div>
          {release?.notes && <p className="mt-5 text-sm leading-7 text-zinc-400">{release.notes}</p>}
          {sha256 && (
            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/25 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">SHA-256 del instalador</p>
                <button onClick={copySha256} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[11px] font-bold text-zinc-300 transition hover:bg-white/[0.08]">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? 'Copiado' : 'Copiar'}</button>
              </div>
              <p className="mt-2 break-all font-mono text-[11px] leading-5 text-zinc-500">{sha256}</p>
            </div>
          )}
        </section>
      )}

      <section className="mx-auto mt-5 grid max-w-5xl gap-4 sm:grid-cols-3">
        {[[ShieldCheck, 'Descarga segura', 'Instaladores oficiales de Kova.'], [Check, 'Actualizaciones', 'Recibe mejoras desde la aplicación.'], [FileArchive, 'Alternativas', 'Portable y otros formatos llegarán pronto.']].map(([Icon, title, detail]) => { const ItemIcon = Icon as React.ElementType; return <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><ItemIcon className="mb-5 h-5 w-5 text-zinc-400" /><p className="text-sm font-bold">{String(title)}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{String(detail)}</p></div>; })}
      </section>
      <div className="mx-auto mt-12 flex max-w-5xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 text-xs text-zinc-500 sm:flex-row"><p>¿Ya tienes Kova? Abre la aplicación web.</p><button onClick={() => onEnterApp('login')} className="inline-flex items-center gap-2 font-bold text-zinc-300 transition hover:text-white">Entrar a Kova <ExternalLink className="h-3.5 w-3.5" /></button></div>
    </main>
    <footer className="relative z-10 border-t border-white/[0.07] px-5 py-8 text-center text-xs text-zinc-600">KOVA · Comunicación hecha para sentirse humana</footer>
  </div>
  );
};
