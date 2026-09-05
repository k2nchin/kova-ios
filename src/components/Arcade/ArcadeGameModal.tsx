import React, { useRef, useEffect, useState } from 'react';
import { Gamepad2, X, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { soundFx } from '../../utils/soundEffects';

interface ArcadeGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArcadeGameModal: React.FC<ArcadeGameModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameSession, setGameSession] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let running = true;

    // Game state
    const paddleWidth = 90;
    const paddleHeight = 12;
    let paddleX = (canvas.width - paddleWidth) / 2;

    let ballX = canvas.width / 2;
    let ballY = canvas.height - 50;
    let dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    let dy = -4;
    const ballRadius = 7;

    let currentScore = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, mouseX - paddleWidth / 2));
    };

    window.addEventListener('mousemove', handleMouseMove);

    const loop = () => {
      if (!running) return;

      // Clear with trail
      ctx.fillStyle = 'rgba(12, 14, 22, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Paddle (Neon Gradient)
      const grad = ctx.createLinearGradient(paddleX, 0, paddleX + paddleWidth, 0);
      grad.addColorStop(0, '#8b5cf6');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#8b5cf6';
      ctx.beginPath();
      ctx.roundRect(paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Ball
      ctx.fillStyle = '#10b981';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#10b981';
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Wall collisions
      if (ballX + dx > canvas.width - ballRadius || ballX + dx < ballRadius) {
        dx = -dx;
        soundFx.playSoundboardFx('laser');
      }
      if (ballY + dy < ballRadius) {
        dy = -dy;
        soundFx.playSoundboardFx('laser');
      } else if (ballY + dy > canvas.height - paddleHeight - 15) {
        // Paddle collision
        if (ballX > paddleX - 5 && ballX < paddleX + paddleWidth + 5) {
          dy = -Math.abs(dy) - 0.15; // slightly increase speed
          dx = dx * 1.05;
          currentScore += 10;
          setScore(currentScore);
          soundFx.playSoundboardFx('arcade');
        } else if (ballY + dy > canvas.height - ballRadius) {
          // Game Over
          running = false;
          setGameOver(true);
          setHighScore((prev) => Math.max(prev, currentScore));
          return;
        }
      }

      ballX += dx;
      ballY += dy;

      animationFrame = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      running = false;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isOpen, gameSession]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#11131c] border border-purple-500/30 shadow-2xl p-6 flex flex-col items-center space-y-4 glow-purple animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">Kova Cyber Pong</h2>
              <p className="text-[11px] text-slate-400">Mueve el ratón para controlar la pala</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
              <Trophy className="w-3.5 h-3.5" />
              <span>Score: {score}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] shadow-inner bg-[#0c0e16]">
          <canvas ref={canvasRef} width={460} height={360} className="block cursor-none" />

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center space-y-3">
              <h3 className="text-xl font-bold text-rose-400 font-['Outfit']">¡JUEGO TERMINADO!</h3>
              <p className="text-xs text-slate-300 font-mono">Puntuación Final: {score}</p>
              <button
                onClick={() => {
                  setGameOver(false);
                  setScore(0);
                  setGameSession((s) => s + 1);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Volver a Jugar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
