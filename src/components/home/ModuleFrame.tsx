import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Columns2, EyeOff, GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import { HOME_MODULES, visibleHomeOrder, type HomeModuleId } from '@/lib/home/layout';
import { useHomeLayoutStore } from '@/lib/store/homeLayoutStore';
import { cn } from '@/lib/utils';

interface ModuleFrameProps {
  id: HomeModuleId;
  children: ReactNode;
  compact: boolean;
  wide: boolean;
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
  explicitPlacement: boolean;
}

export function ModuleFrame({
  id,
  children,
  compact,
  wide,
  column,
  row,
  columnSpan,
  rowSpan,
  explicitPlacement,
}: ModuleFrameProps) {
  const editing = useHomeLayoutStore((state) => state.editing);
  const moveModule = useHomeLayoutStore((state) => state.moveModule);
  const nudgeModule = useHomeLayoutStore((state) => state.nudgeModule);
  const toggleModuleScale = useHomeLayoutStore((state) => state.toggleModuleScale);
  const toggleModuleWide = useHomeLayoutStore((state) => state.toggleModuleWide);
  const hideModule = useHomeLayoutStore((state) => state.hideModule);
  const order = useHomeLayoutStore((state) => state.order);
  const hidden = useHomeLayoutStore((state) => state.hidden);
  const visible = visibleHomeOrder(order, hidden);
  const index = visible.indexOf(id);
  const [over, setOver] = useState(false);
  const meta = HOME_MODULES[id];
  const controlPad = meta.canWiden
    ? '[&_.hub-card]:pl-[11.5rem]'
    : meta.canResize
      ? '[&_.hub-card]:pl-[9.5rem]'
      : '[&_.hub-card]:pl-[8rem]';

  return (
    <section
      data-module={id}
      data-compact={compact ? 'true' : undefined}
      data-wide={wide ? 'true' : undefined}
      className={cn(
        'home-module h-full min-h-0 min-w-0',
        meta.role === 'banner' && !explicitPlacement && 'col-span-full',
        meta.role === 'tile' && compact && 'max-md:min-h-[120px]',
        meta.role === 'tile' && !compact && !wide && 'max-md:min-h-[240px]',
        meta.role === 'tile' && wide && 'max-md:min-h-[520px]',
        editing && over && 'rounded-[1.25rem] ring-2 ring-primary/70 ring-offset-2 ring-offset-dashboard-bg',
      )}
      style={explicitPlacement ? {
        gridColumn: `${column} / span ${columnSpan}`,
        gridRow: `${row} / span ${rowSpan}`,
      } : undefined}
      onDragOver={(event) => {
        if (!editing) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        if (!editing) return;
        event.preventDefault();
        setOver(false);
        const from = (event.dataTransfer.getData('text/home-module') || event.dataTransfer.getData('text/plain')) as HomeModuleId;
        if (from) moveModule(from, id);
      }}
    >
      <div className="relative h-full min-h-0">
        {editing && (
          <div className="absolute left-1.5 top-1.5 z-20 flex items-center gap-0.5">
            <button
              type="button"
              draggable
              aria-label={`Move ${meta.title}`}
              title="Drag to rearrange"
              onDragStart={(event) => {
                event.dataTransfer.setData('text/home-module', id);
                event.dataTransfer.setData('text/plain', id);
                event.dataTransfer.effectAllowed = 'move';
                const frame = event.currentTarget.closest('.home-module');
                if (frame instanceof HTMLElement) {
                  event.dataTransfer.setDragImage(frame, 24, 24);
                }
              }}
              className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-md border border-border/80 bg-card/95 text-muted-foreground shadow-sm active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-7 w-6 items-center justify-center rounded-md border border-border/80 bg-card/95 text-muted-foreground shadow-sm disabled:opacity-30"
              aria-label={`Move ${meta.title} earlier`}
              disabled={index <= 0}
              onClick={() => nudgeModule(id, -1)}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex h-7 w-6 items-center justify-center rounded-md border border-border/80 bg-card/95 text-muted-foreground shadow-sm disabled:opacity-30"
              aria-label={`Move ${meta.title} later`}
              disabled={index < 0 || index >= visible.length - 1}
              onClick={() => nudgeModule(id, 1)}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-card/95 text-muted-foreground shadow-sm"
              aria-label={`Hide ${meta.title} from home`}
              title="Hide from home"
              onClick={() => hideModule(id)}
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
            {meta.canResize && (
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-card/95 text-muted-foreground shadow-sm"
                aria-label={compact ? `Expand ${meta.title}` : `Compact ${meta.title}`}
                title={compact ? 'Full height' : 'Half height'}
                onClick={() => toggleModuleScale(id)}
              >
                {compact ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
            )}
            {meta.canWiden && (
              <button
                type="button"
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-md border bg-card/95 shadow-sm',
                  wide ? 'border-primary/60 text-foreground' : 'border-border/80 text-muted-foreground',
                )}
                aria-label={wide ? `Standard width for ${meta.title}` : `Expand ${meta.title} to two modules`}
                title={wide ? 'Standard width' : 'Two modules wide'}
                onClick={() => toggleModuleWide(id)}
              >
                <Columns2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <div className={cn(
          'h-full min-h-0',
          editing && 'pointer-events-none select-none',
          editing && controlPad,
        )}>
          {children}
        </div>
      </div>
    </section>
  );
}
