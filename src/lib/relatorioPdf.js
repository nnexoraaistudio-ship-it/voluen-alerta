// Gera o PDF do relatório direto no navegador (sem servidor e sem serviço pago).
// Usa jsPDF com as fontes da marca (Outfit + Inter) guardadas em public/fontes/.
// O PDF não tem nenhum dado pessoal de morador: só números agregados, bairros e ruas.
import { jsPDF } from 'jspdf'
import { STATUS } from './constants'
import { marcaSvg } from '../components/Marca'
import { TIPOS, numero, porcento, duracao, variacao, variacaoPontos, resumoEmTexto } from './relatorio'

const COR = {
  noite: '#072B5A', azul: '#0B4DA2', azulMedio: '#1A7FCB', claro: '#2BB3E6', nevoa: '#F3F6FA', azul50: '#EAF1FB', azul100: '#D3E2F6',
  texto: '#1E293B', suave: '#475569', fraco: '#64748B', linha: '#E2E8F0', verde: '#059669', vermelho: '#DC2626', ambar: '#B45309',
}
const M = 16 // margem
const LARG = 210 - 2 * M
const ORDEM_STATUS = ['resolvida', 'encaminhada', 'em_analise', 'recebida', 'moderacao', 'recusada']

const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1)
const dataBR = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const horaBR = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

// ---------- recursos (fontes, logo, mapa) ----------
const FONTES = [
  ['Inter_400Regular.ttf', 'Inter'], ['Inter_600SemiBold.ttf', 'InterSemi'], ['Inter_700Bold.ttf', 'InterBold'],
  ['Outfit_600SemiBold.ttf', 'Outfit'], ['Outfit_700Bold.ttf', 'OutfitBold'],
]
let fontesCache
async function carregarFontes() {
  if (fontesCache) return fontesCache
  const base = import.meta.env.BASE_URL || './'
  fontesCache = Promise.all(FONTES.map(async ([arq, nome]) => {
    const r = await fetch(`${base}fontes/${arq}`)
    if (!r.ok) throw new Error('Não foi possível carregar as fontes do relatório.')
    const bytes = new Uint8Array(await r.arrayBuffer())
    let bin = ''
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
    return { arq, nome, b64: btoa(bin) }
  })).catch((e) => { fontesCache = null; throw e })
  return fontesCache
}

function carregarImagem(src, cors) {
  return new Promise((ok, falha) => {
    const img = new Image()
    if (cors) img.crossOrigin = 'anonymous'
    img.onload = () => ok(img)
    img.onerror = () => falha(new Error('imagem'))
    img.src = src
  })
}

async function logoPng(claro) {
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(marcaSvg({ claro }))
  const img = await carregarImagem(url)
  const c = document.createElement('canvas'); c.width = 1333; c.height = 322
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/png')
}

// Mapa de calor: mapa base do OpenStreetMap + manchas onde houve ocorrências.
const PALETA = [[0, 'rgba(43,179,230,0)'], [0.2, '#2BB3E6'], [0.45, '#FACC15'], [0.7, '#F97316'], [0.9, '#DC2626'], [1, '#991B1B']]
const px = (lat, lng, z) => {
  const s = 256 * 2 ** z
  const r = (lat * Math.PI) / 180
  return [((lng + 180) / 360) * s, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * s]
}

