import { useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
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
  const [novas, setNovas] = useState(0)
  const [som, setSom] = useState(() => { try { return localStorage.getItem('voluen-painel-som') !== 'nao' } catch { return true } })
  const vistas = useRef(null)
  const ir = useNavigate()

  // Tempo real: atualiza a lista sozinho quando chega ocorrência nova ou muda uma situação.
  // Plano B: confere de novo a cada 20 segundos e quando a aba volta a ficar visível.
  useEffect(() => {
    if (!perfil?.papel) return
    const atualizar = () => dados.atualizar()
    const sair = api.aoMudarOcorrencias(atualizar)
    const t = setInterval(atualizar, 20000)
    const aoVoltar = () => { if (document.visibilityState === 'visible') atualizar() }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => { sair(); clearInterval(t); document.removeEventListener('visibilitychange', aoVoltar) }
  }, [perfil?.id, perfil?.papel]) // eslint-disable-line react-hooks/exhaustive-deps

  // Detecta ocorrências novas (que não estavam na lista antes) e avisa na tela, com som opcional.
  useEffect(() => {
    if (!dados.dados) return
    const ids = new Set(dados.dados.map((o) => o.id))
    if (vistas.current) {
      const chegaram = dados.dados.filter((o) => !vistas.current.has(o.id)).length
      if (chegaram > 0) { setNovas((n) => n + chegaram); if (som) tocarAviso() }
    }
    vistas.current = ids
  }, [dados.dados]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const base = 'Painel · Imperatriz em Alerta'
    document.title = novas > 0 ? `(${novas}) ${base}` : base
    return () => { document.title = 'Imperatriz em Alerta' }
  }, [novas])

  function mudarSom() {
    const v = !som; setSom(v)
    try { localStorage.setItem('voluen-painel-som', v ? 'sim' : 'nao') } catch { /* nada */ }
    if (v) tocarAviso()
  }

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

  if (perfil.trocar_senha) return <TrocarSenha perfil={perfil} />

  const lista = dados.dados || []
  const pend = lista.filter((o) => o.status === 'moderacao').length
  const links = [
    { to: '/painel', nome: 'Visão geral', fim: true },
    { to: '/painel/moderacao', nome: 'Moderação', badge: pend },
    { to: '/painel/ocorrencias', nome: 'Ocorrências' },
    { to: '/painel/relatorio', nome: 'Relatórios' },
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
            <div className="mt-3 flex items-center gap-4">
              <button onClick={() => api.sair()} className="text-sm font-semibold text-brand">Sair</button>
              <button onClick={mudarSom} className="text-xs font-semibold text-slate-500 hover:text-deep" aria-pressed={som}>{som ? '🔔 Som ligado' : '🔕 Som desligado'}</button>
            </div>
            {MODO_DEMO && <button onClick={() => { api.reiniciarDemo(); dados.recarregar() }} className="mt-2 block text-xs text-slate-400 hover:text-slate-600">Restaurar dados de exemplo</button>}
          </div>
        </aside>
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {MODO_DEMO && <div className="no-print mb-5 rounded-xl bg-amber-100 px-4 py-2 text-xs font-medium text-amber-900">Modo demonstração: dados de exemplo, guardados só neste navegador.</div>}
          {dados.erro ? <Erro texto={dados.erro} tentar={dados.recarregar} /> : dados.carregando && !dados.dados ? <Carregando /> : <Outlet />}
        </main>
      </div>
      {aberto && <Detalhe id={aberto} fechar={() => setAberto(null)} />}
      {novas > 0 && (
        <div className="no-print fixed bottom-5 right-5 z-[1200] flex max-w-sm items-center gap-3 rounded-2xl bg-deep px-4 py-3 text-white shadow-2xl" role="status" aria-live="polite">
          <span className="relative flex h-3 w-3 shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-accent" /></span>
          <span className="flex-1 text-sm">{novas === 1 ? 'Chegou 1 ocorrência nova.' : `Chegaram ${novas} ocorrências novas.`}</span>
          <button onClick={() => { setNovas(0); ir('/painel/moderacao') }} className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-deep">Ver</button>
          <button onClick={() => setNovas(0)} className="text-lg leading-none text-slate-300 hover:text-white" aria-label="Fechar aviso">×</button>
        </div>
      )}
    </PainelCtx.Provider>
  )
}

// Primeiro acesso com senha provisória: a pessoa cria a própria senha antes de usar o painel.
function TrocarSenha({ perfil }) {
  const [nova, setNova] = useState('')
  const [repete, setRepete] = useState('')
  const [erro, setErro] = useState('')
  const [indo, setIndo] = useState(false)
  async function salvar(e) {
    e.preventDefault(); setErro('')
    if (nova.length < 8) { setErro('A senha precisa ter pelo menos 8 caracteres.'); return }
    if (nova !== repete) { setErro('As duas senhas não são iguais.'); return }
    setIndo(true)
    try { await api.trocarSenha(nova) } catch (x) { setErro(/same|different/i.test(x.message) ? 'A senha nova precisa ser diferente da provisória.' : x.message) } finally { setIndo(false) }
  }
  return (
    <div className="grid min-h-screen place-items-center bg-mist p-6">
      <form onSubmit={salvar} className="card w-full max-w-md space-y-4 p-8">
        <div>
          <h1 className="text-xl font-semibold">Crie a sua senha</h1>
          <p className="mt-1 text-sm text-slate-600">Olá, {perfil.nome}. Você entrou com uma senha provisória. Crie agora uma senha só sua, com pelo menos 8 caracteres.</p>
        </div>
        <div><label className="label" htmlFor="nova">Senha nova</label><input id="nova" type="password" className="input" value={nova} onChange={(e) => setNova(e.target.value)} required autoComplete="new-password" /></div>
        <div><label className="label" htmlFor="rep">Repita a senha nova</label><input id="rep" type="password" className="input" value={repete} onChange={(e) => setRepete(e.target.value)} required autoComplete="new-password" /></div>
        {erro && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{erro}</p>}
        <button className="btn-brand w-full py-3" disabled={indo}>{indo ? 'Salvando…' : 'Salvar e entrar'}</button>
        <button type="button" onClick={() => api.sair()} className="btn-ghost w-full">Sair</button>
      </form>
    </div>
  )
}

// Aviso sonoro curto (dois bipes suaves), gerado no próprio navegador.
function tocarAviso() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    ;[0, 0.18].forEach((t, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = i ? 1046 : 784
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.16)
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.18)
    })
    setTimeout(() => ctx.close(), 600)
  } catch { /* sem som */ }
}
