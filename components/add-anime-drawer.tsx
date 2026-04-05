'use client';

import { useState } from 'react';
import { DAYS } from '@/lib/constants';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AddAnimeDrawerProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  seasonId: string;
}

export function AddAnimeDrawer({ open, onClose, onAdd, seasonId }: AddAnimeDrawerProps) {
  const [malId, setMalId] = useState('');
  const [day, setDay] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const checkRes = await fetch(`/api/anime?season=${seasonId}`);
      const checkData = await checkRes.json();
      
      if (checkData.animes?.some((a: { malId: number }) => a.malId === parseInt(malId))) {
        setError('Este anime ya está agregado en esta temporada');
        setLoading(false);
        return;
      }

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
      
      setMalId('');
      setDay('');
      onClose();
      onAdd();
    } catch (err) {
      setError('Error al agregar anime');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setMalId('');
      setDay('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#18181b] border-zinc-800 w-[90vw] max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 text-lg">Agregar Anime</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label htmlFor="malId" className="text-zinc-400 text-sm">MAL ID</Label>
            <Input
              id="malId"
              type="number"
              value={malId}
              onChange={(e) => setMalId(e.target.value)}
              placeholder="Ej: 51111"
              className="bg-zinc-800 border-zinc-700 text-zinc-200 mt-1"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label htmlFor="day" className="text-zinc-400 text-sm">Día de emisión</Label>
            <Select value={day} onValueChange={(value) => setDay(value || '')}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200 mt-1">
                <SelectValue placeholder="Seleccionar día" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="undefined">Aún no definido</SelectItem>
                {DAYS.map(d => (
                  <SelectItem key={d} value={d} className="capitalize">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <motion.button
              type="submit"
              disabled={loading}
              className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50 w-full sm:w-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Agregando...' : 'Agregar'}
            </motion.button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}