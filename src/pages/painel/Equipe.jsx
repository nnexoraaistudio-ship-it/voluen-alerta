import { api } from '../../lib/api'
import { useCarregar } from '../../lib/hooks'
import { PAPEIS } from '../../lib/constants'
import { Carregando, Erro } from '../../components/ui'
import { usePainel } from './contexto'
import { MODO_DEMO } from '../../config'
import { useState } from 'react'

// Liberar uma pessoa nova: ela entra uma vez (Google, Apple ou e-mail) e o admin
// procura o e-mail aqui. Ninguém ganha acesso ao painel só por ter entrado.
function Liberar({ aoLiberar }) {
  const [email, setEmail] = useState('')
  const [papel, setPapel] = useState('moderador')
  const [msg, setMsg] = useState(null)
  const [indo, setIndo] = useState(false)
  async function liberar(e) {
    e.preventDefault(); setMsg(null); setIndo(true)
    try {
      const u = await api.acharPorEmail(email)
      if (!u) { setMsg({ erro: true, t: 'Não achamos esse e-mail. Peça para a pessoa entrar uma vez em voluen.com.br/#/equipe (com Google, Apple ou e-mail) e tente de novo.' }); return }
      if (u.papel) { setMsg({ t: `${u.email} já tem acesso como ${PAPEIS[u.papel].nome}.` }); return }
      await api.mudarPapel(u.id, papel)
      setMsg({ t: `Pronto: ${u.email} agora entra no painel como ${PAPEIS[papel].nome}.` }); setEmail(''); aoLiberar()
    } catch (x) { setMsg({ erro: true, t: x.message }) } finally { setIndo(false) }
  }
  return (
    <form onSubmit={liberar} className="card space-y-3 p-5">
      <div className="font-semibold text-deep">Liberar acesso para alguém</div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="lib-email">E-mail da pessoa</label>
        <input id="lib-email" type="email" required className="input flex-1" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="input sm:w-auto" value={papel} onChange={(e) => setPapel(e.target.value)} aria-label="Função">
          {Object.entries(PAPEIS).map(([k, p]) => <option key={k} value={k}>{p.nome}</option>)}
        </select>
        <button className="btn-brand shrink-0" disabled={indo}>{indo ? 'Liberando…' : 'Liberar'}</button>
      </div>
      {msg && <p className={`rounded-xl p-3 text-sm ${msg.erro ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`} role="status">{msg.t}</p>}
    </form>
  )
}

export default function Equipe() {
  const { perfil } = usePainel()
  const { dados, carregando, erro, recarregar } = useCarregar(() => api.listarEquipe(), [])
  async function mudar(id, papel) { await api.mudarPapel(id, papel || null); recarregar() }
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Equipe</h1>
        <p className="text-sm text-slate-500">Quem tem acesso ao painel e com qual função. Escolha "Sem acesso" para tirar alguém.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(PAPEIS).map(([k, p]) => <div key={k} className="card p-4"><div className="font-semibold">{p.nome}</div><div className="text-xs text-slate-500">{p.desc}</div></div>)}
      </div>
      {!MODO_DEMO && <Liberar aoLiberar={recarregar} />}
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
        {MODO_DEMO ? <p className="mt-1">No modo demonstração a equipe é fixa. Com o banco ligado, as pessoas são cadastradas no Supabase.</p> : (<>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Peça para a pessoa abrir voluen.com.br/#/equipe e tocar em "Entrar com Google" (ou Apple). Ela vai ver "Esta área é só para a equipe": é normal.</li>
            <li>Digite o e-mail dela no quadro "Liberar acesso" acima, escolha a função e toque em Liberar.</li>
            <li>Pronto: na próxima vez que ela entrar, o painel abre direto.</li>
          </ol>
          <p className="mt-2 text-xs text-slate-500">Quem entra com Apple e escolhe "Ocultar meu e-mail" aparece com um e-mail estranho (…@privaterelay.appleid.com). Para a equipe, prefira o Google. Também dá para criar a pessoa no Supabase (Authentication → Users → Add user) com e-mail e senha.</p>
        </>)}
      </div>
    </div>
  )
}
