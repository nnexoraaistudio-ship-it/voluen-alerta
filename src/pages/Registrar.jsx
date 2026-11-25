import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { CATEGORIAS } from '../lib/constants'
import { comprimirFoto } from '../lib/imagem'
import { bairrosFixos, carregarBairros, acharBairro, ruasDoBairro, pontoDaRua, localizarTexto, normalizar } from '../lib/endereco'
import Mapa from '../components/Mapa'
import { Icone, CatDot } from '../components/ui'
import { AVISOS_EMAIL_LIGADOS, TEL_DEFESA_CIVIL, TEL_BOMBEIROS } from '../config'
import { guardarProtocolo } from '../lib/meusProtocolos'
import { compartilhar, enderecoSite } from '../lib/compartilhar'
import { useSessao } from '../lib/hooks'
import EntrarSocial, { useProvedores } from '../components/EntrarSocial'

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
  const [bairros, setBairros] = useState(bairrosFixos)
  const [bairroManual, setBairroManual] = useState(false)
  const [ruaManual, setRuaManual] = useState(false)
  const [bairroInfo, setBairroInfo] = useState(null)
  const [ruas, setRuas] = useState(null)
  const [linhas, setLinhas] = useState([])
  const [foco, setFoco] = useState(null)
  const bairroAtual = useRef('')
  const set = (k) => (e) => setD({ ...d, [k]: e.target ? e.target.value : e })
  const { perfil } = useSessao()
  const prov = useProvedores()

  // Quem entrou com Google/Apple já tem nome e e-mail preenchidos (pode apagar se não quiser enviar).
  useEffect(() => {
    if (!perfil) return
    setD((x) => ({
      ...x,
      contato_nome: x.contato_nome || (perfil.nome && perfil.nome !== perfil.email ? perfil.nome : ''),
      contato_email: x.contato_email || perfil.email || '',
    }))
  }, [perfil?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (etapa === 1) carregarBairros().then(setBairros) }, [etapa]) // eslint-disable-line react-hooks/exhaustive-deps

  async function mudarBairro(valor) {
    bairroAtual.current = valor
    setD((x) => ({ ...x, bairro: valor, rua: '', lat: null, lng: null }))
    setLinhas([]); setRuas(null); setBairroInfo(null); setRuaManual(false)
    if (!valor.trim()) return
    setGps('Procurando o bairro no mapa…')
    const b = await acharBairro(valor).catch(() => null)
    if (bairroAtual.current !== valor) return
    // Bairro sem posição no mapa (ou serviço fora do ar): a pessoa digita a rua e marca o ponto no mapa.
    if (!b) { setRuas([]); setRuaManual(true); setGps('Não achamos esse bairro no mapa. Digite a rua e toque no mapa no local exato.'); return }
    setBairroInfo(b); setFoco([b.lat, b.lng])
    setGps('Carregando as ruas do bairro…')
    try {
      const lista = await ruasDoBairro(b)
      if (bairroAtual.current !== valor) return
      setRuas(lista)
      if (!lista.length) setRuaManual(true)
      setGps(lista.length ? `Agora escolha a rua (${lista.length} ruas encontradas em ${b.nome}).` : 'Não achamos as ruas desse bairro. Digite a rua e toque no mapa no local exato.')
    } catch { setRuas([]); setRuaManual(true); setGps('A lista de ruas não respondeu. Digite a rua e toque no mapa no local exato.') }
  }

  function mudarRua(valor) {
    const r = ruas?.find((x) => normalizar(x.nome) === normalizar(valor))
    if (!r) { setD((x) => ({ ...x, rua: valor })); setLinhas([]); return }
    const centro = bairroInfo ? [bairroInfo.lat, bairroInfo.lng] : r.linhas[0][0]
    const [lat, lng] = pontoDaRua(r, centro)
    setD((x) => ({ ...x, rua: r.nome, lat, lng }))
    setLinhas(r.linhas); setFoco([lat, lng])
    setGps('A rua está destacada no mapa. Toque no ponto exato do problema para ajustar o pino.')
  }

  async function ruaDigitada() {
    if (!d.rua.trim() || d.lat != null || linhas.length) return
    setGps('Procurando a rua perto do bairro…')
    try {
      const r = await localizarTexto(d.rua.trim(), bairroInfo)
      if (!r) { setGps('Não encontramos essa rua. Toque no mapa no local exato do problema.'); return }
      setD((x) => ({ ...x, lat: r.lat, lng: r.lng })); setFoco([r.lat, r.lng])
      setGps('Confira o ponto e toque no mapa para ajustar ao local exato.')
    } catch { setGps('A busca não respondeu. Toque no mapa no local exato do problema.') }
  }

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

  async function enviar() {
    setEnviando(true); setErro('')
    try {
      const r = await api.registrar(d, foto)
      guardarProtocolo({ protocolo: r.protocolo, categoria: d.categoria, bairro: d.bairro, rua: d.rua, criado_em: new Date().toISOString() })
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

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 sm:flex-row sm:items-center" role="note">
          <Icone.alerta className="hidden shrink-0 sm:block" />
          <p className="flex-1 text-sm leading-relaxed"><b>Risco de vida, pessoa ilhada ou casa invadida pela água?</b> Ligue agora. Este site não substitui o atendimento de emergência.</p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <a href={`tel:${TEL_DEFESA_CIVIL}`} className="btn flex-1 whitespace-nowrap bg-rose-700 px-3 py-2 text-[13px] sm:text-sm text-white hover:bg-rose-800"><Icone.telefone /> Defesa Civil {TEL_DEFESA_CIVIL}</a>
            <a href={`tel:${TEL_BOMBEIROS}`} className="btn flex-1 whitespace-nowrap border border-rose-300 bg-white px-3 py-2 text-[13px] sm:text-sm text-rose-800 hover:bg-rose-100"><Icone.telefone /> Bombeiros {TEL_BOMBEIROS}</a>
          </div>
        </div>

        {etapa === 0 && !perfil && (prov.google || prov.apple) && (
          <div className="card mt-6 grid gap-4 p-5 sm:grid-cols-[1fr_16rem] sm:items-center">
            <div>
              <div className="font-semibold text-deep">Quer ir mais rápido? (opcional)</div>
              <p className="mt-1 text-sm text-slate-500">Entre com a sua conta e seu nome e e-mail já vêm preenchidos. Você também passa a ver suas ocorrências em qualquer aparelho.</p>
            </div>
            <EntrarSocial volta="/registrar" />
          </div>
        )}
        {perfil && etapa === 0 && (
          <p className="mt-6 text-sm text-slate-500">Registrando como <b className="text-deep">{perfil.nome}</b>. Esta ocorrência vai aparecer em <Link to="/conta" className="font-semibold text-brand">Minha conta</Link>.</p>
        )}

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
                    <select id="bairro" className="input" value={bairroManual ? '__outro' : d.bairro}
                      onChange={(e) => { const v = e.target.value; if (v === '__outro') { setBairroManual(true); mudarBairro('') } else { setBairroManual(false); mudarBairro(v) } }}>
                      <option value="" disabled>Escolha o bairro</option>
                      {bairros.map((b) => <option key={b.nome} value={b.nome}>{b.nome}</option>)}
                      <option value="__outro">Meu bairro não está na lista</option>
                    </select>
                    {bairroManual && <input className="input mt-2" value={d.bairro} onChange={(e) => mudarBairro(e.target.value)} placeholder="Digite o nome do bairro" maxLength={80} autoFocus />}
                  </div>
                  <div>
                    <label className="label" htmlFor="rua">Rua ou avenida *</label>
                    {ruas?.length > 0 && (
                      <select id="rua" className="input" value={ruaManual ? '__outro' : d.rua}
                        onChange={(e) => { const v = e.target.value; if (v === '__outro') { setRuaManual(true); setLinhas([]); setD((x) => ({ ...x, rua: '', lat: null, lng: null })) } else { setRuaManual(false); mudarRua(v) } }}>
                        <option value="" disabled>Escolha a rua</option>
                        {ruas.map((r) => <option key={r.nome} value={r.nome}>{r.nome}</option>)}
                        <option value="__outro">Minha rua não está na lista</option>
                      </select>
                    )}
                    {(!ruas?.length || ruaManual) && (
                      <input id={ruas?.length ? undefined : 'rua'} className={`input ${ruas?.length ? 'mt-2' : ''}`} value={d.rua} onChange={(e) => setD((x) => ({ ...x, rua: e.target.value }))} onBlur={ruaDigitada}
                        placeholder={!d.bairro.trim() ? 'Escolha o bairro primeiro' : ruas === null && !bairroManual ? 'Carregando as ruas… (ou digite aqui)' : 'Digite o nome da rua'} maxLength={120} disabled={!d.bairro.trim()} />
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="ref">Ponto de referência</label>
                    <input id="ref" className="input" value={d.referencia} onChange={set('referencia')} placeholder="Ex.: em frente à escola do bairro" maxLength={160} />
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                  <span className="label !mb-0">Marque no mapa *</span>
                  <span className="flex flex-wrap gap-2">
                                        <button type="button" onClick={minhaLocalizacao} className="btn-ghost !py-1.5 text-xs"><Icone.pin /> Usar minha localização</button>
                  </span>
                </div>
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200">
                  <Mapa escolha={d.lat != null ? [d.lat, d.lng] : null} onPick={([lat, lng]) => setD({ ...d, lat, lng })} foco={foco} linhas={linhas} className="h-[320px]" />
                </div>
                <p className="mt-2 text-xs text-slate-500">{gps || (d.lat != null ? 'Ponto marcado. Toque em outro lugar do mapa para ajustar.' : 'Escolha o bairro: o mapa vai até ele e mostra a lista de ruas.')}</p>
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
                <p className="mt-1 text-sm text-slate-500">Opcional. {AVISOS_EMAIL_LIGADOS ? '' : 'A equipe pode usar estes dados para tirar dúvidas sobre o problema. '}Seus dados de contato nunca aparecem no mapa: só a equipe vê, e eles são apagados quando a ocorrência é encerrada.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div><label className="label" htmlFor="nome">Nome</label><input id="nome" className="input" value={d.contato_nome} onChange={set('contato_nome')} maxLength={100} autoComplete="name" /></div>
                  <div><label className="label" htmlFor="tel">Telefone</label><input id="tel" className="input" value={d.contato_telefone} onChange={set('contato_telefone')} maxLength={30} inputMode="tel" autoComplete="tel" /></div>
                  <div><label className="label" htmlFor="email">E-mail</label><input id="email" type="email" className="input" value={d.contato_email} onChange={set('contato_email')} maxLength={120} autoComplete="email" /></div>
                </div>
                {AVISOS_EMAIL_LIGADOS
                  ? <p className="mt-2 text-xs text-slate-500">Se informar o e-mail, você recebe o protocolo e um aviso a cada mudança na situação do seu pedido. Para parar de receber, é só responder ao e-mail.</p>
                  : <p className="mt-2 text-xs text-slate-500">O andamento do seu pedido fica sempre disponível pelo número de protocolo, que aparece na próxima tela e fica guardado neste aparelho.</p>}
                <div className="mt-6 rounded-2xl bg-mist p-4 text-sm">
                  <div className="font-semibold">Resumo</div>
                  <div className="mt-1 text-slate-600">{CATEGORIAS[d.categoria]?.nome} · {d.bairro} · {d.rua}{foto ? ' · com foto' : ''}</div>
                </div>
                <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed">
                  <input id="aceite" type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#0B4DA2]" />
                  <span>Li e concordo com a <Link to="/privacidade" target="_blank" className="font-semibold text-brand underline">Política de privacidade</Link>. Entendo que o local, a descrição e a foto da ocorrência poderão aparecer no mapa público, sem o meu nome.</span>
                </label>
              </div>
            )}
          </div>

          {erro && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{erro}</div>}

          <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[1001] -mx-5 mt-8 flex items-center justify-between border-t border-slate-100 bg-white/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-5 sm:backdrop-blur-none">
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
  const enviarParaMim = () => compartilhar({
    titulo: 'Imperatriz em Alerta',
    texto: `Registrei um problema no Imperatriz em Alerta. Protocolo: ${protocolo}. Acompanhe em:`,
    url: `${enderecoSite()}#/acompanhar/${protocolo}`,
  })
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
        <p className="mx-auto mt-3 max-w-sm text-xs text-slate-500">O número também fica guardado neste aparelho, na tela Protocolo.</p>
        <p className="mx-auto mt-5 max-w-sm text-sm text-slate-600">A equipe vai conferir as informações antes de publicar no mapa. Você acompanha cada etapa pelo protocolo.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to={`/acompanhar/${protocolo}`} className="btn-brand px-6 py-3">Acompanhar ocorrência</Link>
          <button onClick={enviarParaMim} className="btn-ghost px-6 py-3"><Icone.compartilhar /> Enviar no WhatsApp</button>
          <button onClick={novo} className="btn-ghost px-6 py-3">Registrar outra</button>
        </div>
      </div>
    </div>
  )
}
