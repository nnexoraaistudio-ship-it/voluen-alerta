import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useCarregar, useSessao } from '../lib/hooks'
import { CATEGORIAS } from '../lib/constants'
import { Carregando, StatusPill, Icone } from '../components/ui'
import EntrarSocial, { useProvedores } from '../components/EntrarSocial'
import { data } from '../lib/format'

// Ocorrências ligadas à conta do morador (as que ele registrou depois de entrar).
export function MinhasOcorrencias({ perfil }) {
  const { dados, carregando, erro } = useCarregar(() => api.minhasOcorrencias(), [perfil.id])
  if (carregando) return <Carregando texto="Buscando suas ocorrências…" />
  if (erro) return <p className="text-sm text-rose-700">Não foi possível carregar suas ocorrências agora.</p>
  if (!dados.length) return <p className="text-sm text-slate-500">Você ainda não registrou nenhuma ocorrência com esta conta. <Link to="/registrar" className="font-semibold text-brand">Registrar um problema</Link></p>
  return (
    <ul className="divide-y divide-slate-100">
      {dados.map((o) => (
        <li key={o.protocolo}>
          <Link to={`/acompanhar/${o.protocolo}`} className="flex items-center gap-3 py-3 hover:text-brand">
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-sm font-medium text-deep">{o.protocolo}</span>
              <span className="block truncate text-xs text-slate-500">{[CATEGORIAS[o.categoria]?.nome, o.bairro, data(o.created_at)].filter(Boolean).join(' · ')}</span>
            </span>
            <StatusPill status={o.status} curto />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function Conta() {
  const { perfil, carregado } = useSessao()
  const prov = useProvedores()

  return (
    <div className="bg-mist">
      <div className="wrap max-w-xl py-10 sm:py-14">
        <div className="eyebrow">Minha conta</div>
        {!carregado ? <Carregando /> : perfil ? (
          <>
            <h1 className="mt-2 text-3xl font-semibold">Olá, {perfil.nome?.split(/[\s@]/)[0]}</h1>
            <p className="mt-1 text-sm text-slate-500">Você entrou como {perfil.email}.</p>
            {perfil.papel && (
              <Link to="/painel" className="btn-brand mt-5 w-full py-3">Abrir o painel da equipe <Icone.seta /></Link>
            )}
            <div className="card mt-6 p-5">
              <h2 className="text-lg font-semibold">Minhas ocorrências</h2>
              <p className="mt-1 text-sm text-slate-500">As que você registrou com esta conta, em qualquer aparelho.</p>
              <div className="mt-3"><MinhasOcorrencias perfil={perfil} /></div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/registrar" className="btn-dark"><Icone.mais /> Registrar problema</Link>
              <button onClick={() => api.sair()} className="btn-ghost">Sair da conta</button>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-3xl font-semibold">Entrar</h1>
            <p className="mt-2 text-slate-600">Entrar é opcional. Você pode registrar e acompanhar problemas sem conta, só com o número do protocolo.</p>
            <div className="card mt-6 p-6">
              <ul className="mb-5 space-y-2 text-sm text-slate-600">
                <li>✓ Seu nome e e-mail já vêm preenchidos no registro.</li>
                <li>✓ Veja todas as suas ocorrências em qualquer aparelho.</li>
                <li>✓ Sem senha nova: use a conta que você já tem.</li>
              </ul>
              {prov.google || prov.apple
                ? <EntrarSocial volta="/conta" />
                : <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">O login com Google e Apple ainda está sendo ligado. Enquanto isso, use o número do protocolo.</p>}
              <p className="mt-4 text-xs text-slate-500">Recebemos do Google ou da Apple apenas o seu nome e e-mail. Nada é publicado no mapa. Veja a <Link to="/privacidade" className="font-semibold text-brand underline">Política de privacidade</Link>.</p>
            </div>
            <p className="mt-6 text-sm text-slate-500">Tem um protocolo? <Link to="/acompanhar" className="font-semibold text-brand">Consultar agora</Link></p>
          </>
        )}
      </div>
    </div>
  )
}
