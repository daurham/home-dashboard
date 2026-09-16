import { useCallback, useEffect, useState } from 'react';
import { VideoOff } from 'lucide-react';
import { CameraService } from '@/services/cameraService';
import type { CameraFeedConfig } from '@/config/cameras';
import { cn } from '@/lib/utils';

export function CompactCameraTile({
  camera,
  onOpen,
}: {
  camera: CameraFeedConfig;
  onOpen: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const pull = useCallback(async () => {
    if (document.hidden) return;
    try {
      const blob = await CameraService.getInstance().getSnapshot(camera.snapshotUrl);
      const next = URL.createObjectURL(blob);
      setSrc((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return next;
      });
      setLive(true);
    } catch {
      setLive(false);
    }
  }, [camera.snapshotUrl]);

  useEffect(() => {
    void pull();
    const id = window.setInterval(pull, Math.max(camera.refreshIntervalMs, 1500));
    return () => {
      window.clearInterval(id);
      setSrc((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
    };
  }, [camera.refreshIntervalMs, pull]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative h-full min-h-0 overflow-hidden rounded-lg bg-slate-900 text-left"
    >
      {src ? (
        <img src={src} alt={camera.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-white/70">
          <VideoOff className="h-6 w-6" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
        <p className="truncate text-[11px] font-medium text-white">{camera.name}</p>
        <p className="text-[10px] text-white/80">{live ? 'Live' : 'Offline'}</p>
      </div>
      <span
        className={cn(
          'absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
          live ? 'bg-emerald-500 text-white' : 'bg-black/50 text-white',
        )}
      >
        {live ? 'Live' : 'Off'}
      </span>
    </button>
  );
}
