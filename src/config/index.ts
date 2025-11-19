/**
 * Configuration system
 * 
 * Centralized configuration for the dashboard.
 * Configs can be loaded from:
 * - Default values (defined here)
 * - Environment variables
 * - External APIs (database/Home Assistant/custom AI)
 * 
 * Usage:
 *   import { getDashboardConfig, loadDashboardConfig } from '@/config';
 *   
 *   // Get config (synchronous, uses defaults or cached)
 *   const config = getDashboardConfig();
 *   
 *   // Load config from external source (async)
 *   const config = await loadDashboardConfig();
 */

// Import functions for use in this file
import { loadThemeConfig } from './theme';
import { loadDashboardConfig } from './dashboard';
import { loadAPIConfig } from './api';

// Theme config
export {
  type ThemeConfig,
  defaultThemeConfig,
  loadThemeConfig,
  getThemeConfig,
} from './theme';

// Dashboard config
export {
  type DashboardConfig,
  type ClockConfig,
  type CalendarConfig,
  type WeatherConfig,
  type KioskModeConfig,
  defaultDashboardConfig,
  loadDashboardConfig,
  getDashboardConfig,
  isTabVisible,
  isKioskMode,
} from './dashboard';

// API config
export {
  type APIConfig,
  type WeatherAPIConfig,
  type CalendarAPIConfig,
  type HomeAssistantConfig,
  defaultAPIConfig,
  loadAPIConfig,
  getAPIConfig,
  getAPIEndpoint,
} from './api';

/**
 * Load all configurations from external sources
 * This is useful for initial app setup
 */
export async function loadAllConfigs() {
  const [theme, dashboard, api] = await Promise.all([
    loadThemeConfig(),
    loadDashboardConfig(),
    loadAPIConfig(),
  ]);

  return {
    theme,
    dashboard,
    api,
  };
}

