'use client';

import { useEffect, useState } from 'react';

interface NavigatorWithExtras extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

/**
 * Returns true on machines we suspect are too modest to handle the full
 * design effects. Heuristics — any one triggers degraded mode:
 *  - <= 4 hardware threads
 *  - <= 4 GB device memory (Firefox 116+, Chrome since forever; absent in Safari)
 *  - User has prefers-reduced-motion enabled
 *  - User has Save-Data enabled
 *
 * Returns false during SSR + initial paint so we don't flash the degraded
 * look on capable machines. Reconciles in the first useEffect.
 */
export function useLowPowerMode(): boolean {
  const [low, setLow] = useState(false);

  useEffect(() => {
    const nav = navigator as NavigatorWithExtras;
    const cores = nav.hardwareConcurrency ?? 8;
    const mem = nav.deviceMemory ?? 8;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const saveData = nav.connection?.saveData === true;
    const next = cores <= 4 || mem <= 4 || reducedMotion || saveData;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLow(next);

    // Keep in sync if the user toggles reduced-motion mid-session.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      const nextNow =
        cores <= 4 || mem <= 4 || mq.matches || nav.connection?.saveData === true;
      setLow(nextNow);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return low;
}
