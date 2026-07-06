'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Pencil, Play, Star, Trash2 } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/constants';
import { ACCENT, DAY_LABELS, STATUS_SOFT, USERS } from '@/lib/anime-constants';
import { toJKAnimeSlug, upgradeMalImage } from '@/lib/utils';
import { useLowPowerMode } from '@/hooks/use-low-power-mode';
import { PaginatedEpisodeGrid, nextUnwatched } from './episode-grid';
import { Avatar } from './_internal/avatar';
import { ProgressBar } from './_internal/progress-bar';
import { DayPicker } from './_internal/day-picker';
import { StatusSelect } from './_internal/status-select';
import { SeiyuuToggles } from './_internal/seiyuu-toggles';
import type { Anime, SeiyuuId, User, UserStatus } from '@/types';

function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 360;
}

function CoverPlaceholder({
  seed,
  short,
}: {
  seed: string;
  short: string;
}) {
  const h1 = hashHue(seed);
  const h2 = (h1 + 35) % 360;
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(155deg, oklch(0.45 0.18 ${h1}), oklch(0.22 0.08 ${h2}))`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,.18), transparent 55%),
                       radial-gradient(80% 60% at 80% 90%, rgba(0,0,0,.4), transparent 60%)`,
        }}
      />
      <div
        className="absolute left-2 right-2 bottom-2 line-clamp-2 text-base font-bold leading-tight text-white/90"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,.6)' }}
      >
        {short}
      </div>
    </div>
  );
}

interface EditMenuProps {
  episodes: number;
  onEpisodesChange: (n: number) => void;
  onDelete: () => void;
}

function EditMenu({ episodes, onEpisodesChange, onDelete }: EditMenuProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(episodes));

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      setEditing(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex h-[26px] w-[26px] items-center justify-center rounded-md border text-sm leading-none text-white"
        style={{
          background: 'rgba(10,10,12,.78)',
          borderColor: 'rgba(255,255,255,.1)',
        }}
        aria-label="Más opciones"
      >
        ⋯
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border p-1"
          style={{
            background: '#18181b',
            borderColor: 'rgba(255,255,255,.1)',
            boxShadow: '0 12px 32px -8px rgba(0,0,0,.7)',
          }}
        >
          {!editing ? (
            <button
              onClick={() => {
                setV(String(episodes));
                setEditing(true);
              }}
              className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs text-white/85 hover:bg-white/5"
            >
              <Pencil className="h-3 w-3 opacity-70" />
              Cambiar episodios ({episodes})
            </button>
          ) : (
            <div className="flex gap-1.5 p-1.5">
              <input
                type="number"
                value={v}
                onChange={(e) => setV(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onEpisodesChange(parseInt(v, 10) || 1);
                    setOpen(false);
                  }
                  if (e.key === 'Escape') setEditing(false);
                }}
                autoFocus
                className="w-full flex-1 rounded border bg-white/[.06] px-2 py-1 text-xs text-white outline-none"
                style={{ borderColor: 'rgba(255,255,255,.12)' }}
              />
              <button
                onClick={() => {
                  onEpisodesChange(parseInt(v, 10) || 1);
                  setOpen(false);
                }}
                className="rounded px-2.5 py-1 text-[11px] font-semibold text-white"
                style={{ background: ACCENT }}
              >
                OK
              </button>
            </div>
          )}
          <div className="my-1 h-px bg-white/5" />
          <button
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-3 w-3" /> Eliminar anime
          </button>
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  status,
  watched,
  max,
  nextEp,
  editMode,
  onStatusChange,
  onMarkNext,
}: {
  user: User;
  status: UserStatus;
  watched: number;
  max: number;
  /** First gap in the watched set, or null when fully caught up. */
  nextEp: number | null;
  editMode: boolean;
  onStatusChange: (s: UserStatus) => void;
  onMarkNext: () => void;
}) {
  const u = USERS[user];
  const meta = STATUS_SOFT[status];
  const dim = ['pendiente', 'dropeado', 'ni_en_un_millon'].includes(status);
  const canMarkNext = status === 'viendo' && nextEp != null;

  return (
    <div className="flex items-center gap-2.5">
      <Avatar user={user} size={22} />
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <div className="flex items-center justify-between gap-1.5">
          {editMode ? (
            <StatusSelect value={status} onChange={onStatusChange} />
          ) : (
            <span className="text-xs font-medium" style={{ color: meta.text }}>
              {STATUS_LABELS[status]}
            </span>
          )}
          <span
            className="text-[11px]"
            style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}
          >
            <span
              style={{
                color: watched > 0 ? u.color : 'rgba(255,255,255,.4)',
                fontWeight: 600,
              }}
            >
              {watched}
            </span>
            <span style={{ color: 'rgba(255,255,255,.3)' }}>/{max}</span>
          </span>
        </div>
        <ProgressBar value={watched} max={max} color={u.color} dim={dim} />
      </div>
      {canMarkNext && !editMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkNext();
          }}
          title={`Marcar ep ${nextEp}`}
          className="cg-next-btn inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold leading-none"
          style={{
            background: `${u.color}22`,
            color: u.color,
            borderColor: `${u.color}44`,
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            transition:
              'transform .15s ease, background .2s ease, box-shadow .2s ease',
            ['--cg-user' as never]: u.color,
          }}
        >
          +{nextEp}
        </button>
      )}
    </div>
  );
}

