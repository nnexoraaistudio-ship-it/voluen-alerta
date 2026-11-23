// Busca de endereço gratuita usando o Nominatim (OpenStreetMap), limitada a Imperatriz.
// Regras de uso do serviço: no máximo 1 busca por segundo e citar o OpenStreetMap.
const URL_BASE = 'https://nominatim.openstreetmap.org/search'
const CAIXA = '-47.62,-5.40,-47.33,-5.65' // retângulo em volta de Imperatriz
let ultima = 0

async function buscar(q) {
  const espera = 1100 - (Date.now() - ultima)
  if (espera > 0) await new Promise((r) => setTimeout(r, espera))
  ultima = Date.now()
  const p = new URLSearchParams({ q, format: 'jsonv2', limit: '1', countrycodes: 'br', viewbox: CAIXA, bounded: '1', 'accept-language': 'pt-BR' })
  const r = await fetch(`${URL_BASE}?${p}`, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error('busca indisponível')
  const [res] = await r.json()
  return res ? { lat: Number(res.lat), lng: Number(res.lon) } : null
}

// Tenta rua + bairro; se não achar, tenta só a rua; depois só o bairro.
export async function localizar(rua, bairro) {
  const cidade = 'Imperatriz, Maranhão'
  if (rua && bairro) { const r = await buscar(`${rua}, ${bairro}, ${cidade}`); if (r) return { ...r, precisao: 'rua' } }
  if (rua) { const r = await buscar(`${rua}, ${cidade}`); if (r) return { ...r, precisao: 'rua' } }
  if (bairro) { const r = await buscar(`${bairro}, ${cidade}`); if (r) return { ...r, precisao: 'bairro' } }
  return null
}
