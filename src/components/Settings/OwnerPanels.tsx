import React, { useEffect, useState } from 'react';
import { Check, Copy, GitBranch, Plus, RefreshCw, Trash2, Webhook } from 'lucide-react';
import { toast } from 'sonner';
import { api, type AuditEntry, type SpaceStats, type SpaceTemplate, type WebhookInfo } from '../../services/apiClient';
import { Avatar } from '../Common/Avatar';
import type { Channel } from '../../types';
import '../../styles/owner.css';

const copy = async (text: string, label: string) => {
  try { await navigator.clipboard.writeText(text); toast.success(`${label} copiado`); } catch { toast.error('No se pudo copiar.'); }
};
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const ACTIONS: Record<string, string> = {
  'space.update': 'cambió los ajustes del espacio',
  'role.create': 'creó el rol',
  'role.update': 'editó el rol',
  'role.delete': 'borró el rol',
  'member.role_add': 'dio un rol a',
  'member.role_remove': 'quitó un rol a',
  'member.kick': 'expulsó a',
  'member.ban': 'vetó a',
  'channel.create': 'creó el canal',
  'channel.update': 'editó el canal',
  'channel.delete': 'borró el canal',
  'channel.permissions': 'cambió los permisos de',
  'invite.create': 'creó una invitación',
  'automod.update': 'cambió AutoMod',
  'welcome.update': 'editó la bienvenida',
  'expression.create': 'subió la expresión',
  'expression.delete': 'borró la expresión',
  'sound.create': 'subió el sonido',
  'webhook.create': 'creó el webhook',
  'webhook.delete': 'borró el webhook',
  'message.pin': 'fijó un mensaje en',
  'message.delete': 'borró un mensaje de',
};
const FILTERS = [['', 'Todo'], ['member', 'Miembros'], ['role', 'Roles'], ['channel', 'Canales'], ['message', 'Mensajes'], ['webhook', 'Webhooks']];

