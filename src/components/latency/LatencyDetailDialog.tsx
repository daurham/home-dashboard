import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LatencySparkline } from '@/components/latency/LatencySparkline';
import {
  describeEndpoint,
  describeProbe,
  formatCheckedAgo,
  formatDuration,
  formatLatency,
  formatSampleWindow,
  summarizeSamples,
} from '@/lib/latency/format';
import type { LatencyStatus, LatencyTargetSnapshot } from '@/lib/latency/format';
import { cn } from '@/lib/utils';

const DOT: Record<LatencyStatus, string> = {
  up: 'bg-emerald-500',
  degraded: 'bg-amber-400',
  down: 'bg-red-500',
};

const STATUS_LABEL: Record<LatencyStatus, string> = {
  up: 'Up',
  degraded: 'Degraded',
  down: 'Down',
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function LatencyDetailDialog({
  target,
  onClose,
}: {
  target: LatencyTargetSnapshot | null;
  onClose: () => void;
}) {
  const stats = target ? summarizeSamples(target.samples) : null;

  return (
    <Dialog open={target !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        {target && stats && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', DOT[target.status])} />
                {target.name}
                <span className="text-xs font-normal text-muted-foreground">{STATUS_LABEL[target.status]}</span>
              </DialogTitle>
              <DialogDescription>
                {describeProbe(target.type)} every {formatDuration(target.intervalMs)}, run by the server.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Endpoint</p>
                <p className="break-all rounded-md bg-muted/50 px-2 py-1.5 font-mono text-xs">
                  {describeEndpoint(target)}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Sparkline</p>
                <LatencySparkline
                  samples={target.samples}
                  status={target.status}
                  className="h-14 w-full rounded-md bg-muted/40 px-1"
                />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  One point per check, oldest on the left — {formatSampleWindow(stats.total, target.intervalMs)}. Height
                  is relative to the slowest check in the window
                  {stats.max != null ? ` (${stats.max}ms)` : ''}, and gaps are checks that failed.
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <Stat label="Now" value={formatLatency(target.latencyMs, target.status)} />
                <Stat label="Average" value={stats.avg != null ? `${stats.avg}ms` : '—'} />
                <Stat label="Fastest" value={stats.min != null ? `${stats.min}ms` : '—'} />
                <Stat label="Slowest" value={stats.max != null ? `${stats.max}ms` : '—'} />
              </dl>

              <p className="text-[11px] text-muted-foreground">
                Checked {formatCheckedAgo(target.checkedAt)} · {stats.failures} failed of {stats.total} in this window.
              </p>

              {target.error && (
                <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">{target.error}</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
