import { useEffect, useState } from 'react';
import { usePreferencesStore, useThemeStore } from '@/lib/store';
import { isAutoDark } from '@/lib/theme/schedule';
import { useCurrentWeather } from '@/hooks/useCurrentWeather';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode, accentColor, darkStartsAt, darkEndsAt } = useThemeStore();
  const expenseTimeZone = usePreferencesStore((state) => state.expenseTimeZone);
  const { weather } = useCurrentWeather();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (themeMode !== 'auto') return undefined;
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 30_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    const autoDark = isAutoDark(
      now,
      darkStartsAt,
      darkEndsAt,
      expenseTimeZone,
      weather?.isDaytime,
    );
    const dark = themeMode === 'dark' || (themeMode === 'auto' && autoDark);

    root.classList.toggle('dark', dark);
    root.classList.toggle('theme-auto', themeMode === 'auto');
    root.setAttribute('data-accent', accentColor);
    root.style.colorScheme = dark ? 'dark' : 'light';
  }, [accentColor, darkEndsAt, darkStartsAt, expenseTimeZone, now, themeMode, weather?.isDaytime]);

  return <>{children}</>;
}
