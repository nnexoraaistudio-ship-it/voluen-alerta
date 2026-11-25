import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useCarregar, useSessao } from '../../lib/hooks'
import { PAPEIS, pode } from '../../lib/constants'
import { Logo, Carregando, Erro } from '../../components/ui'
import { PainelCtx } from './contexto'
import Detalhe from './Detalhe'
import { MODO_DEMO } from '../../config'

export default function PainelLayout() {
  const { perfil, carregado } = useSessao()
  const dados = useCarregar(() => (perfil?.papel ? api.listarTodas() : Promise.resolve([])), [perfil?.id, perfil?.papel])
  const [aberto, setAberto] = useState(null)

  // Segurança: sai sozinho do painel depois de 30 minutos sem uso (computador esquecido aberto).
  useEffect(() => {
    if (!perfil) return
    let t
    const reiniciar = () => { clearTimeout(t); t = setTimeout(() => api.sair(), 30 * 60 * 1000) }
    const eventos = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    eventos.forEach((e) => window.addEventListener(e, reiniciar, { passive: true }))
    reiniciar()
    return () => { clearTimeout(t); eventos.forEach((e) => window.removeEventListener(e, reiniciar)) }
  }, [perfil?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!carregado) return <div className="wrap"><Carregando /></div>
  if (!perfil) return <Navigate to="/equipe" replace />
  if (!perfil.papel) return (
    <div className="grid min-h-screen place-items-center bg-mist p-6 text-center">
      <div className="card max-w-md p-8">
        <h1 className="text-xl font-semibold">Esta área é só para a equipe</h1>
        <p className="mt-2 text-sm text-slate-600">Você entrou como {perfil.email}, mas esta conta não tem acesso ao painel. Se você é da equipe, peça a um administrador para liberar o seu e-mail na tela Equipe.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-brand">Ir para o site</Link>
          <button onClick={() => api.sair()} className="btn-ghost">Sair</button>
        </div>
      </div>
    </div>
  )

  const lista = dados.dados || []
  const pend = lista.filter((o) => o.status === 'moderacao').length
  const links = [
    { to: '/painel', nome: 'Visão geral', fim: true },
    { to: '/painel/moderacao', nome: 'Moderação', badge: pend },
    { to: '/painel/ocorrencias', nome: 'Ocorrências' },
    { to: '/painel/relatorio', nome: 'Relatório mensal' },
    ...(pode.equipe(perfil.papel) ? [{ to: '/painel/equipe', nome: 'Equipe' }] : []),
  ]

  return (
    <PainelCtx.Provider value={{ perfil, lista, ...dados, abrir: setAberto }}>
      <div className="min-h-screen bg-mist lg:grid lg:grid-cols-[240px_1fr]">
        <aside className="no-print border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 px-4 py-4 lg:block lg:px-5 lg:py-6">
            <Link to="/"><Logo sub="Painel da equipe" /></Link>
            <button onClick={() => api.sair()} className="text-sm font-semibold text-slate-500 lg:hidden">Sair</button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.fim} className={({ isActive }) => `flex items-center justify-between gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-brand-50 text-brand' : 'text-slate-600 hover:bg-slate-50'}`}>
                {l.nome}{l.badge > 0 && <span className="rounded-full bg-amber-100 px-2 text-xs font-bold text-amber-800">{l.badge}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="hidden border-t border-slate-100 p-5 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
            <div className="text-sm font-semibold">{perfil.nome}</div>
            <div className="text-xs text-slate-500">{PAPEIS[perfil.papel].nome}</div>
            <button onClick={() => api.sair()} className="mt-3 text-sm font-semibold text-brand">Sair</button>
            {MODO_DEMO && <button onClick={() => { api.reiniciarDemo(); dados.recarregar() }} className="mt-2 block text-xs text-slate-400 hover:text-slate-600">Restaurar dados de exemplo</button>}
          </div>
        </aside>
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {MODO_DEMO && <div className="no-print mb-5 rounded-xl bg-amber-100 px-4 py-2 text-xs font-medium text-amber-900">Modo demonstração: dados de exemplo, guardados só neste navegador.</div>}
          {dados.erro ? <Erro texto={dados.erro} tentar={dados.recarregar} /> : dados.carregando && !dados.dados ? <Carregando /> : <Outlet />}
        </main>
      </div>
      {aberto && <Detalhe id={aberto} fechar={() => setAberto(null)} />}
    </PainelCtx.Provider>
  )
}
