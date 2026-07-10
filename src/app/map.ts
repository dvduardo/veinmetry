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

export interface ResourceMapController {
  focusLine(line: LineBalance): void
  highlightLine(lineId: string | null): void
  setStatusFilter(status: string): void
}

export function initializeResourceMap(
  result: AnalysisResult,
  onSelectLine: (line: LineBalance) => void,
): ResourceMapController | undefined {
  const container = document.querySelector<HTMLElement>('#resource-map')
  if (!container) return undefined

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
  L.control.layers({ Realistic: realistic, Game: game }, undefined, { position: 'bottomright' }).addTo(map)
  L.control.attribution({ prefix: false }).addTo(map)
  map.fitBounds(innerBounds, { padding: [20, 20] })

  // O container é dimensionado por CSS (position: absolute na viewport); o
  // Leaflet mede antes do layout estabilizar, então revalida no próximo frame.
  requestAnimationFrame(() => {
    map.invalidateSize()
    map.fitBounds(innerBounds, { padding: [30, 30] })
  })

  const markersByLine = new Map<string, L.Marker[]>()

  const controller: ResourceMapController = {
    focusLine: (line) => {
      const markers = markersByLine.get(line.id)
      if (!markers?.length) return
      map.fitBounds(L.featureGroup(markers).getBounds().pad(1.4), { maxZoom: 7 })
    },
    highlightLine: (lineId) => {
      for (const [candidateId, markers] of markersByLine) {
        for (const marker of markers) {
          marker.getElement()?.classList.toggle('is-selected', candidateId === lineId)
        }
      }
    },
    setStatusFilter: (status) => {
      for (const line of result.lines) {
        const dimmed = status !== 'all' && line.status !== status
        for (const marker of markersByLine.get(line.id) ?? []) {
          marker.getElement()?.classList.toggle('is-dimmed', dimmed)
        }
      }
    },
  }

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
      marker.on('click', () => onSelectLine(line))
      marker.addTo(map)
      const lineMarkers = markersByLine.get(line.id) ?? []
      lineMarkers.push(marker)
      markersByLine.set(line.id, lineMarkers)
    }
  }

  return controller
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

