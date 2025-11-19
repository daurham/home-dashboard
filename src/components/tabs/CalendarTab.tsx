import { Clock } from '@/components/dashboard/Clock/Clock';
import { WeatherWidget } from '@/components/dashboard/Weather/WeatherWidget';
import { CalendarView } from '@/components/dashboard/Calendar/CalendarView';
import { useDashboardStore } from '@/lib/store';

export function CalendarTab() {
  const { config } = useDashboardStore();
  const clockEnabled = config.clock.enabled;
  const weatherEnabled = config.weather.enabled;
  const showClockOrWeather = clockEnabled || weatherEnabled;
  
  return (
    <div className="space-y-8">
      {/* Clock and Weather Section */}
      {showClockOrWeather && (
        <div className={`flex gap-6 ${weatherEnabled ? 'flex-row' : 'flex-col'}`}>
          <div className={weatherEnabled ? 'flex-1' : 'w-full'}>
            <Clock />
          </div>
          {weatherEnabled && (
            <div className="flex-1 flex items-center justify-center">
              <WeatherWidget />
            </div>
          )}
        </div>
      )}
      
      {/* Calendar Section */}
      <CalendarView />
    </div>
  );
}
