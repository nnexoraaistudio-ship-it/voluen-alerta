import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Regras de segurança da página (Content Security Policy): o navegador só carrega
// scripts do próprio site e só conversa com os serviços listados aqui.
const SUPA = 'https://jpkmbxubifxzcekzsspt.supabase.co'
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://tile.openstreetmap.org ${SUPA}`,
  `connect-src 'self' ${SUPA} wss://jpkmbxubifxzcekzsspt.supabase.co https://overpass-api.de https://overpass.kumi.systems https://overpass.private.coffee https://nominatim.openstreetmap.org`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ')

const seguranca = {
  name: 'cabecalhos-de-seguranca',
  apply: 'build',
  transformIndexHtml: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${CSP}" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />`),
}

// base './' faz o site funcionar em qualquer endereço (GitHub Pages incluído)
export default defineConfig({
  plugins: [react(), seguranca],
  base: './',
})
