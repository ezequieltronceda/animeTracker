'use client';

export function ProgressBar({
  value,
  max,
  color,
  dim,
  height = 4,
}: {
  value: number;
  max: number;
  color: string;
  dim: boolean;
  height?: number;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className="flex-1 overflow-hidden rounded-full bg-white/[.07]"
      style={{ height }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: dim ? 'rgba(255,255,255,.18)' : color,
          transition:
            'width .55s cubic-bezier(.22,.61,.36,1), background .25s ease',
          boxShadow: dim ? 'none' : `0 0 8px ${color}55`,
        }}
      />
    </div>
  );
}
