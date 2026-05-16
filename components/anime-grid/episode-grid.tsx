'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 24;

/**
 * Highest N such that episodes 1..N are all in `watchedSet`. Stops at the first
 * gap, so for `{1,2,4}` it returns 2 (meaning "next to watch" is 3, not 5).
 */
export function consecutive(watchedSet: Set<number>, max: number): number {
  let c = 0;
  for (let i = 1; i <= max; i++) {
    if (watchedSet.has(i)) c = i;
    else break;
  }
  return c;
}

/** First unwatched ep starting from 1, or `null` if all are watched up to `max`. */
export function nextUnwatched(
  watchedSet: Set<number>,
  max: number,
): number | null {
  const c = consecutive(watchedSet, max);
  const n = c + 1;
  return n <= max ? n : null;
}

interface PipGridProps {
  watchedSet: Set<number>;
  max: number;
  color: string;
  editMode: boolean;
  onToggle: (ep: number, nextDone: boolean) => void;
  start?: number;
  end?: number;
}

function PipGrid({
  watchedSet,
  max,
  color,
  editMode,
  onToggle,
  start = 1,
  end,
}: PipGridProps) {
  const [popping, setPopping] = useState<number | null>(null);
  const handleClick = (ep: number, done: boolean) => {
    onToggle(ep, !done);
    setPopping(ep);
    setTimeout(() => setPopping(null), 350);
  };
  const safeMax = Math.max(max, 1);
  const nextEp = consecutive(watchedSet, safeMax) + 1;
  const last = Math.min(end ?? safeMax, safeMax);

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(22px, 1fr))' }}
    >
      {Array.from({ length: Math.max(0, last - start + 1) }, (_, i) => {
        const ep = start + i;
        const done = watchedSet.has(ep);
        const isNext = ep === nextEp;
        const isPopping = popping === ep;
        return (
          <button
            key={ep}
            disabled={!editMode}
            onClick={(e) => {
              e.stopPropagation();
              if (editMode) handleClick(ep, done);
            }}
            title={
              editMode ? `${done ? 'Desmarcar' : 'Marcar'} ep ${ep}` : `Ep ${ep}`
            }
            className="relative text-[10px] font-bold"
            style={{
              height: 22,
              minWidth: 22,
              borderRadius: 5,
              border: isNext && editMode ? `1px dashed ${color}88` : 'none',
              background: done
                ? color
                : isNext && editMode
                ? `${color}15`
                : 'rgba(255,255,255,.05)',
              color: done ? '#0a0a0b' : 'rgba(255,255,255,.4)',
              fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
              cursor: editMode ? 'pointer' : 'default',
              boxShadow: done
                ? `inset 0 -1px 0 rgba(0,0,0,.2), 0 1px 0 ${color}40`
                : 'none',
              transition:
                'background .25s ease, color .25s ease, transform .12s ease',
              animation: isPopping
                ? 'cgPipPop .35s cubic-bezier(.22,.61,.36,1)'
                : 'none',
            }}
          >
            {ep}
            {isPopping && done && (
              <span
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(circle, ${color}88, transparent 60%)`,
                  borderRadius: 5,
                  animation: 'cgSparkle .45s ease-out forwards',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface PaginatedEpisodeGridProps {
  watchedSet: Set<number>;
  max: number;
  color: string;
  editMode: boolean;
  onToggle: (ep: number, nextDone: boolean) => void;
  /** Page size override; defaults to 24. */
  pageSize?: number;
}

export function PaginatedEpisodeGrid({
  watchedSet,
  max,
  color,
  editMode,
  onToggle,
  pageSize = PAGE_SIZE,
}: PaginatedEpisodeGridProps) {
  const safeMax = Math.max(max, 1);
  const totalPages = Math.max(1, Math.ceil(safeMax / pageSize));

  // Default page: the one containing the next-to-watch ep.
  const initialPage = useMemo(() => {
    const next = consecutive(watchedSet, safeMax) + 1;
    return Math.min(totalPages - 1, Math.max(0, Math.floor((next - 1) / pageSize)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeMax, pageSize, totalPages]);

  const [page, setPage] = useState(initialPage);

  // Clamp when total shrinks (eg. user reduces maxEpisodes).
  useEffect(() => {
    if (page > totalPages - 1) setPage(totalPages - 1);
  }, [page, totalPages]);

  const start = page * pageSize + 1;
  const end = Math.min(start + pageSize - 1, safeMax);

  if (safeMax <= pageSize) {
    return (
      <PipGrid
        watchedSet={watchedSet}
        max={safeMax}
        color={color}
        editMode={editMode}
        onToggle={onToggle}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <PipGrid
        watchedSet={watchedSet}
        max={safeMax}
        color={color}
        editMode={editMode}
        onToggle={onToggle}
        start={start}
        end={end}
      />
      <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-white/45">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPage((p) => Math.max(0, p - 1));
          }}
          disabled={page === 0}
          className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-white/70 disabled:opacity-30"
          style={{
            background: 'rgba(255,255,255,.03)',
            borderColor: 'rgba(255,255,255,.08)',
          }}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
        <span
          className="flex-1 text-center"
          style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}
        >
          {start}–{end} <span className="opacity-50">/ {safeMax}</span>
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPage((p) => Math.min(totalPages - 1, p + 1));
          }}
          disabled={page >= totalPages - 1}
          className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-white/70 disabled:opacity-30"
          style={{
            background: 'rgba(255,255,255,.03)',
            borderColor: 'rgba(255,255,255,.08)',
          }}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
