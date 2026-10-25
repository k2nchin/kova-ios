import React, { useEffect, useRef } from 'react';
import type { Track } from 'livekit-client';

/** Renders a LiveKit video track (camera or screen), local or remote. */
export const VideoTrackView: React.FC<{ track: Track; mirror?: boolean; fit?: 'cover' | 'contain'; className?: string }> = ({
  track,
  mirror,
  fit = 'cover',
  className,
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    track.attach(element);
    return () => { track.detach(element); };
  }, [track]);
  return (
    <video
      ref={ref}
      className={className}
      autoPlay
      playsInline
      muted
      style={{ width: '100%', height: '100%', objectFit: fit, transform: mirror ? 'scaleX(-1)' : undefined }}
    />
  );
};
