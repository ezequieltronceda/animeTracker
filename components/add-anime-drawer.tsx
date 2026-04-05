'use client';

import { useState } from 'react';
import { DAYS } from '@/lib/constants';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-[#18181b] p-6 shadow-xl">
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
          <div>
            <label className="block text-sm text-zinc-400 mb-1">MAL ID</label>
            <input
              type="number"
              value={malId}
              onChange={(e) => setMalId(e.target.value)}
              placeholder="Ej: 51111"
              className="w-full rounded bg-zinc-800 px-3 py-2 text-zinc-200 border border-zinc-700 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
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
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}