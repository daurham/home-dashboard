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
  /** What the server probes, e.g. a URL, host:port, or the env var holding a DSN. */
  endpoint?: string;
}

export interface LatencySnapshot {
  targets: LatencyTargetSnapshot[];
  generatedAt: string;
}

/** Probe configuration. `config` targets live in the server file; `database` ones are editable here. */
export interface LatencyTargetConfig {
  id: string;
  name: string;
  type: LatencyTargetType;
  url?: string;
  method?: 'GET' | 'POST';
  expectStatus?: number[];
  expectBodyIncludes?: string;
  host?: string;
  port?: number;
  connectionStringEnv?: string;
  intervalMs: number;
  timeoutMs: number;
  degradedThresholdMs: number;
  sampleCapacity: number;
  enabled: boolean;
  source: 'config' | 'database';
}

export type LatencyTargetWriteBody = Partial<Omit<LatencyTargetConfig, 'source' | 'id'>> & {
  name: string;
  type: LatencyTargetType;
};

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

export interface LatencySampleStats {
  /** Samples in the window, including failed checks. */
  total: number;
  /** Checks that returned a time. */
  measured: number;
  failures: number;
  latest: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
}

export function summarizeSamples(samples: Array<number | null>): LatencySampleStats {
  const measured = samples.filter((sample): sample is number => typeof sample === 'number' && Number.isFinite(sample));
  const latest = measured.length ? measured[measured.length - 1] : null;

  return {
    total: samples.length,
    measured: measured.length,
    failures: samples.length - measured.length,
    latest,
    min: measured.length ? Math.min(...measured) : null,
    max: measured.length ? Math.max(...measured) : null,
    avg: measured.length ? Math.round(measured.reduce((sum, value) => sum + value, 0) / measured.length) : null,
  };
}

const PROBE_LABELS: Record<LatencyTargetType, string> = {
  http: 'HTTP request',
  tcp: 'TCP connection',
  postgres: 'Postgres query',
  ollama: 'Ollama HTTP request',
};

export function describeProbe(type: LatencyTargetType): string {
  return PROBE_LABELS[type] ?? 'Probe';
}

/** Older backends do not send the endpoint, so fall back to what the probe type implies. */
export function describeEndpoint(target: Pick<LatencyTargetSnapshot, 'endpoint' | 'type'>): string {
  if (target.endpoint) return target.endpoint;
  if (target.type === 'postgres') return 'Database connection configured on the server';
  return 'Configured on the server';
}

export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)}h`;
}

/** How much history a sparkline covers, e.g. "90 checks · about 45 min". */
export function formatSampleWindow(sampleCount: number, intervalMs: number): string {
  if (sampleCount <= 0) return 'no checks yet';
  const checks = `${sampleCount} check${sampleCount === 1 ? '' : 's'}`;
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return checks;
  return `${checks} · about ${formatDuration(sampleCount * intervalMs)}`;
}
