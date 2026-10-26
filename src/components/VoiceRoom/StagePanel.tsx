import React, { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, Check, Hand, Mic, RadioTower, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, type StageState } from '../../services/apiClient';
import { getSocket } from '../../services/socketClient';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../Common/Avatar';

/** Stage controls on top of the call: topic, speakers, raised hands, invite/move down. */
export const StagePanel: React.FC<{ channelId: string; listenerCount: number }> = ({ channelId, listenerCount }) => {
  const { currentUser, toggleMute } = useApp();
  const [state, setState] = useState<StageState | null>(null);
  const [topicDraft, setTopicDraft] = useState<string | null>(null);
  const wasSpeaker = useRef<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => api.getStage(channelId).then((next) => { if (alive) setState(next); }).catch(() => undefined);
    void load();
    const socket = getSocket();
    const onChange = ({ channelId: changed }: { channelId: string }) => { if (changed === channelId) void load(); };
    socket.on('stage:changed', onChange);
    return () => { alive = false; socket.off('stage:changed', onChange); };
  }, [channelId]);

  // Invited up / moved down: tell the person and keep the mic consistent.
  useEffect(() => {
    if (!state) return;
    if (wasSpeaker.current === false && state.youSpeak) toast.success('🎙️ Estás en el escenario: activa tu micrófono para hablar');
    if (wasSpeaker.current === true && !state.youSpeak) {
      toast.info('Has vuelto al público');
      if (!currentUser.isMuted) toggleMute();
    }
    wasSpeaker.current = state.youSpeak;
  }, [state, currentUser.isMuted, toggleMute]);

  if (!state) return null;
  const act = async (call: Promise<StageState>) => {
    try { setState(await call); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el escenario.'); }
  };

  return (
    <aside className="kstage" aria-label="Escenario">
      <header>
        <RadioTower size={16} />
        {topicDraft !== null ? (
          <form onSubmit={(event) => { event.preventDefault(); void act(api.setStageTopic(channelId, topicDraft)); setTopicDraft(null); }}>
            <input value={topicDraft} onChange={(event) => setTopicDraft(event.target.value)} maxLength={120} autoFocus placeholder="Tema de la charla" onBlur={() => setTopicDraft(null)} />
          </form>
        ) : (
          <strong onDoubleClick={() => state.youModerate && setTopicDraft(state.topic)} title={state.youModerate ? 'Doble clic para cambiar el tema' : undefined}>
            {state.topic || (state.youModerate ? 'Doble clic para poner un tema' : 'Escenario en directo')}
          </strong>
        )}
        <small>{listenerCount} escuchando</small>
      </header>

      <div className="kstage-section">
        <span>En el escenario</span>
        {state.speakers.length === 0 && <p>{state.youModerate ? 'Los moderadores hablan siempre. Invita a alguien del público.' : 'Solo hablan los moderadores por ahora.'}</p>}
        {state.speakers.map((person) => (
          <div key={person.id} className="kstage-person">
            <Avatar src={person.avatar} name={person.name} size={26} />
            <span>{person.name}{person.id === currentUser.id ? ' (tú)' : ''}</span>
            {(state.youModerate || person.id === currentUser.id) && (
              <button type="button" onClick={() => void act(api.setStageSpeaker(channelId, person.id, false))} title="Mover al público" aria-label={`Mover a ${person.name} al público`}><ArrowDownToLine size={14} /></button>
            )}
          </div>
        ))}
      </div>

      {state.youModerate && state.requests.length > 0 && (
        <div className="kstage-section is-requests">
          <span><Hand size={12} /> Quieren hablar ({state.requests.length})</span>
          {state.requests.map((person) => (
            <div key={person.id} className="kstage-person">
              <Avatar src={person.avatar} name={person.name} size={26} />
              <span>{person.name}</span>
              <button type="button" className="is-ok" onClick={() => void act(api.setStageSpeaker(channelId, person.id, true))} aria-label={`Subir a ${person.name}`}><Check size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {!state.youSpeak && (
        <button type="button" className={`kstage-hand ${state.yourHand ? 'is-on' : ''}`} onClick={() => void act(api.setStageHand(channelId, !state.yourHand))}>
          {state.yourHand ? <><X size={15} /> Bajar la mano</> : <><Hand size={15} /> Pedir la palabra</>}
        </button>
      )}
      {state.youSpeak && !state.youModerate && <p className="kstage-note"><Mic size={12} /> Puedes hablar. Bájate cuando quieras con la flecha.</p>}
    </aside>
  );
};
