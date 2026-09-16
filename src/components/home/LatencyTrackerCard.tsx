import { useCallback, useEffect, useState } from 'react';
import { HubCard } from '@/components/home/HubCard';
import { LatencySparkline } from '@/components/latency/LatencySparkline';
import { LatencyDetailDialog } from '@/components/latency/LatencyDetailDialog';
import { fetchLatencySnapshot } from '@/services/latencyService';
import { formatCheckedAgo, formatLatency } from '@/lib/latency/format';
import type { LatencySnapshot, LatencyStatus, LatencyTargetSnapshot } from '@/lib/latency/format';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { FetchSkeleton } from '@/components/ui/fetch-skeleton';

const DOT: Record<LatencyStatus, string> = {
  up: 'bg-emerald-500',
  degraded: 'bg-amber-400',
  down: 'bg-red-500',
};

const TONE: Record<LatencyStatus, string> = {
  up: 'border-l-emerald-500 bg-emerald-500/5',
  degraded: 'border-l-amber-400 bg-amber-400/10',
  down: 'border-l-red-500 bg-red-500/5',
};

const LATENCY_TEXT: Record<LatencyStatus, string> = {
  up: 'text-foreground',
  degraded: 'text-amber-600 dark:text-amber-400',
  down: 'text-red-600 dark:text-red-400',
};

export function LatencyTrackerCard({ onSynced, compact = false }: { onSynced?: (at: Date) => void; compact?: boolean }) {
  const [snapshot, setSnapshot] = useState<LatencySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const setActiveSidebarTab = useUIStore((s) => s.setActiveSidebarTab);

  const load = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const next = await fetchLatencySnapshot();
      setSnapshot(next);
      setError(null);
      onSynced?.(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load latency');
    }
  }, [onSynced]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 20_000);
    return () => window.clearInterval(id);
  }, [load]);

  const latestCheck = snapshot?.targets.reduce<string | null>((acc, target) => {
    if (!target.checkedAt) return acc;
    if (!acc || target.checkedAt > acc) return target.checkedAt;
    return acc;
  }, null) ?? null;

  const targets = snapshot?.targets ?? [];
  const upCount = targets.filter((target) => target.status === 'up').length;
  // Two columns once a single column would squeeze rows below a readable height.
  const twoCol = compact ? targets.length >= 5 : targets.length >= 7;
  const detail = targets.find((target) => target.id === detailId) ?? null;

  const renderRow = (target: LatencyTargetSnapshot) => (
    <li key={target.id} className="min-h-0 min-w-0">
      <button
        type="button"
        onClick={() => setDetailId(target.id)}
        title={`${target.name} — show endpoint and sparkline details`}
        className={cn(
          'flex h-full w-full items-center overflow-hidden rounded-lg border-l-2 text-left',
          'hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          TONE[target.status],
          compact ? 'gap-2 px-2' : 'gap-2.5 px-2.5',
        )}
      >
        <span className={cn('shrink-0 rounded-full', DOT[target.status], compact ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
        <span className={cn('min-w-0 flex-1 truncate font-medium leading-none', compact ? 'text-[11px]' : 'text-sm')}>
          {target.name}
        </span>
        <LatencySparkline
          samples={target.samples}
          status={target.status}
          className={cn('min-w-0 shrink-0', compact ? 'h-5 w-[38%] max-w-[9rem]' : 'h-7 w-[40%] max-w-[12rem]')}
        />
        <span
          className={cn(
            'shrink-0 text-right font-medium tabular-nums leading-none',
            LATENCY_TEXT[target.status],
            compact ? 'w-10 text-[10px]' : 'w-14 text-xs',
          )}
        >
          {formatLatency(target.latencyMs, target.status)}
        </span>
      </button>
    </li>
  );

  return (
    <HubCard className={compact ? 'p-2' : 'p-3'}>
      <div className={cn('flex items-center justify-between gap-2', compact ? 'mb-1' : 'mb-2')}>
        <div className="min-w-0">
          <h2 className={cn('font-semibold leading-tight', compact ? 'text-[11px]' : 'text-sm')}>
            {compact ? 'Latency' : 'Latency Tracker'}
          </h2>
          <p className={cn('truncate text-muted-foreground', compact ? 'text-[9px]' : 'text-[11px]')}>
            {snapshot
              ? `${upCount}/${targets.length} up · ${formatCheckedAgo(latestCheck)}`
              : 'Checking probes'}
          </p>
        </div>
        <button
          type="button"
          className={cn('text-muted-foreground hover:text-foreground', compact ? 'text-[10px]' : 'text-xs')}
          onClick={() => setActiveSidebarTab('latency')}
        >
          All
        </button>
      </div>

      {error && (
        <p className={cn('mb-1 truncate rounded-md bg-destructive/10 text-destructive', compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[11px]')}>
          {error}
        </p>
      )}

      {!snapshot && !error ? (
        <FetchSkeleton
          lines={compact ? 4 : 5}
          lineClassName={compact ? 'h-7 rounded-lg' : 'h-9 rounded-lg'}
          className="min-h-0 flex-1"
        />
      ) : (
      <ul
        className={cn('grid min-h-0 flex-1 overflow-hidden', compact ? 'gap-1' : 'gap-1.5', twoCol && 'grid-cols-2')}
        style={{ gridAutoRows: 'minmax(0, 1fr)' }}
      >
        {targets.map(renderRow)}
        {snapshot && targets.length === 0 && (
          <li className="flex items-center justify-center px-2 text-center text-xs text-muted-foreground">
            No probe targets configured.
          </li>
        )}
      </ul>
      )}

      <LatencyDetailDialog target={detail} onClose={() => setDetailId(null)} />
    </HubCard>
  );
}
