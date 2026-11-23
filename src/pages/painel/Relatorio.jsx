import { useMemo, useState } from 'react'
import { CATEGORIAS } from '../../lib/constants'
import { pct, diasEntre, mesAno } from '../../lib/format'
import { usePainel } from './contexto'

function meses() {
  const r = []; const d = new Date(); d.setDate(1)
  for (let i = 0; i < 12; i++) { r.push(new Date(d)); d.setMonth(d.getMonth() - 1) }
  return r
}

function Tabela({ titulo, linhas, rotulo = (k) => k }) {
  return (
    <section className="card overflow-x-auto p-5">
      <h2 className="mb-3 font-semibold">{titulo}</h2>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="py-2">Nome</th><th className="py-2 text-right">Total</th><th className="py-2 text-right">Resolvidas</th><th className="py-2 text-right">Em aberto</th></tr></thead>
        <tbody>{linhas.map(([k, v]) => (
          <tr key={k} className="border-t border-slate-100"><td className="py-2">{rotulo(k)}</td><td className="num py-2 text-right font-semibold">{v.t}</td><td className="num py-2 text-right">{v.r}</td><td className="num py-2 text-right">{v.t - v.r}</td></tr>
        ))}</tbody>
      </table>
      {!linhas.length && <p className="text-sm text-slate-500">Sem ocorrências no mês.</p>}
    </section>
  )
}

const agrupar = (l, k) => {
  const m = {}
  l.forEach((o) => { m[o[k]] = m[o[k]] || { t: 0, r: 0 }; m[o[k]].t++; if (o.status === 'resolvida') m[o[k]].r++ })
  return Object.entries(m).sort((a, b) => b[1].t - a[1].t)
}

export default function Relatorio() {
  const { lista } = usePainel()
  const opcoes = useMemo(meses, [])
  const [idx, setIdx] = useState(0)
  const ref = opcoes[idx]
  const doMes = lista.filter((o) => { const d = new Date(o.created_at); return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear() })
  const validas = doMes.filter((o) => !['recusada', 'moderacao'].includes(o.status))
  const recusadas = doMes.filter((o) => o.status === 'recusada').length
  const res = validas.filter((o) => o.status === 'resolvida')
  const tempos = res.filter((o) => o.resolvida_em).map((o) => diasEntre(o.created_at, o.resolvida_em))
  const medio = tempos.length ? (tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(1).replace('.', ',') : null
  const porBairro = agrupar(validas, 'bairro')
  const semanas = [0, 0, 0, 0, 0]
  validas.forEach((o) => { semanas[Math.min(4, Math.floor((new Date(o.created_at).getDate() - 1) / 7))]++ })
  const rotSem = ['1 a 7', '8 a 14', '15 a 21', '22 a 28', '29 em diante']
  const maxS = Math.max(1, ...semanas)
  const velhas = lista.filter((o) => ['recebida', 'em_analise', 'encaminhada'].includes(o.status) && diasEntre(o.created_at, new Date()) > 7)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const nomeMes = mesAno(ref)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[.14em] text-brand">Relatório mensal · Voluen Alerta · Prefeitura de Imperatriz</div>
          <h1 className="mt-1 text-2xl font-semibold capitalize">{nomeMes}</h1>
        </div>
        <div className="no-print flex gap-2">
          <select className="input w-auto capitalize" value={idx} onChange={(e) => setIdx(Number(e.target.value))} aria-label="Mês">{opcoes.map((m, i) => <option key={i} value={i}>{mesAno(m)}</option>)}</select>
          <button onClick={() => window.print()} className="btn-dark">Imprimir ou salvar PDF</button>
        </div>
      </div>

      <p className="card p-5 text-[15px] leading-relaxed">
        Em <b>{nomeMes}</b> foram registradas <b>{validas.length} ocorrências válidas</b>.
        {validas.length > 0 && <> Delas, <b>{res.length}</b> foram resolvidas ({pct(res.length, validas.length)}%){medio && <>, com tempo médio de <b>{medio} dias</b> entre o aviso e a solução</>}.</>}
        {porBairro[0] && <> O bairro com mais avisos foi <b>{porBairro[0][0]}</b>, com {porBairro[0][1].t}.</>}
        {recusadas > 0 && <> {recusadas} aviso(s) foram recusados na moderação.</>}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Válidas', validas.length], ['Resolvidas', `${res.length} (${pct(res.length, validas.length)}%)`], ['Em aberto', validas.length - res.length], ['Tempo médio', medio ? `${medio} dias` : '–']].map(([t, v]) => (
          <div key={t} className="card p-4"><div className="text-xs font-semibold text-slate-500">{t}</div><div className="num mt-1 font-display text-2xl font-semibold">{v}</div></div>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Ocorrências por semana do mês</h2>
        <svg viewBox="0 0 520 190" className="w-full" role="img" aria-label="Gráfico de ocorrências por semana">
          {[0, 0.5, 1].map((f) => <g key={f}><line x1="36" x2="520" y1={10 + 140 - f * 140} y2={10 + 140 - f * 140} stroke="#E2E8F0" /><text x="28" y={14 + 140 - f * 140} textAnchor="end" fontSize="11" fill="#64748B">{Math.round(f * maxS)}</text></g>)}
          {semanas.map((v, i) => { const h = (v / maxS) * 140; const x = 56 + i * 94; return (
            <g key={i}><rect x={x} y={150 - h} width="58" height={h} rx="5" fill="#0F5E6B" />{v > 0 && <text x={x + 29} y={144 - h} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0B2E3A">{v}</text>}<text x={x + 29} y="172" textAnchor="middle" fontSize="11" fill="#64748B">{rotSem[i]}</text></g>) })}
        </svg>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <Tabela titulo="Por bairro" linhas={porBairro} />
        <Tabela titulo="Por tipo" linhas={agrupar(validas, 'categoria')} rotulo={(k) => CATEGORIAS[k]?.nome} />
      </div>

      <section className="card p-5">
        <h2 className="font-semibold">Abertas há mais de 7 dias (hoje)</h2>
        <p className="mb-3 text-xs text-slate-500">Considera todas as ocorrências ainda não resolvidas, de qualquer mês.</p>
        {velhas.length ? (
          <table className="w-full text-sm"><tbody>{velhas.map((o) => (
            <tr key={o.id} className="border-t border-slate-100"><td className="py-2 font-mono text-xs">{o.protocolo}</td><td className="py-2">{o.bairro}</td><td className="py-2">{CATEGORIAS[o.categoria].nome}</td><td className="num py-2 text-right">{Math.floor(diasEntre(o.created_at, new Date()))} dias</td></tr>
          ))}</tbody></table>
        ) : <p className="text-sm text-slate-500">Nenhuma. Bom trabalho.</p>}
      </section>
    </div>
  )
}
