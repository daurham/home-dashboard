export type LatencyStatus = 'up' | 'degraded' | 'down';
export type LatencyTargetType = 'http' | 'tcp' | 'postgres' | 'ollama';

export interface LatencyTargetSnapshot {
  id: string;
  name: string;
  type: LatencyTargetType;
  status: LatencyStatus;
  latencyMs: number | null;
  checkedAt: string | null;
  error?: string;
  samples: Array<number | null>;
  intervalMs: number;
}

export interface LatencySnapshot {
  targets: LatencyTargetSnapshot[];
  generatedAt: string;
}

export function buildSparklinePolylines(
  samples: Array<number | null>,
  width: number,
  height: number,
): string[] {
  const n = samples.length;
  if (n === 0) return [];

  const nums = samples.filter((s): s is number => typeof s === 'number' && Number.isFinite(s));
  const max = Math.max(1, ...nums);
  const pad = 2;
  const usableH = height - pad * 2;
  const step = n === 1 ? 0 : width / (n - 1);

  const polylines: string[] = [];
  let current: string[] = [];

  samples.forEach((sample, i) => {
    if (sample == null || !Number.isFinite(sample)) {
      if (current.length) {
        polylines.push(current.join(' '));
        current = [];
      }
      return;
    }
    const x = n === 1 ? width / 2 : i * step;
    const y = pad + usableH - (sample / max) * usableH;
    current.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });

  if (current.length) polylines.push(current.join(' '));
  return polylines;
}

export function formatCheckedAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return 'not yet checked';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 'not yet checked';
  const diff = Math.max(0, now - t);
  const seconds = Math.round(diff / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function formatLatency(latencyMs: number | null, status: LatencyStatus): string {
  if (status === 'down' || latencyMs == null) return 'down';
  return `${Math.round(latencyMs)}ms`;
}
