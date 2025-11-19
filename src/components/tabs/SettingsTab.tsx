import { useThemeStore, ThemeMode, AccentColor, useDashboardStore, usePreferencesStore, TimeFormat, Units } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { useState } from 'react';
import { ColorPicker } from '@/components/ui/color-picker';

const accentColors: Array<{ value: AccentColor; label: string }> = [
  { value: 'teal', label: 'Teal' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'purple', label: 'Purple' },
];

export function SettingsTab() {
  const { themeMode, accentColor, setThemeMode, setAccentColor } = useThemeStore();
  const { config, updateCalendarConfig } = useDashboardStore();
  const { timeFormat, units, setTimeFormat, setUnits } = usePreferencesStore();
  const [calendarOpen, setCalendarOpen] = useState(false);
  
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
              
              <div className="space-y-2">
                <Label htmlFor="time-format">Time Format</Label>
                <Select
                  value={timeFormat}
                  onValueChange={(value) => setTimeFormat(value as TimeFormat)}
                >
                  <SelectTrigger id="time-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12-hour">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24-hour">24-hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Applies to clock and calendar events
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="units">Units</Label>
                <Select
                  value={units}
                  onValueChange={(value) => setUnits(value as Units)}
                >
                  <SelectTrigger id="units">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (°C, km/h)</SelectItem>
                    <SelectItem value="imperial">Imperial (°F, mph)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Applies to weather and other measurements
                </p>
              </div>
            </div>
          </div>
          
          {/* Calendar Settings Collapsible */}
          <div className="border-t pt-4">
            <Collapsible open={calendarOpen} onOpenChange={setCalendarOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-accent/50 rounded-lg p-2 transition-colors">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <h3 className="text-lg font-semibold text-foreground">Calendar Settings</h3>
                </div>
                {calendarOpen ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-day-of-week">First Day of Week</Label>
                    <Select
                      value={config.calendar.firstDayOfWeek.toString()}
                      onValueChange={(value) => updateCalendarConfig({ firstDayOfWeek: parseInt(value) as 0 | 1 })}
                    >
                      <SelectTrigger id="first-day-of-week">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-view">Default View</Label>
                    <Select
                      value={config.calendar.defaultView}
                      onValueChange={(value) => updateCalendarConfig({ defaultView: value as 'week' | 'month' | 'agenda' })}
                    >
                      <SelectTrigger id="default-view">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="agenda">Agenda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weeks-to-show">Weeks to Show</Label>
                    <Input
                      id="weeks-to-show"
                      type="number"
                      min="1"
                      max="8"
                      value={config.calendar.weeksToShow}
                      onChange={(e) => updateCalendarConfig({ weeksToShow: parseInt(e.target.value) || 4 })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="event-display-limit">Event Display Limit</Label>
                    <Input
                      id="event-display-limit"
                      type="number"
                      min="1"
                      max="10"
                      value={config.calendar.eventDisplayLimit}
                      onChange={(e) => updateCalendarConfig({ eventDisplayLimit: parseInt(e.target.value) || 3 })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum events to show per day before "+X more"
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-weekends">Show Weekends</Label>
                      <p className="text-xs text-muted-foreground">
                        Highlight weekend days
                      </p>
                    </div>
                    <Switch
                      id="show-weekends"
                      checked={config.calendar.showWeekends}
                      onCheckedChange={(checked) => updateCalendarConfig({ showWeekends: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-time-slots">Show Time Slots</Label>
                      <p className="text-xs text-muted-foreground">
                        Display time slots in calendar
                      </p>
                    </div>
                    <Switch
                      id="show-time-slots"
                      checked={config.calendar.showTimeSlots}
                      onCheckedChange={(checked) => updateCalendarConfig({ showTimeSlots: checked })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <ColorPicker
                      label="Event Color"
                      value={config.calendar.eventColor}
                      onChange={(value) => updateCalendarConfig({ eventColor: value })}
                      showDefault={true}
                      defaultLabel="Use default event color"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <ColorPicker
                      label="Task Color"
                      value={config.calendar.taskColor}
                      onChange={(value) => updateCalendarConfig({ taskColor: value })}
                      showDefault={true}
                      defaultLabel="Use default task color"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </Card>
    </div>
  );
}
