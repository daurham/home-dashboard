import { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning, Moon } from 'lucide-react';
import { WeatherService, WeatherData } from '@/services/weatherService';
import { Card } from '@/components/ui/card';
import { useDashboardStore, usePreferencesStore } from '@/lib/store';

const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  stormy: CloudLightning,
};

export function WeatherWidget() {
  const { config } = useDashboardStore();
  const { units } = usePreferencesStore();
  const weatherConfig = config.weather;
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Don't render if disabled
  if (!weatherConfig.enabled) {
    return null;
  }

  console.log('weatherConfig:', weatherConfig);
  useEffect(() => {
    if (!weatherConfig.showCurrentWeather) {
      setLoading(false);
      return;
    }
    
    const loadWeather = async () => {
      try {
        const service = WeatherService.getInstance();
        const data = await service.getCurrentWeather(units);
        console.log('data:', data);
        setWeather(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load weather:', error);
        setLoading(false);
      }
    };
    
    loadWeather();
    
    // Refresh weather every 10 minutes
    const interval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [weatherConfig.showCurrentWeather, units]);
  
  if (!weatherConfig.showCurrentWeather) {
    return null;
  }
  
  if (loading || !weather) {
    return (
      <Card className="p-6 flex items-center justify-center bg-card">
        <div className="text-muted-foreground">Loading weather...</div>
      </Card>
    );
  }
  
  // Use Moon icon for clear skies at night, otherwise use the condition icon
  const WeatherIcon = weather.condition === 'sunny' && weather.isDaytime === false 
    ? Moon 
    : weatherIcons[weather.condition];
  const temperatureUnit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'km/h' : 'mph';
  
  // Update condition text for night clear skies
  const conditionText = weather.condition === 'sunny' && weather.isDaytime === false 
    ? 'clear' 
    : weather.condition;
  
  return (
    <Card className="p-6 bg-card">
      <div className="flex items-center gap-4">
        <WeatherIcon className="h-12 w-12 text-weather-icon" />
        <div className="flex-1">
          {weather.city && (
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {weather.city}
            </div>
          )}
          <div className="text-3xl font-bold text-foreground">
            {weather.temperature}{temperatureUnit}
          </div>
          <div className="text-sm text-muted-foreground capitalize">
            {conditionText}
          </div>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          <div>Humidity: {weather.humidity}%</div>
          <div>Wind: {weather.windSpeed} {windUnit}</div>
        </div>
      </div>
    </Card>
  );
}

