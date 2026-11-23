import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { CATEGORIAS, BAIRROS } from '../lib/constants'
import { comprimirFoto } from '../lib/imagem'
import { localizar } from '../lib/endereco'
import Mapa from '../components/Mapa'
import { Icone, CatDot } from '../components/ui'

const ETAPAS = ['Tipo', 'Local', 'Foto', 'Descrição', 'Enviar']
const INICIAL = { categoria: '', bairro: '', rua: '', referencia: '', lat: null, lng: null, descricao: '', contato_nome: '', contato_telefone: '', contato_email: '' }

export default function Registrar() {
  const [etapa, setEtapa] = useState(0)
  const [d, setD] = useState(INICIAL)
  const [foto, setFoto] = useState(null)
  const [aceite, setAceite] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [feito, setFeito] = useState(null)
  const [gps, setGps] = useState('')
  const [buscado, setBuscado] = useState('')
  const set = (k) => (e) => setD({ ...d, [k]: e.target ? e.target.value : e })

  const valido = [
    !!d.categoria,
    d.bairro.trim().length > 1 && d.rua.trim().length > 1 && d.lat != null,
    true,
    d.descricao.trim().length >= 5,
    aceite,
  ][etapa]

  async function escolherFoto(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setErro('Escolha um arquivo de imagem.'); return }
    setErro('')
    try { setFoto(await comprimirFoto(f)) } catch { setErro('Não conseguimos ler essa foto. Tente outra.') }
  }

  function minhaLocalizacao() {
    if (!navigator.geolocation) { setGps('Seu aparelho não permite usar a localização.'); return }
    setGps('Buscando sua localização…')
    navigator.geolocation.getCurrentPosition(
      (p) => { setD((x) => ({ ...x, lat: p.coords.latitude, lng: p.coords.longitude })); setGps('') },
      () => setGps('Não foi possível pegar a localização. Toque no mapa para marcar.'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function buscarEndereco(forcar) {
    const chave = `${d.rua.trim()}|${d.bairro.trim()}`
    if (!d.rua.trim() && !d.bairro.trim()) return
    if (!forcar && (chave === buscado || d.lat != null)) return
    setBuscado(chave)
    setGps('Procurando o endereço no mapa…')
    try {
      const r = await localizar(d.rua.trim(), d.bairro.trim())
      if (!r) { setGps('Não encontramos esse endereço. Toque no mapa para marcar o local.'); return }
      setD((x) => ({ ...x, lat: r.lat, lng: r.lng }))
      setGps(r.precisao === 'rua'
        ? 'Encontramos a rua. Confira o ponto e toque no mapa para ajustar ao local exato.'
        : 'Encontramos o bairro, mas não a rua. Toque no mapa no local exato do problema.')
    } catch { setGps('A busca de endereço não respondeu. Toque no mapa para marcar o local.') }
  }

  async function enviar() {
    setEnviando(true); setErro('')
    try {
      const r = await api.registrar(d, foto)
      setFeito(r.protocolo)
      window.scrollTo(0, 0)
    } catch (e) {
      setErro('Não foi possível enviar agora. Confira sua internet e tente de novo. (' + e.message + ')')
    } finally { setEnviando(false) }
  }

  if (feito) return <Sucesso protocolo={feito} novo={() => { setFeito(null); setD(INICIAL); setFoto(null); setAceite(false); setEtapa(0) }} />

  return (
    <div className="bg-mist">
      <div className="wrap max-w-3xl py-10 sm:py-14">
        <div className="eyebrow">Nova ocorrência</div>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Registrar um problema</h1>
        <p className="mt-2 text-slate-600">Cinco passos rápidos. Nenhum dado pessoal é obrigatório.</p>

        <div className="card mt-8 p-5 sm:p-8">
          <ol className="grid grid-cols-5 gap-2" aria-label="Etapas">
            {ETAPAS.map((e, i) => (
              <li key={e} className="min-w-0">
                <div className={`h-1.5 rounded-full ${i <= etapa ? 'bg-brand' : 'bg-slate-200'}`} />
                <div className={`mt-2 hidden truncate text-xs font-semibold sm:block ${i === etapa ? 'text-deep' : 'text-slate-400'}`}>{i + 1}. {e}</div>
              </li>
            ))}
          </ol>
          <div className="mt-2 text-xs font-semibold text-slate-500 sm:hidden">Passo {etapa + 1} de 5 · {ETAPAS[etapa]}</div>

          <div className="mt-7 min-h-[260px]">
            {etapa === 0 && (
              <fieldset>
                <legend className="font-display text-xl font-semibold">Qual é o problema?</legend>
                <p className="mt-1 text-sm text-slate-500">Escolha o tipo que mais se parece com o que você encontrou.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {Object.entries(CATEGORIAS).map(([k, c]) => (
                    <button type="button" key={k} onClick={() => setD({ ...d, categoria: k })} aria-pressed={d.categoria === k}
                      className={`flex gap-3 rounded-2xl border p-4 text-left transition ${d.categoria === k ? 'border-brand bg-brand-50 ring-2 ring-brand/20' : 'border-slate-200 hover:border-slate-300'}`}>
                      <span className="mt-1"><CatDot categoria={k} size={12} /></span>
                      <span><span className="block font-semibold">{c.nome}</span><span className="block text-sm text-slate-500">{c.desc}</span></span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {etapa === 1 && (
              <div>
                <h2 className="font-display text-xl font-semibold">Onde está o problema?</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="bairro">Bairro *</label>
                    <input id="bairro" className="input" list="bairros" value={d.bairro} onChange={set('bairro')} placeholder="Digite ou escolha o bairro" autoComplete="off" />
                    <datalist id="bairros">{BAIRROS.map((b) => <option key={b} value={b} />)}</datalist>
                  </div>
                  <div>
                    <label className="label" htmlFor="rua">Rua ou avenida *</label>
                    <input id="rua" className="input" value={d.rua} onChange={set('rua')} onBlur={() => buscarEndereco(false)} placeholder="Ex.: Rua Ceará" maxLength={120} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="ref">Ponto de referência</label>
                    <input id="ref" className="input" value={d.referencia} onChange={set('referencia')} placeholder="Ex.: em frente à escola do bairro" maxLength={160} />
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                  <span className="label !mb-0">Marque no mapa *</span>
                  <span className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => buscarEndereco(true)} disabled={!d.rua.trim() && !d.bairro.trim()} className="btn-ghost !py-1.5 text-xs"><Icone.busca /> Achar endereço no mapa</button>
                    <button type="button" onClick={minhaLocalizacao} className="btn-ghost !py-1.5 text-xs"><Icone.pin /> Usar minha localização</button>
                  </span>
                </div>
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200">
                  <Mapa escolha={d.lat != null ? [d.lat, d.lng] : null} onPick={([lat, lng]) => setD({ ...d, lat, lng })} className="h-[300px]" />
                </div>
                <p className="mt-2 text-xs text-slate-500">{gps || (d.lat != null ? 'Ponto marcado. Toque em outro lugar do mapa para ajustar.' : 'Digite a rua e o mapa vai até ela. Depois toque no local exato do problema.')}</p>
              </div>
            )}

            {etapa === 2 && (
              <div>
                <h2 className="font-display text-xl font-semibold">Tem uma foto?</h2>
                <p className="mt-1 text-sm text-slate-500">A foto ajuda a equipe a entender o tamanho do problema. É opcional.</p>
                <div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><Icone.alerta className="mt-0.5 shrink-0" /> Evite fotos que mostrem o rosto de pessoas ou placas de carros.</div>
                <label htmlFor="foto" className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-500 hover:border-brand hover:text-brand">
                  {foto ? <img src={foto.previa} alt="Foto escolhida" className="max-h-64 rounded-xl object-contain" /> : <Icone.camera width="32" height="32" />}
                  <span className="text-sm font-semibold">{foto ? 'Trocar a foto' : 'Tirar ou escolher uma foto'}</span>
                </label>
                <input id="foto" type="file" accept="image/*" className="sr-only" onChange={escolherFoto} />
                {foto && <button type="button" onClick={() => setFoto(null)} className="mt-3 text-sm font-semibold text-rose-700">Remover foto</button>}
              </div>
            )}

            {etapa === 3 && (
              <div>
                <label htmlFor="desc" className="font-display text-xl font-semibold">Conte o que está acontecendo</label>
                <p className="mt-1 text-sm text-slate-500">Desde quando? A água entra nas casas? Tem risco para quem passa?</p>
                <textarea id="desc" className="input mt-4 min-h-[140px]" value={d.descricao} onChange={set('descricao')} maxLength={1000} placeholder="Ex.: a rua alaga toda vez que chove, a água chega na altura do joelho e entra nas casas da esquina." />
                <div className="mt-1 text-right text-xs text-slate-400">{d.descricao.length}/1000</div>
                <p className="text-xs text-slate-500">Não escreva nomes, telefones ou outros dados pessoais aqui. Este texto pode aparecer no mapa.</p>
              </div>
            )}

            {etapa === 4 && (
              <div>
                <h2 className="font-display text-xl font-semibold">Quer receber um retorno?</h2>
                <p className="mt-1 text-sm text-slate-500">Opcional. Seus dados de contato nunca aparecem no mapa: só a equipe vê, e eles são apagados quando a ocorrência é encerrada.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div><label className="label" htmlFor="nome">Nome</label><input id="nome" className="input" value={d.contato_nome} onChange={set('contato_nome')} maxLength={100} autoComplete="name" /></div>
                  <div><label className="label" htmlFor="tel">Telefone</label><input id="tel" className="input" value={d.contato_telefone} onChange={set('contato_telefone')} maxLength={30} inputMode="tel" autoComplete="tel" /></div>
                  <div><label className="label" htmlFor="email">E-mail</label><input id="email" type="email" className="input" value={d.contato_email} onChange={set('contato_email')} maxLength={120} autoComplete="email" /></div>
                </div>
                <div className="mt-6 rounded-2xl bg-mist p-4 text-sm">
                  <div className="font-semibold">Resumo</div>
                  <div className="mt-1 text-slate-600">{CATEGORIAS[d.categoria]?.nome} · {d.bairro} · {d.rua}{foto ? ' · com foto' : ''}</div>
                </div>
                <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed">
                  <input id="aceite" type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#0F5E6B]" />
                  <span>Li e concordo com a <Link to="/privacidade" target="_blank" className="font-semibold text-brand underline">Política de privacidade</Link>. Entendo que o local, a descrição e a foto da ocorrência poderão aparecer no mapa público, sem o meu nome.</span>
                </label>
              </div>
            )}
          </div>

          {erro && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{erro}</div>}

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            <button type="button" onClick={() => setEtapa(etapa - 1)} disabled={etapa === 0} className="btn text-slate-500 hover:text-deep disabled:invisible"><Icone.voltar /> Voltar</button>
            {etapa < 4
              ? <button type="button" onClick={() => setEtapa(etapa + 1)} disabled={!valido} className="btn-brand px-6">{etapa === 2 && !foto ? 'Pular' : 'Continuar'} <Icone.seta /></button>
              : <button type="button" onClick={enviar} disabled={!valido || enviando} className="btn-accent px-6">{enviando ? 'Enviando…' : 'Enviar ocorrência'} {!enviando && <Icone.check />}</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Sucesso({ protocolo, novo }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = () => navigator.clipboard?.writeText(protocolo).then(() => setCopiado(true), () => {})
  return (
    <div className="bg-mist">
      <div className="wrap max-w-xl py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icone.check width="30" height="30" /></div>
        <h1 className="mt-5 text-3xl font-semibold">Ocorrência enviada</h1>
        <p className="mt-2 text-slate-600">Guarde o número do seu protocolo:</p>
        <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-soft">
          <span className="select-all font-mono text-2xl font-medium text-deep">{protocolo}</span>
          <button onClick={copiar} className="btn-ghost !px-3 !py-1.5 text-xs">{copiado ? 'Copiado' : 'Copiar'}</button>
        </div>
        <p className="mx-auto mt-5 max-w-sm text-sm text-slate-600">A equipe vai conferir as informações antes de publicar no mapa. Você acompanha cada etapa pelo protocolo.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to={`/acompanhar/${protocolo}`} className="btn-brand px-6 py-3">Acompanhar ocorrência</Link>
          <button onClick={novo} className="btn-ghost px-6 py-3">Registrar outra</button>
        </div>
      </div>
    </div>
  )
}
