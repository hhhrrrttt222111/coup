/** @type {import('tailwindcss').Config} */
export default {
  important: '#root',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coup: {
          charcoal: '#0f1923',
          dark: '#151d2b',
          navy: '#1a2332',
          surface: '#1e2a3a',
          crimson: '#8b1a2b',
          'crimson-light': '#b22234',
          'crimson-dark': '#5c1018',
          gold: '#c9a84c',
          'gold-light': '#dfc06e',
          'gold-dark': '#a08030',
          teal: '#4a9ea1',
          'teal-light': '#6cc4c7',
          'teal-dark': '#2e7a7d',
          silver: '#8a95a5',
          'silver-light': '#b0bac8',
          'text-primary': '#e8e0d4',
          'text-secondary': '#8a95a5',
          'text-muted': '#5a6577',
        },
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', '"Cinzel"', 'serif'],
        heading: ['"Cinzel"', 'serif'],
        body: ['"Raleway"', 'sans-serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(139,26,43,0.6)' },
          '70%': { boxShadow: '0 0 0 10px rgba(139,26,43,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(139,26,43,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s ease-in-out infinite',
        shimmer: 'shimmer 3s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
