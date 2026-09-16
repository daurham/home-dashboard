import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, Cloud, CloudLightning, CloudRain, CloudSnow, Lock, Moon, Sun } from 'lucide-react';
import { useDashboardStore, usePreferencesStore } from '@/lib/store';
import { WeatherService, WeatherData } from '@/services/weatherService';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  stormy: CloudLightning,
};

function greetingForHour(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function HomeHeader({ actions }: { actions?: ReactNode }) {
  const { greetingName } = usePreferencesStore();
  const { config } = useDashboardStore();
  const { units } = usePreferencesStore();
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!config.weather.enabled || !config.weather.showCurrentWeather) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await WeatherService.getInstance().getCurrentWeather(units);
        if (!cancelled) setWeather(data);
      } catch (error) {
        console.error('Failed to load weather:', error);
      }
    };
    void load();
    const interval = window.setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [config.weather.enabled, config.weather.showCurrentWeather, units]);

  const greeting = useMemo(() => greetingForHour(now.getHours()), [now]);
  const temperatureUnit = units === 'metric' ? '°C' : '°F';
  const WeatherIcon = weather
    ? weather.condition === 'sunny' && weather.isDaytime === false
      ? Moon
      : weatherIcons[weather.condition]
    : Cloud;
  const conditionText = weather
    ? weather.condition === 'sunny' && weather.isDaytime === false
      ? 'Clear'
      : weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)
    : 'Weather';

  return (
    <div className="flex shrink-0 items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
          {greeting}, {greetingName || 'there'} <span aria-hidden>👋</span>
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {config.weather.enabled && (
          <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1">
            {weather ? (
              <>
                <WeatherIcon className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold tabular-nums">
                  {`${weather.temperature}${temperatureUnit}`}
                </span>
                <span className="hidden text-[11px] text-muted-foreground sm:inline">{conditionText}</span>
              </>
            ) : (
              <span className="flex items-center gap-1.5" role="status" aria-label="Loading weather">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-10 rounded-md" />
              </span>
            )}
          </div>
        )}
        <div className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 sm:flex">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-medium">{formatHeaderDate(now)}</p>
        </div>
        {actions}
      </div>
    </div>
  );
}

export function HomeFooter({ lastSynced }: { lastSynced: Date | null }) {
  const label = lastSynced
    ? lastSynced.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '—';

  return (
    <div className={cn(
      'flex shrink-0 items-center justify-between gap-3 pt-1 text-[11px] text-muted-foreground',
    )}>
      <p className="flex items-center gap-1.5">
        <Lock className="h-3 w-3" />
        Your data is private and encrypted.
      </p>
      <p>Last synced: {label}</p>
    </div>
  );
}
