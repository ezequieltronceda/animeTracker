'use client';

import { STATUS_LABELS } from '@/lib/constants';
import type { UserStatus } from '@/types';

interface StatusBadgeProps {
  status: string;
  color: string;
  progress: string;
}

export function StatusBadge({ status, color, progress }: StatusBadgeProps) {
  return (
    <div className="flex items-center gap-2 glass rounded-full px-2 py-1 w-fit">
      <span 
        className="h-2 w-2 rounded-full animate-pulse" 
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-zinc-300">{STATUS_LABELS[status] || status}</span>
      <span className="text-xs text-zinc-500 font-mono">{progress}</span>
    </div>
  );
}
