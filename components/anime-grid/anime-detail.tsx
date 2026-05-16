'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ExternalLink,
  Play,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { COLORS, DAYS, STATUS_LABELS } from '@/lib/constants';
import { toJKAnimeSlug, upgradeMalImage } from '@/lib/utils';
import type { Anime, User, UserStatus } from '@/types';
import { PaginatedEpisodeGrid } from './episode-grid';

const ACCENT = '#6366f1';

const USERS = {
  eze: { name: 'Eze', initial: 'E', color: '#22c55e' },
  pancho: { name: 'Pancho', initial: 'P', color: '#a78bfa' },
} as const;

const DAY_LABELS: Record<string, { short: string; full: string }> = {
  lunes: { short: 'Lun', full: 'Lunes' },
  martes: { short: 'Mar', full: 'Martes' },
  miercoles: { short: 'Mié', full: 'Miércoles' },
  jueves: { short: 'Jue', full: 'Jueves' },
  viernes: { short: 'Vie', full: 'Viernes' },
  sabado: { short: 'Sáb', full: 'Sábado' },
  domingo: { short: 'Dom', full: 'Domingo' },
};

const STATUS_SOFT: Record<UserStatus, { soft: string; text: string }> = {
  viendo: { soft: 'rgba(34,197,94,.12)', text: '#86efac' },
  en_pausa: { soft: 'rgba(234,179,8,.12)', text: '#fde68a' },
  terminado: { soft: 'rgba(99,102,241,.14)', text: '#a5b4fc' },
  pendiente: { soft: 'rgba(113,113,122,.16)', text: '#a1a1aa' },
  dropeado: { soft: 'rgba(239,68,68,.12)', text: '#fca5a5' },
  ni_en_un_millon: { soft: 'rgba(82,82,91,.16)', text: '#71717a' },
};

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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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

  return (
    <motion.div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6"
      style={{
        background: 'rgba(0,0,0,.7)',
        backdropFilter: 'blur(8px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
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
        initial={{ opacity: 0, scale: 0.78, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.85, rotate: 6 }}
        transition={{ type: 'spring', stiffness: 210, damping: 24 }}
      >
        <div
          ref={scrollRef}
          onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}
          className="relative flex-1 overflow-auto"
        >
          {/* HERO */}
          <div
            className="sticky top-0 z-[5]"
            style={{ height: heroH, overflow: 'visible' }}
          >
            <div className="absolute inset-0 overflow-hidden">
              {anime.imageUrl ? (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${upgradeMalImage(anime.imageUrl)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: 'scale(1.15)',
                    filter: 'blur(20px) saturate(1.1)',
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
                onClick={onClose}
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
              <motion.div
                layoutId={`anime-cover-${anime.id}`}
                className="flex-shrink-0 overflow-hidden"
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
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
              </motion.div>

              <div className="min-w-0 flex-1 pb-1">
                <div
                  className="flex flex-wrap items-center gap-1.5"
                  style={{ marginBottom: chipsMB }}
                >
                  {editMode ? (
                    <DayPickerInline
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
                  onClose();
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
}

function Chip({
  children,
  fs,
  px,
  py,
  style,
}: {
  children: React.ReactNode;
  fs: number;
  px: number;
  py: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-bold uppercase tracking-[0.4px] text-white/90 backdrop-blur-sm"
      style={{
        padding: `${py}px ${px}px`,
        fontSize: fs,
        background: 'rgba(0,0,0,.5)',
        borderColor: 'rgba(255,255,255,.12)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/45">
        {title}
      </div>
      {children}
    </div>
  );
}

function EmptyHint() {
  return (
    <p className="m-0 text-[12px] italic leading-[1.55] text-white/35">
      Sin datos. Apretá <span className="font-semibold text-white/55">↻ Actualizar</span> en el header para descargar desde MyAnimeList.
    </p>
  );
}

function Avatar({ user }: { user: User }) {
  const u = USERS[user];
  return (
    <span
      className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#0a0a0b]"
      style={{
        background: `linear-gradient(135deg, ${u.color}, color-mix(in oklch, ${u.color} 60%, #000))`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)',
      }}
    >
      {u.initial}
    </span>
  );
}

function ProgressBar({
  value,
  max,
  color,
  dim,
}: {
  value: number;
  max: number;
  color: string;
  dim: boolean;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/[.07]">
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: dim ? 'rgba(255,255,255,.18)' : color,
          transition:
            'width .55s cubic-bezier(.22,.61,.36,1), background .25s ease',
          boxShadow: dim ? 'none' : `0 0 8px ${color}55`,
        }}
      />
    </div>
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
  const canMarkNext = status === 'viendo' && watchedCount < max;

  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl border p-3.5"
      style={{
        background: 'rgba(255,255,255,.025)',
        borderColor: 'rgba(255,255,255,.06)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <Avatar user={user} />
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
          <Check className="h-3 w-3" /> Marcar episodio {watchedCount + 1}
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

function DayPickerInline({
  value,
  onChange,
  fs,
  px,
  py,
}: {
  value?: string;
  onChange: (day: string) => void;
  fs: number;
  px: number;
  py: number;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);
  const label = value && DAY_LABELS[value] ? DAY_LABELS[value].full : '—';
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-[0.4px] text-white/90 backdrop-blur-sm"
        style={{
          padding: `${py}px ${px}px`,
          fontSize: fs,
          background: 'rgba(0,0,0,.5)',
          borderStyle: 'dashed',
          borderColor: `${ACCENT}88`,
        }}
      >
        {label}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-[60] mt-1 min-w-[140px] rounded-lg border p-1"
          style={{
            background: '#18181b',
            borderColor: 'rgba(255,255,255,.1)',
            boxShadow: '0 12px 32px -8px rgba(0,0,0,.7)',
            animation: 'cgFadeScale .18s ease both',
            transformOrigin: 'top left',
          }}
        >
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => {
                onChange(d);
                setOpen(false);
              }}
              className="block w-full rounded px-2.5 py-1.5 text-left text-xs capitalize text-white/85 hover:bg-white/5"
              style={{
                background: value === d ? 'rgba(255,255,255,.06)' : 'transparent',
              }}
            >
              {DAY_LABELS[d].full}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: UserStatus;
  onChange: (s: UserStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);
  const meta = STATUS_SOFT[value];
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[11px] font-medium"
        style={{
          background: meta.soft,
          borderColor: meta.soft,
          color: meta.text,
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: COLORS.status[value as keyof typeof COLORS.status] }}
        />
        {STATUS_LABELS[value]}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-[60] mt-1 min-w-[150px] rounded-md border p-1"
          style={{
            background: '#18181b',
            borderColor: 'rgba(255,255,255,.1)',
            boxShadow: '0 12px 32px -8px rgba(0,0,0,.7)',
          }}
        >
          {(Object.entries(STATUS_LABELS) as [UserStatus, string][]).map(
            ([k, label]) => (
              <button
                key={k}
                onClick={() => {
                  onChange(k);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[11.5px] hover:bg-white/5"
                style={{
                  background:
                    value === k ? 'rgba(255,255,255,.06)' : 'transparent',
                  color: STATUS_SOFT[k].text,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background:
                      COLORS.status[k as keyof typeof COLORS.status],
                  }}
                />
                {label}
              </button>
            ),
          )}
        </div>
      )}
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
