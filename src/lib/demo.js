// MODO DEMONSTRAÇÃO: tudo fica guardado no navegador (localStorage).
// Serve para apresentar e testar o site antes de ligar o banco de dados real.
import { CATEGORIAS } from './constants'

const CHAVE = 'voluen-alerta-demo-v1'
const BASE = {
  Centro: [-5.5265, -47.479], 'Beira Rio': [-5.523, -47.4865], Mercadinho: [-5.518, -47.476], Juçara: [-5.534, -47.474],
  Bacuri: [-5.5405, -47.478], 'Nova Imperatriz': [-5.515, -47.465], 'Santa Rita': [-5.505, -47.47], 'Vila Lobão': [-5.53, -47.458],
  'Parque Anhanguera': [-5.545, -47.465], 'Bom Sucesso': [-5.5, -47.45], 'Vila Redenção': [-5.555, -47.455],
  'São José do Egito': [-5.52, -47.445], 'Maranhão Novo': [-5.51, -47.455], 'Santa Inês': [-5.508, -47.48],
  'Vila Nova': [-5.548, -47.48], 'Parque Sanharol': [-5.54, -47.445], Cafeteira: [-5.556, -47.472], Entroncamento: [-5.5, -47.462],
}
const AMOSTRAS = [
  ['alagamento', 'Bacuri', 'Rua Ceará', 'Perto da ponte do Riacho Bacuri', 'Rua alagada na altura da ponte, água na altura do joelho depois da chuva.', 'resolvida', 21],
  ['canal', 'Bacuri', 'Rua Pernambuco', 'Margem do riacho', 'O Riacho Bacuri saiu do leito na madrugada e chegou na porta das casas.', 'em_analise', 3],
  ['bueiro', 'Centro', 'Rua Godofredo Viana', 'Em frente à farmácia', 'Bueiro entupido, água empoçada há dois dias.', 'resolvida', 18],
  ['alagamento', 'Centro', 'Av. Getúlio Vargas', 'Esquina com a Rua Simplício Moreira', 'A esquina alaga toda vez que chove forte.', 'encaminhada', 6],
  ['lixo', 'Parque Anhanguera', 'Rua do Canal', 'Atrás da escola', 'Muito lixo e entulho dentro do canal, a água não passa.', 'recebida', 2],
  ['alagamento', 'Parque Anhanguera', 'Rua São Francisco', 'Rua de baixo', 'Casas com água dentro depois da chuva.', 'em_analise', 9],
  ['canal', 'Parque Anhanguera', 'Rua Rio Grande', 'Perto da escola municipal', 'Canal transbordando, crianças não conseguem passar.', 'resolvida', 16],
  ['bueiro', 'Juçara', 'Rua Paraíba', 'Esquina da praça', 'Boca de bueiro sem grade e entupida, risco de queda.', 'recebida', 4],
  ['escoamento', 'Juçara', 'Rua Amazonas', '', 'Rua sem nenhuma saída de água, vira lagoa.', 'em_analise', 11],
  ['alagamento', 'Vila Lobão', 'Rua Principal', 'Ponto de ônibus', 'Alagamento na rua principal, ônibus não passa.', 'resolvida', 20],
  ['bueiro', 'Vila Lobão', 'Rua Duque de Caxias', '', 'Tampa da boca de lobo quebrada.', 'moderacao', 0],
  ['canal', 'Santa Rita', 'Rua Benedito Leite', 'Riacho Cacau', 'Riacho muito cheio, encostando nas casas.', 'em_analise', 7],
  ['alagamento', 'Santa Rita', 'Rua Coronel Manoel Bandeira', 'Posto de saúde', 'Rua alagada na frente do posto de saúde.', 'resolvida', 14],
  ['bueiro', 'Mercadinho', 'Rua 15 de Novembro', 'Perto do mercado', 'Bueiro entupido perto do mercado, cheiro forte.', 'resolvida', 19],
  ['escoamento', 'Mercadinho', 'Travessa do Mercado', '', 'Água parada desde a última chuva.', 'recebida', 2],
  ['alagamento', 'Nova Imperatriz', 'Rua Barão do Rio Branco', 'Cruzamento', 'Cruzamento alagado, carros parados.', 'em_analise', 6],
  ['lixo', 'Nova Imperatriz', 'Rua Manaus', 'Canal do riacho', 'Sacos de lixo dentro do canal.', 'resolvida', 17],
  ['canal', 'Vila Redenção', 'Rua Santa Luzia', '', 'Riacho transbordou e levou parte da calçada.', 'encaminhada', 3],
  ['alagamento', 'Vila Redenção', 'Rua São Pedro', 'Rua inteira', 'Rua inteira debaixo d\'água.', 'moderacao', 0],
  ['bueiro', 'São José do Egito', 'Rua da Feira', '', 'Bueiro entupido com folhas e areia.', 'resolvida', 13],
  ['alagamento', 'Vila Nova', 'Rua Tocantins', 'Perto do Riacho Capivara', 'Alagamento sempre que chove.', 'em_analise', 8],
  ['canal', 'Cafeteira', 'Rua Projetada 3', '', 'Riacho Capivara transbordando.', 'recebida', 1],
  ['escoamento', 'Parque Sanharol', 'Rua 10', 'Rua de terra', 'Rua sem escoamento, carro atola.', 'recebida', 5],
  ['alagamento', 'Bom Sucesso', 'Av. Pedro Neiva de Santana', '', 'Alagamento na avenida depois da chuva.', 'resolvida', 12],
  ['bueiro', 'Santa Inês', 'Rua Rui Barbosa', 'Esquina da praça', 'Bueiro entupido na esquina.', 'resolvida', 15],
  ['lixo', 'Bacuri', 'Rua Maranhão', 'Margem do riacho', 'Entulho de obra jogado na margem do riacho.', 'moderacao', 0],
]

