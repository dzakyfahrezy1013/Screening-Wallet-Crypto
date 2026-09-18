/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07080a',
          900: '#0c0e12',
          850: '#11141a',
          800: '#171b24',
          700: '#232936',
          600: '#343c4e'
        },
        pump: {
          green: '#10b981',
          greenGlow: '#059669',
          red: '#f43f5e',
          cyan: '#06b6d4',
          purple: '#a855f7',
          amber: '#f59e0b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
