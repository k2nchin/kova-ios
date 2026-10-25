import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Titlebar } from './components/Titlebar/Titlebar';
import { LandingPage } from './components/Landing/LandingPage';
import { DownloadsPage } from './components/Downloads/DownloadsPage';
import { Toaster, toast } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeBackground } from './components/Themes/ThemeBackground';
import { useApp } from './context/AppContext';
import { requestNotificationPermission } from './services/notificationService';
import { connectSocketOnResume } from './services/socketClient';
import { useIsMobile } from './hooks/useIsMobile';
import { isDesktopApp, isTauriApp } from './utils/platform';
import { startAutoUpdates, checkAtLaunch, type LaunchUpdateState } from './services/updateService';
import { DesktopSplash } from './components/Brand/DesktopSplash';

// Heavy app views are split into on-demand chunks: landing visitors never
// download the chat workspace, and desktop keeps its instant local load.
const WorkspaceContainer = lazy(() =>
  import('./components/Workspace/WorkspaceContainer').then((m) => ({ default: m.WorkspaceContainer }))
);
const AuthScreen = lazy(() =>
  import('./components/Auth/AuthScreen').then((m) => ({ default: m.AuthScreen }))
);
const KovaAIPanel = lazy(() =>
  import('./components/KovaAI/KovaAIPanel').then((m) => ({ default: m.KovaAIPanel }))
);
const CommandPalette = lazy(() =>
  import('./components/Modals/CommandPalette').then((m) => ({ default: m.CommandPalette }))
);
const MobileTabBar = lazy(() =>
  import('./components/Shell/MobileTabBar').then((m) => ({ default: m.MobileTabBar }))
);

const AppChunkFallback = (
  <div className="flex-1 flex items-center justify-center bg-[#08090d] min-h-screen">
    <img src="/kova-chrome-cube.png" alt="" className="h-12 w-12 animate-pulse opacity-80 select-none" />
  </div>
);

