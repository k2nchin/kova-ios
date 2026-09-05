import React, { useState } from 'react';
import { Search, Smile, Image as ImageIcon, X } from 'lucide-react';

interface EmojiGifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (gifUrl: string) => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Frecuentes y Kova',
    emojis: ['🔥', '❤️', '😂', '🚀', '💀', '🧠', '⚡', '👏', '🎉', '💯', '✨', '🦀', '🤖', '🍕', '🌮', '🎸', '🦆', '🥁', '🏆', '🔔', '🗿', '👾'],
  },
  {
    name: 'Caras y Expresiones',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
      '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗',
      '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶',
      '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
    ],
  },
  {
    name: 'Gestos y Manos',
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤏',
      '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪',
      '✍️', '🙏', '🤝',
    ],
  },
  {
    name: 'Tecnología y Objetos',
    emojis: [
      '💻', '🖥️', '🖨️', '⌨️', '🖱️', '📱', '🔋', '🔌', '💡', '🔦', '🕹️', '💾',
      '💿', '📼', '📷', '📹', '🎙️', '📻', '📺', '📡', '⚙️', '💎', '🔑', '🔒',
    ],
  },
];

const CURATED_GIFS = [
  { title: 'Celebración GG', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { title: 'Bailando Hype', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { title: 'Aplausos', url: 'https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif' },
  { title: 'Hacker Typing', url: 'https://media.giphy.com/media/ule4akeEDWAYE/giphy.gif' },
  { title: 'Cat Jamming', url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif' },
  { title: 'Comiendo Palomitas', url: 'https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif' },
  { title: 'Confundido Travolta', url: 'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif' },
];

export const EmojiGifPicker: React.FC<EmojiGifPickerProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  onSelectGif,
}) => {
  const [activeTab, setActiveTab] = useState<'emoji' | 'gif'>('emoji');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  if (!isOpen) return null;

  const query = searchQuery.toLowerCase().trim();

  return (
    <div className="absolute right-3 bottom-14 z-50 w-80 h-96 rounded-2xl bg-[#141824] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 font-['Plus_Jakarta_Sans',sans-serif] select-none">
      {/* Top Header & Tabs */}
      <div className="p-2.5 border-b border-white/[0.08] flex items-center justify-between gap-2 bg-[#0e111a] shrink-0">
        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'emoji'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smile size={13} />
            <span>Emojis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gif')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'gif'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon size={13} />
            <span>GIFs</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-2.5 border-b border-white/[0.06] shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'emoji' ? 'Buscar emojis...' : 'Buscar GIFs...'}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-sans"
            autoFocus
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-3">
        {activeTab === 'emoji' ? (
          <div>
            {EMOJI_CATEGORIES.map((cat) => {
              const matchedEmojis = query
                ? cat.emojis.filter((e) => e.includes(query))
                : cat.emojis;

              if (matchedEmojis.length === 0) return null;

              return (
                <div key={cat.name} className="space-y-1 mb-3">
                  <div className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider px-1">
                    {cat.name}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {matchedEmojis.map((emoji, idx) => (
                      <button
                        key={`${emoji}-${idx}`}
                        type="button"
                        onClick={() => onSelectEmoji(emoji)}
                        onMouseEnter={() => setHoveredEmoji(emoji)}
                        className="w-8 h-8 rounded-lg hover:bg-white/[0.1] flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {CURATED_GIFS.filter((g) => g.title.toLowerCase().includes(query)).map((gif) => (
              <div
                key={gif.title}
                onClick={() => onSelectGif(gif.url)}
                className="rounded-xl overflow-hidden cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all bg-black/40 border border-white/10 group relative h-24"
              >
                <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-white font-semibold truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {gif.title}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emoji Preview Footer (Discord style) */}
      {activeTab === 'emoji' && (
        <div className="h-10 border-t border-white/[0.08] px-3 flex items-center gap-2 bg-[#0e111a] shrink-0 text-xs">
          <span className="text-xl">{hoveredEmoji || '😀'}</span>
          <span className="text-slate-400 font-mono text-[11px] truncate">
            {hoveredEmoji ? `Emoji ${hoveredEmoji}` : 'Pasa el cursor sobre un emoji'}
          </span>
        </div>
      )}
    </div>
  );
};
