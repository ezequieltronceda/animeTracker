'use client';

import { useState } from 'react';

interface EpisodeButtonsProps {
  episodes: number[];
  displayMax: number;
  onEpisodeClick: (episode: number) => void;
  editMode: boolean;
}

export function EpisodeButtons({ episodes, displayMax, onEpisodeClick, editMode }: EpisodeButtonsProps) {
  const [currentBlock, setCurrentBlock] = useState(0);
  const safeMax = Math.max(displayMax, 1);
  const blocks = Math.ceil(safeMax / 25);
  const startEpisode = currentBlock * 25 + 1;
  const endEpisode = Math.min((currentBlock + 1) * 25, safeMax);

  return (
    <div className="flex items-center gap-2">
      {blocks > 1 && (
        <button
          onClick={() => setCurrentBlock(Math.max(0, currentBlock - 1))}
          disabled={currentBlock === 0 || !editMode}
          className="rounded bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400 disabled:opacity-30 hover-lift transition-all"
        >
          ←
        </button>
      )}
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: Math.max(0, endEpisode - startEpisode + 1) }, (_, i) => {
          const episode = startEpisode + i;
          const isWatched = episodes.includes(episode);
          return (
            <button
              key={episode}
              onClick={() => onEpisodeClick(episode)}
              disabled={!editMode}
              className={`h-7 w-7 text-xs rounded-md transition-all hover-lift ${
                isWatched 
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : editMode
                    ? 'bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700 hover:scale-110'
                    : 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed'
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
          className="rounded bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-400 disabled:opacity-30 hover-lift transition-all"
        >
          →
        </button>
      )}
    </div>
  );
}
