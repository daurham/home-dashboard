import { useEffect, useState } from 'react';

export function Clock() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = time.toLocaleDateString('en-US', dateOptions);
  
  return (
    <div className="text-center">
      <div className="text-7xl md:text-8xl font-bold tracking-tight text-foreground mb-2">
        {hours}
        <span className="animate-pulse">:</span>
        {minutes}
        <span className="animate-pulse">:</span>
        {seconds}
      </div>
      <div className="text-xl md:text-2xl text-muted-foreground">
        {formattedDate}
      </div>
    </div>
  );
}
