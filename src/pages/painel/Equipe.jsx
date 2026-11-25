import { useState } from 'react'
import { api } from '../../lib/api'
import { useCarregar } from '../../lib/hooks'
import { PAPEIS } from '../../lib/constants'
import { Carregando, Erro } from '../../components/ui'
import { usePainel } from './contexto'
import { MODO_DEMO } from '../../config'
import { cpfValido, formatarCpf, cpfMascarado, ehContaCpf } from '../../lib/cpf'

// Senha provisória fácil de ditar (sem letras que se confundem). A pessoa troca no primeiro acesso.
function senhaProvisoria() {
  const letras = 'abcdefghjkmnpqrstuvwxyz23456789'
  const n = crypto.getRandomValues(new Uint32Array(10))
  return Array.from(n, (x) => letras[x % letras.length]).join('').replace(/^(.{5})/, '$1-')
}

const Aviso = ({ msg }) => msg ? <p className={`rounded-xl p-3 text-sm ${msg.erro ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`} role="status">{msg.t}</p> : null

// Cadastro de uma pessoa da prefeitura: nome, CPF, função e senha provisória.
function Cadastrar({ aoCriar }) {
  const [f, setF] = useState({ nome: '', cpf: '', papel: 'prefeitura', senha: senhaProvisoria() })
  const [msg, setMsg] = useState(null)
  const [indo, setIndo] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: k === 'cpf' ? formatarCpf(e.target.value) : e.target.value })
  async function criar(e) {
    e.preventDefault(); setMsg(null)
    if (!cpfValido(f.cpf)) { setMsg({ erro: true, t: 'CPF inválido. Confira os números.' }); return }
    if (f.senha.length < 8) { setMsg({ erro: true, t: 'A senha provisória precisa ter pelo menos 8 caracteres.' }); return }
    setIndo(true)
    try {
      await api.criarMembro(f)
      setMsg({ t: `Pronto! Passe para ${f.nome.split(' ')[0]}, pessoalmente ou por telefone: CPF ${f.cpf} e senha provisória ${f.senha}. No primeiro acesso, o painel pede uma senha nova.` })
      setF({ nome: '', cpf: '', papel: f.papel, senha: senhaProvisoria() }); aoCriar()
    } catch (x) {
      setMsg({ erro: true, t: /duplicate|já cadastrado/i.test(x.message) ? 'Esse CPF já está cadastrado.' : x.message })
    } finally { setIndo(false) }
  }
  return (
    <form onSubmit={criar} className="card space-y-3 p-5">
      <div className="font-semibold text-deep">Cadastrar pessoa da equipe</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="c-nome">Nome completo</label><input id="c-nome" className="input" required maxLength={100} value={f.nome} onChange={set('nome')} /></div>
        <div><label className="label" htmlFor="c-cpf">CPF</label><input id="c-cpf" className="input" inputMode="numeric" required placeholder="000.000.000-00" value={f.cpf} onChange={set('cpf')} /></div>
        <div><label className="label" htmlFor="c-papel">Função</label>
          <select id="c-papel" className="input" value={f.papel} onChange={set('papel')}>
            {Object.entries(PAPEIS).map(([k, p]) => <option key={k} value={k}>{p.nome}</option>)}
          </select>
        </div>
        <div><label className="label" htmlFor="c-senha">Senha provisória</label>
          <div className="flex gap-2"><input id="c-senha" className="input font-mono" required minLength={8} value={f.senha} onChange={set('senha')} /><button type="button" className="btn-ghost shrink-0 !px-3 text-xs" onClick={() => setF({ ...f, senha: senhaProvisoria() })}>Gerar</button></div>
        </div>
      </div>
      <button className="btn-brand" disabled={indo}>{indo ? 'Cadastrando…' : 'Cadastrar'}</button>
      <Aviso msg={msg} />
    </form>
  )
}

