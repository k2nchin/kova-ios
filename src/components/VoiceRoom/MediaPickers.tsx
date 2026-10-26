import React, { useEffect, useRef, useState } from 'react';
import { AppWindow, Camera, Loader2, Monitor, RefreshCw, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { listCaptureSources, SHARE_QUALITIES, type CaptureSource } from '../../services/screenCapture';
import '../../styles/mediaPicker.css';

const useEscape = (open: boolean, onClose: () => void) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
};

/** Kova's own screen picker (desktop): apps and screens with live thumbnails. */
export const ScreenSharePicker: React.FC = () => {
  const { isScreenPickerOpen, setIsScreenPickerOpen, startScreenShare } = useApp();
  const [tab, setTab] = useState<'window' | 'screen'>('window');
  const [sources, setSources] = useState<CaptureSource[] | null>(null);
  const [selected, setSelected] = useState('');
  const [quality, setQuality] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const close = () => { if (!busy) setIsScreenPickerOpen(false); };
  useEscape(isScreenPickerOpen, close);

  const load = async () => {
    setSources(null); setError('');
    try {
      const list = await listCaptureSources();
      setSources(list);
      if (!list.some((source) => source.kind === 'window')) setTab('screen');
    } catch (err) {
      setSources([]);
      setError(err instanceof Error ? err.message : 'No se pudieron listar las ventanas.');
    }
  };

  useEffect(() => {
    if (!isScreenPickerOpen) return;
    setSelected(''); setTab('window');
    void load();
  }, [isScreenPickerOpen]);

  if (!isScreenPickerOpen) return null;
  const visible = (sources || []).filter((source) => source.kind === tab);

  const share = async () => {
    if (!selected || busy) return;
    setBusy(true);
    const ok = await startScreenShare(selected, SHARE_QUALITIES[quality]);
    setBusy(false);
    if (ok) setIsScreenPickerOpen(false);
  };

  return (
    <div className="kmp-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="kmp" role="dialog" aria-modal="true" aria-labelledby="kmp-screen-title">
        <header className="kmp-head">
          <div>
            <h2 id="kmp-screen-title">Compartir pantalla</h2>
            <p>Elige qué verán las personas de la sala.</p>
          </div>
          <button type="button" className="kmp-icon" onClick={close} aria-label="Cerrar"><X size={18} /></button>
        </header>

        <div className="kmp-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'window'} className={tab === 'window' ? 'is-on' : ''} onClick={() => setTab('window')}>
            <AppWindow size={15} /> Aplicaciones
          </button>
          <button type="button" role="tab" aria-selected={tab === 'screen'} className={tab === 'screen' ? 'is-on' : ''} onClick={() => setTab('screen')}>
            <Monitor size={15} /> Pantallas
          </button>
          <button type="button" className="kmp-refresh" onClick={() => void load()} aria-label="Actualizar lista" title="Actualizar lista">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="kmp-grid">
          {sources === null && <div className="kmp-empty"><Loader2 size={20} className="animate-spin" /> Buscando ventanas…</div>}
          {sources !== null && visible.length === 0 && <div className="kmp-empty">{error || (tab === 'window' ? 'No hay ventanas abiertas para compartir.' : 'No se encontraron pantallas.')}</div>}
          {visible.map((source) => (
            <button
              key={source.id}
              type="button"
              className={`kmp-source ${selected === source.id ? 'is-on' : ''}`}
              onClick={() => setSelected(source.id)}
              onDoubleClick={() => { setSelected(source.id); void share(); }}
              aria-pressed={selected === source.id}
            >
              <span className="kmp-thumb">
                {source.thumbnail ? <img src={`data:image/jpeg;base64,${source.thumbnail}`} alt="" draggable={false} /> : <Monitor size={28} />}
              </span>
              <span className="kmp-name" title={source.name}>{source.name}</span>
              {source.appName && source.kind === 'window' && <span className="kmp-app">{source.appName}</span>}
            </button>
          ))}
        </div>

        <footer className="kmp-foot">
          <label className="kmp-select">
            <span>Calidad</span>
            <select value={quality} onChange={(event) => setQuality(Number(event.target.value))}>
              {SHARE_QUALITIES.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}
            </select>
          </label>
          <div className="kmp-actions">
            <button type="button" className="kmp-ghost" onClick={close}>Cancelar</button>
            <button type="button" className="kmp-primary" onClick={() => void share()} disabled={!selected || busy}>
              {busy ? <><Loader2 size={15} className="animate-spin" /> Iniciando…</> : 'Compartir'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};

/** Camera picker with live preview, before anyone sees you. */
export const CameraPicker: React.FC = () => {
  const { isCameraPickerOpen, setIsCameraPickerOpen, startCamera } = useApp();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const close = () => { if (!busy) setIsCameraPickerOpen(false); };
  useEscape(isCameraPickerOpen, close);

  const stopPreview = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  // List cameras once the dialog opens (labels appear after the first access).
  useEffect(() => {
    if (!isCameraPickerOpen) { stopPreview(); return; }
    setError(''); setDeviceId('');
    navigator.mediaDevices?.enumerateDevices()
      .then((all) => {
        const cams = all.filter((device) => device.kind === 'videoinput');
        setDevices(cams);
        setDeviceId(cams[0]?.deviceId || 'default');
      })
      .catch(() => setError('No se pudo acceder a las cámaras.'));
    return stopPreview;
  }, [isCameraPickerOpen]);

  // Live preview of the chosen camera.
  useEffect(() => {
    if (!isCameraPickerOpen || !deviceId) return;
    let cancelled = false;
    stopPreview();
    navigator.mediaDevices.getUserMedia({ video: deviceId === 'default' ? true : { deviceId: { exact: deviceId } }, audio: false })
      .then(async (stream) => {
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setError('');
        // Now that access was granted, device names are available.
        const all = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setDevices(all.filter((device) => device.kind === 'videoinput'));
      })
      .catch((err) => {
        if (!cancelled) setError(/NotFound|Overconstrained/i.test(String(err)) ? 'No se encontró ninguna cámara.' : /NotAllowed/i.test(String(err)) ? 'Kova no tiene permiso para usar la cámara.' : 'La cámara está en uso por otra aplicación.');
      });
    return () => { cancelled = true; };
  }, [isCameraPickerOpen, deviceId]);

  if (!isCameraPickerOpen) return null;

  const turnOn = async () => {
    setBusy(true);
    stopPreview(); // free the device for the call
    const ok = await startCamera(deviceId && deviceId !== 'default' ? deviceId : undefined);
    setBusy(false);
    if (ok) setIsCameraPickerOpen(false);
  };

  return (
    <div className="kmp-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="kmp kmp-camera" role="dialog" aria-modal="true" aria-labelledby="kmp-cam-title">
        <header className="kmp-head">
          <div>
            <h2 id="kmp-cam-title">Encender cámara</h2>
            <p>Así te verán en la sala.</p>
          </div>
          <button type="button" className="kmp-icon" onClick={close} aria-label="Cerrar"><X size={18} /></button>
        </header>
        <div className="kmp-preview">
          {error ? <div className="kmp-empty"><Camera size={26} /> {error}</div> : <video ref={videoRef} autoPlay playsInline muted />}
        </div>
        <footer className="kmp-foot">
          <label className="kmp-select">
            <span>Cámara</span>
            <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)} disabled={devices.length <= 1}>
              {devices.length === 0 && <option value="default">Cámara predeterminada</option>}
              {devices.map((device, index) => <option key={device.deviceId || index} value={device.deviceId}>{device.label || `Cámara ${index + 1}`}</option>)}
            </select>
          </label>
          <div className="kmp-actions">
            <button type="button" className="kmp-ghost" onClick={close}>Cancelar</button>
            <button type="button" className="kmp-primary" onClick={() => void turnOn()} disabled={busy || Boolean(error)}>
              {busy ? <><Loader2 size={15} className="animate-spin" /> Encendiendo…</> : 'Encender cámara'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
