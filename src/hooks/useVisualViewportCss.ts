import { useEffect } from 'react';

/** Keeps overlay chrome inside the on-screen area when a phone/iPad keyboard is open. */
export function useVisualViewportCss() {
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const bottom = Math.max(0, window.innerHeight - offsetTop - height);
      root.style.setProperty('--vvh', `${height}px`);
      root.style.setProperty('--vv-offset-top', `${offsetTop}px`);
      root.style.setProperty('--vv-bottom', `${bottom}px`);
    };

    sync();
    window.visualViewport?.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);

    return () => {
      window.visualViewport?.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
    };
  }, []);
}
