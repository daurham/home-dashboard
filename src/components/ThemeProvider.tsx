import { useEffect } from 'react';
import { useThemeStore } from '@/lib/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode, accentColor } = useThemeStore();
  
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme mode
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply accent color
    root.setAttribute('data-accent', accentColor);
  }, [themeMode, accentColor]);
  
  return <>{children}</>;
}
