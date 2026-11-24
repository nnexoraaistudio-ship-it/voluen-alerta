import { Link } from 'react-router-dom'
import { Icone } from '../components/ui'
import { VoluenMarca } from '../components/Marca'
import { CONTATO_EMAIL, CIDADE, TEL_DEFESA_CIVIL, TEL_BOMBEIROS } from '../config'

const MISSAO = 'Desenvolver tecnologia e inteligência que transformam problemas urbanos em informação útil e soluções reais, para cidadãos, governos e empresas.'

const PASSOS = [
  { t: 'O morador registra', d: 'Escolhe o tipo de problema, marca o local no mapa, pode anexar uma foto e recebe um número de protocolo. Não precisa de cadastro.', i: Icone.camera },
  { t: 'A equipe confere', d: 'Cada aviso passa por moderação antes de aparecer no mapa público, para evitar informações falsas, repetidas ou com dados pessoais.', i: Icone.escudo },
  { t: 'O poder público acompanha', d: 'Um painel reúne os avisos por bairro e por tipo, com mapa, andamento e relatórios. Assim fica mais fácil decidir onde agir primeiro.', i: Icone.lista },
]

const PROTECAO = [
  ['Anônimo se você quiser', 'Nome, telefone e e-mail são opcionais e nunca aparecem no mapa. Só a equipe autorizada vê, e eles são apagados quando o aviso é encerrado.'],
  ['Dados guardados no Brasil', 'As ocorrências, fotos e contatos ficam em servidores em São Paulo, com conexão segura e acesso da equipe protegido por login.'],
  ['Seguindo a LGPD', 'Usamos só o necessário para resolver o problema informado. Não vendemos dados, não usamos propaganda e não rastreamos quem visita o site.'],
  ['Moderação antes de publicar', 'Nenhum aviso vai para o mapa sem ser conferido. Fotos são reduzidas no aparelho, o que também remove a localização escondida no arquivo.'],
]

const Bloco = ({ eyebrow, titulo, children }) => (
  <section className="border-t border-slate-200 py-12 sm:py-14">
    <div className="eyebrow">{eyebrow}</div>
    <h2 className="mt-2 max-w-2xl text-2xl font-semibold sm:text-3xl">{titulo}</h2>
    <div className="mt-6">{children}</div>
  </section>
)

export default function Sobre() {
  return (
    <>
      <section className="bg-mist">
        <div className="wrap max-w-4xl py-12 sm:py-16">
          <div className="eyebrow">Sobre</div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">Um canal simples para avisar sobre alagamentos em {CIDADE}</h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-600">
            O Imperatriz em Alerta reúne, num só lugar, os avisos de moradores sobre ruas alagadas, bueiros entupidos e riachos transbordando. Cada aviso vira uma informação organizada, com local, foto e andamento, que ajuda a cidade a entender onde estão os problemas e a agir antes.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Este site está em fase de testes e ainda não é um canal oficial da Prefeitura de Imperatriz. Em emergência, ligue para a <b>Defesa Civil ({TEL_DEFESA_CIVIL})</b> ou o <b>Corpo de Bombeiros ({TEL_BOMBEIROS})</b>.
          </div>
        </div>
      </section>

      <div className="wrap max-w-4xl">
        <Bloco eyebrow="Como funciona" titulo="Do aviso do morador à informação para quem decide">
          <ol className="grid gap-4 md:grid-cols-3">
            {PASSOS.map((p, i) => (
              <li key={p.t} className="card relative p-6">
                <span className="absolute right-5 top-4 font-display text-4xl font-semibold text-slate-100" aria-hidden="true">{i + 1}</span>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white"><p.i /></span>
                <h3 className="mt-4 text-lg font-semibold">{p.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{p.d}</p>
              </li>
            ))}
          </ol>
        </Bloco>

        <Bloco eyebrow="Seus dados" titulo="Como protegemos as informações">
          <div className="grid gap-4 sm:grid-cols-2">
            {PROTECAO.map(([t, d]) => (
              <div key={t} className="flex gap-3 rounded-2xl border border-slate-200 p-5">
                <Icone.check className="mt-1 shrink-0 text-brand" />
                <div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-[15px] leading-relaxed text-slate-600">{d}</p></div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-500">Todos os detalhes estão na <Link to="/privacidade" className="font-semibold text-brand underline">Política de privacidade</Link>.</p>
        </Bloco>

        <Bloco eyebrow="Quem faz" titulo="Desenvolvido pela Voluen">
          <div className="card overflow-hidden">
            <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
              <VoluenMarca className="h-9 w-auto" />
              <p className="text-[15px] leading-relaxed text-slate-600">A Voluen desenvolve tecnologia e inteligência para cidades. O Imperatriz em Alerta é o seu primeiro produto.</p>
            </div>
            <div className="border-t border-slate-100 bg-mist px-6 py-5 sm:px-8">
              <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Nossa missão</div>
              <p className="mt-2 font-display text-lg font-medium leading-snug text-deep sm:text-xl">“{MISSAO}”</p>
            </div>
          </div>
        </Bloco>

        <Bloco eyebrow="Contato" titulo="Fale com a gente">
          <p className="max-w-2xl text-[15px] leading-relaxed text-slate-600">Dúvidas, sugestões, pedidos sobre os seus dados ou interesse em levar a plataforma para a sua instituição: escreva para o e-mail abaixo.</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a href={`mailto:${CONTATO_EMAIL}`} className="btn-brand px-5 py-3 text-sm">{CONTATO_EMAIL}</a>
            <Link to="/registrar" className="btn-ghost px-5 py-3 text-sm"><Icone.mais /> Registrar um problema</Link>
          </div>
        </Bloco>
      </div>
    </>
  )
}
