/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0B4DA2', 50: '#EAF1FB', 100: '#D3E2F6', 600: '#0B4DA2', 700: '#093F86', 800: '#07326A' },
        deep: { DEFAULT: '#072B5A', 900: '#051E40', 800: '#072B5A', 700: '#0C3A73' },
        accent: { DEFAULT: '#2BB3E6', 50: '#E6F6FC', 600: '#1A9CCF' },
        mist: '#F3F6FA',
      },
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: { destaque: 'linear-gradient(135deg, #0B4DA2 0%, #1A7FCB 60%, #2BB3E6 100%)' },
      boxShadow: { soft: '0 1px 2px rgba(7,43,90,.04), 0 8px 24px rgba(7,43,90,.06)' },
    },
  },
  plugins: [],
}
