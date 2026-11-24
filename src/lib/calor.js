// Agrupa avisos próximos (até RAIO metros) para achar os "pontos críticos":
// os lugares que mais recebem avisos de alagamento e drenagem.
const RAIO = 250

function distancia(a, b) {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

const maisComum = (lista) => {
  const c = {}
  lista.forEach((v) => { if (v) c[v] = (c[v] || 0) + 1 })
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
}

export function pontosCriticos(ocorrencias, raio = RAIO) {
  const grupos = []
  ocorrencias
    .filter((o) => o.lat != null && o.lng != null)
    .forEach((o) => {
      const g = grupos.find((x) => distancia(x, o) <= raio)
      if (!g) { grupos.push({ lat: o.lat, lng: o.lng, itens: [o] }); return }
      g.itens.push(o)
      g.lat = g.itens.reduce((s, i) => s + i.lat, 0) / g.itens.length
      g.lng = g.itens.reduce((s, i) => s + i.lng, 0) / g.itens.length
    })
  return grupos
    .map((g) => ({
      lat: g.lat, lng: g.lng, total: g.itens.length,
      abertos: g.itens.filter((o) => !['resolvida', 'recusada'].includes(o.status)).length,
      bairro: maisComum(g.itens.map((o) => o.bairro)),
      rua: maisComum(g.itens.map((o) => o.rua)),
      ultimo: g.itens.reduce((m, o) => (o.created_at > m ? o.created_at : m), ''),
    }))
    .sort((a, b) => b.total - a.total || b.abertos - a.abertos)
}
