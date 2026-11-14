import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronLeft, Home, LayoutGrid, Search, UserRound, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isVoiceLike } from '../../utils/channels';
import { ConsoleSidebar } from './ConsoleSidebar';
import { WorkspaceStage } from '../Workspace/WorkspaceContainer';
import { RightWidgetsSidebar } from '../RightSidebar/RightWidgetsSidebar';
import { WorkspaceLayoutMode } from '../../types';
import { useBackButton, useEdgeSwipeBack, useSheetDragDismiss, useVisualViewportHeight } from '../../hooks/useMobileGestures';

type Tab = 'home' | 'spaces' | 'search' | 'me';

/**
 * iOS-style mobile shell: tab bar + large-title root screens, and a pushed
 * full-screen stack when a channel is opened.
 */
export const MobileShell: React.FC<{ layoutMode?: WorkspaceLayoutMode }> = ({ layoutMode = 'split' }) => {
  const {
    activeServer,
    activeChannel,
    currentUser,
    isDMViewActive,
    setIsDMViewActive,
    activeDMUserId,
    setActiveDMUserId,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setIsSettingsOpen,
    setIsNotificationsOpen,
    isMemberListOpen,
    setIsMemberListOpen,
  } = useApp();

  const [tab, setTab] = useState<Tab>('home');
  const [pushed, setPushed] = useState(false);

  // Keep the stage in sync with the selected tab.
  useEffect(() => {
    if (tab === 'home') setIsDMViewActive(true);
  }, [tab, setIsDMViewActive]);

  // "Inicio" inside the spaces rail jumps to the Home tab instead of pushing.
  useEffect(() => {
    if (pushed && tab === 'spaces' && isDMViewActive) { setPushed(false); setTab('home'); }
  }, [pushed, tab, isDMViewActive]);

  // Picking a channel from search opens it full-screen.
  const channelAtSearch = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (isCommandPaletteOpen) { channelAtSearch.current = `${isDMViewActive}:${activeChannel?.id}`; return; }
    if (channelAtSearch.current !== undefined && channelAtSearch.current !== `${isDMViewActive}:${activeChannel?.id}` && !isDMViewActive) {
      setTab('spaces');
      setIsMemberListOpen(false);
      setPushed(true);
    }
    channelAtSearch.current = undefined;
  }, [isCommandPaletteOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectTab = (next: Tab) => {
    if (next === 'search') { setIsCommandPaletteOpen(true); return; }
    if (next === 'me') { setIsSettingsOpen(true); return; }
    if (next === 'home') setActiveDMUserId(null);
    setPushed(false);
    setIsMemberListOpen(false);
    setTab(next);
  };

  const back = () => {
    setIsMemberListOpen(false);
    setPushed(false);
  };

  const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'spaces', label: 'Espacios', icon: LayoutGrid },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'me', label: 'Tú', icon: UserRound },
  ];

  // An open private conversation is a pushed screen on the Home tab.
  const inDM = !pushed && tab === 'home' && Boolean(activeDMUserId);

  const showMembers = pushed && isMemberListOpen && !isVoiceLike(activeChannel?.type);

  const closeDM = () => setActiveDMUserId(null);
  const pushedRef = useEdgeSwipeBack<HTMLElement>(pushed && !showMembers, back);
  const dmRef = useEdgeSwipeBack<HTMLElement>(inDM, closeDM);
  const sheetRef = useSheetDragDismiss<HTMLDivElement>(() => setIsMemberListOpen(false));
  useVisualViewportHeight(true);
  // System Back (Android / browser): sheet first, then the pushed screen.
  useBackButton(showMembers, () => setIsMemberListOpen(false));
  useBackButton(pushed, back);
  useBackButton(inDM, closeDM);

  return (
    <div className="kova-m-shell">
      {pushed ? (
        <section ref={pushedRef} className="kova-m-screen kova-m-pushed" key="pushed">
          <header className="kova-m-navbar">
            <button type="button" className="kova-m-back" onClick={back} aria-label="Volver a Espacios">
              <ChevronLeft size={26} strokeWidth={2.2} />
              <span>{activeServer?.name || 'Espacios'}</span>
            </button>
            {!isVoiceLike(activeChannel?.type) && (
              <button type="button" className="kova-m-iconbtn" onClick={() => setIsMemberListOpen(!isMemberListOpen)} aria-label="Miembros">
                <Users size={20} />
              </button>
            )}
          </header>
          <div className="kova-m-stage">
            <WorkspaceStage layoutMode={layoutMode} />
          </div>
          {showMembers && (
            <>
              <button type="button" className="kova-m-sheet-backdrop" onClick={() => setIsMemberListOpen(false)} aria-label="Cerrar miembros" />
              <div ref={sheetRef} className="kova-m-sheet" role="dialog" aria-label="Miembros">
                <span className="kova-m-grabber" />
                <RightWidgetsSidebar />
              </div>
            </>
          )}
        </section>
      ) : (
        <section ref={inDM ? dmRef : undefined} className={`kova-m-screen ${inDM ? 'kova-m-pushed' : ''}`} key={inDM ? `dm-${activeDMUserId}` : tab}>
          {inDM ? (
            <header className="kova-m-navbar">
              <button type="button" className="kova-m-back" onClick={closeDM} aria-label="Volver a Inicio">
                <ChevronLeft size={26} strokeWidth={2.2} />
                <span>Inicio</span>
              </button>
            </header>
          ) : (
          <header className="kova-m-largetitle">
            <h1>{tab === 'home' ? 'Inicio' : 'Espacios'}</h1>
            <div className="kova-m-actions">
              <button type="button" className="kova-m-iconbtn" onClick={() => setIsNotificationsOpen(true)} aria-label="Notificaciones">
                <Bell size={20} />
              </button>
              <button type="button" className="kova-m-avatar" onClick={() => setIsSettingsOpen(true)} aria-label="Tu perfil">
                {currentUser?.avatar ? <img src={currentUser.avatar} alt="" /> : (currentUser?.displayName || 'U').slice(0, 1).toUpperCase()}
              </button>
            </div>
          </header>
          )}
          <div className="kova-m-stage">
            {tab === 'home' ? (
              <WorkspaceStage layoutMode={layoutMode} />
            ) : (
              <ConsoleSidebar onNavigate={() => { setIsMemberListOpen(false); setPushed(true); }} />
            )}
          </div>
        </section>
      )}

      {!pushed && !inDM && (
        <nav className="kova-m-tabbar" aria-label="Navegación principal">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'is-active' : ''}
              onClick={() => selectTab(id)}
              aria-label={label}
              aria-current={tab === id ? 'page' : undefined}
            >
              <Icon size={23} strokeWidth={tab === id ? 2.2 : 1.7} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};
