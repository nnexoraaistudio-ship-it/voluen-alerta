import { CATEGORIAS, pode } from '../../lib/constants'
import { dataHora } from '../../lib/format'
import { Icone } from '../../components/ui'
import { usePainel } from './contexto'

export default function Moderacao() {
  const { lista, abrir, perfil } = usePainel()
  const pend = lista.filter((o) => o.status === 'moderacao').sort((a, b) => a.created_at.localeCompare(b.created_at))
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Moderação</h1>
        <p className="text-sm text-slate-500">Ocorrências novas só aparecem no mapa depois de aprovadas. As mais antigas aparecem primeiro.</p>
      </div>
      {!pode.moderar(perfil.papel) && <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-900">Seu perfil pode ver, mas só moderadores e administradores aprovam ou recusam.</p>}
      {pend.length === 0 ? (
        <div className="card grid place-items-center gap-2 p-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icone.check width="22" height="22" /></span>
          <div className="font-semibold">Nada para moderar</div>
          <p className="text-sm text-slate-500">Quando um morador registrar uma ocorrência, ela aparece aqui.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pend.map((o) => (
            <button key={o.id} onClick={() => abrir(o.id)} className="card overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-lg">
              {o.foto_url ? <img src={o.foto_url} alt="" className="h-40 w-full object-cover" /> : <div className="grid h-40 place-items-center bg-slate-100 text-sm text-slate-400">Sem foto</div>}
              <div className="p-4">
                <div className="font-mono text-xs text-slate-400">{o.protocolo}</div>
                <div className="mt-1 font-semibold">{CATEGORIAS[o.categoria].nome}</div>
                <div className="text-sm text-slate-500">{o.bairro} · {o.rua}</div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{o.descricao}</p>
                <div className="mt-3 text-xs text-slate-400">{dataHora(o.created_at)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
