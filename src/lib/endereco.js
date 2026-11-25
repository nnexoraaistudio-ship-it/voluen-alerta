// Endereços de Imperatriz usando dados abertos do OpenStreetMap.
// - Overpass: lista de bairros e ruas de cada bairro (com o desenho da rua).
// - Nominatim: busca de texto livre, só como plano B (no máximo 1 busca por segundo).
import { BAIRROS } from './constants'

// Vários servidores do mesmo serviço: pergunta a todos ao mesmo tempo e usa a primeira resposta.
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const S = -5.65, W = -47.62, N = -5.40, E = -47.33 // retângulo em volta de Imperatriz
const CAIXA = `${S},${W},${N},${E}`
const TIPOS_RUA = '^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|pedestrian|road)(_link)?$'

export const normalizar = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

async function overpass(q) {
  // Se nenhum servidor responder em 12 segundos, desiste e o site pede para digitar a rua.
  const ctl = new AbortController()
  const limite = setTimeout(() => ctl.abort(), 12000)
  try {
    return await Promise.any(OVERPASS.map(async (url) => {
      const r = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: q }), signal: ctl.signal })
      if (!r.ok) throw new Error('overpass ' + r.status)
      const j = await r.json()
      if (j.remark && !j.elements?.length) throw new Error('overpass ' + j.remark)
      return j.elements || []
    }))
  } catch { throw new Error('Serviço de mapas não respondeu.') } finally { clearTimeout(limite); ctl.abort() }
}

const lerCache = (k) => { try { return JSON.parse(sessionStorage.getItem(k)) } catch { return null } }
const gravarCache = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)) } catch { /* sem cache */ } }

export const bairrosFixos = () => BAIRROS.map((nome) => ({ nome, lat: null, lng: null, area: null }))

// Lista de bairros: os do OpenStreetMap (com posição) + a nossa lista fixa (sem posição).
let bairrosPromessa
export function carregarBairros() {
  if (bairrosPromessa) return bairrosPromessa
  bairrosPromessa = (async () => {
    const mapa = new Map()
    const cache = lerCache('va-bairros-v1')
    let osm = cache
    if (!osm) {
      try {
        const el = await overpass(`[out:json][timeout:25];(
          node["place"~"^(suburb|neighbourhood|quarter)$"](${CAIXA});
          way["place"~"^(suburb|neighbourhood|quarter)$"](${CAIXA});
          relation["place"~"^(suburb|neighbourhood|quarter)$"](${CAIXA});
          relation["boundary"~"^(neighbourhood|administrative)$"]["admin_level"~"^(9|10)$"](${CAIXA});
          way["landuse"="residential"]["name"](${CAIXA});
        );out tags center;`)
        osm = el.filter((x) => x.tags?.name).map((x) => ({
          nome: x.tags.name.trim(),
          lat: x.lat ?? x.center?.lat, lng: x.lon ?? x.center?.lon,
          area: x.type === 'way' ? 2400000000 + x.id : x.type === 'relation' ? 3600000000 + x.id : null,
          prioridade: x.tags.place ? 0 : x.tags.boundary ? 1 : 2,
        })).filter((b) => b.lat != null)
        gravarCache('va-bairros-v1', osm)
      } catch { osm = [] }
    }
    // Se o mesmo nome aparecer mais de uma vez, fica o mais confiável (bairro oficial > contorno > loteamento).
    for (const b of osm) {
      const k = normalizar(b.nome)
      const atual = mapa.get(k)
      if (!atual || b.prioridade < atual.prioridade || (b.prioridade === atual.prioridade && b.area && !atual.area)) mapa.set(k, b)
    }
    for (const nome of BAIRROS) if (!mapa.has(normalizar(nome))) mapa.set(normalizar(nome), { nome, lat: null, lng: null, area: null })
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  })()
  return bairrosPromessa
}

export async function acharBairro(texto) {
  const k = normalizar(texto)
  if (k.length < 2) return null
  const lista = await carregarBairros()
  const b = lista.find((x) => normalizar(x.nome) === k)
  if (!b) return null
  if (b.lat == null) {
    const r = await buscarTexto(`${b.nome}, Imperatriz, Maranhão`, CAIXA)
    if (r) Object.assign(b, r)
  }
  return b.lat == null ? null : b
}

// Ruas do bairro, com o desenho de cada uma. Junta trechos com o mesmo nome.
export async function ruasDoBairro(b) {
  const chave = `va-ruas-v1-${normalizar(b.nome)}`
  const cache = lerCache(chave)
  if (cache) return cache
  const pegar = (filtro) => overpass(`[out:json][timeout:12];${filtro}way["highway"~"${TIPOS_RUA}"]["name"]${b.area && filtro ? '(area.b)' : `(around:900,${b.lat},${b.lng})`};out tags geom;`)
  let el = b.area ? await pegar(`area(${b.area})->.b;`) : []
  if (!el.length) el = await pegar('')
  const ruas = new Map()
  for (const w of el) {
    if (!w.geometry?.length) continue
    const nome = w.tags.name.trim()
    const k = normalizar(nome)
    if (!ruas.has(k)) ruas.set(k, { nome, linhas: [] })
    ruas.get(k).linhas.push(w.geometry.map((p) => [p.lat, p.lon]))
  }
  const lista = [...ruas.values()].sort((a, b2) => a.nome.localeCompare(b2.nome, 'pt-BR'))
  gravarCache(chave, lista)
  return lista
}

// Ponto da rua mais perto do centro do bairro: um bom chute inicial para o pino.
export function pontoDaRua(rua, centro) {
  let melhor = null, dist = Infinity
  for (const linha of rua.linhas) for (const p of linha) {
    const d = (p[0] - centro[0]) ** 2 + (p[1] - centro[1]) ** 2
    if (d < dist) { dist = d; melhor = p }
  }
  return melhor
}

let ultima = 0
async function buscarTexto(q, caixa) {
  const espera = 1100 - (Date.now() - ultima)
  if (espera > 0) await new Promise((r) => setTimeout(r, espera))
  ultima = Date.now()
  const [s, w, n, e] = caixa.split(',').map(Number)
  const p = new URLSearchParams({ q, format: 'jsonv2', limit: '1', countrycodes: 'br', viewbox: `${w},${n},${e},${s}`, bounded: '1', 'accept-language': 'pt-BR' })
  const r = await fetch(`${NOMINATIM}?${p}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
  if (!r.ok) throw new Error('busca indisponível')
  const [res] = await r.json()
  return res ? { lat: Number(res.lat), lng: Number(res.lon) } : null
}

// Plano B para rua digitada que não está na lista: procura só perto do bairro.
export async function localizarTexto(rua, bairro) {
  const perto = bairro?.lat != null ? `${bairro.lat - 0.015},${bairro.lng - 0.015},${bairro.lat + 0.015},${bairro.lng + 0.015}` : CAIXA
  const r = await buscarTexto(`${rua}, Imperatriz, Maranhão`, perto)
  return r
}
