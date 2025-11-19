import { ThemeMode, AccentColor } from '@/lib/store';

/**
 * Theme configuration
 * 
 * Can be overridden by:
 * - User preferences (stored in themeStore)
 * - External config (database/Home Assistant)
 * - Environment variables
 */
export interface ThemeConfig {
  defaultMode: ThemeMode;
  defaultAccentColor: AccentColor;
  availableAccentColors: AccentColor[];
  allowThemeToggle: boolean;
  allowAccentColorChange: boolean;
}

export const defaultThemeConfig: ThemeConfig = {
  defaultMode: 'light',
  defaultAccentColor: 'teal',
  availableAccentColors: ['teal', 'blue', 'green', 'orange', 'purple'],
  allowThemeToggle: true,
  allowAccentColorChange: true,
};

/**
 * Load theme config from external source
 * This can be extended to fetch from API/database/Home Assistant
 */
export async function loadThemeConfig(): Promise<ThemeConfig> {
  // TODO: Load from external source
  // Example:
  // const response = await fetch('/api/config/theme');
  // return { ...defaultThemeConfig, ...await response.json() };
  
  return defaultThemeConfig;
}

/**
 * Get theme config (with fallback to defaults)
 */
export function getThemeConfig(): ThemeConfig {
  // In the future, this can check for loaded config
  return defaultThemeConfig;
}

