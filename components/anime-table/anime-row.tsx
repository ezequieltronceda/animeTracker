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
      
      {expanded && users.map((user) => (
        <UserSubrow
          key={`${anime.id}-${user}`}
          anime={anime}
          user={user}
          localEpisodes={getLocalEpisodes(user)}
          localStatus={getLocalStatus(user)}
          displayMax={getDisplayMax(user)}
          onEpisodeClick={(episode) => onEpisodeClick(user, episode)}
          onSetMaxEpisodes={onSetMaxEpisodes}
          onStatusChange={(status) => onStatusChange(user, status)}
          getStatusColor={getStatusColor}
          editMode={editMode}
        />
      ))}
    </>
  );
}
