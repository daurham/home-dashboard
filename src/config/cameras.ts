/**
 * Local POE / IP camera feeds shown in the Cameras tab.
 *
 * Live video comes from go2rtc on the home server (H.265 camera → H.264).
 * JPEG snapshots via the Vite proxy are only a fallback if the stream is down.
 * Camera credentials stay on the server, not in the browser.
 */
export interface CameraFeedConfig {
  id: string;
  name: string;
  /** Shown under the name, usually the camera LAN address */
  location: string;
  /** go2rtc fMP4/MSE URL on the home server */
  streamUrl: string;
  /** Same-origin snapshot URL served by the Vite camera proxy */
  snapshotUrl: string;
  /** How often to pull a new JPEG frame when using snapshot fallback */
  refreshIntervalMs: number;
  /** Camera's own web UI, opened in a new tab */
  webUrl: string;
}

function go2rtcBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_GO2RTC_URL;
  return (fromEnv || 'http://192.168.1.161:1984').replace(/\/$/, '');
}

function go2rtcStreamUrl(streamName: string): string {
  return `${go2rtcBaseUrl()}/api/stream.mp4?src=${encodeURIComponent(streamName)}`;
}

export const cameras: CameraFeedConfig[] = [
  {
    id: 'poe-1',
    name: 'POE Camera',
    location: '192.168.1.72',
    streamUrl: go2rtcStreamUrl(import.meta.env.VITE_CAMERA_STREAM || 'poe-1'),
    snapshotUrl: '/camera-proxy/cgi-bin/snapshot.cgi',
    refreshIntervalMs: 400,
    webUrl: 'http://192.168.1.72/',
  },
];