// Liberar uma conta de e-mail (equipe Voluen) que já entrou uma vez no site.
function Liberar({ aoLiberar }) {
  const [email, setEmail] = useState('')
  const [papel, setPapel] = useState('moderador')
  const [msg, setMsg] = useState(null)
  const [indo, setIndo] = useState(false)
  async function liberar(e) {
    e.preventDefault(); setMsg(null); setIndo(true)
    try {
      const u = await api.acharPorEmail(email)
      if (!u) { setMsg({ erro: true, t: 'Não achamos esse e-mail. A pessoa precisa entrar uma vez no site antes.' }); return }
      if (u.papel) { setMsg({ t: `${u.email} já tem acesso como ${PAPEIS[u.papel].nome}.` }); return }
      await api.mudarPapel(u.id, papel)
      setMsg({ t: `Pronto: ${u.email} agora entra no painel como ${PAPEIS[papel].nome}.` }); setEmail(''); aoLiberar()
    } catch (x) { setMsg({ erro: true, t: x.message }) } finally { setIndo(false) }
  }
  return (
    <details className="card p-5">
      <summary className="cursor-pointer font-semibold text-deep">Liberar uma conta de e-mail (equipe Voluen)</summary>
      <form onSubmit={liberar} className="mt-3 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="lib-email">E-mail da pessoa</label>
          <input id="lib-email" type="email" required className="input flex-1" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className="input sm:w-auto" value={papel} onChange={(e) => setPapel(e.target.value)} aria-label="Função">
            {Object.entries(PAPEIS).map(([k, p]) => <option key={k} value={k}>{p.nome}</option>)}
          </select>
          <button className="btn-brand shrink-0" disabled={indo}>{indo ? 'Liberando…' : 'Liberar'}</button>
        </div>
        <Aviso msg={msg} />
      </form>
    </details>
  )
}

export default function Equipe() {
  const { perfil } = usePainel()
  const { dados, carregando, erro, recarregar } = useCarregar(() => api.listarEquipe(), [])
  const [aviso, setAviso] = useState(null)
  async function mudar(id, papel) { await api.mudarPapel(id, papel || null); recarregar() }
  async function novaSenha(u) {
    const senha = senhaProvisoria()
    if (!window.confirm(`Criar uma senha provisória nova para ${u.nome}? A senha atual dela deixa de funcionar.`)) return
    try { await api.redefinirSenha(u.id, senha); setAviso({ t: `Nova senha provisória de ${u.nome}: ${senha}. Passe pessoalmente ou por telefone. No próximo acesso, o painel pede uma senha nova.` }) }
    catch (x) { setAviso({ erro: true, t: x.message }) }
  }
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Equipe</h1>
        <p className="text-sm text-slate-500">Quem tem acesso ao painel e com qual função. Escolha "Sem acesso" para tirar alguém.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(PAPEIS).map(([k, p]) => <div key={k} className="card p-4"><div className="font-semibold">{p.nome}</div><div className="text-xs text-slate-500">{p.desc}</div></div>)}
      </div>
      <Cadastrar aoCriar={recarregar} />
      <Aviso msg={aviso} />
      {carregando ? <Carregando /> : erro ? <Erro texto={erro} tentar={recarregar} /> : (
        <div className="card divide-y divide-slate-100">
          {dados.map((u) => {
            const porCpf = u.cpf || ehContaCpf(u.email)
            return (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="font-semibold">{u.nome}</div>
                  <div className="text-xs text-slate-500">{porCpf ? `CPF ${cpfMascarado(u.cpf || u.email)}` : u.email}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {porCpf && !MODO_DEMO && u.id !== perfil.id && <button onClick={() => novaSenha(u)} className="btn-ghost !px-3 !py-2 text-xs">Nova senha</button>}
                  <select className="input w-auto" value={u.papel || ''} disabled={u.id === perfil.id} onChange={(e) => mudar(u.id, e.target.value)} aria-label={`Função de ${u.nome}`}>
                    <option value="">Sem acesso</option>
                    {Object.entries(PAPEIS).map(([k, p]) => <option key={k} value={k}>{p.nome}</option>)}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {!MODO_DEMO && <Liberar aoLiberar={recarregar} />}
      <div className="card p-5 text-sm text-slate-600">
        <div className="font-semibold text-deep">Como incluir uma pessoa da prefeitura</div>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Preencha nome, CPF e função no quadro "Cadastrar pessoa da equipe" e toque em Cadastrar.</li>
          <li>Passe o CPF e a senha provisória para a pessoa, pessoalmente ou por telefone (nunca por grupo).</li>
          <li>Ela entra em voluen.com.br/#/equipe com CPF e senha e cria a própria senha no primeiro acesso.</li>
        </ol>
        <p className="mt-2 text-xs text-slate-500">Esqueceu a senha? Toque em "Nova senha" ao lado do nome da pessoa.</p>
      </div>
    </div>
  )
}
