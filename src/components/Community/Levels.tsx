import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, X } from 'lucide-react';
import { api, type LeaderboardEntry, type MemberStats } from '../../services/apiClient';
import { Avatar } from '../Common/Avatar';
import '../../styles/community.css';

/** Level, XP bar and badges of a member in this space (profile card). */
export const MemberLevel: React.FC<{ spaceId: string; userId: string }> = ({ spaceId, userId }) => {
  const [stats, setStats] = useState<MemberStats | null>(null);
  useEffect(() => {
    let alive = true;
    api.getMemberStats(spaceId, userId).then((value) => { if (alive) setStats(value); }).catch(() => undefined);
    return () => { alive = false; };
  }, [spaceId, userId]);
  if (!stats) return null;
  const span = stats.nextLevelXp - stats.currentLevelXp;
  const pct = span > 0 ? Math.min(100, Math.round(((stats.xp - stats.currentLevelXp) / span) * 100)) : 0;
  return (
    <section className="kpf-section klvl">
      <h3>Nivel en el espacio</h3>
      <div className="klvl-row">
        <b className="klvl-badge">{stats.level}</b>
        <div className="klvl-bar">
          <span><i style={{ width: `${pct}%` }} /></span>
          <small>{stats.xp - stats.currentLevelXp} / {span} XP · {stats.messages} mensajes</small>
        </div>
      </div>
      {stats.badges.length > 0 && (
        <ul className="klvl-badges">
          {stats.badges.map((badge) => <li key={badge.id} title={badge.label}><span aria-hidden="true">{badge.emoji}</span>{badge.label}</li>)}
        </ul>
      )}
    </section>
  );
};

/** Top members of the space by XP. */
export const LeaderboardModal: React.FC<{ spaceId: string; spaceName: string; currentUserId: string; onClose: () => void }> = ({ spaceId, spaceName, currentUserId, onClose }) => {
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  useEffect(() => {
    let alive = true;
    api.getLeaderboard(spaceId).then((value) => { if (alive) setRows(value); }).catch(() => { if (alive) setRows([]); });
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { alive = false; window.removeEventListener('keydown', onKey); };
  }, [spaceId, onClose]);
  const medal = (index: number) => ['🥇', '🥈', '🥉'][index] || `${index + 1}`;
  return createPortal(
    <div className="kfol-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="kfol klb" role="dialog" aria-modal="true" aria-label={`Clasificación de ${spaceName}`}>
        <header>
          <Trophy size={17} />
          <h2>Clasificación · {spaceName}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
        </header>
        <p>Ganas XP participando (una vez por minuto, para que el spam no cuente).</p>
        {rows === null ? <p>Cargando…</p> : rows.length === 0 ? <p className="kfol-empty">Aún nadie tiene XP. ¡Escribe algo!</p> : (
          <ol className="klb-list">
            {rows.map((row, index) => (
              <li key={row.userId} className={row.userId === currentUserId ? 'is-me' : ''}>
                <span className="klb-rank">{medal(index)}</span>
                <Avatar src={row.avatar} name={row.displayName || row.username} size={28} />
                <span className="klb-name">{row.displayName || row.username}</span>
                <span className="klb-lvl">Nv. {row.level}</span>
                <small>{row.xp} XP</small>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>,
    document.body,
  );
};
