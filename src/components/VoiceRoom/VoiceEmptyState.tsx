import React, { useState } from 'react';
import { UserPlus, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';

interface VoiceEmptyStateProps {
  serverId: string;
}

/** Tile shown next to you while nobody else is in the room. */
export const VoiceEmptyState: React.FC<VoiceEmptyStateProps> = ({ serverId }) => {
  const { openInviteModal } = useApp();
  const [state, setState] = useState<'idle' | 'busy' | 'copied'>('idle');

  // Creates a real invite (7 days) instead of copying the space id.
  const copyLink = async () => {
    setState('busy');
    try {
      const invite = await api.createInvite(serverId, { expiresInMinutes: 7 * 24 * 60, maxUses: 0 });
      await navigator.clipboard.writeText(invite.url);
      setState('copied');
      toast.success('Enlace de invitación copiado');
      window.setTimeout(() => setState('idle'), 2000);
    } catch (error) {
      setState('idle');
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el enlace');
    }
  };

  return (
    <div className="kvr-invite">
      <strong>Aquí solo estás tú</strong>
      <p>Invita a alguien para empezar a hablar.</p>
      <div className="kvr-invite-actions">
        <button type="button" className="kvr-btn-metal" onClick={() => openInviteModal(serverId)}>
          <UserPlus size={15} /> Invitar
        </button>
        <button type="button" className="kvr-btn-ghost" onClick={copyLink} disabled={state === 'busy'}>
          {state === 'busy' ? <Loader2 size={14} className="animate-spin" /> : state === 'copied' ? <Check size={14} /> : <Copy size={14} />}
          {state === 'copied' ? 'Copiado' : 'Copiar enlace'}
        </button>
      </div>
    </div>
  );
};
