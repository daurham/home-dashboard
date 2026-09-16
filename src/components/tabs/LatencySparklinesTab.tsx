/**
 * Latency Sparklines side-tab.
 * Probes run only in home-ai; this UI polls GET /api/latency/snapshot.
 * Adding a target: this tab (stored in Postgres) or home-ai/node-api/latency-targets.js for built-ins
 * Setup guide: docs/latency-sparklines-setup.md
 */
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { LatencyCard } from '@/components/latency/LatencyCard';
import { LatencyDetailDialog } from '@/components/latency/LatencyDetailDialog';
import { LatencyTargetDialog } from '@/components/latency/LatencyTargetDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchLatencySnapshot, fetchLatencyTargets } from '@/services/latencyService';
import { formatCheckedAgo } from '@/lib/latency/format';
import type { LatencySnapshot, LatencyTargetConfig } from '@/lib/latency/format';

const POLL_MS = 20_000;

export function LatencySparklinesTab() {
  const [snapshot, setSnapshot] = useState<LatencySnapshot | null>(null);
  const [targets, setTargets] = useState<LatencyTargetConfig[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadTargets = useCallback(async () => {
    try {
      setTargets(await fetchLatencyTargets());
    } catch {
      // An older backend has no /targets route; the read-only view still works.
      setTargets([]);
    }
  }, []);

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
    void loadTargets();
  }, [loadTargets]);

  const editable = new Map(
    targets.filter((target) => target.source === 'database').map((target) => [target.id, target]),
  );
  const editingTarget = editingId ? editable.get(editingId) ?? null : null;

  const openEditor = (id: string | null) => {
    setEditingId(id);
    setEditorOpen(true);
  };

  const afterSave = () => {
    void loadTargets();
    void load();
  };

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
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Last checked {formatCheckedAgo(latestCheck)}
          </p>
          <Button size="sm" onClick={() => openEditor(null)}>
            <Plus className="h-4 w-4" />
            Add target
          </Button>
        </div>
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
          No probe targets yet. Use <span className="text-foreground">Add target</span> to create one.
        </div>
      )}

      {snapshot && snapshot.targets.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {snapshot.targets.map((target) => (
            <LatencyCard
              key={target.id}
              target={target}
              onSelect={() => setDetailId(target.id)}
              onEdit={editable.has(target.id) ? () => openEditor(target.id) : undefined}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Targets added here are stored in the database and probed by home-ai (http, tcp, postgres, ollama). The three
        built-ins come from <code className="text-foreground/80">node-api/latency-targets.js</code> and are edited there.
        See <span className="text-foreground/80">docs/latency-sparklines-setup.md</span> to make another app
        probe-friendly.
      </p>

      <LatencyDetailDialog
        target={snapshot?.targets.find((target) => target.id === detailId) ?? null}
        onClose={() => setDetailId(null)}
      />

      <LatencyTargetDialog
        open={editorOpen}
        target={editingTarget}
        onOpenChange={setEditorOpen}
        onSaved={afterSave}
      />
    </div>
  );
}
