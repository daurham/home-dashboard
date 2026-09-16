export interface WeatherLocation {
  city: string;
  lat: number;
  lon: number;
}

/** Heber-Overgaard, AZ — household forecast point, not browser GPS. */
export const DEFAULT_WEATHER_LOCATION: WeatherLocation = {
  city: 'Overgaard',
  lat: 34.4141,
  lon: -110.5696,
};

function envCoord(key: 'VITE_WEATHER_LAT' | 'VITE_WEATHER_LON', fallback: number): number {
  const value = Number.parseFloat(import.meta.env[key] ?? '');
  return Number.isFinite(value) ? value : fallback;
}

export function defaultWeatherLocationFromEnv(): WeatherLocation {
  return {
    city: import.meta.env.VITE_WEATHER_CITY?.trim() || DEFAULT_WEATHER_LOCATION.city,
    lat: envCoord('VITE_WEATHER_LAT', DEFAULT_WEATHER_LOCATION.lat),
    lon: envCoord('VITE_WEATHER_LON', DEFAULT_WEATHER_LOCATION.lon),
  };
}

export function resolveWeatherLocation(
  input?: Partial<WeatherLocation> | null
): WeatherLocation {
  const fallback = defaultWeatherLocationFromEnv();
  const city = input?.city?.trim();
  const lat = input?.lat;
  const lon = input?.lon;

  return {
    city: city || fallback.city,
    lat: typeof lat === 'number' && Number.isFinite(lat) ? lat : fallback.lat,
    lon: typeof lon === 'number' && Number.isFinite(lon) ? lon : fallback.lon,
  };
}
