import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Registrar from './pages/Registrar'
import MapaPage from './pages/MapaPage'
import Acompanhar from './pages/Acompanhar'
import Privacidade from './pages/Privacidade'
import Sobre from './pages/Sobre'
import Login from './pages/Login'
import Conta from './pages/Conta'
import PainelLayout from './pages/painel/PainelLayout'
import Visao from './pages/painel/Visao'
import Moderacao from './pages/painel/Moderacao'
import Ocorrencias from './pages/painel/Ocorrencias'
import Relatorio from './pages/painel/Relatorio'
import Equipe from './pages/painel/Equipe'

// HashRouter (endereços com #) funciona no GitHub Pages sem configuração extra.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="registrar" element={<Registrar />} />
          <Route path="mapa" element={<MapaPage />} />
          <Route path="acompanhar" element={<Acompanhar />} />
          <Route path="acompanhar/:protocolo" element={<Acompanhar />} />
          <Route path="privacidade" element={<Privacidade />} />
          <Route path="sobre" element={<Sobre />} />
          <Route path="conta" element={<Conta />} />
        </Route>
        <Route path="equipe" element={<Login />} />
        <Route path="painel" element={<PainelLayout />}>
          <Route index element={<Visao />} />
          <Route path="moderacao" element={<Moderacao />} />
          <Route path="ocorrencias" element={<Ocorrencias />} />
          <Route path="relatorio" element={<Relatorio />} />
          <Route path="equipe" element={<Equipe />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
