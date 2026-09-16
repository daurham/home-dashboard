import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, Clock, Cloud, CloudLightning, CloudRain, CloudSnow, Lock, Moon, Sun } from 'lucide-react';
import { usePreferencesStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { formatTimeFromDate } from '@/lib/utils/timeFormat';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentWeather } from '@/hooks/useCurrentWeather';

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
  const { greetingName, timeFormat } = usePreferencesStore();
  const { weather, enabled: weatherEnabled, units } = useCurrentWeather();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground xl:text-lg">
          {greeting}, {greetingName || 'there'} <span aria-hidden>👋</span>
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {weatherEnabled && (
          <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1">
            {weather ? (
              <>
                <WeatherIcon className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold tabular-nums">
                  {`${weather.temperature}${temperatureUnit}`}
                </span>
                <span className="hidden text-[11px] text-muted-foreground xl:inline">{conditionText}</span>
              </>
            ) : (
              <span className="flex items-center gap-1.5" role="status" aria-label="Loading weather">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-10 rounded-md" />
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-sm font-semibold tabular-nums">
            {formatTimeFromDate(now, timeFormat, false)}
          </p>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-card px-2.5 py-1 md:flex">
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
