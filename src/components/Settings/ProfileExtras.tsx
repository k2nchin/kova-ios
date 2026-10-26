import React, { useRef, useState } from 'react';
import { Loader2, Music, Play, Trash2, Upload } from 'lucide-react';
import { Avatar } from '../Common/Avatar';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { uploadFile } from '../../services/apiClient';
import { getMuteSoundStyle, playJoinSound, setMuteSoundStyle, type MuteSoundStyle } from '../../utils/voiceSounds';
import { soundFx } from '../../utils/soundEffects';

const COLORS = ['#454749', '#c2c4c8', '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#14b8a6'];
const MAX_SOUND_SECONDS = 4;

const audioDuration = (file: File) => new Promise<number>((resolve) => {
  const url = URL.createObjectURL(file);
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(audio.duration); };
  audio.onerror = () => { URL.revokeObjectURL(url); resolve(NaN); };
  audio.src = url;
});

/** Profile colour + the sound others hear when you join a voice room. */
export const ProfileExtras: React.FC = () => {
  const { currentUser, updateUserProfile } = useApp();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const accent = currentUser.accentColor || '';

  const pickSound = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) { toast.error('Elige un archivo de audio (mp3, ogg, wav…).'); return; }
    const seconds = await audioDuration(file);
    if (Number.isFinite(seconds) && seconds > MAX_SOUND_SECONDS + 0.5) {
      toast.error(`El sonido dura ${seconds.toFixed(1)} s. Máximo ${MAX_SOUND_SECONDS} s.`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file, 'sound');
      if (await updateUserProfile({ joinSound: url })) {
        toast.success('Sonido de entrada guardado');
        playJoinSound(url);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el sonido.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="kset-extras">
      <div className="kset-field">
        <h4>Color del perfil</h4>
        <p>Se usa en tu tarjeta de perfil cuando no tienes portada.</p>
        <div className="kset-swatches" role="radiogroup" aria-label="Color del perfil">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={accent === color}
              aria-label={color}
              className={accent === color ? 'is-on' : ''}
              style={{ background: color }}
              onClick={() => void updateUserProfile({ accentColor: color })}
            />
          ))}
          <label className="kset-swatch-custom" title="Otro color">
            <input type="color" value={accent || '#454749'} onChange={(e) => void updateUserProfile({ accentColor: e.target.value })} />
          </label>
        </div>
      </div>

      <div className="kset-field">
        <h4>Sonido al entrar a la voz</h4>
        <p>Lo oye todo el mundo en la sala cuando entras. Máximo {MAX_SOUND_SECONDS} segundos y 2 MB.</p>
        <div className="kset-sound">
          <Music size={16} />
          <span>{currentUser.joinSound ? 'Sonido personalizado' : 'Sonido de Kova'}</span>
          <button type="button" className="kset-icon-btn" onClick={() => playJoinSound(currentUser.joinSound)} aria-label="Escuchar"><Play size={15} /></button>
          {currentUser.joinSound && (
            <button type="button" className="kset-icon-btn" onClick={() => void updateUserProfile({ joinSound: '' })} aria-label="Quitar sonido"><Trash2 size={15} /></button>
          )}
          <button type="button" className="kset-btn-ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Subir
          </button>
          <input ref={fileRef} type="file" accept="audio/*" hidden onChange={(e) => { void pickSound(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      </div>
    </section>
  );
};

/** Device-only choice of the mute/unmute sound. */
export const MuteSoundPicker: React.FC = () => {
  const [style, setStyle] = useState<MuteSoundStyle>(getMuteSoundStyle);
  const choose = (next: MuteSoundStyle) => {
    setStyle(next);
    setMuteSoundStyle(next);
    soundFx.playMuteToggle(true);
  };
  return (
    <div className="kset-field kset-extras">
      <h4>Sonido al silenciar</h4>
      <p>Suena al activar o silenciar tu micrófono y tu audio.</p>
      <div className="kset-segment" role="radiogroup" aria-label="Sonido al silenciar">
        {([['clic', 'Clic'], ['suave', 'Suave'], ['ninguno', 'Ninguno']] as const).map(([value, label]) => (
          <button key={value} type="button" role="radio" aria-checked={style === value} className={style === value ? 'is-on' : ''} onClick={() => choose(value)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

/** People you blocked, with a button to unblock each one. */
export const BlockedList: React.FC = () => {
  const { blockedUsers, unblockUser } = useApp();
  return (
    <div className="kset-field kset-extras">
      <h4>Cuentas bloqueadas</h4>
      <p>No pueden escribirte ni enviarte solicitudes, y sus mensajes aparecen ocultos.</p>
      {blockedUsers.length === 0 ? (
        <p className="kset-blocked-empty">No has bloqueado a nadie.</p>
      ) : (
        <ul className="kset-blocked">
          {blockedUsers.map((user) => (
            <li key={user.id}>
              <Avatar src={user.avatar} name={user.displayName || user.username} size={32} />
              <span>
                <strong>{user.displayName || user.username}</strong>
                {user.username && <small>@{user.username}</small>}
              </span>
              <button type="button" className="kset-btn-ghost" onClick={() => void unblockUser(user.id)}>Desbloquear</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
