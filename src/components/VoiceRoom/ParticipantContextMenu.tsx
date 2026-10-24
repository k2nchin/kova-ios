import React, { useEffect, useRef } from 'react';
import { User, MessageSquare, Volume2, MicOff, UserPlus, ShieldAlert, Flag } from 'lucide-react';

export interface ParticipantMenuAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

interface ParticipantContextMenuProps {
  /** Viewport coordinates where the menu should appear. */
  x: number;
  y: number;
  memberName: string;
  actions: ParticipantMenuAction[];
  onClose: () => void;
}

/** Floating context menu for a voice participant. The caller decides which
 *  actions exist based on real permissions — this component only renders them. */
export const ParticipantContextMenu: React.FC<ParticipantContextMenuProps> = ({ x, y, memberName, actions, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Keep the menu inside the viewport.
  const left = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 960) - 208);
  const top = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 640) - (actions.length * 38 + 16));

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Acciones para ${memberName}`}
      style={{ left, top }}
      className="fixed z-50 w-52 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14151a] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.55)]"
    >
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          role="menuitem"
          onClick={() => {
            action.onSelect();
            onClose();
          }}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
            action.danger
              ? 'text-[#ff3c72] hover:bg-[rgba(255,33,96,.14)]'
              : 'text-[#f5f7fa] hover:bg-white/[0.06]'
          }`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
};

/** Common icon set for consistent menus. */
export const MENU_ICONS = {
  profile: <User size={13} />,
  message: <MessageSquare size={13} />,
  volume: <Volume2 size={13} />,
  localMute: <MicOff size={13} />,
  invite: <UserPlus size={13} />,
  disconnect: <ShieldAlert size={13} />,
  report: <Flag size={13} />,
};
