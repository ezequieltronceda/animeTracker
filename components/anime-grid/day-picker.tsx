'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DAYS_FULL } from './constants';

interface DayPickerProps {
  value?: string;
  onChange: (day: string) => void;
  accent: string;
}

export function DayPicker({ value, onChange, accent }: DayPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  const day = DAYS_FULL.find((d) => d.id === value);

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '4px 9px',
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 700,
          background: 'rgba(0,0,0,.55)',
          backdropFilter: 'blur(8px)',
          border: `1px dashed ${accent}88`,
          color: 'rgba(255,255,255,.9)',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: 'inherit',
        }}
      >
        {day?.short || '—'}
        <ChevronDown size={10} style={{ opacity: 0.6 }} />
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
            minWidth: 130,
            boxShadow: '0 12px 32px -8px rgba(0,0,0,.7)',
          }}
        >
          {DAYS_FULL.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                onChange(d.id);
                setOpen(false);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '6px 9px',
                borderRadius: 4,
                background: value === d.id ? 'rgba(255,255,255,.06)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 11.5,
                color: 'rgba(255,255,255,.85)',
                textTransform: 'capitalize',
                fontFamily: 'inherit',
              }}
            >
              {d.full}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
