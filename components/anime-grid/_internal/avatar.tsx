'use client';

import { USERS } from '@/lib/anime-constants';
import type { User } from '@/types';

export function Avatar({ user, size = 22 }: { user: User; size?: number }) {
  const u = USERS[user];
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: `linear-gradient(135deg, ${u.color}, color-mix(in oklch, ${u.color} 60%, #000))`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
        fontWeight: 700,
        color: '#0a0a0b',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)',
        flexShrink: 0,
      }}
    >
      {u.initial}
    </span>
  );
}
