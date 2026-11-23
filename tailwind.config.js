/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0F5E6B', 50: '#E8F3F4', 100: '#CFE6E9', 600: '#0F5E6B', 700: '#0C4D58', 800: '#0B3D47' },
        deep: { DEFAULT: '#0B2E3A', 900: '#071E26', 800: '#0B2E3A', 700: '#123C4A' },
        accent: { DEFAULT: '#3CC6B0', 50: '#E7F8F5', 600: '#2BAE99' },
        mist: '#F2F5F6',
      },
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: { soft: '0 1px 2px rgba(11,46,58,.04), 0 8px 24px rgba(11,46,58,.06)' },
    },
  },
  plugins: [],
}
