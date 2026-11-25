import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useSessao } from '../lib/hooks'
import { PAPEIS } from '../lib/constants'
import { Logo, Carregando } from '../components/ui'
import { MODO_DEMO } from '../config'
import EntrarSocial, { useProvedores } from '../components/EntrarSocial'

export default function Login() {
  const { perfil, carregado } = useSessao()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const prov = useProvedores()
  const temSocial = !MODO_DEMO && (prov.google || prov.apple)
  if (!carregado) return <div className="wrap"><Carregando /></div>
  if (perfil) return <Navigate to="/painel" replace />

  async function entrar(e, emailDemo) {
    e?.preventDefault()
    setErro(''); setEnviando(true)
    try { await api.entrar(emailDemo || email, senha) } catch (x) {
      setErro(/Invalid login/i.test(x.message) ? 'E-mail ou senha incorretos.' : x.message)
    } finally { setEnviando(false) }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-deep px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-block"><Logo claro sub="Acesso da equipe" /></Link>
        <div className="rounded-3xl bg-white p-7 shadow-2xl">
          <h1 className="text-2xl font-semibold">Entrar no painel</h1>
          <p className="mt-1 text-sm text-slate-500">Área restrita à equipe da Voluen e da Prefeitura.</p>
          {MODO_DEMO ? (
            <div className="mt-6 space-y-2">
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Modo demonstração: escolha um perfil para ver o painel como ele aparece para cada pessoa da equipe.</p>
              {api.equipeDemo.map((u) => (
                <button key={u.id} onClick={() => entrar(null, u.email)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left hover:border-brand hover:bg-brand-50">
                  <span><span className="block font-semibold">{PAPEIS[u.papel].nome}</span><span className="block text-xs text-slate-500">{PAPEIS[u.papel].desc}</span></span>
                  <span className="text-brand">→</span>
                </button>
              ))}
            </div>
          ) : (
            <>
            {temSocial && (
              <div className="mt-6">
                <EntrarSocial volta="/painel" />
                <p className="mt-3 text-xs text-slate-500">Use a mesma conta do e-mail cadastrado pela equipe. Entrar com Google ou Apple não libera o painel sozinho: um administrador precisa ter dado a sua função.</p>
                <div className="my-5 flex items-center gap-3 text-xs font-medium text-slate-400"><span className="h-px flex-1 bg-slate-200" />ou com e-mail e senha<span className="h-px flex-1 bg-slate-200" /></div>
              </div>
            )}
            <form onSubmit={entrar} className={`${temSocial ? '' : 'mt-6 '}space-y-4`}>
              <div><label className="label" htmlFor="em">E-mail</label><input id="em" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
              <div><label className="label" htmlFor="pw">Senha</label><input id="pw" type="password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" /></div>
              <button className="btn-brand w-full py-3" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
              <p className="text-xs text-slate-500">Não tem acesso? Peça a um administrador da Voluen para cadastrar você.</p>
            </form>
            </>
          )}
          {erro && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{erro}</div>}
        </div>
        <Link to="/" className="mt-6 inline-block text-sm text-slate-400 hover:text-white">← Voltar ao site</Link>
      </div>
    </div>
  )
}
