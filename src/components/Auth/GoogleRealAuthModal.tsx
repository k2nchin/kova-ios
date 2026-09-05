import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, KeyRound, Sparkles, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getStoredGoogleClientId,
  saveGoogleClientId,
  openRealGoogleSignIn,
  RealGoogleUser,
} from '../../utils/googleRealAuth';

interface GoogleRealAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: RealGoogleUser) => void;
  onFallbackSimulated: () => void;
}

export const GoogleRealAuthModal: React.FC<GoogleRealAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onFallbackSimulated,
}) => {
  const [clientIdInput, setClientIdInput] = useState(() => getStoredGoogleClientId());
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleLaunchRealGoogle = (idToUse?: string) => {
    const id = (idToUse || clientIdInput).trim();
    if (!id) {
      toast.error('Por favor ingresa tu Google Client ID para abrir la ventana oficial de Google');
      return;
    }

    saveGoogleClientId(id);
    setIsProcessing(true);

    toast.loading('Abriendo ventana emergente oficial de Google...');
    openRealGoogleSignIn(
      id,
      (user) => {
        setIsProcessing(false);
        toast.dismiss();
        toast.success(`¡Autenticado con éxito como ${user.name}!`);
        onSuccess(user);
        onClose();
      },
      (err) => {
        setIsProcessing(false);
        toast.dismiss();
        toast.error(`Error de Google: ${err}`);
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0e111a] border border-white/[0.1] rounded-3xl p-6 shadow-2xl text-slate-200 relative glow-purple animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-md">
              {/* Google G */}
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
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Acceso Real con Google OAuth
              </h3>
              <p className="text-[11px] text-slate-400">
                Conexión directa con los servidores de Google
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Autenticación Oficial de Google</span>
            </div>
            <p className="text-slate-300 text-[11.5px] leading-relaxed">
              Google requiere que cada aplicación web especifique un <strong>Client ID</strong> para
              abrir la ventana de inicio de sesión de Google (<code>accounts.google.com</code>) y autorizar
              el dominio <code>http://localhost:1420</code>.
            </p>
          </div>

          {/* Client ID Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>Tu Google Client ID (OAuth 2.0 Web)</span>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px] font-normal"
              >
                <span>Obtener en Google Cloud</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <div className="relative flex items-center">
              <KeyRound className="w-4 h-4 absolute left-3 text-slate-500" />
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="ej: 123456789-abcdef.apps.googleusercontent.com"
                className="w-full bg-[#141824] border border-white/[0.08] focus:border-cyan-400 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-1.5 text-[11px] text-slate-400 bg-black/40 p-3 rounded-xl border border-white/[0.05]">
            <div className="font-semibold text-slate-300 text-xs">Pasos rápidos para tu Client ID:</div>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Entra a <strong className="text-slate-200">Google Cloud Console → APIs y Credenciales</strong>.</li>
              <li>Crea una credencial de tipo <strong className="text-slate-200">ID de cliente de OAuth (Aplicación web)</strong>.</li>
              <li>Añade en <em>Orígenes autorizados de JavaScript</em>: <code className="text-cyan-300">http://localhost:1420</code></li>
              <li>Pega el Client ID arriba y pulsa el botón para abrir la ventana de Google.</li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onFallbackSimulated();
            }}
            className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Usar confirmación de Google sin Client ID
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleLaunchRealGoogle()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            {isProcessing ? (
              <span>Conectando...</span>
            ) : (
              <>
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
                <span>Abrir Ventana de Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
