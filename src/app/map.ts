import * as L from 'leaflet'
import type { AnalysisResult, LineBalance } from '../types'
import { escapeHtml, number, statusText } from './format'

const scimMap = {
  build: 'Stable',
  version: 1783579096,
  backgroundSize: 40_960,
  zoomRatio: 8,
  innerMin: 4_096,
  innerMax: 36_864,
  west: -418_448.91503875,
  east: 519_051.91503875,
  north: -468_750,
  south: 468_750,
}

export function initializeResourceMap(result: AnalysisResult): void {
  const container = document.querySelector<HTMLElement>('#resource-map')
  if (!container) return

  const map = L.map(container, {
    attributionControl: false,
    crs: L.CRS.Simple,
    maxBoundsViscosity: 1,
    scrollWheelZoom: true,
  })
  const fullBottomLeft = map.unproject([0, scimMap.backgroundSize], scimMap.zoomRatio)
  const fullTopRight = map.unproject([scimMap.backgroundSize, 0], scimMap.zoomRatio)
  const innerBottomLeft = map.unproject([scimMap.innerMin, scimMap.innerMax], scimMap.zoomRatio)
  const innerTopRight = map.unproject([scimMap.innerMax, scimMap.innerMin], scimMap.zoomRatio)
  const fullBounds = L.latLngBounds(fullBottomLeft, fullTopRight)
  const innerBounds = L.latLngBounds(innerBottomLeft, innerTopRight)
  const realistic = tileLayer('realisticLayer')
  const game = tileLayer('gameLayer')

  map.setMaxBounds(innerBounds)
  realistic.addTo(map)
  L.control.layers({ Realistic: realistic, Game: game }, undefined, { position: 'topright' }).addTo(map)
  L.control.attribution({ prefix: false }).addTo(map)
  map.fitBounds(innerBounds, { padding: [20, 20] })

  for (const line of result.lines) {
    for (const source of line.sources) {
      if (typeof source.x !== 'number' || typeof source.y !== 'number') continue
      const latLng = map.unproject(rasterPoint(source.x, source.y), scimMap.zoomRatio)
      if (!fullBounds.contains(latLng)) continue
      const title = `${source.itemName} · ${source.miner} · ${statusText(line)} · ${number(source.effectiveRate)}/min`
      const marker = L.marker(latLng, {
        icon: markerIcon(line.status),
        keyboard: true,
        title,
      })
      marker.bindTooltip(escapeHtml(title), { direction: 'auto', opacity: 0.95 })
      marker.on('click', () => selectLine(line.id))
      marker.addTo(map)
    }
  }
}

function rasterPoint(x: number, y: number): L.PointExpression {
  const width = scimMap.east - scimMap.west
  const height = scimMap.south - scimMap.north
  return [
    ((x - scimMap.west) / width) * scimMap.backgroundSize,
    ((y - scimMap.north) / height) * scimMap.backgroundSize,
  ]
}

function tileLayer(layer: 'realisticLayer' | 'gameLayer'): L.TileLayer {
  return L.tileLayer(
    `https://static.satisfactory-calculator.com/imgMap/${layer}/${scimMap.build}/{z}/{x}/{y}.png?v=${scimMap.version}`,
    {
      attribution: 'Map tiles © Satisfactory Calculator / Coffee Stain Studios',
      maxNativeZoom: 8,
      maxZoom: 12,
      minNativeZoom: 3,
      minZoom: 4,
      noWrap: true,
      referrerPolicy: 'no-referrer',
      tileSize: 256,
    },
  )
}

function markerIcon(status: LineBalance['status']): L.DivIcon {
  return L.divIcon({
    className: `veinmetry-marker veinmetry-marker-${status}`,
    html: '<span></span>',
    iconAnchor: [9, 9],
    iconSize: [18, 18],
  })
}

function selectLine(lineId: string | undefined): void {
  if (!lineId) return
  const target = Array.from(document.querySelectorAll<HTMLElement>('.line-card'))
    .find((card) => card.dataset.lineId === lineId)
  document.querySelectorAll('.line-card.map-selected').forEach((card) => card.classList.remove('map-selected'))
  target?.classList.add('map-selected')
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
