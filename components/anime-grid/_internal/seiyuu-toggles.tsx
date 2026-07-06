'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { SEIYUUS, SEIYUU_IDS } from '@/lib/anime-constants';
import type { SeiyuuId } from '@/types';

/**
 * Toggle buttons to mark which tracked seiyuus (Koyasu / Hanazawa) appear in an
 * anime. One click toggles and saves immediately (handled by the parent), even
 * outside edit mode. Used both on the card (`compact`) and the detail modal
 * (`full`, with the seiyuu name).
 *
 * Because saving does a PUT + refetch, the `seiyuus` prop only updates once the
 * round-trip lands. To avoid the "nothing happened" feeling, a click flips the
 * icon optimistically and shows a spinner until the refetched prop confirms it.
 */
export function SeiyuuToggles({
  seiyuus,
  onToggle,
  variant = 'compact',
}: {
  seiyuus: SeiyuuId[];
  onToggle: (id: SeiyuuId) => void;
  variant?: 'compact' | 'full';
}) {
  const size = variant === 'full' ? 26 : 24;

  const [hovered, setHovered] = useState<SeiyuuId | null>(null);
  // The toggle we last kicked off and the state we expect afterwards.
  const [pending, setPending] = useState<{ id: SeiyuuId; expected: boolean } | null>(null);

  // Still in flight only while the incoming prop hasn't caught up to `expected`.
  // Derived during render (no state-sync effect) so it clears itself the moment
  // the refetched prop arrives.
  const inFlight =
    pending && seiyuus.includes(pending.id) !== pending.expected ? pending : null;

  // Safety net: if a save errors and the prop never updates, release the lock
  // so the spinner doesn't get stuck and clicks aren't blocked forever.
  useEffect(() => {
    if (!inFlight) return;
    const t = setTimeout(() => setPending(null), 8000);
    return () => clearTimeout(t);
  }, [inFlight]);

  const handleClick = (id: SeiyuuId) => {
    if (inFlight) return; // one save at a time (refetch touches the whole anime)
    setPending({ id, expected: !seiyuus.includes(id) });
    onToggle(id);
  };

  return (
    <div className="flex items-center gap-1.5">
      {SEIYUU_IDS.map((id) => {
        const s = SEIYUUS[id];
        const saving = inFlight?.id === id;
        // Show the optimistic state while its save is in flight.
        const active = saving ? inFlight.expected : seiyuus.includes(id);
        const disabled = inFlight !== null;
        const isHovered = hovered === id && !disabled;

        return (
          <button
            key={id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClick(id);
            }}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered((h) => (h === id ? null : h))}
            disabled={disabled}
            title={`${s.name}${active ? ' — aparece (clic para quitar)' : ' — marcar que aparece'}`}
            aria-pressed={active}
            aria-busy={saving}
            className="inline-flex items-center gap-1.5 rounded-full border"
            style={{
              padding: variant === 'full' ? '3px 10px 3px 3px' : 3,
              cursor: disabled ? 'default' : 'pointer',
              background: active
                ? `${s.color}${isHovered ? '33' : '22'}`
                : isHovered
                  ? 'rgba(255,255,255,.08)'
                  : 'rgba(10,10,12,.7)',
              borderColor: active
                ? `${s.color}${isHovered ? 'aa' : '88'}`
                : isHovered
                  ? 'rgba(255,255,255,.28)'
                  : 'rgba(255,255,255,.12)',
              transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              opacity: disabled && !saving ? 0.55 : 1,
              transition:
                'transform .18s cubic-bezier(.22,.61,.36,1), background .2s ease, border-color .2s ease, opacity .2s ease',
            }}
          >
            <span
              className="relative inline-flex overflow-hidden rounded-full"
              style={{ width: size, height: size }}
            >
              <img
                src={s.image}
                alt={s.name}
                width={size}
                height={size}
                className="rounded-full object-cover"
                style={{
                  width: size,
                  height: size,
                  boxShadow: active
                    ? `0 0 0 1.5px ${s.color}`
                    : 'inset 0 0 0 1px rgba(255,255,255,.14)',
                  filter: active ? 'none' : 'grayscale(1)',
                  opacity: active ? 1 : isHovered ? 0.8 : 0.5,
                  transition: 'filter .2s ease, opacity .2s ease',
                }}
                loading="lazy"
                draggable={false}
              />
              {saving && (
                <span
                  className="absolute inset-0 flex items-center justify-center rounded-full"
                  style={{ background: 'rgba(0,0,0,.55)' }}
                >
                  <Loader2
                    className="animate-spin"
                    style={{ width: size * 0.6, height: size * 0.6, color: s.color }}
                  />
                </span>
              )}
            </span>
            {variant === 'full' && (
              <span
                className="text-[12px] font-semibold"
                style={{ color: active ? s.color : 'rgba(255,255,255,.6)' }}
              >
                {s.short}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
