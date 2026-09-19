/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          canvas: {
            light: '#f5f5f7',
            dark: '#000000',
          },
          subtle: {
            light: '#fbfbfd',
            dark: '#0a0a0c',
          },
          card: {
            light: '#ffffff',
            dark: '#141416',
          },
          elevated: {
            light: '#ffffff',
            dark: '#1c1c1e',
          },
          fill: {
            light: '#efeff2',
            dark: '#2c2c2e',
          },
          border: {
            light: 'rgba(0, 0, 0, 0.08)',
            dark: 'rgba(255, 255, 255, 0.09)',
          },
          text: {
            primary: {
              light: '#1d1d1f',
              dark: '#f5f5f7',
            },
            secondary: {
              light: '#86868b',
              dark: '#a1a1a6',
            },
            tertiary: {
              light: '#a1a1a6',
              dark: '#6e6e73',
            },
          },
          blue: {
            light: '#0071e3',
            dark: '#2997ff',
            DEFAULT: '#0071e3',
          },
          indigo: {
            DEFAULT: '#5e5ce6',
            glow: 'rgba(94, 92, 230, 0.25)',
          },
          teal: '#00c7be',
          green: '#30d158',
          orange: '#ff9f0a',
          red: '#ff453a',
          pink: '#ff375f',
          purple: '#bf5af2',
        },
        background: {
          light: '#fbfbfd',
          dark: '#000000',
        },
        surface: {
          light: '#ffffff',
          dark: '#121214',
        },
        subtle: {
          light: '#f5f5f7',
          dark: '#18181b',
        },
        border: {
          light: '#e5e5ea',
          dark: '#232326',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        charcoal: {
          900: '#1d1d1f',
          800: '#27272a',
          700: '#3f3f46',
          500: '#71717a',
          400: '#a1a1aa',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Plus Jakarta Sans"',
          'Inter',
          'system-ui',
          'sans-serif'
        ],
      },
      borderRadius: {
        'apple': '18px',
        'apple-sm': '12px',
        'apple-lg': '22px',
        'apple-xl': '28px',
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'apple-card': '0 2px 12px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
        'apple-card-dark': '0 4px 24px -2px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'apple-hover': '0 12px 32px -8px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'apple-hover-dark': '0 16px 40px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        'apple-glow': '0 0 30px -4px rgba(99, 102, 241, 0.25)',
        'apple-glow-lg': '0 0 50px -5px rgba(99, 102, 241, 0.35)',
        'dropdown': '0 20px 40px -15px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
