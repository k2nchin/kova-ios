import React from 'react';
import { motion } from 'framer-motion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface ActivityPingProps {
  text: string;
  time: string;
  signal?: boolean;
  className?: string;
}

/**
 * Ambient human activity living inside a composition (never a browser toast).
 */
export const ActivityPing: React.FC<ActivityPingProps> = ({ text, time, signal = true, className }) => (
  <motion.div
    className={`flex items-center gap-2.5 rounded-full border border-[rgba(244,246,243,.08)] bg-[rgba(9,11,13,.72)] px-3.5 py-2 ${className ?? ''}`}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.55, ease: EASE }}
  >
    {signal && (
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #F4F6F3 0%, #EDF1F5 55%, #9AA3AE 100%)',
          boxShadow: '0 0 6px rgba(201,209,218,.7)',
        }}
      />
    )}
    <p className="text-[11.5px] leading-tight text-[rgba(244,246,243,.78)]">{text}</p>
    <span className="text-[10px] text-[rgba(244,246,243,.38)]">{time}</span>
  </motion.div>
);
