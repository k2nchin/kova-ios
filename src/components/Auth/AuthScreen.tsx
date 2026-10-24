import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Globe,
  Smartphone,
  KeyRound,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { GoogleRealAuthModal } from './GoogleRealAuthModal';
import { NavigationTabs } from '../Common/NavigationTabs';
import {
  getStoredGoogleClientId,
  openExternalUrl,
  openRealGoogleSignIn,
  RealGoogleUser,
} from '../../utils/googleRealAuth';
import {
  getTwoFactorSecondsRemaining,
} from '../../utils/twoFactorUtils';
import { isDesktopApp, isTauriApp } from '../../utils/platform';

interface AuthScreenProps {
  onShowLanding?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onShowLanding }) => {
  const {
    loginWithGoogle,
    loginAsGuest,
    loginWithEmail,
    registerUser,
    isTwoFactorEnabled,
    twoFactorSecret,
    verifyTwoFactor,
  } = useApp();
  const [isRegister, setIsRegister] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'register'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRealGoogleModalOpen, setIsRealGoogleModalOpen] = useState(false);

  // 2FA Challenge state
  const [authStage, setAuthStage] = useState<'credentials' | '2fa'>('credentials');
  const [pendingLoginAction, setPendingLoginAction] = useState<(() => Promise<void>) | null>(null);
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isDesktop = isDesktopApp();
  const isNativeApp = isTauriApp();
  const isDesktopGoogleBridge = !isNativeApp && new URLSearchParams(window.location.search).get('desktopGoogle') === '1';

  // Keep the latest login handler and 2FA flag in refs so the deep-link effect
  // doesn't re-register on every render (identity changes each render).
  const loginWithGoogleRef = useRef(loginWithGoogle);
  loginWithGoogleRef.current = loginWithGoogle;
  const isTwoFactorEnabledRef = useRef(isTwoFactorEnabled);
  isTwoFactorEnabledRef.current = isTwoFactorEnabled;

  const runLoginAction = async (loginCallback: () => Promise<void>) => {
    try {
      setIsLoading(true);
      await loginCallback();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const executeOrChallenge2FA = (loginCallback: () => Promise<void>) => {
    if (isTwoFactorEnabledRef.current) {
      setPendingLoginAction(() => loginCallback);
      setAuthStage('2fa');
      setDigits(['', '', '', '', '', '']);
      setBackupCodeInput('');
      setIsBackupMode(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
      toast.info('Se requiere código de autenticación en dos pasos');
    } else {
      void runLoginAction(loginCallback);
    }
  };

  useEffect(() => {
    if (!isNativeApp) return;

    let disposed = false;
    let unlisten: (() => void) | undefined;

    const completeDesktopGoogle = async (rawUrl: string) => {
      try {
        const callbackUrl = new URL(rawUrl);
        if (callbackUrl.protocol !== 'kova:' || callbackUrl.hostname !== 'auth') return;
        const accessToken = callbackUrl.searchParams.get('access_token');
        if (!accessToken) throw new Error('Google no devolvió una credencial válida.');

        setIsLoading(true);
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error('No se pudo verificar la cuenta de Google.');
        const info = await response.json();
        setIsLoading(false);
        executeOrChallenge2FA(async () => {
          await loginWithGoogleRef.current({
            id: info.sub,
            username: info.email ? info.email.split('@')[0] : 'google_user',
            email: info.email,
            googleAccessToken: accessToken,
            displayName: info.name || 'Usuario de Google',
            avatar: info.picture,
            customStatus: 'Conectado con Google OAuth',
          });
          toast.dismiss();
          toast.success(`¡Bienvenido, ${info.name || 'usuario de Kova'}!`);
        });
      } catch (error) {
        toast.dismiss();
        toast.error(error instanceof Error ? error.message : 'No se pudo completar el acceso con Google.');
      } finally {
        setIsLoading(false);
      }
    };

    void import('@tauri-apps/plugin-deep-link').then(async ({ getCurrent, onOpenUrl }) => {
      if (disposed) return;
      const initialUrls = await getCurrent();
      if (initialUrls?.[0]) await completeDesktopGoogle(initialUrls[0]);
      unlisten = await onOpenUrl((urls) => {
        if (urls[0]) void completeDesktopGoogle(urls[0]);
      });
    }).catch(() => {
      toast.error('Kova no pudo activar el retorno desde el navegador.');
      setIsLoading(false);
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNativeApp]);

  useEffect(() => {
    if (authStage === '2fa' && twoFactorSecret) {
      const update = () => {
        setSecondsRemaining(getTwoFactorSecondsRemaining());
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [authStage, twoFactorSecret]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Auto-handle Google redirect with OAuth token in URL hash
  useEffect(() => {
    if (window.location.hash.includes('access_token=')) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setIsLoading(true);
        toast.loading('Verificando tu cuenta de Google...');
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((r) => {
            if (!r.ok) throw new Error(`Google API error (${r.status})`);
            return r.json();
          })
          .then(async (info) => {
            window.history.replaceState(null, '', window.location.pathname);
            setIsLoading(false);
            executeOrChallenge2FA(async () => {
              await loginWithGoogleRef.current({
                id: info.sub,
                username: info.email ? info.email.split('@')[0] : 'google_user',
                email: info.email,
                googleAccessToken: accessToken,
                displayName: info.name || 'Usuario de Google',
                avatar:
                  info.picture ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                customStatus: 'Verificado con Google OAuth',
              });
              toast.dismiss();
              toast.success(`¡Bienvenido, ${info.name}!`);
            });
          })
          .catch(() => {
            toast.dismiss();
            toast.error('Error al verificar el token de Google');
          })
          .finally(() => setIsLoading(false));
      }
    }
  }, []);

  const handleOpenGoogleConfirm = () => {
    const clientId = getStoredGoogleClientId();
    setIsLoading(true);
    const toastId = toast.loading('Abriendo ventana de Google...');

    if (isNativeApp) {
      void openExternalUrl('https://kova-k2nchin.vercel.app/app?mode=login&desktopGoogle=1')
        .then(() => {
          setIsLoading(false);
          toast.dismiss(toastId);
          toast.info('Completa el acceso con Google en tu navegador. Kova se abrirá automáticamente al terminar.');
        })
        .catch(() => {
          setIsLoading(false);
          toast.dismiss(toastId);
          toast.error('No se pudo abrir el navegador para iniciar sesión.');
        });
      return;
    }

    // Safety timeout: if Google popup is closed or blocked, reset loading after 8s
    const timeout = setTimeout(() => {
      setIsLoading(false);
      toast.dismiss(toastId);
    }, 8000);

    try {
      openRealGoogleSignIn(
        clientId,
        (user: RealGoogleUser) => {
          clearTimeout(timeout);
          setIsLoading(false);
          toast.dismiss(toastId);
          handleRealGoogleSuccess(user);
        },
        (err: string) => {
          clearTimeout(timeout);
          setIsLoading(false);
          toast.dismiss(toastId);
          console.warn('[Google OAuth Error]', err);
          toast.error(err || 'No se pudo completar el inicio de sesión con Google');
        }
      );
    } catch (e: any) {
      clearTimeout(timeout);
      setIsLoading(false);
      toast.dismiss(toastId);
      toast.error(e?.message || 'Error al conectar con Google');
    }
  };

  const handleRealGoogleSuccess = (user: RealGoogleUser) => {
    if (isDesktopGoogleBridge) {
      window.location.assign(`kova://auth?access_token=${encodeURIComponent(user.accessToken)}`);
      toast.success('Cuenta confirmada. Regresando a Kova...');
      return;
    }
    executeOrChallenge2FA(async () => {
      await loginWithGoogle({
        id: user.id,
        username: user.email ? user.email.split('@')[0] : 'google_user',
        email: user.email,
        googleAccessToken: user.accessToken,
        displayName: user.name,
        avatar: user.picture,
        customStatus: 'Conectado con Google OAuth',
      });
      toast.success(`¡Autenticado con Google con éxito! Bienvenido, ${user.name}`);
    });
  };

  const handleDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      const cleanDigits = val.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newDigits = [...digits];
      cleanDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(cleanDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const char = val.slice(-1).replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = isBackupMode ? backupCodeInput.trim() : digits.join('');
    if (!code) {
      toast.error('Por favor introduce el código de verificación');
      return;
    }

    const isValid = verifyTwoFactor(code);
    if (isValid) {
      toast.success('¡Identidad verificada con éxito!');
      if (pendingLoginAction) {
        void runLoginAction(pendingLoginAction);
      } else {
        toast.error('La sesión pendiente expiró. Ingresa tus credenciales nuevamente.');
        setAuthStage('credentials');
      }
    } else {
      toast.error('Código incorrecto o expirado. Revisa tu aplicación o código de respaldo.');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (isRegister) {
      if (!username) {
        toast.error('Ingresa un nombre de usuario');
        return;
      }
      await runLoginAction(async () => {
        await registerUser(username, email, password, displayName || username);
        toast.success(`¡Cuenta creada con éxito! Bienvenido, ${displayName || username}`);
      });
    } else {
      executeOrChallenge2FA(async () => {
        await loginWithEmail(email, password);
        toast.success('¡Bienvenido de vuelta a Kova!');
      });
    }
  };

  return (
    <div className={`kova-auth-screen absolute inset-x-0 bottom-0 ${isDesktop ? 'top-[52px]' : 'top-0'} z-10 flex items-center justify-center bg-[#050607] overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]`}>
      {/* Background Animated Gradient Aura */}
      <div className="kova-auth-orb-a absolute -top-40 -left-40 w-96 h-96 bg-white/[0.06] rounded-full blur-3xl pointer-events-none" />
      <div className="kova-auth-orb-b absolute -bottom-40 -right-40 w-96 h-96 bg-slate-400/[0.08] rounded-full blur-3xl pointer-events-none" />
      <div className="kova-auth-orb-c absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-white/[0.025] rounded-full blur-3xl pointer-events-none" />

      {/* Cyber Grid Lines Effect (drifting) */}
      <div
        className="kova-auth-grid absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Auth Card Container */}
      <div className="kova-auth-card relative w-full max-w-md mx-4 p-8 rounded-[30px] bg-white/[0.07] border border-white/20 shadow-2xl backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="kova-auth-logo-wrap relative w-14 h-14 flex items-center justify-center">
            <div className="kova-auth-logo-ring" />
            <div className="kova-auth-logo-ring r2" />
            <img
              src="/kova-chrome-cube.png"
              alt="Kova Logo"
              className="kova-auth-logo w-14 h-14 object-contain"
            />
          </div>
          <div className="kova-auth-rise d-1">
            <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-wider">
              KOVA <span className="text-[#c9d1da]">OS</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isRegister
                ? 'Crea tu identidad en el ecosistema colaborativo'
                : 'Accede a tus espacios de audio, código y canvas'}
            </p>
          </div>
        </div>

        {authStage === '2fa' ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#858b93] to-[#edf1f5] p-0.5 shadow-lg shadow-black/30 flex items-center justify-center">
                <div className="w-full h-full bg-[#0b0d14] rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#c9d1da]" />
                </div>
              </div>
              <h2 className="text-xl font-black text-white font-['Outfit']">
                Verificación en Dos Pasos
              </h2>
              <p className="text-xs text-slate-400 max-w-xs">
                {isBackupMode
                  ? 'Introduce uno de tus códigos de respaldo de 8 caracteres.'
                  : 'Introduce el código de 6 dígitos de tu aplicación de autenticación.'}
              </p>
            </div>

            <form onSubmit={handleVerify2FASubmit} className="space-y-4">
              {!isBackupMode ? (
                <>
                  <div className="flex justify-center gap-2">
                    {digits.map((val, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                        className="kova-auth-2fa-input w-11 h-13 rounded-2xl bg-[#141824] border border-white/[0.12] focus:border-[#c9d1da] focus:bg-[#1a2030] text-center text-xl font-bold font-mono text-white outline-none transition-all shadow-md focus:scale-105"
                      />
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500">
                    El código cambia en aproximadamente {secondsRemaining} segundos.
                  </p>
                </>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    Código de respaldo (XXXX-XXXX)
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className="w-4 h-4 absolute left-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={backupCodeInput}
                      onChange={(e) => setBackupCodeInput(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX"
                      className="kova-auth-input w-full bg-[#141824] border border-white/[0.08] focus:border-[#c9d1da] rounded-xl py-2.5 pl-9 pr-3 text-xs font-mono font-bold text-white placeholder-slate-500 outline-none transition-all tracking-wider"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="kova-auth-cta w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#858b93] via-[#c9d1da] to-[#edf1f5] hover:from-[#aeb5bd] hover:to-white text-[#111214] font-bold text-xs shadow-lg shadow-black/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>Verificar e Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 flex flex-col items-center gap-2.5 text-center">
              <button
                type="button"
                onClick={() => setIsBackupMode(!isBackupMode)}
                className="text-xs text-[#c9d1da] hover:text-white transition-colors cursor-pointer"
              >
                {isBackupMode
                  ? '¿Tienes acceso a tu app? Usar código de 6 dígitos'
                  : '¿No tienes acceso a tu teléfono? Usar código de respaldo'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthStage('credentials');
                  setPendingLoginAction(null);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Volver al formulario de inicio de sesión</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Selector — NavigationTabs v4 */}
            <div className="kova-auth-rise d-2 mb-6">
              <NavigationTabs
                size="md"
                activeKey={isRegister ? 'register' : 'login'}
                onChange={(key) => setIsRegister(key === 'register')}
                items={[
                  { key: 'login', label: 'Iniciar Sesión' },
                  { key: 'register', label: 'Crear Cuenta' },
                ]}
              />
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleOpenGoogleConfirm}
              disabled={isLoading}
              className="kova-auth-rise d-3 w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] mb-5 cursor-pointer"
            >
              {/* Google SVG Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>
                {isLoading
                  ? 'Conectando con Google...'
                  : isRegister
                  ? 'Registrarse con Google'
                  : 'Continuar con Google'}
              </span>
            </button>

            {isNativeApp && !isDesktop && !isRegister && (
              <button
                type="button"
                onClick={() => void runLoginAction(loginAsGuest)}
                disabled={isLoading}
                className="kova-auth-rise d-3 w-full py-2.5 rounded-2xl border border-white/[0.14] bg-white/[0.04] hover:bg-white/[0.09] text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 mb-5"
              >
                <Smartphone className="w-4 h-4" />
                <span>Entrar como invitado de prueba</span>
              </button>
            )}

            <div className="kova-auth-rise d-3 relative flex items-center justify-center my-4">
              <div className="border-t border-white/[0.08] w-full" />
              <span className="bg-[#0e111a] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                o con correo
              </span>
              <div className="border-t border-white/[0.08] w-full" />
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {isRegister && (
                <>
                  <div className="kova-auth-rise d-3">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nombre de Usuario (@tag)
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 absolute left-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="juanpi1x"
                        className="kova-auth-input w-full bg-[#141824] border border-white/[0.08] focus:border-[#c9d1da] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="kova-auth-rise d-3">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nombre para mostrar
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 absolute left-3 text-slate-500" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Juan Jesús Enrique"
                        className="kova-auth-input w-full bg-[#141824] border border-white/[0.08] focus:border-[#c9d1da] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="kova-auth-rise d-4">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="kova-auth-input w-full bg-[#141824] border border-white/[0.08] focus:border-[#c9d1da] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="kova-auth-rise d-5">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Contraseña</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="kova-auth-input w-full bg-[#141824] border border-white/[0.08] focus:border-[#c9d1da] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="kova-auth-cta kova-auth-rise d-6 w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#858b93] via-[#c9d1da] to-[#edf1f5] hover:from-[#aeb5bd] hover:to-white text-[#111214] font-bold text-xs shadow-lg shadow-black/20 transition-all flex items-center justify-center gap-2 mt-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>{isRegister ? 'Crear Cuenta Kova' : 'Entrar a Kova'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {/* Security Badge */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-center">
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Autenticación Segura E2EE
          </span>
        </div>
      </div>

      {/* Real Google OAuth Modal */}
      <GoogleRealAuthModal
        isOpen={isRealGoogleModalOpen}
        onClose={() => setIsRealGoogleModalOpen(false)}
        onSuccess={handleRealGoogleSuccess}
        onFallbackSimulated={() => {
          setIsRealGoogleModalOpen(false);
          handleOpenGoogleConfirm();
        }}
      />
    </div>
  );
};
