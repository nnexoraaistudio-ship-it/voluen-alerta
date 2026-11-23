import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CATEGORIAS } from '../lib/constants'
import { CENTRO_MAPA } from '../config'
import { StatusPill } from './ui'
import { data } from '../lib/format'

const icones = {}
const iconeDe = (cor, grande) => {
  const k = cor + grande
  if (!icones[k]) icones[k] = L.divIcon({ className: '', html: `<div class="pin ${grande ? 'pin-escolha' : ''}" style="background:${cor}"></div>`, iconSize: grande ? [30, 30] : [18, 18], iconAnchor: grande ? [15, 15] : [9, 9] })
  return icones[k]
}
const LIMITES = [[-5.75, -47.7], [-5.3, -47.25]]

function Clique({ onPick }) {
  useMapEvents({ click: (e) => onPick && onPick([e.latlng.lat, e.latlng.lng]) })
  return null
}
function Voar({ alvo, zoom }) {
  const map = useMap()
  useEffect(() => { if (alvo) map.flyTo(alvo, zoom ?? Math.max(map.getZoom(), 15), { duration: 0.6 }) }, [alvo?.[0], alvo?.[1]]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function Mapa({ pontos = [], escolha, onPick, foco, className = 'h-[420px]', zoom = 13, interativo = true }) {
  return (
    <MapContainer center={escolha || CENTRO_MAPA} zoom={escolha ? 16 : zoom} minZoom={11} maxBounds={LIMITES} scrollWheelZoom={interativo} dragging={interativo} className={`w-full ${className}`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <Clique onPick={onPick} />
      <Voar alvo={foco || escolha} />
      {pontos.map((o) => (
        <Marker key={o.id} position={[o.lat, o.lng]} icon={iconeDe(CATEGORIAS[o.categoria]?.cor || '#475569')}>
          <Popup maxWidth={260}>
            <div className="w-56 space-y-2">
              {o.foto_url && <img src={o.foto_url} alt="" className="h-28 w-full rounded-lg object-cover" loading="lazy" />}
              <div className="font-display text-[15px] font-semibold text-deep">{CATEGORIAS[o.categoria]?.nome}</div>
              <div className="text-xs text-slate-500">{o.bairro} · {o.rua} · {data(o.created_at)}</div>
              {o.descricao && <p className="!my-1 text-[13px] leading-snug text-slate-700">{o.descricao}</p>}
              <div className="flex items-center justify-between gap-2"><StatusPill status={o.status} /><span className="font-mono text-[11px] text-slate-400">{o.protocolo}</span></div>
            </div>
          </Popup>
        </Marker>
      ))}
      {escolha && <Marker position={escolha} icon={iconeDe('#0F5E6B', true)} />}
    </MapContainer>
  )
}