async function mapaDeCalor(pontos, W = 1600, H = 900) {
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')
  const centroCidade = { lat: -5.5235, lng: -47.4735 }
  const lats = pontos.length ? pontos.map((p) => p.lat) : [centroCidade.lat]
  const lngs = pontos.length ? pontos.map((p) => p.lng) : [centroCidade.lng]
  let [s, n, w, e] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)]
  const minSpan = 0.035
  if (n - s < minSpan) { const m = (n + s) / 2; s = m - minSpan / 2; n = m + minSpan / 2 }
  if (e - w < minSpan) { const m = (e + w) / 2; w = m - minSpan / 2; e = m + minSpan / 2 }
  const padLat = (n - s) * 0.18; const padLng = (e - w) * 0.18
  s -= padLat; n += padLat; w -= padLng; e += padLng
  // Zoom fracionado para a região ocupar o mapa inteiro; as imagens do mapa base usam o zoom inteiro abaixo.
  const [ax, ay] = px(n, w, 0); const [bx0, by0] = px(s, e, 0)
  const z = Math.min(16, Math.log2(W / (bx0 - ax)), Math.log2(H / (by0 - ay)))
  const zt = Math.floor(z); const esc = 2 ** (z - zt)
  const [cx, cy] = px((n + s) / 2, (e + w) / 2, z)
  const ox = cx - W / 2; const oy = cy - H / 2
  const ponto = (lat, lng) => { const [x, y] = px(lat, lng, z); return [x - ox, y - oy] }

  // Mapa base
  let base = true
  try {
    const tiles = []
    const T = 256 * esc
    for (let tx = Math.floor(ox / T); tx <= Math.floor((ox + W) / T); tx++) {
      for (let ty = Math.floor(oy / T); ty <= Math.floor((oy + H) / T); ty++) tiles.push([tx, ty])
    }
    const limite = new Promise((_, f) => setTimeout(() => f(new Error('tempo')), 9000))
    const imgs = await Promise.race([Promise.all(tiles.map(([tx, ty]) => carregarImagem(`https://tile.openstreetmap.org/${zt}/${tx}/${ty}.png`, true))), limite])
    imgs.forEach((img, i) => ctx.drawImage(img, tiles[i][0] * T - ox, tiles[i][1] * T - oy, T, T))
    ctx.getImageData(0, 0, 1, 1) // confere se o canvas pode ser exportado
    ctx.fillStyle = 'rgba(243,246,250,0.35)'; ctx.fillRect(0, 0, W, H)
  } catch {
    base = false
    ctx.fillStyle = COR.azul50; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = COR.azul100; ctx.lineWidth = 1
    for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
  }

  // Manchas de calor
  if (pontos.length) {
    const mPorPx = (156543.03 * Math.cos((centroCidade.lat * Math.PI) / 180)) / 2 ** z
    const raio = Math.max(26, 380 / mPorPx)
    const calor = document.createElement('canvas'); calor.width = W; calor.height = H
    const hc = calor.getContext('2d')
    const forca = Math.min(0.55, Math.max(0.18, 3 / Math.sqrt(pontos.length)))
    pontos.forEach((p) => {
      const [x, y] = ponto(p.lat, p.lng)
      const g = hc.createRadialGradient(x, y, 0, x, y, raio)
      g.addColorStop(0, `rgba(0,0,0,${forca})`); g.addColorStop(1, 'rgba(0,0,0,0)')
      hc.fillStyle = g; hc.fillRect(x - raio, y - raio, raio * 2, raio * 2)
    })
    const pal = document.createElement('canvas'); pal.width = 1; pal.height = 256
    const pc = pal.getContext('2d'); const gr = pc.createLinearGradient(0, 0, 0, 256)
    PALETA.forEach(([p, cor]) => gr.addColorStop(p, cor)); pc.fillStyle = gr; pc.fillRect(0, 0, 1, 256)
    const cores = pc.getImageData(0, 0, 1, 256).data
    const im = hc.getImageData(0, 0, W, H); const d = im.data
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]; if (!a) continue
      d[i] = cores[a * 4]; d[i + 1] = cores[a * 4 + 1]; d[i + 2] = cores[a * 4 + 2]; d[i + 3] = Math.min(255, cores[a * 4 + 3] * 0.9 + 25)
    }
    hc.putImageData(im, 0, 0)
    ctx.drawImage(calor, 0, 0)

    // Nomes dos bairros com mais pontos
    const grupos = {}
    pontos.forEach((p) => { if (!p.bairro) return; const g = (grupos[p.bairro] = grupos[p.bairro] || { n: 0, lat: 0, lng: 0 }); g.n++; g.lat += p.lat; g.lng += p.lng })
    const usados = []
    const bate = (a) => usados.some((b) => a.x < b.x + b.w + 6 && b.x < a.x + a.w + 6 && a.y < b.y + b.h + 4 && b.y < a.y + a.h + 4)
    ctx.font = '600 22px Inter, Arial, sans-serif'
    Object.entries(grupos).sort((a, b) => b[1].n - a[1].n).slice(0, 6).forEach(([nome, g]) => {
      const [x, y] = ponto(g.lat / g.n, g.lng / g.n)
      const tw = ctx.measureText(nome).width
      const bx = Math.min(W - tw - 30, Math.max(8, x - tw / 2 - 12))
      const caixa = [y - raio * 0.6 - 40, y + raio * 0.6 + 6, y - 17].map((by) => ({ x: bx, y: Math.min(H - 70, Math.max(8, by)), w: tw + 24, h: 34 })).find((c) => !bate(c))
      if (!caixa) return
      usados.push(caixa)
      ctx.fillStyle = 'rgba(7,43,90,0.88)'
      ctx.beginPath(); ctx.roundRect(caixa.x, caixa.y, caixa.w, caixa.h, 8); ctx.fill()
      ctx.fillStyle = '#FFFFFF'; ctx.fillText(nome, caixa.x + 12, caixa.y + 24)
    })
  }

  // Créditos do mapa (obrigatórios pela licença do OpenStreetMap)
  ctx.font = '18px Inter, Arial, sans-serif'
  const cred = base ? '© colaboradores do OpenStreetMap' : 'Mapa base indisponível na emissão: posições aproximadas'
  const cw = ctx.measureText(cred).width
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(W - cw - 20, H - 32, cw + 20, 32)
  ctx.fillStyle = '#334155'; ctx.fillText(cred, W - cw - 10, H - 10)
  return c.toDataURL('image/jpeg', 0.9)
}

