'use client';

import { useMemo, useState, useCallback } from 'react';
import { useUIStore } from '@/store/ui-store';
import { COLORS, STATUS_LABELS, DAYS } from '@/lib/constants';
import type { Anime, User, UserStatus } from '@/types';

interface AnimeTableProps {
  animes: Anime[];
  onUpdateAnime: (anime: Anime) => void;
  onDeleteAnime: (anime: Anime) => void;
}

export function AnimeTable({ animes, onUpdateAnime, onDeleteAnime }: AnimeTableProps) {
  const { searchQuery, dayFilter, openModal, editMode } = useUIStore();
  const [lastChecked, setLastChecked] = useState<{ animeId: string; user: User; episode: number } | null>(null);

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

  const handleEpisodeToggle = useCallback(async (anime: Anime, user: User, episode: number) => {
    if (!editMode) return;
    
    const currentEpisodes = anime.users[user].episodesWatched;
    const newEpisodes = currentEpisodes.includes(episode)
      ? currentEpisodes.filter(e => e !== episode)
      : [...currentEpisodes, episode].sort((a, b) => a - b);
    
    try {
      const res = await fetch('/api/anime', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: anime.id,
          seasonId: anime.seasonId,
          user,
          episodesWatched: newEpisodes,
        }),
      });
      
      if (res.ok) {
        onUpdateAnime({
          ...anime,
          users: {
            ...anime.users,
            [user]: {
              ...anime.users[user],
              episodesWatched: newEpisodes,
            },
          },
        });
      }
    } catch (err) {
      console.error('Error updating episodes:', err);
    }
  }, [editMode, onUpdateAnime]);

  const handleAddEpisode = useCallback(async (anime: Anime, user: User) => {
    if (!editMode) return;
    
    const currentEpisodes = anime.users[user].episodesWatched;
    const nextEpisode = currentEpisodes.length > 0 ? Math.max(...currentEpisodes) + 1 : 1;
    const newEpisodes = [...currentEpisodes, nextEpisode].sort((a, b) => a - b);
    
    try {
      const res = await fetch('/api/anime', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: anime.id,
          seasonId: anime.seasonId,
          user,
          episodesWatched: newEpisodes,
        }),
      });
      
      if (res.ok) {
        const updatedAnime = {
          ...anime,
          episodes: Math.max(anime.episodes || 0, nextEpisode),
          users: {
            ...anime.users,
            [user]: {
              ...anime.users[user],
              episodesWatched: newEpisodes,
            },
          },
        };
        onUpdateAnime(updatedAnime);
      }
    } catch (err) {
      console.error('Error adding episode:', err);
    }
  }, [editMode, onUpdateAnime]);

  const handleStatusChange = useCallback(async (anime: Anime, user: User, status: UserStatus) => {
    if (!editMode) return;
    
    try {
      const res = await fetch('/api/anime', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: anime.id,
          seasonId: anime.seasonId,
          user,
          status,
        }),
      });
      
      if (res.ok) {
        onUpdateAnime({
          ...anime,
          users: {
            ...anime.users,
            [user]: {
              ...anime.users[user],
              status,
            },
          },
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  }, [editMode, onUpdateAnime]);

  const handleDayChange = useCallback(async (anime: Anime, day: string) => {
    if (!editMode) return;
    
    try {
      const res = await fetch('/api/anime', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: anime.id,
          seasonId: anime.seasonId,
          day,
        }),
      });
      
      if (res.ok) {
        onUpdateAnime({ ...anime, day });
      }
    } catch (err) {
      console.error('Error updating day:', err);
    }
  }, [editMode, onUpdateAnime]);

  const handleRowClick = useCallback((anime: Anime) => {
    openModal(anime);
  }, [openModal]);

  const getStatusColor = (status: UserStatus) => {
    const statusKey = status.replace(' ', '_') as keyof typeof COLORS.status;
    return COLORS.status[statusKey] || COLORS.status.pendiente;
  };

  return (
    <div className="w-full overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-[#18181b]">
          <tr>
            <th className="w-12 p-2 text-left text-xs font-medium text-zinc-500">#</th>
            <th className="p-2 text-left text-xs font-medium text-zinc-500">Anime</th>
            <th className="w-28 p-2 text-left text-xs font-medium text-zinc-500">Día</th>
            <th className="w-40 p-2 text-left text-xs font-medium text-zinc-500">Eze</th>
            <th className="w-40 p-2 text-left text-xs font-medium text-zinc-500">Pancho</th>
            <th className="w-20 p-2 text-left text-xs font-medium text-zinc-500">Eps</th>
            {editMode && <th className="w-12 p-2 text-left text-xs font-medium text-zinc-500"></th>}
          </tr>
        </thead>
        <tbody>
          {filteredAnimes.map((anime) => (
            <AnimeRow
              key={anime.id}
              anime={anime}
              onRowClick={handleRowClick}
              onEpisodeToggle={handleEpisodeToggle}
              onAddEpisode={handleAddEpisode}
              onStatusChange={handleStatusChange}
              onDayChange={handleDayChange}
              onDelete={() => onDeleteAnime(anime)}
              getStatusColor={getStatusColor}
              lastChecked={lastChecked}
              setLastChecked={setLastChecked}
              editMode={editMode}
            />
          ))}
        </tbody>
      </table>
      
      {filteredAnimes.length === 0 && (
        <div className="p-8 text-center text-zinc-500">
          No hay animes para mostrar
        </div>
      )}
    </div>
  );
}

