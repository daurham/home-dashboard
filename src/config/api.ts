/**
 * API configuration
 * 
 * Centralized API endpoints and service configurations.
 * Can be overridden by environment variables or external config.
 */

export interface WeatherAPIConfig {
  enabled: boolean;
  provider: 'openweathermap' | 'weathergov' | 'mock';
  apiKey?: string;
  baseUrl?: string;
  updateInterval: number; // milliseconds
  units: 'metric' | 'imperial';
}

export interface CalendarAPIConfig {
  enabled: boolean;
  provider: 'google' | 'caldav' | 'local';
  apiKey?: string;
  baseUrl?: string;
  syncInterval: number; // milliseconds
}

export interface HomeAssistantConfig {
  enabled: boolean;
  baseUrl: string;
  accessToken?: string;
  websocketUrl?: string;
  autoReconnect: boolean;
  reconnectInterval: number; // milliseconds
}

export interface APIConfig {
  weather: WeatherAPIConfig;
  calendar: CalendarAPIConfig;
  homeAssistant: HomeAssistantConfig;
  timeout: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

export const defaultAPIConfig: APIConfig = {
  weather: {
    enabled: true,
    provider: 'mock', // Will be overridden by loadAPIConfig if API key is present
    updateInterval: 10 * 60 * 1000, // 10 minutes
    units: 'metric',
  },
  calendar: {
    enabled: true,
    provider: 'local',
    syncInterval: 5 * 60 * 1000, // 5 minutes
  },
  homeAssistant: {
    enabled: false,
    baseUrl: import.meta.env.VITE_HOME_ASSISTANT_URL || 'http://homeassistant.local:8123',
    websocketUrl: import.meta.env.VITE_HOME_ASSISTANT_WS_URL,
    autoReconnect: true,
    reconnectInterval: 5000, // 5 seconds
  },
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Load API config from environment variables or external source
 */
export async function loadAPIConfig(): Promise<APIConfig> {
  const config = { ...defaultAPIConfig };

  // Override with environment variables
  if (import.meta.env.VITE_WEATHER_API_KEY) {
    config.weather.apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    // Auto-set provider to openweathermap if API key is present and provider not explicitly set
    if (!import.meta.env.VITE_WEATHER_PROVIDER) {
      config.weather.provider = 'openweathermap';
    }
  }
  if (import.meta.env.VITE_WEATHER_PROVIDER) {
    config.weather.provider = import.meta.env.VITE_WEATHER_PROVIDER as WeatherAPIConfig['provider'];
  }
  if (import.meta.env.VITE_WEATHER_BASE_URL) {
    config.weather.baseUrl = import.meta.env.VITE_WEATHER_BASE_URL;
  }

  if (import.meta.env.VITE_CALENDAR_API_KEY) {
    config.calendar.apiKey = import.meta.env.VITE_CALENDAR_API_KEY;
  }
  if (import.meta.env.VITE_CALENDAR_PROVIDER) {
    config.calendar.provider = import.meta.env.VITE_CALENDAR_PROVIDER as CalendarAPIConfig['provider'];
  }
  if (import.meta.env.VITE_CALENDAR_BASE_URL) {
    config.calendar.baseUrl = import.meta.env.VITE_CALENDAR_BASE_URL;
  }

  if (import.meta.env.VITE_HOME_ASSISTANT_TOKEN) {
    config.homeAssistant.accessToken = import.meta.env.VITE_HOME_ASSISTANT_TOKEN;
  }

  // Cache the config
  setAPIConfig(config);

  // TODO: Load from external source (database/Home Assistant)
  // Example:
  // const response = await fetch('/api/config/api');
  // return { ...config, ...await response.json() };

  return config;
}

// Cache for loaded config
let cachedConfig: APIConfig | null = null;

/**
 * Get API config (with fallback to defaults and env vars)
 * This will use cached config if available, otherwise return defaults
 */
export function getAPIConfig(): APIConfig {
  // Return cached config if available, otherwise return defaults
  // Components should call loadAPIConfig() once on mount to ensure env vars are loaded
  return cachedConfig || defaultAPIConfig;
}

/**
 * Set the cached API config (called by loadAPIConfig)
 */
export function setAPIConfig(config: APIConfig): void {
  cachedConfig = config;
}

/**
 * Get API endpoint URL
 */
export function getAPIEndpoint(service: keyof APIConfig, path: string = ''): string {
  const config = getAPIConfig();
  
  switch (service) {
    case 'weather':
      return config.weather.baseUrl 
        ? `${config.weather.baseUrl}${path}`
        : path;
    case 'calendar':
      return config.calendar.baseUrl 
        ? `${config.calendar.baseUrl}${path}`
        : path;
    case 'homeAssistant':
      return `${config.homeAssistant.baseUrl}${path}`;
    default:
      return path;
  }
}

