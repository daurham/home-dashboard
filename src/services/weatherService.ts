import { loadAPIConfig } from '@/config/api';

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
  coord?: {
    lat: number;
    lon: number;
  };
  name?: string; // City name
  sys?: {
    country?: string;
    sunrise?: number; // Unix timestamp
    sunset?: number; // Unix timestamp
  };
  dt?: number; // Current time, Unix timestamp
}

/**
 * Weather service that fetches data from OpenWeatherMap API.
 * Falls back to mock data if API is not configured.
 */
export class WeatherService {
  private static instance: WeatherService;
  private cachedLocation: { lat: number; lon: number } | null = null;
  
  private constructor() {}
  
  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  /**
   * Get user's location using browser geolocation API
   */
  private async getLocation(): Promise<{ lat: number; lon: number }> {
    if (this.cachedLocation) {
      return this.cachedLocation;
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          this.cachedLocation = location;
          resolve(location);
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          timeout: 10000,
          maximumAge: 600000, // Cache for 10 minutes
        }
      );
    });
  }

  /**
   * Map OpenWeatherMap weather condition codes to our condition types
   */
  private mapWeatherCondition(weatherId: number): WeatherData['condition'] {
    // OpenWeatherMap weather condition codes
    // https://openweathermap.org/weather-conditions
    
    if (weatherId >= 200 && weatherId < 300) {
      return 'stormy'; // Thunderstorm
    } else if (weatherId >= 300 && weatherId < 600) {
      return 'rainy'; // Drizzle and Rain
    } else if (weatherId >= 600 && weatherId < 700) {
      return 'snowy'; // Snow
    } else if (weatherId >= 700 && weatherId < 800) {
      return 'cloudy'; // Atmosphere (fog, mist, etc.)
    } else if (weatherId === 800) {
      return 'sunny'; // Clear sky
    } else if (weatherId >= 801 && weatherId < 805) {
      return 'cloudy'; // Clouds
    } else {
      return 'cloudy'; // Default fallback
    }
  }

  /**
   * Fetch weather data from OpenWeatherMap API
   */
  /**
   * Fetch weather data from OpenWeatherMap API
   */
  private async fetchFromOpenWeatherMap(
    apiKey: string,
    lat: number,
    lon: number,
    units: 'metric' | 'imperial'
  ): Promise<WeatherData> {
    // Validate API key format (OpenWeatherMap keys are typically 32 characters)
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('OpenWeatherMap API key is missing or empty');
    }

    const baseUrl = 'https://api.openweathermap.org/data/2.5';
    const url = `${baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;

    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = `OpenWeatherMap API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage += `. ${errorData.message}`;
        }
        
        // Provide helpful error messages for common issues
        if (response.status === 401) {
          errorMessage += '\n\nPossible causes:\n' +
            '- API key is invalid or expired\n' +
            '- API key has not been activated (check your email for activation link)\n' +
            '- API key does not have permission to access Current Weather Data API\n' +
            'Please verify your API key at https://home.openweathermap.org/api_keys';
        } else if (response.status === 429) {
          errorMessage += '\n\nRate limit exceeded. Please wait before making more requests.';
        }
      } catch {
        // If we can't parse the error response, use the status text
      }
      
      throw new Error(errorMessage);
    }

    const data: OpenWeatherMapResponse = await response.json();
    console.log('url:', url);
    console.log('Weather data:', data);

    // Determine if it's daytime based on sunrise/sunset
    let isDaytime: boolean | undefined;
    if (data.sys?.sunrise && data.sys?.sunset && data.dt) {
      const currentTime = data.dt;
      const sunrise = data.sys.sunrise;
      const sunset = data.sys.sunset;
      isDaytime = currentTime >= sunrise && currentTime < sunset;
    } else {
      // Fallback: use local time to estimate day/night
      const currentHour = new Date().getHours();
      isDaytime = currentHour >= 6 && currentHour < 20; // Rough estimate: day is 6 AM to 8 PM
    }

    return {
      temperature: Math.round(data.main.temp),
      condition: this.mapWeatherCondition(data.weather[0]?.id || 800),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * (units === 'metric' ? 3.6 : 1)), // Convert m/s to km/h or keep mph
      city: data.name || undefined,
      isDaytime,
    };
  }

  /**
   * Get current weather data
   */
  async getCurrentWeather(units: 'metric' | 'imperial' = 'metric'): Promise<WeatherData> {
    try {
      const config = await loadAPIConfig();
      console.log('config:', config);
      // Check if OpenWeatherMap is configured
      if (
        config.weather.provider === 'openweathermap' &&
        config.weather.apiKey &&
        config.weather.enabled
      ) {
        // Validate API key before attempting to use it
        if (!config.weather.apiKey.trim()) {
          console.warn('OpenWeatherMap API key is empty, falling back to mock data');
        } else {
          try {
            const location = await this.getLocation();
            console.log('location:', location);
            try {
              return await this.fetchFromOpenWeatherMap(
                config.weather.apiKey,
                location.lat,
                location.lon,
                units
              );
            } catch (apiError) {
              const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
              console.error('Failed to fetch from OpenWeatherMap API:', errorMessage);
              // Don't fall through silently - show the error but still provide mock data
              // Fall through to mock data
            }
          } catch (locationError) {
            console.warn('Failed to get location, falling back to mock data:', locationError);
            // Fall through to mock data
          }
        }
      } else {
        console.log('Weather API Check Fails');
        console.log('config.weather.provider:', config.weather.provider);
        console.log('config.weather.apiKey:', config.weather.apiKey);
        console.log('config.weather.enabled:', config.weather.enabled);
      }

      // Fallback to mock data if API is not configured or location fails
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const conditions: WeatherData['condition'][] = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      
      // Estimate day/night for mock data
      const currentHour = new Date().getHours();
      const isDaytime = currentHour >= 6 && currentHour < 20;
      
      return {
        temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
        condition: randomCondition,
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
        isDaytime,
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }
}
