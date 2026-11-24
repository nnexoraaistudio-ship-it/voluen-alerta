import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useCarregar } from '../lib/hooks'
import { CATEGORIAS } from '../lib/constants'
import Mapa from '../components/Mapa'
import { Icone, CatDot } from '../components/ui'
import IlustracaoAlagamento from '../components/IlustracaoAlagamento'
import { FOTOS } from '../lib/fotos'
import { compartilhar, enderecoSite } from '../lib/compartilhar'

const chamarVizinhos = () => compartilhar({
  titulo: 'Imperatriz em Alerta',
  texto: 'Viu alagamento, bueiro entupido ou riacho transbordando em Imperatriz? Avise por aqui, leva menos de 2 minutos:',
  url: enderecoSite(),
})

const PASSOS = [
  { t: 'Registre o problema', d: 'Escolha o tipo, marque o local no mapa, anexe uma foto e conte o que está acontecendo.', i: Icone.camera },
  { t: 'Receba um protocolo', d: 'Ao enviar, você recebe um número único. Guarde para consultar quando quiser, sem cadastro.', i: Icone.doc },
  { t: 'Acompanhe a solução', d: 'Veja cada etapa: conferência, análise, encaminhamento e solução, com recados da equipe.', i: Icone.lista },
]

export default function Inicio() {
  const { dados } = useCarregar(() => api.listarPublicas(), [])
  const lista = dados || []
  const andamento = lista.filter((o) => o.status !== 'resolvida').length
  const resolvidas = lista.filter((o) => o.status === 'resolvida').length

  return (
    <>
      <section className="relative overflow-hidden bg-destaque text-white">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 80% at 10% 15%, rgba(7,43,90,.45), transparent 65%), repeating-radial-gradient(circle at 85% 85%, rgba(255,255,255,.07) 0 2px, transparent 2px 46px)' }} />
        <div className="wrap relative grid items-center gap-10 py-14 md:grid-cols-[1.05fr_1fr] md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.14em] text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> Alagamentos e drenagem · Imperatriz-MA
            </span>
            <h1 className="mt-5 text-[40px] font-semibold leading-[1.05] sm:text-6xl">Viu um alagamento?<br /><span className="underline decoration-white/60 decoration-4 underline-offset-8">Avise a cidade.</span></h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/85">Registre bueiros entupidos, ruas alagadas e riachos transbordando no seu bairro. Cada aviso ganha um protocolo e aparece no mapa, mostrando onde a ajuda é mais urgente.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/registrar" className="btn bg-white px-6 py-3 text-[15px] text-brand hover:bg-brand-50">Registrar um problema <Icone.seta /></Link>
              <Link to="/mapa" className="btn-ghost-dark px-6 py-3 text-[15px]"><Icone.pin /> Ver o mapa</Link>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/80">
              <li className="flex items-center gap-1.5"><Icone.escudo className="text-white" /> Pode ser anônimo</li>
              <li className="flex items-center gap-1.5"><Icone.relogio className="text-white" /> Leva menos de 2 minutos</li>
              <li className="flex items-center gap-1.5"><Icone.doc width="16" height="16" className="text-white" /> Acompanhamento por protocolo</li>
            </ul>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl ring-1 ring-white/5">
              <Mapa pontos={lista} className="h-[300px] sm:h-[380px]" zoom={13} />
            </div>
            <div className="absolute -bottom-5 left-4 right-4 z-[500] rounded-2xl bg-white p-4 text-deep shadow-xl sm:left-6 sm:right-auto sm:max-w-xs">
              <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-brand">Mapa colaborativo</div>
              <p className="mt-1 text-sm font-medium leading-snug">Cada ponto é um aviso conferido pela equipe, registrado por um morador de Imperatriz.</p>
            </div>
          </div>
        </div>
        <svg className="relative block w-full text-mist" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48h1440V18c-240 22-480 30-720 18S240 6 0 22z" fill="currentColor" /></svg>
      </section>

      <section className="bg-mist">
        <div className="wrap grid gap-4 pb-14 pt-10 sm:grid-cols-3">
          {[
            ['Avisos no mapa', lista.length, 'conferidos e publicados', 'bg-white'],
            ['Em andamento', andamento, 'recebidos, em análise ou encaminhados', 'bg-amber-50/70'],
            ['Resolvidos', resolvidas, 'problemas já solucionados', 'bg-emerald-50/70'],
          ].map(([t, n, d, bg]) => (
            <div key={t} className={`card ${bg} p-6`}>
              <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{t}</div>
              <div className="num mt-1 font-display text-4xl font-semibold">{dados ? n : '–'}</div>
              <div className="text-sm text-slate-500">{d}</div>
            </div>
          ))}
        </div>

        <div className="wrap pb-16">
          <div className="eyebrow">Como funciona</div>
          <h2 className="mt-2 max-w-xl text-3xl font-semibold sm:text-4xl">Três passos para mudar a realidade do seu bairro</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PASSOS.map((p, i) => (
              <div key={p.t} className="card relative p-6">
                <span className="absolute right-5 top-4 font-display text-5xl font-semibold text-slate-100">{i + 1}</span>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white"><p.i /></span>
                <h3 className="mt-5 text-lg font-semibold">{p.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap grid gap-10 py-16 md:grid-cols-2 md:items-start">
        <div>
          <div className="eyebrow">O que você pode avisar</div>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Problemas com a água da chuva</h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-600">Imperatriz é cortada por riachos como o Bacuri, o Cacau, o Santa Teresa e o Capivara. Quando bueiros e canais entopem, a água da chuva invade ruas e casas. Seu aviso ajuda a equipe a chegar antes.</p>
          <p className="mt-4 max-w-md text-sm text-slate-500">Esgoto e abastecimento de água não fazem parte deste canal por enquanto.</p>
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200/80 shadow-soft">
            <IlustracaoAlagamento className="block h-auto w-full" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(CATEGORIAS).map(([k, c]) => (
            <div key={k} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
              <CatDot categoria={k} size={12} />
              <div className="-mt-1"><div className="font-semibold">{c.nome}</div><div className="text-sm text-slate-500">{c.desc}</div></div>
            </div>
          ))}
        </div>
      </section>

      {FOTOS.length > 0 && (
        <section className="bg-mist py-16">
          <div className="wrap">
            <div className="eyebrow">Imperatriz na época das chuvas</div>
            <h2 className="mt-2 max-w-xl text-3xl font-semibold sm:text-4xl">O que os moradores veem todo ano</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FOTOS.map((f) => (
                <figure key={f.arquivo} className="card overflow-hidden">
                  <img src={`${import.meta.env.BASE_URL}fotos/${f.arquivo}`} alt={f.legenda} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <figcaption className="p-4 text-sm"><span className="font-medium text-deep">{f.legenda}</span>{f.credito && <span className="mt-0.5 block text-xs text-slate-500">{f.credito}</span>}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="wrap pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-10 text-white sm:px-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">Viu um problema no seu bairro?</h2>
              <p className="mt-2 max-w-lg text-slate-200">Não deixe para depois. Um aviso pode colocar a sua rua na lista de prioridades da cidade.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/registrar" className="btn bg-white px-6 py-3 text-deep hover:bg-slate-100">Registrar um problema <Icone.seta /></Link>
              <Link to="/acompanhar" className="btn-ghost-dark px-6 py-3"><Icone.busca /> Consultar protocolo</Link>
              <button type="button" onClick={chamarVizinhos} className="btn-ghost-dark px-6 py-3"><Icone.compartilhar /> Compartilhar no WhatsApp</button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
