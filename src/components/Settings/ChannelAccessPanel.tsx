import React, { useEffect, useState } from 'react';
import { Lock, PenOff } from 'lucide-react';
import { toast } from 'sonner';
import { api, type ChannelAccess } from '../../services/apiClient';
import { useApp, permissionsIn } from '../../context/AppContext';
import type { Channel, Server } from '../../types';

/** Channel permissions for managers: who sees it (private) and who writes (read-only). */
export const ChannelAccessPanel: React.FC<{ server: Server; channel: Channel }> = ({ server, channel }) => {
  const { currentUser } = useApp();
  const canManage = permissionsIn(server, currentUser.id).has('MANAGE_CHANNELS');
  const [access, setAccess] = useState<ChannelAccess | null>(null);
  const [saving, setSaving] = useState(false);
  const roles = (server.roles || []).filter((role) => !role.id.startsWith('role_everyone_') && !role.id.startsWith('role_owner_'));

  useEffect(() => {
    if (!canManage) return;
    let alive = true;
    api.getChannelAccess(channel.id).then((value) => { if (alive) setAccess(value); }).catch(() => undefined);
    return () => { alive = false; };
  }, [channel.id, canManage]);

  if (!canManage) {
    if (!channel.private && !channel.readOnly) return null;
    return (
      <p className="kca-note">
        {channel.private && <><Lock size={12} /> Canal privado. </>}
        {channel.readOnly && <><PenOff size={12} /> {channel.canSend ? 'Puedes escribir aquí.' : 'Solo lectura para ti.'}</>}
      </p>
    );
  }
  if (!access) return <p className="kca-note">Cargando permisos…</p>;

  const save = async (next: ChannelAccess) => {
    setAccess(next);
    setSaving(true);
    try { setAccess(await api.setChannelAccess(channel.id, next)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudieron guardar los permisos.'); }
    finally { setSaving(false); }
  };
  const toggleRole = (key: 'viewRoles' | 'sendRoles', roleId: string) => {
    const list = access[key].includes(roleId) ? access[key].filter((id) => id !== roleId) : [...access[key], roleId];
    void save({ ...access, [key]: list });
  };

  const roleChips = (key: 'viewRoles' | 'sendRoles') => (
    roles.length === 0
      ? <p className="kca-hint">Crea roles en Ajustes del espacio → Roles para elegir quién.</p>
      : (
        <div className="kca-roles">
          {roles.map((role) => (
            <button key={role.id} type="button" disabled={saving} className={access[key].includes(role.id) ? 'is-on' : ''} onClick={() => toggleRole(key, role.id)} aria-pressed={access[key].includes(role.id)}>
              <i style={{ background: role.color }} /> {role.name}
            </button>
          ))}
        </div>
      )
  );

  return (
    <div className="kca">
      <span className="kca-title">Permisos del canal</span>
      <label className="kca-row">
        <Lock size={14} />
        <span><strong>Privado</strong><small>Solo lo ven los roles elegidos (y admins).</small></span>
        <input type="checkbox" checked={access.private} disabled={saving} onChange={() => void save({ ...access, private: !access.private })} />
      </label>
      {access.private && roleChips('viewRoles')}
      <label className="kca-row">
        <PenOff size={14} />
        <span><strong>Solo lectura</strong><small>Todos leen; escriben solo los roles elegidos (y admins).</small></span>
        <input type="checkbox" checked={access.readOnly} disabled={saving} onChange={() => void save({ ...access, readOnly: !access.readOnly })} />
      </label>
      {access.readOnly && roleChips('sendRoles')}
    </div>
  );
};
