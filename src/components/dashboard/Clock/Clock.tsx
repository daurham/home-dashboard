import { useEffect, useState } from 'react';
import { useDashboardStore, usePreferencesStore } from '@/lib/store';

export function Clock() {
  const { config } = useDashboardStore();
  const { timeFormat } = usePreferencesStore();
  const clockConfig = config.clock;
  const [time, setTime] = useState(new Date());
  
  // Determine update interval based on what's shown
  const updateInterval = clockConfig.showMilliseconds ? 10 : 
                        clockConfig.showSeconds ? 1000 : 
                        60000; // Update every minute if no seconds
  
  useEffect(() => {
    // Only set up timer if clock is enabled
    if (!clockConfig.enabled) return;
    
    const timer = setInterval(() => {
      setTime(new Date());
    }, updateInterval);
    
    return () => clearInterval(timer);
  }, [updateInterval, clockConfig.enabled]);
  
  // Don't render if disabled
  if (!clockConfig.enabled) {
    return null;
  }
  
  // Format time based on config
  const formatTime = () => {
    if (!clockConfig.showTime) return null;
    
    let hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = clockConfig.showSeconds ? time.getSeconds().toString().padStart(2, '0') : '';
    const milliseconds = clockConfig.showMilliseconds ? time.getMilliseconds().toString().padStart(3, '0') : '';
    
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
      <div className="text-7xl md:text-8xl font-bold tracking-tight text-foreground mb-2">
        <span>{displayHours}</span>
        <span className="animate-pulse">:</span>
        <span>{minutes}</span>
        {seconds && (
          <>
            <span className="animate-pulse">:</span>
            <span>{seconds}</span>
          </>
        )}
        {milliseconds && (
          <>
            <span className="animate-pulse">.</span>
            <span className="text-5xl md:text-6xl">{milliseconds}</span>
          </>
        )}
        {period && <span className="ml-2 text-4xl md:text-5xl">{period}</span>}
      </div>
    );
  };
  
  return (
    <div className="text-center">
      {formatTime()}
    </div>
  );
}

