import { Card } from '@/components/ui/card';
import { LatencySparkline } from '@/components/latency/LatencySparkline';
import { cn } from '@/lib/utils';
import { formatLatency } from '@/lib/latency/format';
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
}

export function LatencyCard({ target }: LatencyCardProps) {
  const latencyLabel = formatLatency(target.latencyMs, target.status);

  return (
    <Card className="border-border/80 bg-card px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn('h-2 w-2 shrink-0 rounded-full', DOT[target.status])}
            title={target.status}
            aria-label={target.status}
          />
          <h3 className="truncate text-sm font-medium text-foreground">{target.name}</h3>
        </div>
        {target.error && target.status === 'down' && (
          <span className="max-w-[45%] truncate text-[11px] text-muted-foreground" title={target.error}>
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
    </Card>
  );
}
