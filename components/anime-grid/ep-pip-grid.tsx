'use client';

import { useState } from 'react';

interface EpPipGridProps {
  episodes: number[];
  max: number;
  color: string;
  editMode: boolean;
  onToggle: (ep: number) => void;
}

export function EpPipGrid({ episodes, max, color, editMode, onToggle }: EpPipGridProps) {
  const [popping, setPopping] = useState<number | null>(null);
  const watchedSet = new Set(episodes);
  const nextEp = (() => {
    for (let i = 1; i <= max; i++) if (!watchedSet.has(i)) return i;
    return null;
  })();

  const handleClick = (ep: number) => {
    if (!editMode) return;
    onToggle(ep);
    setPopping(ep);
    setTimeout(() => setPopping(null), 350);
  };

  const limit = Math.min(max, 100);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(22px, 1fr))',
        gap: 4,
      }}
    >
      {Array.from({ length: limit }, (_, i) => {
        const ep = i + 1;
        const done = watchedSet.has(ep);
        const isNext = ep === nextEp;
        const isPopping = popping === ep;
        return (
          <button
            key={ep}
            type="button"
            disabled={!editMode}
            onClick={(e) => {
              e.stopPropagation();
              handleClick(ep);
            }}
            title={editMode ? `${done ? 'Desmarcar' : 'Marcar'} ep ${ep}` : `Ep ${ep}`}
            style={{
              height: 22,
              minWidth: 22,
              borderRadius: 5,
              border: isNext && editMode ? `1px dashed ${color}88` : 'none',
              background: done ? color : isNext && editMode ? `${color}15` : 'rgba(255,255,255,.05)',
              color: done ? '#0a0a0b' : 'rgba(255,255,255,.4)',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'var(--font-mono), ui-monospace, monospace',
              cursor: editMode ? 'pointer' : 'default',
              boxShadow: done ? `inset 0 -1px 0 rgba(0,0,0,.2), 0 1px 0 ${color}40` : 'none',
              transition: 'background .25s ease, color .25s ease, transform .12s ease',
              animation: isPopping ? 'cgPipPop .35s cubic-bezier(.22,.61,.36,1)' : 'none',
              position: 'relative',
            }}
          >
            {ep}
            {isPopping && done && (
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background: `radial-gradient(circle, ${color}88, transparent 60%)`,
                  borderRadius: 5,
                  animation: 'cgSparkle .45s ease-out forwards',
                }}
              />
            )}
          </button>
        );
      })}
      {max > limit && (
        <span
          style={{
            gridColumn: '1 / -1',
            fontSize: 10,
            color: 'rgba(255,255,255,.4)',
            fontFamily: 'var(--font-mono), ui-monospace, monospace',
          }}
        >
          +{max - limit} más
        </span>
      )}
    </div>
  );
}
