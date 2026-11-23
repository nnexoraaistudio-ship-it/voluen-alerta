import { STATUS, FLUXO } from '../lib/constants'
import { dataHora } from '../lib/format'

// Linha do tempo da ocorrência: etapas previstas + o que já aconteceu.
export default function Linha({ status, historico = [], motivo }) {
  if (status === 'recusada' || status === 'moderacao') {
    const s = STATUS[status]
    return (
      <div className={`rounded-2xl p-4 ring-1 ring-inset ${s.cls}`}>
        <div className="font-semibold">{s.nome}</div>
        <p className="mt-1 text-sm">{status === 'recusada' ? motivo || s.desc : s.desc}</p>
      </div>
    )
  }
  const atual = FLUXO.indexOf(status)
  return (
    <ol className="relative">
      {FLUXO.map((k, i) => {
        const h = [...historico].reverse().find((x) => x.status === k)
        const feito = i <= atual
        return (
          <li key={k} className="relative grid grid-cols-[28px_1fr] gap-3 pb-6 last:pb-0">
            {i < FLUXO.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 ${i < atual ? 'bg-brand' : 'bg-slate-200'}`} />}
            <span className={`z-10 grid h-7 w-7 place-items-center rounded-full border-2 ${feito ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-white'}`}>
              {feito && <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5 9-10" /></svg>}
            </span>
            <div className="-mt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-semibold ${feito ? 'text-deep' : 'text-slate-400'}`}>{STATUS[k].nome}</span>
                {i === atual && <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-brand">Atual</span>}
              </div>
              <p className={`text-sm ${feito ? 'text-slate-600' : 'text-slate-400'}`}>{STATUS[k].desc}</p>
              {h && <div className="mt-1 text-xs text-slate-400">{dataHora(h.created_at)}</div>}
              {h?.mensagem && <div className="mt-2 rounded-xl bg-mist p-3 text-sm text-slate-700"><span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Recado da equipe</span>{h.mensagem}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