// Lazy-loaded on-demand modals to keep the initial bundle small.
const PinnedMessagesDrawer = lazy(() =>
  import('./components/Modals/PinnedMessagesDrawer').then((m) => ({ default: m.PinnedMessagesDrawer }))
);
const LiveCodeRunnerModal = lazy(() =>
  import('./components/CodePlayground/LiveCodeRunnerModal').then((m) => ({ default: m.LiveCodeRunnerModal }))
);
const ArcadeGameModal = lazy(() =>
  import('./components/Arcade/ArcadeGameModal').then((m) => ({ default: m.ArcadeGameModal }))
);
const TwoFactorSetupModal = lazy(() =>
  import('./components/Modals/TwoFactorSetupModal').then((m) => ({ default: m.TwoFactorSetupModal }))
);
const TwoFactorBackupCodesModal = lazy(() =>
  import('./components/Modals/TwoFactorBackupCodesModal').then((m) => ({ default: m.TwoFactorBackupCodesModal }))
);
const TwoFactorDisableModal = lazy(() =>
  import('./components/Modals/TwoFactorDisableModal').then((m) => ({ default: m.TwoFactorDisableModal }))
);
const CreateServerModal = lazy(() =>
  import('./components/Modals/CreateServerModal').then((m) => ({ default: m.CreateServerModal }))
);
const CreateChannelModal = lazy(() =>
  import('./components/Modals/CreateChannelModal').then((m) => ({ default: m.CreateChannelModal }))
);
const CreateCategoryModal = lazy(() =>
  import('./components/Modals/CreateCategoryModal').then((m) => ({ default: m.CreateCategoryModal }))
);
const SettingsModal = lazy(() =>
  import('./components/Modals/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);
const CreateStoryModal = lazy(() =>
  import('./components/Stories/CreateStoryModal').then((m) => ({ default: m.CreateStoryModal }))
);
const StoryViewerModal = lazy(() =>
  import('./components/Stories/StoryViewerModal').then((m) => ({ default: m.StoryViewerModal }))
);
const SoundboardModal = lazy(() =>
  import('./components/Soundboard/SoundboardModal').then((m) => ({ default: m.SoundboardModal }))
);
const InviteModal = lazy(() =>
  import('./components/Modals/InviteModal').then((m) => ({ default: m.InviteModal }))
);
const ServerSettingsModal = lazy(() =>
  import('./components/Modals/ServerSettingsModal').then((m) => ({ default: m.ServerSettingsModal }))
);
const EditChannelModal = lazy(() =>
  import('./components/Modals/EditChannelModal').then((m) => ({ default: m.EditChannelModal }))
);
const ServerDiscoveryModal = lazy(() =>
  import('./components/Modals/ServerDiscoveryModal').then((m) => ({ default: m.ServerDiscoveryModal }))
);
const UserProfileModal = lazy(() =>
  import('./components/Modals/UserProfileModal').then((m) => ({ default: m.UserProfileModal }))
);
const AppDirectoryModal = lazy(() =>
  import('./components/Modals/AppDirectoryModal').then((m) => ({ default: m.AppDirectoryModal }))
);
const NotificationsDrawer = lazy(() =>
  import('./components/Modals/NotificationsDrawer').then((m) => ({ default: m.NotificationsDrawer }))
);
const LiveStreamsModal = lazy(() =>
  import('./components/Modals/LiveStreamsModal').then((m) => ({ default: m.LiveStreamsModal }))
);

export const MainLayout: React.FC = () => {
  const {
    isCodePlaygroundOpen,
    setIsCodePlaygroundOpen,
    isArcadeOpen,
    setIsArcadeOpen,
    isPinnedDrawerOpen,
    setIsPinnedDrawerOpen,
    isAuthenticated,
    theme,
    isTwoFactorSetupOpen,
    setIsTwoFactorSetupOpen,
    isTwoFactorBackupOpen,
    setIsTwoFactorBackupOpen,
    isTwoFactorDisableOpen,
    setIsTwoFactorDisableOpen,
    isCreateServerOpen,
    isCreateChannelOpen,
    isCreateCategoryOpen,
    isSettingsOpen,
    isCreateStoryOpen,
    activeStoryIndex,
    isSoundboardOpen,
    isInviteModalOpen,
    isServerSettingsOpen,
    isEditChannelOpen,
    isDiscoveryOpen,
    profileModalUser,
    isAppDirectoryOpen,
    isNotificationsOpen,
    isLiveStreamsOpen,
    joinServerByInvite,
    layoutMode,
    setLayoutMode,
    setIsDMViewActive,
  } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 820 : false
  );
  const isMobile = useIsMobile();
  // Wide screens have no tab bar to reopen the sidebar: never leave it folded
  // after the window grows (it starts folded when the window opens narrow).
  useEffect(() => {
    if (!isMobile) setSidebarCollapsed(false);
  }, [isMobile]);
  const isNative = isTauriApp();
  const isDesktop = isDesktopApp();
  const getInviteCode = () => {
    if (typeof window === 'undefined') return null;
    const match = window.location.pathname.match(/^\/invite\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : new URLSearchParams(window.location.search).get('invite');
  };
  const inviteCode = getInviteCode();
  const initialWebView = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? 'app' : 'landing';
  const [viewMode, setViewMode] = useState<'app' | 'landing'>(isNative ? 'app' : initialWebView);
  const inviteHandledRef = useRef(false);

  const openApp = (mode: 'login' | 'register' = 'login') => {
    if (!isNative) {
      const code = getInviteCode();
      if (code) window.sessionStorage.setItem('kova.pendingInvite', code);
      window.history.pushState({}, '', `/app?mode=${mode}${code ? `&invite=${encodeURIComponent(code)}` : ''}`);
    }
    setViewMode('app');
  };

  const openLanding = () => {
    if (!isNative && window.location.pathname !== '/') window.history.pushState({}, '', '/');
    setViewMode('landing');
  };

  const openDownloads = () => {
    if (!isNative) window.history.pushState({}, '', '/downloads');
    setViewMode('landing');
  };

  useEffect(() => {
    if (isNative) return;
    const syncRoute = () => setViewMode(window.location.pathname.startsWith('/app') ? 'app' : 'landing');
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [isNative]);

  useEffect(() => {
    if (!isAuthenticated || inviteHandledRef.current) return;
    const match = !isNative && window.location.pathname.match(/^\/invite\/([^/]+)/);
    const queryCode = !isNative ? new URLSearchParams(window.location.search).get('invite') : null;
    const pendingCode = !isNative ? window.sessionStorage.getItem('kova.pendingInvite') : null;
    const code = match ? decodeURIComponent(match[1]) : (queryCode || pendingCode);
    if (!code) return;
    inviteHandledRef.current = true;
    void joinServerByInvite(code).then((result) => { if (!result.ok) toast.error(result.message); });
    if (!isNative) {
      window.sessionStorage.removeItem('kova.pendingInvite');
      window.history.replaceState({}, '', '/app');
      setViewMode('app');
    }
  }, [isAuthenticated, isNative, joinServerByInvite]);

  useEffect(() => {
    if (!isNative) return;
    let dispose: (() => void) | undefined;
    const handle = (url: string) => {
      const match = url.match(/(?:kova:\/\/invite\/|\/invite\/)([^/?#]+)/i);
      if (match && isAuthenticated) {
        void joinServerByInvite(decodeURIComponent(match[1])).then((result) => { if (!result.ok) toast.error(result.message); });
      }
    };
    void import('@tauri-apps/plugin-deep-link').then(async ({ getCurrent, onOpenUrl }) => {
      const current = await getCurrent();
      current?.forEach(handle);
      dispose = await onOpenUrl((urls) => urls.forEach(handle));
    }).catch(() => undefined);
    return () => dispose?.();
  }, [isNative, isAuthenticated, joinServerByInvite]);

  useEffect(() => {
    if (isAuthenticated) void requestNotificationPermission();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isDesktop) return;
    // Like Discord: download new versions in the background, then offer a restart.
    const stopUpdates = startAutoUpdates((version, restart) => {
      toast(`Kova ${version} está lista`, {
        id: 'kova-update',
        description: 'Reinicia para usar la nueva versión.',
        duration: Infinity,
        action: { label: 'Reiniciar', onClick: () => { void restart(); } },
      });
    });
    const closeToTray = localStorage.getItem('kova.closeToTray') !== '0';
    import('@tauri-apps/api/core')
      .then(({ invoke }) => invoke('set_close_to_tray', { enabled: closeToTray }))
      .catch(() => undefined);
    return stopUpdates;
  }, [isDesktop]);

  useEffect(() => {
    if (!isAuthenticated) return;
    return connectSocketOnResume();
  }, [isAuthenticated]);

  // Alt+P toggles the Pulse hub (AI digest of your space) from anywhere in the app.
  useEffect(() => {
    if (!isAuthenticated) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && (event.key === 'p' || event.key === 'P')) {
        event.preventDefault();
        setIsDMViewActive(false);
        setLayoutMode(layoutMode === 'pulse_feed' ? 'split' : 'pulse_feed');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAuthenticated, layoutMode, setIsDMViewActive, setLayoutMode]);

  if (viewMode === 'landing') {
    if (!isNative && window.location.pathname === '/downloads') {
      return <DownloadsPage onBack={openLanding} onEnterApp={openApp} />;
    }
    return (
      <div className="w-full min-h-screen bg-[#07090e] text-[#dbdee1] relative">
        <LandingPage onEnterApp={openApp} inviteCode={inviteCode} />
        <Toaster position="bottom-right" theme="dark" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0b0e] text-[#dbdee1] relative select-none">
        <ThemeBackground theme={theme} />
        {isDesktop && <Titlebar authMode />}
        <Suspense fallback={AppChunkFallback}>
          <AuthScreen onShowLanding={openLanding} />
        </Suspense>
        <Toaster position="bottom-right" theme="dark" />
      </div>
    );
  }

  return (
    <div className={`kova-app-shell ${isMobile ? 'kova-native-mobile' : ''} flex flex-col h-screen w-screen overflow-hidden bg-[#08090d] text-[#dbdee1] relative select-none font-['Plus_Jakarta_Sans',sans-serif]`}>
      {/* Background Active Theme (OLED / Nebula / Matrix / Synthwave / Discord) */}
      <ThemeBackground theme={theme} />

      {/* Top Titlebar with Search, Bell, Controls & Sidebar Toggle */}
      {isDesktop && <Titlebar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />}

      {/* Main Workspace Canvas (Left Nav + Main Stage with Voice Dock + Members) */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        <Suspense fallback={AppChunkFallback}>
          <WorkspaceContainer
            layoutMode={layoutMode}
            sidebarCollapsed={sidebarCollapsed}
            onCloseSidebar={isMobile ? () => setSidebarCollapsed(true) : undefined}
          />
        </Suspense>
      </main>

      {/* Bottom navigation for mobile */}
      {isMobile && (
        <Suspense fallback={null}>
          <MobileTabBar onOpenNav={() => setSidebarCollapsed(false)} />
        </Suspense>
      )}

      {/* Modals & Overlays */}
      <Suspense fallback={null}>
        <KovaAIPanel />
        <CommandPalette />
      </Suspense>
      <Suspense fallback={null}>
        {isCreateServerOpen && <CreateServerModal />}
        {isCreateChannelOpen && <CreateChannelModal />}
        {isCreateCategoryOpen && <CreateCategoryModal />}
        {isSettingsOpen && <SettingsModal />}
        {isCreateStoryOpen && <CreateStoryModal />}
        {activeStoryIndex !== null && <StoryViewerModal />}
        {isSoundboardOpen && <SoundboardModal />}
        {isPinnedDrawerOpen && (
          <PinnedMessagesDrawer
            isOpen={isPinnedDrawerOpen}
            onClose={() => setIsPinnedDrawerOpen(false)}
          />
        )}
        {isCodePlaygroundOpen && (
          <LiveCodeRunnerModal
            isOpen={isCodePlaygroundOpen}
            onClose={() => setIsCodePlaygroundOpen(false)}
          />
        )}
        {isArcadeOpen && (
          <ArcadeGameModal isOpen={isArcadeOpen} onClose={() => setIsArcadeOpen(false)} />
        )}
        {isTwoFactorSetupOpen && (
          <TwoFactorSetupModal
            isOpen={isTwoFactorSetupOpen}
            onClose={() => setIsTwoFactorSetupOpen(false)}
          />
        )}
        {isTwoFactorBackupOpen && (
          <TwoFactorBackupCodesModal
            isOpen={isTwoFactorBackupOpen}
            onClose={() => setIsTwoFactorBackupOpen(false)}
          />
        )}
        {isTwoFactorDisableOpen && (
          <TwoFactorDisableModal
            isOpen={isTwoFactorDisableOpen}
            onClose={() => setIsTwoFactorDisableOpen(false)}
          />
        )}
        {isInviteModalOpen && <InviteModal />}
        {isServerSettingsOpen && <ServerSettingsModal />}
        {isEditChannelOpen && <EditChannelModal />}
        {isDiscoveryOpen && <ServerDiscoveryModal />}
        {profileModalUser && <UserProfileModal />}
        {isAppDirectoryOpen && <AppDirectoryModal />}
        {/* Discord Hub oculto por petición */}
        {isNotificationsOpen && <NotificationsDrawer />}
        {isLiveStreamsOpen && <LiveStreamsModal />}
      </Suspense>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
};

// Desktop launch screen: checks for updates first (like Discord), then fades
// out once Kova has had a moment to start.
const DesktopLaunch: React.FC = () => {
  const [state, setState] = useState<LaunchUpdateState | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    void checkAtLaunch((next) => { if (!cancelled) setState(next); }).finally(() => {
      if (cancelled) return;
      window.setTimeout(() => {
        setLeaving(true);
        window.setTimeout(() => setGone(true), 400);
      }, Math.max(0, 900 - (Date.now() - startedAt)));
    });
    return () => { cancelled = true; };
  }, []);
  return gone ? null : <DesktopSplash state={state} leaving={leaving} />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <MainLayout />
      {isDesktopApp() && <DesktopLaunch />}
    </ErrorBoundary>
  );
}
