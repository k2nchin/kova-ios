// Editable keyboard shortcuts. Combos are stored as "Ctrl+Shift+K" (Ctrl also
// matches Cmd on macOS) in localStorage; every handler reads them from here.
import { useEffect, useState } from 'react';

export type ShortcutId = 'commandPalette' | 'kovaAI' | 'searchMessages' | 'pulse' | 'toggleMute' | 'toggleDeafen';

export const SHORTCUTS: { id: ShortcutId; label: string; defaultCombo: string }[] = [
  { id: 'commandPalette', label: 'Buscar canales y mensajes (Command Palette)', defaultCombo: 'Ctrl+K' },
  { id: 'kovaAI', label: 'Abrir Asistente Kova AI', defaultCombo: 'Ctrl+J' },
  { id: 'searchMessages', label: 'Buscar en el canal', defaultCombo: 'Ctrl+F' },
  { id: 'pulse', label: 'Abrir o cerrar Pulse', defaultCombo: 'Alt+P' },
  { id: 'toggleMute', label: 'Silenciar micrófono', defaultCombo: 'Ctrl+Shift+M' },
  { id: 'toggleDeafen', label: 'Ensordecer audio', defaultCombo: 'Ctrl+Shift+D' },
];

// Fixed ones, shown in settings for reference.
export const FIXED_SHORTCUTS = [
  { label: 'Enviar mensaje en chat', combo: 'Enter' },
  { label: 'Insertar salto de línea', combo: 'Shift+Enter' },
  { label: 'Cerrar modal o panel activo', combo: 'Esc' },
];

// Taken by the desktop shell or the browser; can't be reassigned.
const RESERVED = new Set(['Ctrl+R', 'Ctrl+Shift+R', 'Ctrl+P', 'Ctrl+W', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+Shift+C', 'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+A', 'Ctrl+Z', 'Ctrl+Y']);

const STORAGE_KEY = 'kova.shortcuts.v1';
const EVENT = 'kova:shortcuts-changed';

const readOverrides = (): Partial<Record<ShortcutId, string>> => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { return {}; }
};

export const getShortcut = (id: ShortcutId): string =>
  readOverrides()[id] || SHORTCUTS.find((s) => s.id === id)!.defaultCombo;

export const getAllShortcuts = (): Record<ShortcutId, string> =>
  Object.fromEntries(SHORTCUTS.map((s) => [s.id, getShortcut(s.id)])) as Record<ShortcutId, string>;

const writeOverrides = (next: Partial<Record<ShortcutId, string>>) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  window.dispatchEvent(new Event(EVENT));
};

/** Returns an error message, or null when saved. */
export const setShortcut = (id: ShortcutId, combo: string): string | null => {
  if (RESERVED.has(combo)) return `${combo} está reservado por el sistema.`;
  const clash = SHORTCUTS.find((s) => s.id !== id && getShortcut(s.id) === combo);
  if (clash) return `${combo} ya se usa para "${clash.label}".`;
  const overrides = readOverrides();
  const def = SHORTCUTS.find((s) => s.id === id)!.defaultCombo;
  if (combo === def) delete overrides[id]; else overrides[id] = combo;
  writeOverrides(overrides);
  return null;
};

export const resetShortcuts = () => writeOverrides({});

const keyName = (e: KeyboardEvent): string | null =>
  /^Key([A-Z])$/.exec(e.code)?.[1]
  ?? /^Digit([0-9])$/.exec(e.code)?.[1]
  ?? (/^F([1-9]|1[0-2])$/.test(e.code) ? e.code : null)
  ?? (e.code === 'Space' ? 'Space' : null);

/** Builds a combo from a keydown, or null if it's not a valid shortcut (needs a modifier). */
export const comboFromEvent = (e: KeyboardEvent): string | null => {
  const key = keyName(e);
  if (!key) return null;
  const mods: string[] = [];
  if (e.ctrlKey || e.metaKey) mods.push('Ctrl');
  if (e.shiftKey) mods.push('Shift');
  if (e.altKey) mods.push('Alt');
  if (!mods.length && !/^F\d+$/.test(key)) return null;
  return [...mods, key].join('+');
};

export const matchesShortcut = (e: KeyboardEvent, id: ShortcutId) => comboFromEvent(e) === getShortcut(id);

/** Re-renders when shortcuts change (in this or another window). */
export const useShortcuts = () => {
  const [all, setAll] = useState(getAllShortcuts);
  useEffect(() => {
    const update = () => setAll(getAllShortcuts());
    window.addEventListener(EVENT, update);
    window.addEventListener('storage', update);
    return () => { window.removeEventListener(EVENT, update); window.removeEventListener('storage', update); };
  }, []);
  return all;
};

export const formatCombo = (combo: string) => combo.split('+').join(' + ');
