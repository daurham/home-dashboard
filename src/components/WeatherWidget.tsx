import { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning } from 'lucide-react';
import { WeatherService, WeatherData } from '@/services/weatherService';
import { Card } from '@/components/ui/card';

const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  stormy: CloudLightning,
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
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
  }, []);
  
  if (loading || !weather) {
    return (
      <Card className="p-6 flex items-center justify-center bg-card">
        <div className="text-muted-foreground">Loading weather...</div>
      </Card>
    );
  }
  
  const WeatherIcon = weatherIcons[weather.condition];
  
  return (
    <Card className="p-6 bg-card">
      <div className="flex items-center gap-4">
        <WeatherIcon className="h-12 w-12 text-weather-icon" />
        <div>
          <div className="text-3xl font-bold text-foreground">
            {weather.temperature}°C
          </div>
          <div className="text-sm text-muted-foreground capitalize">
            {weather.condition}
          </div>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          <div>Humidity: {weather.humidity}%</div>
          <div>Wind: {weather.windSpeed} km/h</div>
        </div>
      </div>
    </Card>
  );
}
