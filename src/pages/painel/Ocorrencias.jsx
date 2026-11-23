import { useMemo, useState } from 'react'
import { CATEGORIAS, STATUS } from '../../lib/constants'
import { data } from '../../lib/format'
import { StatusPill, CatDot } from '../../components/ui'
import { usePainel } from './contexto'

export default function Ocorrencias() {
  const { lista, abrir } = usePainel()
  const [st, setSt] = useState('')
  const [cat, setCat] = useState('')
  const [bairro, setBairro] = useState('')
  const [q, setQ] = useState('')
  const bairros = useMemo(() => [...new Set(lista.map((o) => o.bairro))].sort(), [lista])
  const filtrada = lista.filter((o) => (!st || o.status === st) && (!cat || o.categoria === cat) && (!bairro || o.bairro === bairro)
    && (!q || `${o.protocolo} ${o.rua} ${o.descricao} ${o.referencia || ''}`.toLowerCase().includes(q.toLowerCase())))
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Ocorrências</h1>
        <p className="text-sm text-slate-500">Clique em uma linha para ver os detalhes e atualizar.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Buscar protocolo, rua ou texto" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
        <select className="input w-auto" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Situação"><option value="">Todas as situações</option>{Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.nome}</option>)}</select>
        <select className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Tipo"><option value="">Todos os tipos</option>{Object.entries(CATEGORIAS).map(([k, c]) => <option key={k} value={k}>{c.nome}</option>)}</select>
        <select className="input w-auto" value={bairro} onChange={(e) => setBairro(e.target.value)} aria-label="Bairro"><option value="">Todos os bairros</option>{bairros.map((b) => <option key={b}>{b}</option>)}</select>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Protocolo</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Bairro / rua</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Situação</th>
          </tr></thead>
          <tbody>
            {filtrada.map((o) => (
              <tr key={o.id} onClick={() => abrir(o.id)} className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{o.protocolo}</td>
                <td className="px-4 py-3"><span className="flex items-center gap-2"><CatDot categoria={o.categoria} />{CATEGORIAS[o.categoria].nome}</span></td>
                <td className="px-4 py-3"><div>{o.bairro}</div><div className="text-xs text-slate-500">{o.rua}</div></td>
                <td className="num px-4 py-3">{data(o.created_at)}</td>
                <td className="px-4 py-3"><StatusPill status={o.status} curto /></td>
              </tr>
            ))}
            {filtrada.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Nenhuma ocorrência com esses filtros.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">{filtrada.length} de {lista.length} ocorrências</p>
    </div>
  )
}
