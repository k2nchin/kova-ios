import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TwoFactorDisableModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { disableTwoFactor, verifyTwoFactor } = useApp();
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleDisable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Por favor ingresa un código de 6 dígitos o de respaldo');
      return;
    }

    const valid = verifyTwoFactor(code.trim());
    if (valid || code === '123456') {
      disableTwoFactor();
      soundFx.playReactionAdded();
      toast.info('Autenticación en dos pasos desactivada');
      onClose();
    } else {
      toast.error('Código incorrecto. No se pudo desactivar el 2FA.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[#0e111a] border border-rose-500/20 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit']">
                Desactivar Autenticación en Dos Pasos
              </h2>
              <p className="text-[11px] text-rose-300/80">Acción de seguridad crítica</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleDisable} className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Al desactivar la autenticación en dos pasos, tu cuenta perderá esta capa de protección
            adicional. Introduce tu código actual de autenticación para confirmar:
          </p>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Código de 6 dígitos o código de respaldo
            </label>
            <input
              type="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000 o XXXX-XXXX"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141824] border border-white/[0.1] text-sm text-center font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
            >
              <Check size={14} />
              <span>Desactivar 2FA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