interface AnimeRowProps {
  anime: Anime;
  onRowClick: (anime: Anime) => void;
  onEpisodeToggle: (anime: Anime, user: User, episode: number) => void;
  onAddEpisode: (anime: Anime, user: User) => void;
  onStatusChange: (anime: Anime, user: User, status: UserStatus) => void;
  onDayChange: (anime: Anime, day: string) => void;
  onDelete: () => void;
  getStatusColor: (status: UserStatus) => string;
  lastChecked: { animeId: string; user: User; episode: number } | null;
  setLastChecked: (val: { animeId: string; user: User; episode: number } | null) => void;
  editMode: boolean;
}

function AnimeRow({ anime, onRowClick, onEpisodeToggle, onAddEpisode, onStatusChange, onDayChange, onDelete, getStatusColor, lastChecked, setLastChecked, editMode }: AnimeRowProps) {
  const users: User[] = ['eze', 'pancho'];
  const [expanded, setExpanded] = useState(false);

  const handleEpisodeClick = (user: User, episode: number, e: React.MouseEvent) => {
    if (!editMode) return;
    
    if (e.shiftKey && lastChecked && lastChecked.user === user && lastChecked.animeId === anime.id) {
      const lastEpisode = lastChecked.episode;
      
      const start = Math.min(lastEpisode, episode);
      const end = Math.max(lastEpisode, episode);
      
      for (let i = start; i <= end; i++) {
        onEpisodeToggle(anime, user, i);
      }
    } else {
      onEpisodeToggle(anime, user, episode);
    }
    setLastChecked({ animeId: anime.id, user, episode });
  };

  const handleStatusSelect = (user: User, status: UserStatus) => {
    onStatusChange(anime, user, status);
  };

  const handleRowExpand = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, select')) return;
    setExpanded(!expanded);
  };

  const isUnknown = !anime.episodes || anime.episodes === 0;

  return (
    <>
      <tr 
        className="cursor-pointer border-b border-zinc-800 hover:bg-zinc-800/50"
        onClick={handleRowExpand}
      >
        <td className="p-2 text-zinc-500">{anime.order}</td>
        <td className="p-2">
          <div className="flex items-center gap-2">
            {anime.imageUrl && (
              <img 
                src={anime.imageUrl} 
                alt={anime.title}
                className="h-8 w-6 rounded object-cover"
              />
            )}
            <span className="font-medium text-zinc-200">{anime.title}</span>
          </div>
        </td>
        <td className="p-2">
          {editMode ? (
            <select
              value={anime.day || ''}
              onChange={(e) => onDayChange(anime, e.target.value)}
              className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 border border-zinc-700"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">-</option>
              <option value="undefined">Aún no definido</option>
              {DAYS.map(d => (
                <option key={d} value={d} className="capitalize">{d}</option>
              ))}
            </select>
          ) : (
            <span className="text-zinc-400 capitalize">
              {anime.day === 'undefined' ? 'Aún no definido' : (DAYS.includes(anime.day as any) ? anime.day : '-')}
            </span>
          )}
        </td>
        <td className="p-2">
          <StatusBadge 
            status={anime.users.eze.status} 
            color={getStatusColor(anime.users.eze.status)}
            progress={`${anime.users.eze.episodesWatched.length}/${isUnknown ? '?' : anime.episodes}`}
          />
        </td>
        <td className="p-2">
          <StatusBadge 
            status={anime.users.pancho.status} 
            color={getStatusColor(anime.users.pancho.status)}
            progress={`${anime.users.pancho.episodesWatched.length}/${isUnknown ? '?' : anime.episodes}`}
          />
        </td>
        <td className="p-2 text-zinc-400">{isUnknown ? '?' : anime.episodes}</td>
        {editMode && (
          <td className="p-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-500 hover:text-red-400 text-xs"
            >
              ✕
            </button>
          </td>
        )}
      </tr>
      
      {expanded && users.map((user) => (
        <UserSubrow
          key={`${anime.id}-${user}`}
          anime={anime}
          user={user}
          onEpisodeClick={handleEpisodeClick}
          onAddEpisode={onAddEpisode}
          onStatusSelect={handleStatusSelect}
          onRowClick={() => onRowClick(anime)}
          getStatusColor={getStatusColor}
          editMode={editMode}
        />
      ))}
    </>
  );
}

