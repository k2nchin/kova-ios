import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceMessagePlayerProps {
  durationSeconds?: number;
  authorName: string;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  durationSeconds = 6,
  authorName,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 100 / (durationSeconds * 10);
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationSeconds]);

  // Visual waveform heights simulation
  const bars = [35, 60, 45, 90, 75, 40, 65, 80, 50, 100, 70, 45, 60, 85, 40, 95, 55, 30, 70, 50];

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#141724] border border-white/[0.08] max-w-sm mt-2">
      {/* Play/Pause Button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md hover:scale-105 transition-transform"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform visualizer */}
      <div className="flex-1 flex flex-col justify-center space-y-1">
        <div className="flex items-center gap-0.5 h-7">
          {bars.map((height, idx) => {
            const barProgress = (idx / bars.length) * 100;
            const isFilled = progress >= barProgress;

            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isFilled ? 'bg-cyan-400' : 'bg-white/[0.15]'
                }`}
                style={{
                  height: `${height}%`,
                }}
              />
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0:0{Math.floor((progress / 100) * durationSeconds)}</span>
          <span>0:0{durationSeconds}</span>
        </div>
      </div>
    </div>
  );
};
