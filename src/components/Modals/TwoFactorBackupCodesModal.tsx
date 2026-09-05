import React, { useState } from 'react';
import {
  ShieldAlert,
  Copy,
  Download,
  RefreshCw,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TwoFactorBackupCodesModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser, twoFactorBackupCodes, regenerateBackupCodes } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codes = twoFactorBackupCodes || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    toast.success('Códigos de respaldo copiados al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = `=====================================================
  KOVA - CÓDIGOS DE RESPALDO DE AUTENTICACIÓN (2FA)
  Usuario: ${currentUser.displayName} (@${currentUser.username})
  Fecha: ${new Date().toLocaleString('es-ES')}
=====================================================

${codes.map((c, i) => `[${i + 1}]  ${c}`).join('\n')}

IMPORTANTE: Guarda estos códigos en un lugar seguro.
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kova_backup_codes_${currentUser.username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Códigos descargados');
  };

  const handleRegenerate = () => {
    if (
      window.confirm(
        '¿Deseas regenerar tus códigos de respaldo? Los códigos anteriores dejarán de funcionar de inmediato.'
      )
    ) {
      regenerateBackupCodes();
      soundFx.playReactionAdded();
      toast.success('Se han generado 8 nuevos códigos de respaldo');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[#0e111a] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#111420]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit']">
                Códigos de Respaldo (2FA)
              </h2>
              <p className="text-[11px] text-slate-400">8 códigos disponibles</p>
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
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Utiliza estos códigos si no tienes acceso a tu teléfono o app de autenticación. Cada
            código es de un solo uso.
          </p>

          <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-[#141824] border border-white/[0.08]">
            {codes.length > 0 ? (
              codes.map((code, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0e111a] border border-white/[0.05]"
                >
                  <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                  <code className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
                    {code}
                  </code>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-center text-xs text-slate-500 py-3">
                No hay códigos disponibles. Haz clic en regenerar.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copiados' : 'Copiar'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Descargar</span>
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              title="Regenerar nuevos códigos"
              className="flex items-center justify-center p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] flex justify-end bg-[#0c0e17]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
