'use client';

import { STATUS_LABELS } from '@/lib/constants';
import { Skull } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  color: string;
  progress: string;
}

export function StatusBadge({ status, color, progress }: StatusBadgeProps) {
  const isPedilo = status === 'ni_en_un_millon';

  return (
    <div className="flex items-center gap-2 glass rounded-full px-2 py-1 w-fit">
      {isPedilo ? (
        <Skull className="h-3 w-3" style={{ color }} />
      ) : (
        <span
          className="h-2 w-2 rounded-full animate-pulse"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-xs text-zinc-300">{STATUS_LABELS[status] || status}</span>
      <span className="text-xs text-zinc-500 font-mono">{progress}</span>
    </div>
  );
}
