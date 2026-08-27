import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, RefreshCw, VideoOff, Volume2, VolumeX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CameraService } from '@/services/cameraService';
import type { CameraFeedConfig } from '@/config/cameras';

interface CameraFeedProps {
  camera: CameraFeedConfig;
}

type FeedStatus = 'loading' | 'live' | 'error';
type FeedMode = 'stream' | 'snapshot';

export function CameraFeed({ camera }: CameraFeedProps) {
  const [mode, setMode] = useState<FeedMode>(camera.streamUrl ? 'stream' : 'snapshot');
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => {
    setMode(camera.streamUrl ? 'stream' : 'snapshot');
    setRetryKey((value) => value + 1);
  }, [camera.streamUrl]);

  const failToSnapshot = useCallback(() => {
    setMode('snapshot');
  }, []);

  return (
    <Card className="overflow-hidden bg-card">
      {mode === 'stream' ? (
        <StreamPlayer camera={camera} retryKey={retryKey} onFail={failToSnapshot} onRetry={retry} />
      ) : (
        <SnapshotPlayer camera={camera} retryKey={retryKey} onRetry={retry} />
      )}
    </Card>
  );
}

function FeedHeader({
  camera,
  status,
  hasFrame,
  muted,
  onMutedChange,
}: {
  camera: CameraFeedConfig;
  status: FeedStatus;
  hasFrame: boolean;
  muted?: boolean;
  onMutedChange?: (muted: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-4 pb-3">
      <div className="min-w-0">
        <h3 className="truncate text-lg font-semibold text-foreground">{camera.name}</h3>
        <p className="truncate text-sm text-muted-foreground">{camera.location}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {status === 'live' && (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Live
          </Badge>
        )}
        {status === 'error' && hasFrame && (
          <Badge variant="outline">Reconnecting</Badge>
        )}
        {status === 'error' && !hasFrame && (
          <Badge variant="destructive">Offline</Badge>
        )}
        {onMutedChange && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMutedChange(!muted)}
            aria-label={muted ? 'Unmute camera' : 'Mute camera'}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <a href={camera.webUrl} target="_blank" rel="noreferrer">
            <ExternalLink />
            Open
          </a>
        </Button>
      </div>
    </div>
  );
}

function StreamPlayer({
  camera,
  retryKey,
  onFail,
  onRetry,
}: {
  camera: CameraFeedConfig;
  retryKey: number;
  onFail: () => void;
  onRetry: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<FeedStatus>('loading');
  const [muted, setMuted] = useState(true);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    hasPlayed.current = false;
    setStatus('loading');
    video.muted = true;
    video.src = camera.streamUrl;
    video.load();
    void video.play().catch(() => {
      // Autoplay can reject until a frame arrives; playing/error handlers take over.
    });

    const failTimer = window.setTimeout(() => {
      if (!hasPlayed.current) {
        onFail();
      }
    }, 12000);

    const onPlaying = () => {
      hasPlayed.current = true;
      setStatus('live');
    };
    const onError = () => {
      if (hasPlayed.current) {
        setStatus('error');
        return;
      }
      onFail();
    };
    const onVisibility = () => {
      if (document.hidden) {
        video.pause();
        return;
      }
      void video.play().catch(() => {});
    };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearTimeout(failTimer);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
      document.removeEventListener('visibilitychange', onVisibility);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [camera.streamUrl, retryKey, onFail]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  return (
    <>
      <FeedHeader
        camera={camera}
        status={status}
        hasFrame={hasPlayed.current || status === 'live'}
        muted={muted}
        onMutedChange={setMuted}
      />
      <div className="relative aspect-[1920/912] bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-contain bg-black"
          autoPlay
          muted
          playsInline
          disablePictureInPicture
        />
        {status === 'loading' && (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}
        {status === 'error' && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-3">
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw />
              Retry stream
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function SnapshotPlayer({
  camera,
  retryKey,
  onRetry,
}: {
  camera: CameraFeedConfig;
  retryKey: number;
  onRetry: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<FeedStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    let currentUrl: string | null = null;
    let inFlight = false;
    const service = CameraService.getInstance();

    const pullFrame = async () => {
      if (inFlight || document.hidden) {
        return;
      }

      inFlight = true;
      try {
        const blob = await service.getSnapshot(camera.snapshotUrl);
        if (cancelled) {
          return;
        }

        const nextUrl = URL.createObjectURL(blob);
        const previousUrl = currentUrl;
        currentUrl = nextUrl;
        setSrc(nextUrl);
        setStatus('live');
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      } finally {
        inFlight = false;
      }
    };

    pullFrame();
    const intervalId = window.setInterval(pullFrame, camera.refreshIntervalMs);
    const onVisibility = () => {
      if (!document.hidden) {
        pullFrame();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [camera.snapshotUrl, camera.refreshIntervalMs, retryKey]);

  return (
    <>
      <FeedHeader camera={camera} status={status} hasFrame={Boolean(src)} />
      <div className="relative aspect-[1920/912] bg-muted">
        {src && (
          <img
            src={src}
            alt={`${camera.name} live feed`}
            className="absolute inset-0 h-full w-full object-contain bg-black"
          />
        )}

        {status === 'loading' && !src && (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}

        {status === 'error' && !src && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <VideoOff className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Can't reach this camera</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Stream and snapshot both failed. Check go2rtc on the home server
                and that the camera is on at {camera.location}.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw />
              Retry
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
