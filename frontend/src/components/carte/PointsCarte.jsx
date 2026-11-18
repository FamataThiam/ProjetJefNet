import { useMemo, useState } from 'react'
import L from 'leaflet'
import { Marker, useMap, useMapEvents } from 'react-leaflet'
import { iconePrestataire } from './icones'

const ECART = 46        
const ZOOM_ECLATE = 9


const iconeGroupe = (nombre) => {
  const taille = nombre < 10 ? 46 : 56
  return L.divIcon({
    className: '',
    html: `<span class="groupe-jef">${nombre}</span>`,
    iconSize: [taille, taille],
    iconAnchor: [taille / 2, taille / 2],
  })
}


export default function PointsCarte({ prestataires, actifId, onChoisir }) {
  const carte = useMap()
  const [vue, setVue] = useState(0)
  useMapEvents({ zoomend: () => setVue((v) => v + 1), moveend: () => setVue((v) => v + 1) })

  const groupes = useMemo(() => {
    const liste = []
    for (const p of prestataires) {
      const point = carte.latLngToLayerPoint([p.position.lat, p.position.lng])
      const proche = liste.find((g) => g.point.distanceTo(point) < ECART)
      if (proche) proche.membres.push(p)
      else liste.push({ point, membres: [p] })
    }
    return liste
  }, [prestataires, carte, vue]) 

  const zoom = carte.getZoom()

  return groupes.flatMap((g) => {
    const [premier] = g.membres

    
    if (g.membres.length === 1) {
      const actif = premier.id === actifId
      return (
        <Marker key={premier.id} position={[premier.position.lat, premier.position.lng]} zIndexOffset={actif ? 1000 : 0}
          icon={iconePrestataire({ nom: premier.nom, photo: premier.photo_url, actif, certifie: premier.certifie })}
          eventHandlers={{ click: () => onChoisir(premier) }} />
      )
    }

    const centre = carte.layerPointToLatLng(g.point)

   
    if (zoom >= ZOOM_ECLATE) {
      const rayon = 26 + g.membres.length * 4
      return g.membres.map((p, i) => {
        const angle = (2 * Math.PI * i) / g.membres.length - Math.PI / 2
        const actif = p.id === actifId
        const icone = iconePrestataire({ nom: p.nom, photo: p.photo_url, actif, certifie: p.certifie })
        const [l, h] = icone.options.iconSize
        icone.options.iconAnchor = [l / 2 - Math.cos(angle) * rayon, h / 2 - Math.sin(angle) * rayon]
        return (
          <Marker key={p.id} position={centre} zIndexOffset={actif ? 1000 : 0}
            icon={icone} eventHandlers={{ click: () => onChoisir(p) }} />
        )
      })
    }

  
    const contientActif = g.membres.some((p) => p.id === actifId)
    return (
      <Marker key={`groupe-${premier.id}`} position={centre} zIndexOffset={contientActif ? 900 : 0}
        icon={iconeGroupe(g.membres.length)}
        eventHandlers={{
          click: () => {
            const limites = L.latLngBounds(g.membres.map((p) => [p.position.lat, p.position.lng]))
            carte.flyToBounds(limites.pad(0.5), { maxZoom: ZOOM_ECLATE, duration: 0.8 })
          },
        }} />
    )
  })
}


export function estDansUnGroupe(carte, prestataires, p) {
  if (!carte || carte.getZoom() >= ZOOM_ECLATE) return false
  const point = carte.latLngToLayerPoint([p.position.lat, p.position.lng])
  return prestataires.some((q) => q.id !== p.id
    && carte.latLngToLayerPoint([q.position.lat, q.position.lng]).distanceTo(point) < ECART)
}

export { ZOOM_ECLATE }