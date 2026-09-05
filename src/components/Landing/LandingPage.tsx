import React, { useState } from 'react';
import {
  Download,
  Sparkles,
  Shield,
  ShieldCheck,
  Bot,
  Zap,
  Volume2,
  Terminal,
  Cpu,
  Palette,
  ExternalLink,
  ChevronRight,
  Monitor,
  HardDrive,
  Play,
  ArrowRight,
  CheckCircle2,
  Layers,
  Flame,
  Radio,
  Gamepad2,
  Code2,
} from 'lucide-react';
import { toast } from 'sonner';
import { soundFx } from '../../utils/soundEffects';
import { openExternalUrl } from '../../utils/googleRealAuth';
import { BackgroundTheme } from '../Themes/ThemeBackground';
import { useApp } from '../../context/AppContext';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const playClickSound = () => {
  try {
    soundFx.playReactionAdded();
  } catch {}
};

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const { theme, setTheme } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'ai_bots' | 'themes' | 'specs'>('overview');
  const [downloadCount, setDownloadCount] = useState(148);

  const handleDownloadInstaller = () => {
    soundFx.playReactionAdded();
    setDownloadCount((prev) => prev + 1);
    toast.success('Iniciando descarga de Kova-v1.0.0-Setup.exe');
    const link = document.createElement('a');
    link.href = '/downloads/Kova-v1.0.0-Setup.exe';
    link.download = 'Kova-v1.0.0-Setup.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPortable = () => {
    soundFx.playReactionAdded();
    setDownloadCount((prev) => prev + 1);
    toast.success('Iniciando descarga de Kova-v1.0.0-Windows-Portable.zip');
    const link = document.createElement('a');
    link.href = '/downloads/Kova-v1.0.0-Windows-Portable.zip';
    link.download = 'Kova-v1.0.0-Windows-Portable.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const themesList: { id: BackgroundTheme; name: string; color: string; desc: string }[] = [
    { id: 'crimson', name: 'Dark Carmesí', color: '#e11d48', desc: 'Negro obsidiana con luna de sangre y acentos rubí' },
    { id: 'abyss', name: 'Abyssal Blue', color: '#0284c7', desc: 'Profundidad de medianoche marina con cian eléctrico' },
    { id: 'emerald', name: 'Emerald Void', color: '#059669', desc: 'Bosque de coníferas nocturno y verde jade místico' },
    { id: 'amethyst', name: 'Amethyst Void', color: '#9333ea', desc: 'Obsidiana gótica con destellos púrpura y amatista' },
    { id: 'amber', name: 'Cyber Amber', color: '#d97706', desc: 'Carbón volcánico profundo con oro eclipse fundido' },
    { id: 'oled', name: 'OLED Puro', color: '#38bdf8', desc: 'Negro absoluto 0% luz con contraste de alto impacto' },
    { id: 'discord', name: 'Discord Dark', color: '#5865F2', desc: 'Gris azulado clásico con acentos blurple oficiales' },
  ];

  return (
    <div className="min-h-screen w-full bg-[#07090e] text-[#f4f7fb] selection:bg-purple-500/30 font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden relative">
      {/* Dynamic Background Auras */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 left-1/4 w-[650px] h-[650px] bg-purple-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-[550px] h-[550px] bg-cyan-500/12 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 -left-20 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090c14]/80 border-b border-white/[0.07] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b0d14] rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider text-white font-['Outfit']">
                  KOVA <span className="text-cyan-400">OS</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Next-Gen Voice, Chat & AI Engine</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#ai" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>IA & Bots</span>
            </a>
            <a href="#security" className="hover:text-white transition-colors">Seguridad 2FA</a>
            <a href="#themes" className="hover:text-white transition-colors">Temas Oscuros</a>
            <a href="#downloads" className="hover:text-white transition-colors text-purple-400 font-bold">Descargas</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundFx.playReactionAdded();
                openExternalUrl('https://github.com/k2nchin/kova');
              }}
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition-all cursor-pointer hidden sm:flex items-center gap-1.5 text-xs font-semibold"
              title="Ver código fuente en GitHub"
            >
              <GithubIcon className="w-4 h-4" />
              <span className="hidden lg:inline">GitHub</span>
            </button>

            <button
              onClick={() => {
                soundFx.playReactionAdded();
                onEnterApp();
              }}
              className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold border border-white/[0.12] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
              <span>Lanzar Web App</span>
            </button>

            <a
              href="#downloads"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all cursor-pointer flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .exe</span>
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-indigo-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium mb-6 shadow-inner backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>¡Lanzamiento Oficial de Kova Desktop v1.0.0 para Windows!</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white font-['Outfit'] max-w-5xl mx-auto leading-[1.1] mb-6">
          Comunícate, colabora y crea con{' '}
          <span className="bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            IA de Ultra Baja Latencia.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          Kova reinventa los espacios de trabajo comunitarios con un motor en <strong>Rust (Tauri v2)</strong>, canales de voz espaciales con DSP de <strong>1.1ms</strong>, integración nativa de <strong>Google Gemini Flash</strong>, bots estilo Discord personalizables y <strong>autenticación 2FA</strong> militar.
        </p>

        {/* Hero CTA Download Hub Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          {/* Main Direct Setup Download Button */}
          <button
            onClick={handleDownloadInstaller}
            className="px-7 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-3 group"
          >
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            <div className="text-left">
              <div className="font-extrabold leading-tight">Descargar Instalador Windows</div>
              <div className="text-[11px] text-purple-200 font-mono font-normal">Kova-v1.0.0-Setup.exe • ~2.1 MB</div>
            </div>
          </button>

          {/* Portable Zip Direct Download Button */}
          <button
            onClick={handleDownloadPortable}
            className="px-6 py-4 rounded-2xl bg-[#121624] hover:bg-[#1a2034] text-slate-200 hover:text-white font-bold text-sm border border-white/[0.12] transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-3 group shadow-lg"
          >
            <HardDrive className="w-5 h-5 text-cyan-400 group-hover:rotate-6 transition-transform" />
            <div className="text-left">
              <div className="font-extrabold leading-tight">Edición Portable (ZIP)</div>
              <div className="text-[11px] text-slate-400 font-mono font-normal">Sin instalación • ~2.7 MB</div>
            </div>
          </button>

          {/* Web App Direct Launch */}
          <button
            onClick={() => {
              playClickSound();
              onEnterApp();
            }}
            className="px-6 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white font-bold text-sm border border-white/[0.1] transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2.5"
          >
            <Monitor className="w-4 h-4 text-purple-400" />
            <span>Usar Cliente Web Online</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Quick Highlights / Proof Pills */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Windows 10 & 11 (x64)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> 85% menos RAM que Electron
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-400" /> 2FA & Google Auth
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-rose-400" /> 10 Temas Ultra Profundos
          </span>
        </div>
      </section>

      {/* APP INTERACTIVE MOCKUP SHOWCASE */}
      <section className="relative z-10 px-6 max-w-6xl mx-auto mb-28">
        <div className="p-2 rounded-3xl bg-gradient-to-b from-white/[0.15] via-white/[0.05] to-transparent shadow-2xl backdrop-blur-2xl">
          <div className="rounded-2xl bg-[#0b0e17] border border-white/[0.08] overflow-hidden shadow-2xl">
            {/* Mockup Titlebar */}
            <div className="h-10 bg-[#07090f] border-b border-white/[0.06] px-4 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs font-mono text-slate-500">Kova Desktop OS — General #chat-ia</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 bg-cyan-950/30 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>Rust Engine 1.1ms • Gemini 2.5 Flash Conectado</span>
              </div>
            </div>

            {/* Mockup Body Preview */}
            <div className="grid grid-cols-12 h-[440px] text-xs">
              {/* Server Rail */}
              <div className="col-span-1 bg-[#05060b] border-r border-white/[0.05] p-2 flex flex-col items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center font-black text-white text-xs shadow-md">
                  K
                </div>
                <div className="w-6 h-0.5 bg-white/[0.1] rounded-full" />
                <div className="w-9 h-9 rounded-2xl bg-[#131722] hover:bg-purple-600/30 flex items-center justify-center text-slate-400 cursor-pointer">
                  🎮
                </div>
                <div className="w-9 h-9 rounded-2xl bg-[#131722] hover:bg-purple-600/30 flex items-center justify-center text-slate-400 cursor-pointer">
                  🎵
                </div>
                <div className="w-9 h-9 rounded-2xl bg-[#131722] hover:bg-purple-600/30 flex items-center justify-center text-slate-400 cursor-pointer">
                  🤖
                </div>
              </div>

              {/* Channel Sidebar */}
              <div className="col-span-3 bg-[#090c14] border-r border-white/[0.05] p-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="font-black text-slate-200 font-['Outfit'] text-sm px-1 flex items-center justify-between">
                    <span>Kova Hub Oficial</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">ONLINE</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Canales de Texto</div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-purple-600/15 text-white font-medium border border-purple-500/20">
                      <span className="text-purple-400 font-bold">#</span> chat-general
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                      <span className="text-slate-500 font-bold">#</span> kova-ai-assistant
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                      <span className="text-slate-500 font-bold">#</span> bots-playground
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Canales de Voz HD</div>
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-cyan-300">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Sala Radar 3D</span>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400">1.1ms</span>
                    </div>
                  </div>
                </div>

                {/* User capsule preview */}
                <div className="p-2 rounded-xl bg-[#0f1320] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white text-[11px]">
                      J
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-200 truncate">Juan Jesús E.</div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 2FA Verificado
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Simulation Area */}
              <div className="col-span-8 bg-[#0c0f1a] p-4 flex flex-col justify-between">
                <div className="space-y-4 overflow-hidden">
                  {/* User message */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/30 flex items-center justify-center font-bold text-purple-300">
                      J
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Juan Jesús</span>
                        <span className="text-[10px] text-slate-500">Hoy a las 4:52 AM</span>
                      </div>
                      <p className="text-slate-300 mt-1">
                        !kova crea un bot que reproduzca audio espacial y avise las menciones de GitHub
                      </p>
                    </div>
                  </div>

                  {/* Kova AI Assistant reply */}
                  <div className="flex gap-3 p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-md">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-cyan-300 font-['Outfit']">Kova AI (Gemini 2.5 Flash)</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/30 text-purple-300 font-bold">BOT OFICIAL</span>
                      </div>
                      <p className="text-slate-200 mt-1 text-xs leading-relaxed">
                        ¡Listo Juan Jesús! He configurado tu bot <strong>AudioRadar-Notifier</strong> en el App Directory. Usa el prefijo <code>!radar</code> para sintonizar salas WebRTC con audio DSP de baja latencia.
                      </p>
                      <div className="mt-2 p-2 rounded-xl bg-black/40 font-mono text-[11px] text-cyan-300 border border-white/[0.06]">
                        {'>'} kova.audio.setDSPMode("spatial_radar_3d"); // 1.1ms latency enabled
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Input */}
                <div className="p-2.5 rounded-xl bg-[#131724] border border-white/[0.08] flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">+</span>
                    <span>Envía un mensaje a #chat-general o usa @Kova AI...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-white/[0.05] px-2 py-0.5 rounded text-slate-400">Ctrl + K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section id="features" className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mb-3">
            ARQUITECTURA DE SIGUIENTE GENERACIÓN
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] mb-4">
            Todo lo que necesitas para tu equipo y comunidad en una sola suite.
          </h3>
          <p className="text-sm text-slate-400">
            Diseñado para eliminar la sobrecarga de memoria de los clientes tradicionales y potenciar el flujo de trabajo con inteligencia artificial en tiempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Rust Engine */}
          <div className="p-7 rounded-3xl bg-[#0c101c]/80 border border-white/[0.08] hover:border-purple-500/40 transition-all hover:-translate-y-1 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="text-lg font-black text-white font-['Outfit'] mb-2">Motor Nativo Rust & Tauri v2</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consumo de apenas ~68 MB de RAM frente a los más de 600 MB habituales de Electron. Inicio instantáneo y procesamiento multihilo para audio y renderizado.
            </p>
          </div>

          {/* Card 2: Gemini AI */}
          <div className="p-7 rounded-3xl bg-[#0c101c]/80 border border-white/[0.08] hover:border-cyan-500/40 transition-all hover:-translate-y-1 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>
            <h4 className="text-lg font-black text-white font-['Outfit'] mb-2">Kova AI & Gemini 2.5 Flash</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Asistente de inteligencia artificial contextual con modelos oficiales de Google. Genera código, resume hilos de conversación y resuelve dudas técnicas.
            </p>
          </div>

          {/* Card 3: Discord Bots */}
          <div className="p-7 rounded-3xl bg-[#0c101c]/80 border border-white/[0.08] hover:border-indigo-500/40 transition-all hover:-translate-y-1 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Terminal className="w-6 h-6 text-indigo-400" />
            </div>
            <h4 className="text-lg font-black text-white font-['Outfit'] mb-2">Ecosistema de Bots & Studio</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Directorio de aplicaciones con bots precargados (Midjourney, MEE6, FredBoat) y un editor visual para crear tus propios bots con prefijos personalizados y disparadores de IA.
            </p>
          </div>

          {/* Card 4: 2FA */}
          <div className="p-7 rounded-3xl bg-[#0c101c]/80 border border-white/[0.08] hover:border-emerald-500/40 transition-all hover:-translate-y-1 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="text-lg font-black text-white font-['Outfit'] mb-2">Seguridad 2FA Militar</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Autenticación en Dos Pasos basada en TOTP compatible con Google Authenticator y 1Password, respaldada con códigos de emergencia de 8 caracteres descargables.
            </p>
          </div>

          {/* Card 5: Spatial Audio */}
          <div className="p-7 rounded-3xl bg-[#0c101c]/80 border border-white/[0.08] hover:border-rose-500/40 transition-all hover:-translate-y-1 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Volume2 className="w-6 h-6 text-rose-400" />
            </div>
            <h4 className="text-lg font-black text-white font-['Outfit'] mb-2">Audio Espacial 3D & Radar</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Posiciona a los miembros de tu llamada en un radar 3D interactivo con atenuación direccional y cancelación de ruido activa por software.
            </p>
          </div>

          {/* Card 6: Creative Suite */}
          <div className="p-7 rounded-3xl bg-[#0c101c]/80 border border-white/[0.08] hover:border-amber-500/40 transition-all hover:-translate-y-1 shadow-lg group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-lg font-black text-white font-['Outfit'] mb-2">Arcade, Soundboard & Código</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Minijuegos arcade retro para pausas en equipo, soundboard en vivo con efectos cyberpunk y runner de código interactivo en vivo.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE THEMES SECTION */}
      <section id="themes" className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0e1220] via-[#090b14] to-[#06080e] border border-white/[0.1] shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
              PERSONALIZACIÓN TOTAL
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mt-2 mb-3">
              10 Temas Ultra Profundos diseñados para cuidar tu vista.
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Cambia de tema ahora mismo y observa cómo se transforma la atmósfera. Desde el Dark Carmesí Blood Moon hasta el negro absoluto OLED.
            </p>
          </div>

          {/* Theme Pills Switcher */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            {themesList.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  playClickSound();
                  setTheme(t.id);
                  toast.success(`Tema cambiado a: ${t.name}`);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  theme === t.id
                    ? 'bg-white/[0.15] text-white border-white/[0.3] shadow-lg scale-105'
                    : 'bg-black/30 text-slate-400 border-white/[0.06] hover:text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shadow-sm"
                  style={{ backgroundColor: t.color }}
                />
                <span>{t.name}</span>
              </button>
            ))}
          </div>

          {/* Theme description showcase */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>
                Tema activo:{' '}
                <strong className="text-white">
                  {themesList.find((t) => t.id === theme)?.name || theme}
                </strong>{' '}
                — {themesList.find((t) => t.id === theme)?.desc}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* DEDICATED DOWNLOAD HUB */}
      <section id="downloads" className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
            DESCARGAS OFICIALES
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] mt-2 mb-3">
            Obtén Kova v1.0.0 para Windows
          </h3>
          <p className="text-sm text-slate-400">
            Descarga directamente desde nuestra web con alta velocidad o desde GitHub Releases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {/* Option 1: Installer */}
          <div className="p-7 rounded-3xl bg-[#0e1322] border-2 border-purple-500/40 shadow-2xl relative flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-cyan-400 text-white shadow-md">
              RECOMENDADO
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                <Download className="w-6 h-6" />
              </div>

              <h4 className="text-xl font-extrabold text-white font-['Outfit'] mb-1">Instalador Windows</h4>
              <p className="text-xs text-slate-400 mb-4">
                Paquete NSIS completo con accesos directos, arranque optimizado y desinstalador limpio.
              </p>

              <div className="space-y-2 text-xs text-slate-300 font-mono mb-6 bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Versión:</span>
                  <span className="text-white">v1.0.0 (x64)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tamaño:</span>
                  <span className="text-emerald-400 font-bold">~2.1 MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Formato:</span>
                  <span className="text-white">Setup (.exe)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleDownloadInstaller}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Setup Oficial (.exe)</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  openExternalUrl('https://github.com/k2nchin/kova/releases/download/v1.0.0/Kova-v1.0.0-Setup.exe');
                }}
                className="w-full py-2 text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Mirror desde GitHub Releases</span>
              </button>
            </div>
          </div>

          {/* Option 2: Portable */}
          <div className="p-7 rounded-3xl bg-[#0c101c] border border-white/[0.1] shadow-xl relative flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 mb-5">
                <HardDrive className="w-6 h-6" />
              </div>

              <h4 className="text-xl font-extrabold text-white font-['Outfit'] mb-1">Edición Portable</h4>
              <p className="text-xs text-slate-400 mb-4">
                Ejecutable autónomo directo. Ideal para memorias USB o PCs sin permisos de administrador.
              </p>

              <div className="space-y-2 text-xs text-slate-300 font-mono mb-6 bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Versión:</span>
                  <span className="text-white">v1.0.0 (x64)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tamaño:</span>
                  <span className="text-cyan-400 font-bold">~2.7 MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Formato:</span>
                  <span className="text-white">Archivo (.zip)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleDownloadPortable}
                className="w-full py-3 rounded-xl bg-[#171c2c] hover:bg-[#1f263c] text-white font-bold text-xs border border-white/[0.1] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Descargar Portable (.zip)</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  openExternalUrl('https://github.com/k2nchin/kova/releases/download/v1.0.0/Kova-v1.0.0-Windows-Portable.zip');
                }}
                className="w-full py-2 text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Mirror desde GitHub Releases</span>
              </button>
            </div>
          </div>

          {/* Option 3: Web App */}
          <div className="p-7 rounded-3xl bg-[#0c101c] border border-white/[0.1] shadow-xl relative flex flex-col justify-between hover:scale-[1.02] transition-transform md:col-span-2 lg:col-span-1">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 mb-5">
                <Monitor className="w-6 h-6" />
              </div>

              <h4 className="text-xl font-extrabold text-white font-['Outfit'] mb-1">Cliente Web en Línea</h4>
              <p className="text-xs text-slate-400 mb-4">
                Ejecuta Kova instantáneamente en tu navegador moderno (Chrome, Edge, Firefox, Safari).
              </p>

              <div className="space-y-2 text-xs text-slate-300 font-mono mb-6 bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Compatibilidad:</span>
                  <span className="text-white">PWA / WebRTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Descarga:</span>
                  <span className="text-emerald-400 font-bold">0 MB (Online)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Funciones:</span>
                  <span className="text-white">Chat, Bots & 2FA</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onEnterApp();
              }}
              className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold text-xs border border-white/[0.12] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              <span>Lanzar Web App Ahora</span>
            </button>
          </div>
        </div>

        {/* System Requirements Table */}
        <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-black/30 border border-white/[0.06] text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-300 font-mono mb-3">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span>REQUISITOS DEL SISTEMA RECOMENDADOS (WINDOWS)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-400 font-mono text-[11px]">
            <div>
              <span className="text-slate-600 block">SISTEMA OPERATIVO</span>
              <span className="text-slate-200">Windows 10 / 11 (x64)</span>
            </div>
            <div>
              <span className="text-slate-600 block">MEMORIA RAM</span>
              <span className="text-slate-200">2 GB mínimo (4 GB óptimo)</span>
            </div>
            <div>
              <span className="text-slate-600 block">ESPACIO EN DISCO</span>
              <span className="text-slate-200">~25 MB libres</span>
            </div>
            <div>
              <span className="text-slate-600 block">DISPOSITIVOS</span>
              <span className="text-slate-200">Micrófono & Altavoces</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#06080e] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-white font-black text-[10px]">
              K
            </div>
            <div>
              <span className="font-bold text-slate-300 font-['Outfit'] text-sm block">KOVA OS DESKTOP</span>
              <span>© 2026 Kova Project. Desarrollado por k2nchin. Licencia MIT.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button onClick={onEnterApp} className="hover:text-slate-300 transition-colors cursor-pointer">
              Lanzar Web App
            </button>
            <a href="#downloads" className="hover:text-slate-300 transition-colors">
              Descargas
            </a>
            <button
              onClick={() => openExternalUrl('https://github.com/k2nchin/kova')}
              className="hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </button>
            <button
              onClick={() => openExternalUrl('https://github.com/k2nchin/kova/releases/tag/v1.0.0')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Notas de Release v1.0.0
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
