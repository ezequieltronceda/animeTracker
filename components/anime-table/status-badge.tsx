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
    <div className="flex items-center gap-2">
      <span 
        className="h-2 w-2 rounded-full" 
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-zinc-400">{STATUS_LABELS[status] || status}</span>
      <span className="text-xs text-zinc-600">{progress}</span>
    </div>
  );
}
