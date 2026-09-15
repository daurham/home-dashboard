/**
 * Latency Sparklines side-tab.
 * Probes run only in home-ai; this UI polls GET /api/latency/snapshot.
 * Adding a target: edit home-ai/node-api/latency-targets.js
 * Setup guide: docs/latency-sparklines-setup.md
 */
import { useCallback, useEffect, useState } from 'react';
import { LatencyCard } from '@/components/latency/LatencyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchLatencySnapshot } from '@/services/latencyService';
import { formatCheckedAgo } from '@/lib/latency/format';
import type { LatencySnapshot } from '@/lib/latency/format';

const POLL_MS = 20_000;

export function LatencySparklinesTab() {
  const [snapshot, setSnapshot] = useState<LatencySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    try {
      const next = await fetchLatencySnapshot();
      setSnapshot(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load latency snapshot');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let intervalId: number | undefined;

    const start = () => {
      window.clearInterval(intervalId);
      if (document.visibilityState === 'hidden') return;
      void load();
      intervalId = window.setInterval(() => {
        void load();
      }, POLL_MS);
    };

    start();
    document.addEventListener('visibilitychange', start);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', start);
    };
  }, [load]);

  const latestCheck = snapshot?.targets.reduce<string | null>((acc, t) => {
    if (!t.checkedAt) return acc;
    if (!acc || t.checkedAt > acc) return t.checkedAt;
    return acc;
  }, null) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-foreground">Latency Sparklines</h2>
          <p className="text-muted-foreground">
            Live-ish checks from home-ai. The browser only reads a snapshot.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Last checked {formatCheckedAgo(latestCheck)}
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && !snapshot && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[108px] rounded-lg" />
          ))}
        </div>
      )}

      {snapshot && snapshot.targets.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center text-muted-foreground">
          No probe targets configured. Add allowlisted entries in{' '}
          <code className="text-foreground">home-ai/node-api/latency-targets.js</code> and restart node-api.
        </div>
      )}

      {snapshot && snapshot.targets.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {snapshot.targets.map((target) => (
            <LatencyCard key={target.id} target={target} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Targets are an allowlist in <code className="text-foreground/80">node-api/latency-targets.js</code>
        {' '}(http, tcp, postgres, ollama). See{' '}
        <span className="text-foreground/80">docs/latency-sparklines-setup.md</span> to make another app probe-friendly.
      </p>
    </div>
  );
}
