import React, { useEffect, useState } from 'react';
import { KeyRound, Lock, Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/apiClient';

interface PasswordResetModalProps {
  isOpen: boolean;
  initialEmail?: string;
  onClose: () => void;
  onDone: (email: string) => void;
}

const inputClass =
  'kova-auth-input w-full bg-[#0A0A0B]/70 border border-white/[0.08] focus:border-[#c9d1da] rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all';

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, initialEmail = '', onClose, onDone }) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setEmail(initialEmail);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const close = () => {
    setStep('email');
    setCode('');
    setPassword('');
    setConfirm('');
    onClose();
  };

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return toast.error('Escribe tu correo electrónico');
    setIsLoading(true);
    try {
      const res = await api.requestPasswordReset({ email });
      toast.success(res.message || 'Revisa tu correo para ver el código.');
      setStep('code');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo enviar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) return toast.error('El código tiene 6 dígitos');
    if (password.length < 8) return toast.error('La contraseña debe tener al menos 8 caracteres');
    if (password !== confirm) return toast.error('Las contraseñas no coinciden');
    setIsLoading(true);
    try {
      const res = await api.confirmPasswordReset({ email, code: code.trim(), password });
      toast.success(res.message || 'Contraseña actualizada.');
      onDone(email);
      close();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={close}>
      <div className="kl-glass relative w-full max-w-sm p-6 rounded-[24px]" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={close} className="absolute right-4 top-4 text-slate-400 hover:text-white" aria-label="Cerrar">
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold text-white mb-1">Restablecer contraseña</h2>
        <p className="text-xs text-slate-400 mb-4">
          {step === 'email'
            ? 'Te enviaremos un código de 6 dígitos a tu correo.'
            : `Escribe el código que enviamos a ${email} y tu nueva contraseña.`}
        </p>

        {step === 'email' ? (
          <form onSubmit={requestCode} className="space-y-3">
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3 text-slate-500" />
              <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className={inputClass} />
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-2.5 rounded-full kl-chrome-button font-semibold text-sm cursor-pointer disabled:opacity-60">
              {isLoading ? 'Enviando…' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmReset} className="space-y-3">
            <div className="relative flex items-center">
              <KeyRound className="w-4 h-4 absolute left-3 text-slate-500" />
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" className={`${inputClass} tracking-[0.3em]`} />
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3 text-slate-500" />
              <input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña" className={inputClass} />
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3 text-slate-500" />
              <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite la contraseña" className={inputClass} />
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-2.5 rounded-full kl-chrome-button font-semibold text-sm cursor-pointer disabled:opacity-60">
              {isLoading ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
            <button type="button" disabled={isLoading} onClick={() => requestCode()} className="w-full text-[11px] text-slate-400 hover:text-white">
              Reenviar código
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
