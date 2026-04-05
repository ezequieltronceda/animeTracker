'use client';

import { useState } from 'react';
import { STATUS_LABELS } from '@/lib/constants';
import { EpisodeButtons } from './episode-buttons';
import { MaxEpisodeInput } from './max-episode-input';
import type { Anime, User, UserStatus } from '@/types';

interface UserSubrowProps {
  anime: Anime;
  user: User;
  localEpisodes: number[];
  localStatus: UserStatus;
  displayMax: number;
  onEpisodeClick: (episode: number) => void;
  onSetMaxEpisodes: (value: string) => void;
  onStatusChange: (status: UserStatus) => void;
  getStatusColor: (status: UserStatus) => string;
  editMode: boolean;
}

export function UserSubrow({
  anime,
  user,
  localEpisodes,
  localStatus,
  displayMax,
  onEpisodeClick,
  onSetMaxEpisodes,
  onStatusChange,
  getStatusColor,
  editMode,
}: UserSubrowProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
      <td colSpan={editMode ? 7 : 6} className="p-2 pl-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <span className="w-16 text-xs font-medium text-zinc-500 uppercase">{user}</span>
            <select
              value={localStatus}
              onChange={(e) => onStatusChange(e.target.value as UserStatus)}
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
          
          <EpisodeButtons
            episodes={localEpisodes}
            displayMax={displayMax}
            onEpisodeClick={onEpisodeClick}
            editMode={editMode}
          />
        </div>
      </td>
    </tr>
  );
}
