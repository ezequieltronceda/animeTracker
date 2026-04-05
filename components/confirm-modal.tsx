'use client';

import { useState } from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-[#18181b] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h2>
        <p className="text-sm text-zinc-400 mb-4">{message}</p>
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
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