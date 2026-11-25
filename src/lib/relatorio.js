// Cálculos do relatório (mensal, trimestral, semestral ou anual).
// Tudo aqui trabalha só com dados agregados: nada de nome, telefone, e-mail,
// descrição escrita pelo morador ou protocolo (LGPD).
import { CATEGORIAS, MOTIVOS_RECUSA } from './constants'

export const TIPOS = {
  mes: { nome: 'Mensal', meses: 1, palavra: 'mensal', anteriorNome: 'mês anterior' },
  trimestre: { nome: 'Trimestral', meses: 3, palavra: 'trimestral', anteriorNome: 'trimestre anterior' },
  semestre: { nome: 'Semestral', meses: 6, palavra: 'semestral', anteriorNome: 'semestre anterior' },
  ano: { nome: 'Anual', meses: 12, palavra: 'anual', anteriorNome: 'ano anterior' },
}
const QUANTOS = { mes: 12, trimestre: 8, semestre: 6, ano: 4 }
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Um período começa no 1º dia do mês "inicio" e termina (sem incluir) em "fim".
export function periodo(tipo, ano, indice) {
  const n = TIPOS[tipo].meses
  const inicio = new Date(ano, indice * n, 1)
  const fim = new Date(ano, indice * n + n, 1)
  const m0 = inicio.getMonth(); const m1 = (m0 + n - 1) % 12
  let rotulo
  if (tipo === 'mes') rotulo = `${MESES[m0]} de ${ano}`
  else if (tipo === 'trimestre') rotulo = `${indice + 1}º trimestre de ${ano}`
  else if (tipo === 'semestre') rotulo = `${indice + 1}º semestre de ${ano}`
  else rotulo = `${ano}`
  const detalhe = tipo === 'mes' || tipo === 'ano' ? '' : `${MES_CURTO[m0]} a ${MES_CURTO[m1]}`
  return { tipo, ano, indice, inicio, fim, rotulo, detalhe, chave: `${tipo}-${ano}-${indice}` }
}

export function anterior(p) {
  const porAno = 12 / TIPOS[p.tipo].meses
  return p.indice > 0 ? periodo(p.tipo, p.ano, p.indice - 1) : periodo(p.tipo, p.ano - 1, porAno - 1)
}

// Os últimos períodos de um tipo, do atual (ainda em andamento) para trás.
export function opcoesDePeriodo(tipo, hoje = new Date()) {
  const n = TIPOS[tipo].meses
  let p = periodo(tipo, hoje.getFullYear(), Math.floor(hoje.getMonth() / n))
  const r = []
  for (let i = 0; i < QUANTOS[tipo]; i++) { r.push(p); p = anterior(p) }
  return r
}

const dentro = (iso, p) => { const d = new Date(iso); return d >= p.inicio && d < p.fim }
const media = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null)
const HORA = 3600000
const ATENDIMENTO = ['em_analise', 'encaminhada', 'resolvida']
const normalizar = (t) => (t || '').trim().replace(/\s+/g, ' ')

// Divide o período em barras: semanas (mensal) ou meses (demais).
function fatias(p) {
  if (p.tipo === 'mes') {
    const ultimo = new Date(p.fim - 1).getDate()
    return [[1, 7], [8, 14], [15, 21], [22, 28], [29, ultimo]].filter(([a]) => a <= ultimo)
      .map(([a, b]) => ({ rotulo: a === b ? `${a}` : `${a} a ${b}`, ini: new Date(p.ano, p.inicio.getMonth(), a), fim: new Date(p.ano, p.inicio.getMonth(), b + 1) }))
  }
  return Array.from({ length: TIPOS[p.tipo].meses }, (_, i) => {
    const ini = new Date(p.inicio.getFullYear(), p.inicio.getMonth() + i, 1)
    return { rotulo: MES_CURTO[ini.getMonth()], ini, fim: new Date(ini.getFullYear(), ini.getMonth() + 1, 1) }
  })
}

