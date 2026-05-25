'use client';

import type { CSSProperties, ReactNode } from 'react';

export function Chip({
  children,
  fs,
  px,
  py,
  style,
}: {
  children: ReactNode;
  fs: number;
  px: number;
  py: number;
  style?: CSSProperties;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-bold uppercase tracking-[0.4px] text-white/90"
      style={{
        padding: `${py}px ${px}px`,
        fontSize: fs,
        background: 'rgba(10,10,12,.78)',
        borderColor: 'rgba(255,255,255,.12)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/45">
        {title}
      </div>
      {children}
    </div>
  );
}