function semente() {
  const agora = Date.now()
  let n = 1180
  const ocorrencias = []
  const historico = []
  AMOSTRAS.forEach(([categoria, bairro, rua, referencia, descricao, status, diasAtras], i) => {
    const [lat, lng] = BASE[bairro]
    const criado = new Date(agora - diasAtras * 86400000 - (i % 5) * 3600000).toISOString()
    const id = 'demo-' + i
    const o = {
      id, protocolo: `VA-2026-${String(n++).padStart(5, '0')}`, categoria, bairro, rua, referencia, descricao,
      lat: lat + ((i * 37) % 11 - 5) / 2000, lng: lng + ((i * 53) % 11 - 5) / 2000,
      foto_url: null, contato_nome: i % 4 === 0 ? 'Morador de exemplo' : '', contato_telefone: i % 4 === 0 ? '(99) 9 0000-0000' : '', contato_email: '',
      status, motivo_recusa: null, consentimento_em: criado, created_at: criado,
      resolvida_em: status === 'resolvida' ? new Date(new Date(criado).getTime() + (2 + (i % 4)) * 86400000).toISOString() : null,
    }
    ocorrencias.push(o)
    historico.push({ id: id + '-h0', ocorrencia_id: id, status: 'moderacao', mensagem: null, created_at: criado })
    if (status !== 'moderacao') historico.push({ id: id + '-h1', ocorrencia_id: id, status: 'recebida', mensagem: null, created_at: new Date(new Date(criado).getTime() + 3 * 3600000).toISOString() })
    if (['em_analise', 'encaminhada', 'resolvida'].includes(status)) historico.push({ id: id + '-h2', ocorrencia_id: id, status: 'em_analise', mensagem: 'Equipe da Defesa Civil fará vistoria no local.', created_at: new Date(new Date(criado).getTime() + 86400000).toISOString() })
    if (['encaminhada', 'resolvida'].includes(status)) historico.push({ id: id + '-h3', ocorrencia_id: id, status: 'encaminhada', mensagem: 'Caso enviado à Secretaria de Obras.', created_at: new Date(new Date(criado).getTime() + 1.5 * 86400000).toISOString() })
    if (status === 'resolvida') historico.push({ id: id + '-h4', ocorrencia_id: id, status: 'resolvida', mensagem: 'Limpeza concluída. Obrigado pelo aviso.', created_at: o.resolvida_em })
  })
  return { seq: n, ocorrencias, historico, equipe: EQUIPE_DEMO }
}

const EQUIPE_DEMO = [
  { id: 'u-admin', nome: 'Admin Voluen', email: 'admin@demo.voluen', papel: 'admin' },
  { id: 'u-mod', nome: 'Moderadora (exemplo)', email: 'moderacao@demo.voluen', papel: 'moderador' },
  { id: 'u-pref', nome: 'Defesa Civil (exemplo)', email: 'defesacivil@demo.voluen', papel: 'prefeitura' },
]