// lista: ocorrências (como o painel recebe). historico: [{ ocorrencia_id, status, created_at }].
export function calcular(lista, historico, p, hoje = new Date()) {
  const doPeriodo = lista.filter((o) => dentro(o.created_at, p))
  const porStatus = { moderacao: 0, recebida: 0, em_analise: 0, encaminhada: 0, resolvida: 0, recusada: 0 }
  doPeriodo.forEach((o) => { porStatus[o.status] = (porStatus[o.status] || 0) + 1 })
  const validas = doPeriodo.filter((o) => !['recusada', 'moderacao'].includes(o.status))
  const resolvidas = validas.filter((o) => o.status === 'resolvida')

  // Primeira vez que cada ocorrência entrou em atendimento (em análise, encaminhada ou resolvida).
  const primeiro = {}
  historico.forEach((h) => {
    if (!ATENDIMENTO.includes(h.status)) return
    if (!primeiro[h.ocorrencia_id] || h.created_at < primeiro[h.ocorrencia_id]) primeiro[h.ocorrencia_id] = h.created_at
  })
  const tAtend = validas.filter((o) => primeiro[o.id]).map((o) => (new Date(primeiro[o.id]) - new Date(o.created_at)) / HORA).filter((h) => h >= 0)
  const tSol = resolvidas.filter((o) => o.resolvida_em).map((o) => (new Date(o.resolvida_em) - new Date(o.created_at)) / HORA).filter((h) => h >= 0)

  const bairrosM = {}; const ruasM = {}; const tiposM = {}
  validas.forEach((o) => {
    const b = normalizar(o.bairro) || 'Não informado'
    bairrosM[b] = bairrosM[b] || { nome: b, total: 0, resolvidas: 0, alagamentos: 0 }
    bairrosM[b].total++
    if (o.status === 'resolvida') bairrosM[b].resolvidas++
    if (o.categoria === 'alagamento') bairrosM[b].alagamentos++
    const r = normalizar(o.rua)
    if (r) {
      const k = `${r.toLowerCase()}|${b.toLowerCase()}`
      ruasM[k] = ruasM[k] || { rua: r, bairro: b, total: 0, resolvidas: 0, alagamentos: 0 }
      ruasM[k].total++
      if (o.status === 'resolvida') ruasM[k].resolvidas++
      if (o.categoria === 'alagamento') ruasM[k].alagamentos++
    }
    tiposM[o.categoria] = (tiposM[o.categoria] || 0) + 1
  })
  const ordenar = (a, b) => b.total - a.total || b.alagamentos - a.alagamentos || a.nome?.localeCompare?.(b.nome)
  const motivosM = {}
  doPeriodo.filter((o) => o.status === 'recusada').forEach((o) => {
    // Só os motivos padrão aparecem; texto livre vira "Outro motivo" (pode ter dado pessoal).
    const m = MOTIVOS_RECUSA.find((x) => x === o.motivo_recusa) ? o.motivo_recusa.split(':')[0].replace(/\.$/, '') : 'Outro motivo'
    motivosM[m] = (motivosM[m] || 0) + 1
  })
  const emAbertoHa7 = lista.filter((o) => ['recebida', 'em_analise', 'encaminhada'].includes(o.status) && (hoje - new Date(o.created_at)) > 7 * 24 * HORA).length

  return {
    periodo: p,
    emAndamento: p.fim > hoje,
    total: doPeriodo.length,
    porStatus,
    validas: validas.length,
    resolvidas: resolvidas.length,
    emAberto: validas.length - resolvidas.length,
    recusadas: porStatus.recusada,
    moderacao: porStatus.moderacao,
    taxaResolucao: validas.length ? resolvidas.length / validas.length : null,
    horasAtendimento: media(tAtend),
    horasSolucao: media(tSol),
    amostraAtendimento: tAtend.length,
    amostraSolucao: tSol.length,
    bairros: Object.values(bairrosM).sort(ordenar),
    ruas: Object.values(ruasM).sort((a, b) => b.total - a.total || b.alagamentos - a.alagamentos || a.rua.localeCompare(b.rua)),
    tipos: Object.entries(tiposM).map(([k, total]) => ({ chave: k, nome: CATEGORIAS[k]?.nome || k, cor: CATEGORIAS[k]?.cor || '#475569', total })).sort((a, b) => b.total - a.total),
    motivosRecusa: Object.entries(motivosM).map(([motivo, total]) => ({ motivo, total })).sort((a, b) => b.total - a.total),
    serie: fatias(p).map((f) => ({ rotulo: f.rotulo, total: validas.filter((o) => { const d = new Date(o.created_at); return d >= f.ini && d < f.fim }).length })),
    pontos: validas.filter((o) => o.lat != null && o.lng != null).map((o) => ({ lat: o.lat, lng: o.lng, bairro: normalizar(o.bairro) })),
    emAbertoHa7,
  }
}

