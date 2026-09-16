import { loadAPIConfig } from '@/config/api';
import {
  resolveWeatherLocation,
  type WeatherLocation,
} from '@/config/weatherLocation';

export interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  humidity: number;
  windSpeed: number;
  city?: string;
  isDaytime?: boolean;
}

interface OpenWeatherMapResponse {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
  sys?: {
    sunrise?: number;
    sunset?: number;
  };
  dt?: number;
}

interface NwsPeriod {
  temperature: number;
  temperatureUnit: string;
  windSpeed?: string;
  shortForecast?: string;
  isDaytime?: boolean;
  relativeHumidity?: { value?: number | null };
}

/**
 * Weather for a household-fixed lat/lon.
 * NOAA covers Overgaard; OpenWeatherMap does too, but names the nearest city in its database.
 */
export class WeatherService {
  private static instance: WeatherService;

  private constructor() {}

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  private mapWeatherCondition(weatherId: number): WeatherData['condition'] {
    if (weatherId >= 200 && weatherId < 300) {
      return 'stormy';
    }
    if (weatherId >= 300 && weatherId < 600) {
      return 'rainy';
    }
    if (weatherId >= 600 && weatherId < 700) {
      return 'snowy';
    }
    if (weatherId >= 700 && weatherId < 800) {
      return 'cloudy';
    }
    if (weatherId === 800) {
      return 'sunny';
    }
    if (weatherId >= 801 && weatherId < 805) {
      return 'cloudy';
    }
    return 'cloudy';
  }

  private mapForecastText(text: string): WeatherData['condition'] {
    const t = text.toLowerCase();
    if (/\b(thunder|t-storm|storm)\b/.test(t)) return 'stormy';
    if (/\bsnow\b/.test(t)) return 'snowy';
    if (/\b(rain|shower|drizzle)\b/.test(t)) return 'rainy';
    if (/\b(sunny|clear|fair)\b/.test(t)) return 'sunny';
    return 'cloudy';
  }

  private parseWindMph(windSpeed: string): number {
    const nums = [...windSpeed.matchAll(/(\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]));
    if (nums.length === 0) return 0;
    return Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length);
  }

  private convertTemp(value: number, from: 'F' | 'C', units: 'metric' | 'imperial'): number {
    if (units === 'imperial') {
      return from === 'F' ? Math.round(value) : Math.round((value * 9) / 5 + 32);
    }
    return from === 'C' ? Math.round(value) : Math.round(((value - 32) * 5) / 9);
  }

  private mockWeather(city: string, units: 'metric' | 'imperial'): WeatherData {
    const conditions: WeatherData['condition'][] = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];
    const currentHour = new Date().getHours();
    return {
      temperature: units === 'imperial' ? Math.floor(Math.random() * 40) + 40 : Math.floor(Math.random() * 30) + 10,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      city,
      isDaytime: currentHour >= 6 && currentHour < 20,
    };
  }

  private async fetchFromWeatherGov(
    lat: number,
    lon: number,
    units: 'metric' | 'imperial',
    city: string
  ): Promise<WeatherData> {
    const pointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
    const pointsResponse = await fetch(pointsUrl, {
      headers: { Accept: 'application/geo+json' },
    });

    if (!pointsResponse.ok) {
      throw new Error(`weather.gov points error: ${pointsResponse.status} ${pointsResponse.statusText}`);
    }

    const points = await pointsResponse.json();
    const hourlyUrl = points.properties?.forecastHourly as string | undefined;
    if (!hourlyUrl) {
      throw new Error('weather.gov did not return a forecast for this location');
    }

    const forecastResponse = await fetch(hourlyUrl, {
      headers: { Accept: 'application/geo+json' },
    });

    if (!forecastResponse.ok) {
      throw new Error(`weather.gov forecast error: ${forecastResponse.status} ${forecastResponse.statusText}`);
    }

    const forecast = await forecastResponse.json();
    const period = forecast.properties?.periods?.[0] as NwsPeriod | undefined;
    if (!period || typeof period.temperature !== 'number') {
      throw new Error('weather.gov forecast was empty');
    }

    const fromUnit = period.temperatureUnit === 'C' ? 'C' : 'F';
    const windMph = this.parseWindMph(String(period.windSpeed ?? ''));
    const humidity = period.relativeHumidity?.value;

    return {
      temperature: this.convertTemp(period.temperature, fromUnit, units),
      condition: this.mapForecastText(String(period.shortForecast ?? '')),
      humidity: typeof humidity === 'number' ? Math.round(humidity) : 0,
      windSpeed: units === 'metric' ? Math.round(windMph * 1.60934) : windMph,
      city,
      isDaytime: Boolean(period.isDaytime),
    };
  }

  private async fetchFromOpenWeatherMap(
    apiKey: string,
    lat: number,
    lon: number,
    units: 'metric' | 'imperial',
    city: string
  ): Promise<WeatherData> {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('OpenWeatherMap API key is missing or empty');
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = `OpenWeatherMap API error: ${response.status} ${response.statusText}`;

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage += `. ${errorData.message}`;
        }
      } catch {
        // Use status text when the error body is not JSON.
      }

      throw new Error(errorMessage);
    }

    const data: OpenWeatherMapResponse = await response.json();

    let isDaytime: boolean | undefined;
    if (data.sys?.sunrise && data.sys?.sunset && data.dt) {
      isDaytime = data.dt >= data.sys.sunrise && data.dt < data.sys.sunset;
    } else {
      const currentHour = new Date().getHours();
      isDaytime = currentHour >= 6 && currentHour < 20;
    }

    return {
      temperature: Math.round(data.main.temp),
      condition: this.mapWeatherCondition(data.weather[0]?.id || 800),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * (units === 'metric' ? 3.6 : 1)),
      city,
      isDaytime,
    };
  }

  async getCurrentWeather(
    units: 'metric' | 'imperial' = 'metric',
    location?: Partial<WeatherLocation>
  ): Promise<WeatherData> {
    const resolved = resolveWeatherLocation(location);

    try {
      const config = await loadAPIConfig();

      if (!config.weather.enabled || config.weather.provider === 'mock') {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return this.mockWeather(resolved.city, units);
      }

      const sources: Array<() => Promise<WeatherData>> = [
        () => this.fetchFromWeatherGov(resolved.lat, resolved.lon, units, resolved.city),
      ];

      if (config.weather.apiKey?.trim()) {
        sources.push(() =>
          this.fetchFromOpenWeatherMap(
            config.weather.apiKey as string,
            resolved.lat,
            resolved.lon,
            units,
            resolved.city
          )
        );
      }

      let lastError: unknown;
      for (const fetchWeather of sources) {
        try {
          return await fetchWeather();
        } catch (error) {
          lastError = error;
          console.warn('Weather source failed, trying next:', error);
        }
      }

      console.error('All weather sources failed, falling back to mock data:', lastError);
      return this.mockWeather(resolved.city, units);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }
}
