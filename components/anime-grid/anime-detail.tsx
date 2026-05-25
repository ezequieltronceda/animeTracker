'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Check,
  ExternalLink,
  Play,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { STATUS_LABELS } from '@/lib/constants';
import { ACCENT, DAY_LABELS, STATUS_SOFT, USERS } from '@/lib/anime-constants';
import { toJKAnimeSlug, upgradeMalImage } from '@/lib/utils';
import { useLowPowerMode } from '@/hooks/use-low-power-mode';
import type { Anime, User, UserStatus } from '@/types';
import { PaginatedEpisodeGrid, nextUnwatched } from './episode-grid';
import { Avatar } from './_internal/avatar';
import { ProgressBar } from './_internal/progress-bar';
import { DayPicker as DayPickerInline } from './_internal/day-picker';
import { StatusSelect } from './_internal/status-select';
import { Chip, Section } from './_internal/chip';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);

interface AnimeDetailProps {
  anime: Anime;
  onClose: () => void;
  editMode: boolean;
  ezeStatus: UserStatus;
  panchoStatus: UserStatus;
  ezeEpisodes: number[];
  panchoEpisodes: number[];
  displayMax: number;
  onEpisodeToggle: (user: User, ep: number, done: boolean) => void;
  onStatusChange: (user: User, s: UserStatus) => void;
  onDayChange: (day: string) => void;
  onEpisodesChange: (n: number) => void;
  onMarkNext: (user: User) => void;
  onDelete: () => void;
}

