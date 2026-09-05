import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Share2,
  RefreshCw,
  Clock,
  Users,
  Shield,
  Send,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { soundFx } from '../../utils/soundEffects';

export const InviteModal: React.FC = () => {
  const { isInviteModalOpen, setIsInviteModalOpen, activeServer, servers, inviteServerId, friends } = useApp();

  const targetServer = (inviteServerId ? servers.find((s) => s.id === inviteServerId) : activeServer) || servers[0];

  const [inviteCode, setInviteCode] = useState(() => Math.random().toString(36).substring(2, 9));
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState<'30m' | '1h' | '6h' | '12h' | '1d' | '7d' | 'never'>('7d');
  const [maxUses, setMaxUses] = useState<number>(0);
  const [tempMembership, setTempMembership] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Record<string, boolean>>({});
  const [searchFriend, setSearchFriend] = useState('');

  if (!isInviteModalOpen || !targetServer) return null;

  const inviteUrl = `https://kova.gg/invite/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    soundFx.playMessageSent();
    toast.success('¡Enlace de invitación copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    const newCode = Math.random().toString(36).substring(2, 9);
    setInviteCode(newCode);
    soundFx.playJoinVoice();
    toast.info('Nuevo código de invitación generado');
  };

  const handleInviteFriend = (friendId: string, friendName: string) => {
    setInvitedFriends((prev) => ({ ...prev, [friendId]: true }));
    soundFx.playJoinVoice();
    toast.success(`Invitación enviada a ${friendName}`);
  };

  const expiryLabels = {
    '30m': '30 minutos',
    '1h': '1 hora',
    '6h': '6 horas',
    '12h': '12 horas',
    '1d': '1 día',
    '7d': '7 días',
    'never': 'nunca',
  };

  const filteredFriends = friends.filter((f) =>
    f.displayName.toLowerCase().includes(searchFriend.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsInviteModalOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#121522] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0e101b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-cyan-300">
              {targetServer.acronym || targetServer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit']">
                Invitar amigos a {targetServer.name}
              </h2>
              <p className="text-[11px] text-slate-400">
                Comparte este enlace para que otros se unan a tu servidor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(false)}
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {/* 1. Direct Friends Section (if user has friends) */}
          {friends.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Invitar amigos directamente
              </span>
              <input
                type="text"
                value={searchFriend}
                onChange={(e) => setSearchFriend(e.target.value)}
                placeholder="Buscar un amigo..."
                className="w-full px-3 py-2 rounded-xl bg-[#0a0c13] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pt-1">
                {filteredFriends.map((f) => {
                  const isInvited = invitedFriends[f.id];
                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={f.avatar}
                          alt={f.displayName}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div>
                          <div className="text-xs font-bold text-white">{f.displayName}</div>
                          <div className="text-[10px] text-slate-400">#{f.tag}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isInvited}
                        onClick={() => handleInviteFriend(f.id, f.displayName)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isInvited
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                        }`}
                      >
                        {isInvited ? 'Invitado' : 'Invitar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Main Generated Invite Link Box */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              O envía un enlace de invitación del servidor
            </span>

            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#090b12] border border-white/[0.1] focus-within:border-cyan-400 transition-colors shadow-inner">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 px-3 py-1.5 bg-transparent text-xs text-slate-200 font-mono focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white glow-purple'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
              <span>
                Expira en: <strong className="text-slate-300">{expiryLabels[expiry]}</strong>
                {maxUses > 0 ? ` · Máx. ${maxUses} usos` : ' · Usos ilimitados'}
              </span>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="text-[#72e4d0] hover:underline font-semibold cursor-pointer"
              >
                {showSettings ? 'Ocultar ajustes' : 'Editar ajustes del enlace'}
              </button>
            </div>
          </div>

          {/* 3. Collapsible Link Expiration / Uses Settings */}
          {showSettings && (
            <div className="p-4 rounded-2xl bg-[#0d0f19] border border-white/[0.08] space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Expirar después de
                  </label>
                  <select
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="30m">30 minutos</option>
                    <option value="1h">1 hora</option>
                    <option value="6h">6 horas</option>
                    <option value="12h">12 horas</option>
                    <option value="1d">1 día</option>
                    <option value="7d">7 días (Predeterminado)</option>
                    <option value="never">Nunca (Sin expiración)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Número máximo de usos
                  </label>
                  <select
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value={0}>Sin límite</option>
                    <option value={1}>1 uso</option>
                    <option value={5}>5 usos</option>
                    <option value={10}>10 usos</option>
                    <option value={25}>25 usos</option>
                    <option value={50}>50 usos</option>
                    <option value={100}>100 usos</option>
                  </select>
                </div>
              </div>

              {/* Temporary Membership Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Conceder membresía temporal
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Expulsa al usuario al desconectar si no tiene rol asignado.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTempMembership(!tempMembership)}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative shrink-0 ${
                    tempMembership ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      tempMembership ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-xs text-slate-300 hover:text-white transition-all cursor-pointer font-semibold"
                >
                  <RefreshCw size={12} />
                  <span>Generar nuevo enlace</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Social Share & QR Code row */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  showQr
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.08]'
                }`}
              >
                <QrCode size={14} />
                <span>{showQr ? 'Ocultar QR' : 'Código QR'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(
                    `https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `¡Únete a mi servidor de Kova "${targetServer.name}"!: ${inviteUrl}`
                    )}`,
                    '_blank'
                  );
                }}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-white/[0.08] transition-all cursor-pointer"
                title="Compartir por WhatsApp"
              >
                <MessageCircle size={15} />
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(
                    `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(
                      `Únete a ${targetServer.name} en Kova`
                    )}`,
                    '_blank'
                  );
                }}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 border border-white/[0.08] transition-all cursor-pointer"
                title="Compartir por Telegram"
              >
                <Send size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Listo
            </button>
          </div>

          {/* QR Code Preview Drawer */}
          {showQr && (
            <div className="p-5 rounded-2xl bg-white flex flex-col items-center justify-center animate-in zoom-in-95 duration-150 text-black">
              {/* SVG QR Code Simulation */}
              <div className="w-40 h-40 bg-white p-2 border-4 border-black rounded-xl flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-10 h-10 border-4 border-black p-1">
                    <div className="w-full h-full bg-black" />
                  </div>
                  <div className="w-10 h-10 border-4 border-black p-1">
                    <div className="w-full h-full bg-black" />
                  </div>
                </div>
                <div className="flex items-center justify-center font-mono font-black text-xs tracking-widest">
                  KOVA INVITE
                </div>
                <div className="flex justify-between">
                  <div className="w-10 h-10 border-4 border-black p-1">
                    <div className="w-full h-full bg-black" />
                  </div>
                  <div className="w-8 h-8 bg-black self-end" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-2">
                Escanea con tu teléfono para unirte
              </p>
              <p className="text-[10px] text-slate-500 font-mono">{inviteUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
