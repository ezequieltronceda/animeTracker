'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { AnimeCard } from './anime-card';
import { AnimeDetail } from './anime-detail';
import { SectionHeader } from './section-header';
import { nextUnwatched } from './episode-grid';
import { useLowPowerMode } from '@/hooks/use-low-power-mode';
import { ACCENT } from '@/lib/anime-constants';
import type { Anime, Season, SeiyuuId, User, UserStatus } from '@/types';

interface PendingChanges {
  episodesWatched?: { [user in User]?: number[] };
  maxEpisodes?: number;
  status?: { [user in User]?: UserStatus };
  day?: string;
  seiyuus?: SeiyuuId[];
}

interface AnimeGridProps {
  animes: Anime[];
  season: Season | null;
  otherSeasons: Season[];
  onSaveChanges: (animeId: string, seasonId: string, changes: PendingChanges) => void;
  onDeleteAnime: (anime: Anime) => void;
  onCarryOver: (anime: Anime, targetSeasonId: string) => void;
  onAddAnime: () => void;
  savedFlash: boolean;
}

export function AnimeGrid({
  animes,
  season,
  otherSeasons,
  onSaveChanges,
  onDeleteAnime,
  onCarryOver,
  onAddAnime,
  savedFlash,
}: AnimeGridProps) {
  const {
    searchQuery,
    dayFilter,
    editMode,
    pendingChanges,
    setPendingChanges,
  } = useUIStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedAnimeId = searchParams.get('anime');
  const pushedHistoryRef = useRef(false);
  const lowPower = useLowPowerMode();

  const openDetail = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('anime', id);
      pushedHistoryRef.current = true;
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const closeDetail = useCallback(() => {
    if (pushedHistoryRef.current) {
      pushedHistoryRef.current = false;
      router.back();
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('anime');
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : '?', { scroll: false });
    }
  }, [router, searchParams]);

  useEffect(() => {
    // Close any open detail dialog when the season switches.
    if (selectedAnimeId) closeDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season?.id]);

  useEffect(() => {
    const hasChanges = Object.keys(pendingChanges).length > 0;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingChanges]);

  const getDisplayMax = useCallback(
    (anime: Anime): number => {
      const pending = pendingChanges[anime.id];
      const maxOverride =
        pending?.maxEpisodes !== undefined ? pending.maxEpisodes : anime.maxEpisodes;
      const official = anime.episodes || 0;
      const fromWatched = Math.max(
        anime.users.eze.episodesWatched.length
          ? Math.max(...anime.users.eze.episodesWatched)
          : 0,
        anime.users.pancho.episodesWatched.length
          ? Math.max(...anime.users.pancho.episodesWatched)
          : 0,
      );
      const result = Math.max(maxOverride ?? 0, official, fromWatched);
      return result > 0 ? result : 1;
    },
    [pendingChanges],
  );

  const getLocalStatus = useCallback(
    (anime: Anime, user: User): UserStatus => {
      return pendingChanges[anime.id]?.status?.[user] ?? anime.users[user].status;
    },
    [pendingChanges],
  );

  const getLocalEpisodes = useCallback(
    (anime: Anime, user: User): number[] => {
      const pending = pendingChanges[anime.id];
      const displayMax = getDisplayMax(anime);
      const episodes =
        pending?.episodesWatched?.[user] !== undefined
          ? pending.episodesWatched[user]!
          : anime.users[user].episodesWatched;
      return episodes.filter((e) => e <= displayMax);
    },
    [pendingChanges, getDisplayMax],
  );

  const filtered = useMemo(() => {
    if (!Array.isArray(animes) || animes.length === 0) return [];
    let result = [...animes];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.title?.toLowerCase().includes(q));
    }
    if (dayFilter) result = result.filter((a) => a.day === dayFilter);
    return result.sort((a, b) => a.order - b.order);
  }, [animes, searchQuery, dayFilter]);

  const handleEpisodeToggle = useCallback(
    (anime: Anime, user: User, ep: number, nextDone: boolean) => {
      if (!editMode) return;
      const current = getLocalEpisodes(anime, user);
      const newEps = nextDone
        ? [...current.filter((e) => e !== ep), ep].sort((a, b) => a - b)
        : current.filter((e) => e !== ep);
      const existing = pendingChanges[anime.id] || {};
      setPendingChanges(anime.id, {
        ...existing,
        episodesWatched: { ...existing.episodesWatched, [user]: newEps },
      });
    },
    [editMode, getLocalEpisodes, pendingChanges, setPendingChanges],
  );

  const handleMarkNext = useCallback(
    (anime: Anime, user: User) => {
      // Quick-mark works even outside edit mode and saves immediately. "Next"
      // is the first gap in the watched set, not `length + 1` — for [1,2,4]
      // we want to mark 3, not 5 (which doesn't exist) or 4 (already watched).
      const current = getLocalEpisodes(anime, user);
      const displayMax = getDisplayMax(anime);
      const next = nextUnwatched(new Set(current), displayMax);
      if (next == null) return;
      const newEps = [...current, next].sort((a, b) => a - b);
      onSaveChanges(anime.id, anime.seasonId, {
        episodesWatched: { [user]: newEps },
      });
    },
    [getLocalEpisodes, getDisplayMax, onSaveChanges],
  );

  const handleStatusChange = useCallback(
    (anime: Anime, user: User, status: UserStatus) => {
      if (!editMode) return;
      const displayMax = getDisplayMax(anime);
      let episodesWatched: number[] | undefined;
      if (status === 'terminado') {
        episodesWatched = Array.from({ length: displayMax }, (_, i) => i + 1);
      } else if (status === 'pendiente' || status === 'dropeado') {
        episodesWatched = [];
      }
      const existing = pendingChanges[anime.id] || {};
      setPendingChanges(anime.id, {
        ...existing,
        status: { ...existing.status, [user]: status },
        ...(episodesWatched !== undefined && {
          episodesWatched: {
            ...existing.episodesWatched,
            [user]: episodesWatched,
          },
        }),
      });
    },
    [editMode, getDisplayMax, pendingChanges, setPendingChanges],
  );

  const handleDayChange = useCallback(
    (anime: Anime, day: string) => {
      if (!editMode) return;
      const existing = pendingChanges[anime.id] || {};
      setPendingChanges(anime.id, { ...existing, day });
    },
    [editMode, pendingChanges, setPendingChanges],
  );

  const handleSeiyuuToggle = useCallback(
    (anime: Anime, id: SeiyuuId) => {
      // Quick-mark works even outside edit mode and saves immediately, like the
      // "mark next episode" button — no pending-changes staging.
      const current = anime.seiyuus ?? [];
      const next = current.includes(id)
        ? current.filter((s) => s !== id)
        : [...current, id];
      onSaveChanges(anime.id, anime.seasonId, { seiyuus: next });
    },
    [onSaveChanges],
  );

  const handleEpisodesChange = useCallback(
    (anime: Anime, n: number) => {
      if (!editMode) return;
      const ezeFiltered = getLocalEpisodes(anime, 'eze').filter((e) => e <= n);
      const panchoFiltered = getLocalEpisodes(anime, 'pancho').filter((e) => e <= n);
      const existing = pendingChanges[anime.id] || {};
      setPendingChanges(anime.id, {
        ...existing,
        maxEpisodes: n,
        episodesWatched: {
          ...existing.episodesWatched,
          eze: ezeFiltered,
          pancho: panchoFiltered,
        },
      });
    },
    [editMode, getLocalEpisodes, pendingChanges, setPendingChanges],
  );

  const selectedAnime = useMemo(
    () => animes.find((a) => a.id === selectedAnimeId) ?? null,
    [animes, selectedAnimeId],
  );

  return (
    <>
      <SectionHeader season={season} animes={animes} savedFlash={savedFlash} />

      <div className="relative z-[1] flex-1 px-4 pb-24 lg:px-6">
        {filtered.length === 0 ? (
          <EmptyState
            hasFilters={!!(searchQuery || dayFilter)}
            onAddAnime={onAddAnime}
          />
        ) : (
          <div
            key={`grid-${season?.id ?? 'none'}-${dayFilter ?? 'all'}`}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            style={
              lowPower
                ? {
                    animation: 'cgFadeIn .2s ease both',
                  }
                : undefined
            }
          >
            {filtered.map((a, i) => (
              <div
                key={a.id}
                style={
                  lowPower
                    ? undefined
                    : {
                        animation:
                          'cgCardIn .5s cubic-bezier(.22,.61,.36,1) both',
                        animationDelay: `${Math.min(i * 45, 600)}ms`,
                      }
                }
              >
                <AnimeCard
                  anime={a}
                  editMode={editMode}
                  ezeStatus={getLocalStatus(a, 'eze')}
                  panchoStatus={getLocalStatus(a, 'pancho')}
                  ezeEpisodes={getLocalEpisodes(a, 'eze')}
                  panchoEpisodes={getLocalEpisodes(a, 'pancho')}
                  displayMax={getDisplayMax(a)}
                  seiyuus={a.seiyuus ?? []}
                  onSeiyuuToggle={(id) => handleSeiyuuToggle(a, id)}
                  onOpenDetail={() => openDetail(a.id)}
                  onEpisodeToggle={(u, ep, done) =>
                    handleEpisodeToggle(a, u, ep, done)
                  }
                  onStatusChange={(u, s) => handleStatusChange(a, u, s)}
                  onDayChange={(d) => handleDayChange(a, d)}
                  onEpisodesChange={(n) => handleEpisodesChange(a, n)}
                  onMarkNext={(u) => handleMarkNext(a, u)}
                  onDelete={() => onDeleteAnime(a)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAnime && (
          <AnimeDetail
            key={selectedAnime.id}
            anime={selectedAnime}
            onClose={closeDetail}
            editMode={editMode}
            ezeStatus={getLocalStatus(selectedAnime, 'eze')}
            panchoStatus={getLocalStatus(selectedAnime, 'pancho')}
            ezeEpisodes={getLocalEpisodes(selectedAnime, 'eze')}
            panchoEpisodes={getLocalEpisodes(selectedAnime, 'pancho')}
            displayMax={getDisplayMax(selectedAnime)}
            seiyuus={selectedAnime.seiyuus ?? []}
            onSeiyuuToggle={(id) => handleSeiyuuToggle(selectedAnime, id)}
            onEpisodeToggle={(u, ep, done) =>
              handleEpisodeToggle(selectedAnime, u, ep, done)
            }
            onStatusChange={(u, s) => handleStatusChange(selectedAnime, u, s)}
            onDayChange={(d) => handleDayChange(selectedAnime, d)}
            onEpisodesChange={(n) => handleEpisodesChange(selectedAnime, n)}
            onMarkNext={(u) => handleMarkNext(selectedAnime, u)}
            onDelete={() => onDeleteAnime(selectedAnime)}
            otherSeasons={otherSeasons}
            onCarryOver={(targetSeasonId) =>
              onCarryOver(selectedAnime, targetSeasonId)
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState({
  hasFilters,
  onAddAnime,
}: {
  hasFilters: boolean;
  onAddAnime: () => void;
}) {
  const { setSearchQuery, setDayFilter } = useUIStore();
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center text-white/45">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl border"
        style={{
          background: 'rgba(255,255,255,.04)',
          borderColor: 'rgba(255,255,255,.06)',
        }}
      >
        <Sparkles className="h-6 w-6" style={{ color: ACCENT, opacity: 0.8 }} />
      </div>
      <div>
        <div className="text-base font-semibold text-white/85">
          {hasFilters ? 'Nada con esos filtros' : 'Temporada vacía'}
        </div>
        <div className="mt-1 text-[13px]">
          {hasFilters
            ? 'Probá limpiar la búsqueda o el día.'
            : 'Agregá tu primer anime de la temporada.'}
        </div>
      </div>
      {hasFilters ? (
        <button
          onClick={() => {
            setSearchQuery('');
            setDayFilter(null);
          }}
          className="mt-1.5 rounded-lg border px-3.5 py-2 text-xs text-white/85"
          style={{
            borderColor: 'rgba(255,255,255,.1)',
            background: 'rgba(255,255,255,.04)',
          }}
        >
          Limpiar filtros
        </button>
      ) : (
        <button
          onClick={onAddAnime}
          className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{
            background: `linear-gradient(180deg, ${ACCENT}, color-mix(in oklch, ${ACCENT} 70%, #000))`,
          }}
        >
          <Plus className="h-3 w-3" /> Agregar anime
        </button>
      )}
    </div>
  );
}
