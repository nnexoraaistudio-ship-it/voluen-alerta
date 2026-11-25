import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { CATEGORIAS } from '../lib/constants'
import Linha from '../components/Linha'
import { Carregando, Icone, StatusPill } from '../components/ui'
import { dataHora, data } from '../lib/format'
import { compartilhar, enderecoSite } from '../lib/compartilhar'
import { lerProtocolos, esquecerProtocolo } from '../lib/meusProtocolos'
import { useSessao } from '../lib/hooks'
import { MinhasOcorrencias } from './Conta'
import { useProvedores } from '../components/EntrarSocial'

function DaConta() {
  const { perfil } = useSessao()
  const prov = useProvedores()
  if (perfil) return (
    <div className="card mb-6 p-5">
      <h2 className="text-lg font-semibold">Minhas ocorrências</h2>
      <p className="mt-1 text-sm text-slate-500">Registradas com a sua conta ({perfil.email}).</p>
      <div className="mt-3"><MinhasOcorrencias perfil={perfil} /></div>
    </div>
  )
  if (!prov.google && !prov.apple) return null
  return (
    <div className="card mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <p className="flex-1 text-sm text-slate-600">Entre com Google ou Apple para ver todas as suas ocorrências em qualquer aparelho, sem digitar protocolo.</p>
      <Link to="/conta" className="btn-ghost shrink-0"><Icone.pessoa /> Entrar</Link>
    </div>
  )
}

function MeusProtocolos() {
  const [lista, setLista] = useState(lerProtocolos)
  if (!lista.length) return null
  const esquecer = (p) => { esquecerProtocolo(p); setLista(lerProtocolos()) }
  return (
    <div className="card mb-6 p-5">
      <h2 className="text-lg font-semibold">Meus protocolos</h2>
      <p className="mt-1 text-sm text-slate-500">Registrados neste aparelho. Toque para ver o andamento.</p>
      <ul className="mt-4 divide-y divide-slate-100">
        {lista.map((p) => (
          <li key={p.protocolo} className="flex items-center gap-3 py-3">
            <Link to={`/acompanhar/${p.protocolo}`} className="min-w-0 flex-1 rounded-lg hover:text-brand">
              <span className="block font-mono text-sm font-medium text-deep">{p.protocolo}</span>
              <span className="block truncate text-xs text-slate-500">{[CATEGORIAS[p.categoria]?.nome, p.bairro, p.criado_em && data(p.criado_em)].filter(Boolean).join(' · ')}</span>
            </Link>
            <button onClick={() => esquecer(p.protocolo)} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:text-rose-700" aria-label={`Tirar o protocolo ${p.protocolo} desta lista`}>Tirar da lista</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Acompanhar() {
  const { protocolo } = useParams()
  const nav = useNavigate()
  const [texto, setTexto] = useState(protocolo || '')
  const [estado, setEstado] = useState({ carregando: false, r: undefined, erro: '' })

  useEffect(() => {
    if (!protocolo) { setEstado({ carregando: false, r: undefined, erro: '' }); return }
    setTexto(protocolo)
    setEstado({ carregando: true, r: undefined, erro: '' })
    api.consultarProtocolo(protocolo).then((r) => setEstado({ carregando: false, r, erro: '' }), (e) => setEstado({ carregando: false, r: undefined, erro: e.message }))
  }, [protocolo])

  const buscar = (e) => { e.preventDefault(); if (texto.trim()) nav(`/acompanhar/${texto.trim().toUpperCase()}`) }
  const { carregando, r, erro } = estado

  return (
    <div className="bg-mist">
      <div className="wrap max-w-3xl py-10 sm:py-14">
        <div className="eyebrow">Acompanhar ocorrência</div>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Consulte o seu protocolo</h1>
        <p className="mt-2 text-slate-600">Digite o número recebido no fim do registro para ver a situação e cada etapa do atendimento.</p>
        <form onSubmit={buscar} className="mt-6 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="prot" className="sr-only">Número do protocolo</label>
          <input id="prot" className="input font-mono uppercase" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: VA-2026-01180-4F2A" />
          <button className="btn-brand shrink-0 px-6"><Icone.busca /> Consultar</button>
        </form>

        <div className="mt-8">
          {carregando && <Carregando texto="Buscando protocolo…" />}
          {erro && <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">Não foi possível consultar agora. {erro}</div>}
          {r === null && <div className="card p-6 text-slate-600"><b className="text-deep">Protocolo não encontrado.</b> Confira se digitou igual ao que recebeu, com o formato VA-ANO-NÚMERO.</div>}
          {r && (
            <div className="card overflow-hidden">
              {r.foto_url && <img src={r.foto_url} alt="Foto enviada" className="h-56 w-full object-cover" />}
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm text-slate-500">{r.protocolo}</div>
                    <h2 className="mt-1 text-2xl font-semibold">{CATEGORIAS[r.categoria]?.nome}</h2>
                    <div className="mt-1 text-sm text-slate-500">{r.bairro} · {r.rua}{r.referencia ? ` · ${r.referencia}` : ''}</div>
                    <div className="text-xs text-slate-400">Registrada em {dataHora(r.created_at)}</div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <p className="mt-4 rounded-xl bg-mist p-4 text-[15px] text-slate-700">{r.descricao}</p>
                <h3 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wider text-slate-500">Andamento</h3>
                <Linha status={r.status} historico={r.historico} motivo={r.motivo_recusa} />
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <button type="button" onClick={() => compartilhar({ titulo: 'Imperatriz em Alerta', texto: `Acompanhe a ocorrência ${r.protocolo} no Imperatriz em Alerta:`, url: `${enderecoSite()}#/acompanhar/${r.protocolo}` })} className="btn-ghost text-sm"><Icone.compartilhar /> Compartilhar no WhatsApp</button>
                </div>
              </div>
            </div>
          )}
          {r === undefined && !carregando && !erro && <DaConta />}
          {r === undefined && !carregando && !erro && <MeusProtocolos />}
          {r === undefined && !carregando && !erro && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold">O que acontece depois do registro?</h2>
              <p className="mt-2 text-[15px] text-slate-600">A equipe confere a ocorrência antes de publicar no mapa. Depois ela passa por análise, é encaminhada ao setor responsável e, por fim, marcada como resolvida. Tudo fica registrado na linha do tempo.</p>
              <p className="mt-4 text-sm text-slate-500">Ainda não registrou? <Link to="/registrar" className="font-semibold text-brand">Registrar um problema</Link></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
