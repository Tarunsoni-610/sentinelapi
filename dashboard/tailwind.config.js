/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#0a0b0e',
          subtle: '#0f1015',
          card: '#13141a',
          cardHover: '#181a22',
        },
        border: {
          DEFAULT: '#1f212a',
          light: '#2a2d38',
        },
        accent: {
          green: '#43f283',
          greenHover: '#32e073',
          greenBg: 'rgba(67, 242, 131, 0.1)',
          greenBorder: 'rgba(67, 242, 131, 0.25)',
          purple: '#818cf8',
          purpleBg: 'rgba(129, 140, 248, 0.1)',
          amber: '#fbbf24',
          amberBg: 'rgba(251, 191, 36, 0.1)',
          rose: '#f43f5e',
          roseBg: 'rgba(244, 63, 94, 0.1)',
        },
        ink: {
          DEFAULT: '#f4f4f6',
          heading: '#ffffff',
          muted: '#8e909d',
          subtle: '#5c5e6b',
        },
      },
      fontFamily: {
        display: ['"Syne"', '"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 25px rgba(67, 242, 131, 0.25)',
        'glow-purple': '0 0 25px rgba(129, 140, 248, 0.2)',
        'card': '0 10px 30px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
