'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import type { Anime, User, UserStatus } from '@/types';
import { AmbientBackground } from './ambient-background';
import { AnimeCard } from './anime-card';
import { AnimNumber } from './anim-number';
import { ACCENT } from './constants';

interface PendingChanges {
  episodesWatched?: { [user in User]?: number[] };
  maxEpisodes?: number;
  status?: { [user in User]?: UserStatus };
  day?: string;
}

interface AnimeGridProps {
  animes: Anime[];
  seasonLabel: string;
  onSaveChanges?: (animeId: string, seasonId: string, changes: PendingChanges) => void;
  onDeleteAnime: (anime: Anime) => void;
  onAddAnime: () => void;
  columns?: 3 | 4 | 5;
  showPipsAlways?: boolean;
}

export function AnimeGrid({
  animes,
  seasonLabel,
  onDeleteAnime,
  onAddAnime,
  columns = 4,
  showPipsAlways = false,
}: AnimeGridProps) {
  const {
    searchQuery,
    dayFilter,
    editMode,
    pendingChanges,
    setPendingChanges,
    setSearchQuery,
    setDayFilter,
  } = useUIStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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

  const getMaxEpisode = useCallback(
    (anime: Anime, user: User): number => {
      const pending = pendingChanges[anime.id];
      if (pending?.maxEpisodes !== undefined) return pending.maxEpisodes;
      if (anime.maxEpisodes !== undefined) return anime.maxEpisodes;
      const watched = anime.users[user].episodesWatched;
      return watched.length > 0 ? Math.max(...watched) : 0;
    },
    [pendingChanges],
  );

  const getDisplayMax = useCallback(
    (anime: Anime, user: User): number => {
      const maxEp = getMaxEpisode(anime, user);
      const official = anime.episodes || 0;
      const result = Math.max(maxEp, official);
      return result > 0 ? result : 1;
    },
    [getMaxEpisode],
  );

  const getLocalStatus = useCallback(
    (anime: Anime, user: User): UserStatus => {
      const pending = pendingChanges[anime.id];
      if (pending?.status?.[user] !== undefined) return pending.status[user]!;
      return anime.users[user].status;
    },
    [pendingChanges],
  );

  const getLocalEpisodes = useCallback(
    (anime: Anime, user: User): number[] => {
      const pending = pendingChanges[anime.id];
      const displayMax = getDisplayMax(anime, user);
      const eps = pending?.episodesWatched?.[user] ?? anime.users[user].episodesWatched;
      return eps.filter((e) => e <= displayMax);
    },
    [pendingChanges, getDisplayMax],
  );

  const getLocalDay = useCallback(
    (anime: Anime): string | undefined => {
      const pending = pendingChanges[anime.id];
      return pending?.day !== undefined ? pending.day : anime.day;
    },
    [pendingChanges],
  );

  const visible = useMemo(() => {
    if (!Array.isArray(animes)) return [];
    let r = [...animes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter((a) => a.title?.toLowerCase().includes(q));
    }
    if (dayFilter) r = r.filter((a) => getLocalDay(a) === dayFilter);
    return r.sort((a, b) => a.order - b.order);
  }, [animes, searchQuery, dayFilter, getLocalDay]);

  const stats = useMemo(() => {
    const total = animes.length;
    const watching = animes.filter(
      (a) =>
        getLocalStatus(a, 'eze') === 'viendo' || getLocalStatus(a, 'pancho') === 'viendo',
    ).length;
    const finished = animes.filter(
      (a) =>
        getLocalStatus(a, 'eze') === 'terminado' && getLocalStatus(a, 'pancho') === 'terminado',
    ).length;
    const epsPending = animes
      .filter(
        (a) =>
          getLocalStatus(a, 'eze') === 'viendo' || getLocalStatus(a, 'pancho') === 'viendo',
      )
      .reduce((s, a) => {
        const minWatched = Math.min(
          getLocalEpisodes(a, 'eze').length,
          getLocalEpisodes(a, 'pancho').length,
        );
        return s + Math.max(0, (a.episodes || 0) - minWatched);
      }, 0);
    return { total, watching, finished, epsPending };
  }, [animes, getLocalStatus, getLocalEpisodes]);

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const handleEpisodeToggle = useCallback(
    (anime: Anime, user: User, episode: number) => {
      const max = getDisplayMax(anime, user);
      if (episode > max) return;
      const current = getLocalEpisodes(anime, user);
      const isWatched = current.includes(episode);
      const newEps = isWatched
        ? current.filter((e) => e !== episode)
        : [...current, episode].sort((a, b) => a - b);
      const existing = pendingChanges[anime.id] || {};
      setPendingChanges(anime.id, {
        ...existing,
        episodesWatched: { ...existing.episodesWatched, [user]: newEps },
      });
    },
    [getDisplayMax, getLocalEpisodes, pendingChanges, setPendingChanges],
  );

  const handleStatusChange = useCallback(
    (anime: Anime, user: User, status: UserStatus) => {
      let episodesWatched: number[] | undefined;
      if (status === 'terminado') {
        const max = getDisplayMax(anime, user);
        episodesWatched = Array.from({ length: max }, (_, i) => i + 1);
      } else if (status === 'pendiente' || status === 'dropeado' || status === 'ni_en_un_millon') {
        episodesWatched = [];
      }
      const existing = pendingChanges[anime.id] || {};
      setPendingChanges(anime.id, {
        ...existing,
        status: { ...existing.status, [user]: status },
        ...(episodesWatched !== undefined && {
          episodesWatched: { ...existing.episodesWatched, [user]: episodesWatched },
        }),
      });
    },
    [getDisplayMax, pendingChanges, setPendingChanges],
  );

  const handleDayChange = useCallback(
    (anime: Anime, day: string) => {
      const existing = pendingChanges[anime.id] || {};
      setPendingChanges(anime.id, { ...existing, day });
    },
    [pendingChanges, setPendingChanges],
  );

  const handleEpisodesChange = useCallback(
    (anime: Anime, n: number) => {
      if (isNaN(n) || n < 0) return;
      const existing = pendingChanges[anime.id] || {};
      setPendingChanges(anime.id, {
        ...existing,
        maxEpisodes: n,
        episodesWatched: {
          ...existing.episodesWatched,
          eze: getLocalEpisodes(anime, 'eze').filter((e) => e <= n),
          pancho: getLocalEpisodes(anime, 'pancho').filter((e) => e <= n),
        },
      });
    },
    [getLocalEpisodes, pendingChanges, setPendingChanges],
  );

  const accent = ACCENT;
  const seasonKey = visible[0]?.seasonId || 'none';

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#0a0a0c',
        color: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AmbientBackground accent={accent} />

      {/* Section header / stats */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: '20px 24px 14px',
          gap: 16,
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          key={`hdr-${seasonKey}`}
          style={{ animation: 'cgFadeUp .4s ease both' }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#fafafa',
              letterSpacing: -0.5,
            }}
          >
            {seasonLabel}
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 8,
              fontSize: 12.5,
              color: 'rgba(255,255,255,.5)',
              flexWrap: 'wrap',
            }}
          >
            <Stat label="animes" value={stats.total} />
            <span style={{ opacity: 0.3 }}>·</span>
            <Stat label="en curso" value={stats.watching} dotColor="#22c55e" />
            <span style={{ opacity: 0.3 }}>·</span>
            <Stat label="terminados" value={stats.finished} dotColor={accent} />
            {stats.watching > 0 && (
              <>
                <span style={{ opacity: 0.3 }}>·</span>
                <span style={{ color: 'rgba(255,255,255,.7)' }}>
                  ~
                  <AnimNumber
                    value={stats.epsPending}
                    style={{
                      fontFamily: 'var(--font-mono), ui-monospace, monospace',
                      color: '#fafafa',
                      fontWeight: 600,
                    }}
                  />{' '}
                  eps pendientes
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 24px 100px', flex: 1, position: 'relative', zIndex: 1 }}>
        {visible.length === 0 ? (
          <EmptyState
            accent={accent}
            hasFilters={!!(searchQuery || dayFilter)}
            onAddAnime={onAddAnime}
            onClearFilters={() => {
              setSearchQuery('');
              setDayFilter(null);
            }}
          />
        ) : (
          <div
            key={`grid-${seasonKey}-${dayFilter || 'all'}`}
            className="cg-grid"
            style={
              {
                display: 'grid',
                gap: 18,
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                ['--cg-cols' as string]: String(columns),
              } as React.CSSProperties
            }
          >
            {visible.map((a, i) => (
              <div
                key={a.id}
                style={{
                  animation: 'cgCardIn .5s cubic-bezier(.22,.61,.36,1) both',
                  animationDelay: `${Math.min(i * 45, 600)}ms`,
                }}
              >
                <AnimeCard
                  anime={a}
                  editMode={editMode}
                  accent={accent}
                  showPipsAlways={showPipsAlways}
                  expanded={expandedIds.has(a.id)}
                  onToggleExpand={() => toggleExpand(a.id)}
                  onEpisodeToggle={(u, ep) => handleEpisodeToggle(a, u, ep)}
                  onStatusChange={(u, s) => handleStatusChange(a, u, s)}
                  onDayChange={(d) => handleDayChange(a, d)}
                  onEpisodesChange={(n) => handleEpisodesChange(a, n)}
                  onDelete={() => onDeleteAnime(a)}
                  getLocalEpisodes={(u) => getLocalEpisodes(a, u)}
                  getLocalStatus={(u) => getLocalStatus(a, u)}
                  getDisplayMax={(u) => getDisplayMax(a, u)}
                  getLocalDay={() => getLocalDay(a)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1100px) { .cg-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; } }
        @media (max-width: 820px)  { .cg-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
        @media (max-width: 520px)  { .cg-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function Stat({ label, value, dotColor }: { label: string; value: number; dotColor?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {dotColor && (
        <span style={{ width: 6, height: 6, borderRadius: 999, background: dotColor }} />
      )}
      <AnimNumber
        value={value}
        style={{
          fontFamily: 'var(--font-mono), ui-monospace, monospace',
          color: '#fafafa',
          fontWeight: 600,
        }}
      />
      <span style={{ opacity: 0.8 }}>{label}</span>
    </span>
  );
}

interface EmptyStateProps {
  accent: string;
  hasFilters: boolean;
  onAddAnime: () => void;
  onClearFilters: () => void;
}

function EmptyState({ accent, hasFilters, onAddAnime, onClearFilters }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 24px',
        color: 'rgba(255,255,255,.45)',
        textAlign: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles size={26} style={{ color: accent, opacity: 0.8 }} />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>
          {hasFilters ? 'Nada con esos filtros' : 'Temporada vacía'}
        </div>
        <div style={{ fontSize: 13, marginTop: 4 }}>
          {hasFilters ? 'Probá limpiar la búsqueda o el día.' : 'Agregá tu primer anime de la temporada.'}
        </div>
      </div>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          style={{
            marginTop: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,.1)',
            background: 'rgba(255,255,255,.04)',
            color: 'rgba(255,255,255,.85)',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'inherit',
          }}
        >
          Limpiar filtros
        </button>
      ) : (
        <button
          type="button"
          onClick={onAddAnime}
          style={{
            marginTop: 6,
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: `linear-gradient(180deg, ${accent}, color-mix(in oklch, ${accent} 70%, #000))`,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={13} /> Agregar anime
        </button>
      )}
    </div>
  );
}

