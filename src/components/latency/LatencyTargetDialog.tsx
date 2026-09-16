import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createLatencyTarget,
  deleteLatencyTarget,
  updateLatencyTarget,
} from '@/services/latencyService';
import type { LatencyTargetConfig, LatencyTargetType, LatencyTargetWriteBody } from '@/lib/latency/format';

interface DraftState {
  name: string;
  type: LatencyTargetType;
  url: string;
  method: 'GET' | 'POST';
  expectStatus: string;
  expectBodyIncludes: string;
  host: string;
  port: string;
  connectionStringEnv: string;
  intervalSeconds: string;
  timeoutMs: string;
  degradedThresholdMs: string;
  enabled: boolean;
}

const emptyDraft: DraftState = {
  name: '',
  type: 'http',
  url: '',
  method: 'GET',
  expectStatus: '200',
  expectBodyIncludes: '',
  host: '',
  port: '',
  connectionStringEnv: '',
  intervalSeconds: '30',
  timeoutMs: '3000',
  degradedThresholdMs: '1000',
  enabled: true,
};

function toDraft(target: LatencyTargetConfig): DraftState {
  return {
    name: target.name,
    type: target.type,
    url: target.url ?? '',
    method: target.method ?? 'GET',
    expectStatus: (target.expectStatus ?? [200]).join(', '),
    expectBodyIncludes: target.expectBodyIncludes ?? '',
    host: target.host ?? '',
    port: target.port != null ? String(target.port) : '',
    connectionStringEnv: target.connectionStringEnv ?? '',
    intervalSeconds: String(Math.round(target.intervalMs / 1000)),
    timeoutMs: String(target.timeoutMs),
    degradedThresholdMs: String(target.degradedThresholdMs),
    enabled: target.enabled,
  };
}

function toWriteBody(draft: DraftState): LatencyTargetWriteBody {
  const body: LatencyTargetWriteBody = {
    name: draft.name.trim(),
    type: draft.type,
    intervalMs: Math.round(Number(draft.intervalSeconds) * 1000),
    timeoutMs: Number(draft.timeoutMs),
    degradedThresholdMs: Number(draft.degradedThresholdMs),
    enabled: draft.enabled,
  };

  if (draft.type === 'http' || draft.type === 'ollama') {
    body.url = draft.url.trim();
    body.method = draft.method;
    const statuses = draft.expectStatus
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value));
    if (statuses.length) body.expectStatus = statuses;
    if (draft.expectBodyIncludes.trim()) body.expectBodyIncludes = draft.expectBodyIncludes.trim();
  }

  if (draft.type === 'tcp') {
    body.host = draft.host.trim();
    body.port = Number(draft.port);
  }

  if (draft.type === 'postgres') {
    body.connectionStringEnv = draft.connectionStringEnv.trim().toUpperCase();
  }

  return body;
}

export function LatencyTargetDialog({
  open,
  target,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  /** Existing target to edit, or null to create a new one. */
  target: LatencyTargetConfig | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(target ? toDraft(target) : emptyDraft);
    setError(null);
    setConfirmDelete(false);
  }, [open, target]);

  const isHttp = draft.type === 'http' || draft.type === 'ollama';

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = toWriteBody(draft);
      if (target) await updateLatencyTarget(target.id, body);
      else await createLatencyTarget(body);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save target');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      await deleteLatencyTarget(target.id);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete target');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{target ? 'Edit probe target' : 'Add probe target'}</DialogTitle>
          <DialogDescription>
            The server does the probing on a schedule. The browser only reads results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
            <div className="space-y-2">
              <Label htmlFor="target-name">Name</Label>
              <Input
                id="target-name"
                value={draft.name}
                placeholder="Grafana"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={draft.type}
                onValueChange={(value) => setDraft({ ...draft, type: value as LatencyTargetType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="postgres">Postgres</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isHttp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="target-url">URL</Label>
                <Input
                  id="target-url"
                  value={draft.url}
                  placeholder="http://127.0.0.1:3001/api/health"
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Must be http or https, and reachable from the server rather than this browser.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select
                    value={draft.method}
                    onValueChange={(value) => setDraft({ ...draft, method: value as 'GET' | 'POST' })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-status">Healthy status codes</Label>
                  <Input
                    id="target-status"
                    value={draft.expectStatus}
                    placeholder="200, 204"
                    onChange={(e) => setDraft({ ...draft, expectStatus: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-body">Body must contain (optional)</Label>
                <Input
                  id="target-body"
                  value={draft.expectBodyIncludes}
                  placeholder="Ollama is running"
                  onChange={(e) => setDraft({ ...draft, expectBodyIncludes: e.target.value })}
                />
              </div>
            </>
          )}

          {draft.type === 'tcp' && (
            <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
              <div className="space-y-2">
                <Label htmlFor="target-host">Host</Label>
                <Input
                  id="target-host"
                  value={draft.host}
                  placeholder="127.0.0.1"
                  onChange={(e) => setDraft({ ...draft, host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-port">Port</Label>
                <Input
                  id="target-port"
                  type="number"
                  min={1}
                  max={65535}
                  value={draft.port}
                  placeholder="6379"
                  onChange={(e) => setDraft({ ...draft, port: e.target.value })}
                />
              </div>
            </div>
          )}

          {draft.type === 'postgres' && (
            <div className="space-y-2">
              <Label htmlFor="target-env">Connection string env var</Label>
              <Input
                id="target-env"
                value={draft.connectionStringEnv}
                placeholder="DATABASE_URL"
                onChange={(e) => setDraft({ ...draft, connectionStringEnv: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Name of an env var on the server. The connection string itself never leaves it.
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="target-interval">Every (seconds)</Label>
              <Input
                id="target-interval"
                type="number"
                min={10}
                value={draft.intervalSeconds}
                onChange={(e) => setDraft({ ...draft, intervalSeconds: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-timeout">Timeout (ms)</Label>
              <Input
                id="target-timeout"
                type="number"
                min={500}
                max={10000}
                value={draft.timeoutMs}
                onChange={(e) => setDraft({ ...draft, timeoutMs: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-degraded">Slow above (ms)</Label>
              <Input
                id="target-degraded"
                type="number"
                min={50}
                value={draft.degradedThresholdMs}
                onChange={(e) => setDraft({ ...draft, degradedThresholdMs: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="target-enabled">Enabled</Label>
              <p className="text-xs text-muted-foreground">Turn off to stop probing without deleting.</p>
            </div>
            <Switch
              id="target-enabled"
              checked={draft.enabled}
              onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })}
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          {target ? (
            <Button
              variant={confirmDelete ? 'destructive' : 'ghost'}
              disabled={busy}
              onClick={() => (confirmDelete ? void remove() : setConfirmDelete(true))}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={busy || !draft.name.trim()} onClick={() => void save()}>
              {target ? 'Save' : 'Add target'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
