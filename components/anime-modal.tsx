'use client';

import { useUIStore } from '@/store/ui-store';
import { STATUS_LABELS, COLORS } from '@/lib/constants';
import type { Anime, User, UserStatus } from '@/types';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AnimeModalProps {
  anime: Anime;
}

export function AnimeModal({ anime }: AnimeModalProps) {
  const { modalOpen, closeModal } = useUIStore();

  const getStatusColor = (status: UserStatus) => {
    const statusKey = status.replace(' ', '_') as keyof typeof COLORS.status;
    return COLORS.status[statusKey] || COLORS.status.pendiente;
  };

  return (
    <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="bg-[#18181b] border-zinc-800 max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <div className="flex gap-4">
              {anime.imageUrl && (
                <motion.img
                  src={anime.imageUrl}
                  alt={anime.title}
                  className="h-48 w-36 rounded-lg object-cover"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                />
              )}
              
              <div className="flex-1">
                <motion.div 
                  className="flex items-start justify-between"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-100">{anime.title}</h2>
                    <p className="text-sm text-zinc-500 capitalize">{anime.day} · {anime.episodes} episodes</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="mt-6 space-y-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  {(['eze', 'pancho'] as User[]).map((user, index) => (
                    <motion.div 
                      key={user} 
                      className="border-t border-zinc-800 pt-4"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                    >
                      <h3 className="text-sm font-medium text-zinc-400 uppercase mb-2">{user}</h3>
                      
                      <div className="flex items-center gap-4">
                        <motion.span 
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: getStatusColor(anime.users[user].status) }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4 + index * 0.1, type: 'spring' as const }}
                        />
                        <span className="text-zinc-200">{STATUS_LABELS[anime.users[user].status]}</span>
                        <span className="text-zinc-500">
                          {anime.users[user].episodesWatched.length}/{anime.episodes} episodes
                        </span>
                      </div>

                      {anime.users[user].opinion && (
                        <motion.div 
                          className="mt-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <p className="text-sm text-zinc-400 italic">"{anime.users[user].opinion}"</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}

                  {anime.jikanUrl && (
                    <motion.a
                      href={anime.jikanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-400 hover:text-indigo-300"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      Ver en MyAnimeList →
                    </motion.a>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}