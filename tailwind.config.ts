import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Raspberry Pi specific breakpoints
      'pi-720p': '1280px', // 720p landscape
      'pi-1080p': '1920px', // 1080p landscape
      'touch': {'raw': '(hover: none) and (pointer: coarse)'}, // Touch device
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        dashboard: {
          bg: "hsl(var(--dashboard-bg))",
          panel: "hsl(var(--dashboard-panel))",
        },
        calendar: {
          today: "hsl(var(--calendar-today))",
          "today-bg": "hsl(var(--calendar-today-bg))",
          event: "hsl(var(--calendar-event))",
          task: "hsl(var(--calendar-task))",
          weekend: "hsl(var(--calendar-weekend))",
        },
        weather: {
          icon: "hsl(var(--weather-icon))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        'scale': 'calc(1rem * var(--spacing-scale))',
        'scale-2': 'calc(0.5rem * var(--spacing-scale))',
        'scale-4': 'calc(1rem * var(--spacing-scale))',
        'scale-6': 'calc(1.5rem * var(--spacing-scale))',
        'scale-8': 'calc(2rem * var(--spacing-scale))',
        'scale-12': 'calc(3rem * var(--spacing-scale))',
        'scale-16': 'calc(4rem * var(--spacing-scale))',
      },
      fontSize: {
        'scale-xs': 'calc(0.75rem * var(--font-scale))',
        'scale-sm': 'calc(0.875rem * var(--font-scale))',
        'scale-base': 'calc(1rem * var(--font-scale))',
        'scale-lg': 'calc(1.125rem * var(--font-scale))',
        'scale-xl': 'calc(1.25rem * var(--font-scale))',
        'scale-2xl': 'calc(1.5rem * var(--font-scale))',
        'scale-3xl': 'calc(1.875rem * var(--font-scale))',
        'scale-4xl': 'calc(2.25rem * var(--font-scale))',
        'scale-5xl': 'calc(3rem * var(--font-scale))',
        'scale-6xl': 'calc(3.75rem * var(--font-scale))',
        'scale-7xl': 'calc(4.5rem * var(--font-scale))',
        'scale-8xl': 'calc(6rem * var(--font-scale))',
      },
      minWidth: {
        'touch': 'var(--touch-min-size)',
      },
      minHeight: {
        'touch': 'var(--touch-min-size)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
