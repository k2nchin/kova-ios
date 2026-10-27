import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  SHORTCUTS,
  FIXED_SHORTCUTS,
  comboFromEvent,
  formatCombo,
  resetShortcuts,
  setShortcut,
  useShortcuts,
  type ShortcutId,
} from '../../utils/shortcuts';

const rowClass = 'flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)]';
const kbdClass = 'px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono font-bold text-[var(--text-1)] whitespace-nowrap';

export const ShortcutsEditor: React.FC = () => {
  const shortcuts = useShortcuts();
  const [capturing, setCapturing] = useState<ShortcutId | null>(null);

  useEffect(() => {
    if (!capturing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') { setCapturing(null); return; }
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
      const combo = comboFromEvent(e);
      if (!combo) { toast.error('Usa Ctrl, Shift o Alt junto con una letra, número, F1-F12 o Espacio.'); return; }
      const error = setShortcut(capturing, combo);
      if (error) { toast.error(error); return; }
      toast.success(`Atajo guardado: ${formatCombo(combo)}`);
      setCapturing(null);
    };
    // Capture phase so the app's own shortcuts don't fire while recording.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [capturing]);

  return (
    <div className="space-y-2">
      {SHORTCUTS.map((s) => (
        <div key={s.id} className={rowClass}>
          <span className="text-xs text-[var(--text-2)]">{s.label}</span>
          <button
            type="button"
            onClick={() => setCapturing(capturing === s.id ? null : s.id)}
            className={`${kbdClass} cursor-pointer hover:border-[var(--ring)] ${capturing === s.id ? 'animate-pulse border-[var(--ring)]' : ''}`}
            title="Clic para cambiar"
          >
            {capturing === s.id ? 'Pulsa una combinación… (Esc cancela)' : formatCombo(shortcuts[s.id])}
          </button>
        </div>
      ))}
      {FIXED_SHORTCUTS.map((s) => (
        <div key={s.label} className={`${rowClass} opacity-70`}>
          <span className="text-xs text-[var(--text-2)]">{s.label}</span>
          <kbd className={kbdClass}>{formatCombo(s.combo)}</kbd>
        </div>
      ))}
      <button
        type="button"
        onClick={() => { resetShortcuts(); toast.success('Atajos restablecidos'); }}
        className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--text-3)] hover:text-[var(--text-1)] cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Restablecer atajos por defecto
      </button>
    </div>
  );
};
