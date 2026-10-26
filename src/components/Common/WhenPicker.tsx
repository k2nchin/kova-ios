import React, { useEffect, useRef, useState } from 'react';
import '../../styles/whenPicker.css';

const at = (date: Date, hours: number, minutes = 0) => { const next = new Date(date); next.setHours(hours, minutes, 0, 0); return next; };
const tomorrowAt = (from: Date, hours: number) => { const next = new Date(from); next.setDate(next.getDate() + 1); return at(next, hours); };
const nextMondayAt9 = (from: Date) => { const next = new Date(from); const days = (8 - next.getDay()) % 7 || 7; next.setDate(next.getDate() + days); return at(next, 9); };

/** Quick time choices + a custom date, for scheduling and reminders. */
export const WhenPicker: React.FC<{
  title: string;
  confirmLabel: string;
  onPick: (when: Date) => void;
  onClose: () => void;
  quick?: 'short' | 'day';
}> = ({ title, confirmLabel, onPick, onClose, quick = 'day' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [custom, setCustom] = useState('');
  // The moment the picker opened: options stay put while it's open.
  const [openedAt] = useState(() => Date.now());

  useEffect(() => {
    const onDown = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) onClose(); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const now = new Date(openedAt);
  const options: Array<[string, Date]> = quick === 'short'
    ? [['En 20 minutos', new Date(now.getTime() + 20 * 60_000)], ['En 1 hora', new Date(now.getTime() + 60 * 60_000)], ['En 3 horas', new Date(now.getTime() + 3 * 60 * 60_000)], ['Mañana a las 9:00', tomorrowAt(now, 9)]]
    : [['En 1 hora', new Date(now.getTime() + 60 * 60_000)], ['Hoy a las 20:00', at(now, 20)], ['Mañana a las 9:00', tomorrowAt(now, 9)], ['El lunes a las 9:00', nextMondayAt9(now)]];
  // Future options only, and no two for the same moment (e.g. "mañana" on a Sunday is Monday).
  const visible = options.filter(([, date], index) => date.getTime() > openedAt + 60_000 && options.findIndex(([, other]) => other.getTime() === date.getTime()) === index);
  const minCustom = new Date(openedAt + 2 * 60_000 - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  const customDate = custom ? new Date(custom) : null;
  const customOk = Boolean(customDate && customDate.getTime() > openedAt + 60_000);

  return (
    <div ref={ref} className="kwp" role="dialog" aria-label={title}>
      <strong>{title}</strong>
      {visible.map(([label, date]) => (
        <button key={label} type="button" onClick={() => onPick(date)}>
          <span>{label}</span>
          <small>{date.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</small>
        </button>
      ))}
      <label className="kwp-custom">
        <span>Otra fecha</span>
        <input type="datetime-local" min={minCustom} value={custom} onChange={(event) => setCustom(event.target.value)} />
      </label>
      <button type="button" className="kwp-confirm" disabled={!customOk} onClick={() => customDate && onPick(customDate)}>{confirmLabel}</button>
    </div>
  );
};