export function AnimeDetail({
  anime,
  onClose,
  editMode,
  ezeStatus,
  panchoStatus,
  ezeEpisodes,
  panchoEpisodes,
  displayMax,
  onEpisodeToggle,
  onStatusChange,
  onDayChange,
  onEpisodesChange,
  onMarkNext,
  onDelete,
}: AnimeDetailProps) {
  const [scrollY, setScrollY] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const lowPower = useLowPowerMode();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevOverflowRef = useRef<string>('');
  const scrollRafRef = useRef(0);

  // rAF-throttled scroll handler: coalesce multiple wheel/scroll events into a
  // single React re-render per frame. Without this, FF can fire dozens of
  // scroll events between paints, each triggering a full dialog re-render with
  // ~15 recomputed lerp values.
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = 0;
      setScrollY(target.scrollTop);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  // Mount flag for SSR-safe portal.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    prevOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflowRef.current;
    };
  }, []);

  // Snappy close: release body scroll + disable pointer events the moment the
  // user requests close, even though framer-motion holds the exit animation.
  const requestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    document.body.style.overflow = prevOverflowRef.current;
    onClose();
  }, [isClosing, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

  useEffect(() => {
    // Reset scroll + transient UI state when the selected anime changes.
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScrollY(0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfirmDelete(false);
  }, [anime.id]);

  const progress = easeOut(Math.min(1, scrollY / 320));
  const heroH = lerp(isMobile ? 220 : 280, isMobile ? 92 : 108, progress);
  const coverW = lerp(isMobile ? 100 : 150, isMobile ? 50 : 60, progress);
  const coverH = lerp(isMobile ? 144 : 216, isMobile ? 72 : 86, progress);
  const coverMB = lerp(isMobile ? -24 : -40, 0, progress);
  const coverR = lerp(10, 6, progress);
  const titleSize = lerp(isMobile ? 20 : 26, isMobile ? 14 : 16, progress);
  const titleSubSize = lerp(isMobile ? 11 : 13, isMobile ? 9 : 10.5, progress);
  const chipFS = lerp(isMobile ? 10 : 11.5, isMobile ? 8.5 : 9.5, progress);
  const chipPX = lerp(isMobile ? 8 : 10, isMobile ? 6 : 7, progress);
  const chipPY = lerp(3, 2.5, progress);
  const chipsMB = lerp(8, 6, progress);
  const heroPB = lerp(isMobile ? 14 : 22, isMobile ? 10 : 12, progress);
  const heroGap = lerp(isMobile ? 12 : 22, isMobile ? 10 : 14, progress);
  const bodyPadTop = lerp(isMobile ? 36 : 64, 16, progress);
  const heroPX = isMobile ? 14 : 28;
  const titleRightPad = isMobile ? 56 : 88;

  const ezeWatchedSet = new Set(ezeEpisodes);
  const panchoWatchedSet = new Set(panchoEpisodes);
  const ezeCount = ezeEpisodes.length;
  const panchoCount = panchoEpisodes.length;
  const synced =
    ezeCount === panchoCount &&
    ezeStatus === 'viendo' &&
    panchoStatus === 'viendo' &&
    ezeCount > 0;

  const dayMeta = anime.day ? DAY_LABELS[anime.day] : null;
  const malUrl =
    anime.jikanUrl ?? `https://myanimelist.net/anime/${anime.malId}`;
  const jkUrl = `https://jkanime.net/${toJKAnimeSlug(anime.title)}/`;

  if (!mounted) return null;

  const dialogNode = (
    <motion.div
      onClick={requestClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6"
      style={{
        background: 'rgba(0,0,0,.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        pointerEvents: isClosing ? 'none' : 'auto',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[1040px] flex-col overflow-hidden rounded-xl border sm:rounded-2xl"
        style={{
          maxHeight: isMobile ? 'calc(100vh - 16px)' : 'calc(100vh - 48px)',
          background: '#0f0f12',
          borderColor: 'rgba(255,255,255,.08)',
          boxShadow:
            '0 40px 80px -24px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.02)',
          transformOrigin: 'center',
        }}
        initial={
          lowPower
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.82, rotate: -6 }
        }
        animate={
          lowPower
            ? { opacity: 1 }
            : { opacity: 1, scale: 1, rotate: 0 }
        }
        exit={
          lowPower ? { opacity: 0 } : { opacity: 0, scale: 0.9, rotate: 4 }
        }
        transition={
          lowPower
            ? { duration: 0.18 }
            : { type: 'spring', stiffness: 260, damping: 26, mass: 0.7 }
        }
      >
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-auto"
        >
          {/* HERO */}
          <div
            className="sticky top-0 z-[5]"
            style={{ height: heroH, overflow: 'visible' }}
          >
            <div className="absolute inset-0 overflow-hidden">
              {anime.imageUrl ? (
                // No filter:blur here — re-blurring during the dialog's spring
                // open animation is one of FF's worst-case paint loops. Instead
                // we darken the upscaled image heavily; visually you still get
                // the "cover bleeding through the hero" feel.
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(rgba(15,15,18,.55), rgba(15,15,18,.85)), url(${upgradeMalImage(anime.imageUrl)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: 'scale(1.08)',
                  }}
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(145deg, #2a2a2e, #15151a)',
                  }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(120% 80% at 30% 10%, rgba(255,255,255,.18), transparent 60%)',
                  opacity: 1 - progress * 0.6,
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(15,15,18,.4) 60%, #0f0f12)',
                  opacity: 1 - progress * 0.3,
                }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                  background: 'rgba(255,255,255,.06)',
                  opacity: progress,
                }}
              />
            </div>

            <div className="absolute right-3.5 top-3 z-[3] flex gap-2">
              {editMode && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Eliminar anime"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border text-rose-300"
                  style={{
                    background: 'rgba(0,0,0,.5)',
                    borderColor: 'rgba(255,255,255,.1)',
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={requestClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-white/85"
                style={{
                  background: 'rgba(0,0,0,.5)',
                  borderColor: 'rgba(255,255,255,.1)',
                }}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              className="absolute bottom-0 left-0 right-0 z-[2] flex items-end"
              style={{
                gap: heroGap,
                padding: `0 ${heroPX}px ${heroPB}px`,
              }}
            >
              <div
                className="flex-shrink-0 overflow-hidden"
                style={{
                  width: coverW,
                  height: coverH,
                  marginBottom: coverMB,
                  borderRadius: coverR,
                  boxShadow:
                    '0 12px 32px -8px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.06)',
                }}
              >
                {anime.imageUrl ? (
                  <img
                    src={upgradeMalImage(anime.imageUrl)}
                    alt={anime.title}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background:
                        'linear-gradient(155deg, #3a3a40, #1a1a1f)',
                    }}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div
                  className="flex flex-wrap items-center gap-1.5"
                  style={{ marginBottom: chipsMB }}
                >
                  {editMode ? (
                    <DayPickerInline
                      variant="inline"
                      value={anime.day}
                      onChange={onDayChange}
                      fs={chipFS}
                      px={chipPX}
                      py={chipPY}
                    />
                  ) : (
                    <Chip fs={chipFS} px={chipPX} py={chipPY}>
                      {dayMeta?.full ?? '—'}
                    </Chip>
                  )}
                  {anime.score && (
                    <Chip
                      fs={chipFS}
                      px={chipPX}
                      py={chipPY}
                      style={{ color: '#fbbf24' }}
                    >
                      <Star
                        className="fill-amber-300"
                        style={{ width: chipFS - 1.5, height: chipFS - 1.5 }}
                      />
                      {anime.score.toFixed(1)}
                    </Chip>
                  )}
                  <Chip
                    fs={chipFS}
                    px={chipPX}
                    py={chipPY}
                    style={{
                      color: 'rgba(255,255,255,.7)',
                      fontFamily:
                        'var(--font-geist-mono), ui-monospace, monospace',
                    }}
                  >
                    {anime.episodes || displayMax} eps
                  </Chip>
                  {synced && (
                    <Chip
                      fs={chipFS}
                      px={chipPX}
                      py={chipPY}
                      style={{
                        background: 'rgba(34,197,94,.22)',
                        borderColor: 'rgba(34,197,94,.4)',
                        color: '#86efac',
                      }}
                    >
                      <span
                        className="inline-block h-[5px] w-[5px] rounded-full bg-emerald-500"
                      />
                      Sincronizados
                    </Chip>
                  )}
                </div>
                <h2
                  className="m-0 line-clamp-2 font-bold leading-[1.15] tracking-[-0.5px] text-white"
                  style={{
                    fontSize: titleSize,
                    textShadow: '0 2px 8px rgba(0,0,0,.45)',
                    paddingRight: titleRightPad,
                  }}
                >
                  {anime.title}
                </h2>
                {anime.titleJp && (
                  <div
                    className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-white/55"
                    style={{
                      fontSize: titleSubSize,
                      fontFamily:
                        'var(--font-geist-mono), ui-monospace, monospace',
                      paddingRight: 12,
                    }}
                  >
                    {anime.titleJp}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BODY */}
          <div
            className="grid gap-5 px-4 pb-6 sm:gap-7 sm:px-7 sm:pb-7 md:grid-cols-[240px_1fr]"
            style={{ paddingTop: bodyPadTop }}
          >
            <div className="flex flex-col gap-[18px]">
              <Section title="Géneros">
                {anime.genres && anime.genres.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {anime.genres.map((g) => (
                      <span
                        key={g}
                        className="rounded-full border px-2.5 py-1 text-[11.5px] font-medium"
                        style={{
                          background: `${ACCENT}15`,
                          borderColor: `${ACCENT}30`,
                          color: `color-mix(in oklch, ${ACCENT} 80%, #fff)`,
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                ) : (
                  <EmptyHint />
                )}
              </Section>

              <Section title="Enlaces">
                <div className="flex flex-col gap-1.5">
                  <a
                    href={malUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-white/80 transition-all hover:text-indigo-300"
                    style={{
                      background: 'rgba(255,255,255,.03)',
                      borderColor: 'rgba(255,255,255,.06)',
                    }}
                  >
                    <ExternalLink className="h-3 w-3" /> MyAnimeList
                  </a>
                  <a
                    href={jkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-white/80 transition-all hover:text-emerald-300"
                    style={{
                      background: 'rgba(255,255,255,.03)',
                      borderColor: 'rgba(255,255,255,.06)',
                    }}
                  >
                    <Play className="h-3 w-3" /> JKAnime
                  </a>
                </div>
              </Section>

              {editMode && (
                <Section title="Configuración">
                  <EpisodesEditor
                    value={displayMax}
                    onChange={onEpisodesChange}
                  />
                </Section>
              )}
            </div>

            <div className="flex flex-col gap-[22px]">
              <Section title="Sinopsis">
                {anime.synopsis ? (
                  <p
                    className="m-0 text-[13.5px] leading-[1.6] text-white/70"
                    style={{ textWrap: 'pretty' as never }}
                  >
                    {anime.synopsis}
                  </p>
                ) : (
                  <EmptyHint />
                )}
              </Section>

              <div className="grid gap-3.5 md:grid-cols-2">
                <UserDetailPanel
                  user="eze"
                  status={ezeStatus}
                  watchedSet={ezeWatchedSet}
                  watchedCount={ezeCount}
                  max={displayMax}
                  editMode={editMode}
                  onStatusChange={(s) => onStatusChange('eze', s)}
                  onMarkNext={() => onMarkNext('eze')}
                  onEpisodeToggle={(ep, done) =>
                    onEpisodeToggle('eze', ep, done)
                  }
                />
                <UserDetailPanel
                  user="pancho"
                  status={panchoStatus}
                  watchedSet={panchoWatchedSet}
                  watchedCount={panchoCount}
                  max={displayMax}
                  editMode={editMode}
                  onStatusChange={(s) => onStatusChange('pancho', s)}
                  onMarkNext={() => onMarkNext('pancho')}
                  onEpisodeToggle={(ep, done) =>
                    onEpisodeToggle('pancho', ep, done)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {confirmDelete && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDelete(false);
          }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-6"
          style={{
            background: 'rgba(0,0,0,.6)',
            animation: 'cgFadeIn .15s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[380px] max-w-full rounded-2xl border p-5"
            style={{
              background: '#16161a',
              borderColor: 'rgba(255,255,255,.1)',
              boxShadow: '0 30px 60px -20px rgba(0,0,0,.8)',
              animation: 'cgFadeScale .2s ease both',
            }}
          >
            <h3 className="m-0 mb-2 text-[15px] font-semibold text-zinc-50">
              Eliminar anime
            </h3>
            <p className="m-0 mb-4 text-[13px] leading-relaxed text-white/65">
              ¿Eliminar &quot;{anime.title}&quot;? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border px-3.5 py-2 text-xs text-white/70"
                style={{
                  background: 'transparent',
                  borderColor: 'rgba(255,255,255,.08)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                  requestClose();
                }}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
                style={{
                  background: 'linear-gradient(180deg, #ef4444, #b91c1c)',
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  return createPortal(dialogNode, document.body);
}

function EmptyHint() {
  return (
    <p className="m-0 text-[12px] italic leading-[1.55] text-white/35">
      Sin datos. Apretá <span className="font-semibold text-white/55">↻ Actualizar</span> en el header para descargar desde MyAnimeList.
    </p>
  );
}

function UserDetailPanel({
  user,
  status,
  watchedSet,
  watchedCount,
  max,
  editMode,
  onStatusChange,
  onMarkNext,
  onEpisodeToggle,
}: {
  user: User;
  status: UserStatus;
  watchedSet: Set<number>;
  watchedCount: number;
  max: number;
  editMode: boolean;
  onStatusChange: (s: UserStatus) => void;
  onMarkNext: () => void;
  onEpisodeToggle: (ep: number, done: boolean) => void;
}) {
  const u = USERS[user];
  const meta = STATUS_SOFT[status];
  const dim = ['pendiente', 'dropeado', 'ni_en_un_millon'].includes(status);
  const nextEp = nextUnwatched(watchedSet, max);
  const canMarkNext = status === 'viendo' && nextEp != null;

  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl border p-3.5"
      style={{
        background: 'rgba(255,255,255,.025)',
        borderColor: 'rgba(255,255,255,.06)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <Avatar user={user} size={30} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold tracking-[-0.1px] text-zinc-50">
            {u.name}
          </div>
          <div className="mt-0.5">
            {editMode ? (
              <StatusSelect value={status} onChange={onStatusChange} />
            ) : (
              <span
                className="text-[11.5px] font-medium"
                style={{ color: meta.text }}
              >
                {STATUS_LABELS[status]}
              </span>
            )}
          </div>
        </div>
        <div className="text-right leading-[1.1]">
          <div
            className="text-base font-bold"
            style={{
              color: u.color,
              fontFamily:
                'var(--font-geist-mono), ui-monospace, monospace',
            }}
          >
            {watchedCount}
            <span className="font-medium text-white/30">/{max}</span>
          </div>
          <div className="mt-0.5 text-[10px] text-white/40">episodios</div>
        </div>
      </div>

      <ProgressBar
        value={watchedCount}
        max={max}
        color={u.color}
        dim={dim}
        height={5}
      />

      {canMarkNext && !editMode && (
        <button
          onClick={onMarkNext}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
          style={{
            background: `${u.color}22`,
            color: u.color,
            borderColor: `${u.color}44`,
          }}
        >
          <Check className="h-3 w-3" /> Marcar episodio {nextEp}
        </button>
      )}

      <PaginatedEpisodeGrid
        watchedSet={watchedSet}
        max={max}
        color={u.color}
        editMode={editMode}
        onToggle={onEpisodeToggle}
      />
    </div>
  );
}

function EpisodesEditor({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [v, setV] = useState(String(value));
  useEffect(() => {
    setV(String(value));
  }, [value]);
  return (
    <div className="flex items-center gap-2">
      <label className="flex-1 text-xs text-white/65">Total episodios</label>
      <input
        type="number"
        min={1}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const n = parseInt(v, 10);
          if (n > 0 && n !== value) onChange(n);
          else setV(String(value));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="w-[70px] rounded-md border px-2 py-1 text-right text-xs text-zinc-50 outline-none"
        style={{
          background: 'rgba(255,255,255,.05)',
          borderColor: 'rgba(255,255,255,.08)',
          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
        }}
      />
    </div>
  );
}
