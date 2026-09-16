import { cn } from '@/lib/utils';
import { buildSparklinePolylines } from '@/lib/latency/format';
import type { LatencyStatus } from '@/lib/latency/format';

const STATUS_STROKE: Record<LatencyStatus, string> = {
  up: 'stroke-emerald-400',
  degraded: 'stroke-amber-400',
  down: 'stroke-red-400',
};

interface LatencySparklineProps {
  samples: Array<number | null>;
  status: LatencyStatus;
  className?: string;
}

const WIDTH = 128;
const HEIGHT = 36;

export function LatencySparkline({ samples, status, className }: LatencySparklineProps) {
  const polylines = buildSparklinePolylines(samples, WIDTH, HEIGHT);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      // Fill whatever box the caller gives it; non-scaling strokes keep the line even.
      preserveAspectRatio="none"
      className={cn('h-9 w-32 overflow-visible', className)}
      aria-hidden
    >
      {polylines.map((points, i) => (
        <polyline
          key={i}
          fill="none"
          points={points}
          className={cn(STATUS_STROKE[status], 'stroke-[1.75]')}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {polylines.length === 0 && (
        <line
          x1="0"
          y1={HEIGHT - 2}
          x2={WIDTH}
          y2={HEIGHT - 2}
          className="stroke-muted-foreground/30 stroke-[1.5]"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
