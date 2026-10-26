import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { api, type AutomodState } from '../../services/apiClient';
import type { Channel } from '../../types';

/** Space setting: Kova IA screens messages for scams and spam before they are posted. */
export const AutomodPanel: React.FC<{ spaceId: string; channels: Channel[] }> = ({ spaceId, channels }) => {
  const [state, setState] = useState<AutomodState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getAutomod(spaceId).then((result) => { if (alive) setState(result); }).catch(() => { if (alive) setState({ enabled: false, log: [] }); });
    return () => { alive = false; };
  }, [spaceId]);

  const toggle = async () => {
    if (!state) return;
    setSaving(true);
    try {
      const next = await api.setAutomod(spaceId, !state.enabled);
      setState(next);
      toast.success(next.enabled ? 'AutoMod IA activado' : 'AutoMod IA desactivado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar AutoMod.');
    } finally {
      setSaving(false);
    }
  };

  const channelName = (id: string) => channels.find((channel) => channel.id === id)?.name || 'canal';

  return (
    <div className="kam">
      <div className="kam-card">
        <ShieldAlert size={22} />
        <div>
          <h2>AutoMod con Kova IA</h2>
          <p>Frena estafas (nitro o regalos falsos, phishing, cripto), spam y floods <strong>antes</strong> de que se publiquen. Los moderadores no pasan por el filtro. Si la IA no responde a tiempo, el mensaje se publica para no frenar el chat.</p>
        </div>
        <button type="button" role="switch" aria-checked={Boolean(state?.enabled)} className={`kam-switch ${state?.enabled ? 'is-on' : ''}`} disabled={!state || saving} onClick={toggle} aria-label="Activar AutoMod IA">
          <span />
        </button>
      </div>

      <h3>Mensajes bloqueados</h3>
      {!state ? <p className="kam-empty">Cargando…</p> : state.log.length === 0 ? (
        <p className="kam-empty">{state.enabled ? 'Nada bloqueado todavía. 🎉' : 'Activa AutoMod para empezar a proteger el espacio.'}</p>
      ) : (
        <ul className="kam-log">
          {state.log.map((item) => (
            <li key={item.id}>
              <div><strong>{item.author}</strong> en #{channelName(item.channelId)} · {new Date(item.createdAt).toLocaleString()}</div>
              <p>{item.content}</p>
              <em>{item.reason}</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
