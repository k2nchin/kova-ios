import React from 'react';
import { ServerSidebar } from '../ServerSidebar/ServerSidebar';
import { ChannelSidebar } from '../ChannelSidebar/ChannelSidebar';
import { ChatArea } from '../ChatArea/ChatArea';
import { VoiceRoom } from '../VoiceRoom/VoiceRoom';
import { NotesChannel } from '../NotesChannel/NotesChannel';
import { PulseFeed } from '../Pulse/PulseFeed';
import { MemberList } from '../MemberList/MemberList';
import { ThreadDrawer } from '../ChatArea/ThreadDrawer';
import { DirectMessagesView } from '../DirectMessages/DirectMessagesView';
import { EmptyServerView } from './EmptyServerView';
import { useApp } from '../../context/AppContext';
import { WorkspaceLayoutMode } from '../../types';

interface WorkspaceContainerProps {
  layoutMode?: WorkspaceLayoutMode;
  sidebarCollapsed?: boolean;
}

export const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({
  layoutMode = 'split',
  sidebarCollapsed = false,
}) => {
  const { servers, activeServer, activeChannel, isMemberListOpen, isDMViewActive, activeVoiceChannelId } = useApp();

  const isServerEmpty = !activeServer?.channels || activeServer.channels.length === 0;

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full bg-transparent p-2 gap-2 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Left Discord 2-Column Navigation (Servers + Channels) */}
      {!sidebarCollapsed && (
        <div className="flex h-full gap-2 shrink-0">
          <ServerSidebar />
          {!isDMViewActive && (
            <div className="w-[240px] h-full flex flex-col">
              <ChannelSidebar />
            </div>
          )}
        </div>
      )}

      {/* 2. Center Stage Card (Chat / Voice / Notes + Bottom Voice & Performance Dock) */}
      <div className="flex-1 h-full rounded-2xl bg-[#0b0d13]/92 backdrop-blur-xl border border-white/[0.08] overflow-hidden flex flex-col shadow-2xl relative min-w-0">
        {/* Content View */}
        <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
          {isDMViewActive ? (
            <DirectMessagesView />
          ) : isServerEmpty ? (
            <EmptyServerView />
          ) : layoutMode === 'pulse_feed' ? (
            <PulseFeed />
          ) : layoutMode === 'bento_master' ? (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 h-full overflow-hidden gap-2 p-2 bg-[#090b10]">
              <div className="h-full rounded-xl overflow-hidden border border-white/[0.06]">
                <ChatArea />
              </div>
              <div className="h-full rounded-xl overflow-hidden border border-white/[0.06]">
                <NotesChannel />
              </div>
            </div>
          ) : activeChannel?.type === 'voice' ? (
            <VoiceRoom />
          ) : activeChannel?.type === 'notes' ? (
            <NotesChannel />
          ) : (
            <ChatArea />
          )}

          {/* Threads Drawer (if open) */}
          <ThreadDrawer />
        </div>
      </div>

      {/* 3. Right Island: Member List / Details Panel */}
      {isMemberListOpen && !isDMViewActive && !isServerEmpty && (
        <div className="w-[260px] h-full rounded-2xl bg-[#0a0b10] border border-white/[0.05] overflow-hidden flex flex-col shadow-xl shrink-0">
          <MemberList />
        </div>
      )}
    </div>
  );
};
