'use client';

import type { Anime } from '@/types';
import { hashHue } from './constants';

interface CoverProps {
  anime: Anime;
  className?: string;
}

export function Cover({ anime, className }: CoverProps) {
  if (anime.imageUrl) {
    return (
      <div
        className={className}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${anime.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    );
  }

  const h1 = hashHue(anime.id);
  const h2 = (h1 + 35) % 360;
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(155deg, oklch(0.45 0.18 ${h1}), oklch(0.22 0.08 ${h2}))`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,.18), transparent 55%), radial-gradient(80% 60% at 80% 90%, rgba(0,0,0,.4), transparent 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          right: 14,
          fontWeight: 700,
          fontSize: 22,
          color: 'rgba(255,255,255,.92)',
          lineHeight: 1.05,
          textShadow: '0 1px 2px rgba(0,0,0,.6)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {anime.title}
      </div>
    </div>
  );
}
