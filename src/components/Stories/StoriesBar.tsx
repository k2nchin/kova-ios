import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StoriesBar: React.FC = () => {
  const { currentUser, stories, openStoryViewer, setIsCreateStoryOpen } = useApp();

  // Separate own stories from friend stories
  const myStories = stories.filter((s) => s.author.id === currentUser.id);
  const myStoryIndex = stories.findIndex((s) => s.author.id === currentUser.id);
  const friendStories = stories.filter((s) => s.author.id !== currentUser.id);

  return (
    <div className="w-full bg-[#0e111a]/95 border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-3 overflow-x-auto custom-scrollbar select-none z-20 shrink-0 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Add / View My Story Pill */}
      <div className="flex flex-col items-center gap-1 shrink-0 group">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (myStories.length > 0) {
                openStoryViewer(myStoryIndex);
              } else {
                setIsCreateStoryOpen(true);
              }
            }}
            className={`w-12 h-12 rounded-2xl p-0.5 transition-all flex items-center justify-center cursor-pointer ${
              myStories.length > 0
                ? 'bg-gradient-to-tr from-[#72e4d0] via-pink-500 to-purple-600 shadow-[0_0_12px_rgba(114,228,208,0.4)] hover:scale-105'
                : 'border-2 border-dashed border-[#72e4d0]/60 hover:border-[#72e4d0] bg-[#171b25]'
            }`}
            title={myStories.length > 0 ? 'Ver mi historia' : 'Subir una nueva historia'}
          >
            <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#111420] ring-2 ring-[#0e111a]">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs">
                  {(currentUser.displayName || 'U').charAt(0)}
                </div>
              )}
            </div>
          </button>

          {/* Plus icon badge to always allow uploading another */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCreateStoryOpen(true);
            }}
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#72e4d0] text-[#0b0d12] flex items-center justify-center shadow-md font-bold text-xs ring-2 ring-[#0e111a] hover:scale-110 transition-transform cursor-pointer"
            title="Crear nueva historia"
          >
            <Plus size={13} strokeWidth={3} />
          </button>
        </div>
        <span className="text-[10px] text-slate-300 font-semibold group-hover:text-white transition-colors max-w-[64px] truncate text-center">
          Tu historia
        </span>
      </div>

      {/* 2. Friend Stories List (Only rendered if friend stories exist) */}
      {friendStories.length > 0 && (
        <>
          <div className="w-[1px] h-8 bg-white/[0.08] shrink-0 mx-1" />
          {friendStories.map((story) => {
            const originalIndex = stories.findIndex((s) => s.id === story.id);
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => openStoryViewer(originalIndex)}
                className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
                title={`Ver historia de ${story.author.displayName}`}
              >
                <div className="relative">
                  {/* Neon glowing ring */}
                  <div className="w-12 h-12 rounded-2xl p-[2px] bg-gradient-to-tr from-purple-500 via-pink-500 to-[#72e4d0] shadow-md group-hover:shadow-[0_0_12px_rgba(184,156,255,0.5)] transition-all group-hover:scale-105">
                    <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#111420] ring-2 ring-[#0e111a]">
                      <img
                        src={story.author.avatar}
                        alt={story.author.displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-pink-500 border border-[#0e111a] animate-pulse" />
                </div>
                <span className="text-[10px] text-slate-300 font-medium group-hover:text-[#72e4d0] transition-colors max-w-[62px] truncate text-center">
                  {story.author.displayName.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
};

