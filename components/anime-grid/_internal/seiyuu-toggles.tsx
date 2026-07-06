'use client';

import { SEIYUUS, SEIYUU_IDS } from '@/lib/anime-constants';
import type { SeiyuuId } from '@/types';

/**
 * Toggle buttons to mark which tracked seiyuus (Koyasu / Hanazawa) appear in an
 * anime. One click toggles and saves immediately (handled by the parent), even
 * outside edit mode. Used both on the card (`compact`) and the detail modal
 * (`full`, with the seiyuu name).
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

  return (
    <div className="flex items-center gap-1.5">
      {SEIYUU_IDS.map((id) => {
        const s = SEIYUUS[id];
        const active = seiyuus.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(id);
            }}
            title={`${s.name}${active ? ' — aparece (clic para quitar)' : ' — marcar que aparece'}`}
            aria-pressed={active}
            className="inline-flex items-center gap-1.5 rounded-full border transition-all"
            style={{
              padding: variant === 'full' ? '3px 10px 3px 3px' : 3,
              background: active ? `${s.color}22` : 'rgba(10,10,12,.7)',
              borderColor: active ? `${s.color}88` : 'rgba(255,255,255,.12)',
            }}
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
                opacity: active ? 1 : 0.5,
                transition: 'filter .2s ease, opacity .2s ease',
              }}
              loading="lazy"
              draggable={false}
            />
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
