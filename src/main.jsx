import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { pronto } from './lib/api'
import './index.css'

// Segurança: o site não pode ser aberto dentro de outro site (evita golpes de "clique escondido").
if (window.top !== window.self) {
  document.body.innerHTML = '<p style="font-family:sans-serif;padding:24px">Abra o Voluen Alerta diretamente no navegador.</p>'
  throw new Error('Aberto dentro de outro site')
}

pronto.then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
})
