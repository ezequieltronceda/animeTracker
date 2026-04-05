'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';
import { COLORS, STATUS_LABELS, DAYS } from '@/lib/constants';
import { AnimeRow } from './anime-row';
import type { Anime, User, UserStatus } from '@/types';

interface PendingChanges {
  episodesWatched?: { [user in User]?: number[] };
  maxEpisodes?: number;
  status?: { [user in User]?: UserStatus };
  day?: string;
}

interface AnimeTableProps {
  animes: Anime[];
  onSaveChanges: (animeId: string, seasonId: string, changes: PendingChanges) => void;
  onDeleteAnime: (anime: Anime) => void;
}

export function AnimeTable({ animes, onSaveChanges, onDeleteAnime }: AnimeTableProps) {
  const { searchQuery, dayFilter, openModal, editMode, pendingChanges, setPendingChanges, clearPendingChanges } = useUIStore();
  const [expandedAnimes, setExpandedAnimes] = useState<Set<string>>(new Set());

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

  const getMaxEpisode = useCallback((anime: Anime, user: User): number => {
    const pending = pendingChanges[anime.id];
    if (pending?.maxEpisodes !== undefined) {
      return pending.maxEpisodes;
    }
    if (anime.maxEpisodes !== undefined) {
      return anime.maxEpisodes;
    }
    const watched = anime.users[user].episodesWatched;
    return watched.length > 0 ? Math.max(...watched) : 0;
  }, [pendingChanges]);

  const getDisplayMax = useCallback((anime: Anime, user: User): number => {
    const maxEp = getMaxEpisode(anime, user);
    const official = anime.episodes || 0;
    const result = Math.max(maxEp, official);
    return result > 0 ? result : 1;
  }, [getMaxEpisode]);

  const getLocalStatus = useCallback((anime: Anime, user: User): UserStatus => {
    const pending = pendingChanges[anime.id];
    if (pending?.status?.[user] !== undefined) {
      return pending.status[user]!;
    }
    return anime.users[user].status;
  }, [pendingChanges]);

  const getLocalEpisodes = useCallback((anime: Anime, user: User): number[] => {
    const pending = pendingChanges[anime.id];
    const displayMax = getDisplayMax(anime, user);
    
    let episodes: number[];
    if (pending?.episodesWatched?.[user] !== undefined) {
      episodes = pending.episodesWatched[user]!;
    } else {
      episodes = anime.users[user].episodesWatched;
    }
    
    return episodes.filter(e => e <= displayMax);
  }, [pendingChanges, getDisplayMax]);

  const filteredAnimes = useMemo(() => {
    if (!Array.isArray(animes) || animes.length === 0) return [];
    
    let result = [...animes];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => a.title?.toLowerCase().includes(query));
    }
    
    if (dayFilter) {
      result = result.filter(a => a.day === dayFilter);
    }
    
    return result.sort((a, b) => a.order - b.order);
  }, [animes, searchQuery, dayFilter]);

  const handleEpisodeClick = useCallback((anime: Anime, user: User, episode: number) => {
    if (!editMode) return;
    if (episode > getDisplayMax(anime, user)) return;

    const currentEpisodes = getLocalEpisodes(anime, user);
    const isWatched = currentEpisodes.includes(episode);
    
    const newEpisodes = isWatched
      ? currentEpisodes.filter(e => e !== episode)
      : [...currentEpisodes, episode].sort((a, b) => a - b);

    const existingChanges = pendingChanges[anime.id] || {};
    setPendingChanges(anime.id, {
      ...existingChanges,
      episodesWatched: {
        ...existingChanges.episodesWatched,
        [user]: newEpisodes,
      },
    });
  }, [editMode, getDisplayMax, getLocalEpisodes, pendingChanges, setPendingChanges]);

  const handleSetMaxEpisodes = useCallback((anime: Anime, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;

    const currentEpisodesEze = getLocalEpisodes(anime, 'eze');
    const currentEpisodesPancho = getLocalEpisodes(anime, 'pancho');
    const filteredEpisodesEze = currentEpisodesEze.filter(e => e <= num);
    const filteredEpisodesPancho = currentEpisodesPancho.filter(e => e <= num);

    const existingChanges = pendingChanges[anime.id] || {};
    setPendingChanges(anime.id, {
      ...existingChanges,
      maxEpisodes: num,
      episodesWatched: {
        ...existingChanges.episodesWatched,
        eze: filteredEpisodesEze,
        pancho: filteredEpisodesPancho,
      },
    });
  }, [getLocalEpisodes, pendingChanges, setPendingChanges]);

  const handleStatusChange = useCallback((anime: Anime, user: User, status: UserStatus) => {
    if (!editMode) return;

    let episodesWatched: number[] | undefined;
    
    if (status === 'terminado') {
      const displayMax = getDisplayMax(anime, user);
      episodesWatched = Array.from({ length: displayMax }, (_, i) => i + 1);
    } else if (status === 'pendiente' || status === 'dropeado') {
      episodesWatched = [];
    }

    const existingChanges = pendingChanges[anime.id] || {};
    setPendingChanges(anime.id, {
      ...existingChanges,
      status: {
        ...existingChanges.status,
        [user]: status,
      },
      ...(episodesWatched !== undefined && {
        episodesWatched: {
          ...existingChanges.episodesWatched,
          [user]: episodesWatched,
        },
      }),
    });
  }, [editMode, getDisplayMax, pendingChanges, setPendingChanges]);

  const handleDayChange = useCallback((anime: Anime, day: string) => {
    if (!editMode) return;

    const existingChanges = pendingChanges[anime.id] || {};
    setPendingChanges(anime.id, {
      ...existingChanges,
      day,
    });
  }, [editMode, pendingChanges, setPendingChanges]);

  const handleSave = useCallback((anime: Anime) => {
    const changes = pendingChanges[anime.id];
    if (changes) {
      onSaveChanges(anime.id, anime.seasonId, changes);
      clearPendingChanges(anime.id);
    }
  }, [pendingChanges, onSaveChanges, clearPendingChanges]);

  const hasChanges = useCallback((animeId: string) => {
    return !!pendingChanges[animeId];
  }, [pendingChanges]);

  const toggleExpanded = useCallback((animeId: string) => {
    setExpandedAnimes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(animeId)) {
        newSet.delete(animeId);
      } else {
        newSet.add(animeId);
      }
      return newSet;
    });
  }, []);

  const handleRowClick = useCallback((anime: Anime) => {
    openModal(anime);
  }, [openModal]);

  const getStatusColor = useCallback((status: UserStatus) => {
    const statusKey = status.replace(' ', '_') as keyof typeof COLORS.status;
    return COLORS.status[statusKey] || COLORS.status.pendiente;
  }, []);

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[600px] lg:min-w-0 border-collapse text-base">
          <thead className="sticky top-0 z-10 bg-[#18181b]">
            <tr>
              <th className="w-12 lg:w-16 p-2 lg:p-3 text-left text-xs lg:text-sm font-medium text-zinc-500">#</th>
              <th className="p-2 lg:p-3 text-left text-xs lg:text-sm font-medium text-zinc-500">Anime</th>
              <th className="w-24 lg:w-32 p-2 lg:p-3 text-left text-xs lg:text-sm font-medium text-zinc-500">Día</th>
              <th className="w-36 lg:w-48 p-2 lg:p-3 text-left text-xs lg:text-sm font-medium text-zinc-500">Eze</th>
              <th className="w-36 lg:w-48 p-2 lg:p-3 text-left text-xs lg:text-sm font-medium text-zinc-500">Pancho</th>
              <th className="w-16 lg:w-24 p-2 lg:p-3 text-left text-xs lg:text-sm font-medium text-zinc-500">Eps</th>
              {editMode && <th className="w-20 lg:w-28 p-2 lg:p-3 text-left text-xs lg:text-sm font-medium text-zinc-500"></th>}
            </tr>
          </thead>
          <tbody>
            {filteredAnimes.map((anime, index) => (
              <AnimeRow
                key={anime.id}
                anime={anime}
                expanded={expandedAnimes.has(anime.id)}
                onToggleExpand={() => toggleExpanded(anime.id)}
                onRowClick={() => handleRowClick(anime)}
                onEpisodeClick={(user, episode) => handleEpisodeClick(anime, user, episode)}
                onSetMaxEpisodes={(value) => handleSetMaxEpisodes(anime, value)}
                onStatusChange={(user, status) => handleStatusChange(anime, user, status)}
                onDayChange={(day) => handleDayChange(anime, day)}
                onSave={() => handleSave(anime)}
                onDelete={() => onDeleteAnime(anime)}
                getStatusColor={getStatusColor}
                getLocalEpisodes={(user) => getLocalEpisodes(anime, user)}
                getLocalStatus={(user) => getLocalStatus(anime, user)}
                getDisplayMax={(user) => getDisplayMax(anime, user)}
                editMode={editMode}
                hasChanges={hasChanges(anime.id)}
                animationDelay={index * 50}
              />
            ))}
          </tbody>
        </table>
        
        {filteredAnimes.length === 0 && (
          <div className="p-4 lg:p-8 text-center text-zinc-500 text-sm lg:text-base">
            No hay animes para mostrar
          </div>
        )}
      </div>
    </div>
  );
}
