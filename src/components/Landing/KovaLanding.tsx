import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Bot, Headphones, Lock, Mic, MicOff, Monitor, Sparkles, Volume2 } from 'lucide-react';
import { WINDOWS_INSTALLER_URL, WINDOWS_INSTALLER_SIZE_MB } from '../../data/downloads';
import '../Brand/chrome.css';
import { ChromeRoom } from '../Brand/ChromeRoom';

interface KovaLandingProps { onEnterApp: (mode?: 'login' | 'register') => void; inviteCode?: string | null; }

const ease = [0.22, 1, 0.36, 1] as const;
const navItems = [{ label: 'Cómo funciona', href: '#como-funciona' }, { label: 'Funciones', href: '#funciones' }, { label: 'Descargas', href: '#descargas' }];
const marqueeWords = ['Texto', 'Voz', 'Kova IA', 'Historias', 'Bots', 'Espacios'];

function Cube({ className = '' }: { className?: string }) {
  return <img src="/kova-chrome-cube.png" alt="" aria-hidden="true" className={`object-contain ${className}`} />;
}

function VoiceCard() {
  const people = [
    { name: 'Lucía', speaking: true, muted: false },
    { name: 'Mateo', speaking: false, muted: false },
    { name: 'Sofía', speaking: false, muted: true },
  ];
  return (
    <div className="kl-glass w-[min(340px,86vw)] rounded-[22px] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F5F7]"><Headphones className="h-4 w-4 text-[#C2C4C8]" /> Sala de estudio</div>
        <span className="flex items-center gap-1.5 text-xs text-[#797B7E]"><span className="h-1.5 w-1.5 rounded-full bg-[#C2C4C8]" /> En vivo</span>
      </div>
      <ul className="mt-5 space-y-3">
        {people.map((person) => (
          <li key={person.name} className="flex items-center gap-3">
            <span className={`grid h-9 w-9 place-items-center rounded-full bg-[#454749] text-xs font-bold text-[#F4F5F7] ${person.speaking ? 'kl-speaking' : ''}`}>{person.name[0]}</span>
            <span className="flex-1 text-sm text-[#C2C4C8]">{person.name}</span>
            {person.muted ? <MicOff className="h-4 w-4 text-[#797B7E]" aria-label="Silenciada" /> : <Mic className="h-4 w-4 text-[#797B7E]" aria-label="Micrófono activo" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InviteStack() {
  return (
    <div className="relative h-[220px] w-[min(320px,80vw)]" aria-hidden="true">
      {[2, 1, 0].map((depth) => (
        <div key={depth} className="kl-glass absolute inset-x-0 rounded-[18px] p-5" style={{ top: depth * 18, transform: `translateX(${depth * 16}px) scale(${1 - depth * 0.05})`, opacity: 1 - depth * 0.28 }}>
          <div className="flex items-center gap-3">
            <Cube className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold text-[#F4F5F7]">Club de diseño</p>
              <p className="text-xs text-[#797B7E]">Te invitaron a unirte</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-[#C2C4C8] py-2.5 text-center text-xs font-bold text-[#0A0A0B]">Aceptar invitación</div>
        </div>
      ))}
    </div>
  );
}

const steps = [
  { title: 'Crea tu espacio', body: 'Ponle nombre, icono y los canales que tu grupo necesita: anuncios, charla, voz.' },
  { title: 'Invita con un enlace', body: 'Comparte el enlace. Quien lo abra entra a tu espacio desde la web o la app.' },
  { title: 'Habla y crea', body: 'Escribe, entra a una sala de voz, publica historias o pide ayuda a Kova IA.' },
];

const features = [
  { Icon: Sparkles, title: 'Kova IA en cada canal', body: 'Resume lo que te perdiste, traduce mensajes y prepara minutas sin salir de la conversación.', wide: true },
  { Icon: Lock, title: 'Cuenta protegida', body: 'Verificación en dos pasos con tu app de autenticación y códigos de respaldo.', wide: false },
  { Icon: Volume2, title: 'Historias de 24 horas', body: 'Comparte una imagen o una idea con tu gente. Desaparece al día siguiente.', wide: false },
  { Icon: Bot, title: 'Bots a tu medida', body: 'Crea un bot con su prefijo, sus comandos y respuestas automáticas para tu espacio.', wide: true },
];

const platforms = [
  { name: 'Web', status: 'Disponible' },
  { name: 'Windows', status: 'Disponible' },
  { name: 'Android', status: 'Próximamente' },
  { name: 'macOS', status: 'Próximamente' },
  { name: 'iOS', status: 'Próximamente' },
];

export const KovaLanding: React.FC<KovaLandingProps> = ({ onEnterApp, inviteCode }) => {
  const reduceMotion = useReducedMotion();
  const wordsRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: wordsRef, offset: ['start end', 'end start'] });
  const leftWord = useTransform(scrollYProgress, [0, 1], reduceMotion ? ['0%', '0%'] : ['-18%', '6%']);
  const rightWord = useTransform(scrollYProgress, [0, 1], reduceMotion ? ['0%', '0%'] : ['18%', '-6%']);

  return (
    <div className="kl-root min-h-screen overflow-x-hidden bg-[#0A0A0B] text-[#C2C4C8] selection:bg-[#C2C4C8]/25">
      <a href="#contenido-kova" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#C2C4C8] focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-[#0A0A0B]">Saltar al contenido</a>

      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" aria-label="Volver al inicio de Kova" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="kl-pill flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4">
            <Cube className="h-8 w-8" />
            <span className="font-['Outfit'] text-sm font-bold tracking-[.18em] text-[#F4F5F7]">KOVA</span>
          </button>
          <nav className="kl-pill hidden items-center gap-1 rounded-full p-1 md:flex" aria-label="Secciones">
            {navItems.map((item) => <a key={item.href} href={item.href} className="rounded-full px-4 py-2 text-[13px] text-[#C2C4C8] transition-colors hover:bg-white/[.06] hover:text-[#F4F5F7]">{item.label}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onEnterApp('login')} className="kl-pill hidden rounded-full px-4 py-2.5 text-[13px] text-[#C2C4C8] transition-colors hover:text-[#F4F5F7] sm:block">Iniciar sesión</button>
            <button type="button" onClick={() => onEnterApp('register')} className="kl-chrome-button rounded-full px-4 py-2.5 text-[13px] font-semibold">Crear cuenta</button>
          </div>
        </div>
      </header>

      {inviteCode && (
        <div className="fixed inset-x-0 top-20 z-30 mx-auto max-w-xl px-4">
          <div className="kl-glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold text-[#F4F5F7]">Te invitaron a un espacio de Kova</p><p className="mt-1 text-xs text-[#797B7E]">Únete desde la app o continúa en la web.</p></div>
            <div className="flex gap-2">
              <a href={`kova://invite/${encodeURIComponent(inviteCode)}`} className="kl-chrome-button rounded-full px-4 py-2 text-xs font-semibold">Abrir la app</a>
              <button type="button" onClick={() => onEnterApp('register')} className="kl-pill rounded-full px-4 py-2 text-xs text-[#C2C4C8]">Seguir en la web</button>
            </div>
          </div>
        </div>
      )}

      <main id="contenido-kova">
        {/* Hero: the one orchestrated moment of the page */}
        <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5">
          <ChromeRoom />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.6, rotate: -18 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.1, ease }} className="mx-auto mb-8 w-fit">
              <Cube className="kl-float h-20 w-20 sm:h-24 sm:w-24" />
            </motion.div>
            <h1 className="font-['Outfit'] text-[clamp(3rem,9vw,7.25rem)] font-semibold leading-[.92] tracking-[-.055em]">
              {['Tu comunidad,', 'en una señal.'].map((line, index) => (
                <motion.span key={line} className="kl-chrome-text block" initial={reduceMotion ? false : { opacity: 0, y: 40, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1, delay: 0.25 + index * 0.18, ease }}>{line}</motion.span>
              ))}
            </h1>
            <motion.p initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.75 }} className="mx-auto mt-7 max-w-xl text-base leading-7 text-[#9A9CA0] sm:text-lg">
              Canales de texto, salas de voz e IA en un mismo lugar. Crea un espacio para tu grupo y empieza a hablar en un minuto.
            </motion.p>
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.9, ease }} className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={() => onEnterApp('register')} className="kl-chrome-button rounded-full px-6 py-3.5 text-sm font-semibold">Crear cuenta gratis</button>
              <a href={WINDOWS_INSTALLER_URL} className="kl-pill flex items-center gap-2 rounded-full px-6 py-3.5 text-sm text-[#F4F5F7]"><Monitor className="h-4 w-4" /> Descargar para Windows</a>
            </motion.div>
          </div>
          <a href="#marquesina" className="absolute bottom-7 right-6 z-10 hidden text-xs text-[#797B7E] transition-colors hover:text-[#C2C4C8] sm:block">Desliza para explorar</a>
        </section>

        {/* Giant marquee + statement */}
        <section id="marquesina" className="relative overflow-hidden border-t border-[#1E1F20] pb-24 pt-14">
          <div className="kl-marquee" aria-hidden="true">
            <div className="kl-marquee-track">
              {[...marqueeWords, ...marqueeWords].map((word, index) => (
                <span key={`${word}${index}`} className={`font-['Outfit'] text-[clamp(4rem,12vw,10rem)] font-semibold leading-none tracking-[-.05em] ${index % 2 ? 'kl-outline-text' : 'kl-chrome-text'}`}>{word}</span>
              ))}
            </div>
          </div>
          <div className="mx-auto mt-20 grid max-w-6xl items-center gap-14 px-5 sm:px-8 md:grid-cols-2">
            <div className="flex items-center gap-6">
              <div className="kl-halo shrink-0"><Cube className="h-24 w-24 sm:h-28 sm:w-28" /></div>
              <h2 className="font-['Outfit'] text-[clamp(2.2rem,4.6vw,3.6rem)] font-medium leading-[1] tracking-[-.04em] text-[#F4F5F7]">Tu espacio.<br /><span className="text-[#797B7E]">Tu ritmo.</span></h2>
            </div>
            <div className="max-w-md">
              <p className="text-xl leading-8 text-[#F4F5F7]">Todo lo que tu grupo hace en un solo sitio.</p>
              <p className="mt-4 text-[15px] leading-7 text-[#797B7E]">Mensajes que llegan al instante, salas de voz para quedarse a hablar y un asistente que te pone al día. Sin saltar entre apps.</p>
            </div>
          </div>
        </section>

        {/* How it works: a real sequence, so numbered */}
        <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <h2 className="text-center font-['Outfit'] text-[clamp(2.4rem,5vw,4rem)] font-medium tracking-[-.045em] text-[#F4F5F7]">¿Cómo funciona?</h2>
          <p className="mt-3 text-center text-[15px] text-[#797B7E]">De cero a tu comunidad en tres pasos.</p>
          <div className="kl-stage relative mt-14 flex min-h-[340px] items-center justify-center overflow-hidden rounded-[28px] border border-[#1E1F20]">
            <svg className="kl-wave absolute inset-0 h-full w-full" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="kl-wave-gradient" x1="0" x2="1">
                  <stop offset="0" stopColor="#454749" stopOpacity="0" />
                  <stop offset=".5" stopColor="#F4F5F7" stopOpacity=".55" />
                  <stop offset="1" stopColor="#454749" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <path key={i} d={`M0 ${230 + i * 9} C 300 ${120 + i * 14}, 520 ${360 - i * 10}, 760 ${210 + i * 6} S 1100 ${120 + i * 12}, 1200 ${190 + i * 8}`} fill="none" stroke="url(#kl-wave-gradient)" strokeWidth={1.2} opacity={1 - i * 0.13} />
              ))}
            </svg>
            <InviteStack />
          </div>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t border-[#454749]/60 pt-6">
                <span className="font-['Outfit'] text-sm text-[#797B7E]">Paso {index + 1}</span>
                <h3 className="mt-3 text-lg font-semibold text-[#F4F5F7]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#797B7E]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Giant words with a floating voice room */}
        <section ref={wordsRef} className="relative flex min-h-[80svh] items-center justify-center overflow-hidden py-24" aria-label="Voz y texto">
          <motion.span style={{ x: leftWord }} className="kl-chrome-text pointer-events-none absolute left-0 top-[22%] font-['Outfit'] text-[clamp(5rem,17vw,15rem)] font-semibold leading-none tracking-[-.06em]" aria-hidden="true">Voz</motion.span>
          <motion.span style={{ x: rightWord }} className="kl-outline-text pointer-events-none absolute bottom-[4%] right-0 font-['Outfit'] text-[clamp(5rem,17vw,15rem)] font-semibold leading-none tracking-[-.06em]" aria-hidden="true">Texto</motion.span>
          <div className="relative z-10 flex flex-col items-center px-5">
            <div className="kl-halo-soft"><VoiceCard /></div>
            <p className="mt-8 max-w-sm text-center text-sm leading-6 text-[#797B7E]">Entra a una sala con un clic. Silencia, ensordece o usa pulsar para hablar cuando lo necesites.</p>
          </div>
        </section>

        {/* Bento */}
        <section id="funciones" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <h2 className="max-w-xl font-['Outfit'] text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1.02] tracking-[-.045em] text-[#F4F5F7]">Hecho para grupos que hablan todos los días.</h2>
          <div className="mt-14 grid gap-4 md:grid-cols-5">
            {features.map(({ Icon, title, body, wide }) => (
              <article key={title} className={`kl-tile relative overflow-hidden rounded-[24px] p-7 ${wide ? 'md:col-span-3' : 'md:col-span-2'}`}>
                <div className="kl-tile-orb" aria-hidden="true" />
                <span className="kl-icon-chip grid h-12 w-12 place-items-center rounded-2xl"><Icon className="h-5 w-5 text-[#F4F5F7]" /></span>
                <h3 className="mt-16 text-xl font-semibold text-[#F4F5F7]">{title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#797B7E]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Horizon + platforms */}
        <section id="descargas" className="relative overflow-hidden pt-24">
          <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
            <h2 className="kl-chrome-text font-['Outfit'] text-[clamp(2.4rem,5.4vw,4.4rem)] font-medium leading-[1.02] tracking-[-.045em]">Donde estés, tu gente sigue ahí.</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-[#797B7E]">Empieza en el navegador y sigue en el escritorio con la misma cuenta.</p>
            <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2">
              {platforms.map((platform) => (
                <li key={platform.name} className={`rounded-full border px-4 py-2 text-sm ${platform.status === 'Disponible' ? 'border-[#C2C4C8]/40 text-[#F4F5F7]' : 'border-[#454749]/60 text-[#797B7E]'}`}>
                  {platform.name} <span className="ml-1 text-xs text-[#797B7E]">{platform.status}</span>
                </li>
              ))}
            </ul>
            <a href={WINDOWS_INSTALLER_URL} className="kl-chrome-button mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"><Monitor className="h-4 w-4" /> Descargar para Windows <span className="font-normal opacity-60">{WINDOWS_INSTALLER_SIZE_MB}</span></a>
          </div>
          <div className="kl-horizon" aria-hidden="true" />
        </section>

        {/* Finale */}
        <section className="relative overflow-hidden pb-16 pt-28">
          <div className="kl-discs" aria-hidden="true">
            <span className="kl-disc" style={{ left: '10%', top: '0%', width: '24vw' }} />
            <span className="kl-disc" style={{ left: '38%', top: '-6%', width: '22vw', animationDelay: '-4s' }} />
            <span className="kl-disc" style={{ left: '64%', top: '4%', width: '24vw', animationDelay: '-8s' }} />
          </div>
          <h2 className="kl-mega relative z-10 whitespace-nowrap text-center font-['Outfit'] font-semibold leading-[.85] tracking-[-.07em]">Hablemos.</h2>
          <div className="relative z-10 mx-auto mt-10 flex max-w-md flex-col items-center px-5 text-center">
            <p className="text-[15px] leading-7 text-[#9A9CA0]">Crea tu cuenta, abre tu primer espacio e invita a quien quieras. Es gratis.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => onEnterApp('register')} className="kl-chrome-button rounded-full px-6 py-3.5 text-sm font-semibold">Crear cuenta gratis</button>
              <button type="button" onClick={() => onEnterApp('login')} className="kl-pill rounded-full px-6 py-3.5 text-sm text-[#F4F5F7]">Ya tengo cuenta</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1E1F20]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-[#797B7E] sm:flex-row sm:px-8">
          <div className="flex items-center gap-2"><Cube className="h-6 w-6" /> © 2026 Kova</div>
          <nav className="flex gap-6" aria-label="Pie de página">
            <a href="#como-funciona" className="hover:text-[#C2C4C8]">Cómo funciona</a>
            <a href="#funciones" className="hover:text-[#C2C4C8]">Funciones</a>
            <a href="/downloads" className="hover:text-[#C2C4C8]">Descargas</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};
