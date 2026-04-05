'use client';

import { useState } from 'react';
import { DAYS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface AddAnimeDrawerProps {
  onClose: () => void;
  onAdd: () => void;
  seasonId: string;
}

export function AddAnimeDrawer({ onClose, onAdd, seasonId }: AddAnimeDrawerProps) {
  const [malId, setMalId] = useState('');
  const [day, setDay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/anime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createAnime',
          malId: parseInt(malId),
          day,
          seasonId,
        }),
      });

      if (!res.ok) throw new Error('Failed to add anime');
      
      onClose();
      onAdd();
    } catch (err) {
      setError('Error al agregar anime');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="w-full max-w-md rounded-lg bg-[#18181b] p-6 shadow-xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-100">Agregar Anime</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm text-zinc-400 mb-1">MAL ID</label>
              <input
                type="number"
                value={malId}
                onChange={(e) => setMalId(e.target.value)}
                placeholder="Ej: 51111"
                className="w-full rounded bg-zinc-800 px-3 py-2 text-zinc-200 border border-zinc-700 focus:outline-none focus:border-indigo-500"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm text-zinc-400 mb-1">Día de emisión</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full rounded bg-zinc-800 px-3 py-2 text-zinc-200 border border-zinc-700 focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="">Seleccionar día</option>
                {DAYS.map(d => (
                  <option key={d} value={d} className="capitalize">{d}</option>
                ))}
              </select>
            </motion.div>

            {error && (
              <motion.p 
                className="text-sm text-red-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <motion.button
                type="submit"
                disabled={loading}
                className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Agregando...' : 'Agregar'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}