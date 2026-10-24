import React from 'react';
import { Home, MessagesSquare, Users, Search, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileTabBarProps {
  onOpenNav: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ onOpenNav }) => {
  const { setIsDMViewActive, setActiveDMUserId, setIsMemberListOpen, setIsCommandPaletteOpen, setIsSettingsOpen } = useApp();

  const tabs = [
    { id: 'home', label: 'Inicio', icon: Home, onClick: () => { setActiveDMUserId(null); setIsDMViewActive(true); } },
    { id: 'spaces', label: 'Espacios', icon: MessagesSquare, onClick: onOpenNav },
    { id: 'members', label: 'Miembros', icon: Users, onClick: () => setIsMemberListOpen(true) },
    { id: 'search', label: 'Buscar', icon: Search, onClick: () => setIsCommandPaletteOpen(true) },
    { id: 'settings', label: 'Ajustes', icon: Settings, onClick: () => setIsSettingsOpen(true) },
  ];

  return (
    <nav className="kova-mobile-tabbar flex items-stretch justify-around shrink-0 bg-[#08080b]/95 border-t border-white/10 backdrop-blur-xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={tab.onClick}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2.5 text-zinc-500 active:text-white active:scale-95 transition-colors min-w-0"
            aria-label={tab.label}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="text-[9px] font-semibold tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
