import React, { useCallback, useRef } from 'react';
import { Radar as RadarIcon } from 'lucide-react';
import { soundFx } from '../../utils/soundEffects';

export interface RadarMember {
  id: string;
  name: string;
  avatar?: string;
  radarPos?: { x: number; y: number };
  isSpeaking?: boolean;
}

interface VoiceRadarProps {
  me: RadarMember;
  others: RadarMember[];
  onMoveMe: (pos: { x: number; y: number }) => void;
  compact?: boolean;
}

const clamp100 = (value: number) => Math.max(-100, Math.min(100, value));

// Even fallback positions around the radar for members without a saved position.
const fallbackPos = (index: number, total: number) => {
  const goldenAngle = 2.39996;
  const angle = index * goldenAngle + (total > 1 ? 0.8 : 0);
  const radius = total > 1 ? 58 : 0;
  return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
};

/** Kova Voice Radar — spatial position widget on the new design tokens. */
export const VoiceRadar: React.FC<VoiceRadarProps> = ({ me, others, onMoveMe, compact }) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const myPos = me.radarPos ?? { x: 0, y: 0 };

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !surfaceRef.current) return;
      const rect = surfaceRef.current.getBoundingClientRect();
      const x = clamp100(((event.clientX - rect.left) / rect.width) * 200 - 100);
      const y = clamp100(((event.clientY - rect.top) / rect.height) * 200 - 100);
      onMoveMe({ x, y });
    },
    [onMoveMe]
  );

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const endDrag = () => {
    draggingRef.current = false;
  };

  const size = compact ? 128 : 168;

  return (
    <div className="voice-enter w-fit shrink-0 select-none rounded-[22px] border border-white/[0.08] bg-[rgba(14,15,18,.85)] p-3 backdrop-blur-[16px]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a9faa]">
          <RadarIcon size={11} className="text-[#21ddb2]" />
          Radar de voz
        </span>
      </div>

      <div
        ref={surfaceRef}
        role="application"
        aria-label="Radar de voz — arrastra tu avatar para posicionarte"
        className="relative mx-auto cursor-crosshair overflow-hidden rounded-full border border-white/[0.08] bg-[radial-gradient(circle_at_center,rgba(33,221,178,.06),transparent_72%)]"
        style={{ width: size, height: size }}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        {/* Range rings */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-[18%] rounded-full border border-white/[0.05]" />
          <div className="absolute inset-[36%] rounded-full border border-white/[0.07]" />
          <div className="absolute bottom-1/2 left-1/2 top-0 w-px bg-white/[0.04]" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/[0.04]" />
        </div>

        {/* Others — tap to ping their real position */}
        {others.map((member, index) => {
          const pos = member.radarPos ?? fallbackPos(index, others.length);
          const left = 50 + pos.x / 2;
          const top = 50 + pos.y / 2;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => soundFx.playSpatialPing(pos.x, pos.y)}
              title={`Ping de ${member.name}`}
              aria-label={`Ping de ${member.name}`}
              className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <span
                className={`block rounded-full ring-2 transition-all duration-200 ${
                  member.isSpeaking
                    ? 'scale-110 ring-[#21ddb2] shadow-[0_0_12px_rgba(33,221,178,.5)]'
                    : 'ring-white/25 group-hover:ring-[#21ddb2]/70'
                }`}
              >
                {member.avatar ? (
                  <img src={member.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-bold text-[#9a9faa]">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {/* Me — draggable */}
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
          style={{ left: `${50 + myPos.x / 2}%`, top: `${50 + myPos.y / 2}%` }}
          onPointerDown={startDrag}
          onPointerUp={endDrag}
          title="Tu posición en la sala"
        >
          <span
            className={`block rounded-full ring-2 transition-all duration-200 ${
              me.isSpeaking ? 'scale-110 ring-white shadow-[0_0_12px_rgba(255,255,255,.5)]' : 'ring-white/60'
            }`}
          >
            {me.avatar ? (
              <img src={me.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#21ddb2] text-xs font-black text-[#05221a]">
                {me.name.charAt(0).toUpperCase()}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
