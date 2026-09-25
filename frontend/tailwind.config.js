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
        // SlotSure Spatial Physical Material Palette
        porcelain: {
          50: '#FAF9F6',
          100: '#F4F3EF', // Main Warm Porcelain
          200: '#ECEAE4',
          300: '#E0DDD4',
          DEFAULT: '#F4F3EF',
        },
        stone: {
          50: '#F5F4F0',
          100: '#E8E6DF', // Soft Stone
          200: '#D9D6CC',
          300: '#C7C3B6',
          400: '#A49F90',
          800: '#1C1D1A', // Dark Stone
          900: '#141513', // Deep Dark Stone Canvas
          DEFAULT: '#E8E6DF',
        },
        graphite: {
          800: '#2A2B28',
          900: '#20211F', // Primary Graphite
          DEFAULT: '#20211F',
        },
        charcoal: {
          700: '#484944',
          800: '#30312E', // Secondary Charcoal
          DEFAULT: '#30312E',
        },
        // Clinical Meaningful Semaphores
        sage: {
          100: '#E9EFEA',
          200: '#C7D8CB',
          500: '#718477', // Muted Sage - Confirmed/Healthy/Recovered
          600: '#5A6E60',
          DEFAULT: '#718477',
        },
        eucalyptus: {
          500: '#40584B', // Deep Eucalyptus
          600: '#34493D',
          DEFAULT: '#40584B',
        },
        amber: {
          100: '#F8F1E6',
          200: '#EBD7BE',
          500: '#B18A52', // Warm Amber - Attention / Medium Risk
          600: '#94723F',
          DEFAULT: '#B18A52',
        },
        coral: {
          100: '#F7EBE8',
          200: '#E8C5BE',
          500: '#B96F63', // Muted Coral - High Risk / Intervene
          600: '#9E5A50',
          DEFAULT: '#B96F63',
        },
        steel: {
          100: '#ECEEF0',
          200: '#D0D5D9',
          500: '#71808A', // Steel - Informational
          600: '#596770',
          DEFAULT: '#71808A',
        },
        // Apple / Legacy compatibility tokens
        brand: {
          50: '#F4F3EF',
          100: '#E8E6DF',
          500: '#718477',
          600: '#40584B',
          700: '#30312E',
        },
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
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        'spatial-xs': '8px',
        'spatial-sm': '12px',
        'spatial-md': '18px',
        'spatial-lg': '24px',
        'spatial-xl': '32px',
      },
      boxShadow: {
        'spatial-soft': '0 2px 8px -2px rgba(32, 33, 31, 0.04), 0 1px 3px 0 rgba(32, 33, 31, 0.02)',
        'spatial-card': '0 4px 20px -2px rgba(32, 33, 31, 0.06), 0 1px 3px 0 rgba(32, 33, 31, 0.02), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)',
        'spatial-card-dark': '0 8px 32px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'spatial-elevated': '0 16px 48px -8px rgba(32, 33, 31, 0.1), 0 4px 12px -2px rgba(32, 33, 31, 0.04)',
        'spatial-dock': '0 20px 50px -10px rgba(0, 0, 0, 0.15), 0 0 1px 1px rgba(255, 255, 255, 0.6)',
      },
    },
  },
  plugins: [],
}
