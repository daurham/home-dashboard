import { Clock } from '@/components/Clock';
import { WeatherWidget } from '@/components/WeatherWidget';
import { CalendarView } from '@/components/CalendarView';

export function CalendarTab() {
  return (
    <div className="space-y-8">
      {/* Clock and Weather Section */}
      <div className="space-y-6">
        <Clock />
        <WeatherWidget />
      </div>
      
      {/* Calendar Section */}
      <CalendarView />
    </div>
  );
}
