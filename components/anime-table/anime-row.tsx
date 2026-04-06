'use client';

import { useState } from 'react';
import { DAYS, STATUS_LABELS } from '@/lib/constants';
import { StatusBadge } from './status-badge';
import { UserSubrow } from './user-subrow';
import { MaxEpisodeInput } from './max-episode-input';
import type { Anime, User, UserStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink } from 'lucide-react';
import { toMALSlug } from '@/lib/utils';

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
      <motion.tr 
        className="cursor-pointer border-b border-zinc-800/50 hover:bg-zinc-800/70 hover-lift transition-all duration-200"
        onClick={handleRowExpand}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: animationDelay / 1000 }}
      >
        <td className="p-2 lg:p-4 text-zinc-500 font-mono text-xs lg:text-sm">{String(anime.order).padStart(2, '0')}</td>
        <td className="p-2 lg:p-4">
          <div className="flex items-center gap-2 lg:gap-4">
            {anime.imageUrl && (
              <img 
                src={anime.imageUrl} 
                alt={anime.title}
                className="h-12 lg:h-20 w-8 lg:w-14 rounded-lg object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
              />
            )}
            <div className="flex flex-col gap-0 lg:gap-1">
              <div className="flex items-center gap-1">
                <span className="font-medium text-zinc-200 text-sm lg:text-base leading-tight line-clamp-2">{anime.title}</span>
                <a
                  href={`https://myanimelist.net/anime/${anime.malId}/${toMALSlug(anime.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 text-zinc-500 hover:text-indigo-400 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <span className="text-xs lg:text-sm text-amber-400 flex items-center gap-1">
                <span className="text-amber-500">★</span>
                {anime.score ? anime.score.toFixed(1) : '-'}
              </span>
            </div>
          </div>
        </td>
        <td className="p-2 lg:p-4">
          {editMode ? (
            <Select
              value={anime.day || ''}
              onValueChange={(value) => onDayChange(value || '')}
            >
              <SelectTrigger className="h-6 lg:h-7 text-xs bg-zinc-800 border-zinc-700 text-zinc-300 w-[70px] lg:w-[80px]">
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-</SelectItem>
                <SelectItem value="undefined">Aún no definido</SelectItem>
                {DAYS.map(d => (
                  <SelectItem key={d} value={d} className="capitalize">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-zinc-400 capitalize text-xs lg:text-sm">
              {anime.day === 'undefined' ? 'Aún no definido' : (DAYS.includes(anime.day as typeof DAYS[number]) ? anime.day : '-')}
            </span>
          )}
        </td>
        <td className="p-2 lg:p-4">
          {editMode ? (
            <Select
              value={getLocalStatus('eze')}
              onValueChange={(value) => onStatusChange('eze', value as UserStatus)}
            >
              <SelectTrigger className="h-6 lg:h-7 text-xs bg-zinc-800 border-zinc-700 text-zinc-300 w-[80px] lg:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <StatusBadge 
              status={anime.users.eze.status} 
              color={getStatusColor(anime.users.eze.status)}
              progress={getEpisodeCount('eze')}
            />
          )}
        </td>
        <td className="p-2 lg:p-4">
          {editMode ? (
            <Select
              value={getLocalStatus('pancho')}
              onValueChange={(value) => onStatusChange('pancho', value as UserStatus)}
            >
              <SelectTrigger className="h-6 lg:h-7 text-xs bg-zinc-800 border-zinc-700 text-zinc-300 w-[80px] lg:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <StatusBadge 
              status={anime.users.pancho.status} 
              color={getStatusColor(anime.users.pancho.status)}
              progress={getEpisodeCount('pancho')}
            />
          )}
        </td>
        <td className="p-2 lg:p-2 text-zinc-400 text-xs lg:text-sm">{anime.episodes || '?'}</td>
        {editMode && (
          <td className="p-2 lg:p-4">
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
                className="rounded bg-zinc-700 px-1 lg:px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-600"
              >
                <span className="hidden sm:inline">Máx ({getDisplayMax('eze')})</span>
                <span className="sm:hidden">M</span>
              </button>
            )}
            <div className="flex items-center gap-1 mt-1">
              {hasChanges && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave();
                  }}
                  className="text-xs bg-indigo-600 text-white px-1 lg:px-2 py-1 rounded hover:bg-indigo-500"
                >
                  <span className="hidden sm:inline">Guardar</span>
                  <span className="sm:inline">✓</span>
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
      </motion.tr>
      
      <AnimatePresence>
        {expanded && (
          <motion.tr 
            className="border-b border-zinc-800/50 bg-zinc-900/50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
          <td colSpan={editMode ? 7 : 6} className="p-2 lg:p-4">
            <motion.div 
              className="flex flex-col lg:flex-row gap-3 lg:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {anime.imageUrl && (
                <div className="flex-shrink-0 flex justify-center lg:justify-start">
                  <motion.img 
                    src={anime.imageUrl} 
                    alt={anime.title}
                    className="h-40 lg:h-64 w-auto max-w-[200px] lg:max-w-none rounded-xl object-cover shadow-2xl"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  />
                </div>
              )}
              <div className="flex-1 flex flex-col gap-2 lg:gap-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2">
                  <h3 className="text-base lg:text-xl font-bold text-zinc-100">{anime.title}</h3>
                  {anime.score && (
                    <span className="text-sm lg:text-lg text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                      <span className="text-amber-500">★</span>
                      {anime.score.toFixed(1)}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  {users.map((user) => (
                    <div key={user} className="bg-zinc-800/50 rounded-lg p-2 lg:p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-zinc-300 uppercase">{user}</span>
                        {editMode ? (
                          <Select
                            value={getLocalStatus(user)}
                            onValueChange={(value) => onStatusChange(user, value as UserStatus)}
                          >
                            <SelectTrigger className="h-6 text-xs bg-zinc-700 border-zinc-600 text-zinc-300 w-[80px] lg:w-[90px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span 
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: getStatusColor(getLocalStatus(user)) }}
                          />
                        )}
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
                              className={`h-5 w-5 lg:h-6 lg:w-6 text-xs rounded-md transition-all hover:scale-110 ${
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
            </motion.div>
          </td>
        </motion.tr>
        )}
      </AnimatePresence>
      
      {/* Keep subrows hidden for now - we have the expanded view above */}
    </>
  );
}
