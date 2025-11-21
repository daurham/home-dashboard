import { Clock } from '@/components/dashboard/Clock/Clock';
import { WeatherWidget } from '@/components/dashboard/Weather/WeatherWidget';
import { CalendarView } from '@/components/dashboard/Calendar/CalendarView';
import { useDashboardStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, CloudLightning } from 'lucide-react';
import { WeatherService, WeatherData } from '@/services/weatherService';
import { usePreferencesStore } from '@/lib/store';

const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  stormy: CloudLightning,
};

// Compact mobile clock component
function MobileClock() {
  const { config } = useDashboardStore();
  const { timeFormat } = usePreferencesStore();
  const clockConfig = config.clock;
  const [time, setTime] = useState(new Date());
  
  if (!clockConfig.enabled || !clockConfig.showTime) {
    return null;
  }
  
  const updateInterval = clockConfig.showMilliseconds ? 10 : 
                        clockConfig.showSeconds ? 1000 : 
                        60000;
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, updateInterval);
    return () => clearInterval(timer);
  }, [updateInterval]);
  
  let hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = clockConfig.showSeconds ? time.getSeconds().toString().padStart(2, '0') : '';
  
  let displayHours: string;
  let period: string | null = null;
  
  if (timeFormat === '12-hour') {
    period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    displayHours = clockConfig.showPadding ? hours.toString().padStart(2, '0') : hours.toString();
  } else {
    displayHours = hours.toString().padStart(2, '0');
  }
  
  return (
    <div className="text-xl font-semibold text-foreground">
      {displayHours}:{minutes}
      {seconds && `:${seconds}`}
      {period && <span className="ml-1 text-sm">{period}</span>}
    </div>
  );
}

// Compact mobile weather component
function MobileWeather() {
  const { config } = useDashboardStore();
  const { units } = usePreferencesStore();
  const weatherConfig = config.weather;
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  
  if (!weatherConfig.enabled || !weatherConfig.showCurrentWeather) {
    return null;
  }
  
  useEffect(() => {
    const loadWeather = async () => {
      const service = WeatherService.getInstance();
      const data = await service.getCurrentWeather();
      setWeather(data);
      setLoading(false);
    };
    
    loadWeather();
    const interval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [weatherConfig.showCurrentWeather]);
  
  if (loading || !weather) {
    return (
      <div className="text-sm text-muted-foreground">Loading...</div>
    );
  }
  
  const WeatherIcon = weatherIcons[weather.condition];
  const temperatureUnit = units === 'metric' ? '°C' : '°F';
  
  return (
    <div className="flex items-center gap-2">
      <WeatherIcon className="h-5 w-5 text-weather-icon" />
      <div className="text-sm font-medium text-foreground">
        {weather.temperature}{temperatureUnit}
      </div>
    </div>
  );
}

export function CalendarTab() {
  const { config } = useDashboardStore();
  const isMobile = useIsMobile();
  const clockEnabled = config.clock.enabled;
  const weatherEnabled = config.weather.enabled;
  const showClockOrWeather = clockEnabled || weatherEnabled;
  
  return (
    <div className="space-y-4 md:space-y-8">
      {/* Mobile: Compact clock and weather in header */}
      {isMobile && showClockOrWeather && (
        <div className="flex items-center justify-between gap-4">
          {clockEnabled && <MobileClock />}
          {weatherEnabled && <MobileWeather />}
        </div>
      )}
      
      {/* Desktop: Full clock and weather */}
      {!isMobile && showClockOrWeather && (
        <div className={`flex gap-4 md:gap-6 ${weatherEnabled ? 'flex-row' : 'flex-col'}`}>
          <div className={weatherEnabled ? 'flex-1 min-w-0' : 'w-full'}>
            <Clock />
          </div>
          {weatherEnabled && (
            <div className="flex-1 min-w-0 flex items-center justify-center">
              <WeatherWidget />
            </div>
          )}
        </div>
      )}
      
      {/* Calendar Section */}
      <div className="w-full overflow-x-auto">
        <CalendarView />
      </div>
    </div>
  );
}
