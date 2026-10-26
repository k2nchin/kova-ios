import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { disablePush, enablePush, isPushEnabled, pushSupported } from '../../services/pushService';

type ToggleProps = { label: string; description: string; checked: boolean; onChange: () => void };

/** "Notificaciones push" switch for the web/PWA build (hidden in the desktop app). */
export const PushSetting: React.FC<{ Toggle: React.FC<ToggleProps> }> = ({ Toggle }) => {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void isPushEnabled().then(setEnabled).catch(() => undefined); }, []);
  if (!pushSupported()) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (enabled) { await disablePush(); setEnabled(false); toast.success('Notificaciones push desactivadas en este dispositivo'); }
      else { await enablePush(); setEnabled(true); toast.success('Listo: te avisaremos de menciones, DMs, recordatorios y eventos aunque Kova esté cerrado'); }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron activar las notificaciones push.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Toggle
      label="Notificaciones push en este dispositivo"
      description="Menciones, mensajes directos, recordatorios y eventos aunque tengas Kova cerrado (también en el móvil)."
      checked={enabled}
      onChange={() => void toggle()}
    />
  );
};
