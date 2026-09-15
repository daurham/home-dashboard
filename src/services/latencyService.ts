import type { LatencySnapshot, LatencyTargetSnapshot } from '@/lib/latency/format';
import { latencyApi } from '@/services/apiService';

export type { LatencySnapshot, LatencyTargetSnapshot };

export async function fetchLatencySnapshot(): Promise<LatencySnapshot> {
  return latencyApi.snapshot();
}
