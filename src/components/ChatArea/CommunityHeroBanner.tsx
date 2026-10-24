import React from 'react';
import { ArrowUpRight, MoreHorizontal, Radio, UserPlus, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CommunityHeroBanner: React.FC = () => {
  const { activeServer, openInviteModal, setIsServerSettingsOpen } = useApp();

  if (!activeServer) return null;

  const people = activeServer.members?.length || 1;
  const active = activeServer.members?.filter((member) => member.status !== 'offline').length || 1;

  return (
    <section className="kova-community-hero kova-space-pulse" aria-label={`Pulso de ${activeServer.name}`}>
      <div className="kova-space-pulse-mark">
        <img src={activeServer.icon || '/kova-chrome-cube.png'} alt="" />
      </div>

      <div className="kova-space-pulse-copy">
        <span className="kova-space-eyebrow"><Radio size={11} /> ESPACIO EN VIVO</span>
        <h1>{activeServer.name}</h1>
        <p>{activeServer.description || 'Un espacio para conectar ideas, personas y momentos.'}</p>
      </div>

      <div className="kova-space-pulse-stats">
        <span><i className="kova-live-dot" />{active} activos</span>
        <span><Users size={13} />{people} personas</span>
      </div>

      <div className="kova-space-pulse-actions">
        <button type="button" onClick={() => openInviteModal()}>
          <UserPlus size={15} /> Invitar <ArrowUpRight size={14} />
        </button>
        <button type="button" onClick={() => setIsServerSettingsOpen(true)} aria-label="Opciones del espacio">
          <MoreHorizontal size={17} />
        </button>
      </div>
    </section>
  );
};
