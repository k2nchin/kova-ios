import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Pencil, Phone, Send, UserPlus, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, type DmGroup, type GroupMessage } from '../../services/apiClient';
import { getSocket } from '../../services/socketClient';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../Common/Avatar';
import { VoiceNotePlayer } from '../Common/VoiceNotePlayer';
import { PrivateCallBar } from './PrivateCall';

export const groupTitle = (group: DmGroup, meId: string) =>
  group.name || group.members.filter((m) => m.id !== meId).map((m) => m.displayName || m.username).join(', ') || 'Grupo';

/** Pick friends for a new group (or to add to one). */
export const GroupPicker: React.FC<{ title: string; exclude?: string[]; onDone: (ids: string[], name: string) => Promise<void>; onClose: () => void; withName?: boolean }> = ({ title, exclude = [], onDone, onClose, withName }) => {
  const { friends } = useApp();
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const options = friends.filter((f) => !exclude.includes(f.id));
  return createPortal(
    <div className="kfol-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="kfol kgp" role="dialog" aria-modal="true" aria-label={title}>
        <header><Users size={17} /><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Cerrar"><X size={16} /></button></header>
        {withName && <input className="kgp-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="Nombre del grupo (opcional)" />}
        {options.length === 0 ? <p className="kfol-empty">Añade amigos para crear un grupo.</p> : (
          <ul className="kgp-list">
            {options.map((friend) => {
              const on = picked.includes(friend.id);
              return (
                <li key={friend.id}>
                  <button type="button" className={on ? 'is-on' : ''} onClick={() => setPicked(on ? picked.filter((id) => id !== friend.id) : [...picked, friend.id].slice(0, 9))} aria-pressed={on}>
                    <Avatar src={friend.avatar} name={friend.displayName} size={28} />
                    <span>{friend.displayName}</span>
                    <i>{on ? '✓' : ''}</i>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="kfol-row is-end">
          <button type="button" disabled={!picked.length || busy} onClick={async () => { setBusy(true); try { await onDone(picked, name); onClose(); } finally { setBusy(false); } }}>
            {withName ? `Crear grupo (${picked.length + 1})` : 'Añadir'}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
};

/** A group DM: chat, members, rename, leave and a real group call. */
export const GroupChat: React.FC<{ group: DmGroup; onLeft: () => void; onChanged: () => void }> = ({ group, onLeft, onChanged }) => {
  const { currentUser, joinVoiceChannel, activeVoiceChannelId } = useApp();
  const [messages, setMessages] = useState<GroupMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const title = groupTitle(group, currentUser.id);

  useEffect(() => {
    let alive = true;
    api.getGroupMessages(group.id).then((items) => { if (alive) setMessages(items); }).catch(() => { if (alive) setMessages([]); });
    const socket = getSocket();
    const onMessage = (message: GroupMessage) => {
      if (message.groupId !== group.id) return;
      setMessages((prev) => (prev && !prev.some((m) => m.id === message.id) ? [...prev, message] : prev));
    };
    socket.on('group:message', onMessage);
    return () => { alive = false; socket.off('group:message', onMessage); };
  }, [group.id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages?.length]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try {
      const message = await api.sendGroupMessage(group.id, text);
      setMessages((prev) => (prev && !prev.some((m) => m.id === message.id) ? [...prev, message] : prev));
    } catch (error) {
      setDraft(text);
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar.');
    }
  };
  const call = async () => {
    await joinVoiceChannel(group.id, { private: true });
    void api.ringGroup(group.id).catch(() => undefined);
  };
  const [renaming, setRenaming] = useState<string | null>(null);
  const rename = async (name: string) => {
    setRenaming(null);
    if (name.trim() === group.name) return;
    try { await api.renameGroup(group.id, name.trim()); onChanged(); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo renombrar.'); }
  };
  const leave = async () => {
    try { await api.leaveGroup(group.id); toast.success('Has salido del grupo'); onLeft(); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo salir.'); }
  };

  return (
    <div className="kgc">
      <header className="kgc-head">
        <div className="kgc-avatars">{group.members.slice(0, 3).map((m) => <Avatar key={m.id} src={m.avatar} name={m.displayName} size={28} />)}</div>
        <div className="kgc-title">
          {renaming !== null ? (
            <input value={renaming} onChange={(event) => setRenaming(event.target.value)} onBlur={() => void rename(renaming)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') setRenaming(null); }} maxLength={60} autoFocus aria-label="Nombre del grupo" />
          ) : <strong>{title}</strong>}
          <small>{group.members.length} miembros</small>
        </div>
        {activeVoiceChannelId !== group.id && <button type="button" onClick={() => void call()} title="Llamada de grupo" aria-label="Llamada de grupo"><Phone size={16} /></button>}
        <button type="button" onClick={() => setAdding(true)} title="Añadir amigos" aria-label="Añadir amigos"><UserPlus size={16} /></button>
        <button type="button" onClick={() => setRenaming(group.name)} title="Renombrar" aria-label="Renombrar grupo"><Pencil size={15} /></button>
        <button type="button" onClick={() => void leave()} title="Salir del grupo" aria-label="Salir del grupo"><LogOut size={15} /></button>
      </header>
      {activeVoiceChannelId === group.id && <PrivateCallBar title={title} />}
      <div ref={scrollRef} className="kgc-messages custom-scrollbar">
        {messages === null ? <p className="kgc-empty">Cargando…</p> : messages.length === 0 ? <p className="kgc-empty">Saluda al grupo 👋</p> : messages.map((message) => {
          const mine = message.author?.id === currentUser.id;
          return (
            <div key={message.id} className={`kgc-msg ${mine ? 'is-mine' : ''}`}>
              {!mine && <Avatar src={message.author?.avatar} name={message.author?.displayName || '?'} size={28} />}
              <div>
                {!mine && <small>{message.author?.displayName}</small>}
                {message.content && <p>{message.content}</p>}
                {message.attachments.map((att) => (att.type === 'audio' && att.voice ? <VoiceNotePlayer key={att.id} url={att.url} duration={att.duration} seed={att.id} /> : <a key={att.id} href={att.url} target="_blank" rel="noreferrer">{att.name}</a>))}
              </div>
            </div>
          );
        })}
      </div>
      <form className="kgc-composer" onSubmit={send}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Escribe a ${title}`} maxLength={10000} />
        <button type="submit" disabled={!draft.trim()} aria-label="Enviar"><Send size={16} /></button>
      </form>
      {adding && (
        <GroupPicker title="Añadir al grupo" exclude={group.members.map((m) => m.id)} onClose={() => setAdding(false)} onDone={async (ids) => {
          for (const id of ids) await api.addGroupMember(group.id, id).catch((error) => toast.error(error instanceof Error ? error.message : 'No se pudo añadir.'));
          onChanged();
        }} />
      )}
    </div>
  );
};
