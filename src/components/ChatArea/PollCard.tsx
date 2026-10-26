import React, { useEffect, useState } from 'react';
import { BarChart3, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { api, type Poll } from '../../services/apiClient';
import { getSocket } from '../../services/socketClient';

export const POLL_MESSAGE = /^\[poll:([\w-]+)\]/;

const timeLeft = (iso: string) => {
  const ms = Date.parse(iso) - Date.now();
  if (ms <= 0) return 'cerrada';
  const hours = Math.floor(ms / 3600_000);
  if (hours >= 24) return `quedan ${Math.floor(hours / 24)} d`;
  if (hours >= 1) return `quedan ${hours} h`;
  return `quedan ${Math.max(1, Math.round(ms / 60_000))} min`;
};

/** Live poll inside a message: vote, change your vote, see results. */
export const PollCard: React.FC<{ pollId: string; canClose: boolean }> = ({ pollId, canClose }) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getPoll(pollId).then((value) => { if (alive) setPoll(value); }).catch(() => { if (alive) setMissing(true); });
    const socket = getSocket();
    const onUpdate = (update: Poll) => {
      if (update.id !== pollId) return;
      setPoll((prev) => ({ ...update, myVotes: prev?.myVotes || [] }));
    };
    socket.on('poll:updated', onUpdate);
    return () => { alive = false; socket.off('poll:updated', onUpdate); };
  }, [pollId]);

  if (missing) return <div className="kpoll is-missing">📊 Encuesta no disponible</div>;
  if (!poll) return <div className="kpoll is-loading">📊 Cargando encuesta…</div>;

  const total = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const voted = poll.myVotes.length > 0;
  const showResults = voted || poll.closed;
  const leader = Math.max(...poll.options.map((option) => option.votes));

  const vote = async (optionId: string) => {
    if (poll.closed || busy) return;
    const mine = new Set(poll.myVotes);
    let next: string[];
    if (poll.multi) { if (mine.has(optionId)) mine.delete(optionId); else mine.add(optionId); next = [...mine]; }
    else next = mine.has(optionId) ? [] : [optionId];
    setBusy(true);
    try { setPoll(await api.votePoll(poll.id, next)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo votar.'); }
    finally { setBusy(false); }
  };
  const close = async () => {
    try { setPoll(await api.closePoll(poll.id)); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo cerrar.'); }
  };

  return (
    <div className={`kpoll ${poll.closed ? 'is-closed' : ''}`}>
      <header>
        <BarChart3 size={15} />
        <strong>{poll.question}</strong>
      </header>
      <small className="kpoll-meta">{poll.multi ? 'Elige una o varias' : 'Elige una opción'}{poll.closed ? ' · Encuesta cerrada' : poll.endsAt ? ` · ${timeLeft(poll.endsAt)}` : ''}</small>
      <ul>
        {poll.options.map((option) => {
          const pct = total ? Math.round((option.votes / total) * 100) : 0;
          const mine = poll.myVotes.includes(option.id);
          return (
            <li key={option.id}>
              <button type="button" disabled={poll.closed || busy} onClick={() => void vote(option.id)} className={`${mine ? 'is-mine' : ''} ${showResults && option.votes === leader && leader > 0 ? 'is-leader' : ''}`} aria-pressed={mine}>
                {showResults && <i style={{ width: `${pct}%` }} />}
                <span className={`kpoll-check ${poll.multi ? 'is-multi' : ''}`}>{mine && <Check size={11} />}</span>
                <span className="kpoll-label">{option.label}</span>
                {showResults && <span className="kpoll-pct">{pct}% · {option.votes}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <footer>
        <span>{poll.voters} {poll.voters === 1 ? 'voto' : 'votos'}{!showResults ? ' · vota para ver resultados' : ''}</span>
        {!poll.closed && canClose && <button type="button" onClick={() => void close()}><Lock size={12} /> Cerrar encuesta</button>}
      </footer>
    </div>
  );
};

/** Composer dialog to create a poll in the current channel. */
export const PollComposer: React.FC<{ channelId: string; onClose: () => void }> = ({ channelId, onClose }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multi, setMulti] = useState(false);
  const [duration, setDuration] = useState('24');
  const [busy, setBusy] = useState(false);
  const filled = options.map((option) => option.trim()).filter(Boolean);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.createPoll(channelId, { question, options: filled, multi, durationHours: Number(duration) || undefined });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear la encuesta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kpoll-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="kpoll-form" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Nueva encuesta">
        <h3><BarChart3 size={16} /> Nueva encuesta</h3>
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pregunta" maxLength={300} required autoFocus />
        {options.map((option, index) => (
          <div key={index} className="kpoll-opt">
            <input value={option} onChange={(event) => setOptions(options.map((value, i) => (i === index ? event.target.value : value)))} placeholder={`Opción ${index + 1}`} maxLength={80} />
            {options.length > 2 && <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== index))} aria-label={`Quitar opción ${index + 1}`}>×</button>}
          </div>
        ))}
        {options.length < 10 && <button type="button" className="kpoll-more" onClick={() => setOptions([...options, ''])}>+ Añadir opción</button>}
        <div className="kpoll-row">
          <label><input type="checkbox" checked={multi} onChange={() => setMulti(!multi)} /> Varias respuestas</label>
          <select value={duration} onChange={(event) => setDuration(event.target.value)} aria-label="Duración">
            <option value="1">1 hora</option>
            <option value="4">4 horas</option>
            <option value="24">1 día</option>
            <option value="72">3 días</option>
            <option value="168">1 semana</option>
            <option value="0">Sin límite</option>
          </select>
        </div>
        <div className="kpoll-row is-end">
          <button type="button" className="kpoll-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="kpoll-primary" disabled={busy || !question.trim() || filled.length < 2}>Publicar encuesta</button>
        </div>
      </form>
    </div>
  );
};
