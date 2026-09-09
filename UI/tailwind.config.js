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
        industrial: {
          50: '#f4f6f8',
          100: '#e5e9ee',
          200: '#cdd5df',
          300: '#a3b3c6',
          400: '#738ba8',
          500: '#516c8c',
          600: '#3e5472',
          700: '#32445e',
          800: '#2c394d',
          900: '#1e2634',
          950: '#131822',
        },
        factory: {
          blue: '#1d4ed8',
          amber: '#d97706',
          emerald: '#059669',
          rose: '#e11d48',
          cyan: '#0891b2',
          slate: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
