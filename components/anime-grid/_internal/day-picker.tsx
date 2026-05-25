'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DAYS } from '@/lib/constants';
import { ACCENT, DAY_LABELS } from '@/lib/anime-constants';

/**
 * Inline day picker used on the card cover (compact, short label) and on the
 * detail dialog hero (full label, sized via fs/px/py overrides).
 */
export function DayPicker({
  value,
  onChange,
  variant = 'compact',
  fs,
  px,
  py,
}: {
  value?: string;
  onChange: (day: string) => void;
  variant?: 'compact' | 'inline';
  fs?: number;
  px?: number;
  py?: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  const meta = value ? DAY_LABELS[value] : undefined;
  const label =
    variant === 'compact' ? meta?.short ?? '—' : meta?.full ?? '—';

  const sizeStyle =
    variant === 'inline'
      ? {
          padding: `${py ?? 3}px ${px ?? 10}px`,
          fontSize: fs ?? 11.5,
          borderRadius: 999,
        }
      : { padding: '4px 9px', fontSize: 10, borderRadius: 6 };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.6px] text-white/90 border"
        style={{
          ...sizeStyle,
          background: 'rgba(10,10,12,.78)',
          borderStyle: 'dashed',
          borderColor: `${ACCENT}88`,
        }}
      >
        {label}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border p-1"
          style={{
            background: '#18181b',
            borderColor: 'rgba(255,255,255,.1)',
            boxShadow: '0 12px 32px -8px rgba(0,0,0,.7)',
          }}
        >
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => {
                onChange(d);
                setOpen(false);
              }}
              className="block w-full rounded px-2.5 py-1.5 text-left text-xs capitalize text-white/85 hover:bg-white/5"
              style={{
                background:
                  value === d ? 'rgba(255,255,255,.06)' : 'transparent',
              }}
            >
              {DAY_LABELS[d].full}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
