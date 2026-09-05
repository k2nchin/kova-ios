import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  QrCode,
  KeyRound,
  Check,
  Copy,
  Download,
  ArrowRight,
  ArrowLeft,
  X,
  Smartphone,
  AlertTriangle,
  Lock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import {
  generateTwoFactorSecret,
  generateBackupCodes,
  generateQrSvg,
  getTwoFactorCurrentCode,
  getTwoFactorSecondsRemaining,
  verifyTwoFactorCode,
} from '../../utils/twoFactorUtils';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TwoFactorSetupModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser, enableTwoFactor } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [demoCode, setDemoCode] = useState('');
  const [hasConfirmedSaved, setHasConfirmedSaved] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      const newSecret = generateTwoFactorSecret();
      const newCodes = generateBackupCodes(8);
      setSecret(newSecret);
      setBackupCodes(newCodes);
      setStep(1);
      setDigits(['', '', '', '', '', '']);
      setHasConfirmedSaved(false);
      setCopiedSecret(false);
      setCopiedCodes(false);
    }
  }, [isOpen]);

  // Keep live TOTP demo code and countdown updated
  useEffect(() => {
    if (!secret || !isOpen) return;

    const update = () => {
      setSecondsRemaining(getTwoFactorSecondsRemaining());
      setDemoCode(getTwoFactorCurrentCode(secret, 0));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [secret, isOpen]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    toast.success('Clave secreta copiada al portapapeles');
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleDigitChange = (index: number, val: string) => {
    // Handle paste of full 6-digit code
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

  const handleVerifyStep2 = () => {
    const code = digits.join('');
    if (code.length !== 6) {
      toast.error('Por favor introduce el código completo de 6 dígitos');
      return;
    }

    const result = verifyTwoFactorCode(secret, code, backupCodes);
    if (result.success) {
      soundFx.playAISparkle();
      toast.success('¡Código de verificación correcto!');
      setStep(3);
    } else {
      soundFx.playReactionAdded();
      toast.error('Código incorrecto. Revisa el autenticador o el código de prueba.');
    }
  };

  const handleCopyAllCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    toast.success('8 códigos de respaldo copiados al portapapeles');
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  const handleDownloadCodes = () => {
    const content = `=====================================================
  KOVA - CÓDIGOS DE RESPALDO DE AUTENTICACIÓN (2FA)
  Usuario: ${currentUser.displayName} (@${currentUser.username})
  Fecha: ${new Date().toLocaleString('es-ES')}
=====================================================

IMPORTANTE: Cada código solo se puede usar una vez.
Guárdalos en un gestor de contraseñas o imprímelos.

${backupCodes.map((c, i) => `[${i + 1}]  ${c}`).join('\n')}

=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kova_backup_codes_${currentUser.username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo de códigos de respaldo descargado');
  };

  const handleFinish = () => {
    enableTwoFactor(secret, backupCodes);
    soundFx.playAISparkle();
    try {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    } catch {}
    toast.success('¡Autenticación en dos pasos (2FA) activada con éxito!');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0e111a] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#0b0d14] rounded-2xl flex items-center justify-center text-cyan-400">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit']">
                Activar Autenticación en Dos Pasos (2FA)
              </h2>
              <p className="text-[11px] text-slate-400">Paso {step} de 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 h-1 w-full bg-white/[0.05]">
          <div className={`h-full transition-all ${step >= 1 ? 'bg-purple-500' : 'bg-transparent'}`} />
          <div className={`h-full transition-all ${step >= 2 ? 'bg-indigo-500' : 'bg-transparent'}`} />
          <div className={`h-full transition-all ${step >= 3 ? 'bg-emerald-500' : 'bg-transparent'}`} />
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {/* STEP 1: QR & Secret Key */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#141824] border border-white/[0.06] flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Escanea el código QR con una app de autenticación como{' '}
                  <strong className="text-white">Google Authenticator</strong>,{' '}
                  <strong className="text-white">Authy</strong> o{' '}
                  <strong className="text-white">1Password</strong> en tu teléfono.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#131622] border border-white/[0.08] shadow-inner">
                <div
                  className="w-48 h-48 rounded-2xl p-2 bg-[#0a0c13] border border-white/[0.1] shadow-2xl flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: generateQrSvg(secret, currentUser.displayName),
                  }}
                />
                <span className="text-[10px] font-mono text-slate-400 mt-2 flex items-center gap-1.5">
                  <QrCode size={12} className="text-cyan-400" /> kova:auth:{currentUser.username}
                </span>
              </div>

              {/* Secret Key Box */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  ¿No puedes escanear el código? Usa esta clave secreta:
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#141824] border border-white/[0.08]">
                  <KeyRound size={16} className="text-indigo-400 ml-1" />
                  <code className="text-xs font-mono font-bold text-white flex-1 tracking-wider">
                    {secret}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedSecret ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedSecret ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Enter 6-digit Code */}
          {step === 2 && (
            <div className="space-y-5 text-center">
              <div>
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  Introduce el código de 6 dígitos
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Escribe el código generado por tu aplicación para verificar la sincronización.
                </p>
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="flex justify-center gap-2.5">
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

              {/* Helper Demo Card for Quick Testing */}
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
            </div>
          )}

          {/* STEP 3: Backup Codes */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Guarda estos códigos de respaldo en un lugar seguro. Si pierdes el acceso a tu
                  teléfono, cada código podrá utilizarse una vez para recuperar el acceso a tu cuenta.
                </p>
              </div>

              {/* Grid of 8 codes */}
              <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-[#141824] border border-white/[0.08]">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0e111a] border border-white/[0.05]"
                  >
                    <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                    <code className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
                      {code}
                    </code>
                  </div>
                ))}
              </div>

              {/* Action Buttons: Copy & Download */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllCodes}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedCodes ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedCodes ? 'Copiados' : 'Copiar códigos'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCodes}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Descargar .txt</span>
                </button>
              </div>

              {/* Checkbox Confirmation */}
              <label className="flex items-center gap-2.5 p-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConfirmedSaved}
                  onChange={(e) => setHasConfirmedSaved(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#141824] border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <span>He guardado mis códigos de respaldo en un lugar seguro.</span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-between bg-[#0c0e17]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Atrás</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={() => {
                setStep(2);
                setTimeout(() => inputRefs.current[0]?.focus(), 150);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <span>Siguiente: Verificar código</span>
              <ArrowRight size={14} />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleVerifyStep2}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Check size={14} />
              <span>Confirmar código</span>
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleFinish}
              disabled={!hasConfirmedSaved}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all cursor-pointer ${
                hasConfirmedSaved
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                  : 'bg-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Activar 2FA Ahora</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
