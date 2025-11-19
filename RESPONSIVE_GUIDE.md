# Responsive Design Guide

## CSS Variables

The dashboard uses CSS variables for responsive scaling:

- `--spacing-scale`: Controls spacing between elements (default: 1)
- `--font-scale`: Controls font sizes (default: 1)
- `--touch-min-size`: Minimum touch target size (default: 44px)
- `--scale-base`: Base scaling factor (default: 1)

## Breakpoints

### Desktop (default)
- Base scaling: 1x
- Touch target: 44px (WCAG minimum)

### Mobile Portrait (< 640px)
- Scale: 0.9x
- Touch target: 40px

### Raspberry Pi 720p (1280x720 landscape)
- Scale: 1.1x
- Spacing: 1.15x
- Font: 1.1x
- Touch target: 56px

### Raspberry Pi 1080p (1920x1080 landscape)
- Scale: 1.2x
- Spacing: 1.25x
- Font: 1.15x
- Touch target: 64px

### Touch Devices
- Automatically detected via `(hover: none) and (pointer: coarse)`
- Touch target: minimum 56px
- Spacing: minimum 1.1x

## Usage Examples

### Tailwind Classes

```tsx
// Responsive spacing
<div className="gap-scale-4 p-scale-6">
  {/* Uses spacing-scale variable */}
</div>

// Responsive font sizes
<h1 className="text-scale-3xl">Title</h1>
<p className="text-scale-base">Body text</p>

// Touch-friendly buttons
<button className="min-w-touch min-h-touch">
  Touch Target
</button>
```

### CSS Utility Classes

```tsx
// Touch target utility
<button className="touch-target">
  Large Touch Button
</div>

// Responsive spacing
<div className="spacing-responsive">
  Auto-scaled spacing
</div>

// Responsive text
<p className="text-responsive-lg">
  Large responsive text
</p>
```

### Breakpoint-Specific Styles

```tsx
// Raspberry Pi specific styles
<div className="pi-720p:scale-110 pi-1080p:scale-125">
  Scaled for Pi displays
</div>

// Touch device styles
<div className="touch:min-h-touch">
  Touch-friendly height
</div>
```

## Best Practices

1. **Always use touch targets** for interactive elements on touchscreens:
   ```tsx
   <button className="min-w-touch min-h-touch">
     Click me
   </button>
   ```

2. **Use responsive spacing** for consistent layouts:
   ```tsx
   <div className="gap-scale-4 p-scale-6">
     Content
   </div>
   ```

3. **Use responsive font sizes** for readability:
   ```tsx
   <h1 className="text-scale-3xl">Title</h1>
   ```

4. **Test on actual devices** - The CSS variables automatically adjust, but always verify on the target hardware.

