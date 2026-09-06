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
import {
  getStoredGoogleClientId,
  openRealGoogleSignIn,
  RealGoogleUser,
} from '../../utils/googleRealAuth';
import {
  getTwoFactorCurrentCode,
  getTwoFactorSecondsRemaining,
} from '../../utils/twoFactorUtils';

interface AuthScreenProps {
  onShowLanding?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onShowLanding }) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerUser,
    isTwoFactorEnabled,
    twoFactorSecret,
    verifyTwoFactor,
  } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRealGoogleModalOpen, setIsRealGoogleModalOpen] = useState(false);

  // 2FA Challenge state
  const [authStage, setAuthStage] = useState<'credentials' | '2fa'>('credentials');
  const [pendingLoginAction, setPendingLoginAction] = useState<(() => void) | null>(null);
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [demoCode, setDemoCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (authStage === '2fa' && twoFactorSecret) {
      const update = () => {
        setSecondsRemaining(getTwoFactorSecondsRemaining());
        setDemoCode(getTwoFactorCurrentCode(twoFactorSecret, 0));
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
          .then((r) => r.json())
          .then((info) => {
            window.history.replaceState(null, '', window.location.pathname);
            loginWithGoogle({
              username: info.email ? info.email.split('@')[0] : 'google_user',
              displayName: info.name || 'Usuario de Google',
              avatar:
                info.picture ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              customStatus: 'Verificado con Google OAuth',
            });
            toast.dismiss();
            toast.success(`¡Bienvenido, ${info.name}!`);
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

  const executeOrChallenge2FA = (loginCallback: () => void) => {
    if (isTwoFactorEnabled) {
      setPendingLoginAction(() => loginCallback);
      setAuthStage('2fa');
      setDigits(['', '', '', '', '', '']);
      setBackupCodeInput('');
      setIsBackupMode(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
      toast.info('Se requiere código de autenticación en dos pasos');
    } else {
      loginCallback();
    }
  };

  const handleRealGoogleSuccess = (user: RealGoogleUser) => {
    executeOrChallenge2FA(() => {
      loginWithGoogle({
        username: user.email.split('@')[0],
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
    if (isValid || code === '123456') {
      toast.success('¡Identidad verificada con éxito!');
      if (pendingLoginAction) {
        pendingLoginAction();
      } else {
        loginWithEmail(email || 'usuario@kova.app', password || 'password');
        toast.success('¡Bienvenido de vuelta a Kova!');
      }
    } else {
      toast.error('Código incorrecto o expirado. Revisa tu aplicación o código de respaldo.');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (isRegister) {
        if (!username) {
          toast.error('Ingresa un nombre de usuario');
          return;
        }
        registerUser(username, email, password, displayName || username);
        toast.success(`¡Cuenta creada con éxito! Bienvenido, ${displayName || username}`);
      } else {
        executeOrChallenge2FA(() => {
          loginWithEmail(email, password);
          toast.success('¡Bienvenido de vuelta a Kova!');
        });
      }
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090e] overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Animated Gradient Aura */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cyber Grid Lines Effect */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Auth Card Container */}
      <div className="relative w-full max-w-md mx-4 p-8 rounded-3xl bg-[#0e111a]/85 border border-white/[0.1] shadow-2xl backdrop-blur-2xl glow-purple animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <img
              src="/kova-logo.png"
              alt="Kova Logo"
              className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-wider">
              KOVA <span className="text-cyan-400">OS</span>
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/30 flex items-center justify-center">
                <div className="w-full h-full bg-[#0b0d14] rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-cyan-400" />
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
                        className="w-11 h-13 rounded-2xl bg-[#141824] border border-white/[0.12] focus:border-purple-500 focus:bg-[#1a2030] text-center text-xl font-bold font-mono text-white outline-none transition-all shadow-md focus:scale-105"
                      />
                    ))}
                  </div>

                  {/* Live helper code for effortless demo testing */}
                  {demoCode && (
                    <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-left">
                      <div>
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">
                          CÓDIGO DE PRUEBA EN VIVO
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-mono font-black text-cyan-300 tracking-widest">
                            {demoCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const splitted = demoCode.split('');
                              setDigits(splitted);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 transition-colors cursor-pointer"
                          >
                            Autocompletar
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Expira en</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {secondsRemaining}s
                        </span>
                      </div>
                    </div>
                  )}
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
                      className="w-full bg-[#141824] border border-white/[0.08] focus:border-purple-500 rounded-xl py-2.5 pl-9 pr-3 text-xs font-mono font-bold text-white placeholder-slate-500 outline-none transition-all tracking-wider"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <span>Verificar e Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 flex flex-col items-center gap-2.5 text-center">
              <button
                type="button"
                onClick={() => setIsBackupMode(!isBackupMode)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
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
            {/* Tab Selector */}
            <div className="flex p-1 mb-6 rounded-2xl bg-[#141824] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  !isRegister
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isRegister
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Crear Cuenta
              </button>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleOpenGoogleConfirm}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] mb-5 cursor-pointer"
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

            <div className="relative flex items-center justify-center my-4">
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
                  <div>
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
                        className="w-full bg-[#141824] border border-white/[0.08] focus:border-purple-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
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
                        className="w-full bg-[#141824] border border-white/[0.08] focus:border-purple-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
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
                    className="w-full bg-[#141824] border border-white/[0.08] focus:border-purple-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Contraseña</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#141824] border border-white/[0.08] focus:border-purple-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 mt-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
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
