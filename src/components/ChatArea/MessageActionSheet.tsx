import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, BookmarkCheck, Copy, Languages, MessageSquareText, Pencil, Pin, PinOff, Reply, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Message } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  message: Message;
  isMine: boolean;
  onClose: () => void;
  onReply: (message: Message) => void;
  onEdit: () => void;
}

const QUICK = ['❤️', '😂', '🔥', '👍', '😮', '😢', '🙏'];

/** iOS-style action sheet for a message: big reactions + every action, one tap away. */
export const MessageActionSheet: React.FC<Props> = ({ message, isMine, onClose, onReply, onEdit }) => {
  const { addReaction, deleteMessage, openThread, translateMessage, togglePinMessage, toggleSaveMessage, savedMessageIds } = useApp();
  const saved = savedMessageIds.has(message.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const run = (fn: () => void) => () => { fn(); onClose(); };
  const actions: { label: string; icon: typeof Reply; onClick: () => void; danger?: boolean; hidden?: boolean }[] = [
    { label: 'Responder', icon: Reply, onClick: run(() => onReply(message)) },
    { label: 'Abrir hilo', icon: MessageSquareText, onClick: run(() => openThread(message)) },
    { label: 'Copiar texto', icon: Copy, onClick: run(() => { void navigator.clipboard?.writeText(message.content).then(() => toast.success('Copiado')); }) },
    { label: 'Traducir', icon: Languages, onClick: run(() => { void translateMessage(message.id); }) },
    { label: saved ? 'Quitar de guardados' : 'Guardar', icon: saved ? BookmarkCheck : Bookmark, onClick: run(() => { void toggleSaveMessage(message.id); }) },
    { label: message.pinned ? 'Desfijar' : 'Fijar', icon: message.pinned ? PinOff : Pin, onClick: run(() => togglePinMessage(message.id)) },
    { label: 'Editar', icon: Pencil, onClick: run(onEdit), hidden: !isMine },
    { label: 'Eliminar', icon: Trash2, onClick: run(() => deleteMessage(message.id)), danger: true, hidden: !isMine },
  ];

  return createPortal(
    <div className="kova-msheet-root" role="presentation" onClick={onClose}>
      <div className="kova-msheet" role="dialog" aria-label="Acciones del mensaje" onClick={(e) => e.stopPropagation()}>
        <span className="kova-m-grabber" />
        <p className="kova-msheet-preview">{message.content.slice(0, 140) || 'Mensaje'}</p>
        <div className="kova-msheet-reactions">
          {QUICK.map((emoji) => (
            <button key={emoji} type="button" aria-label={`Reaccionar ${emoji}`} onClick={run(() => addReaction(message.id, emoji))}>{emoji}</button>
          ))}
        </div>
        <div className="kova-msheet-list">
          {actions.filter((a) => !a.hidden).map(({ label, icon: Icon, onClick, danger }) => (
            <button key={label} type="button" className={danger ? 'is-danger' : ''} onClick={onClick}>
              <Icon size={18} /> <span>{label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="kova-msheet-cancel" onClick={onClose}>Cancelar</button>
      </div>
    </div>,
    document.body,
  );
};
