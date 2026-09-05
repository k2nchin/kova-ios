import React from 'react';
import { UnifiedNavSidebar } from '../ChannelSidebar/UnifiedNavSidebar';
import { ChatArea } from '../ChatArea/ChatArea';
import { VoiceRoom } from '../VoiceRoom/VoiceRoom';
import { NotesChannel } from '../NotesChannel/NotesChannel';
import { PulseFeed } from '../Pulse/PulseFeed';
import { SpatialAudioRadar } from '../VoiceRoom/SpatialAudioRadar';
import { MemberList } from '../MemberList/MemberList';
import { ThreadDrawer } from '../ChatArea/ThreadDrawer';
import { DirectMessagesView } from '../DirectMessages/DirectMessagesView';
import { EmptyServerView } from './EmptyServerView';
import { VoicePerformanceDock } from '../Deck/VoicePerformanceDock';
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
  const { servers, activeServer, activeChannel, isMemberListOpen, isDMViewActive } = useApp();

  const isServerEmpty = !activeServer?.channels || activeServer.channels.length === 0;

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full bg-[#08090d] p-2 gap-2 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Left Unified Modern Navigation Column */}
      {!sidebarCollapsed && (
        <div className="h-full rounded-2xl bg-[#090a0f] border border-white/[0.05] overflow-hidden flex flex-col shadow-xl shrink-0">
          <UnifiedNavSidebar />
        </div>
      )}

      {/* 2. Center Stage Card (Chat / Voice / Notes + Bottom Voice & Performance Dock) */}
      <div className="flex-1 h-full rounded-2xl bg-[#0b0d13] border border-white/[0.05] overflow-hidden flex flex-col shadow-2xl relative min-w-0">
        {/* Content View */}
        <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
          {isDMViewActive ? (
            <DirectMessagesView />
          ) : isServerEmpty ? (
            <EmptyServerView />
          ) : layoutMode === 'pulse_feed' ? (
            <PulseFeed />
          ) : layoutMode === 'voice_radar' ? (
            <SpatialAudioRadar />
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

        {/* Bottom Voice & Performance Dock matching screenshot */}
        <div className="p-2.5 pt-0 bg-transparent shrink-0">
          <VoicePerformanceDock />
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
