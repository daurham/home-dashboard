import { HubCard } from '@/components/home/HubCard';
import { CompactCameraTile } from '@/components/home/CompactCameraTile';
import { cameras } from '@/config/cameras';
import { useUIStore } from '@/lib/store';

export function CameraGridCard() {
  const setActiveSidebarTab = useUIStore((s) => s.setActiveSidebarTab);

  return (
    <HubCard className="p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Cameras</h2>
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setActiveSidebarTab('cameras')}>
          All
        </button>
      </div>

      {cameras.length === 0 ? (
        <p className="flex-1 text-xs text-muted-foreground">No cameras configured.</p>
      ) : (
        <div className={cameras.length === 1 ? 'min-h-0 flex-1' : 'grid min-h-0 flex-1 grid-cols-2 gap-1.5'}>
          {cameras.map((camera) => (
            <CompactCameraTile
              key={camera.id}
              camera={camera}
              onOpen={() => setActiveSidebarTab('cameras')}
            />
          ))}
        </div>
      )}
    </HubCard>
  );
}
