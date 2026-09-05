import React from 'react';
import { ServerSidebar } from '../ServerSidebar/ServerSidebar';
import { ChannelSidebar } from '../ChannelSidebar/ChannelSidebar';
import { UserCapsule } from '../ChannelSidebar/UserCapsule';
import { VoiceConnectedBar } from '../ChannelSidebar/VoiceConnectedBar';
import { ChatArea } from '../ChatArea/ChatArea';
import { VoiceRoom } from '../VoiceRoom/VoiceRoom';
import { NotesChannel } from '../NotesChannel/NotesChannel';
import { PulseFeed } from '../Pulse/PulseFeed';
import { SpatialAudioRadar } from '../VoiceRoom/SpatialAudioRadar';
import { MemberList } from '../MemberList/MemberList';
import { ThreadDrawer } from '../ChatArea/ThreadDrawer';
import { StoriesBar } from '../Stories/StoriesBar';
import { DirectMessagesView } from '../DirectMessages/DirectMessagesView';
import { EmptyServerView } from './EmptyServerView';
import { useApp } from '../../context/AppContext';
import { WorkspaceLayoutMode } from '../../types';

interface WorkspaceContainerProps {
  layoutMode: WorkspaceLayoutMode;
}

export const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({ layoutMode }) => {
  const { servers, activeServer, activeChannel, isMemberListOpen, isDMViewActive } = useApp();

  const hideSidebars = layoutMode === 'chat_focus';

  // If in Direct Messages mode or no servers exist yet
  if (isDMViewActive || servers.length === 0 || !activeServer?.id) {
    return (
      <div className="flex-1 flex overflow-hidden w-full h-full bg-[#0b0d12] p-2 gap-2 select-none pb-16">
        <ServerSidebar />
        <div className="flex-1 h-full rounded-2xl bg-[#0f1219] border border-white/[0.06] overflow-hidden flex flex-col shadow-2xl relative min-w-0">
          <DirectMessagesView />
        </div>
      </div>
    );
  }

  const isServerEmpty = !activeServer.channels || activeServer.channels.length === 0;

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full bg-[#0b0d12] p-2 gap-2 select-none pb-16">
      {/* 1. Leftmost Mini Rail of Squircles */}
      {!hideSidebars && <ServerSidebar />}

      {/* 2. Channel & User Capsule Column */}
      {!hideSidebars && (
        <div className="w-[245px] h-full flex flex-col gap-2 shrink-0">
          <ChannelSidebar />
          <VoiceConnectedBar />
          <UserCapsule />
        </div>
      )}

      {/* 3. Center Island: Main Active Stage Card */}
      <div className="flex-1 h-full rounded-2xl bg-[#0f1219] border border-white/[0.06] overflow-hidden flex flex-col shadow-2xl relative min-w-0">
        {/* Dynamic Stories Strip at Top */}
        <StoriesBar />

        {/* Content View */}
        <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
          {isServerEmpty ? (
            <EmptyServerView />
          ) : layoutMode === 'pulse_feed' ? (
            <PulseFeed />
          ) : layoutMode === 'voice_radar' ? (
            <SpatialAudioRadar />
          ) : layoutMode === 'direct_messages' ? (
            <DirectMessagesView />
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

      {/* 4. Right Island: Member List / Details Panel */}
      {isMemberListOpen && !hideSidebars && (
        <div className="w-[270px] h-full rounded-2xl bg-[#11151c] border border-white/[0.06] overflow-hidden flex flex-col shadow-2xl shrink-0">
          <MemberList />
        </div>
      )}
    </div>
  );
};
