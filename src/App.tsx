import React, { useState } from 'react';
import { Titlebar } from './components/Titlebar/Titlebar';
import { WorkspaceContainer } from './components/Workspace/WorkspaceContainer';
import { CyberDock } from './components/Deck/CyberDock';
import { AuthScreen } from './components/Auth/AuthScreen';
import { KovaAIPanel } from './components/KovaAI/KovaAIPanel';
import { CommandPalette } from './components/Modals/CommandPalette';
import { CreateServerModal } from './components/Modals/CreateServerModal';
import { CreateChannelModal } from './components/Modals/CreateChannelModal';
import { CreateCategoryModal } from './components/Modals/CreateCategoryModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { LiveCodeRunnerModal } from './components/CodePlayground/LiveCodeRunnerModal';
import { ArcadeGameModal } from './components/Arcade/ArcadeGameModal';
import { CreateStoryModal } from './components/Stories/CreateStoryModal';
import { StoryViewerModal } from './components/Stories/StoryViewerModal';
import { SoundboardModal } from './components/Soundboard/SoundboardModal';
import { PinnedMessagesDrawer } from './components/Modals/PinnedMessagesDrawer';
import { InviteModal } from './components/Modals/InviteModal';
import { ServerSettingsModal } from './components/Modals/ServerSettingsModal';
import { EditChannelModal } from './components/Modals/EditChannelModal';
import { ServerDiscoveryModal } from './components/Modals/ServerDiscoveryModal';
import { UserProfileModal } from './components/Modals/UserProfileModal';
import { AppDirectoryModal } from './components/Modals/AppDirectoryModal';
import { TwoFactorSetupModal } from './components/Modals/TwoFactorSetupModal';
import { TwoFactorBackupCodesModal } from './components/Modals/TwoFactorBackupCodesModal';
import { TwoFactorDisableModal } from './components/Modals/TwoFactorDisableModal';
import { LandingPage } from './components/Landing/LandingPage';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeBackground } from './components/Themes/ThemeBackground';
import { useApp } from './context/AppContext';
import { WorkspaceLayoutMode } from './types';

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
  } = useApp();

  const [layoutMode, setLayoutMode] = useState<WorkspaceLayoutMode>('split');
  const [viewMode, setViewMode] = useState<'app' | 'landing'>(() => {
    const isTauri =
      typeof (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== 'undefined' ||
      typeof (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ !== 'undefined';
    if (isTauri) return 'app';
    const savedUser = localStorage.getItem('kova.auth.user');
    return savedUser ? 'app' : 'landing';
  });

  if (viewMode === 'landing') {
    return (
      <div className="min-h-screen w-screen bg-[#07090e] text-[#dbdee1] relative overflow-y-auto">
        <LandingPage onEnterApp={() => setViewMode('app')} />
        <Toaster position="bottom-right" theme="dark" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0b0e] text-[#dbdee1] relative select-none">
        <ThemeBackground theme={theme} />
        <Titlebar />
        <AuthScreen onShowLanding={() => setViewMode('landing')} />
        <Toaster position="bottom-right" theme="dark" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0b0e]/85 text-[#dbdee1] relative select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Active Theme (OLED / Nebula / Matrix / Synthwave / Discord) */}
      <ThemeBackground theme={theme} />

      {/* Top Discord Titlebar */}
      <Titlebar />

      {/* Main Workspace Canvas (Floating Island Cards: Navigation + Channels + Center Content + Member List) */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        <WorkspaceContainer layoutMode={layoutMode} />
      </main>

      {/* Floating CyberDock at the bottom */}
      <CyberDock layoutMode={layoutMode} setLayoutMode={setLayoutMode} />

      {/* Modals & Overlays */}
      <KovaAIPanel />
      <CommandPalette />
      <CreateServerModal />
      <CreateChannelModal />
      <CreateCategoryModal />
      <SettingsModal />
      <CreateStoryModal />
      <StoryViewerModal />
      <SoundboardModal />
      <PinnedMessagesDrawer
        isOpen={isPinnedDrawerOpen}
        onClose={() => setIsPinnedDrawerOpen(false)}
      />
      <LiveCodeRunnerModal
        isOpen={isCodePlaygroundOpen}
        onClose={() => setIsCodePlaygroundOpen(false)}
      />
      <ArcadeGameModal isOpen={isArcadeOpen} onClose={() => setIsArcadeOpen(false)} />
      <InviteModal />
      <ServerSettingsModal />
      <EditChannelModal />
      <ServerDiscoveryModal />
      <UserProfileModal />
      <AppDirectoryModal />
      <TwoFactorSetupModal
        isOpen={isTwoFactorSetupOpen}
        onClose={() => setIsTwoFactorSetupOpen(false)}
      />
      <TwoFactorBackupCodesModal
        isOpen={isTwoFactorBackupOpen}
        onClose={() => setIsTwoFactorBackupOpen(false)}
      />
      <TwoFactorDisableModal
        isOpen={isTwoFactorDisableOpen}
        onClose={() => setIsTwoFactorDisableOpen(false)}
      />
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <MainLayout />
    </ErrorBoundary>
  );
}
