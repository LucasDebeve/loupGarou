/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#030712',
          900: '#0a0f1e',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        parchment: {
          50: '#faf6f0',
          100: '#f5ead8',
          200: '#ecd5b0',
          300: '#e0ba80',
        },
        blood: {
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
        },
        forest: {
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontFamily: {
        medieval: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 2s ease-in-out infinite',
        'moon-glow': 'moonGlow 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        moonGlow: {
          '0%, 100%': { boxShadow: '0 0 20px 5px rgba(251, 191, 36, 0.3)' },
          '50%': { boxShadow: '0 0 40px 15px rgba(251, 191, 36, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
