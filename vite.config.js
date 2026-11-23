import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' faz o site funcionar em qualquer endereço (GitHub Pages incluído)
export default defineConfig({
  plugins: [react()],
  base: './',
})
