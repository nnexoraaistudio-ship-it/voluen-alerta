import { CONTATO_EMAIL, RESPONSAVEL } from '../config'

const ATUALIZADA = '23 de novembro de 2026'
const S = ({ n, t, children }) => (
  <section className="border-t border-slate-200 pt-6">
    <h2 className="text-xl font-semibold">{n}. {t}</h2>
    <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
  </section>
)

export default function Privacidade() {
  return (
    <div className="wrap max-w-3xl py-12 sm:py-16">
      <div className="eyebrow">Transparência</div>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Política de privacidade do Imperatriz em Alerta</h1>
      <p className="mt-2 text-sm text-slate-500">Última atualização: {ATUALIZADA}</p>
      <div className="mt-8 space-y-8">
        <S n="1" t="Quem somos">
          <p>O Imperatriz em Alerta é um canal para moradores de Imperatriz-MA avisarem sobre alagamentos, bueiros entupidos e outros problemas de drenagem. O serviço é desenvolvido pela Voluen, empresa em constituição, tendo como responsável {RESPONSAVEL}. Durante o piloto em parceria com a Prefeitura de Imperatriz, as informações são usadas pela Prefeitura para planejar e executar serviços de drenagem. A Voluen opera a plataforma seguindo as orientações da Prefeitura.</p>
        </S>
        <S n="2" t="Quais dados coletamos">
          <ul>
            <li><b>Sobre a ocorrência:</b> tipo do problema, bairro, rua, ponto de referência, local marcado no mapa, descrição, foto (se você enviar), data e hora do registro.</li>
            <li><b>Sobre você, só se quiser informar:</b> nome, telefone ou e-mail. O registro anônimo é sempre possível.</li>
            <li><b>Registro do seu consentimento:</b> a data e a hora em que você aceitou esta política.</li>
            <li><b>Proteção contra abuso:</b> para impedir envios em massa, guardamos por no máximo 1 dia um código embaralhado gerado a partir da conexão de quem registra. Esse código não permite identificar você e é apagado automaticamente.</li>
          </ul>
          <p>Não usamos ferramentas de estatística, propaganda ou rastreamento. A foto é reduzida no seu aparelho antes do envio, o que também remove informações escondidas no arquivo, como a localização GPS da câmera.</p>
        </S>
        <S n="3" t="Para que usamos os dados">
          <ul>
            <li>Localizar e resolver o problema informado.</li>
            <li>Mostrar o andamento da ocorrência pelo número de protocolo.</li>
            <li>Montar o mapa público e os relatórios que ajudam a Prefeitura a decidir onde agir primeiro.</li>
            <li>Enviar o protocolo e avisos sobre a sua ocorrência, e entrar em contato com você, somente se você informou um contato.</li>
          </ul>
          <p>Não vendemos seus dados e não os usamos para propaganda.</p>
        </S>
        <S n="4" t="Base legal">
          <p>Usamos os dados com base no seu consentimento, dado ao marcar a caixa antes de enviar a ocorrência, e na execução de políticas públicas pela Prefeitura, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
        </S>
        <S n="5" t="O que fica público">
          <p>No mapa e na consulta de protocolo aparecem apenas o tipo, o bairro, a rua, o local aproximado, a descrição, a foto e a situação da ocorrência. Seu nome, telefone e e-mail nunca são publicados. Toda ocorrência passa por moderação antes de aparecer no mapa. Fotos que mostrem o rosto de pessoas ou placas de veículos podem ser removidas. Por isso, evite esse tipo de foto e não escreva dados pessoais na descrição.</p>
        </S>
        <S n="6" t="Onde os dados ficam e com quem compartilhamos">
          <ul>
            <li>As ocorrências, fotos e contatos ficam guardados no Supabase, em servidores localizados em São Paulo, no Brasil.</li>
            <li>As páginas do site são entregues pelo GitHub Pages e o mapa e a lista de bairros e ruas usam serviços públicos do OpenStreetMap. Esses serviços recebem dados técnicos da conexão (como o endereço IP), mas não recebem os dados das ocorrências.</li>
            <li>Se você informar um e-mail, ele é usado só para enviar o protocolo e os avisos sobre a sua ocorrência. O envio é feito pela Brevo, empresa de envio de e-mails que pode guardar os dados em servidores fora do Brasil, com medidas de segurança adequadas.</li>
            <li>Compartilhamos as ocorrências com a Prefeitura de Imperatriz e seus setores responsáveis (como Defesa Civil e Secretaria de Obras), para atender ao pedido.</li>
            <li>Com autoridades, quando a lei exigir.</li>
          </ul>
        </S>
        <S n="7" t="Por quanto tempo guardamos">
          <p>Os dados das ocorrências ficam guardados durante o piloto e por até 2 anos depois, para fins de relatório e planejamento. Os dados de contato são apagados assim que a ocorrência é resolvida ou recusada, ou antes, se você pedir. Depois disso, mantemos apenas números gerais, sem identificar ninguém.</p>
        </S>
        <S n="8" t="Seus direitos">
          <p>Você pode pedir, a qualquer momento: confirmação de que temos dados seus, acesso a eles, correção, exclusão, informação sobre com quem foram compartilhados e a retirada do seu consentimento. Para isso, escreva para <span className="select-all font-semibold text-brand">{CONTATO_EMAIL}</span> informando o número do protocolo, se tiver. Responderemos em até 15 dias. Você também pode reclamar na Autoridade Nacional de Proteção de Dados (ANPD).</p>
        </S>
        <S n="9" t="Segurança">
          <p>O painel de gestão só pode ser acessado por pessoas autorizadas, com login e senha, e a sessão é encerrada sozinha após 30 minutos sem uso. Usamos conexão segura (https). Cada pessoa da equipe vê só o que precisa para a sua função: nome, telefone e e-mail do morador ficam visíveis apenas para administradores e são apagados automaticamente quando a ocorrência é resolvida ou recusada. O número de protocolo tem um final aleatório, para que ninguém consiga adivinhar o protocolo de outra pessoa.</p>
        </S>
        <S n="10" t="Cookies e armazenamento no navegador">
          <p>O site não usa cookies de propaganda nem de rastreamento. Guardamos no seu navegador apenas o necessário para o funcionamento, como a confirmação de que você viu o aviso de privacidade, os números de protocolo que você registrou neste aparelho (para você não perdê-los) e, para a equipe, a sessão de login. Esses dados ficam só no seu aparelho e somem se você limpar os dados do navegador.</p>
        </S>
        <S n="11" t="Crianças e adolescentes">
          <p>O serviço é voltado a maiores de 18 anos. Menores de idade devem fazer o registro com a ajuda de um responsável.</p>
        </S>
        <S n="12" t="Mudanças e contato">
          <p>Podemos atualizar esta política, e a data da última atualização fica sempre no topo desta página. Dúvidas sobre privacidade: <span className="select-all font-semibold text-brand">{CONTATO_EMAIL}</span>.</p>
          <p>Encarregado pelo tratamento de dados pessoais (LGPD, art. 41): {RESPONSAVEL}, pelo mesmo e-mail.</p>
        </S>
      </div>
    </div>
  )
}
