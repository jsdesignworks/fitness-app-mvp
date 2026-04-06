import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '320px',
        '3xl': '1440px',
      },
      spacing: {
        'dps-gutter': 'var(--dps-page-gutter)',
        'dps-section': 'var(--dps-section-gap)',
        'dps-stack': 'var(--dps-stack-gap)',
        k1: 'var(--space-1)',
        k2: 'var(--space-2)',
        k3: 'var(--space-3)',
        k4: 'var(--space-4)',
        k5: 'var(--space-5)',
        k6: 'var(--space-6)',
        k8: 'var(--space-8)',
        k10: 'var(--space-10)',
        k12: 'var(--space-12)',
        k16: 'var(--space-16)',
        k20: 'var(--space-20)',
      },
      maxWidth: {
        content: 'var(--dps-content-max)',
        'content-wide': 'var(--dps-content-wide-max)',
      },
      minHeight: {
        touch: 'var(--dps-touch-min)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'k-xs': ['12px', { lineHeight: '1.5' }],
        'k-sm': ['14px', { lineHeight: '1.5' }],
        'k-base': ['16px', { lineHeight: '1.5' }],
        'k-lg': ['18px', { lineHeight: '1.4' }],
        'k-xl': ['20px', { lineHeight: '1.3' }],
        'k-2xl': ['24px', { lineHeight: '1.2' }],
        'k-3xl': ['32px', { lineHeight: '1.1' }],
        'k-4xl': ['36px', { lineHeight: '1' }],
        'k-5xl': ['48px', { lineHeight: '1' }],
        'k-6xl': ['72px', { lineHeight: '1' }],
      },
      letterSpacing: {
        kinetic: '0.5px',
        'kinetic-wide': '1px',
        'kinetic-wider': '2px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'var(--radius-xl)',
        '2xl': '1rem',
      },
      boxShadow: {
        'k-sm': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'k-md': '0 4px 6px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.23)',
        'k-lg': '0 8px 16px rgba(0, 0, 0, 0.24), 0 4px 8px rgba(0, 0, 0, 0.19)',
        'k-xl': '0 20px 60px rgba(0, 0, 0, 0.8)',
        'glow-orange': '0 0 32px rgba(255, 69, 0, 0.3)',
        'glow-orange-strong': '0 8px 24px rgba(255, 69, 0, 0.4)',
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.3)',
        'glow-cyan-strong': '0 8px 32px rgba(0, 240, 255, 0.2)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover':
          '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.04)',
        'card-kinetic':
          '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      },
      transitionDuration: {
        kinetic: '200ms',
        'kinetic-slow': '300ms',
      },
      transitionTimingFunction: {
        kinetic: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        kinetic: {
          orange: '#FF4500',
          pink: '#FF006E',
          cyan: '#00F0FF',
          black: '#0a0a0a',
          base: '#1a1a1a',
          surface: '#2a2a2a',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
