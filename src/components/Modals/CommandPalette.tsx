import React, { useState } from 'react';
import { Search, Hash, Server as ServerIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    servers,
    activeServer,
    setActiveServerId,
    setActiveChannelId,
    setIsKovaAIOpen,
    askKovaAI,
  } = useApp();

  const [query, setQuery] = useState('');

  if (!isCommandPaletteOpen) return null;

  // Search through all channels & servers
  const matchingChannels = activeServer.channels.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const matchingServers = servers.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    setIsCommandPaletteOpen(false);
  };

  const handleSelectServer = (serverId: string) => {
    setActiveServerId(serverId);
    setIsCommandPaletteOpen(false);
  };

  const handleAskAIQuick = (promptText: string) => {
    setIsCommandPaletteOpen(false);
    setIsKovaAIOpen(true);
    askKovaAI(promptText);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#0d071c] border border-purple-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(147,51,234,0.15)] overflow-hidden animate-in zoom-in-95 duration-150 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-purple-950/40 flex items-center gap-3">
          <Search className="w-5 h-5 text-purple-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿A dónde quieres ir? (Escribe para buscar canales, servidores o comandos)..."
            className="flex-1 bg-transparent text-sm text-purple-100 placeholder-purple-400/40 focus:outline-none"
          />
          <kbd className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-950/40 border border-purple-900/40 text-purple-300/70 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="p-3 max-h-80 overflow-y-auto space-y-4">
          {/* Channels */}
          {matchingChannels.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider px-2 mb-1.5 font-mono">
                Canales ({activeServer.name})
              </div>
              <div className="space-y-0.5">
                {matchingChannels.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectChannel(c.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-purple-900/25 text-xs text-purple-200 hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-purple-400" />
                      <span>{c.name}</span>
                    </div>
                    <span className="text-[10px] text-purple-400/50 uppercase font-mono">{c.type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Servers */}
          {matchingServers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider px-2 mb-1.5 font-mono">
                Servidores
              </div>
              <div className="space-y-0.5">
                {matchingServers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectServer(s.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-purple-900/25 text-xs text-purple-200 hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <ServerIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
