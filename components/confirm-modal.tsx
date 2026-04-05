'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="bg-[#18181b] border-zinc-800 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{title}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <motion.div 
            className="flex justify-end gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <motion.button
              onClick={onConfirm}
              className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Eliminar
            </motion.button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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