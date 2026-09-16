import type {
  LatencySnapshot,
  LatencyTargetConfig,
  LatencyTargetSnapshot,
  LatencyTargetWriteBody,
} from '@/lib/latency/format';
import { latencyApi } from '@/services/apiService';

export type { LatencySnapshot, LatencyTargetConfig, LatencyTargetSnapshot, LatencyTargetWriteBody };

export async function fetchLatencySnapshot(): Promise<LatencySnapshot> {
  return latencyApi.snapshot();
}

export async function fetchLatencyTargets(): Promise<LatencyTargetConfig[]> {
  return latencyApi.listTargets();
}

export async function createLatencyTarget(body: LatencyTargetWriteBody): Promise<LatencyTargetConfig> {
  return latencyApi.createTarget(body);
}

export async function updateLatencyTarget(
  id: string,
  body: Partial<LatencyTargetWriteBody>,
): Promise<LatencyTargetConfig> {
  return latencyApi.updateTarget(id, body);
}

export async function deleteLatencyTarget(id: string): Promise<void> {
  await latencyApi.deleteTarget(id);
}
