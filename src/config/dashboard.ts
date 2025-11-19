import { SidebarTab } from '@/lib/store';

/**
 * Dashboard configuration
 * 
 * Controls dashboard behavior, visible tabs, calendar settings, and kiosk mode.
 * Can be loaded from database/Home Assistant/custom AI.
 */

export interface ClockConfig {
  enabled: boolean;
  showPadding: boolean;
  showDate: boolean;
  showTime: boolean;
  showSeconds: boolean;
  showMilliseconds: boolean;
}

export interface CalendarConfig {
  defaultView: 'week' | 'month' | 'agenda';
  weeksToShow: number;
  showWeekends: boolean;
  showTimeSlots: boolean;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  eventDisplayLimit: number; // Max events to show per day before "+X more"
  eventColor?: string; // HSL color for events (e.g., "180 65% 35%")
  taskColor?: string; // HSL color for tasks (e.g., "260 60% 50%")
}

export interface WeatherConfig {
  enabled: boolean;
  apiKey: string;
  provider: 'openweathermap' | 'weatherapi';
  baseUrl: string;
  language: string;
  showCurrentWeather: boolean;
  showForecast: boolean;
  showHourlyForecast: boolean;
  showDailyForecast: boolean;
  showAirQuality: boolean;
  showRainProbability: boolean;
}

export interface KioskModeConfig {
  enabled: boolean;
  autoRotateTabs: boolean;
  rotationInterval: number; // seconds
  allowedTabs: SidebarTab[];
  hideSidebar: boolean;
  hideNavigation: boolean;
  preventInteraction: boolean;
}

export interface DashboardConfig {
  defaultTab: SidebarTab;
  visibleTabs: SidebarTab[];
  sidebarCollapsedByDefault: boolean;
  clock: ClockConfig;
  calendar: CalendarConfig;
  weather: WeatherConfig;
  kioskMode: KioskModeConfig;
}

export const defaultDashboardConfig: DashboardConfig = {
  defaultTab: 'calendar',
  visibleTabs: ['calendar', 'plants', 'devices', 'security', 'settings', 'ai'],
  sidebarCollapsedByDefault: false,
  clock: {
    enabled: true,
    showPadding: false,
    showDate: true,
    showTime: true,
    showSeconds: true,
    showMilliseconds: false,
  },
  calendar: {
    defaultView: 'week',
    weeksToShow: 4,
    showWeekends: true,
    showTimeSlots: true,
    firstDayOfWeek: 1, // Monday
    eventDisplayLimit: 3,
    eventColor: undefined, // Uses CSS variable if not set
    taskColor: undefined, // Uses CSS variable if not set
  },
  weather: {
    enabled: true,
    apiKey: '',
    provider: 'openweathermap',
    baseUrl: '',
    language: 'en',
    showCurrentWeather: true,
    showForecast: true,
    showHourlyForecast: true,
    showDailyForecast: true,
    showAirQuality: true,
    showRainProbability: true,
  },
  kioskMode: {
    enabled: false,
    autoRotateTabs: false,
    rotationInterval: 30,
    allowedTabs: ['calendar', 'devices', 'security'],
    hideSidebar: false,
    hideNavigation: false,
    preventInteraction: false,
  },
};

/**
 * Load dashboard config from external source
 * This can be extended to fetch from API/database/Home Assistant
 */
export async function loadDashboardConfig(): Promise<DashboardConfig> {
  // TODO: Load from external source
  // Example:
  // const response = await fetch('/api/config/dashboard');
  // return { ...defaultDashboardConfig, ...await response.json() };
  
  // Or from Home Assistant:
  // const haConfig = await homeAssistant.getConfig('dashboard');
  // return { ...defaultDashboardConfig, ...haConfig };
  
  return defaultDashboardConfig;
}

/**
 * Get dashboard config (with fallback to defaults)
 */
export function getDashboardConfig(): DashboardConfig {
  // In the future, this can check for loaded config
  return defaultDashboardConfig;
}

/**
 * Check if a tab should be visible based on config
 */
export function isTabVisible(tab: SidebarTab, config: DashboardConfig): boolean {
  return config.visibleTabs.includes(tab);
}

/**
 * Check if kiosk mode is active
 */
export function isKioskMode(config: DashboardConfig): boolean {
  return config.kioskMode.enabled;
}

