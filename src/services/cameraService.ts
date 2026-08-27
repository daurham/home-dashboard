/**
 * Fetches JPEG snapshots from the Vite camera proxy.
 */
export class CameraService {
  private static instance: CameraService;

  private constructor() {}

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  async getSnapshot(snapshotUrl: string, signal?: AbortSignal): Promise<Blob> {
    const separator = snapshotUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${snapshotUrl}${separator}t=${Date.now()}`, {
      cache: 'no-store',
      signal,
    });

    if (!response.ok) {
      throw new Error(`Camera snapshot failed (${response.status})`);
    }

    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) {
      throw new Error('Camera did not return an image');
    }

    return blob;
  }
}
