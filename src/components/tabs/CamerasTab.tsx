import { CameraFeed } from '@/components/cameras/CameraFeed';
import { cameras } from '@/config/cameras';

export function CamerasTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">POE Cameras</h2>
        <p className="text-muted-foreground">
          Live feeds from cameras on your local network
        </p>
      </div>

      <div className="grid gap-6">
        {cameras.map((camera) => (
          <CameraFeed key={camera.id} camera={camera} />
        ))}
      </div>
    </div>
  );
}
