import React, { useState } from 'react';
import { UserPlus, Copy, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/soundEffects';
import { toast } from 'sonner';

interface VoiceEmptyStateProps {
  serverId: string;
}

/** Integrated "just me" state — lives inside the Voice Space, not a placeholder panel. */
export const VoiceEmptyState: React.FC<VoiceEmptyStateProps> = ({ serverId }) => {
  const { openInviteModal } = useApp();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const inviteUrl = `${window.location.origin}/invite/${encodeURIComponent(serverId)}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      soundFx.playMessageSent();
      setCopied(true);
      toast.success('Enlace de invitación copiado');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  return (
    <div className="voice-enter flex select-none flex-col items-center gap-1.5 text-center">
      <p className="mt-10 text-sm font-semibold tracking-tight text-[#f5f7fa]">Todo listo</p>
      <p className="max-w-[280px] text-xs leading-5 text-[#646a76]">Invita a alguien a conversar</p>

      <div className="mt-5 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => openInviteModal(serverId)}
          className="inline-flex items-center gap-2 rounded-full bg-[#21ddb2] px-6 py-2.5 text-xs font-bold text-[#05221a] transition hover:bg-[#2ceac1] active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21ddb2]/50"
        >
          <UserPlus size={14} />
          Invitar personas
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#646a76] transition hover:text-[#9a9faa] focus-visible:outline-none"
        >
          {copied ? <Check size={12} className="text-[#21ddb2]" /> : <Copy size={12} />}
          {copied ? 'Enlace copiado' : 'Copiar enlace'}
        </button>
      </div>
    </div>
  );
};
