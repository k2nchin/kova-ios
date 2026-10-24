import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
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
import { api, getAuthToken } from '../../services/apiClient';
import { soundFx } from '../../utils/soundEffects';

export const InviteModal: React.FC = () => {
  const { isInviteModalOpen, setIsInviteModalOpen, activeServer, servers, inviteServerId, friends } = useApp();

  const targetServer = (inviteServerId ? servers.find((s) => s.id === inviteServerId) : activeServer) || servers[0];

  const [inviteCode, setInviteCode] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [generatedOptions, setGeneratedOptions] = useState<{ expiry: typeof expiry; maxUses: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState<'30m' | '1h' | '6h' | '12h' | '1d' | '7d' | 'never'>('7d');
  const [maxUses, setMaxUses] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Record<string, boolean>>({});
  const [searchFriend, setSearchFriend] = useState('');

  const deepLink = inviteCode ? `kova://invite/${encodeURIComponent(inviteCode)}` : '';

  const expiryMinutes = { '30m': 30, '1h': 60, '6h': 360, '12h': 720, '1d': 1440, '7d': 10080, never: 0 }[expiry];
  const generateInvite = async () => {
    if (!targetServer || !getAuthToken()) {
      setInviteCode('');
      setInviteUrl('');
      toast.error('Inicia sesión para crear un enlace de invitación seguro.');
      return;
    }
    setIsGenerating(true);
    try {
      const invite = await api.createInvite(targetServer.id, { expiresInMinutes: expiryMinutes, maxUses });
      setInviteCode(invite.code);
      setInviteUrl(invite.url);
      setGeneratedOptions({ expiry, maxUses });
      setCopied(false);
    } catch (error) {
      setInviteCode('');
      setInviteUrl('');
      toast.error(error instanceof Error ? error.message : 'No se pudo crear la invitación.');
    } finally { setIsGenerating(false); }
  };

  useEffect(() => {
    if (!isInviteModalOpen || !targetServer) return;
    setInviteCode('');
    setInviteUrl('');
    setGeneratedOptions(null);
    void generateInvite();
  // Generate once per opened server. Expiration and use limits apply when a new code is generated.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInviteModalOpen, targetServer?.id]);

  useEffect(() => {
    if (!showQr || !inviteUrl) { setQrDataUrl(''); return; }
    let cancelled = false;
    void QRCode.toDataURL(inviteUrl, { width: 256, margin: 1, color: { dark: '#09090b', light: '#ffffff' } })
      .then((value) => { if (!cancelled) setQrDataUrl(value); })
      .catch(() => { if (!cancelled) setQrDataUrl(''); });
    return () => { cancelled = true; };
  }, [showQr, inviteUrl]);

  if (!isInviteModalOpen || !targetServer) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      soundFx.playMessageSent();
      toast.success('¡Enlace de invitación copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el enlace. Cópialo manualmente.');
    }
  };

  const handleRegenerate = () => {
    void generateInvite();
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({ title: `Únete a ${targetServer.name} en Kova`, text: `Te invito a ${targetServer.name}`, url: inviteUrl });
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') toast.error('No se pudo compartir la invitación.');
    }
  };

  const handleInviteFriend = (friendId: string, friendName: string) => {
    if (!inviteUrl) { toast.error('Primero genera un enlace de invitación.'); return; }
    void navigator.clipboard.writeText(inviteUrl).then(() => toast.success(`Enlace copiado para compartir con ${friendName}`)).catch(() => toast.error('No se pudo copiar el enlace.'));
    setInvitedFriends((prev) => ({ ...prev, [friendId]: true }));
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
        className="w-full max-w-lg rounded-3xl bg-[#0d071c] border border-purple-500/25 shadow-[0_0_40px_rgba(147,51,234,0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-950/40 flex items-center justify-between bg-[#090414]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-300">
              {targetServer.acronym || targetServer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Outfit']">
                Invitar amigos a {targetServer.name}
              </h2>
              <p className="text-[11px] text-purple-300/70">
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
                className="w-full px-3 py-2 rounded-xl bg-[#07020e] border border-purple-900/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
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

            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#07020e] border border-purple-900/30 focus-within:border-purple-500 transition-colors shadow-inner">
              <input
                type="text"
                readOnly
                value={isGenerating ? 'Generando enlace seguro…' : (inviteUrl || 'No se pudo generar el enlace')}
                className="flex-1 px-3 py-1.5 bg-transparent text-xs text-slate-200 font-mono focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                disabled={isGenerating || !inviteUrl}
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
                Enlace actual: <strong className="text-slate-300">{generatedOptions ? expiryLabels[generatedOptions.expiry] : 'sin generar'}</strong>
                {generatedOptions ? (generatedOptions.maxUses > 0 ? ` · Máx. ${generatedOptions.maxUses} usos` : ' · Usos ilimitados') : ''}
              </span>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="text-purple-400 hover:text-purple-300 hover:underline font-semibold cursor-pointer"
              >
                {showSettings ? 'Ocultar ajustes' : 'Editar ajustes del enlace'}
              </button>
            </div>
            {generatedOptions && (generatedOptions.expiry !== expiry || generatedOptions.maxUses !== maxUses) && (
              <p className="px-1 text-[10px] text-amber-300">Cambiaste los ajustes; genera un enlace nuevo para aplicarlos.</p>
            )}
            <div className="flex flex-wrap items-center gap-2 px-1 text-[10px] text-slate-500">
              <span className="rounded-md border border-white/[0.08] px-2 py-1 font-mono">Web: {inviteUrl}</span>
              <span className="rounded-md border border-white/[0.08] px-2 py-1 font-mono">App: {deepLink}</span>
            </div>
          </div>

          {/* 3. Collapsible Link Expiration / Uses Settings */}
          {showSettings && (
            <div className="p-4 rounded-2xl bg-[#07020e] border border-purple-900/30 space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Expirar después de
                  </label>
                  <select
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090414] border border-purple-900/30 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#090414] border border-purple-900/30 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
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

              <div className="pt-2 border-t border-purple-950/40 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 text-xs text-purple-300 hover:text-white transition-all cursor-pointer font-semibold border border-purple-500/20"
                >
                  <RefreshCw size={12} />
                  <span>Generar nuevo enlace</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Social Share & QR Code row */}
          <div className="pt-2 border-t border-purple-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  showQr
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 border-purple-500/20'
                }`}
              >
                <QrCode size={14} />
                <span>{showQr ? 'Ocultar QR' : 'Código QR'}</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-white/[0.08] transition-all cursor-pointer"
                title="Compartir invitación"
              >
                <Share2 size={15} />
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
              {qrDataUrl ? <img src={qrDataUrl} alt="Código QR de invitación a Kova" className="h-40 w-40 rounded-xl" /> : <div className="grid h-40 w-40 place-items-center rounded-xl bg-zinc-100 text-sm text-zinc-600">Generando QR…</div>}
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
