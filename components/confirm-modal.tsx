'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div 
          className="w-full max-w-sm rounded-lg bg-[#18181b] p-6 shadow-xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.h2 
            className="text-lg font-semibold text-zinc-100 mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {title}
          </motion.h2>
          <motion.p 
            className="text-sm text-zinc-400 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {message}
          </motion.p>
          
          <motion.div 
            className="flex justify-end gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={onCancel}
              className="rounded px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </button>
            <motion.button
              onClick={onConfirm}
              className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Eliminar
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface DeleteConfirmState {
  show: boolean;
  animeId?: string;
  animeTitle?: string;
  seasonId?: string;
}

export function useDeleteConfirm() {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ show: false });

  const showDeleteConfirm = (animeId: string, animeTitle: string, seasonId: string) => {
    setDeleteConfirm({ show: true, animeId, animeTitle, seasonId });
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirm({ show: false });
  };

  return { deleteConfirm, showDeleteConfirm, hideDeleteConfirm };
}