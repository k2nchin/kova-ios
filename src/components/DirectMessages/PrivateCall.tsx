import React, { useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { getSocket } from '../../services/socketClient';
import { Avatar } from '../Common/Avatar';

/** Room id for a 1:1 call: both user ids, sorted, so both sides land in the same room. */
export const dmRoomId = (a: string, b: string) => `dm_${[a, b].sort().join('__')}`;
export const isPrivateRoom = (id?: string | null) => Boolean(id && (id.startsWith('dm_') || id.startsWith('group_')));

/** Live bar for a DM or group call: who's in, mic, camera, hang up. */
export const PrivateCallBar: React.FC<{ title: string }> = ({ title }) => {
  const { activeVoiceChannelId, voicePeers, currentUser, toggleMute, toggleCamera, leaveVoiceChannel, isVoiceConnecting } = useApp();
  if (!isPrivateRoom(activeVoiceChannelId)) return null;
  const alone = voicePeers.filter((peer) => !peer.isLocal).length === 0;
  return (
    <div className="kpc" role="region" aria-label="Llamada en curso">
      <div className="kpc-people">
        {voicePeers.map((peer) => (
          <span key={peer.id} className={`kpc-person ${peer.isSpeaking ? 'is-speaking' : ''}`} title={peer.name}>
            <Avatar src={peer.avatar} name={peer.name} size={34} />
            {peer.isMuted && <MicOff size={11} />}
          </span>
        ))}
      </div>
      <div className="kpc-info">
        <strong>{title}</strong>
        <small>{isVoiceConnecting ? 'Conectando…' : alone ? 'Llamando… esperando a que se unan' : `${voicePeers.length} en la llamada`}</small>
      </div>
      <div className="kpc-actions">
        <button type="button" onClick={toggleMute} className={currentUser.isMuted ? 'is-off' : ''} aria-label={currentUser.isMuted ? 'Activar micrófono' : 'Silenciar'}>{currentUser.isMuted ? <MicOff size={16} /> : <Mic size={16} />}</button>
        <button type="button" onClick={() => void toggleCamera()} className={currentUser.isCameraOn ? 'is-on' : ''} aria-label={currentUser.isCameraOn ? 'Apagar cámara' : 'Encender cámara'}>{currentUser.isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}</button>
        <button type="button" className="is-hangup" onClick={() => { leaveVoiceChannel(); toast.info('Llamada finalizada'); }} aria-label="Colgar"><PhoneOff size={16} /></button>
      </div>
    </div>
  );
};

/** Rings you when a friend or group calls: answer joins the same room. */
export const IncomingCalls: React.FC = () => {
  const { joinVoiceChannel, activeVoiceChannelId, setIsDMViewActive, setActiveDMUserId, isAuthenticated } = useApp();
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    const ring = (roomId: string, who: string, where: string, open: () => void) => {
      if (activeVoiceChannelId === roomId) return;
      toast(`📞 ${who} te está llamando`, {
        description: where,
        duration: 30_000,
        action: { label: 'Contestar', onClick: () => { open(); void joinVoiceChannel(roomId, { private: true }); } },
      });
    };
    const onDm = ({ roomId, caller }: { roomId: string; caller: { id: string; displayName: string } }) =>
      ring(roomId, caller.displayName, 'Llamada privada', () => { setIsDMViewActive(true); setActiveDMUserId(caller.id); });
    const onGroup = ({ groupId, groupName, caller }: { groupId: string; groupName: string; caller: { displayName: string } | null }) =>
      ring(groupId, caller?.displayName || 'Alguien', groupName || 'Llamada de grupo', () => { setIsDMViewActive(true); window.dispatchEvent(new CustomEvent('kova:open-group', { detail: groupId })); });
    socket.on('dm:call', onDm);
    socket.on('group:call', onGroup);
    return () => { socket.off('dm:call', onDm); socket.off('group:call', onGroup); };
  }, [isAuthenticated, activeVoiceChannelId, joinVoiceChannel, setIsDMViewActive, setActiveDMUserId]);
  return null;
};
