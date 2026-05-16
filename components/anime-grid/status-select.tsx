'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { UserStatus } from '@/types';
import { STATUS_META } from './constants';

interface StatusSelectProps {
  value: UserStatus;
  onChange: (status: UserStatus) => void;
}

export function StatusSelect({ value, onChange }: StatusSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = STATUS_META[value];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 8px',
          borderRadius: 6,
          background: s.soft,
          border: `1px solid ${s.soft}`,
          color: s.text,
          fontSize: 11,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: s.dot,
            flexShrink: 0,
          }}
        />
        {s.label}
        <ChevronDown size={10} style={{ opacity: 0.6, marginLeft: 1 }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            zIndex: 50,
            background: '#18181b',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 7,
            padding: 3,
            minWidth: 150,
            boxShadow: '0 12px 32px -8px rgba(0,0,0,.7)',
          }}
        >
          {(Object.entries(STATUS_META) as [UserStatus, typeof s][]).map(([key, st]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '6px 9px',
                borderRadius: 4,
                background: value === key ? 'rgba(255,255,255,.06)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11.5,
                color: st.text,
                fontFamily: 'inherit',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: st.dot }} />
              {st.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
