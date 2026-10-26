import React, { useEffect, useState } from 'react';
import { Dices, Grid3x3, HelpCircle, Trophy, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, type CallActivity } from '../../services/apiClient';
import { getSocket } from '../../services/socketClient';
import { useApp } from '../../context/AppContext';

/** Games for everyone in the call; the server keeps score so nobody can cheat. */
export const CallActivities: React.FC<{ channelId: string }> = ({ channelId }) => {
  const { currentUser } = useApp();
  const [activity, setActivity] = useState<CallActivity | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getCallActivity(channelId).then((value) => { if (alive) setActivity(value); }).catch(() => undefined);
    const socket = getSocket();
    const onChange = (event: { channelId: string; activity: CallActivity | null }) => {
      if (event.channelId !== channelId) return;
      setActivity(event.activity);
      if (event.activity) setMinimized(false);
    };
    socket.on('voice:activity', onChange);
    return () => { alive = false; socket.off('voice:activity', onChange); };
  }, [channelId]);

  const act = async (data: Record<string, unknown>) => {
    try { setActivity(await api.callActivityAction(channelId, data)); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo completar la jugada.'); }
  };
  const me = currentUser.id;
  const isHost = activity?.hostId === me;

  if (!activity || minimized) {
    return (
      <div className="kact-launch">
        <button type="button" className={`kact-pill ${activity ? 'is-live' : ''}`} onClick={() => (activity ? setMinimized(false) : setMenuOpen(!menuOpen))}>
          <Dices size={14} /> {activity ? (activity.kind === 'trivia' ? 'Trivia en curso' : 'Tres en raya en curso') : 'Actividades'}
        </button>
        {menuOpen && !activity && (
          <div className="kact-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); void act({ action: 'start', kind: 'trivia' }); }}>
              <HelpCircle size={16} /><span><strong>Trivia rápida</strong><small>5 preguntas para toda la sala</small></span>
            </button>
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); void act({ action: 'start', kind: 'tictactoe' }); }}>
              <Grid3x3 size={16} /><span><strong>Tres en raya</strong><small>1 contra 1, el resto mira</small></span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="kact" aria-label="Actividad de la sala">
      <header>
        {activity.kind === 'trivia' ? <HelpCircle size={16} /> : <Grid3x3 size={16} />}
        <strong>{activity.kind === 'trivia' ? 'Trivia rápida' : 'Tres en raya'}</strong>
        <button type="button" onClick={() => setMinimized(true)} aria-label="Minimizar">–</button>
        {isHost && <button type="button" onClick={() => void act({ action: 'stop' })} aria-label="Terminar actividad"><X size={15} /></button>}
      </header>

      {activity.kind === 'tictactoe' ? (() => {
        const [x, o] = activity.players;
        const name = (id: string | null) => (id ? activity.names[id] || 'Jugador' : '…');
        const playing = activity.players.includes(me);
        const status = activity.winner === 'draw' ? 'Empate' : activity.winner ? `¡Gana ${name(activity.winner === 'X' ? x : o)}!` : !o ? 'Esperando rival' : `Turno de ${name(activity.players[activity.turn])}`;
        return (
          <>
            <p className="kact-status"><b className="is-x">X</b> {name(x)} <span>vs</span> <b className="is-o">O</b> {name(o)}</p>
            <div className="kact-board" role="grid">
              {activity.board.map((cell, index) => (
                <button key={index} type="button" className={cell ? `is-${cell.toLowerCase()}` : ''} disabled={Boolean(cell) || Boolean(activity.winner) || activity.players[activity.turn] !== me || !o} onClick={() => void act({ action: 'move', cell: index })} aria-label={`Casilla ${index + 1}${cell ? `: ${cell}` : ''}`}>
                  {cell}
                </button>
              ))}
            </div>
            <p className="kact-status">{status}</p>
            {!o && !playing && <button type="button" className="kact-primary" onClick={() => void act({ action: 'join' })}>Jugar contra {name(x)}</button>}
            {activity.winner && playing && <button type="button" className="kact-primary" onClick={() => void act({ action: 'rematch' })}>Revancha</button>}
          </>
        );
      })() : (
        <>
          {activity.phase === 'done' ? (
            <div className="kact-podium">
              <Trophy size={22} />
              <strong>Resultado final</strong>
              <ol>
                {Object.entries(activity.scores).sort((a, b) => b[1] - a[1]).map(([userId, score], index) => (
                  <li key={userId}><span>{['🥇', '🥈', '🥉'][index] || index + 1}</span>{activity.names[userId] || 'Jugador'}<b>{score}</b></li>
                ))}
                {Object.keys(activity.scores).length === 0 && <li>Nadie acertó. ¡Otra vez será!</li>}
              </ol>
            </div>
          ) : activity.question && (
            <>
              <small className="kact-round">Pregunta {activity.round + 1} de {activity.rounds} · {activity.answered.length} respondieron</small>
              <p className="kact-question">{activity.question.text}</p>
              <div className="kact-options">
                {activity.question.options.map((option, index) => {
                  const mine = activity.answers ? activity.answers[me] === index : false;
                  const revealed = activity.phase === 'reveal';
                  const iAnswered = activity.answered.includes(me);
                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={revealed || iAnswered}
                      className={`${revealed && activity.correct === index ? 'is-right' : ''} ${revealed && mine && activity.correct !== index ? 'is-wrong' : ''}`}
                      onClick={() => void act({ action: 'answer', option: index })}
                    >
                      <b>{'ABCD'[index]}</b>{option}
                    </button>
                  );
                })}
              </div>
              {activity.answered.includes(me) && activity.phase === 'question' && <p className="kact-status">Respuesta enviada. Esperando al resto…</p>}
              {isHost && activity.phase === 'question' && <button type="button" className="kact-primary" onClick={() => void act({ action: 'reveal' })}>Revelar respuesta</button>}
              {isHost && activity.phase === 'reveal' && <button type="button" className="kact-primary" onClick={() => void act({ action: 'next' })}>{activity.round + 1 >= activity.rounds ? 'Ver resultado' : 'Siguiente pregunta'}</button>}
              {!isHost && activity.phase === 'reveal' && <p className="kact-status">Esperando la siguiente pregunta…</p>}
            </>
          )}
          {Object.keys(activity.scores).length > 0 && activity.phase !== 'done' && (
            <p className="kact-scores">{Object.entries(activity.scores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, score]) => `${activity.names[id] || 'Jugador'} ${score}`).join(' · ')}</p>
          )}
          {isHost && activity.phase === 'done' && <button type="button" className="kact-primary" onClick={() => void act({ action: 'start', kind: 'trivia' })}>Jugar otra vez</button>}
        </>
      )}
    </section>
  );
};
