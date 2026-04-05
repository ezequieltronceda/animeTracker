'use client';

import { useUIStore } from '@/store/ui-store';
import { STATUS_LABELS, COLORS } from '@/lib/constants';
import type { Anime, User, UserStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface AnimeModalProps {
  anime: Anime;
}

const modalVariants: Variants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export function AnimeModal({ anime }: AnimeModalProps) {
  const { closeModal } = useUIStore();

  const getStatusColor = (status: UserStatus) => {
    const statusKey = status.replace(' ', '_') as keyof typeof COLORS.status;
    return COLORS.status[statusKey] || COLORS.status.pendiente;
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={closeModal}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div 
          className="w-full max-w-2xl rounded-lg bg-[#18181b] p-6 shadow-xl overflow-y-auto max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
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
                <button
                  onClick={closeModal}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  ✕
                </button>
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}