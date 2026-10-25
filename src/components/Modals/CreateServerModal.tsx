import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, Hash, ImagePlus, Link, Loader2, Lock, Globe, Volume2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { api, uploadFile } from '../../services/apiClient';
import { SPACE_TEMPLATES, type SpaceTemplateId } from '../../data/spaceTemplates';
import type { Server } from '../../types';
import { Avatar } from '../Common/Avatar';
import '../../styles/createSpace.css';

type Step = 'template' | 'details' | 'invite' | 'join';

/** Wizard to create a space (template → details → invite) or join one with a code. */
export const CreateServerModal: React.FC = () => {
  const { isCreateServerOpen, setIsCreateServerOpen, createServer, joinServerByInvite, currentUser } = useApp();

  const [step, setStep] = useState<Step>('template');
  const [template, setTemplate] = useState<SpaceTemplateId>('amigos');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [iconUrl, setIconUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Server | null>(null);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Start fresh every time the dialog opens.
  useEffect(() => {
    if (!isCreateServerOpen) return;
    setStep('template'); setTemplate('amigos'); setName(`Espacio de ${currentUser.displayName}`);
    setDescription(''); setVisibility('private'); setIconUrl(''); setCreated(null);
    setInviteUrl(''); setCopied(false); setInviteInput(''); setJoinError('');
  }, [isCreateServerOpen, currentUser.displayName]);

  useEffect(() => {
    if (!isCreateServerOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) setIsCreateServerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCreateServerOpen, busy, setIsCreateServerOpen]);

  if (!isCreateServerOpen) return null;

  const close = () => { if (!busy) setIsCreateServerOpen(false); };
  const selected = SPACE_TEMPLATES.find((item) => item.id === template)!;

  const pickIcon = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Elige una imagen.'); return; }
    setUploading(true);
    try {
      setIconUrl(await uploadFile(file, 'icon'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || busy || uploading) return;
    setBusy(true);
    const space = await createServer(name.trim(), description.trim(), iconUrl || undefined, template, visibility);
    if (space) {
      setCreated(space);
      setStep('invite');
      api.createInvite(space.id, { expiresInMinutes: 7 * 24 * 60, maxUses: 0 })
        .then((invite) => setInviteUrl(invite.url))
        .catch(() => setInviteUrl(''));
    }
    setBusy(false);
  };

  const submitJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteInput.trim() || busy) return;
    setBusy(true); setJoinError('');
    const result = await joinServerByInvite(inviteInput.trim());
    setBusy(false);
    if (result.ok) setIsCreateServerOpen(false);
    else setJoinError(result.message);
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('No se pudo copiar. Selecciona el enlace y cópialo a mano.');
    }
  };

  const stepIndex = step === 'template' ? 1 : step === 'details' ? 2 : 3;

  return (
    <div className="kcs-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="kcs-dialog" role="dialog" aria-modal="true" aria-labelledby="kcs-title">
        <header className="kcs-head">
          {(step === 'details' || step === 'join') && (
            <button type="button" className="kcs-icon-btn" onClick={() => setStep('template')} aria-label="Volver"><ArrowLeft size={16} /></button>
          )}
          {step !== 'join' && (
            <ol className="kcs-steps" aria-label={`Paso ${stepIndex} de 3`}>
              {[1, 2, 3].map((n) => <li key={n} className={n <= stepIndex ? 'is-on' : ''} />)}
            </ol>
          )}
          <button type="button" className="kcs-icon-btn kcs-close" onClick={close} aria-label="Cerrar"><X size={16} /></button>
        </header>

        {step === 'template' && (
          <section className="kcs-body">
            <h2 id="kcs-title">¿Para qué es tu espacio?</h2>
            <p className="kcs-lead">Elige un punto de partida. Podrás cambiar los canales cuando quieras.</p>
            <div className="kcs-templates">
              {SPACE_TEMPLATES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`kcs-template ${template === item.id ? 'is-selected' : ''}`}
                  onClick={() => setTemplate(item.id)}
                  onDoubleClick={() => { setTemplate(item.id); setStep('details'); }}
                  aria-pressed={template === item.id}
                >
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
            <div className="kcs-preview" aria-label="Canales que se crearán">
              {selected.sections.map((section) => (
                <div key={section.name}>
                  <h3>{section.name}</h3>
                  <ul>
                    {section.channels.map((channel) => (
                      <li key={channel.name}>
                        {channel.type === 'voice' ? <Volume2 size={13} /> : <Hash size={13} />}
                        {channel.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <footer className="kcs-foot">
              <button type="button" className="kcs-link" onClick={() => setStep('join')}><Link size={14} /> Tengo una invitación</button>
              <button type="button" className="kcs-primary" onClick={() => setStep('details')}>Continuar</button>
            </footer>
          </section>
        )}

        {step === 'details' && (
          <form className="kcs-body" onSubmit={submitCreate}>
            <h2 id="kcs-title">Personalízalo</h2>
            <p className="kcs-lead">Dale un nombre y una cara. Todo se puede cambiar después.</p>
            <div className="kcs-identity">
              <button type="button" className="kcs-icon-pick" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Subir icono">
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Avatar src={iconUrl} name={name || 'K'} size={72} />}
                <span><ImagePlus size={13} /></span>
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => { pickIcon(event.target.files?.[0]); event.target.value = ''; }} />
              <div>
                <strong>Icono del espacio</strong>
                <small>{iconUrl ? <button type="button" className="kcs-link" onClick={() => setIconUrl('')}>Quitar imagen</button> : 'Opcional. Si no subes una, usamos sus iniciales.'}</small>
              </div>
            </div>
            <label className="kcs-field">
              <span>Nombre</span>
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} autoFocus required />
            </label>
            <label className="kcs-field">
              <span>Descripción <em>opcional</em></span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200} rows={2} placeholder="¿De qué va este espacio?" />
            </label>
            <div className="kcs-visibility" role="radiogroup" aria-label="Visibilidad">
              <button type="button" role="radio" aria-checked={visibility === 'private'} className={visibility === 'private' ? 'is-selected' : ''} onClick={() => setVisibility('private')}>
                <Lock size={15} /><strong>Privado</strong><span>Solo con invitación</span>
              </button>
              <button type="button" role="radio" aria-checked={visibility === 'public'} className={visibility === 'public' ? 'is-selected' : ''} onClick={() => setVisibility('public')}>
                <Globe size={15} /><strong>Público</strong><span>Aparece en Explorar</span>
              </button>
            </div>
            <footer className="kcs-foot">
              <span className="kcs-hint">{selected.title} · {selected.sections.reduce((n, s) => n + s.channels.length, 0)} canales</span>
              <button type="submit" className="kcs-primary" disabled={!name.trim() || busy || uploading}>
                {busy ? <><Loader2 size={15} className="animate-spin" /> Creando…</> : 'Crear espacio'}
              </button>
            </footer>
          </form>
        )}

        {step === 'invite' && created && (
          <section className="kcs-body kcs-done">
            <Avatar src={created.icon} name={created.name} size={64} />
            <h2 id="kcs-title">{created.name} está listo</h2>
            <p className="kcs-lead">Comparte este enlace para que tu gente entre. Caduca en 7 días.</p>
            <div className="kcs-invite">
              <input readOnly value={inviteUrl || 'Generando enlace…'} onFocus={(event) => event.target.select()} aria-label="Enlace de invitación" />
              <button type="button" className="kcs-primary" onClick={copyInvite} disabled={!inviteUrl}>
                {copied ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}
              </button>
            </div>
            <footer className="kcs-foot kcs-foot-end">
              <button type="button" className="kcs-primary" onClick={() => setIsCreateServerOpen(false)}>Ir a mi espacio</button>
            </footer>
          </section>
        )}

        {step === 'join' && (
          <form className="kcs-body" onSubmit={submitJoin}>
            <h2 id="kcs-title">Unirse a un espacio</h2>
            <p className="kcs-lead">Pega el enlace o el código que te pasaron.</p>
            <label className="kcs-field">
              <span>Invitación</span>
              <input
                value={inviteInput}
                onChange={(event) => { setInviteInput(event.target.value); setJoinError(''); }}
                placeholder="https://kova…/invite/abc123 o abc123"
                aria-invalid={Boolean(joinError)}
                autoFocus
              />
            </label>
            {joinError && <p className="kcs-error" role="alert">{joinError}</p>}
            <footer className="kcs-foot kcs-foot-end">
              <button type="submit" className="kcs-primary" disabled={!inviteInput.trim() || busy}>
                {busy ? <><Loader2 size={15} className="animate-spin" /> Entrando…</> : 'Unirme'}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
};
