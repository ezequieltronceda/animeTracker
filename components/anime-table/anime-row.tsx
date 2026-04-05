'use client';

import { useState } from 'react';
import { DAYS } from '@/lib/constants';
import { StatusBadge } from './status-badge';
import { UserSubrow } from './user-subrow';
import { MaxEpisodeInput } from './max-episode-input';
import type { Anime, User, UserStatus } from '@/types';

interface AnimeRowProps {
  anime: Anime;
  expanded: boolean;
  onToggleExpand: () => void;
  onRowClick: () => void;
  onEpisodeClick: (user: User, episode: number) => void;
  onSetMaxEpisodes: (value: string) => void;
  onStatusChange: (user: User, status: UserStatus) => void;
  onDayChange: (day: string) => void;
  onSave: () => void;
  onDelete: () => void;
  getStatusColor: (status: UserStatus) => string;
  getLocalEpisodes: (user: User) => number[];
  getLocalStatus: (user: User) => UserStatus;
  getDisplayMax: (user: User) => number;
  editMode: boolean;
  hasChanges: boolean;
  animationDelay?: number;
}

export function AnimeRow({
  anime,
  expanded,
  onToggleExpand,
  onRowClick,
  onEpisodeClick,
  onSetMaxEpisodes,
  onStatusChange,
  onDayChange,
  onSave,
  onDelete,
  getStatusColor,
  getLocalEpisodes,
  getLocalStatus,
  getDisplayMax,
  editMode,
  hasChanges,
  animationDelay = 0,
}: AnimeRowProps) {
  const users: User[] = ['eze', 'pancho'];
  const [showMaxInput, setShowMaxInput] = useState(false);
  const [maxInputValue, setMaxInputValue] = useState('');

  const getEpisodeCount = (user: User) => {
    const localEpisodes = getLocalEpisodes(user);
    const displayMax = getDisplayMax(user);
    return `${localEpisodes.length}/${displayMax}`;
  };

  const handleRowExpand = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, select, input')) return;
    onToggleExpand();
  };

  return (
    <>
      <tr 
        className="cursor-pointer border-b border-zinc-800/50 hover:bg-zinc-800/70 hover-lift transition-all duration-200 animate-fade-in"
        onClick={handleRowExpand}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <td className="p-3 text-zinc-500 font-mono text-xs">{String(anime.order).padStart(2, '0')}</td>
        <td className="p-3">
          <div className="flex items-center gap-3">
            {anime.imageUrl && (
              <img 
                src={anime.imageUrl} 
                alt={anime.title}
                className="h-14 w-10 rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
              />
            )}
            <div className="flex flex-col gap-1">
              <span className="font-medium text-zinc-200 text-sm leading-tight">{anime.title}</span>
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <span className="text-amber-500">★</span>
                {anime.score ? anime.score.toFixed(1) : '-'}
              </span>
            </div>
          </div>
        </td>
        <td className="p-2">
          {editMode ? (
            <select
              value={anime.day || ''}
              onChange={(e) => onDayChange(e.target.value)}
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
            progress={getEpisodeCount('eze')}
          />
        </td>
        <td className="p-2">
          <StatusBadge 
            status={anime.users.pancho.status} 
            color={getStatusColor(anime.users.pancho.status)}
            progress={getEpisodeCount('pancho')}
          />
        </td>
        <td className="p-2 text-zinc-400">{anime.episodes || '?'}</td>
        {editMode && (
          <td className="p-2">
            {showMaxInput ? (
              <MaxEpisodeInput
                value={maxInputValue}
                onChange={setMaxInputValue}
                onSubmit={(val) => {
                  if (val) onSetMaxEpisodes(val);
                  setShowMaxInput(false);
                  setMaxInputValue('');
                }}
                onCancel={() => {
                  setShowMaxInput(false);
                  setMaxInputValue('');
                }}
              />
            ) : (
              <button
                onClick={() => {
                  setMaxInputValue(String(getDisplayMax('eze')));
                  setShowMaxInput(true);
                }}
                className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-600"
              >
                Máx ({getDisplayMax('eze')})
              </button>
            )}
            <div className="flex items-center gap-1 mt-1">
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
      
      {expanded && (
        <tr className="border-b border-zinc-800/50 bg-zinc-900/50 animate-slide-in">
          <td colSpan={editMode ? 7 : 6} className="p-4">
            <div className="flex gap-6">
              {anime.imageUrl && (
                <div className="flex-shrink-0">
                  <img 
                    src={anime.imageUrl} 
                    alt={anime.title}
                    className="h-64 w-auto rounded-xl object-cover shadow-2xl animate-scale-in"
                  />
                </div>
              )}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-zinc-100">{anime.title}</h3>
                  {anime.score && (
                    <span className="text-lg text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                      <span className="text-amber-500">★</span>
                      {anime.score.toFixed(1)}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {users.map((user) => (
                    <div key={user} className="bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-zinc-300 uppercase">{user}</span>
                        <span className="text-xs text-zinc-500">
                          {getLocalEpisodes(user).length}/{getDisplayMax(user)} eps
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: Math.min(getDisplayMax(user), 50) }, (_, i) => {
                          const episode = i + 1;
                          const isWatched = getLocalEpisodes(user).includes(episode);
                          return (
                            <button
                              key={episode}
                              onClick={() => onEpisodeClick(user, episode)}
                              disabled={!editMode}
                              className={`h-6 w-6 text-xs rounded-md transition-all hover:scale-110 ${
                                isWatched 
                                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg' 
                                  : editMode
                                    ? 'bg-zinc-700/80 text-zinc-400 hover:bg-zinc-600'
                                    : 'bg-zinc-800 text-zinc-600'
                              }`}
                            >
                              {episode}
                            </button>
                          );
                        })}
                        {getDisplayMax(user) > 50 && (
                          <span className="text-xs text-zinc-500 self-center">
                            +{getDisplayMax(user) - 50} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
      
      {/* Keep subrows hidden for now - we have the expanded view above */}
    </>
  );
}
