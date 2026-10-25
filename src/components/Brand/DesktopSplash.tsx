import React from 'react';
import type { LaunchUpdateState } from '../../services/updateService';
import './splash.css';

const LINES = ['Afinando la señal…', 'Puliendo el cromo…', 'Despertando las salas de voz…', 'Encendiendo Kova…'];

/** Launch screen of the desktop app, like Discord's: logo + update status. */
export const DesktopSplash: React.FC<{ state: LaunchUpdateState | null; leaving: boolean }> = ({ state, leaving }) => {
  const [line] = React.useState(() => LINES[Math.floor(Math.random() * LINES.length)]);
  const status =
    state?.phase === 'downloading'
      ? `Descargando Kova ${state.version}${state.percent !== null ? ` · ${state.percent}%` : '…'}`
      : state?.phase === 'installing'
        ? `Instalando Kova ${state.version}…`
        : state?.phase === 'checking'
          ? 'Buscando actualizaciones…'
          : 'Iniciando…';
  const percent = state?.phase === 'downloading' ? state.percent : state?.phase === 'installing' ? 100 : null;

  return (
    <div className={`ksp ${leaving ? 'is-leaving' : ''}`} role="status" aria-live="polite" data-tauri-drag-region>
      <div className="ksp-logo" data-tauri-drag-region>
        <span className="ksp-ring" />
        <img src="/kova-chrome-cube.png" alt="Kova" draggable={false} />
      </div>
      <p className="ksp-line">{line}</p>
      <p className="ksp-status">{status}</p>
      <div className={`ksp-bar ${percent === null ? 'is-indeterminate' : ''}`} aria-hidden>
        <span style={percent === null ? undefined : { width: `${percent}%` }} />
      </div>
    </div>
  );
};
