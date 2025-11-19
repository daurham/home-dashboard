import { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning } from 'lucide-react';
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
  
  useEffect(() => {
    if (!weatherConfig.showCurrentWeather) {
      setLoading(false);
      return;
    }
    
    const loadWeather = async () => {
      const service = WeatherService.getInstance();
      const data = await service.getCurrentWeather();
      setWeather(data);
      setLoading(false);
    };
    
    loadWeather();
    
    // Refresh weather every 10 minutes
    const interval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [weatherConfig.showCurrentWeather]);
  
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
  
  const WeatherIcon = weatherIcons[weather.condition];
  const temperatureUnit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'km/h' : 'mph';
  
  return (
    <Card className="p-6 bg-card">
      <div className="flex items-center gap-4">
        <WeatherIcon className="h-12 w-12 text-weather-icon" />
        <div>
          <div className="text-3xl font-bold text-foreground">
            {weather.temperature}{temperatureUnit}
          </div>
          <div className="text-sm text-muted-foreground capitalize">
            {weather.condition}
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

