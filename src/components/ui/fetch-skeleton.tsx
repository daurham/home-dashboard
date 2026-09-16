import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** True until the first fetch for a store has finished (success or failure). */
export function isPendingFetch(hasLoaded: boolean): boolean {
  return !hasLoaded;
}

export function FetchSkeleton({
  lines = 4,
  lineClassName = 'h-14 rounded-xl',
  className,
}: {
  lines?: number;
  lineClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('w-full', lineClassName)} />
      ))}
    </div>
  );
}

export function CalendarFetchSkeleton({ weeks = 5, className }: { weeks?: number; className?: string }) {
  return (
    <div className={cn('space-y-1', className)} role="status" aria-label="Loading calendar">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={`h-${index}`} className="h-4 w-full rounded-md" />
        ))}
      </div>
      {Array.from({ length: weeks }).map((_, row) => (
        <div key={row} className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, col) => (
            <Skeleton key={`${row}-${col}`} className="aspect-square w-full min-h-8 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function HabitFetchSkeleton({ rows = 4, compact = false }: { rows?: number; compact?: boolean }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading habits">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-2">
          <Skeleton className={cn('w-[38%] shrink-0 rounded-md', compact ? 'h-4' : 'h-6')} />
          {Array.from({ length: 7 }).map((_, day) => (
            <Skeleton key={day} className={cn('shrink-0 rounded-full', compact ? 'h-5 w-5' : 'h-7 w-7')} />
          ))}
          <Skeleton className={cn('shrink-0 rounded-md', compact ? 'h-4 w-6' : 'h-6 w-8')} />
        </div>
      ))}
    </div>
  );
}
