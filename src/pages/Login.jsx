import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useSessao } from '../lib/hooks'
import { PAPEIS } from '../lib/constants'
import { Logo, Carregando } from '../components/ui'
import { MODO_DEMO } from '../config'
import { formatarCpf } from '../lib/cpf'

// Fundo discreto com a identidade da marca: as ondas de sinal do "o" da Voluen,
// um traço de rio (o Tocantins) e a malha de ruas, tudo em baixa opacidade.
function Fundo() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="brilho" cx="78%" cy="85%" r="65%">
          <stop offset="0" stopColor="#0B4DA2" stopOpacity=".55" />
          <stop offset="1" stopColor="#072B5A" stopOpacity="0" />
        </radialGradient>
        <pattern id="malha" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
          <path d="M64 0H0V64" fill="none" stroke="#F3F6FA" strokeOpacity=".06" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="1440" height="900" fill="url(#brilho)" />
      <rect width="1440" height="900" fill="url(#malha)" />
      <path d="M-40 640 C 220 560, 360 700, 600 610 S 980 470, 1180 560 S 1420 650, 1500 600" fill="none" stroke="#2BB3E6" strokeOpacity=".16" strokeWidth="2" />
      <path d="M-40 668 C 220 588, 360 728, 600 638 S 980 498, 1180 588 S 1420 678, 1500 628" fill="none" stroke="#2BB3E6" strokeOpacity=".08" strokeWidth="1.5" />
      {/* Ruas principais em branco, bem finas */}
      <g fill="none" stroke="#FFFFFF" strokeLinecap="round">
        <path d="M120 -20 L 360 920" strokeOpacity=".10" strokeWidth="1.5" />
        <path d="M-20 300 L 1460 120" strokeOpacity=".08" strokeWidth="1.5" />
        <path d="M640 -20 C 700 260, 660 520, 760 920" strokeOpacity=".09" strokeWidth="1.5" />
        <path d="M-20 820 L 1460 700" strokeOpacity=".07" strokeWidth="1.2" />
        <path d="M1020 -20 L 900 920" strokeOpacity=".07" strokeWidth="1.2" />
      </g>
      {/* Ondas de sinal brancas no canto de cima */}
      <g fill="none" stroke="#FFFFFF" strokeLinecap="round" transform="translate(250 150)">
        {[40, 80, 120].map((r, i) => (
          <path key={r} d={`M ${-r * 0.71} ${-r * 0.71} A ${r} ${r} 0 0 1 ${r * 0.71} ${-r * 0.71}`} strokeOpacity={0.22 - i * 0.06} strokeWidth="2" />
        ))}
        <circle r="5" fill="#FFFFFF" fillOpacity=".5" stroke="none" />
      </g>
      {/* Pontos brancos, como registros no mapa */}
      <g fill="#FFFFFF">
        {[[560, 210, 4, .35], [780, 330, 3, .3], [700, 140, 2.5, .25], [610, 470, 3, .25], [840, 520, 4, .3],
          [520, 720, 3, .25], [880, 780, 2.5, .2], [380, 830, 2.5, .2], [1120, 260, 3, .25], [1300, 420, 2.5, .2], [110, 760, 3, .2], [760, 620, 2, .3]]
          .map(([x, y, r, o]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r={r * 3.2} fillOpacity={o * 0.18} />
              <circle cx={x} cy={y} r={r} fillOpacity={o * 1.6} />
            </g>
          ))}
      </g>
      <g fill="none" stroke="#2BB3E6" strokeLinecap="round" transform="translate(1180 760)">
        {[90, 170, 250, 330, 410].map((r, i) => (
          <path key={r} d={`M ${-r * 0.71} ${-r * 0.71} A ${r} ${r} 0 0 1 ${r * 0.71} ${-r * 0.71}`} strokeOpacity={0.22 - i * 0.04} strokeWidth="2" />
        ))}
        <circle r="10" fill="#2BB3E6" fillOpacity=".5" stroke="none" />
      </g>
    </svg>
  )
}

const PONTOS = [
  ['Moderação', 'Confira cada registro antes de ir para o mapa.'],
  ['Acompanhamento', 'Atualize a situação e o morador é avisado.'],
  ['Relatórios', 'Veja onde alaga mais e planeje as ações.'],
]

// Login do painel: a equipe da prefeitura entra com CPF e senha.
// A equipe da Voluen (administradores) pode entrar com e-mail e senha.
export default function Login() {
  const { perfil, carregado } = useSessao()
  const [porEmail, setPorEmail] = useState(false)
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  if (!carregado) return <div className="wrap"><Carregando /></div>
  if (perfil) return <Navigate to="/painel" replace />

  async function entrar(e, emailDemo) {
    e?.preventDefault()
    setErro(''); setEnviando(true)
    try {
      if (emailDemo) await api.entrar(emailDemo)
      else if (porEmail) await api.entrar(email, senha)
      else await api.entrarCpf(cpf, senha)
    } catch (x) {
      setErro(/Invalid login/i.test(x.message) ? 'E-mail ou senha incorretos.' : /rate limit|too many/i.test(x.message) ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' : x.message)
    } finally { setEnviando(false) }
  }

  return (
    <div className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-deep px-4 py-10">
      <Fundo />
      <div className="relative grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1fr_28rem]">
      <div className="hidden text-white lg:block">
        <Link to="/" className="inline-block"><Logo claro /></Link>
        <div className="mt-12 text-xs font-semibold uppercase tracking-[.18em] text-accent">Painel de gestão</div>
        <h2 className="mt-3 max-w-md font-display text-4xl font-semibold leading-tight">Informação da rua para quem cuida da cidade.</h2>
        <ul className="mt-8 max-w-md space-y-4">
          {PONTOS.map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><span className="block text-sm font-semibold text-white">{t}</span><span className="block text-sm text-slate-300">{d}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-full max-w-md justify-self-center">
        <Link to="/" className="mb-6 inline-block lg:hidden"><Logo claro /></Link>
        <div className="rounded-3xl bg-white p-7 shadow-2xl">
          <h1 className="text-2xl font-semibold">Entrar no painel</h1>
          <p className="mt-1 text-sm text-slate-500">Área restrita à equipe da Prefeitura e da Voluen.</p>
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
            <form onSubmit={entrar} className="mt-6 space-y-4">
              {porEmail ? (
                <div><label className="label" htmlFor="em">E-mail</label><input id="em" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
              ) : (
                <div><label className="label" htmlFor="cpf">CPF</label><input id="cpf" className="input" inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(formatarCpf(e.target.value))} required autoComplete="username" /></div>
              )}
              <div><label className="label" htmlFor="pw">Senha</label><input id="pw" type="password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" /></div>
              <button className="btn-brand w-full py-3" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
              <p className="text-xs text-slate-500">Esqueceu a senha ou ainda não tem acesso? Fale com o administrador da Voluen.</p>
              <button type="button" onClick={() => { setPorEmail(!porEmail); setErro('') }} className="text-xs font-semibold text-brand underline">
                {porEmail ? 'Entrar com CPF' : 'Sou da equipe Voluen: entrar com e-mail'}
              </button>
            </form>
          )}
          {erro && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{erro}</div>}
        </div>
        <Link to="/" className="mt-6 inline-block text-sm text-slate-400 hover:text-white">← Voltar ao site</Link>
      </div>
      </div>
    </div>
  )
}
