'use client';

import { useEffect, useState } from 'react';
import { useLowPowerMode } from '@/hooks/use-low-power-mode';
import { ACCENT } from '@/lib/anime-constants';

export function AmbientBackground() {
  // Pause the drifting blobs while the tab is in the background. Firefox
  // doesn't throttle background-tab CSS animations as aggressively as Chrome,
  // and these are the most expensive elements on the page (large blurred
  // layers under continuous transform animations).
  const [paused, setPaused] = useState(false);
  const lowPower = useLowPowerMode();

  useEffect(() => {
    const sync = () => setPaused(document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  const playState = paused ? 'paused' : 'running';

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute rounded-full"
        style={{
          top: '-15%',
          left: '-10%',
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${ACCENT}33, transparent 60%)`,
          filter: `blur(${lowPower ? 24 : 40}px)`,
          animation: lowPower ? 'none' : 'cgDrift1 22s ease-in-out infinite',
          animationPlayState: playState,
          willChange: lowPower ? 'auto' : 'transform',
          transform: 'translateZ(0)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: '-20%',
          right: '-10%',
          width: 700,
          height: 700,
          background: `radial-gradient(circle, color-mix(in oklch, ${ACCENT} 60%, #ec4899)22, transparent 60%)`,
          filter: `blur(${lowPower ? 24 : 50}px)`,
          animation: lowPower ? 'none' : 'cgDrift2 28s ease-in-out infinite',
          animationPlayState: playState,
          willChange: lowPower ? 'auto' : 'transform',
          transform: 'translateZ(0)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.04), transparent 60%)',
        }}
      />
    </div>
  );
}
