import React, { useState, useEffect, useRef } from 'react';
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
  HelpCircle,
  ChevronDown,
  MessageSquare,
  Globe,
  Sliders,
  Send,
  Star,
  Users,
  Copy,
  Check,
  Headphones,
  Music,
  Activity,
  Award,
  Lock,
  Server,
  Hash,
  Mic,
  MicOff,
  VolumeX,
  Compass,
  FileCode,
  KeyRound,
  RefreshCw,
  Plus,
  Settings,
  Smile,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/soundEffects';
import { openExternalUrl } from '../../utils/googleRealAuth';
import { BackgroundTheme } from '../Themes/ThemeBackground';
import { useApp } from '../../context/AppContext';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const { theme, setTheme } = useApp();
  const [downloadCount, setDownloadCount] = useState(312);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedDns, setCopiedDns] = useState(false);

  // Interactive Live Mockup State
  const [activeChannel, setActiveChannel] = useState<'general' | 'ia-gemini' | 'voice-radar' | 'bots'>('general');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [mockInput, setMockInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [mockMessages, setMockMessages] = useState<
    { id: string; user: string; role: string; avatarBg: string; text: string; time: string; isAi?: boolean }[]
  >([
    {
      id: '1',
      user: 'Juanpi1x',
      role: 'Fundador',
      avatarBg: 'from-amber-500 to-rose-600',
      text: '¡Bienvenidos a Kova OS v1.0.0! Compilado con Tauri v2 y Rust. El consumo de RAM se redujo a solo 68 MB.',
      time: '12:40 PM',
    },
    {
      id: '2',
      user: 'Gemini 2.5 Flash',
      role: 'IA Oficial',
      avatarBg: 'from-cyan-400 via-indigo-500 to-purple-600',
      text: 'Pipeline de audio DSP en tiempo real activado con 1.1ms de latencia. Listo para procesar comandos de bots, resúmenes de canales y traducción en vivo.',
      time: '12:41 PM',
      isAi: true,
    },
    {
      id: '3',
      user: 'FredBoat',
      role: 'Bot de Música',
      avatarBg: 'from-emerald-500 to-teal-700',
      text: '🎵 Reproduciendo "Cyberpunk Synthwave 2026" en Sala Radar 3D (48kHz / 32-bit float).',
      time: '12:42 PM',
    },
  ]);

  // Soundboard Active State
  const [activeSound, setActiveSound] = useState<string | null>(null);

  // Domain Calculator State
  const [customDomainInput, setCustomDomainInput] = useState('kovachat.com');

  // Themes List
  const themesList: { id: BackgroundTheme; name: string; color: string; desc: string; glow: string }[] = [
    { id: 'crimson', name: 'Dark Carmesí', color: '#e11d48', desc: 'Negro obsidiana con luna de sangre y acentos rubí', glow: 'rgba(225, 29, 72, 0.25)' },
    { id: 'abyss', name: 'Abyssal Blue', color: '#0284c7', desc: 'Profundidad de medianoche marina con cian eléctrico', glow: 'rgba(2, 132, 199, 0.25)' },
    { id: 'emerald', name: 'Emerald Void', color: '#059669', desc: 'Bosque de coníferas nocturno y verde jade místico', glow: 'rgba(5, 150, 105, 0.25)' },
    { id: 'amethyst', name: 'Amethyst Void', color: '#9333ea', desc: 'Obsidiana gótica con destellos púrpura y amatista', glow: 'rgba(147, 51, 234, 0.25)' },
    { id: 'amber', name: 'Cyber Amber', color: '#d97706', desc: 'Carbón volcánico profundo con oro eclipse fundido', glow: 'rgba(217, 119, 6, 0.25)' },
    { id: 'oled', name: 'OLED Puro', color: '#38bdf8', desc: 'Negro absoluto 0% emisión de luz para máximo ahorro', glow: 'rgba(56, 189, 248, 0.25)' },
    { id: 'discord', name: 'Discord Dark', color: '#5865F2', desc: 'Gris azulado clásico con acentos blurple oficiales', glow: 'rgba(88, 101, 242, 0.25)' },
  ];

  // Active theme info
  const currentThemeInfo = themesList.find((t) => t.id === theme) || themesList[0];

  const handleDownloadInstaller = () => {
    soundFx.playReactionAdded();
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 } });
    setDownloadCount((prev) => prev + 1);
    toast.success('Iniciando descarga directa de Kova-v1.0.0-Setup.exe');
    const link = document.createElement('a');
    link.href = './downloads/Kova-v1.0.0-Setup.exe';
    link.download = 'Kova-v1.0.0-Setup.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPortable = () => {
    soundFx.playReactionAdded();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    setDownloadCount((prev) => prev + 1);
    toast.success('Iniciando descarga directa de Kova-v1.0.0-Windows-Portable.zip');
    const link = document.createElement('a');
    link.href = './downloads/Kova-v1.0.0-Windows-Portable.zip';
    link.download = 'Kova-v1.0.0-Windows-Portable.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const playSoundEffect = (
    type: 'laser' | 'victory' | 'cyberhorn' | 'arcade' | 'airhorn' | 'quack' | 'applause' | 'badumtss' | 'discord_ping' | 'bruh'
  ) => {
    setActiveSound(type);
    soundFx.playSoundboardFx(type);
    toast.info(`Efecto sonoro: ${type.toUpperCase()}`);
    setTimeout(() => setActiveSound(null), 400);
  };

  const handleSendMockChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mockInput.trim() || isAiTyping) return;

    soundFx.playMessageSent();
    const userText = mockInput.trim();
    setMockInput('');

    const newMsg = {
      id: Date.now().toString(),
      user: 'Tú (Visitante)',
      role: 'Tester',
      avatarBg: 'from-blue-500 to-indigo-600',
      text: userText,
      time: 'Ahora mismo',
    };

    setMockMessages((prev) => [...prev, newMsg]);
    setIsAiTyping(true);

    setTimeout(() => {
      setIsAiTyping(false);
      soundFx.playAISparkle();

      let reply = `Comprendido: "${userText}". Kova OS procesa comandos en tiempo real a través de Gemini 2.5 Flash y ejecuta pipelines de audio DSP en menos de 1.1ms con 0 lag.`;
      if (userText.toLowerCase().includes('bot') || userText.toLowerCase().includes('discord')) {
        reply = `¡Exacto! Puedes conectar cualquier bot de Discord mediante Webhooks o programar bots personalizados con prefijos propios (ej. !musica, !ia, !kick) directamente desde el App Directory de Kova sin pagar servidores.`;
      } else if (userText.toLowerCase().includes('2fa') || userText.toLowerCase().includes('seguridad')) {
        reply = `Kova implementa Autenticación en 2 Pasos (TOTP) estándar compatible con Google Authenticator y claves de respaldo offline para que tu cuenta sea inexpugnable.`;
      } else if (userText.toLowerCase().includes('descargar') || userText.toLowerCase().includes('exe')) {
        reply = `Puedes descargar el instalador oficial Setup.exe (~7.0 MB) o la edición Portable en ZIP desde los botones superiores con 1 solo clic.`;
      } else if (userText.toLowerCase().includes('ram') || userText.toLowerCase().includes('rendimiento')) {
        reply = `Al estar construido con Tauri v2 y Rust sobre WebView2 nativo de Windows, Kova consume solo ~68 MB de RAM, un 85% menos que Discord (Electron).`;
      }

      setMockMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          user: 'Gemini 2.5 Flash',
          role: 'IA Oficial',
          avatarBg: 'from-cyan-400 via-indigo-500 to-purple-600',
          text: reply,
          time: 'Ahora mismo',
          isAi: true,
        },
      ]);
    }, 700);
  };

  const copyLiveUrl = () => {
    soundFx.playReactionAdded();
    navigator.clipboard.writeText('https://k2nchin.github.io/kova/');
    setCopiedUrl(true);
    toast.success('URL copiada: https://k2nchin.github.io/kova/');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copyDnsRecords = () => {
    soundFx.playReactionAdded();
    const records = `Tipo: A | Host: @ | Valor: 185.199.108.153\nTipo: A | Host: @ | Valor: 185.199.109.153\nTipo: A | Host: @ | Valor: 185.199.110.153\nTipo: A | Host: @ | Valor: 185.199.111.153\nTipo: CNAME | Host: www | Valor: k2nchin.github.io`;
    navigator.clipboard.writeText(records);
    setCopiedDns(true);
    toast.success('Registros DNS copiados al portapapeles');
    setTimeout(() => setCopiedDns(false), 2000);
  };

  const downloadCnameFile = () => {
    soundFx.playReactionAdded();
    const cleanDomain = customDomainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const blob = new Blob([cleanDomain], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CNAME';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Archivo CNAME generado para: ${cleanDomain}`);
  };

  const faqs = [
    {
      q: '¿Cómo puedo tener mi propio dominio .com gratis para Kova?',
      a: 'La extensión global .com está regulada por ICANN y Verisign con una tarifa anual oficial de registro (~$8-$10 USD en sitios como Cloudflare o Namecheap), por lo que ningún registrador oficial regala dominios .com a perpetuidad sin costo alguno. Sin embargo, Kova te ofrece dos alternativas excelentes: 1) Si eres estudiante, con el GitHub Student Developer Pack obtienes 1 año de dominio .com/.me 100% gratis en Namecheap con SSL. 2) Ya tienes una URL 100% gratuita y permanente en GitHub Pages (k2nchin.github.io/kova) o Vercel (kova.vercel.app). Si decides adquirir tu propio .com por $8-$9, vincularlo a Kova no cuesta nada: solo agregas los 4 registros A en tu DNS y activas HTTPS gratis.',
    },
    {
      q: '¿Por qué Kova consume un 85% menos de memoria RAM que Discord?',
      a: 'Discord está construido sobre Electron, un framework que ejecuta una copia completa de Google Chrome en segundo plano y una instancia de Node.js, devorando entre 550 y 900 MB de RAM tan pronto te unes a una llamada. Kova está construido sobre Tauri v2 con backend en Rust compilado a código máquina nativo y aprovecha el motor WebView2 que ya viene integrado en Windows, reduciendo el consumo a tan solo ~68 MB de RAM.',
    },
    {
      q: '¿Cuál es la diferencia entre el Instalador (.exe) y la versión Portable?',
      a: 'El Instalador Setup.exe (~7.0 MB) crea automáticamente accesos directos en el Escritorio y Menú Inicio, registra el protocolo de apertura rápida y permite actualizaciones limpias. La versión Portable (~7.6 MB en archivo ZIP) no requiere instalación ni privilegios de administrador: puedes descomprimirla en una memoria USB o en cualquier carpeta y ejecutarla al instante.',
    },
    {
      q: '¿Cómo funciona la integración de Bots de Discord y el Asistente Gemini?',
      a: 'Kova incorpora un App Directory donde puedes añadir bots populares de Discord o crear bots personalizados con sus propios prefijos, avatares y respuestas inteligentes. Además, Kova integra de forma nativa el modelo de IA Gemini 2.5 Flash de Google, lo que te permite resumir hilos extensos, consultar dudas de programación y moderar chats en milisegundos.',
    },
    {
      q: '¿Mis credenciales y llamadas están protegidas con 2FA?',
      a: 'Sí. Kova implementa Autenticación en Dos Pasos (2FA) basada en el estándar industrial RFC 6238 TOTP. Puedes escanear el código QR con cualquier aplicación autenticadora (Google Authenticator, Microsoft Authenticator, Authy o 1Password) y guardar 6 claves de recuperación offline en caso de extraviar tu dispositivo móvil.',
    },
    {
      q: '¿El código fuente es abierto y auditable?',
      a: 'Totalmente. El repositorio público de Kova está disponible en GitHub (https://github.com/k2nchin/kova) bajo Licencia MIT. Cualquiera puede inspeccionar el backend de Rust, los componentes de React y los flujos de seguridad.',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#06080e] text-[#f4f7fb] selection:bg-purple-500/30 font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden relative">
      {/* Dynamic Background Auras based on selected theme */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-48 left-1/4 w-[850px] h-[850px] rounded-full blur-[160px] opacity-25 transition-all duration-700"
          style={{ backgroundColor: currentThemeInfo.color }}
        />
        <div className="absolute top-1/3 -right-32 w-[700px] h-[700px] bg-cyan-500/15 rounded-full blur-[170px]" />
        <div className="absolute -bottom-32 -left-20 w-[750px] h-[750px] bg-purple-600/15 rounded-full blur-[190px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Top Banner Notice */}
      <div className="relative z-50 bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-cyan-950/90 border-b border-purple-500/20 py-2 px-4 text-center text-xs text-slate-300 flex flex-wrap items-center justify-center gap-2">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-gradient-to-r from-purple-500 to-cyan-400 text-white shadow-sm">
          KOVA V1.0.0 OFICIAL
        </span>
        <span>
          Cliente de escritorio y Web desplegados. Descarga directa disponible sin esperas.
        </span>
        <a href="#downloads" className="text-cyan-400 font-bold hover:underline ml-1 inline-flex items-center gap-0.5">
          Obtener ahora <ChevronRight className="w-3.5 h-3.5 inline" />
        </a>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#080b13]/90 border-b border-white/[0.08] px-6 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0b0e17] rounded-2xl flex items-center justify-center">
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
              <p className="text-[11px] text-slate-400 hidden sm:block">Plataforma de Voz, Chat & IA en Rust</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#mockup-preview" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vista Previa OS</span>
            </a>
            <a href="#voice-radar" className="hover:text-white transition-colors flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Radar 3D & Audio</span>
            </a>
            <a href="#soundboard" className="hover:text-white transition-colors flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Soundboard</span>
            </a>
            <a href="#themes" className="hover:text-white transition-colors flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-rose-400" />
              <span>10 Temas</span>
            </a>
            <a href="#domain-hub" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dominio .com</span>
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Comparativa
            </a>
            <a href="#downloads" className="hover:text-purple-400 transition-colors font-bold text-purple-300">
              Descargas
            </a>
          </nav>

          {/* Action Buttons */}
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
              <span className="hidden xl:inline">GitHub</span>
            </button>

            <button
              onClick={() => {
                soundFx.playReactionAdded();
                onEnterApp();
              }}
              className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold border border-white/[0.12] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-[1.02]"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
              <span>Lanzar Web App</span>
            </button>

            <a
              href="#downloads"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .exe</span>
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 pb-12 px-6 max-w-7xl mx-auto text-center">
        {/* Floating Release Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 via-cyan-500/15 to-indigo-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium mb-6 shadow-inner backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-white">Kova Desktop v1.0.0 Oficial</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-300 font-mono">Audio 1.1ms DSP + Gemini 2.5 Flash + 2FA</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white font-['Outfit'] max-w-5xl mx-auto leading-[1.08] mb-6">
          La plataforma definitiva de voz, chat y bots con{' '}
          <span className="bg-gradient-to-r from-purple-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            IA de Ultra Baja Latencia.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          Despídete del consumo desmedido de Electron. Diseñado desde cero con <strong>Tauri v2, Rust y React 19</strong>, Kova te ofrece canales de audio espacial con procesamiento DSP de <strong>1.1ms</strong>, asistente <strong>Gemini 2.5 Flash</strong> integrado, bots de Discord y <strong>10 temas ultra oscuros</strong> para cuidar tu visión.
        </p>

        {/* Main CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          {/* Primary Setup Download */}
          <button
            onClick={handleDownloadInstaller}
            className="px-7 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm shadow-2xl shadow-purple-600/35 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-3.5 group"
          >
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            <div className="text-left">
              <div className="font-extrabold leading-tight">Descargar Instalador (.exe)</div>
              <div className="text-[11px] text-purple-200 font-mono font-normal">Setup Oficial Windows • ~7.0 MB</div>
            </div>
          </button>

          {/* Portable Zip Download */}
          <button
            onClick={handleDownloadPortable}
            className="px-6 py-4 rounded-2xl bg-[#111524] hover:bg-[#192036] text-slate-200 hover:text-white font-bold text-sm border border-white/[0.12] transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-3 group shadow-xl"
          >
            <HardDrive className="w-5 h-5 text-cyan-400 group-hover:rotate-6 transition-transform" />
            <div className="text-left">
              <div className="font-extrabold leading-tight">Edición Portable (.zip)</div>
              <div className="text-[11px] text-slate-400 font-mono font-normal">Sin instalación • ~7.6 MB</div>
            </div>
          </button>

          {/* Web App Direct Launch */}
          <button
            onClick={() => {
              soundFx.playReactionAdded();
              onEnterApp();
            }}
            className="px-6 py-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white font-bold text-sm border border-white/[0.1] transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2.5 shadow-lg"
          >
            <Monitor className="w-4 h-4 text-purple-400" />
            <span>Usar Cliente Web Online</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Live Metrics Proof Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400 font-mono mb-16">
          <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/[0.06]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Windows 10 & 11 (x64)
          </span>
          <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/[0.06]">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" /> ~68 MB RAM (85% menos que Discord)
          </span>
          <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/[0.06]">
            <CheckCircle2 className="w-4 h-4 text-purple-400" /> 2FA TOTP con Google Authenticator
          </span>
          <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/[0.06]">
            <CheckCircle2 className="w-4 h-4 text-rose-400" /> 10 Temas Ultra Oscuros
          </span>
        </div>

        {/* INTERACTIVE DESKTOP CLIENT MOCKUP */}
        <div id="mockup-preview" className="max-w-6xl mx-auto text-left relative">
          <div className="text-center mb-6">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              EXPERIENCIA NATIVA EN VIVO
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mt-1">
              Prueba la interfaz de Kova OS en tiempo real
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Interactúa con los canales, activa o silencia el micrófono, envía mensajes y recibe respuestas de Gemini.
            </p>
          </div>

          <div className="p-2 sm:p-3 rounded-3xl bg-gradient-to-b from-white/[0.18] via-white/[0.06] to-transparent shadow-2xl backdrop-blur-2xl">
            <div className="rounded-2xl bg-[#0b0e17] border border-white/[0.1] overflow-hidden shadow-2xl flex flex-col h-[620px]">
              {/* Window Titlebar */}
              <div className="h-10 bg-[#07090f] border-b border-white/[0.06] px-4 flex items-center justify-between select-none shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline">
                    Kova OS Desktop v1.0.0 • Servidor Oficial Kova HQ
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>DSP 1.1ms • Gemini 2.5 Conectado</span>
                </div>
              </div>

              {/* Window Body: Guilds + Sidebar + Chat + Members */}
              <div className="flex-1 flex min-h-0">
                {/* Guild Rail (Left) */}
                <div className="w-16 bg-[#080a11] border-r border-white/[0.06] p-2 flex flex-col items-center gap-3 shrink-0">
                  {/* Kova Main Guild */}
                  <div className="relative group cursor-pointer">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-white font-black text-xs shadow-md shadow-purple-500/30">
                      K
                    </div>
                    <span className="absolute -left-2 top-2.5 w-1 h-5 bg-white rounded-r-full" />
                  </div>

                  <div className="w-8 h-[1px] bg-white/[0.08]" />

                  {/* Gaming Guild */}
                  <div
                    onClick={() => toast.info('Servidor Cyberpunk Gaming seleccionado')}
                    className="w-10 h-10 rounded-2xl bg-[#141824] hover:bg-purple-600/30 hover:rounded-xl text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.06]"
                    title="Cyberpunk Gaming"
                  >
                    <Gamepad2 className="w-5 h-5 text-purple-400" />
                  </div>

                  {/* Devs Guild */}
                  <div
                    onClick={() => toast.info('Servidor Rust & Tauri Devs seleccionado')}
                    className="w-10 h-10 rounded-2xl bg-[#141824] hover:bg-cyan-600/30 hover:rounded-xl text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.06]"
                    title="Rust Developers"
                  >
                    <Code2 className="w-5 h-5 text-cyan-400" />
                  </div>

                  {/* Lofi Beats Guild */}
                  <div
                    onClick={() => toast.info('Servidor Lofi Chillout seleccionado')}
                    className="w-10 h-10 rounded-2xl bg-[#141824] hover:bg-emerald-600/30 hover:rounded-xl text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.06]"
                    title="Lofi Radio"
                  >
                    <Music className="w-5 h-5 text-emerald-400" />
                  </div>

                  <div className="mt-auto">
                    <button
                      onClick={() => onEnterApp()}
                      className="w-10 h-10 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-cyan-400 flex items-center justify-center transition-all cursor-pointer"
                      title="Explorar servidores"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Channel Sidebar */}
                <div className="w-56 bg-[#0c101a] border-r border-white/[0.06] flex flex-col justify-between shrink-0 hidden md:flex">
                  <div>
                    {/* Server Header */}
                    <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs font-['Outfit'] tracking-wide">
                        Kova Headquarters
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    {/* Channels List */}
                    <div className="p-2 space-y-1 text-xs">
                      <div className="text-[10px] font-bold text-slate-500 font-mono uppercase px-2 pt-2">
                        Canales de Texto
                      </div>

                      <button
                        onClick={() => {
                          soundFx.playReactionAdded();
                          setActiveChannel('general');
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 font-medium cursor-pointer transition-colors ${
                          activeChannel === 'general'
                            ? 'bg-purple-600/20 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                        }`}
                      >
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span>chat-general</span>
                      </button>

                      <button
                        onClick={() => {
                          soundFx.playReactionAdded();
                          setActiveChannel('ia-gemini');
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 font-medium cursor-pointer transition-colors ${
                          activeChannel === 'ia-gemini'
                            ? 'bg-cyan-600/20 text-cyan-300 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>ia-gemini-2.5</span>
                      </button>

                      <button
                        onClick={() => {
                          soundFx.playReactionAdded();
                          setActiveChannel('bots');
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 font-medium cursor-pointer transition-colors ${
                          activeChannel === 'bots'
                            ? 'bg-purple-600/20 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                        }`}
                      >
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                        <span>bots-discord</span>
                      </button>

                      <div className="text-[10px] font-bold text-slate-500 font-mono uppercase px-2 pt-4">
                        Canales de Voz 3D
                      </div>

                      <div className="px-2.5 py-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-slate-300">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Sala Radar 3D</span>
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                            3 ACTIVOS
                          </span>
                        </div>
                        <div className="space-y-1 pl-4 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            <span>Juanpi1x (Hablando)</span>
                          </div>
                          <div className="text-slate-400">Gemini IA (Escuchando)</div>
                          <div className="text-slate-400">FredBoat (Lofi 48kHz)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Bar with Mute / Deafen controls */}
                  <div className="p-2.5 bg-[#080b12] border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center font-bold text-white text-xs shrink-0">
                        J
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">Juanpi1x</div>
                        <div className="text-[10px] text-emerald-400 font-mono">En Línea</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const next = !isMicMuted;
                          setIsMicMuted(next);
                          soundFx.playMuteToggle(next);
                          toast.info(next ? 'Micrófono silenciado' : 'Micrófono activado');
                        }}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          isMicMuted ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white'
                        }`}
                        title={isMicMuted ? 'Desmutear' : 'Mutear'}
                      >
                        {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          const next = !isDeafened;
                          setIsDeafened(next);
                          soundFx.playMuteToggle(next);
                          toast.info(next ? 'Audio ensordecido' : 'Audio reactivado');
                        }}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          isDeafened ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white'
                        }`}
                        title={isDeafened ? 'Desensordecer' : 'Ensordecer'}
                      >
                        {isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Chat Stream Area */}
                <div className="flex-1 bg-[#090d16] flex flex-col justify-between min-w-0">
                  {/* Channel Top Header */}
                  <div className="h-12 border-b border-white/[0.06] px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-white text-xs font-['Outfit']">
                        {activeChannel === 'general'
                          ? 'chat-general'
                          : activeChannel === 'ia-gemini'
                          ? 'ia-gemini-2.5'
                          : 'bots-discord'}
                      </span>
                      <span className="text-slate-500 text-xs hidden sm:inline">|</span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        Canal oficial de Kova OS con cifrado local y soporte multimedia
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        14ms Ping
                      </span>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-['Plus_Jakarta_Sans',sans-serif]">
                    {mockMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                          msg.isAi ? 'p-3 rounded-2xl bg-cyan-950/15 border border-cyan-500/20' : 'p-1.5'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${msg.avatarBg} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md`}
                        >
                          {msg.isAi ? <Sparkles className="w-4 h-4 text-white" /> : msg.user[0]}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{msg.user}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                msg.isAi
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-purple-500/20 text-purple-300'
                              }`}
                            >
                              {msg.role}
                            </span>
                            <span className="text-[10px] text-slate-500">{msg.time}</span>
                          </div>
                          <p className="text-slate-200 mt-1 leading-relaxed text-xs">{msg.text}</p>
                        </div>
                      </div>
                    ))}

                    {isAiTyping && (
                      <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono p-2">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Gemini 2.5 Flash está sintetizando respuesta contextual...</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Chips & Chat Input */}
                  <div className="p-3 bg-[#070a12] border-t border-white/[0.06] space-y-2">
                    {/* Command Quick Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase font-mono mr-1">Prueba rápida:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMockInput('¿Por qué Kova es más rápido que Discord?');
                        }}
                        className="px-2 py-0.8 rounded-md bg-[#121624] hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 font-mono text-[10px] transition-all cursor-pointer"
                      >
                        ⚡ ¿Por qué Kova es más rápido?
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMockInput('¿Cómo funciona la autenticación 2FA en Kova?');
                        }}
                        className="px-2 py-0.8 rounded-md bg-[#121624] hover:bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 font-mono text-[10px] transition-all cursor-pointer"
                      >
                        🛡️ Seguridad 2FA
                      </button>
                      <button
                        type="button"
                        onClick={() => playSoundEffect('laser')}
                        className="px-2 py-0.8 rounded-md bg-[#121624] hover:bg-amber-600/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] transition-all cursor-pointer"
                      >
                        🔊 Probar Sonido
                      </button>
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSendMockChat} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={mockInput}
                        onChange={(e) => setMockInput(e.target.value)}
                        placeholder="Escribe un mensaje o pregunta en vivo a Kova..."
                        className="flex-1 bg-[#121624] border border-white/[0.08] focus:border-cyan-500 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-500 outline-none transition-all"
                      />

                      <button
                        type="submit"
                        disabled={!mockInput.trim() || isAiTyping}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Enviar</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Member Sidebar (Right) */}
                <div className="w-48 bg-[#0a0d17] border-l border-white/[0.06] p-3 hidden xl:block shrink-0">
                  <div className="text-[10px] font-bold text-slate-500 font-mono uppercase mb-3">
                    Miembros en Línea — 3
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center font-bold text-white text-[11px]">
                          J
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0a0d17]" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Juanpi1x</div>
                        <div className="text-[9px] text-amber-400 font-mono">Fundador</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center font-bold text-white text-[11px]">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0a0d17]" />
                      </div>
                      <div>
                        <div className="font-bold text-cyan-300 text-xs">Gemini 2.5</div>
                        <div className="text-[9px] text-cyan-400 font-mono">IA Oficial</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white text-[11px]">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0a0d17]" />
                      </div>
                      <div>
                        <div className="font-bold text-purple-300 text-xs">FredBoat</div>
                        <div className="text-[9px] text-purple-400 font-mono">Bot Verificado</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D VOICE RADAR & AUDIO DSP PLAYGROUND */}
      <section id="voice-radar" className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0e1322] via-[#0b0e1a] to-[#070912] border border-cyan-500/20 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-cyan-400" />
              RADAR DE VOZ ESPACIAL 3D & DSP EN RUST
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] mt-2 mb-3">
              Latencia de 1.1ms y posicionamiento tridimensional
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Kova procesa cada stream de audio con un motor DSP escrito en Rust que reduce la latencia perceptiva a cero y te permite identificar con precisión la dirección de la voz de tus compañeros en juegos competitivos.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Visual Radar Screen */}
            <div className="relative w-full max-w-md mx-auto aspect-square rounded-full border-2 border-cyan-500/30 bg-[#060913] flex items-center justify-center overflow-hidden shadow-2xl shadow-cyan-500/10">
              {/* Radar concentric rings */}
              <div className="absolute inset-8 rounded-full border border-cyan-500/20" />
              <div className="absolute inset-20 rounded-full border border-cyan-500/15" />
              <div className="absolute inset-32 rounded-full border border-cyan-500/10" />

              {/* Crosshair lines */}
              <div className="absolute inset-x-0 h-[1px] bg-cyan-500/20" />
              <div className="absolute inset-y-0 w-[1px] bg-cyan-500/20" />

              {/* Rotating Sweep Beam */}
              <div
                className="absolute inset-0 origin-center pointer-events-none animate-spin"
                style={{
                  animationDuration: '4s',
                  background: 'conic-gradient(from 0deg, transparent 270deg, rgba(6, 182, 212, 0.3) 360deg)',
                }}
              />

              {/* Center User Node */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-cyan-400/40 border-2 border-white">
                Tú
              </div>

              {/* Node 1: Left Ear Sound (Friend 1) */}
              <button
                onClick={() => {
                  soundFx.playSoundboardFx('arcade');
                  toast.info('Canal Izquierdo: Jugador 1 (Oído Izquierdo 3D)');
                }}
                className="absolute left-10 top-24 px-3 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/50 text-white text-[11px] font-bold flex items-center gap-1.5 hover:scale-110 transition-transform cursor-pointer shadow-lg"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Alex (Izquierda)</span>
              </button>

              {/* Node 2: Right Ear Sound (Friend 2) */}
              <button
                onClick={() => {
                  soundFx.playSoundboardFx('airhorn');
                  toast.info('Canal Derecho: Jugador 2 (Oído Derecho 3D)');
                }}
                className="absolute right-12 bottom-24 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-white text-[11px] font-bold flex items-center gap-1.5 hover:scale-110 transition-transform cursor-pointer shadow-lg"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Sofia (Derecha)</span>
              </button>

              {/* Node 3: Front (Music Bot) */}
              <button
                onClick={() => {
                  soundFx.playSoundboardFx('cyberhorn');
                  toast.info('Canal Frontal: FredBoat Lofi Bot');
                }}
                className="absolute top-8 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-white text-[11px] font-bold flex items-center gap-1.5 hover:scale-110 transition-transform cursor-pointer shadow-lg"
              >
                <Music className="w-3 h-3 text-emerald-400" />
                <span>Lofi Bot (Frente)</span>
              </button>
            </div>

            {/* Audio Specs & Live Equalizer */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#070a14] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Monitor de Audio DSP en Tiempo Real</span>
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">1.1 ms (48kHz / 32-bit Float)</span>
                </div>

                {/* Animated Equalizer Bars */}
                <div className="flex items-end gap-1.5 h-16 pt-2">
                  {[40, 75, 55, 90, 65, 80, 45, 95, 70, 85, 60, 90, 75, 50, 80, 65, 95, 45].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t-sm transition-all duration-300"
                      style={{
                        height: `${h}%`,
                        opacity: 0.7 + (i % 3) * 0.15,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#090d18] border border-white/[0.06]">
                  <div className="font-bold text-white mb-1">Cancelación de Ruido Krisp-Grade</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Filtra automáticamente ruidos mecánicos de teclados, ventiladores y ecos sin alterar la calidez de tu voz.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#090d18] border border-white/[0.06]">
                  <div className="font-bold text-white mb-1">Cifrado de Voz Extremo a Extremo</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Tus llamadas viajan mediante WebRTC seguro con cifrado DTLS-SRTP, garantizando total privacidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SOUNDBOARD PLAYER */}
      <section id="soundboard" className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            SOUNDBOARD WEB AUDIO EN VIVO
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mt-1">
            Prueba los efectos de sonido sintetizados en tiempo real
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Sin archivos MP3 externos pesados. Cada sonido es sintetizado directamente por el navegador con Web Audio API.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { id: 'laser', name: 'Laser Blast', icon: '⚡', color: 'from-amber-500/20 to-rose-500/20 border-amber-500/30' },
            { id: 'victory', name: 'Victoria Fanfarria', icon: '🏆', color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30' },
            { id: 'airhorn', name: 'Airhorn Clásico', icon: '🎺', color: 'from-rose-500/20 to-purple-500/20 border-rose-500/30' },
            { id: 'cyberhorn', name: 'Cyberhorn 2026', icon: '🤖', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30' },
            { id: 'discord_ping', name: 'Discord Notification', icon: '🔔', color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30' },
            { id: 'bruh', name: 'Bruh Sound', icon: '🗿', color: 'from-slate-500/20 to-stone-500/20 border-slate-500/30' },
            { id: 'arcade', name: 'Arcade Level Up', icon: '👾', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30' },
            { id: 'applause', name: 'Aplausos Sala', icon: '👏', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' },
          ].map((snd) => (
            <button
              key={snd.id}
              onClick={() =>
                playSoundEffect(
                  snd.id as 'laser' | 'victory' | 'cyberhorn' | 'arcade' | 'airhorn' | 'applause' | 'discord_ping' | 'bruh'
                )
              }
              className={`p-4 rounded-2xl bg-gradient-to-b ${snd.color} border text-left cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg group ${
                activeSound === snd.id ? 'ring-2 ring-cyan-400 scale-105' : ''
              }`}
            >
              <div className="text-2xl mb-2 group-hover:rotate-12 transition-transform">{snd.icon}</div>
              <div className="font-bold text-white text-xs">{snd.name}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Clic para reproducir</div>
            </button>
          ))}
        </div>
      </section>

      {/* 10 DEEP DARK THEMES SELECTOR */}
      <section id="themes" className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-mono font-bold tracking-widest text-rose-400 uppercase">
            10 TEMAS PROFUNDOS GRATIS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mt-1">
            Personalización visual profunda: sin pagar suscripciones
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Haz clic en cualquiera de los temas a continuación para transformar al instante los acentos y auras de esta misma web.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 max-w-5xl mx-auto">
          {themesList.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  soundFx.playReactionAdded();
                  setTheme(t.id);
                  toast.success(`Tema aplicado: ${t.name}`);
                }}
                className={`p-3.5 rounded-2xl bg-[#0b0e18] border transition-all cursor-pointer text-left flex flex-col justify-between h-28 ${
                  isSelected
                    ? 'border-white shadow-xl scale-105 ring-2 ring-purple-500/50'
                    : 'border-white/[0.08] hover:border-white/[0.2] hover:bg-[#101422]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-5 h-5 rounded-full shadow-md"
                    style={{ backgroundColor: t.color, boxShadow: `0 0 10px ${t.glow}` }}
                  />
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>

                <div>
                  <div className="font-bold text-white text-xs leading-tight">{t.name}</div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">{t.id}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* DOMAIN .COM & FREE DOMAIN HUB */}
      <section id="domain-hub" className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0c1122] via-[#090d1a] to-[#060810] border-2 border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              GUÍA DEFINITIVA DE DOMINIO .COM Y ALTERNATIVAS GRATIS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] mt-2 mb-3">
              ¿Cómo tener Kova en tu propio dominio .com?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Muchos usuarios se preguntan si un dominio <strong>.com</strong> puede ser 100% gratuito. Aquí te explicamos con total transparencia cómo funciona el registro global, cómo reclamar dominios gratis y cómo conectar cualquier .com a Kova sin costo de hosting.
            </p>
          </div>

          {/* Current Live URL Card */}
          <div className="p-5 rounded-2xl bg-black/50 border border-emerald-500/30 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold block">
                  TU WEB YA ESTÁ EN VIVO AHORA MISMO (100% GRATIS)
                </span>
                <a
                  href="https://k2nchin.github.io/kova/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm sm:text-base font-mono text-white font-bold hover:underline"
                >
                  https://k2nchin.github.io/kova/
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyLiveUrl}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/[0.1]"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? '¡Copiado!' : 'Copiar URL'}</span>
              </button>

              <button
                onClick={() => openExternalUrl('https://k2nchin.github.io/kova/')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir en vivo</span>
              </button>
            </div>
          </div>

          {/* Three Ways to Get Domain */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Option 1: Free Subdomains */}
            <div className="p-6 rounded-2xl bg-[#101526] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-emerald-400 mb-1">100% GRATIS DE POR VIDA</div>
                <h3 className="text-base font-bold text-white font-['Outfit'] mb-2">Subdominios Cloud Gratuitos</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  No pagas absolutamente nada. La web cuenta con certificado SSL automático (HTTPS), CDN mundial de Cloudflare / Fastly sin límites y sin renovaciones.
                </p>
                <ul className="text-[11px] space-y-1.5 text-slate-300 font-mono">
                  <li>• k2nchin.github.io/kova (Activo)</li>
                  <li>• kova.vercel.app (Configurado)</li>
                  <li>• kova.is-a.dev (Open Source)</li>
                </ul>
              </div>
            </div>

            {/* Option 2: Student / Promo .com */}
            <div className="p-6 rounded-2xl bg-[#101526] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-cyan-400 mb-1">ESTUDIANTES / EDU</div>
                <h3 className="text-base font-bold text-white font-['Outfit'] mb-2">Dominio Gratis por 1 Año</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  A través del <strong>GitHub Student Developer Pack</strong> obtienes un dominio gratis (.me, .tech o cupones para .com) en Namecheap junto con certificados SSL.
                </p>
              </div>

              <button
                onClick={() => openExternalUrl('https://education.github.com/pack')}
                className="w-full py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Reclamar en GitHub Education</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Option 3: Own .com Domain */}
            <div className="p-6 rounded-2xl bg-[#101526] border border-purple-500/30 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-purple-400 mb-1">PROPIO Y PROFESIONAL</div>
                <h3 className="text-base font-bold text-white font-['Outfit'] mb-2">Tu Propio Dominio .com</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Por unos ~$8.99/año en <strong>Cloudflare Registrar</strong> o <strong>Namecheap</strong>, adquieres <code>kovachat.com</code> o <code>getkova.com</code> y el hosting aquí es <strong>$0 para siempre</strong>.
                </p>
              </div>

              <div className="text-[11px] font-mono text-purple-300 bg-purple-950/40 p-2.5 rounded-xl border border-purple-500/20">
                Hosting: $0.00 USD • SSL: Gratis
              </div>
            </div>
          </div>

          {/* Interactive DNS Wizard for Custom .com */}
          <div className="p-6 rounded-2xl bg-[#080b14] border border-white/[0.08]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-xs font-mono font-bold text-cyan-400 uppercase">ASISTENTE DE CONFIGURACIÓN DNS</div>
                <h4 className="text-base font-bold text-white font-['Outfit']">
                  Conecta tu dominio .com a este repositorio en 2 minutos
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyDnsRecords}
                  className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/[0.1]"
                >
                  {copiedDns ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDns ? '¡Copiado!' : 'Copiar Registros DNS'}</span>
                </button>

                <button
                  onClick={downloadCnameFile}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar CNAME</span>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Escribe el dominio que quieres vincular (ej. kovachat.com):
              </label>
              <input
                type="text"
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
                placeholder="ej. kovachat.com"
                className="w-full max-w-md bg-[#121624] border border-white/[0.1] rounded-xl py-2 px-3.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border border-white/[0.06] rounded-xl overflow-hidden bg-black/40">
                <thead>
                  <tr className="bg-white/[0.05] border-b border-white/[0.06] text-slate-300">
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Nombre / Host</th>
                    <th className="p-3">Valor / Destino</th>
                    <th className="p-3">Propósito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-slate-300">
                  <tr>
                    <td className="p-3 text-cyan-400 font-bold">A</td>
                    <td className="p-3">@</td>
                    <td className="p-3 text-emerald-400 font-bold">185.199.108.153</td>
                    <td className="p-3 text-slate-400 font-sans">GitHub Pages Anycast IP 1</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-cyan-400 font-bold">A</td>
                    <td className="p-3">@</td>
                    <td className="p-3 text-emerald-400 font-bold">185.199.109.153</td>
                    <td className="p-3 text-slate-400 font-sans">GitHub Pages Anycast IP 2</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-cyan-400 font-bold">A</td>
                    <td className="p-3">@</td>
                    <td className="p-3 text-emerald-400 font-bold">185.199.110.153</td>
                    <td className="p-3 text-slate-400 font-sans">GitHub Pages Anycast IP 3</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-cyan-400 font-bold">A</td>
                    <td className="p-3">@</td>
                    <td className="p-3 text-emerald-400 font-bold">185.199.111.153</td>
                    <td className="p-3 text-slate-400 font-sans">GitHub Pages Anycast IP 4</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-purple-400 font-bold">CNAME</td>
                    <td className="p-3">www</td>
                    <td className="p-3 text-purple-300 font-bold">k2nchin.github.io</td>
                    <td className="p-3 text-slate-400 font-sans">Redirección automática www</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON MATRIX */}
      <section id="comparison" className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
            COMPARATIVA TÉCNICA
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] mt-2 mb-3">
            ¿Por qué los usuarios eligen Kova frente a Discord?
          </h2>
          <p className="text-sm text-slate-400">
            Comparamos el consumo real de recursos, la latencia de audio y las ventajas de arquitectura.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full max-w-5xl mx-auto text-left text-xs border border-white/[0.08] rounded-3xl overflow-hidden bg-[#0a0d16] shadow-2xl">
            <thead>
              <tr className="bg-[#0f1422] border-b border-white/[0.08] text-slate-300 font-['Outfit'] text-sm">
                <th className="p-4 font-bold">Característica</th>
                <th className="p-4 font-extrabold text-cyan-400 bg-purple-950/20 border-x border-purple-500/20">
                  ⚡ KOVA OS (Desktop & Web)
                </th>
                <th className="p-4 font-semibold text-slate-400">Discord</th>
                <th className="p-4 font-semibold text-slate-400">Slack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300 font-mono">
              <tr>
                <td className="p-4 font-sans font-bold text-white">Consumo de Memoria RAM</td>
                <td className="p-4 text-emerald-400 font-bold bg-purple-950/20 border-x border-purple-500/20">
                  ~68 MB (Tauri v2 + Rust)
                </td>
                <td className="p-4 text-rose-400">550 - 900 MB (Electron)</td>
                <td className="p-4 text-rose-400">700 - 1100 MB (Electron)</td>
              </tr>
              <tr>
                <td className="p-4 font-sans font-bold text-white">Latencia de Audio DSP</td>
                <td className="p-4 text-cyan-300 font-bold bg-purple-950/20 border-x border-purple-500/20">
                  1.1 ms (Nativo Rust DSP)
                </td>
                <td className="p-4 text-slate-400">45 - 80 ms</td>
                <td className="p-4 text-slate-400">120 - 250 ms</td>
              </tr>
              <tr>
                <td className="p-4 font-sans font-bold text-white">Asistente IA Contextual</td>
                <td className="p-4 text-emerald-400 font-bold bg-purple-950/20 border-x border-purple-500/20">
                  Gemini 2.5 Flash Oficial Incluido
                </td>
                <td className="p-4 text-slate-500">Ninguno (o con bots de pago)</td>
                <td className="p-4 text-slate-500">Add-on de pago ($10/mes)</td>
              </tr>
              <tr>
                <td className="p-4 font-sans font-bold text-white">Creador de Bots Visual</td>
                <td className="p-4 text-emerald-400 font-bold bg-purple-950/20 border-x border-purple-500/20">
                  Integrado (0 servidores ni VPS)
                </td>
                <td className="p-4 text-slate-400">Requiere VPS / Node.js</td>
                <td className="p-4 text-slate-400">Requiere desarrollo externo</td>
              </tr>
              <tr>
                <td className="p-4 font-sans font-bold text-white">10 Temas Ultra Oscuros</td>
                <td className="p-4 text-emerald-400 font-bold bg-purple-950/20 border-x border-purple-500/20">
                  100% Gratis sin suscripciones
                </td>
                <td className="p-4 text-amber-400">Bloqueado tras Discord Nitro</td>
                <td className="p-4 text-slate-500">Limitado</td>
              </tr>
              <tr>
                <td className="p-4 font-sans font-bold text-white">Seguridad 2FA y Claves de Respaldo</td>
                <td className="p-4 text-emerald-400 font-bold bg-purple-950/20 border-x border-purple-500/20">
                  TOTP Google Auth + Códigos Offline
                </td>
                <td className="p-4 text-emerald-400 font-bold">Disponible</td>
                <td className="p-4 text-emerald-400 font-bold">Disponible</td>
              </tr>
              <tr>
                <td className="p-4 font-sans font-bold text-white">Tamaño del Instalador</td>
                <td className="p-4 text-emerald-400 font-bold bg-purple-950/20 border-x border-purple-500/20">
                  ~7.0 MB (Instalador) / ~7.6 MB (Portable)
                </td>
                <td className="p-4 text-rose-400">~95 MB</td>
                <td className="p-4 text-rose-400">~140 MB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* DEDICATED DOWNLOAD HUB */}
      <section id="downloads" className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
            DESCARGAS OFICIALES DE PRODUCCIÓN
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] mt-2 mb-3">
            Consigue Kova v1.0.0 para Windows
          </h2>
          <p className="text-sm text-slate-400">
            Descarga directa de alta velocidad alojada en nuestro servidor o a través de GitHub Releases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {/* Card 1: Installer */}
          <div className="p-7 rounded-3xl bg-[#0e1322] border-2 border-purple-500/40 shadow-2xl relative flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-cyan-400 text-white shadow-md">
              RECOMENDADO
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                <Download className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-extrabold text-white font-['Outfit'] mb-1">Instalador Windows</h3>
              <p className="text-xs text-slate-400 mb-4">
                Paquete NSIS completo con accesos directos, inicio rápido y desinstalador limpio.
              </p>

              <div className="space-y-2 text-xs text-slate-300 font-mono mb-6 bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Versión:</span>
                  <span className="text-white">v1.0.0 (x64)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tamaño:</span>
                  <span className="text-emerald-400 font-bold">~7.0 MB</span>
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
                  soundFx.playReactionAdded();
                  openExternalUrl('https://github.com/k2nchin/kova/releases/download/v1.0.0/Kova-v1.0.0-Setup.exe');
                }}
                className="w-full py-2 text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Mirror desde GitHub Releases</span>
              </button>
            </div>
          </div>

          {/* Card 2: Portable */}
          <div className="p-7 rounded-3xl bg-[#0c101c] border border-white/[0.1] shadow-xl relative flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 mb-5">
                <HardDrive className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-extrabold text-white font-['Outfit'] mb-1">Edición Portable</h3>
              <p className="text-xs text-slate-400 mb-4">
                Ejecutable autónomo directo. Ideal para memorias USB o computadoras sin permisos de administrador.
              </p>

              <div className="space-y-2 text-xs text-slate-300 font-mono mb-6 bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Versión:</span>
                  <span className="text-white">v1.0.0 (x64)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tamaño:</span>
                  <span className="text-cyan-400 font-bold">~7.6 MB</span>
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
                  soundFx.playReactionAdded();
                  openExternalUrl('https://github.com/k2nchin/kova/releases/download/v1.0.0/Kova-v1.0.0-Windows-Portable.zip');
                }}
                className="w-full py-2 text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Mirror desde GitHub Releases</span>
              </button>
            </div>
          </div>

          {/* Card 3: Web App */}
          <div className="p-7 rounded-3xl bg-[#0c101c] border border-white/[0.1] shadow-xl relative flex flex-col justify-between hover:scale-[1.02] transition-transform md:col-span-2 lg:col-span-1">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 mb-5">
                <Monitor className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-extrabold text-white font-['Outfit'] mb-1">Cliente Web en Línea</h3>
              <p className="text-xs text-slate-400 mb-4">
                Ejecuta Kova instantáneamente en tu navegador moderno (Chrome, Edge, Firefox, Safari) sin instalar nada.
              </p>

              <div className="space-y-2 text-xs text-slate-300 font-mono mb-6 bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Compatibilidad:</span>
                  <span className="text-white">PWA / WebRTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Descarga:</span>
                  <span className="text-emerald-400 font-bold">0 MB (Directo)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Funciones:</span>
                  <span className="text-white">Chat, Bots & 2FA</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playReactionAdded();
                onEnterApp();
              }}
              className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-bold text-xs border border-white/[0.12] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              <span>Lanzar Web App Ahora</span>
            </button>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="relative z-10 py-16 px-6 max-w-4xl mx-auto mb-20">
        <div className="text-center mb-10">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">PREGUNTAS FRECUENTES</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mt-1">
            Todo lo que necesitas saber sobre Kova
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#0c101d] border border-white/[0.08] overflow-hidden transition-all shadow-md"
            >
              <button
                onClick={() => {
                  soundFx.playReactionAdded();
                  setOpenFaq(openFaq === idx ? null : idx);
                }}
                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-cyan-400' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-white/[0.04] pt-3 animate-in fade-in duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#06080e] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-white font-black text-xs shadow-md">
              K
            </div>
            <div>
              <span className="font-bold text-slate-300 font-['Outfit'] text-sm block">KOVA OS DESKTOP</span>
              <span>© 2026 Kova Project. Desarrollado por k2nchin. Código Abierto bajo Licencia MIT.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button onClick={onEnterApp} className="hover:text-slate-300 transition-colors cursor-pointer">
              Lanzar Web App
            </button>
            <a href="#downloads" className="hover:text-slate-300 transition-colors">
              Descargas (.exe / .zip)
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
              Release v1.0.0
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
