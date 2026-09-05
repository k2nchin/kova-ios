import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Send, Sparkles, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';

export const StoryViewerModal: React.FC = () => {
  const {
    activeStoryIndex,
    closeStoryViewer,
    openStoryViewer,
    stories,
    sendDirectMessage,
    reactToStory,
  } = useApp();

  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  const story = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  // Auto progress timer (5 seconds per story)
  useEffect(() => {
    if (activeStoryIndex === null || isPaused) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + 2; // 50 ticks of 100ms = 5000ms
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex, isPaused, stories.length]);

  useEffect(() => {
    if (progress >= 100 && activeStoryIndex !== null) {
      if (activeStoryIndex < stories.length - 1) {
        setProgress(0);
        openStoryViewer(activeStoryIndex + 1);
      } else {
        closeStoryViewer();
      }
    }
  }, [progress, activeStoryIndex, stories.length, openStoryViewer, closeStoryViewer]);

  if (activeStoryIndex === null || !story) return null;

  const handleNext = () => {
    if (activeStoryIndex < stories.length - 1) {
      setProgress(0);
      openStoryViewer(activeStoryIndex + 1);
    } else {
      closeStoryViewer();
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex > 0) {
      setProgress(0);
      openStoryViewer(activeStoryIndex - 1);
    }
  };

  const handleReact = (emoji: string) => {
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#ff4081', '#72e4d0', '#b89cff'],
    });
    reactToStory(story.id, emoji);
    toast.success(`Reaccionaste con ${emoji}`);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    sendDirectMessage(story.author.id, `Reaccionó a tu historia: "${replyText.trim()}"`);
    toast.success(`Respuesta enviada al chat directo de ${story.author.displayName}`);
    setReplyText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 select-none animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={closeStoryViewer}
    >
      {/* Main Story Container */}
      <div
        className="w-full max-w-sm h-[620px] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col justify-between border border-white/[0.15] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Layer (Image or Gradient) */}
        {story.mediaUrl ? (
          <img
            src={story.mediaUrl}
            alt="Story content"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-b ${
              story.backgroundColor || 'from-purple-900 via-indigo-900 to-black'
            }`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* 1. Top Story Bars & Author Header */}
        <div className="relative z-20 p-4 space-y-3">
          {/* Progress Bars for all stories */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((s, idx) => {
              let fillPercent = 0;
              if (idx < activeStoryIndex) fillPercent = 100;
              else if (idx === activeStoryIndex) fillPercent = progress;

              return (
                <div
                  key={s.id}
                  className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Author info & Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={story.author.avatar}
                alt={story.author.displayName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white/70"
              />
              <div>
                <div className="text-xs font-bold text-white font-['Outfit'] flex items-center gap-1.5">
                  <span>{story.author.displayName}</span>
                  <span className="text-[10px] text-white/70 font-mono">· {story.createdAt}</span>
                </div>
                <div className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                  <Eye size={11} /> {story.views} visualizaciones
                </div>
              </div>
            </div>

            <button
              onClick={closeStoryViewer}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* 2. Middle Content (Text overlay if provided) */}
        <div className="relative z-20 px-6 my-auto text-center pointer-events-none">
          {story.text && (
            <p className="text-base md:text-lg font-bold text-white drop-shadow-xl leading-relaxed whitespace-pre-wrap">
              {story.text}
            </p>
          )}
        </div>

        {/* Navigation tap targets on left and right */}
        <div
          onClick={handlePrev}
          className="absolute left-0 top-16 bottom-20 w-1/3 z-10 cursor-pointer"
          title="Historia anterior"
        />
        <div
          onClick={handleNext}
          className="absolute right-0 top-16 bottom-20 w-1/3 z-10 cursor-pointer"
          title="Siguiente historia"
        />

        {/* Left / Right chevron indicators */}
        {activeStoryIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>

        {/* 3. Bottom Footer: Emojis + Direct Reply Input */}
        <div className="relative z-20 p-4 space-y-3">
          {/* Quick Reaction Emojis */}
          <div className="flex items-center justify-around px-2">
            {['🔥', '❤️', '😂', '👏', '🚀', '💯'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className="text-xl hover:scale-130 transition-transform active:scale-95 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Direct Message Input */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Responder a ${story.author.displayName.split(' ')[0]}...`}
              className="flex-1 px-3.5 py-2 rounded-2xl bg-black/50 border border-white/20 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#72e4d0] backdrop-blur-md"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-40 hover:opacity-90 transition-all shadow-md cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
