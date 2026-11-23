import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { CATEGORIAS } from '../lib/constants'
import Linha from '../components/Linha'
import { Carregando, Icone, StatusPill } from '../components/ui'
import { dataHora } from '../lib/format'

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
        <form onSubmit={buscar} className="mt-6 flex gap-2">
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
              </div>
            </div>
          )}
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
