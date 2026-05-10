import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#050507',
          subtle: '#0a0a0f',
          muted: '#0f0f14',
          elevated: '#141419',
        },
        foreground: {
          DEFAULT: '#fafafa',
          muted: '#a1a1aa',
          subtle: '#71717a',
        },
        primary: {
          DEFAULT: '#6366f1',
          foreground: '#ffffff',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        secondary: {
          DEFAULT: '#18181b',
          foreground: '#fafafa',
          muted: '#27272a',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          foreground: '#ffffff',
          muted: '#7c3aed',
        },
        success: {
          DEFAULT: '#10b981',
          foreground: '#ffffff',
          muted: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
          muted: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
          muted: '#dc2626',
        },
        border: {
          DEFAULT: '#27272a',
          subtle: '#1f1f23',
          muted: '#18181b',
        },
        ring: '#6366f1',
        input: '#27272a',
        // Semantic color mappings
        'bg-canvas': '#050507',
        'bg-surface': '#0a0a0f',
        'bg-elevated': '#141419',
        'bg-card': '#0f0f14',
        'text-primary': '#fafafa',
        'text-secondary': '#a1a1aa',
        'text-tertiary': '#71717a',
        'text-muted': '#52525b',
        'border-default': '#27272a',
        'border-subtle': '#1f1f23',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow': '0 0 30px rgba(99, 102, 241, 0.25)',
        'glow-lg': '0 0 50px rgba(99, 102, 241, 0.35)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.25)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.25)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.25)',
        'inner-glow': 'inset 0 0 20px rgba(99, 102, 241, 0.1)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'orb-1': 'orb1 20s ease-in-out infinite',
        'orb-2': 'orb2 15s ease-in-out infinite',
        'orb-3': 'orb3 25s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        orb1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(50px, -30px) scale(1.05)' },
          '50%': { transform: 'translate(0, -50px) scale(1)' },
          '75%': { transform: 'translate(-30px, -20px) scale(0.95)' },
        },
        orb2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-40px, 40px) scale(1.1)' },
          '66%': { transform: 'translate(20px, 60px) scale(0.95)' },
        },
        orb3: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(30px, -30px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '60px 60px',
        'shimmer': '200% 100%',
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
    },
  },
  plugins: [],
};

export default config;