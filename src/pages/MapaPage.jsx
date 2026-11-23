import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useCarregar } from '../lib/hooks'
import { CATEGORIAS, STATUS, PUBLICOS } from '../lib/constants'
import Mapa from '../components/Mapa'
import { CatDot, Carregando, Erro, StatusPill } from '../components/ui'
import { data } from '../lib/format'

export default function MapaPage() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => api.listarPublicas(), [])
  const [cats, setCats] = useState(() => new Set(Object.keys(CATEGORIAS)))
  const [st, setSt] = useState('abertas')
  const [foco, setFoco] = useState(null)
  const lista = useMemo(() => (dados || []).filter((o) => cats.has(o.categoria) && (st === 'todas' || (st === 'abertas' ? o.status !== 'resolvida' : o.status === st))), [dados, cats, st])
  const alternar = (k) => { const n = new Set(cats); n.has(k) ? n.delete(k) : n.add(k); setCats(n) }

  return (
    <div className="bg-mist">
      <div className="wrap py-10">
        <div className="eyebrow">Mapa de ocorrências</div>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Onde estão os problemas de Imperatriz</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Cada ponto é um aviso de morador já conferido pela equipe. Toque em um ponto para ver o tipo, a foto e a situação.</p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="card overflow-hidden">
            {carregando ? <div className="px-5"><Carregando /></div> : erro ? <div className="p-5"><Erro texto={erro} tentar={recarregar} /></div> : <Mapa pontos={lista} foco={foco} className="h-[60vh] min-h-[420px]" />}
          </div>
          <aside className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Filtros</h2><span className="num text-sm text-slate-500">{lista.length} no mapa</span></div>
              <label className="label mt-4" htmlFor="fst">Situação</label>
              <select id="fst" className="input" value={st} onChange={(e) => setSt(e.target.value)}>
                <option value="abertas">Ainda não resolvidas</option>
                <option value="todas">Todas</option>
                {PUBLICOS.map((k) => <option key={k} value={k}>{STATUS[k].nome}</option>)}
              </select>
              <div className="label mt-4">Tipo de problema</div>
              <div className="space-y-1.5">
                {Object.entries(CATEGORIAS).map(([k, c]) => (
                  <label key={k} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm hover:bg-slate-50">
                    <input type="checkbox" checked={cats.has(k)} onChange={() => alternar(k)} className="h-4 w-4 accent-[#0B4DA2]" />
                    <CatDot categoria={k} /> {c.nome}
                  </label>
                ))}
              </div>
            </div>
            <div className="card max-h-[340px] overflow-y-auto p-2">
              {lista.slice(0, 40).map((o) => (
                <button key={o.id} onClick={() => setFoco([o.lat, o.lng])} className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-slate-50">
                  <span className="mt-1.5"><CatDot categoria={o.categoria} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{CATEGORIAS[o.categoria].nome}</span>
                    <span className="block truncate text-xs text-slate-500">{o.bairro} · {data(o.created_at)}</span>
                  </span>
                  <StatusPill status={o.status} curto />
                </button>
              ))}
              {!carregando && lista.length === 0 && <p className="p-4 text-sm text-slate-500">Nenhuma ocorrência com esses filtros.</p>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
