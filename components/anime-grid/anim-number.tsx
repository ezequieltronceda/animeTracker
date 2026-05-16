'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';

interface AnimNumberProps {
  value: number;
  duration?: number;
  style?: CSSProperties;
}

export function AnimNumber({ value, duration = 600, style }: AnimNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(0);
  const targetRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    if (value === targetRef.current) return;
    fromRef.current = display;
    targetRef.current = value;
    startRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = fromRef.current + (targetRef.current - fromRef.current) * eased;
      setDisplay(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration, display]);

  return <span style={style}>{Math.round(display)}</span>;
}
