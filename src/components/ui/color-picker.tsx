import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface ColorOption {
  value: string; // HSL format: "hue saturation% lightness%"
  label: string;
  preview: string; // CSS color for preview
}

const predefinedColors: ColorOption[] = [
  { value: '180 65% 35%', label: 'Teal', preview: 'hsl(180, 65%, 35%)' },
  { value: '217 91% 60%', label: 'Blue', preview: 'hsl(217, 91%, 60%)' },
  { value: '142 76% 36%', label: 'Green', preview: 'hsl(142, 76%, 36%)' },
  { value: '25 95% 53%', label: 'Orange', preview: 'hsl(25, 95%, 53%)' },
  { value: '262 83% 58%', label: 'Purple', preview: 'hsl(262, 83%, 58%)' },
  { value: '0 84% 60%', label: 'Red', preview: 'hsl(0, 84%, 60%)' },
  { value: '48 96% 53%', label: 'Yellow', preview: 'hsl(48, 96%, 53%)' },
  { value: '340 82% 52%', label: 'Pink', preview: 'hsl(340, 82%, 52%)' },
  { value: '199 89% 48%', label: 'Cyan', preview: 'hsl(199, 89%, 48%)' },
  { value: '271 81% 56%', label: 'Violet', preview: 'hsl(271, 81%, 56%)' },
  { value: '39 100% 50%', label: 'Amber', preview: 'hsl(39, 100%, 50%)' },
  { value: '260 60% 50%', label: 'Indigo', preview: 'hsl(260, 60%, 50%)' },
];

interface ColorPickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  showDefault?: boolean;
  defaultLabel?: string;
}

export function ColorPicker({ 
  value, 
  onChange, 
  label,
  showDefault = true,
  defaultLabel = 'Default'
}: ColorPickerProps) {
  const isDefault = !value;
  const selectedColor = predefinedColors.find(c => c.value === value);

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium text-foreground">{label}</div>}
      <div className="flex flex-wrap gap-2">
        {showDefault && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={cn(
              'relative h-10 w-10 rounded-md border-2 transition-all',
              'hover:scale-110 hover:shadow-md',
              isDefault 
                ? 'border-foreground shadow-md' 
                : 'border-border hover:border-foreground/50'
            )}
            title={defaultLabel}
          >
            <div className="h-full w-full rounded-md bg-gradient-to-br from-muted to-muted-foreground/20" />
            {isDefault && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="h-4 w-4 text-foreground" />
              </div>
            )}
          </button>
        )}
        {predefinedColors.map((color) => {
          const isSelected = value === color.value;
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange(color.value)}
              className={cn(
                'relative h-10 w-10 rounded-md border-2 transition-all',
                'hover:scale-110 hover:shadow-md',
                isSelected
                  ? 'border-foreground shadow-md'
                  : 'border-border hover:border-foreground/50'
              )}
              style={{ backgroundColor: color.preview }}
              title={color.label}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {selectedColor && (
        <p className="text-xs text-muted-foreground">
          Selected: {selectedColor.label}
        </p>
      )}
    </div>
  );
}