interface AnimeCardProps {
  anime: Anime;
  editMode: boolean;
  ezeStatus: UserStatus;
  panchoStatus: UserStatus;
  ezeEpisodes: number[];
  panchoEpisodes: number[];
  displayMax: number;
  seiyuus: SeiyuuId[];
  onSeiyuuToggle: (id: SeiyuuId) => void;
  onOpenDetail: () => void;
  onEpisodeToggle: (user: User, ep: number, done: boolean) => void;
  onStatusChange: (user: User, s: UserStatus) => void;
  onDayChange: (day: string) => void;
  onEpisodesChange: (n: number) => void;
  onMarkNext: (user: User) => void;
  onDelete: () => void;
}

export function AnimeCard({
  anime,
  editMode,
  ezeStatus,
  panchoStatus,
  ezeEpisodes,
  panchoEpisodes,
  displayMax,
  seiyuus,
  onSeiyuuToggle,
  onOpenDetail,
  onEpisodeToggle,
  onStatusChange,
  onDayChange,
  onEpisodesChange,
  onMarkNext,
  onDelete,
}: AnimeCardProps) {
  const [hovering, setHovering] = useState(false);
  const lowPower = useLowPowerMode();

  const ezeWatchedSet = new Set(ezeEpisodes);
  const panchoWatchedSet = new Set(panchoEpisodes);
  const ezeWatchedCount = ezeEpisodes.length;
  const panchoWatchedCount = panchoEpisodes.length;
  const ezeNext = nextUnwatched(ezeWatchedSet, displayMax);
  const panchoNext = nextUnwatched(panchoWatchedSet, displayMax);

  const synced =
    ezeWatchedCount === panchoWatchedCount &&
    ezeStatus === 'viendo' &&
    panchoStatus === 'viendo' &&
    ezeWatchedCount > 0;

  const dayLabel =
    anime.day && DAY_LABELS[anime.day] ? DAY_LABELS[anime.day].short : '—';

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="relative flex flex-col overflow-hidden rounded-2xl border"
      style={{
        background: 'rgba(255,255,255,.025)',
        borderColor: hovering ? `${ACCENT}44` : 'rgba(255,255,255,.06)',
        transition:
          'border-color .2s ease, transform .25s cubic-bezier(.22,.61,.36,1)',
        transform: hovering ? 'translateY(-3px)' : 'none',
        boxShadow: hovering
          ? `0 22px 44px -20px rgba(0,0,0,.75), 0 0 0 1px ${ACCENT}33`
          : '0 4px 12px -6px rgba(0,0,0,.3)',
      }}
    >
      <div
        className="relative cursor-pointer overflow-hidden"
        style={{ aspectRatio: '3 / 4' }}
        onClick={onOpenDetail}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: hovering && !lowPower ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform .55s cubic-bezier(.22,.61,.36,1)',
          }}
        >
          {anime.imageUrl ? (
            <img
              src={upgradeMalImage(anime.imageUrl)}
              alt={anime.title}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          ) : (
            <CoverPlaceholder seed={anime.id} short={anime.title} />
          )}
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,.12) 28%, rgba(0,0,0,.7) 58%, rgba(0,0,0,.95) 82%, #000 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0"
          style={{
            height: '38%',
            background:
              'linear-gradient(to top, #0a0a0c 0%, rgba(10,10,12,.85) 30%, rgba(10,10,12,.55) 60%, transparent 100%)',
          }}
        />

        {hovering && !lowPower && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute bottom-0 top-0"
              style={{
                width: '40%',
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)',
                animation: 'cgShine 1.1s ease-out',
              }}
            />
          </div>
        )}

        <div className="absolute left-2.5 right-2.5 top-2.5 flex items-start justify-between gap-2">
          {editMode ? (
            <DayPicker value={anime.day} onChange={onDayChange} />
          ) : (
            <span
              className="rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.6px] text-white/90"
              style={{
                background: 'rgba(10,10,12,.78)',
                borderColor: 'rgba(255,255,255,.1)',
              }}
            >
              {dayLabel}
            </span>
          )}

          <div className="flex items-center gap-1.5">
            {anime.score ? (
              <span
                className="inline-flex items-center gap-[3px] rounded-md border px-2 py-1 text-[11px] font-bold text-amber-300"
                style={{
                  background: 'rgba(10,10,12,.78)',
                  borderColor: 'rgba(255,255,255,.1)',
                }}
              >
                <Star className="h-2.5 w-2.5 fill-amber-300" />
                {anime.score.toFixed(1)}
              </span>
            ) : null}
            {editMode && (
              <EditMenu
                episodes={anime.episodes || 1}
                onEpisodesChange={onEpisodesChange}
                onDelete={onDelete}
              />
            )}
          </div>
        </div>

        {synced && !editMode && (
          <div
            className="absolute left-2.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.4px] text-emerald-300"
            style={{
              top: 44,
              background: 'rgba(20,40,28,.85)',
              borderColor: 'rgba(34,197,94,.4)',
              animation: 'cgFadeUp .35s cubic-bezier(.22,.61,.36,1) both',
            }}
          >
            <span
              className="h-[5px] w-[5px] rounded-full bg-emerald-500"
              style={{
                animation: 'cgStatusPulse 1.8s ease-in-out infinite',
                ['--pulse-color' as never]: 'rgba(34,197,94,.4)',
              }}
            />
            Sync
          </div>
        )}

        <div className="absolute bottom-2.5 left-3 right-3">
          <div className="mb-2">
            <SeiyuuToggles seiyuus={seiyuus} onToggle={onSeiyuuToggle} />
          </div>
          <div
            className="line-clamp-2 text-[15px] font-bold leading-[1.15] tracking-[-0.2px] text-white"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,.6)' }}
          >
            {anime.title}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/60">
            <span
              style={{
                fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
              }}
            >
              {anime.episodes || '?'} eps
            </span>
            <a
              href={anime.jikanUrl ?? `https://myanimelist.net/anime/${anime.malId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-[3px] rounded-[3px] px-1 py-[1px] text-[10px] text-white/55 hover:text-indigo-300"
            >
              <ExternalLink className="h-[9px] w-[9px]" /> MAL
            </a>
            <a
              href={`https://jkanime.net/${toJKAnimeSlug(anime.title)}/`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-[3px] rounded-[3px] px-1 py-[1px] text-[10px] text-white/55 hover:text-emerald-300"
              title="Ver en JKAnime"
            >
              <Play className="h-[9px] w-[9px]" /> JK
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-3.5 pb-3.5 pt-3">
        <UserRow
          user="eze"
          status={ezeStatus}
          watched={ezeWatchedCount}
          max={displayMax}
          nextEp={ezeNext}
          editMode={editMode}
          onStatusChange={(s) => onStatusChange('eze', s)}
          onMarkNext={() => onMarkNext('eze')}
        />
        <UserRow
          user="pancho"
          status={panchoStatus}
          watched={panchoWatchedCount}
          max={displayMax}
          nextEp={panchoNext}
          editMode={editMode}
          onStatusChange={(s) => onStatusChange('pancho', s)}
          onMarkNext={() => onMarkNext('pancho')}
        />
      </div>

      {editMode && (
        <div
          className="-mt-0.5 flex flex-col gap-2.5 border-t border-white/5 px-3.5 pb-3.5 pt-3"
        >
          {(['eze', 'pancho'] as User[]).map((u) => (
            <div key={u} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[9.5px] font-semibold uppercase tracking-[1px] text-white/40">
                  {USERS[u].name}
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <PaginatedEpisodeGrid
                watchedSet={u === 'eze' ? ezeWatchedSet : panchoWatchedSet}
                max={displayMax}
                color={USERS[u].color}
                editMode={editMode}
                onToggle={(ep, done) => onEpisodeToggle(u, ep, done)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
