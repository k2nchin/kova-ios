import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';

/** **bold** inside a line, as React nodes (never HTML). */
const inline = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : <React.Fragment key={index}>{part}</React.Fragment>
  );

/** Minimal Markdown for the summary: paragraphs and "-"/"*"/"•" bullets. */
const Summary: React.FC<{ text: string }> = ({ text }) => {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) blocks.push(<ul key={`ul${blocks.length}`}>{bullets.map((item, i) => <li key={i}>{inline(item)}</li>)}</ul>);
    bullets = [];
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) { bullets.push(bullet[1]); continue; }
    flush();
    blocks.push(<p key={`p${blocks.length}`}>{inline(line.replace(/^#+\s*/, ''))}</p>);
  }
  flush();
  return <div className="kcu-summary">{blocks}</div>;
};

/** "¿Qué me perdí?" — offered when you open a channel with many new messages. */
export const CatchUpBar: React.FC = () => {
  const { activeChannel, catchUpByChannel, dismissCatchUp } = useApp();
  const channelId = activeChannel?.id || '';
  const missed = catchUpByChannel[channelId] || 0;
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [summary, setSummary] = useState('');

  useEffect(() => { setState('idle'); setSummary(''); }, [channelId]);

  if (!missed || !channelId) return null;

  const summarize = async () => {
    setState('loading');
    try {
      const result = await api.catchUpChannel(channelId, missed);
      setSummary(result.summary);
      setState('done');
    } catch (error) {
      setSummary(error instanceof Error ? error.message : 'No se pudo crear el resumen.');
      setState('done');
    }
  };

  return (
    <section className={`kcu ${state === 'done' ? 'is-open' : ''}`} aria-live="polite">
      <div className="kcu-bar">
        <Sparkles size={15} />
        <span>
          <strong>{missed > 99 ? 'Más de 99' : missed} mensajes nuevos</strong> desde tu última visita
        </span>
        {state !== 'done' && (
          <button type="button" className="kcu-action" onClick={() => void summarize()} disabled={state === 'loading'}>
            {state === 'loading' ? <><Loader2 size={14} className="animate-spin" /> Resumiendo…</> : '¿Qué me perdí?'}
          </button>
        )}
        <button type="button" className="kcu-close" onClick={() => dismissCatchUp(channelId)} aria-label="Cerrar">
          <X size={15} />
        </button>
      </div>
      {state === 'done' && <Summary text={summary} />}
      {state === 'done' && <p className="kcu-note">Resumen hecho por Kova IA. Solo tú lo ves.</p>}
    </section>
  );
};
