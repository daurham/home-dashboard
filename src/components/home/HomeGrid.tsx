import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  homeGridTemplateRows,
  normalizeHomeOrder,
  normalizeHomeScales,
  packHomeLayout,
  type HomeModuleId,
} from '@/lib/home/layout';
import { useHomeLayoutStore } from '@/lib/store/homeLayoutStore';
import { ModuleFrame } from '@/components/home/ModuleFrame';

function useHomeColumns() {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < 768) setColumns(1);
      else if (width < 1280) setColumns(2);
      else setColumns(3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return columns;
}

interface HomeGridProps {
  modules: Record<HomeModuleId, ReactNode>;
}

export function HomeGrid({ modules }: HomeGridProps) {
  const order = useHomeLayoutStore((state) => state.order);
  const scales = useHomeLayoutStore((state) => state.scales);
  const columns = useHomeColumns();
  const layout = useMemo(() => normalizeHomeOrder(order), [order]);
  const normalizedScales = useMemo(() => normalizeHomeScales(scales), [scales]);
  const packed = useMemo(
    () => packHomeLayout(layout, normalizedScales, columns),
    [layout, normalizedScales, columns],
  );
  const rows = useMemo(
    () => homeGridTemplateRows(packed.placements, packed.rowCount),
    [packed],
  );

  return (
    <div
      className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-visible md:overflow-hidden md:grid-cols-2 xl:grid-cols-3"
      style={columns === 1 ? undefined : { gridTemplateRows: rows }}
    >
      {packed.placements.map((placement) => (
        <ModuleFrame
          key={placement.id}
          id={placement.id}
          compact={normalizedScales[placement.id] === 'compact'}
          wide={normalizedScales[placement.id] === 'wide'}
          column={placement.column}
          row={placement.row}
          columnSpan={placement.columnSpan}
          rowSpan={placement.rowSpan}
          explicitPlacement={columns > 1}
        >
          {modules[placement.id]}
        </ModuleFrame>
      ))}
    </div>
  );
}
