import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:px-6 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-white/5 bg-white/[.025]"
        >
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="space-y-3 p-3.5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 flex-1" />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