function ler() {
  try { const s = JSON.parse(localStorage.getItem(CHAVE)); if (s && s.ocorrencias) return s } catch { /* sem armazenamento */ }
  const s = semente(); salvar(s); return s
}
function salvar(s) { try { localStorage.setItem(CHAVE, JSON.stringify(s)) } catch { /* cheio ou bloqueado */ } }
const publico = ({ contato_nome, contato_telefone, contato_email, ...resto }) => resto
const espera = (ms = 250) => new Promise((r) => setTimeout(r, ms))
let sessao = null
try { sessao = JSON.parse(sessionStorage.getItem(CHAVE + '-sessao')) } catch { /* nada */ }
const ouvintes = new Set()

export const demoApi = {
  modo: 'demo',
  async registrar(d, foto) {
    await espera(500)
    const s = ler()
    const id = 'demo-' + Date.now()
    const agora = new Date().toISOString()
    const protocolo = `VA-2026-${String(s.seq++).padStart(5, '0')}`
    s.ocorrencias.unshift({ id, protocolo, ...d, foto_url: foto ? foto.previa : null, status: 'moderacao', motivo_recusa: null, consentimento_em: agora, created_at: agora, resolvida_em: null })
    s.historico.push({ id: id + '-h0', ocorrencia_id: id, status: 'moderacao', mensagem: null, created_at: agora })
    salvar(s)
    return { protocolo }
  },
  async listarPublicas() {
    await espera()
    return ler().ocorrencias.filter((o) => ['recebida', 'em_analise', 'encaminhada', 'resolvida'].includes(o.status)).map(publico)
  },
  async consultarProtocolo(p) {
    await espera()
    const s = ler()
    const o = s.ocorrencias.find((x) => x.protocolo.toUpperCase() === p.trim().toUpperCase())
    if (!o) return null
    return { ...publico(o), historico: s.historico.filter((h) => h.ocorrencia_id === o.id).sort((a, b) => a.created_at.localeCompare(b.created_at)) }
  },
  // ----- equipe -----
  sessao: () => sessao,
  sessaoCarregada: () => true,
  aoMudarSessao(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn) },
  async entrar(email) {
    await espera()
    const u = ler().equipe.find((x) => x.email === email)
    if (!u) throw new Error('Usuário não encontrado.')
    sessao = u
    try { sessionStorage.setItem(CHAVE + '-sessao', JSON.stringify(u)) } catch { /* nada */ }
    ouvintes.forEach((f) => f(sessao))
    return u
  },
  async sair() { sessao = null; try { sessionStorage.removeItem(CHAVE + '-sessao') } catch { /* nada */ } ouvintes.forEach((f) => f(null)) },
  async listarTodas() {
    await espera()
    return ler().ocorrencias.map(({ contato_nome, contato_telefone, contato_email, ...o }) => ({ ...o, tem_contato: !!(contato_nome || contato_telefone || contato_email) }))
  },
  async verContato(id) {
    if (sessao?.papel !== 'admin') throw new Error('Somente administradores veem os dados de contato.')
    const o = ler().ocorrencias.find((x) => x.id === id)
    return { nome: o.contato_nome || null, telefone: o.contato_telefone || null, email: o.contato_email || null }
  },
  async historico(id) { return ler().historico.filter((h) => h.ocorrencia_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at)) },
  async mudarStatus(id, status, mensagem, motivo) {
    await espera()
    const s = ler()
    const o = s.ocorrencias.find((x) => x.id === id)
    o.status = status
    if (status === 'recusada') o.motivo_recusa = motivo
    if (status === 'resolvida') o.resolvida_em = new Date().toISOString()
    if (status === 'resolvida' || status === 'recusada') Object.assign(o, { contato_nome: '', contato_telefone: '', contato_email: '' })
    s.historico.push({ id: id + '-' + Date.now(), ocorrencia_id: id, status, mensagem: mensagem || (status === 'recusada' ? motivo : null), created_at: new Date().toISOString() })
    salvar(s)
  },
  async removerFoto(id) { const s = ler(); s.ocorrencias.find((x) => x.id === id).foto_url = null; salvar(s) },
  async apagarContato(id) { const s = ler(); Object.assign(s.ocorrencias.find((x) => x.id === id), { contato_nome: '', contato_telefone: '', contato_email: '' }); salvar(s) },
  async listarEquipe() { return ler().equipe },
  async mudarPapel(uid, papel) { const s = ler(); s.equipe.find((u) => u.id === uid).papel = papel; salvar(s) },
  reiniciarDemo() { salvar(semente()) },
  equipeDemo: EQUIPE_DEMO,
  categoriasValidas: Object.keys(CATEGORIAS),
}