export const AuditPanel: React.FC<{ spaceId: string }> = ({ spaceId }) => {
  const [filter, setFilter] = useState('');
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  useEffect(() => {
    let alive = true;
    api.getAuditLog(spaceId, filter).then((value) => { if (alive) setEntries(value); }).catch(() => { if (alive) setEntries([]); });
    return () => { alive = false; };
  }, [spaceId, filter]);
  return (
    <div className="kown">
      <p className="kown-help">Cada cambio de moderación y configuración queda registrado: quién, qué y cuándo.</p>
      <div className="kown-chips">{FILTERS.map(([id, label]) => <button key={id} type="button" className={filter === id ? 'is-on' : ''} onClick={() => { setEntries(null); setFilter(id); }}>{label}</button>)}</div>
      {entries === null ? <p className="kown-empty">Cargando…</p> : entries.length === 0 ? <p className="kown-empty">Todavía no hay cambios registrados.</p> : (
        <ul className="kown-audit">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Avatar src={entry.actor.avatar} name={entry.actor.name} size={28} />
              <div>
                <p><strong>{entry.actor.name}</strong> {ACTIONS[entry.action] || entry.action} {entry.target && <b>{entry.target}</b>}</p>
                {entry.details && <small>{entry.details}</small>}
              </div>
              <time>{when(entry.createdAt)}</time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const WebhooksPanel: React.FC<{ spaceId: string; channels: Channel[] }> = ({ spaceId, channels }) => {
  const textChannels = channels.filter((c) => c.type === 'text' || c.type === 'announcements');
  const [hooks, setHooks] = useState<WebhookInfo[] | null>(null);
  const [name, setName] = useState('');
  const [channelId, setChannelId] = useState(textChannels[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const load = () => api.getWebhooks(spaceId).then(setHooks).catch(() => setHooks([]));
  useEffect(() => { void load(); }, [spaceId]); // eslint-disable-line react-hooks/exhaustive-deps
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try { await api.createWebhook(spaceId, { name: name.trim() || 'Webhook', channelId }); setName(''); await load(); toast.success('Webhook creado'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo crear.'); }
    finally { setBusy(false); }
  };
  const remove = async (hook: WebhookInfo) => {
    try { await api.deleteWebhook(hook.id); setHooks((prev) => (prev || []).filter((h) => h.id !== hook.id)); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo borrar.'); }
  };
  const channelName = (id: string) => channels.find((c) => c.id === id)?.name || 'canal';
  return (
    <div className="kown">
      <p className="kown-help">Otras apps publican en un canal con una URL secreta. Compatible con el formato de webhooks de Discord (<code>content</code> y <code>embeds</code>), así que tus bots y alertas actuales funcionan cambiando solo la URL. Para GitHub usa la URL de GitHub (tipo de contenido <code>application/json</code>).</p>
      <form className="kown-row" onSubmit={create}>
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Nombre (p. ej. Alertas del servidor)" />
        <select value={channelId} onChange={(event) => setChannelId(event.target.value)} aria-label="Canal">
          {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
        </select>
        <button type="submit" disabled={busy || !channelId}><Plus size={14} /> Crear</button>
      </form>
      {hooks === null ? <p className="kown-empty">Cargando…</p> : hooks.length === 0 ? <p className="kown-empty">Sin webhooks todavía.</p> : (
        <ul className="kown-hooks">
          {hooks.map((hook) => (
            <li key={hook.id}>
              <span className="kown-hook-icon"><Webhook size={16} /></span>
              <div>
                <strong>{hook.name}</strong>
                <small>Publica en #{channelName(hook.channelId)}</small>
              </div>
              <button type="button" onClick={() => void copy(hook.url, 'URL del webhook')} title="Copiar URL"><Copy size={14} /> URL</button>
              <button type="button" onClick={() => void copy(hook.githubUrl, 'URL de GitHub')} title="Copiar URL para GitHub"><GitBranch size={14} /> GitHub</button>
              <button type="button" className="is-danger" onClick={() => void remove(hook)} aria-label={`Borrar ${hook.name}`}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const TemplatePanel: React.FC<{ spaceId: string }> = ({ spaceId }) => {
  const [template, setTemplate] = useState<SpaceTemplate | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void api.getSpaceTemplate(spaceId).then(setTemplate).catch(() => setTemplate(null)); }, [spaceId]);
  const generate = async () => {
    setBusy(true);
    try { setTemplate(await api.createSpaceTemplate(spaceId)); toast.success('Plantilla actualizada con la estructura actual'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo crear la plantilla.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="kown">
      <p className="kown-help">Comparte la estructura de tu espacio (canales, categorías, roles y normas) para que otros creen uno igual. Nunca incluye mensajes ni miembros.</p>
      {template === undefined ? <p className="kown-empty">Cargando…</p> : template ? (
        <div className="kown-template">
          <div className="kown-code">
            <span>Código</span>
            <strong>{template.code}</strong>
            <button type="button" onClick={() => void copy(template.code, 'Código')}><Copy size={14} /></button>
          </div>
          <p>Se usa en <em>Crear espacio → Usar plantilla</em>. Usada {template.uses} {template.uses === 1 ? 'vez' : 'veces'}.</p>
          <p className="kown-meta">{template.channels.length} canales · {template.categories.length} categorías · {template.roles.length} roles{template.hasWelcome ? ' · con normas' : ''}</p>
          <button type="button" className="kown-primary" disabled={busy} onClick={() => void generate()}><RefreshCw size={14} /> Actualizar con los cambios de ahora</button>
        </div>
      ) : (
        <button type="button" className="kown-primary" disabled={busy} onClick={() => void generate()}><Plus size={14} /> Crear plantilla</button>
      )}
    </div>
  );
};

const Bars: React.FC<{ values: number[]; labels?: string[]; height?: number }> = ({ values, labels, height = 90 }) => {
  const max = Math.max(1, ...values);
  return (
    <div className="kown-bars" style={{ height }}>
      {values.map((value, index) => (
        <span key={index} title={`${labels?.[index] || index}: ${value}`}><i style={{ height: `${(value / max) * 100}%` }} /></span>
      ))}
    </div>
  );
};

export const StatsPanel: React.FC<{ spaceId: string }> = ({ spaceId }) => {
  const [stats, setStats] = useState<SpaceStats | null>(null);
  useEffect(() => { void api.getSpaceStats(spaceId).then(setStats).catch(() => toast.error('No se pudieron cargar las estadísticas.')); }, [spaceId]);
  if (!stats) return <p className="kown-empty">Calculando…</p>;
  // Server buckets hours in UTC; shift to the viewer's time zone.
  const offset = -new Date().getTimezoneOffset() / 60;
  const localHours = stats.hours.map((_, hour) => stats.hours[(((hour - offset) % 24) + 24) % 24]);
  const peak = localHours.indexOf(Math.max(...localHours));
  const cards = [
    ['Miembros', stats.totals.members],
    ['Activos esta semana', stats.totals.activeWeek],
    ['Mensajes (30 días)', stats.totals.messages30],
    ['Nuevos (30 días)', stats.totals.joins30],
    ['Nuevos que escriben', stats.totals.newcomerRetention === null ? '—' : `${stats.totals.newcomerRetention}%`],
  ];
  return (
    <div className="kown kown-stats">
      <div className="kown-cards">{cards.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      <section>
        <h3>Mensajes por día</h3>
        <Bars values={stats.days.map((d) => d.messages)} labels={stats.days.map((d) => d.date)} />
        <div className="kown-axis"><span>hace 30 días</span><span>hoy</span></div>
      </section>
      <section>
        <h3>Horas con más actividad {localHours[peak] > 0 && <small>· pico a las {String(peak).padStart(2, '0')}:00</small>}</h3>
        <Bars values={localHours} labels={localHours.map((_, h) => `${h}:00`)} height={60} />
        <div className="kown-axis"><span>00:00</span><span>12:00</span><span>23:00</span></div>
      </section>
      <div className="kown-two">
        <section>
          <h3>Canales más activos</h3>
          <ol className="kown-list">{stats.topChannels.map((c) => <li key={c.id}><span>#{c.name}</span><b>{c.messages}</b></li>)}</ol>
        </section>
        <section>
          <h3>Miembros más activos</h3>
          <ol className="kown-list">{stats.topMembers.length === 0 ? <li>Nadie escribió aún</li> : stats.topMembers.map((m) => <li key={m.id}><Avatar src={m.avatar} name={m.name} size={20} /><span>{m.name}</span><b>{m.messages}</b></li>)}</ol>
        </section>
      </div>
      {stats.deadChannels.length > 0 && (
        <section>
          <h3>Canales sin actividad en 14 días</h3>
          <p className="kown-help">Plantéate fusionarlos o archivarlos: menos canales = conversaciones más vivas.</p>
          <div className="kown-chips">{stats.deadChannels.map((c) => <span key={c.id} className="kown-dead">#{c.name}</span>)}</div>
        </section>
      )}
      {stats.deadChannels.length === 0 && <p className="kown-ok"><Check size={14} /> Todos los canales tuvieron actividad en las últimas dos semanas.</p>}
    </div>
  );
};

/** "Usar una plantilla": paste a code, preview it, create your own copy. */
export const UseTemplateForm: React.FC<{ onCreated: (spaceId: string) => void }> = ({ onCreated }) => {
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<SpaceTemplate | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const look = async (event: React.FormEvent) => {
    event.preventDefault();
    const clean = code.trim().replace(/^.*\//, '');
    if (!clean) return;
    setBusy(true);
    try { const found = await api.previewTemplate(clean); setPreview(found); setName(found.name); }
    catch (error) { setPreview(null); toast.error(error instanceof Error ? error.message : 'No encontramos esa plantilla.'); }
    finally { setBusy(false); }
  };
  const create = async () => {
    if (!preview) return;
    setBusy(true);
    try { const space = await api.useTemplate(preview.code, name.trim() || preview.name); toast.success(`Espacio «${space.name}» creado desde la plantilla`); onCreated(space.id); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo crear el espacio.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="kown kown-use">
      <h3>Usar una plantilla</h3>
      <form className="kown-row" onSubmit={look}>
        <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Código de plantilla" maxLength={80} />
        <button type="submit" disabled={busy || !code.trim()}>Ver</button>
      </form>
      {preview && (
        <div className="kown-template">
          <p className="kown-meta">{preview.channels.length} canales · {preview.categories.length} categorías · {preview.roles.length} roles{preview.hasWelcome ? ' · con normas' : ''}</p>
          <p>{preview.channels.slice(0, 8).map((c) => `#${c.name}`).join('  ')}{preview.channels.length > 8 ? ' …' : ''}</p>
          <div className="kown-row">
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} aria-label="Nombre del nuevo espacio" />
            <button type="button" disabled={busy} onClick={() => void create()}>Crear mi espacio</button>
          </div>
        </div>
      )}
    </div>
  );
};
