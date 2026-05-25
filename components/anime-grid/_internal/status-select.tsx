'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { COLORS, STATUS_LABELS } from '@/lib/constants';
import { STATUS_SOFT } from '@/lib/anime-constants';
import type { UserStatus } from '@/types';

export function StatusSelect({
  value,
  onChange,
}: {
  value: UserStatus;
  onChange: (s: UserStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  const meta = STATUS_SOFT[value];
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11px] font-medium"
        style={{
          background: meta.soft,
          borderColor: meta.soft,
          color: meta.text,
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: COLORS.status[value as keyof typeof COLORS.status],
          }}
        />
        {STATUS_LABELS[value]}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[150px] rounded-md border p-1"
          style={{
            background: '#18181b',
            borderColor: 'rgba(255,255,255,.1)',
            boxShadow: '0 12px 32px -8px rgba(0,0,0,.7)',
          }}
        >
          {(Object.entries(STATUS_LABELS) as [UserStatus, string][]).map(
            ([k, label]) => (
              <button
                key={k}
                onClick={() => {
                  onChange(k);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[11.5px] hover:bg-white/5"
                style={{
                  background:
                    value === k ? 'rgba(255,255,255,.06)' : 'transparent',
                  color: STATUS_SOFT[k].text,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background:
                      COLORS.status[k as keyof typeof COLORS.status],
                  }}
                />
                {label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
