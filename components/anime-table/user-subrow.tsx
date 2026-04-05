'use client';

import { useState } from 'react';
import { STATUS_LABELS } from '@/lib/constants';
import { EpisodeButtons } from './episode-buttons';
import { MaxEpisodeInput } from './max-episode-input';
import type { Anime, User, UserStatus } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
            <Select
              value={localStatus}
              onValueChange={(value) => onStatusChange(value as UserStatus)}
              disabled={!editMode}
            >
              <SelectTrigger className={`h-7 text-xs w-[120px] ${
                editMode 
                  ? 'bg-zinc-800 text-zinc-300 border-zinc-700' 
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800'
              }`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
