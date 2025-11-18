import { useStore, ThemeMode, AccentColor } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const accentColors: Array<{ value: AccentColor; label: string }> = [
  { value: 'teal', label: 'Teal' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'purple', label: 'Purple' },
];

export function SettingsTab() {
  const { themeMode, accentColor, setThemeMode, setAccentColor } = useStore();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Settings</h2>
        <p className="text-muted-foreground">
          Customize your dashboard appearance and preferences
        </p>
      </div>
      
      <Card className="p-6 space-y-6 bg-card">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Appearance</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme-mode">Theme Mode</Label>
                <Select
                  value={themeMode}
                  onValueChange={(value) => setThemeMode(value as ThemeMode)}
                >
                  <SelectTrigger id="theme-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color</Label>
                <Select
                  value={accentColor}
                  onValueChange={(value) => setAccentColor(value as AccentColor)}
                >
                  <SelectTrigger id="accent-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accentColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        {color.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
