'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { formatSeasonName } from '@/lib/constants';
import { useLowPowerMode } from '@/hooks/use-low-power-mode';
import { ACCENT } from '@/lib/anime-constants';
import type { Anime, Season } from '@/types';

function AnimNumber({ value, duration = 600 }: { value: number; duration?: number }) {
  const lowPower = useLowPowerMode();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number>(0);
  const targetRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    if (value === targetRef.current) return;
    if (lowPower) {
      // Snap to the target instead of rAF-tweening; saves continuous re-renders
      // on modest machines.
      targetRef.current = value;
      setDisplay(value);
      return;
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, lowPower]);

  return <span style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', color: '#fafafa', fontWeight: 600 }}>{Math.round(display)}</span>;
}

function Stat({ label, value, dotColor }: { label: string; value: number; dotColor?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {dotColor && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: dotColor }}
        />
      )}
      <AnimNumber value={value} />
      <span className="opacity-80">{label}</span>
    </span>
  );
}

interface SectionHeaderProps {
  season: Season | null;
  animes: Anime[];
  savedFlash: boolean;
}

export function SectionHeader({ season, animes, savedFlash }: SectionHeaderProps) {
  const stats = (() => {
    const total = animes.length;
    const watching = animes.filter(
      (a) => a.users.eze.status === 'viendo' || a.users.pancho.status === 'viendo',
    ).length;
    const finished = animes.filter(
      (a) => a.users.eze.status === 'terminado' && a.users.pancho.status === 'terminado',
    ).length;
    const epsThisWeek = animes
      .filter((a) => a.users.eze.status === 'viendo' || a.users.pancho.status === 'viendo')
      .reduce((s, a) => {
        const ezeW = a.users.eze.episodesWatched.length;
        const panW = a.users.pancho.episodesWatched.length;
        const eps = a.episodes || Math.max(ezeW, panW);
        return s + Math.max(0, eps - Math.min(ezeW, panW));
      }, 0);
    return { total, watching, finished, epsThisWeek };
  })();

  return (
    <div className="relative z-[1] flex flex-wrap items-end justify-between gap-4 px-4 pb-3.5 pt-5 lg:px-6">
      <div
        key={`hdr-${season?.id ?? 'none'}`}
        style={{ animation: 'cgFadeUp .4s ease both' }}
      >
        <h2 className="m-0 text-[22px] font-bold leading-tight tracking-[-0.5px] text-zinc-50">
          {season ? formatSeasonName(season.name) : 'Sin temporada'}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-3.5 text-[12.5px] text-white/50">
          <Stat label="animes" value={stats.total} />
          <span className="opacity-30">·</span>
          <Stat label="en curso" value={stats.watching} dotColor="#22c55e" />
          <span className="opacity-30">·</span>
          <Stat label="terminados" value={stats.finished} dotColor={ACCENT} />
          {stats.watching > 0 && (
            <>
              <span className="opacity-30">·</span>
              <span className="text-white/70">
                ~<AnimNumber value={stats.epsThisWeek} /> <span className="opacity-80">eps pendientes</span>
              </span>
            </>
          )}
        </div>
      </div>

      {savedFlash && (
        <div
          className="inline-flex items-center gap-1.5 rounded-full border px-[11px] py-[5px] text-[11px] font-semibold"
          style={{
            background: 'rgba(34,197,94,.15)',
            borderColor: 'rgba(34,197,94,.35)',
            color: '#86efac',
            animation: 'cgFadeIn .2s ease',
          }}
        >
          <Check className="h-3 w-3" /> Cambios guardados
        </div>
      )}
    </div>
  );
}