// ---------- textos ----------
export const numero = (n) => (n == null ? '–' : n.toLocaleString('pt-BR'))
export const porcento = (f) => (f == null ? '–' : `${Math.round(f * 100)}%`)
export function duracao(horas) {
  if (horas == null) return '–'
  if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`
  if (horas < 48) return `${(Math.round(horas * 10) / 10).toLocaleString('pt-BR')} h`
  return `${(Math.round((horas / 24) * 10) / 10).toLocaleString('pt-BR')} dias`
}

// Variação entre dois valores: { texto, sentido: 'sobe'|'desce'|'igual'|null }
export function variacao(atual, antes) {
  if (atual == null || antes == null) return { texto: 'sem base de comparação', sentido: null }
  if (antes === 0 && atual === 0) return { texto: 'igual', sentido: 'igual' }
  if (antes === 0) return { texto: 'novo', sentido: 'sobe' }
  const v = (atual - antes) / antes
  if (Math.abs(v) < 0.005) return { texto: 'igual', sentido: 'igual' }
  return { texto: `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}%`, sentido: v > 0 ? 'sobe' : 'desce' }
}

// Para taxas (porcentagens): diferença em pontos percentuais.
export function variacaoPontos(atual, antes) {
  if (atual == null || antes == null) return { texto: 'sem base de comparação', sentido: null }
  const d = Math.round((atual - antes) * 100)
  if (!d) return { texto: 'igual', sentido: 'igual' }
  return { texto: `${d > 0 ? '+' : '−'}${Math.abs(d)} p.p.`, sentido: d > 0 ? 'sobe' : 'desce' }
}

export function resumoEmTexto(r, a) {
  const T = TIPOS[r.periodo.tipo]
  const partes = []
  const em = r.periodo.tipo === 'mes' ? `Em ${r.periodo.rotulo}` : r.periodo.tipo === 'ano' ? `Em ${r.periodo.rotulo}` : `No ${r.periodo.rotulo}`
  if (!r.total) return `${em} não houve ocorrências registradas no Imperatriz em Alerta.`
  partes.push(`${em}, o Imperatriz em Alerta recebeu ${numero(r.total)} ${r.total === 1 ? 'aviso' : 'avisos'} de moradores, dos quais ${numero(r.validas)} ${r.validas === 1 ? 'foi validado' : 'foram validados'} pela moderação.`)
  if (r.validas) partes.push(`${numero(r.resolvidas)} ${r.resolvidas === 1 ? 'está resolvida' : 'estão resolvidas'} (${porcento(r.taxaResolucao)}).`)
  if (r.horasAtendimento != null) partes.push(`O tempo médio entre o aviso e o início do atendimento foi de ${duracao(r.horasAtendimento)}${r.horasSolucao != null ? `, e até a solução, de ${duracao(r.horasSolucao)}` : ''}.`)
  if (r.bairros[0]) partes.push(`O bairro com mais ocorrências foi ${r.bairros[0].nome} (${numero(r.bairros[0].total)})${r.ruas[0] ? `, e a rua mais citada foi ${r.ruas[0].rua} (bairro ${r.ruas[0].bairro}, ${numero(r.ruas[0].total)})` : ''}.`)
  if (a && a.total) {
    const v = variacao(r.validas, a.validas)
    if (v.sentido === 'sobe') partes.push(`Em relação ao ${T.anteriorNome}, as ocorrências válidas aumentaram ${v.texto.replace('+', '')}.`)
    else if (v.sentido === 'desce') partes.push(`Em relação ao ${T.anteriorNome}, as ocorrências válidas caíram ${v.texto.replace('−', '')}.`)
    else if (v.sentido === 'igual') partes.push(`O número de ocorrências válidas ficou igual ao do ${T.anteriorNome}.`)
  }
  if (r.recusadas) partes.push(`${numero(r.recusadas)} ${r.recusadas === 1 ? 'aviso foi recusado' : 'avisos foram recusados'} na moderação.`)
  return partes.join(' ')
}