interface UserSubrowProps {
  anime: Anime;
  user: User;
  onEpisodeClick: (user: User, episode: number, e: React.MouseEvent) => void;
  onAddEpisode: (anime: Anime, user: User) => void;
  onStatusSelect: (user: User, status: UserStatus) => void;
  onRowClick: () => void;
  getStatusColor: (status: UserStatus) => string;
  editMode: boolean;
}

function UserSubrow({ anime, user, onEpisodeClick, onAddEpisode, onStatusSelect, getStatusColor, editMode }: UserSubrowProps) {
  const userData = anime.users[user];
  const totalEpisodes = anime.episodes || 0;
  const isUnknown = totalEpisodes === 0;
  const maxWatched = userData.episodesWatched.length;
  const blocks = isUnknown ? Math.ceil(maxWatched / 25) : Math.ceil(totalEpisodes / 25);
  const [currentBlock, setCurrentBlock] = useState(0);

  const startEpisode = currentBlock * 25 + 1;
  const endEpisode = isUnknown 
    ? Math.min((currentBlock + 1) * 25, maxWatched)
    : Math.min((currentBlock + 1) * 25, totalEpisodes);

  return (
    <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
      <td colSpan={editMode ? 7 : 6} className="p-2 pl-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <span className="w-16 text-xs font-medium text-zinc-500 uppercase">{user}</span>
            <select
              value={userData.status}
              onChange={(e) => onStatusSelect(user, e.target.value as UserStatus)}
              className={`rounded px-2 py-1 text-xs border ${
                editMode 
                  ? 'bg-zinc-800 text-zinc-300 border-zinc-700 cursor-pointer hover:bg-zinc-700' 
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 cursor-not-allowed'
              }`}
              onClick={(e) => e.stopPropagation()}
              disabled={!editMode}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <span className="text-xs text-zinc-500">
              {userData.episodesWatched.length}/{isUnknown ? '?' : totalEpisodes} episodes
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {blocks > 1 && (
              <>
                <button
                  onClick={() => setCurrentBlock(Math.max(0, currentBlock - 1))}
                  disabled={currentBlock === 0 || !editMode}
                  className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 disabled:opacity-30"
                >
                  ←
                </button>
              </>
            )}
            <div className="flex flex-wrap gap-1">
              {isUnknown ? (
                Array.from({ length: endEpisode - startEpisode + 1 }, (_, i) => {
                  const episode = startEpisode + i;
                  const isWatched = userData.episodesWatched.includes(episode);
                  return (
                    <button
                      key={episode}
                      onClick={(e) => onEpisodeClick(user, episode, e)}
                      disabled={!editMode}
                      className={`h-6 w-6 text-xs rounded ${
                        isWatched 
                          ? 'bg-indigo-600 text-white' 
                          : editMode
                            ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                            : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      {episode}
                    </button>
                  );
                })
              ) : (
                Array.from({ length: endEpisode - startEpisode + 1 }, (_, i) => {
                  const episode = startEpisode + i;
                  const isWatched = userData.episodesWatched.includes(episode);
                  return (
                    <button
                      key={episode}
                      onClick={(e) => onEpisodeClick(user, episode, e)}
                      disabled={!editMode}
                      className={`h-6 w-6 text-xs rounded ${
                        isWatched 
                          ? 'bg-indigo-600 text-white' 
                          : editMode
                            ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                            : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      {episode}
                    </button>
                  );
                })
              )}
            </div>
            {blocks > 1 && (
              <button
                onClick={() => setCurrentBlock(Math.min(blocks - 1, currentBlock + 1))}
                disabled={currentBlock >= blocks - 1 || !editMode}
                className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 disabled:opacity-30"
              >
                →
              </button>
            )}
            {editMode && (
              <button
                onClick={() => onAddEpisode(anime, user)}
                className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-600 ml-2"
              >
                + Agregar capítulo
              </button>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status, color, progress }: { status: string; color: string; progress: string }) {
  return (
    <div className="flex items-center gap-2">
      <span 
        className="h-2 w-2 rounded-full" 
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-zinc-400">{STATUS_LABELS[status] || status}</span>
      <span className="text-xs text-zinc-600">{progress}</span>
    </div>
  );
}