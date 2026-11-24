import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Logo, Icone } from './ui'
import { VoluenMarca } from './Marca'
import { MODO_DEMO, CONTATO_EMAIL } from '../config'

const NAV = [
  { to: '/', nome: 'Início', icone: Icone.casa, fim: true },
  { to: '/mapa', nome: 'Mapa', icone: Icone.mapa },
  { to: '/acompanhar', nome: 'Acompanhar', icone: Icone.lista },
]

function Topo() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-slate-200/70 bg-white/85 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="Imperatriz em Alerta, início"><Logo /></Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.fim} className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand' : 'text-slate-600 hover:text-deep'}`}>{n.nome}</NavLink>
          ))}
        </nav>
        <Link to="/registrar" className="btn-dark hidden sm:inline-flex"><Icone.mais /> Registrar problema</Link>
      </div>
    </header>
  )
}

function MenuCelular() {
  const item = 'flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold'
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200 bg-white/95 backdrop-blur md:hidden no-print" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-4">
        {NAV.slice(0, 2).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.fim} className={({ isActive }) => `${item} ${isActive ? 'text-brand' : 'text-slate-500'}`}><n.icone />{n.nome}</NavLink>
        ))}
        <NavLink to="/registrar" className={({ isActive }) => `${item} ${isActive ? 'text-brand' : 'text-slate-500'}`}>
          <span className="-mt-5 grid h-11 w-11 place-items-center rounded-full bg-accent text-deep shadow-lg ring-4 ring-white"><Icone.mais width="20" height="20" /></span>
          Registrar
        </NavLink>
        <NavLink to="/acompanhar" className={({ isActive }) => `${item} ${isActive ? 'text-brand' : 'text-slate-500'}`}><Icone.doc />Protocolo</NavLink>
      </div>
    </nav>
  )
}

function Rodape() {
  return (
    <footer className="bg-deep text-slate-300 no-print">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div className="space-y-4">
          <Logo claro />
          <p className="max-w-sm text-sm leading-relaxed text-slate-400">Canal para moradores avisarem sobre alagamentos, bueiros entupidos e problemas de drenagem em Imperatriz, Maranhão.</p>
          <p className="text-sm text-slate-400">Em emergência, ligue para a <b className="text-white">Defesa Civil (199)</b> ou o <b className="text-white">Corpo de Bombeiros (193)</b>.</p>
        </div>
        <div>
          <div className="mb-4 text-xs font-semibold uppercase tracking-[.14em] text-slate-500">Navegar</div>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="hover:text-white" to="/registrar">Registrar ocorrência</Link></li>
            <li><Link className="hover:text-white" to="/mapa">Mapa de ocorrências</Link></li>
            <li><Link className="hover:text-white" to="/acompanhar">Acompanhar protocolo</Link></li>
            <li><Link className="hover:text-white" to="/privacidade">Política de privacidade</Link></li>
          </ul>
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[.14em] text-slate-500">Sobre</div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-[13px] leading-relaxed text-slate-400">
            Versão de testes. Ainda não é um canal oficial da Prefeitura de Imperatriz.
          </div>
          <p className="text-sm text-slate-400">Contato: <span className="select-all text-slate-200">{CONTATO_EMAIL}</span></p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">Desenvolvido por <VoluenMarca claro className="h-3.5 w-auto opacity-90" /> · Tecnologia para cidades que evoluem. © 2026 Voluen</span>
          <span className="flex gap-4"><Link to="/privacidade" className="hover:text-slate-300">Privacidade</Link><Link to="/equipe" className="hover:text-slate-300">Acesso da equipe</Link></span>
        </div>
      </div>
    </footer>
  )
}

const CHAVE_AVISO = 'voluen-aviso-privacidade'
function AvisoPrivacidade() {
  const [visivel, setVisivel] = useState(false)
  useEffect(() => { try { setVisivel(!localStorage.getItem(CHAVE_AVISO)) } catch { setVisivel(true) } }, [])
  if (!visivel) return null
  const ok = () => { try { localStorage.setItem(CHAVE_AVISO, new Date().toISOString()) } catch { /* nada */ } setVisivel(false) }
  return (
    <div className="fixed inset-x-2 bottom-[72px] z-[1100] mx-auto max-w-2xl md:bottom-5 no-print" role="region" aria-label="Aviso de privacidade">
      <div className="flex items-center gap-3 rounded-xl bg-deep/95 px-3 py-2 text-slate-200 shadow-xl backdrop-blur sm:rounded-2xl sm:px-4 sm:py-3">
        <p className="flex-1 text-xs leading-snug sm:text-sm">
          <span className="sm:hidden">Sem cookies de propaganda ou rastreamento. </span>
          <span className="hidden sm:inline">Este site não usa cookies de propaganda nem de rastreamento. Guardamos no seu navegador só o necessário para ele funcionar. </span>
          <Link to="/privacidade" className="font-semibold text-accent underline">Saiba mais</Link>
        </p>
        <button onClick={ok} className="btn-accent shrink-0 !px-4 !py-1.5 text-xs sm:text-sm">Entendi</button>
      </div>
    </div>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      {MODO_DEMO && <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900 no-print">Modo demonstração: os dados são de exemplo e ficam só neste navegador. Nada é enviado à prefeitura.</div>}
      <Topo />
      <main className="flex-1 pb-20 md:pb-0"><Outlet /></main>
      <Rodape />
      <MenuCelular />
      <AvisoPrivacidade />
    </div>
  )
}
