import { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning, Moon } from 'lucide-react';
import { WeatherService, WeatherData } from '@/services/weatherService';
import { Card } from '@/components/ui/card';
import { useDashboardStore, usePreferencesStore } from '@/lib/store';
import { Skeleton } from '@/components/ui/skeleton';

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
      try {
        const service = WeatherService.getInstance();
        const data = await service.getCurrentWeather(units);
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
      <Card className="flex items-center justify-center bg-card py-1.5 px-2.5 xl:p-6">
        <div className="flex w-full items-center gap-3" role="status" aria-label="Loading weather">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full xl:h-12 xl:w-12" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
        </div>
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
    <Card className="py-1.5 px-2.5 md:py-1.5 md:px-3 lg:py-1.5 lg:px-3 xl:p-6 bg-card">
      <div className="flex items-center gap-2 md:gap-2.5 lg:gap-2.5 xl:gap-4">
        {/* Icon - same on all sizes */}
        <WeatherIcon className="h-7 w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 xl:h-12 xl:w-12 text-weather-icon flex-shrink-0" />
        
        {/* Desktop Layout (xl+): Icon | City/Temp/Status (middle) | Humidity/Wind (right) */}
        <div className="hidden xl:flex flex-1 items-center gap-4">
          {/* Middle section: City above, Temp middle, Status below */}
          <div className="flex flex-col flex-1 min-w-0">
            {weather.city && (
              <div className="text-sm font-medium text-muted-foreground truncate mb-1">
                {weather.city}
              </div>
            )}
            <div className="text-3xl font-bold text-foreground whitespace-nowrap">
              {weather.temperature}{temperatureUnit}
            </div>
            <div className="text-sm text-muted-foreground capitalize mt-1">
              {conditionText}
            </div>
          </div>
          
          {/* Right section: Humidity and Wind stacked */}
          <div className="flex flex-col items-end text-sm text-muted-foreground">
            <div className="whitespace-nowrap mb-0.5">
              <span className="font-medium">Humidity: </span>
              {weather.humidity}%
            </div>
            <div className="whitespace-nowrap">
              <span className="font-medium">Wind: </span>
              {weather.windSpeed} {windUnit}
            </div>
          </div>
        </div>
        
        {/* Tablet/Smaller Layout (up to lg): Icon | Temp + City/Status (middle) | Humidity/Wind (right) */}
        <div className="flex xl:hidden flex-1 items-center gap-2 md:gap-2.5 lg:gap-3 min-w-0">
          {/* Middle section: Temp, then City and Status stacked next to it */}
          <div className="flex items-center gap-1.5 md:gap-2 lg:gap-2 flex-1 min-w-0">
            <div className="text-lg md:text-xl lg:text-2xl font-bold text-foreground whitespace-nowrap">
              {weather.temperature}{temperatureUnit}
            </div>
            <div className="flex flex-col gap-0.5 justify-center min-w-0">
              {weather.city && (
                <div className="text-[10px] md:text-xs lg:text-xs font-medium text-muted-foreground truncate">
                  {weather.city}
                </div>
              )}
              <div className="text-[10px] md:text-xs lg:text-xs text-muted-foreground capitalize">
                {conditionText}
              </div>
            </div>
          </div>
          
          {/* Right section: Humidity and Wind stacked */}
          <div className="flex flex-col items-center gap-0.5 text-[10px] md:text-xs lg:text-xs text-muted-foreground">
            <div className="whitespace-nowrap">
              H: {weather.humidity}%
            </div>
            <div className="whitespace-nowrap">
              W: {weather.windSpeed} {windUnit}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

