/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#202735',
          heading: '#252c3a',
          muted: '#8991a0',
          subtle: '#a5aab4',
        },
        line: {
          DEFAULT: '#e9ebef',
          light: '#f0f1f4',
        },
        canvas: '#f7f8fa',
        violet: {
          DEFAULT: '#6659e8',
          50: '#f6f5ff',
          100: '#f0efff',
          200: '#e0deff',
          500: '#6659e8',
          600: '#5549d4',
          700: '#4338ca',
          hover: '#5549d4',
          soft: '#f0efff',
          tint: '#f6f5ff',
          dark: '#39365d',
        },
        emerald: {
          DEFAULT: '#22996b',
          soft: '#f1f8f5',
          border: '#e4f1eb',
        },
        coral: {
          DEFAULT: '#cf6666',
          soft: '#fff0ef',
          border: '#ffdcd8',
        },
        amber: {
          DEFAULT: '#c18934',
          soft: '#fff8eb',
          border: '#fbebd2',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Manrope"', '"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