// ---------- desenho ----------
function criarDoc(fontes) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  fontes.forEach(({ arq, nome, b64 }) => { doc.addFileToVFS(arq, b64); doc.addFont(arq, nome, 'normal') })
  const f = {
    doc,
    fonte(nome, tam, cor = COR.texto) { doc.setFont(nome, 'normal'); doc.setFontSize(tam); doc.setTextColor(...rgb(cor)) },
    cheio(cor) { doc.setFillColor(...rgb(cor)) },
    traco(cor, l = 0.2) { doc.setDrawColor(...rgb(cor)); doc.setLineWidth(l) },
  }
  return f
}

export async function gerarRelatorioPdf({ atual, anterior, emissor, hoje = new Date() }) {
  const [fontes, logoBranco, logoCor, mapa] = await Promise.all([
    carregarFontes(), logoPng(true), logoPng(false), mapaDeCalor(atual.pontos),
  ])
  const F = criarDoc(fontes)
  const { doc } = F
  const T = TIPOS[atual.periodo.tipo]
  const tituloPeriodo = cap(atual.periodo.rotulo) + (atual.periodo.detalhe ? ` (${atual.periodo.detalhe})` : '')
  const rotAnt = cap(anterior.periodo.rotulo)
  let y = 0

  const tituloSecao = (t, sub) => {
    F.cheio(COR.claro); doc.roundedRect(M, y - 4.2, 1.4, 5.6, 0.6, 0.6, 'F')
    F.fonte('Outfit', 12.5, COR.noite); doc.text(t, M + 4, y)
    if (sub) { F.fonte('Inter', 7.8, COR.fraco); doc.text(sub, M + LARG, y, { align: 'right' }) }
    y += 7
  }
  const cabecalhoPequeno = () => {
    F.cheio(COR.noite); doc.rect(0, 0, 210, 15, 'F')
    F.cheio(COR.claro); doc.rect(0, 15, 210, 0.8, 'F')
    doc.addImage(logoBranco, 'PNG', M, 5, 18.6, 4.5)
    F.fonte('InterSemi', 7.5, '#FFFFFF'); doc.text(`Relatório ${T.palavra} · ${tituloPeriodo}`, M + LARG, 9.2, { align: 'right' })
    y = 26
  }
  const garantir = (h) => { if (y + h > 280) { doc.addPage(); cabecalhoPequeno() } }

  // ===== Página 1: capa e resumo =====
  F.cheio(COR.noite); doc.rect(0, 0, 210, 56, 'F')
  F.cheio(COR.azul); doc.circle(196, -6, 38, 'F')
  F.cheio(COR.azulMedio); doc.circle(206, 2, 22, 'F')
  F.cheio(COR.claro); doc.rect(0, 56, 210, 1.4, 'F')
  doc.addImage(logoBranco, 'PNG', M, 12, 27.3, 6.6)
  F.fonte('InterBold', 7.2, COR.claro); doc.text('IMPERATRIZ EM ALERTA', M, 27, { charSpace: 0.6 })
  F.fonte('OutfitBold', 24, '#FFFFFF'); doc.text(`Relatório ${T.palavra} de ocorrências`, M, 37)
  F.fonte('Outfit', 13, '#BFE6F7'); doc.text(tituloPeriodo, M, 45)
  F.fonte('Inter', 7.8, '#C9D6E8')
  doc.text(`Drenagem urbana · Imperatriz-MA · Emitido em ${dataBR(hoje)} às ${horaBR(hoje)}`, M, 51)
  y = 68

  tituloSecao('Resumo do período')
  F.fonte('Inter', 9.6, COR.texto)
  const linhas = doc.splitTextToSize(resumoEmTexto(atual, anterior), LARG)
  doc.text(linhas, M, y, { lineHeightFactor: 1.5 })
  y += linhas.length * 5.1 + 2
  if (atual.emAndamento) {
    F.cheio('#FEF3C7'); doc.roundedRect(M, y, LARG, 8, 1.5, 1.5, 'F')
    F.fonte('InterSemi', 8, '#92400E')
    doc.text(`Período em andamento: os números são parciais, até ${dataBR(hoje)}. A comparação é com o ${T.anteriorNome} completo.`, M + 4, y + 5.2)
    y += 12
  }
  y += 2

  // Indicadores principais
  const cartao = (x, w, h, rotulo, valor, sub, delta, melhor) => {
    F.cheio(COR.nevoa); doc.roundedRect(x, y, w, h, 2.2, 2.2, 'F')
    F.fonte('InterSemi', 7, COR.fraco); doc.text(rotulo.toUpperCase(), x + 4, y + 6.2, { charSpace: 0.25 })
    F.fonte('OutfitBold', h > 25 ? 19 : 15, COR.noite); doc.text(valor, x + 4, y + (h > 25 ? 16.5 : 14))
    if (sub) { const vw = doc.getTextWidth(valor); F.fonte('InterSemi', 8, COR.azul); doc.text(sub, x + 5.5 + vw, y + (h > 25 ? 16.5 : 14)) }
    if (delta) {
      const cor = !delta.sentido || delta.sentido === 'igual' || !melhor ? COR.fraco : delta.sentido === melhor ? COR.verde : COR.vermelho
      const ty = y + h - 5.2
      F.cheio(cor)
      if (delta.sentido === 'sobe') doc.triangle(x + 4, ty + 0.4, x + 7, ty + 0.4, x + 5.5, ty - 2.2, 'F')
      else if (delta.sentido === 'desce') doc.triangle(x + 4, ty - 2.2, x + 7, ty - 2.2, x + 5.5, ty + 0.4, 'F')
      else doc.rect(x + 4, ty - 1.3, 3, 0.8, 'F')
      const txt = delta.sentido ? delta.texto : 'sem comparação'
      F.fonte('InterSemi', 7.2, cor); doc.text(txt, x + 8.5, ty)
      const dw = doc.getTextWidth(txt)
      if (delta.sentido) { F.fonte('Inter', 7.2, COR.fraco); doc.text(' vs. anterior', x + 8.5 + dw, ty) }
    }
  }
  const g = 4; const w4 = (LARG - 3 * g) / 4
  cartao(M, w4, 30, 'Avisos recebidos', numero(atual.total), null, variacao(atual.total, anterior.total), null)
  cartao(M + (w4 + g), w4, 30, 'Resolvidas', numero(atual.resolvidas), atual.validas ? porcento(atual.taxaResolucao) : null, variacaoPontos(atual.taxaResolucao, anterior.taxaResolucao), 'sobe')
  cartao(M + 2 * (w4 + g), w4, 30, 'Até o atendimento', duracao(atual.horasAtendimento), null, variacao(atual.horasAtendimento, anterior.horasAtendimento), 'desce')
  cartao(M + 3 * (w4 + g), w4, 30, 'Até a solução', duracao(atual.horasSolucao), null, variacao(atual.horasSolucao, anterior.horasSolucao), 'desce')
  y += 34
  cartao(M, w4, 21, 'Válidas', numero(atual.validas))
  cartao(M + (w4 + g), w4, 21, 'Em aberto', numero(atual.emAberto))
  cartao(M + 2 * (w4 + g), w4, 21, 'Recusadas', numero(atual.recusadas))
  cartao(M + 3 * (w4 + g), w4, 21, 'Abertas há +7 dias', numero(atual.emAbertoHa7))
  y += 24
  F.fonte('Inter', 6.8, COR.fraco)
  doc.text('Tempos médios contados a partir do registro do aviso. "Abertas há +7 dias" considera todas as ocorrências ainda sem solução na data de emissão.', M, y)
  y += 10

  // Situação
  tituloSecao('Situação das ocorrências registradas', `${numero(atual.total)} no total`)
  if (atual.total) {
    let x = M
    ORDEM_STATUS.forEach((s) => {
      const n = atual.porStatus[s]; if (!n) return
      const w = (n / atual.total) * LARG
      F.cheio(STATUS[s].dot); doc.rect(x, y, w, 7, 'F'); x += w
    })
    y += 12
    ORDEM_STATUS.forEach((s, i) => {
      const cx = M + (i % 3) * (LARG / 3); const cy = y + Math.floor(i / 3) * 6
      F.cheio(STATUS[s].dot); doc.circle(cx + 1.4, cy - 1.2, 1.4, 'F')
      F.fonte('Inter', 8.2, COR.suave); doc.text(STATUS[s].curto, cx + 4.5, cy)
      const tw = doc.getTextWidth(STATUS[s].curto)
      F.fonte('InterBold', 8.2, COR.texto); doc.text(`${numero(atual.porStatus[s])}  (${porcento(atual.porStatus[s] / atual.total)})`, cx + 6 + tw, cy)
    })
    y += 14
  } else { F.fonte('Inter', 9, COR.fraco); doc.text('Nenhuma ocorrência registrada no período.', M, y); y += 8 }

  // Evolução
  garantir(62)
  tituloSecao(atual.periodo.tipo === 'mes' ? 'Ocorrências válidas por semana do mês (dias)' : 'Ocorrências válidas por mês', null)
  const altG = 42; const base = y + altG
  const maxS = Math.max(1, ...atual.serie.map((s) => s.total))
  const passo = Math.pow(10, Math.floor(Math.log10(maxS))) * (maxS / Math.pow(10, Math.floor(Math.log10(maxS))) > 5 ? 2 : 1)
  let topo = Math.max(1, Math.ceil(maxS / passo) * passo)
  if (topo % 2 && topo > 1) topo += 1
  F.traco(COR.linha, 0.2)
  for (let v = 0; v <= topo; v += topo / 2) {
    const ly = base - (v / topo) * altG
    doc.line(M + 8, ly, M + LARG, ly)
    F.fonte('Inter', 6.8, COR.fraco); doc.text(numero(Math.round(v)), M + 6, ly + 1, { align: 'right' })
  }
  const nS = atual.serie.length; const slot = (LARG - 10) / nS; const bw = Math.min(16, slot * 0.6)
  atual.serie.forEach((s, i) => {
    const h = (s.total / topo) * altG; const bx = M + 10 + i * slot + (slot - bw) / 2
    if (h > 0) { F.cheio(COR.azul); doc.roundedRect(bx, base - h, bw, h, 0.8, 0.8, 'F'); doc.rect(bx, base - Math.min(h, 1), bw, Math.min(h, 1), 'F') }
    if (s.total) { F.fonte('InterBold', 7.5, COR.noite); doc.text(numero(s.total), bx + bw / 2, base - h - 1.6, { align: 'center' }) }
    F.fonte('Inter', 7.2, COR.fraco); doc.text(s.rotulo, bx + bw / 2, base + 4.5, { align: 'center' })
  })
  y = base + 12

  // ===== Página 2: onde acontece =====
  doc.addPage(); cabecalhoPequeno()
  tituloSecao('Onde as ocorrências se concentram', `${numero(atual.pontos.length)} pontos no mapa`)
  const mh = (LARG * 9) / 16
  doc.addImage(mapa, 'JPEG', M, y, LARG, mh)
  F.traco(COR.linha, 0.3); doc.roundedRect(M, y, LARG, mh, 1.5, 1.5, 'S')
  y += mh + 4
  // legenda do calor
  const lg = 30
  F.fonte('Inter', 7, COR.fraco)
  doc.text('poucos avisos', M, y + 2)
  const lx = M + doc.getTextWidth('poucos avisos') + 2
  ;[COR.claro, '#FACC15', '#F97316', '#DC2626'].forEach((c, i) => { F.cheio(c); doc.rect(lx + (i * lg) / 4, y, lg / 4, 2.4, 'F') })
  doc.text('muitos avisos', lx + lg + 2, y + 2)
  doc.text('Cada mancha é um aviso válido; onde as manchas se somam, a cor esquenta.', M + LARG, y + 2, { align: 'right' })
  y += 11

  const colW = (LARG - 8) / 2
  const topoCol = y
  // Bairros
  tituloSecao('Bairros com mais ocorrências')
  const bairros = atual.bairros.slice(0, 8)
  const maxB = Math.max(1, ...bairros.map((b) => b.total))
  if (!bairros.length) { F.fonte('Inter', 8.5, COR.fraco); doc.text('Sem ocorrências válidas.', M, y) }
  bairros.forEach((b, i) => {
    const ry = y + i * 8.6
    F.fonte('InterBold', 8, COR.fraco); doc.text(`${i + 1}`, M + 1, ry + 3.4)
    F.fonte('InterSemi', 8.4, COR.texto); doc.text(doc.splitTextToSize(b.nome, colW - 30)[0], M + 6, ry + 3.4)
    F.cheio(COR.azul50); doc.roundedRect(M + 6, ry + 5, colW - 22, 1.8, 0.9, 0.9, 'F')
    F.cheio(COR.azul); doc.roundedRect(M + 6, ry + 5, Math.max(1.8, ((colW - 22) * b.total) / maxB), 1.8, 0.9, 0.9, 'F')
    F.fonte('OutfitBold', 10, COR.noite); doc.text(numero(b.total), M + colW, ry + 4.5, { align: 'right' })
    F.fonte('Inter', 6.4, COR.fraco); doc.text(`${numero(b.resolvidas)} resolv.`, M + colW, ry + 7.6, { align: 'right' })
  })
  // Ruas
  const xR = M + colW + 8
  y = topoCol
  F.cheio(COR.claro); doc.roundedRect(xR, y - 4.2, 1.4, 5.6, 0.6, 0.6, 'F')
  F.fonte('Outfit', 12.5, COR.noite); doc.text('Ruas que mais alagam', xR + 4, y)
  y += 7
  const ruas = atual.ruas.slice(0, 8)
  if (!ruas.length) { F.fonte('Inter', 8.5, COR.fraco); doc.text('Sem ruas informadas.', xR, y) }
  ruas.forEach((r, i) => {
    const ry = y + i * 8.6
    if (i % 2 === 0) { F.cheio(COR.nevoa); doc.roundedRect(xR, ry - 0.6, colW, 8.2, 1.2, 1.2, 'F') }
    F.fonte('InterBold', 8, COR.fraco); doc.text(`${i + 1}`, xR + 2, ry + 3.6)
    F.fonte('InterSemi', 8.4, COR.texto); doc.text(doc.splitTextToSize(r.rua, colW - 26)[0], xR + 7, ry + 3.4)
    F.fonte('Inter', 6.8, COR.fraco); doc.text(`${r.bairro}${r.alagamentos ? ` · ${numero(r.alagamentos)} alagamento${r.alagamentos > 1 ? 's' : ''}` : ''}`, xR + 7, ry + 6.6)
    F.fonte('OutfitBold', 10, COR.noite); doc.text(numero(r.total), xR + colW - 3, ry + 5, { align: 'right' })
  })
  y = topoCol + 7 + Math.max(bairros.length, ruas.length, 1) * 8.6 + 6

  // Tipos
  garantir(14 + atual.tipos.length * 7)
  tituloSecao('Tipos de ocorrência', 'ocorrências válidas')
  const maxT = Math.max(1, ...atual.tipos.map((t) => t.total))
  if (!atual.tipos.length) { F.fonte('Inter', 8.5, COR.fraco); doc.text('Sem ocorrências válidas.', M, y); y += 6 }
  atual.tipos.forEach((t) => {
    F.cheio(t.cor); doc.circle(M + 1.5, y - 1.1, 1.4, 'F')
    F.fonte('Inter', 8.4, COR.texto); doc.text(t.nome, M + 5, y)
    F.cheio(COR.nevoa); doc.roundedRect(M + 70, y - 2.6, LARG - 92, 3, 1.5, 1.5, 'F')
    F.cheio(t.cor); doc.roundedRect(M + 70, y - 2.6, Math.max(3, ((LARG - 92) * t.total) / maxT), 3, 1.5, 1.5, 'F')
    F.fonte('InterBold', 8.4, COR.noite); doc.text(`${numero(t.total)}  ·  ${porcento(t.total / atual.validas)}`, M + LARG, y, { align: 'right' })
    y += 7
  })
  y += 4

  // ===== Comparação =====
  garantir(80)
  tituloSecao(`Comparação com o ${T.anteriorNome}`)
  const cols = [M, M + 72, M + 108, M + 144]
  F.cheio(COR.noite); doc.roundedRect(M, y - 4.5, LARG, 8, 1.5, 1.5, 'F')
  F.fonte('InterSemi', 7.4, '#FFFFFF')
  doc.text('Indicador', cols[0] + 4, y)
  doc.text(doc.splitTextToSize(rotAnt, 34)[0], cols[1] + 32, y, { align: 'right' })
  doc.text(doc.splitTextToSize(cap(atual.periodo.rotulo), 34)[0], cols[2] + 32, y, { align: 'right' })
  doc.text('Variação', M + LARG - 4, y, { align: 'right' })
  y += 8
  const linhasC = [
    ['Avisos recebidos', atual.total, anterior.total, numero, null],
    ['Ocorrências válidas', atual.validas, anterior.validas, numero, null],
    ['Resolvidas', atual.resolvidas, anterior.resolvidas, numero, 'sobe'],
    ['Taxa de resolução', atual.taxaResolucao, anterior.taxaResolucao, porcento, 'sobe'],
    ['Tempo médio até o atendimento', atual.horasAtendimento, anterior.horasAtendimento, duracao, 'desce'],
    ['Tempo médio até a solução', atual.horasSolucao, anterior.horasSolucao, duracao, 'desce'],
    ['Recusadas na moderação', atual.recusadas, anterior.recusadas, numero, null],
  ]
  linhasC.forEach(([nome, a, b, fmt, melhor], i) => {
    if (i % 2) { F.cheio(COR.nevoa); doc.rect(M, y - 4.4, LARG, 7.4, 'F') }
    F.fonte('Inter', 8.4, COR.texto); doc.text(nome, cols[0] + 4, y)
    F.fonte('Inter', 8.4, COR.suave); doc.text(fmt(b), cols[1] + 32, y, { align: 'right' })
    F.fonte('InterBold', 8.4, COR.noite); doc.text(fmt(a), cols[2] + 32, y, { align: 'right' })
    const v = fmt === porcento ? variacaoPontos(a, b) : variacao(a, b)
    const cor = !v.sentido || v.sentido === 'igual' || !melhor ? COR.suave : v.sentido === melhor ? COR.verde : COR.vermelho
    F.fonte('InterSemi', 8.4, cor); doc.text(v.texto === 'sem base de comparação' ? '–' : v.texto, M + LARG - 4, y, { align: 'right' })
    y += 7.4
  })
  F.fonte('Inter', 6.8, COR.fraco)
  doc.text('Verde: melhorou. Vermelho: piorou. Cinza: sem julgamento (mais avisos podem significar mais participação dos moradores).', M, y + 1)
  y += 10

  // Recusadas
  if (atual.motivosRecusa.length) {
    garantir(14 + atual.motivosRecusa.length * 6)
    tituloSecao('Avisos recusados na moderação', `${numero(atual.recusadas)} no período`)
    atual.motivosRecusa.forEach((m) => {
      F.fonte('Inter', 8.4, COR.texto); doc.text(m.motivo, M + 4, y)
      F.fonte('InterBold', 8.4, COR.noite); doc.text(numero(m.total), M + LARG, y, { align: 'right' })
      F.traco(COR.linha, 0.15); doc.line(M, y + 2, M + LARG, y + 2)
      y += 6
    })
    y += 4
  }

  // Notas e assinatura
  garantir(62)
  tituloSecao('Como ler este relatório')
  const notas = [
    'Avisos recebidos: tudo o que os moradores registraram no período, incluindo os ainda em moderação e os recusados.',
    'Ocorrências válidas: avisos aprovados pela moderação (recebidas, em análise, encaminhadas ou resolvidas).',
    'Tempo até o atendimento: do registro do aviso até a primeira mudança para "em análise", "encaminhada" ou "resolvida".',
    'Tempo até a solução: do registro do aviso até a marcação como "resolvida". Só entram as ocorrências já resolvidas.',
    'Proteção de dados (LGPD): este documento não contém nome, telefone, e-mail, foto, protocolo nem relato escrito de moradores. Só números agregados, bairros e ruas.',
  ]
  notas.forEach((n) => {
    const l = doc.splitTextToSize(n, LARG - 6)
    F.cheio(COR.claro); doc.circle(M + 1.2, y - 1.1, 0.8, 'F')
    F.fonte('Inter', 7.8, COR.suave); doc.text(l, M + 4, y, { lineHeightFactor: 1.4 })
    y += l.length * 3.9 + 1.6
  })
  y += 12
  garantir(22)
  F.traco(COR.suave, 0.25)
  doc.line(M, y, M + 75, y); doc.line(M + LARG - 75, y, M + LARG, y)
  F.fonte('Inter', 7.5, COR.fraco)
  doc.text('Responsável pela emissão', M, y + 4)
  if (emissor) { F.fonte('InterSemi', 7.5, COR.suave); doc.text(emissor, M, y + 8) }
  F.fonte('Inter', 7.5, COR.fraco); doc.text('Secretário(a) responsável', M + LARG - 75, y + 4)

  // Rodapé em todas as páginas
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    F.traco(COR.linha, 0.2); doc.line(M, 285, M + LARG, 285)
    doc.addImage(logoCor, 'PNG', M, 287.5, 12.4, 3)
    F.fonte('Inter', 6.8, COR.fraco)
    doc.text('Imperatriz em Alerta · Tecnologia para cidades que evoluem. · Sem dados pessoais de moradores (LGPD)', M + 15, 290.2)
    doc.text(`Página ${p} de ${total}`, M + LARG, 290.2, { align: 'right' })
  }

  doc.setProperties({ title: `Relatório ${T.palavra} · Imperatriz em Alerta · ${tituloPeriodo}`, subject: 'Ocorrências de drenagem urbana', author: 'Voluen', creator: 'Imperatriz em Alerta, por Voluen' })
  return doc
}

export function nomeDoArquivo(p) {
  const base = p.tipo === 'mes' ? `${p.ano}-${String(p.inicio.getMonth() + 1).padStart(2, '0')}`
    : p.tipo === 'ano' ? `${p.ano}` : `${p.ano}-${p.indice + 1}${p.tipo === 'trimestre' ? 'T' : 'S'}`
  return `relatorio-${TIPOS[p.tipo].palavra}-imperatriz-em-alerta-${base}.pdf`
}
