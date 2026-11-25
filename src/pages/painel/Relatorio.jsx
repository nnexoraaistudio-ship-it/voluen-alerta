import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { CATEGORIAS } from '../../lib/constants'
import { diasEntre } from '../../lib/format'
import { TIPOS, opcoesDePeriodo, anterior, calcular, resumoEmTexto, numero, porcento, duracao, variacao, variacaoPontos } from '../../lib/relatorio'
import { usePainel } from './contexto'

function Variacao({ atual, antes, melhor, pontos }) {
  const v = pontos ? variacaoPontos(atual, antes) : variacao(atual, antes)
  if (!v.sentido) return <span className="text-xs text-slate-400">sem comparação</span>
  const cor = v.sentido === 'igual' || !melhor ? 'text-slate-500' : v.sentido === melhor ? 'text-emerald-700' : 'text-rose-700'
  const seta = v.sentido === 'sobe' ? '▲' : v.sentido === 'desce' ? '▼' : '='
  return <span className={`text-xs font-semibold ${cor}`}>{seta} {v.texto}</span>
}

function Ranking({ titulo, itens, nome, sub }) {
  const max = Math.max(1, ...itens.map((i) => i.total))
  return (
    <section className="card p-5">
      <h2 className="mb-3 font-semibold">{titulo}</h2>
      {itens.length ? (
        <ol className="space-y-2.5">{itens.map((it, i) => (
          <li key={i} className="grid grid-cols-[18px_1fr_auto] items-center gap-x-2 text-sm">
            <span className="num text-xs font-bold text-slate-400">{i + 1}</span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{nome(it)}</span>
              {sub && <span className="block truncate text-xs text-slate-500">{sub(it)}</span>}
              <span className="mt-1 block h-1.5 rounded-full bg-brand-50"><span className="block h-1.5 rounded-full bg-brand" style={{ width: `${(it.total / max) * 100}%` }} /></span>
            </span>
            <span className="num font-display text-lg font-semibold text-deep">{it.total}</span>
          </li>
        ))}</ol>
      ) : <p className="text-sm text-slate-500">Sem ocorrências no período.</p>}
    </section>
  )
}

