import React, { useState } from 'react';
import { User, X, Check, Shield, ArrowLeft, Loader2, Plus, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { openExternalUrl } from '../../utils/googleRealAuth';

export interface GoogleAccount {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface GoogleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (account: GoogleAccount) => void;
}

const PRESET_ACCOUNTS: GoogleAccount[] = [
  {
    id: 'google_juanpi_main',
    name: 'Juan Jesús Enrique Peralta',
    email: 'juanpi1x@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'google_k2nchin',
    name: 'k2nchin',
    email: 'k2nchin@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'google_juanpi_dev',
    name: 'Juanpi Developer',
    email: 'juanpi.dev@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  },
];

export const GoogleConfirmModal: React.FC<GoogleConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [step, setStep] = useState<'choose' | 'confirm' | 'custom_email'>('choose');
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccount | null>(null);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  if (!isOpen) return null;

  const handleSelectAccount = (account: GoogleAccount) => {
    setSelectedAccount(account);
    setStep('confirm');
  };

  const handleCustomAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      toast.error('Ingresa una cuenta de correo válida de Google');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    const acc: GoogleAccount = {
      id: `google_${Date.now()}`,
      name,
      email: customEmail.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${customEmail}`,
    };
    setSelectedAccount(acc);
    setStep('confirm');
  };

  const handleFinalConfirm = () => {
    if (!selectedAccount) return;
    setIsAuthorizing(true);
    setTimeout(() => {
      setIsAuthorizing(false);
      onConfirm(selectedAccount);
    }, 1100);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-['Roboto',sans-serif] text-slate-800 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[450px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Google Branding Bar */}
        <div className="px-7 pt-6 pb-2 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span className="text-sm font-medium text-slate-600">Iniciar sesión con Google</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: CHOOSE ACCOUNT */}
        {step === 'choose' && (
          <div className="p-7 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-medium text-slate-900 font-['Outfit']">Elige una cuenta</h2>
              <p className="text-sm text-slate-600">para continuar a <strong className="text-purple-700">Kova Workspace</strong></p>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              {PRESET_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc)}
                  className="w-full flex items-center gap-3.5 p-3.5 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                >
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {acc.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{acc.email}</div>
                  </div>
                </button>
              ))}

              {/* Add custom account button */}
              <button
                onClick={() => setStep('custom_email')}
                className="w-full flex items-center gap-3.5 p-3.5 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                  Usar otra cuenta de Google
                </div>
              </button>
              {/* External Browser Link */}
              <button
                type="button"
                onClick={() => openExternalUrl('https://accounts.google.com/signin')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors border border-slate-200 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Abrir Google en navegador externo</span>
              </button>
            </div>

            <div className="pt-2 text-[12px] text-slate-500 leading-relaxed">
              Para continuar, Google compartirá tu nombre, dirección de correo electrónico, preferencias de idioma y foto de perfil con Kova.
            </div>
          </div>
        )}

        {/* STEP 2: CUSTOM EMAIL INPUT */}
        {step === 'custom_email' && (
          <form onSubmit={handleCustomAccountSubmit} className="p-7 space-y-4">
            <button
              type="button"
              onClick={() => setStep('choose')}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la lista de cuentas</span>
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-medium text-slate-900 font-['Outfit']">Ingresa tu cuenta Google</h2>
              <p className="text-xs text-slate-500">Ingresa tu correo o Gmail para asociarlo a Kova</p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Juan Jesús Enrique"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Correo de Google (@gmail.com)</label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: CONFIRM & CONSENT */}
        {step === 'confirm' && selectedAccount && (
          <div className="p-7 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-medium text-slate-900 font-['Outfit']">Confirmar acceso</h2>
              <p className="text-sm text-slate-600">
                ¿Permitir que <strong>Kova</strong> acceda a tu cuenta de Google?
              </p>
            </div>

            {/* Account Card */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <img
                src={selectedAccount.avatar}
                alt={selectedAccount.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {selectedAccount.name}
                </div>
                <div className="text-xs text-slate-500 truncate">{selectedAccount.email}</div>
              </div>
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="text-xs text-blue-600 hover:underline cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Permissions list */}
            <div className="space-y-2.5 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100 text-xs text-slate-700">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Permisos que solicita Kova:</span>
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-slate-600 text-[11.5px]">
                <li>Ver tu dirección de correo ({selectedAccount.email})</li>
                <li>Ver tu foto de perfil y nombre público</li>
                <li>Sincronizar tus preferencias en el espacio Kova</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isAuthorizing}
                onClick={() => setStep('choose')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Atrás
              </button>

              <button
                type="button"
                disabled={isAuthorizing}
                onClick={handleFinalConfirm}
                className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isAuthorizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirmando con Google...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Continuar como {selectedAccount.name.split(' ')[0]}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
