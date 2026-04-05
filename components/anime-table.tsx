'use client';

import { useMemo, useState, useCallback } from 'react';
import { useUIStore } from '@/store/ui-store';
import { COLORS, STATUS_LABELS, DAYS } from '@/lib/constants';
import type { Anime, User, UserStatus } from '@/types';

interface PendingChanges {
  episodesWatched?: { [user in User]?: number[] };
  maxEpisode?: { [user in User]?: number };
  status?: { [user in User]?: UserStatus };
  day?: string;
}

interface AnimeTableProps {
  animes: Anime[];
  onSaveChanges: (animeId: string, seasonId: string, changes: PendingChanges) => void;
  onDeleteAnime: (anime: Anime) => void;
}

export function AnimeTable({ animes, onSaveChanges, onDeleteAnime }: AnimeTableProps) {
  const { searchQuery, dayFilter, openModal, editMode } = useUIStore();
  const [lastChecked, setLastChecked] = useState<{ animeId: string; user: User; episode: number } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<{ [animeId: string]: PendingChanges }>({});
  const [expandedAnimes, setExpandedAnimes] = useState<Set<string>>(new Set());
  const [episodeInput, setEpisodeInput] = useState<{ [key: string]: string }>({});
  const [showEpisodeInput, setShowEpisodeInput] = useState<{ [key: string]: Set<User> }>({});

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

  const getLocalStatus = (anime: Anime, user: User): UserStatus => {
    const pending = pendingChanges[anime.id];
    if (pending?.status?.[user] !== undefined) {
      return pending.status[user]!;
    }
    return anime.users[user].status;
  };

  const getLocalEpisodes = (anime: Anime, user: User): number[] => {
    const pending = pendingChanges[anime.id];
    const displayMax = getDisplayMax(anime, user);
    
    let episodes: number[];
    if (pending?.episodesWatched?.[user] !== undefined) {
      episodes = pending.episodesWatched[user]!;
    } else {
      episodes = anime.users[user].episodesWatched;
    }
    
    return episodes.filter(e => e <= displayMax);
  };

  const getMaxEpisode = (anime: Anime, user: User): number => {
    const pending = pendingChanges[anime.id];
    if (pending?.maxEpisode?.[user] !== undefined) {
      return pending.maxEpisode[user]!;
    }
    const watched = anime.users[user].episodesWatched;
    return watched.length > 0 ? Math.max(...watched) : 0;
  };

  const getDisplayMax = (anime: Anime, user: User): number => {
    const maxEp = getMaxEpisode(anime, user);
    const official = anime.episodes || 0;
    return Math.max(maxEp, official);
  };

  const handleEpisodeClick = useCallback((anime: Anime, user: User, episode: number) => {
    if (!editMode) return;
    if (episode > getDisplayMax(anime, user)) return;

    const currentEpisodes = getLocalEpisodes(anime, user);
    const isWatched = currentEpisodes.includes(episode);
    
    const newEpisodes = isWatched
      ? currentEpisodes.filter(e => e !== episode)
      : [...currentEpisodes, episode].sort((a, b) => a - b);

    setPendingChanges(prev => ({
      ...prev,
      [anime.id]: {
        ...prev[anime.id],
        episodesWatched: {
          ...prev[anime.id]?.episodesWatched,
          [user]: newEpisodes,
        },
      },
    }));
  }, [editMode]);

  const handleSetMaxEpisodes = useCallback((anime: Anime, user: User, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;

    const currentEpisodes = getLocalEpisodes(anime, user);
    const filteredEpisodes = currentEpisodes.filter(e => e <= num);

    setPendingChanges(prev => ({
      ...prev,
      [anime.id]: {
        ...prev[anime.id],
        maxEpisode: {
          ...prev[anime.id]?.maxEpisode,
          [user]: num,
        },
        episodesWatched: {
          ...prev[anime.id]?.episodesWatched,
          [user]: filteredEpisodes,
        },
      },
    }));
    
    setEpisodeInput(prev => ({ ...prev, [`${anime.id}-${user}`]: '' }));
    setShowEpisodeInput(prev => {
      const newSet = { ...prev };
      newSet[anime.id]?.delete(user);
      return newSet;
    });
  }, []);

  const handleStatusChange = useCallback((anime: Anime, user: User, status: UserStatus) => {
    if (!editMode) return;

    let episodesWatched: number[] | undefined;
    
    if (status === 'terminado') {
      const displayMax = getDisplayMax(anime, user);
      episodesWatched = Array.from({ length: displayMax }, (_, i) => i + 1);
    } else if (status === 'pendiente' || status === 'dropeado') {
      episodesWatched = [];
    }

    setPendingChanges(prev => ({
      ...prev,
      [anime.id]: {
        ...prev[anime.id],
        status: {
          ...prev[anime.id]?.status,
          [user]: status,
        },
        ...(episodesWatched !== undefined && {
          episodesWatched: {
            ...prev[anime.id]?.episodesWatched,
            [user]: episodesWatched,
          },
        }),
      },
    }));
  }, [editMode]);

  const handleDayChange = useCallback((anime: Anime, day: string) => {
    if (!editMode) return;

    setPendingChanges(prev => ({
      ...prev,
      [anime.id]: {
        ...prev[anime.id],
        day,
      },
    }));
  }, [editMode]);

  const handleSave = useCallback((anime: Anime) => {
    const changes = pendingChanges[anime.id];
    if (changes) {
      onSaveChanges(anime.id, anime.seasonId, changes);
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[anime.id];
        return newChanges;
      });
    }
  }, [pendingChanges, onSaveChanges]);

  const hasChanges = (animeId: string) => {
    return !!pendingChanges[animeId];
  };

  const toggleExpanded = (animeId: string) => {
    setExpandedAnimes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(animeId)) {
        newSet.delete(animeId);
      } else {
        newSet.add(animeId);
      }
      return newSet;
    });
  };

  const toggleEpisodeInput = (animeId: string, user: User) => {
    setShowEpisodeInput(prev => {
      const newSet = { ...prev };
      if (!newSet[animeId]) {
        newSet[animeId] = new Set();
      }
      if (newSet[animeId].has(user)) {
        newSet[animeId].delete(user);
      } else {
        newSet[animeId].add(user);
      }
      return newSet;
    });
  };

  const handleUpdateInput = useCallback((key: string, value: string) => {
    setEpisodeInput(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleRowClick = useCallback((anime: Anime) => {
    openModal(anime);
  }, [openModal]);

  const getStatusColor = (status: UserStatus) => {
    const statusKey = status.replace(' ', '_') as keyof typeof COLORS.status;
    return COLORS.status[statusKey] || COLORS.status.pendiente;
  };

  return (
    <div className="w-full">
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
              {editMode && <th className="w-24 p-2 text-left text-xs font-medium text-zinc-500"></th>}
            </tr>
          </thead>
          <tbody>
            {filteredAnimes.map((anime) => (
              <AnimeRow
                key={anime.id}
                anime={anime}
                expanded={expandedAnimes.has(anime.id)}
                onToggleExpand={() => toggleExpanded(anime.id)}
                onRowClick={handleRowClick}
                onEpisodeClick={handleEpisodeClick}
                onSetMaxEpisodes={handleSetMaxEpisodes}
                onStatusChange={handleStatusChange}
                onDayChange={handleDayChange}
                onSave={() => handleSave(anime)}
                onDelete={() => onDeleteAnime(anime)}
                getStatusColor={getStatusColor}
                getLocalEpisodes={getLocalEpisodes}
                getLocalStatus={getLocalStatus}
                getDisplayMax={getDisplayMax}
                lastChecked={lastChecked}
                setLastChecked={setLastChecked}
                setPendingChanges={setPendingChanges}
                editMode={editMode}
                hasChanges={hasChanges(anime.id)}
                episodeInput={episodeInput}
                showEpisodeInput={showEpisodeInput}
                onToggleEpisodeInput={toggleEpisodeInput}
                onUpdateEpisodeInput={handleUpdateInput}
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
    </div>
  );
}

interface AnimeRowProps {
  anime: Anime;
  expanded: boolean;
  onToggleExpand: () => void;
  onRowClick: (anime: Anime) => void;
  onEpisodeClick: (anime: Anime, user: User, episode: number) => void;
  onSetMaxEpisodes: (anime: Anime, user: User, value: string) => void;
  onStatusChange: (anime: Anime, user: User, status: UserStatus) => void;
  onDayChange: (anime: Anime, day: string) => void;
  onSave: () => void;
  onDelete: () => void;
  getStatusColor: (status: UserStatus) => string;
  getLocalEpisodes: (anime: Anime, user: User) => number[];
  getLocalStatus: (anime: Anime, user: User) => UserStatus;
  getDisplayMax: (anime: Anime, user: User) => number;
  lastChecked: { animeId: string; user: User; episode: number } | null;
  setLastChecked: (val: { animeId: string; user: User; episode: number } | null) => void;
  setPendingChanges: React.Dispatch<React.SetStateAction<{ [animeId: string]: PendingChanges }>>;
  editMode: boolean;
  hasChanges: boolean;
  episodeInput: { [key: string]: string };
  showEpisodeInput: { [key: string]: Set<User> };
  onToggleEpisodeInput: (animeId: string, user: User) => void;
  onUpdateEpisodeInput: (key: string, value: string) => void;
}

function AnimeRow({ anime, expanded, onToggleExpand, onRowClick, onEpisodeClick, onSetMaxEpisodes, onStatusChange, onDayChange, onSave, onDelete, getStatusColor, getLocalEpisodes, getLocalStatus, getDisplayMax, lastChecked, setLastChecked, setPendingChanges, editMode, hasChanges, episodeInput, showEpisodeInput, onToggleEpisodeInput, onUpdateEpisodeInput }: AnimeRowProps) {
  const users: User[] = ['eze', 'pancho'];
  const hasOfficialEpisodes = anime.episodes && anime.episodes > 0;

  const handleEpisodeClickInternal = (user: User, episode: number, e: React.MouseEvent) => {
    if (!editMode) return;
    
    if (e.shiftKey && lastChecked && lastChecked.user === user && lastChecked.animeId === anime.id) {
      const lastEpisode = lastChecked.episode;
      
      const start = Math.min(lastEpisode, episode);
      const end = Math.max(lastEpisode, episode);
      
      const currentEpisodes = getLocalEpisodes(anime, user);
      const allWatched = Array.from({ length: end - start + 1 }, (_, i) => start + i).every(ep => currentEpisodes.includes(ep));
      
      const newEpisodes = allWatched
        ? currentEpisodes.filter(e => e < start || e > end)
        : [...currentEpisodes, ...Array.from({ length: end - start + 1 }, (_, i) => start + i)].sort((a, b) => a - b);
      
      setPendingChanges(prev => ({
        ...prev,
        [anime.id]: {
          ...prev[anime.id],
          episodesWatched: {
            ...prev[anime.id]?.episodesWatched,
            [user]: newEpisodes,
          },
        },
      }));
    } else {
      onEpisodeClick(anime, user, episode);
    }
    setLastChecked({ animeId: anime.id, user, episode });
  };

  const handleRowExpand = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, select, input')) return;
    onToggleExpand();
  };

  const getEpisodeCount = (user: User) => {
    const localEpisodes = getLocalEpisodes(anime, user);
    const displayMax = getDisplayMax(anime, user);
    return isUnknown ? localEpisodes.length : displayMax;
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
            progress={`${getEpisodeCount('eze')}/${isUnknown ? '?' : anime.episodes}`}
          />
        </td>
        <td className="p-2">
          <StatusBadge 
            status={anime.users.pancho.status} 
            color={getStatusColor(anime.users.pancho.status)}
            progress={`${getEpisodeCount('pancho')}/${isUnknown ? '?' : anime.episodes}`}
          />
        </td>
        <td className="p-2 text-zinc-400">{isUnknown ? '?' : anime.episodes}</td>
        {editMode && (
          <td className="p-2">
            <div className="flex items-center gap-1">
              {hasChanges && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave();
                  }}
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500"
                >
                  Guardar
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-500 hover:text-red-400 text-xs"
              >
                ✕
              </button>
            </div>
          </td>
        )}
      </tr>
      
      {expanded && users.map((user) => (
        <UserSubrow
          key={`${anime.id}-${user}`}
          anime={anime}
          user={user}
          onEpisodeClick={handleEpisodeClickInternal}
          onSetMaxEpisodes={onSetMaxEpisodes}
          onStatusChange={onStatusChange}
          getStatusColor={getStatusColor}
                getLocalEpisodes={getLocalEpisodes}
                getLocalStatus={getLocalStatus}
                getDisplayMax={getDisplayMax}
          editMode={editMode}
          episodeInput={episodeInput}
          showEpisodeInput={showEpisodeInput}
          onToggleEpisodeInput={onToggleEpisodeInput}
          onUpdateEpisodeInput={onUpdateEpisodeInput}
        />
      ))}
    </>
  );
}

interface UserSubrowProps {
  anime: Anime;
  user: User;
  onEpisodeClick: (user: User, episode: number, e: React.MouseEvent) => void;
  onSetMaxEpisodes: (anime: Anime, user: User, value: string) => void;
  onStatusChange: (anime: Anime, user: User, status: UserStatus) => void;
  getStatusColor: (status: UserStatus) => string;
  getLocalEpisodes: (anime: Anime, user: User) => number[];
  getLocalStatus: (anime: Anime, user: User) => UserStatus;
  getDisplayMax: (anime: Anime, user: User) => number;
  editMode: boolean;
  episodeInput: { [key: string]: string };
  showEpisodeInput: { [key: string]: Set<User> };
  onToggleEpisodeInput: (animeId: string, user: User) => void;
  onUpdateEpisodeInput: (key: string, value: string) => void;
}

function UserSubrow({ anime, user, onEpisodeClick, onSetMaxEpisodes, onStatusChange, getStatusColor, getLocalEpisodes, getLocalStatus, getDisplayMax, editMode, episodeInput, showEpisodeInput, onToggleEpisodeInput, onUpdateEpisodeInput }: UserSubrowProps) {
  const userData = anime.users[user];
  const localEpisodes = getLocalEpisodes(anime, user);
  const localStatus = getLocalStatus(anime, user);
  const displayMax = getDisplayMax(anime, user);
  const hasOfficial = anime.episodes && anime.episodes > 0;
  const isUnknown = !hasOfficial;
  const blocks = Math.ceil(Math.max(displayMax, 1) / 25);
  const [currentBlock, setCurrentBlock] = useState(0);

  const startEpisode = currentBlock * 25 + 1;
  const endEpisode = Math.min((currentBlock + 1) * 25, displayMax);

  const showInput = showEpisodeInput[anime.id]?.has(user);
  const inputValue = episodeInput[`${anime.id}-${user}`] || '';

  return (
    <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
      <td colSpan={editMode ? 7 : 6} className="p-2 pl-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <span className="w-16 text-xs font-medium text-zinc-500 uppercase">{user}</span>
            <select
              value={localStatus}
              onChange={(e) => onStatusChange(anime, user, e.target.value as UserStatus)}
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
              {localEpisodes.length}/{displayMax} episodes
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
              {Array.from({ length: Math.max(0, endEpisode - startEpisode + 1) }, (_, i) => {
                const episode = startEpisode + i;
                const isWatched = localEpisodes.includes(episode);
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
              })}
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
            {editMode && !hasOfficial && (
              <div className="ml-2">
                {showInput ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={inputValue}
                      onChange={(e) => {
                        const key = `${anime.id}-${user}`;
                        onUpdateEpisodeInput(key, e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onSetMaxEpisodes(anime, user, inputValue);
                        }
                        if (e.key === 'Escape') {
                          onToggleEpisodeInput(anime.id, user);
                        }
                      }}
                      onBlur={() => {
                        if (inputValue) {
                          onSetMaxEpisodes(anime, user, inputValue);
                        } else {
                          onToggleEpisodeInput(anime.id, user);
                        }
                      }}
                      placeholder="N°"
                      className="w-16 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 border border-zinc-700"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => onToggleEpisodeInput(anime.id, user)}
                    className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-600"
                  >
                    + Máx
                  </button>
                )}
              </div>
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