export default function Relatorio() {
  const { lista, perfil } = usePainel()
  const [tipo, setTipo] = useState('mes')
  const opcoes = useMemo(() => opcoesDePeriodo(tipo), [tipo])
  const [idx, setIdx] = useState(0)
  const p = opcoes[Math.min(idx, opcoes.length - 1)]
  const pAnt = anterior(p)

  // Histórico só das ocorrências dos dois períodos (para os tempos de atendimento).
  const ids = useMemo(() => lista.filter((o) => { const d = new Date(o.created_at); return d >= pAnt.inicio && d < p.fim }).map((o) => o.id), [lista, p.chave]) // eslint-disable-line react-hooks/exhaustive-deps
  const [hist, setHist] = useState({ chave: null, itens: [] })
  const [erroHist, setErroHist] = useState('')
  useEffect(() => {
    let vivo = true
    setErroHist('')
    api.historicoResumo(ids).then((itens) => { if (vivo) setHist({ chave: p.chave, itens }) })
      .catch((e) => { if (vivo) { setHist({ chave: p.chave, itens: [] }); setErroHist(e.message) } })
    return () => { vivo = false }
  }, [ids]) // eslint-disable-line react-hooks/exhaustive-deps
  const pronto = hist.chave === p.chave

  const atual = useMemo(() => calcular(lista, hist.itens, p), [lista, hist, p.chave]) // eslint-disable-line react-hooks/exhaustive-deps
  const ant = useMemo(() => calcular(lista, hist.itens, pAnt), [lista, hist, p.chave]) // eslint-disable-line react-hooks/exhaustive-deps

  const [gerando, setGerando] = useState(false)
  const [erroPdf, setErroPdf] = useState('')
  async function baixarPdf() {
    setGerando(true); setErroPdf('')
    try {
      const { gerarRelatorioPdf, nomeDoArquivo } = await import('../../lib/relatorioPdf')
      const doc = await gerarRelatorioPdf({ atual, anterior: ant, emissor: perfil?.nome })
      doc.save(nomeDoArquivo(p))
    } catch (e) {
      setErroPdf('Não foi possível gerar o PDF. Verifique a internet e tente de novo. (' + e.message + ')')
    } finally { setGerando(false) }
  }

  const velhas = lista.filter((o) => ['recebida', 'em_analise', 'encaminhada'].includes(o.status) && diasEntre(o.created_at, new Date()) > 7)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const T = TIPOS[tipo]
  const titulo = p.rotulo.charAt(0).toUpperCase() + p.rotulo.slice(1)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="space-y-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[.14em] text-brand">Relatório {T.palavra} · Imperatriz em Alerta</div>
          <h1 className="mt-1 text-2xl font-semibold">{titulo}{p.detalhe && <span className="ml-2 text-base font-medium text-slate-500">({p.detalhe})</span>}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-white p-1 ring-1 ring-slate-200" role="group" aria-label="Tipo de relatório">
            {Object.entries(TIPOS).map(([k, t]) => (
              <button key={k} onClick={() => { setTipo(k); setIdx(0) }} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tipo === k ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-50'}`} aria-pressed={tipo === k}>{t.nome}</button>
            ))}
          </div>
          <select className="input w-auto" value={idx} onChange={(e) => setIdx(Number(e.target.value))} aria-label="Período">
            {opcoes.map((o, i) => <option key={o.chave} value={i}>{o.rotulo.charAt(0).toUpperCase() + o.rotulo.slice(1)}{o.detalhe ? ` (${o.detalhe})` : ''}{i === 0 ? ' · em andamento' : ''}</option>)}
          </select>
          <button onClick={baixarPdf} disabled={gerando || !pronto} className="btn-brand">{gerando ? 'Gerando PDF…' : 'Baixar relatório em PDF'}</button>
        </div>
        {erroPdf && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{erroPdf}</p>}
        {erroHist && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Não deu para carregar o histórico, então os tempos de atendimento ficaram de fora. ({erroHist})</p>}
      </div>

      {atual.emAndamento && <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">Este período ainda está em andamento: os números são parciais.</p>}

      <p className="card p-5 text-[15px] leading-relaxed">{resumoEmTexto(atual, ant)}</p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Avisos recebidos', numero(atual.total), atual.total, ant.total, null],
          ['Resolvidas', `${numero(atual.resolvidas)} (${porcento(atual.taxaResolucao)})`, atual.taxaResolucao, ant.taxaResolucao, 'sobe', true],
          ['Até o atendimento', pronto ? duracao(atual.horasAtendimento) : '…', atual.horasAtendimento, ant.horasAtendimento, 'desce'],
          ['Até a solução', duracao(atual.horasSolucao), atual.horasSolucao, ant.horasSolucao, 'desce'],
        ].map(([t, v, a, b, melhor, pontos]) => (
          <div key={t} className="card p-4">
            <div className="text-xs font-semibold text-slate-500">{t}</div>
            <div className="num mt-1 font-display text-2xl font-semibold">{v}</div>
            <div className="mt-1"><Variacao atual={a} antes={b} melhor={melhor} pontos={pontos} /> <span className="text-xs text-slate-400">vs. {T.anteriorNome}</span></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Válidas', atual.validas], ['Em aberto', atual.emAberto], ['Recusadas', atual.recusadas], ['Em moderação', atual.moderacao]].map(([t, v]) => (
          <div key={t} className="card p-4"><div className="text-xs font-semibold text-slate-500">{t}</div><div className="num mt-1 font-display text-xl font-semibold">{numero(v)}</div></div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Ranking titulo="Bairros com mais ocorrências" itens={atual.bairros.slice(0, 8)} nome={(b) => b.nome} sub={(b) => `${b.resolvidas} resolvida${b.resolvidas === 1 ? "" : "s"}`} />
        <Ranking titulo="Ruas que mais alagam" itens={atual.ruas.slice(0, 8)} nome={(r) => r.rua} sub={(r) => r.bairro} />
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Por tipo</h2>
        {atual.tipos.length ? atual.tipos.map((t) => (
          <div key={t.chave} className="flex items-center justify-between border-t border-slate-100 py-2 text-sm first:border-t-0">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: t.cor }} />{t.nome}</span>
            <span className="num font-semibold">{t.total}</span>
          </div>
        )) : <p className="text-sm text-slate-500">Sem ocorrências no período.</p>}
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Abertas há mais de 7 dias (hoje)</h2>
        <p className="mb-3 text-xs text-slate-500">Considera todas as ocorrências ainda não resolvidas, de qualquer período. Esta lista não vai para o PDF.</p>
        {velhas.length ? (
          <table className="w-full text-sm"><tbody>{velhas.map((o) => (
            <tr key={o.id} className="border-t border-slate-100"><td className="py-2 font-mono text-xs">{o.protocolo}</td><td className="py-2">{o.bairro}</td><td className="py-2">{CATEGORIAS[o.categoria]?.nome}</td><td className="num py-2 text-right">{Math.floor(diasEntre(o.created_at, new Date()))} dias</td></tr>
          ))}</tbody></table>
        ) : <p className="text-sm text-slate-500">Nenhuma. Bom trabalho.</p>}
      </section>

      <p className="text-xs text-slate-500">O PDF tem só números, bairros, ruas e um mapa de calor. Não leva nome, telefone, e-mail, foto, protocolo nem o texto escrito pelos moradores (LGPD).</p>
    </div>
  )
}
