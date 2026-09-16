import { useEffect, useState } from 'react';
import { resolveWeatherLocation } from '@/config/weatherLocation';
import { useDashboardStore, usePreferencesStore } from '@/lib/store';
import { WeatherService, type WeatherData } from '@/services/weatherService';

export function useCurrentWeather() {
  const { config } = useDashboardStore();
  const { units } = usePreferencesStore();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const enabled = config.weather.enabled && config.weather.showCurrentWeather;
  const { city, lat, lon } = resolveWeatherLocation(config.weather);

  useEffect(() => {
    if (!enabled) {
      setWeather(null);
      setLoading(false);
      return;
    }

    const location = { city, lat, lon };
    let cancelled = false;
    const load = async () => {
      try {
        const data = await WeatherService.getInstance().getCurrentWeather(units, location);
        if (!cancelled) {
          setWeather(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load weather:', error);
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const interval = window.setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, units, city, lat, lon]);

  return { weather, loading, enabled, units };
}
