import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

// Mapa de calor desenhado direto no mapa, sem biblioteca extra.
// Cada aviso vira uma mancha de RAIO_M metros; onde as manchas se somam, a cor esquenta
// (azul claro -> amarelo -> laranja -> vermelho). O raio acompanha o zoom.
const RAIO_M = 350
const CORES = [[0, 'rgba(43,179,230,0)'], [0.2, '#2BB3E6'], [0.45, '#FACC15'], [0.7, '#F97316'], [0.9, '#DC2626'], [1, '#991B1B']]

let paleta
function criarPaleta() {
  if (paleta) return paleta
  const c = document.createElement('canvas'); c.width = 1; c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  CORES.forEach(([p, cor]) => g.addColorStop(p, cor))
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 256)
  paleta = ctx.getImageData(0, 0, 1, 256).data
  return paleta
}

const Camada = L.Layer.extend({
  initialize(pontos, opcoes) { this._pontos = pontos; this._max = opcoes.max },
  onAdd(map) {
    this._map = map
    this._canvas = L.DomUtil.create('canvas', 'leaflet-zoom-hide')
    this._canvas.style.pointerEvents = 'none'
    this._canvas.style.opacity = '0.85'
    this._canvas.setAttribute('aria-hidden', 'true')
    map.getPanes().overlayPane.appendChild(this._canvas)
    map.on('moveend zoomend resize', this._desenhar, this)
    this._desenhar()
  },
  onRemove(map) {
    map.off('moveend zoomend resize', this._desenhar, this)
    L.DomUtil.remove(this._canvas)
  },
  _desenhar() {
    const map = this._map
    const tam = map.getSize()
    const canto = map.containerPointToLayerPoint([0, 0])
    L.DomUtil.setPosition(this._canvas, canto)
    this._canvas.width = tam.x; this._canvas.height = tam.y
    const ctx = this._canvas.getContext('2d', { willReadFrequently: true })
    if (!this._pontos.length || !tam.x || !tam.y) return

    // metros -> pixels no zoom atual
    const centro = map.getCenter()
    const p1 = map.latLngToContainerPoint(centro)
    const p2 = map.latLngToContainerPoint(L.latLng(centro.lat, centro.lng + RAIO_M / (111320 * Math.cos((centro.lat * Math.PI) / 180))))
    const r = Math.max(24, Math.abs(p2.x - p1.x))
    const alfa = Math.min(1, 2 / this._max)

    this._pontos.forEach(([lat, lng]) => {
      const p = map.latLngToContainerPoint([lat, lng])
      if (p.x < -r || p.y < -r || p.x > tam.x + r || p.y > tam.y + r) return
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
      g.addColorStop(0, `rgba(0,0,0,${alfa})`); g.addColorStop(0.35, `rgba(0,0,0,${alfa * 0.75})`); g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2)
    })

    const img = ctx.getImageData(0, 0, tam.x, tam.y)
    const d = img.data
    const cores = criarPaleta()
    for (let i = 3; i < d.length; i += 4) {
      const a = d[i]
      if (!a) continue
      const j = a * 4
      d[i - 3] = cores[j]; d[i - 2] = cores[j + 1]; d[i - 1] = cores[j + 2]
      d[i] = Math.min(255, a * 2.2)
    }
    ctx.putImageData(img, 0, 0)
  },
})

// pontos: lista de ocorrências com lat/lng. max: quantos avisos juntos deixam a mancha vermelha.
export default function CamadaCalor({ pontos, max = 4 }) {
  const map = useMap()
  useEffect(() => {
    const camada = new Camada(pontos.filter((o) => o.lat != null).map((o) => [o.lat, o.lng]), { max })
    camada.addTo(map)
    return () => { camada.remove() }
  }, [map, pontos, max])
  return null
}

export function LegendaCalor({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 text-xs text-slate-500 ${className}`}>
      <span>Poucos avisos</span>
      <span className="h-2 w-28 rounded-full" style={{ background: 'linear-gradient(90deg,#2BB3E6,#FACC15,#F97316,#DC2626)' }} />
      <span>Muitos avisos</span>
    </div>
  )
}
