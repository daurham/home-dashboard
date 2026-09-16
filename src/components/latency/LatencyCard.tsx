import { Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LatencySparkline } from '@/components/latency/LatencySparkline';
import { cn } from '@/lib/utils';
import { describeEndpoint, formatLatency } from '@/lib/latency/format';
import type { LatencyStatus, LatencyTargetSnapshot } from '@/lib/latency/format';

const DOT: Record<LatencyStatus, string> = {
  up: 'bg-emerald-400 shadow-[0_0_8px_hsl(152_76%_40%/0.55)]',
  degraded: 'bg-amber-400 shadow-[0_0_8px_hsl(38_92%_50%/0.5)]',
  down: 'bg-red-500 shadow-[0_0_8px_hsl(0_72%_51%/0.5)]',
};

const LATENCY_COLOR: Record<LatencyStatus, string> = {
  up: 'text-emerald-400',
  degraded: 'text-amber-400',
  down: 'text-red-400',
};

interface LatencyCardProps {
  target: LatencyTargetSnapshot;
  onSelect?: () => void;
  /** Only set for targets stored in the database, which are the editable ones. */
  onEdit?: () => void;
}

export function LatencyCard({ target, onSelect, onEdit }: LatencyCardProps) {
  const latencyLabel = formatLatency(target.latencyMs, target.status);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn('h-2 w-2 shrink-0 rounded-full', DOT[target.status])}
            title={target.status}
            aria-label={target.status}
          />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-foreground">{target.name}</h3>
            <p className="truncate font-mono text-[10px] text-muted-foreground">{describeEndpoint(target)}</p>
          </div>
        </div>
        {target.error && target.status === 'down' && (
          <span
            className={cn('max-w-[45%] truncate text-[11px] text-muted-foreground', onEdit && 'mr-6')}
            title={target.error}
          >
            {target.error}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className={cn('font-semibold tabular-nums leading-none tracking-tight', LATENCY_COLOR[target.status], 'text-3xl')}>
          {latencyLabel}
        </div>
        <div className="flex flex-col items-end">
          <span className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Sparkline
          </span>
          <LatencySparkline samples={target.samples} status={target.status} />
        </div>
      </div>
    </>
  );

  return (
    <Card className="relative border-border/80 bg-card px-4 py-3 shadow-sm">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${target.name}`}
          title={`Edit ${target.name}`}
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          title={`${target.name} — show endpoint and sparkline details`}
          className="w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </button>
      ) : (
        body
      )}
    </Card>
  );
}
