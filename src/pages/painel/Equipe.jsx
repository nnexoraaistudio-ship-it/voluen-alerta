import { api } from '../../lib/api'
import { useCarregar } from '../../lib/hooks'
import { PAPEIS } from '../../lib/constants'
import { Carregando, Erro } from '../../components/ui'
import { usePainel } from './contexto'
import { MODO_DEMO } from '../../config'

export default function Equipe() {
  const { perfil } = usePainel()
  const { dados, carregando, erro, recarregar } = useCarregar(() => api.listarEquipe(), [])
  async function mudar(id, papel) { await api.mudarPapel(id, papel || null); recarregar() }
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Equipe</h1>
        <p className="text-sm text-slate-500">Defina a função de cada pessoa. Sem função, a pessoa entra mas não vê nada.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(PAPEIS).map(([k, p]) => <div key={k} className="card p-4"><div className="font-semibold">{p.nome}</div><div className="text-xs text-slate-500">{p.desc}</div></div>)}
      </div>
      {carregando ? <Carregando /> : erro ? <Erro texto={erro} tentar={recarregar} /> : (
        <div className="card divide-y divide-slate-100">
          {dados.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div><div className="font-semibold">{u.nome}</div><div className="text-xs text-slate-500">{u.email}</div></div>
              <select className="input w-auto" value={u.papel || ''} disabled={u.id === perfil.id} onChange={(e) => mudar(u.id, e.target.value)} aria-label={`Função de ${u.nome}`}>
                <option value="">Sem acesso</option>
                {Object.entries(PAPEIS).map(([k, p]) => <option key={k} value={k}>{p.nome}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
      <div className="card p-5 text-sm text-slate-600">
        <div className="font-semibold text-deep">Como incluir uma pessoa nova</div>
        {MODO_DEMO ? <p className="mt-1">No modo demonstração a equipe é fixa. Com o banco ligado, as pessoas são cadastradas no Supabase.</p> : (
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>No Supabase, abra Authentication → Users → Add user → Create new user.</li>
            <li>Informe o e-mail e uma senha provisória e marque "Auto Confirm User".</li>
            <li>Volte aqui, recarregue a página e escolha a função da pessoa.</li>
          </ol>
        )}
      </div>
    </div>
  )
}
