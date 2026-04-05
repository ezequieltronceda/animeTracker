'use client';

import { useUIStore } from '@/store/ui-store';
import { STATUS_LABELS, COLORS } from '@/lib/constants';
import type { Anime, User, UserStatus } from '@/types';

interface AnimeModalProps {
  anime: Anime;
}

export function AnimeModal({ anime }: AnimeModalProps) {
  const { closeModal } = useUIStore();

  const getStatusColor = (status: UserStatus) => {
    const statusKey = status.replace(' ', '_') as keyof typeof COLORS.status;
    return COLORS.status[statusKey] || COLORS.status.pendiente;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={closeModal}
    >
      <div 
        className="w-full max-w-2xl rounded-lg bg-[#18181b] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          {anime.imageUrl && (
            <img
              src={anime.imageUrl}
              alt={anime.title}
              className="h-48 w-36 rounded-lg object-cover"
            />
          )}
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">{anime.title}</h2>
                <p className="text-sm text-zinc-500 capitalize">{anime.day} · {anime.episodes} episodes</p>
              </div>
              <button
                onClick={closeModal}
                className="text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {(['eze', 'pancho'] as User[]).map((user) => (
                <div key={user} className="border-t border-zinc-800 pt-4">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase mb-2">{user}</h3>
                  
                  <div className="flex items-center gap-4">
                    <span 
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: getStatusColor(anime.users[user].status) }}
                    />
                    <span className="text-zinc-200">{STATUS_LABELS[anime.users[user].status]}</span>
                    <span className="text-zinc-500">
                      {anime.users[user].episodesWatched.length}/{anime.episodes} episodes
                    </span>
                  </div>

                  {anime.users[user].opinion && (
                    <div className="mt-2">
                      <p className="text-sm text-zinc-400 italic">"{anime.users[user].opinion}"</p>
                    </div>
                  )}
                </div>
              ))}

              <a
                href={anime.jikanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                Ver en MyAnimeList →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}