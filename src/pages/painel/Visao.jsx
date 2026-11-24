import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIAS, STATUS } from '../../lib/constants'
import { contar, pct, diasEntre, data } from '../../lib/format'
import Mapa from '../../components/Mapa'
import { StatusPill, CatDot, Alternar } from '../../components/ui'
import { LegendaCalor } from '../../components/CamadaCalor'
import { pontosCriticos } from '../../lib/calor'
import Barras from './Barras'
import { usePainel } from './contexto'

export default function Visao() {
  const { lista, abrir, perfil } = usePainel()
  const validas = lista.filter((o) => o.status !== 'recusada')
  const pend = lista.filter((o) => o.status === 'moderacao')
  const abertas = validas.filter((o) => !['resolvida', 'moderacao'].includes(o.status))
  const res = validas.filter((o) => o.status === 'resolvida')
  const tempos = res.filter((o) => o.resolvida_em).map((o) => diasEntre(o.created_at, o.resolvida_em))
  const medio = tempos.length ? (tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(1).replace('.', ',') : '–'
  const conferidas = validas.filter((o) => o.status !== 'moderacao')
  const [visao, setVisao] = useState('pontos')
  const [foco, setFoco] = useState(null)
  const criticos = useMemo(() => pontosCriticos(conferidas).filter((g) => g.total >= 2).slice(0, 5), [lista]) // eslint-disable-line react-hooks/exhaustive-deps
  const kpis = [
    ['Aguardando moderação', pend.length, 'conferir antes de publicar', pend.length ? 'ring-2 ring-amber-300' : ''],
    ['Em aberto', abertas.length, 'recebidas, em análise ou encaminhadas', ''],
    ['Resolvidas', res.length, `${pct(res.length, validas.length)}% das válidas`, ''],
    ['Tempo médio', medio, 'dias até resolver', ''],
  ]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {perfil.nome.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500">Visão geral de todas as ocorrências registradas.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map(([t, v, d, x]) => (
          <div key={t} className={`card p-5 ${x}`}>
            <div className="text-xs font-semibold text-slate-500">{t}</div>
            <div className="num mt-1 font-display text-3xl font-semibold">{v}</div>
            <div className="text-xs text-slate-500">{d}</div>
          </div>
        ))}
      </div>
      {pend.length > 0 && (
        <Link to="/painel/moderacao" className="flex items-center justify-between rounded-2xl bg-amber-100 px-5 py-4 text-sm font-semibold text-amber-900 hover:bg-amber-200">
          {pend.length} ocorrência(s) esperando moderação <span>Moderar →</span>
        </Link>
      )}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
            <h2 className="font-semibold">{visao === 'calor' ? 'Mapa de calor: onde mais alaga' : 'Mapa das ocorrências em aberto'}</h2>
            <Alternar rotulo="Tipo de mapa" valor={visao} onChange={setVisao} opcoes={[['pontos', 'Pontos'], ['calor', 'Mapa de calor']]} />
          </div>
          <Mapa pontos={[...pend, ...abertas]} calor={visao === 'calor' ? conferidas : null} foco={foco} className="h-[380px]" />
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-slate-500">
            {visao === 'calor'
              ? <><LegendaCalor /><span>{conferidas.length} avisos conferidos, abertos e resolvidos</span></>
              : <span>{abertas.length + pend.length} pontos em aberto</span>}
          </div>
        </section>
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="font-semibold">Pontos críticos</h2>
            <p className="mb-3 text-xs text-slate-500">Locais com mais avisos num raio de 250 metros.</p>
            {criticos.length ? (
              <ol className="space-y-1">
                {criticos.map((g, i) => (
                  <li key={`${g.lat},${g.lng}`}>
                    <button type="button" onClick={() => { setVisao('calor'); setFoco([g.lat, g.lng]) }} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-50 text-xs font-bold text-rose-700">{i + 1}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{g.rua || g.bairro}</span><span className="block truncate text-xs text-slate-500">{g.bairro} · último em {data(g.ultimo)}</span></span>
                      <span className="text-right"><span className="num block text-sm font-semibold">{g.total} avisos</span><span className="block text-[11px] text-slate-500">{g.abertos} em aberto</span></span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : <p className="rounded-xl bg-mist p-3 text-sm text-slate-600">Ainda não há locais com mais de um aviso. Conforme os moradores registram, os lugares que se repetem aparecem aqui.</p>}
          </section>
          <section className="card p-5"><h2 className="mb-4 font-semibold">Bairros com mais avisos</h2><Barras itens={contar(validas, 'bairro').slice(0, 7)} /></section>
          <section className="card p-5"><h2 className="mb-4 font-semibold">Por tipo</h2><Barras itens={contar(validas, 'categoria')} rotulo={(k) => CATEGORIAS[k]?.nome} cor={(k) => CATEGORIAS[k]?.cor} /></section>
        </div>
      </div>
      <section className="card p-2">
        <h2 className="p-3 font-semibold">Mais recentes</h2>
        {lista.slice(0, 6).map((o) => (
          <button key={o.id} onClick={() => abrir(o.id)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50">
            <CatDot categoria={o.categoria} />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{CATEGORIAS[o.categoria].nome}</span><span className="block truncate text-xs text-slate-500">{o.bairro} · {o.rua} · {data(o.created_at)}</span></span>
            <StatusPill status={o.status} curto />
          </button>
        ))}
      </section>
      <p className="text-xs text-slate-400">Situações: {Object.values(STATUS).map((s) => s.nome).join(' · ')}</p>
    </div>
  )
}
