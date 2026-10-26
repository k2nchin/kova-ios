import React, { useRef, useState } from 'react';
import { Smile, Sticker, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api, uploadFile } from '../../services/apiClient';
import type { Expression } from '../../types';

const MAX_BYTES = { emoji: 512 * 1024, sticker: 2 * 1024 * 1024 };

/** Space settings → Expresiones: upload and remove custom emojis and stickers. */
export const ExpressionsPanel: React.FC<{ spaceId: string; expressions: Expression[] }> = ({ spaceId, expressions }) => {
  const [kind, setKind] = useState<'emoji' | 'sticker'>('emoji');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const items = expressions.filter((item) => item.kind === kind);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|gif|webp|jpeg)$/.test(file.type)) { toast.error('Usa una imagen PNG, GIF, WEBP o JPG.'); return; }
    if (file.size > MAX_BYTES[kind]) { toast.error(`La imagen supera ${kind === 'emoji' ? '512 KB' : '2 MB'}.`); return; }
    const finalName = (name.trim() || file.name.replace(/\.[^.]+$/, '')).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32);
    setBusy(true);
    try {
      const url = await uploadFile(file, 'attachment');
      await api.createExpression(spaceId, { kind, name: finalName, url });
      toast.success(kind === 'emoji' ? `Emoji :${finalName}: añadido` : `Sticker ${finalName} añadido`);
      setName('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (item: Expression) => {
    try { await api.deleteExpression(item.id); toast.success('Eliminado'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo eliminar.'); }
  };

  return (
    <div className="kexp">
      <div className="kexp-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={kind === 'emoji'} className={kind === 'emoji' ? 'is-active' : ''} onClick={() => setKind('emoji')}><Smile size={14} /> Emojis <em>{expressions.filter((i) => i.kind === 'emoji').length}/100</em></button>
        <button type="button" role="tab" aria-selected={kind === 'sticker'} className={kind === 'sticker' ? 'is-active' : ''} onClick={() => setKind('sticker')}><Sticker size={14} /> Stickers <em>{expressions.filter((i) => i.kind === 'sticker').length}/30</em></button>
      </div>
      <p className="kexp-help">
        {kind === 'emoji'
          ? 'Todos los miembros pueden usarlos escribiendo :nombre: o desde el selector de emojis → Espacio. PNG, GIF o WEBP, máx. 512 KB (128×128 se ve mejor).'
          : 'Los stickers se envían en grande desde el selector de emojis → Espacio. PNG, GIF o WEBP, máx. 2 MB (320×320 recomendado).'}
      </p>
      <div className="kexp-add">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder={`Nombre (opcional, p. ej. ${kind === 'emoji' ? 'kova_fuego' : 'gg_wp'})`} maxLength={32} aria-label="Nombre" />
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}><Upload size={14} /> {busy ? 'Subiendo…' : 'Subir imagen'}</button>
        <input ref={fileRef} type="file" accept="image/png,image/gif,image/webp,image/jpeg" hidden onChange={(event) => void onFile(event.target.files?.[0])} />
      </div>
      {items.length === 0 ? <p className="kexp-empty">Aún no hay {kind === 'emoji' ? 'emojis' : 'stickers'} propios.</p> : (
        <ul className={`kexp-grid ${kind === 'sticker' ? 'is-stickers' : ''}`}>
          {items.map((item) => (
            <li key={item.id}>
              <img src={item.url} alt={item.name} />
              <span>{kind === 'emoji' ? `:${item.name}:` : item.name}</span>
              <button type="button" onClick={() => void remove(item)} aria-label={`Eliminar ${item.name}`}><Trash2 size={13} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
