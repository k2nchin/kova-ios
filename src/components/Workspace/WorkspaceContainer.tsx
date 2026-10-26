import React from 'react';
import { isVoiceLike } from '../../utils/channels';
import { ConsoleSidebar } from '../Shell/ConsoleSidebar';
import { ChatArea } from '../ChatArea/ChatArea';
import { VoiceRoom } from '../VoiceRoom/VoiceRoom';
import { NotesChannel } from '../NotesChannel/NotesChannel';
import { PulseFeed } from '../Pulse/PulseFeed';
import { RightWidgetsSidebar } from '../RightSidebar/RightWidgetsSidebar';
import { ThreadDrawer } from '../ChatArea/ThreadDrawer';
import { ForumView } from '../ChatArea/ForumView';
import { WelcomeFlow } from '../Community/WelcomeFlow';
import { DirectMessagesView } from '../DirectMessages/DirectMessagesView';
import { EmptyServerView } from './EmptyServerView';
import { useApp } from '../../context/AppContext';
import { WorkspaceLayoutMode } from '../../types';

interface WorkspaceContainerProps {
  layoutMode?: WorkspaceLayoutMode;
  sidebarCollapsed?: boolean;
  /** Mobile only: closes the navigation drawer. */
  onCloseSidebar?: () => void;
}

export const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({
  layoutMode = 'split',
  sidebarCollapsed = false,
  onCloseSidebar,
}) => {
  const {
    activeServer,
    activeChannel,
    isMemberListOpen,
    setIsMemberListOpen,
    isDMViewActive,
  } = useApp();

  const isServerEmpty = !activeServer?.channels || activeServer.channels.length === 0;

  return (
    <div className="kova-workspace-shell flex-1 flex overflow-hidden w-full h-full bg-[#05010b] p-2 gap-2 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Integrated Left Navigation (Nav + Servidores + Canales + User Capsule) */}
      {!sidebarCollapsed && (
        <>
          {onCloseSidebar && <button type="button" className="kova-drawer-backdrop" onClick={onCloseSidebar} aria-label="Cerrar menú" />}
          <div className="kova-panel kova-panel-left h-full rounded-2xl bg-[#070210] border border-purple-950/40 shadow-xl overflow-hidden shrink-0">
            <ConsoleSidebar onNavigate={onCloseSidebar} />
          </div>
        </>
      )}

      {/* 2. Center Stage (Chat / Voice Room / DMs / Notes) */}
      <div className="kova-panel kova-panel-center flex-1 h-full rounded-2xl bg-[#06020e] backdrop-blur-xl border border-purple-950/40 overflow-hidden flex flex-col shadow-2xl relative min-w-0">
        <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
          <div
            key={`${isDMViewActive ? 'dm' : activeServer?.id}-${activeChannel?.id}-${layoutMode}`}
            className="kova-view-transition flex-1 overflow-hidden flex flex-col min-h-0"
          >
            {isDMViewActive ? (
              <DirectMessagesView />
            ) : isServerEmpty ? (
              <EmptyServerView />
            ) : layoutMode === 'pulse_feed' ? (
              <PulseFeed />
            ) : isVoiceLike(activeChannel?.type) ? (
              <VoiceRoom />
            ) : activeChannel?.type === 'forum' ? (
              <ForumView key={activeChannel.id} />
            ) : activeChannel?.type === 'notes' ? (
              <NotesChannel />
            ) : (
              <ChatArea />
            )}
          </div>

          {/* Threads Drawer */}
          <ThreadDrawer />
          {!isDMViewActive && activeServer && <WelcomeFlow key={activeServer.id} server={activeServer} />}
        </div>
      </div>

      {/* 3. Right Widgets Panel (Miembros en línea, Canales de voz, Emitiendo ahora, Servidores) */}
      {isMemberListOpen && !isDMViewActive && !isServerEmpty && !isVoiceLike(activeChannel?.type) && (
        <button type="button" className="kova-members-backdrop" onClick={() => setIsMemberListOpen(false)} aria-label="Cerrar miembros" />
      )}
      {isMemberListOpen && !isDMViewActive && !isServerEmpty && !isVoiceLike(activeChannel?.type) && (
        <div className="kova-panel kova-panel-right h-full rounded-2xl bg-[#070210] border border-purple-950/40 overflow-hidden flex flex-col shadow-xl shrink-0">
          <RightWidgetsSidebar />
        </div>
      )}
    </div>
  );
};
