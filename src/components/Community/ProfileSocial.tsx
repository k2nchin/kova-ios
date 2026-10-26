import React, { useEffect, useRef, useState } from 'react';
import { Code2, Gamepad2, Headphones, NotebookPen, Radio, Tv } from 'lucide-react';
import { toast } from 'sonner';
import { api, uploadFile, type UserActivity } from '../../services/apiClient';
import { Avatar } from '../Common/Avatar';

const ACTIVITY_META: Record<UserActivity['kind'], { label: string; icon: React.ElementType }> = {
  playing: { label: 'Jugando a', icon: Gamepad2 },
  listening: { label: 'Escuchando', icon: Headphones },
  watching: { label: 'Viendo', icon: Tv },
  streaming: { label: 'En directo:', icon: Radio },
  coding: { label: 'Programando', icon: Code2 },
};

const since = (iso: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (minutes < 1) return 'ahora mismo';
  if (minutes < 60) return `desde hace ${minutes} min`;
  return `desde hace ${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

/** "Jugando a Valorant · desde hace 20 min" line. */
export const ActivityLine: React.FC<{ activity?: UserActivity | null; compact?: boolean }> = ({ activity, compact }) => {
  if (!activity) return null;
  const meta = ACTIVITY_META[activity.kind] || ACTIVITY_META.playing;
  const Icon = meta.icon;
  if (compact) return <span className="kact-line is-compact" title={`${meta.label} ${activity.name}`}><Icon size={11} /> {activity.name}</span>;
  return (
    <div className="kact-line">
      <Icon size={18} />
      <div>
        <small>{meta.label}</small>
        <strong>{activity.name}</strong>
        <span>{activity.details ? `${activity.details} · ` : ''}{since(activity.startedAt)}</span>
      </div>
    </div>
  );
};

/** Set what you're doing (shown to friends and people in your spaces). */
export const ActivityEditor: React.FC<{ current?: UserActivity | null; onChange: (activity: UserActivity | null) => void }> = ({ current, onChange }) => {
  const [kind, setKind] = useState<UserActivity['kind']>(current?.kind || 'playing');
  const [name, setName] = useState(current?.name || '');
  const save = async (clear = false) => {
    try {
      const result = await api.setMyActivity(clear ? { clear: true } : { kind, name });
      onChange(result.activity);
      toast.success(clear ? 'Estado de actividad borrado' : 'Estado de actividad actualizado');
      if (clear) setName('');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo guardar.'); }
  };
  return (
    <form className="kps-activity" onSubmit={(event) => { event.preventDefault(); if (name.trim()) void save(); }}>
      <select value={kind} onChange={(event) => setKind(event.target.value as UserActivity['kind'])} aria-label="Tipo de actividad">
        {Object.entries(ACTIVITY_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
      </select>
      <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Valorant, Bad Bunny, Kova…" aria-label="Qué estás haciendo" />
      <button type="submit" disabled={!name.trim()}>Poner</button>
      {current && <button type="button" className="is-ghost" onClick={() => void save(true)}>Quitar</button>}
    </form>
  );
};

/** Private note about someone: only you can see it. */
export const PrivateNote: React.FC<{ userId: string }> = ({ userId }) => {
  const [note, setNote] = useState<string | null>(null);
  const saved = useRef('');
  useEffect(() => {
    let alive = true;
    api.getUserNote(userId).then(({ note: value }) => { if (alive) { setNote(value); saved.current = value; } }).catch(() => { if (alive) setNote(''); });
    return () => { alive = false; };
  }, [userId]);
  if (note === null) return null;
  const persist = () => {
    if (note === saved.current) return;
    saved.current = note;
    void api.setUserNote(userId, note).catch(() => toast.error('No se pudo guardar la nota.'));
  };
  return (
    <section className="kpf-section kps-note">
      <h3><NotebookPen size={12} /> Nota privada</h3>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} onBlur={persist} maxLength={500} rows={2} placeholder="Solo tú la ves. Ej.: lo conocí en el torneo, juega de support." />
    </section>
  );
};

/** Your profile in the current space: avatar, pronouns and bio that only apply here. */
export const SpaceProfileEditor: React.FC<{ spaceId: string; spaceName: string; initial?: { avatar?: string; bio?: string; pronouns?: string }; name: string }> = ({ spaceId, spaceName, initial, name }) => {
  const [avatar, setAvatar] = useState(initial?.avatar || '');
  const [bio, setBio] = useState(initial?.bio || '');
  const [pronouns, setPronouns] = useState(initial?.pronouns || '');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const save = async (next = { avatar, bio, pronouns }) => {
    setBusy(true);
    try { await api.setSpaceProfile(spaceId, next); toast.success(`Perfil en ${spaceName} guardado`); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo guardar.'); }
    finally { setBusy(false); }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 4 * 1024 * 1024) { toast.error('Elige una imagen de menos de 4 MB.'); return; }
    setBusy(true);
    try { const url = await uploadFile(file, 'avatar'); setAvatar(url); await save({ avatar: url, bio, pronouns }); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo subir la imagen.'); }
    finally { setBusy(false); }
  };
  return (
    <section className="kpf-section kps-space">
      <h3>Tu perfil en {spaceName}</h3>
      <div className="kps-space-row">
        <button type="button" className="kps-avatar" onClick={() => fileRef.current?.click()} title="Avatar solo para este espacio" disabled={busy}>
          <Avatar src={avatar} name={name} size={44} />
          <small>{avatar ? 'Cambiar' : 'Avatar'}</small>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => void upload(event.target.files?.[0])} />
        <div className="kps-space-fields">
          <input value={pronouns} onChange={(event) => setPronouns(event.target.value)} maxLength={30} placeholder="Pronombres (opcional)" aria-label="Pronombres" />
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={300} rows={2} placeholder={`Sobre ti en ${spaceName}`} aria-label="Biografía en este espacio" />
        </div>
      </div>
      <div className="kps-space-actions">
        {avatar && <button type="button" className="is-ghost" disabled={busy} onClick={() => { setAvatar(''); void save({ avatar: '', bio, pronouns }); }}>Quitar avatar</button>}
        <button type="button" disabled={busy} onClick={() => void save()}>Guardar</button>
      </div>
    </section>
  );
};
