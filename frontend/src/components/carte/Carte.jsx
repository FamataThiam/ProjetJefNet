import 'leaflet/dist/leaflet.css'
import './carte.css'
import { useState } from 'react'
import { GeoJSON, MapContainer, Marker, ZoomControl, useMapEvents } from 'react-leaflet'
import { CONTOUR_GAMBIE, CONTOUR_SENEGAL, ETIQUETTES, LIMITES_MAX, REGIONS, VUE_DEPART } from './constantes'
import { etiquette, etiquetteVille } from './icones'

// Quand on zoome, on écrit le nom des villes pour garder ses repères
function NomsDesVilles() {
  const [zoom, setZoom] = useState(0)
  const carte = useMapEvents({ zoomend: () => setZoom(carte.getZoom()) })
  if ((zoom || carte.getZoom()) < 7.5) return null
  return REGIONS.map((r) => (
    <Marker key={r.nom} position={[r.lat, r.lng]} icon={etiquetteVille(r.nom)} interactive={false} />
  ))
}

// Carte du Sénégal : fond à points, pays bleu clair, contour bleu, Gambie découpée.
// `surCarte` reçoit l'objet carte de Leaflet (pour la déplacer depuis l'extérieur).
export default function Carte({ className = 'h-[560px]', surCarte, children }) {
  return (
    <div className={`carte-jef relative isolate overflow-hidden rounded-[28px] ${className}`}>
      <MapContainer
        ref={surCarte}
        bounds={VUE_DEPART}
        maxBounds={LIMITES_MAX}
        maxBoundsViscosity={0.9}
        minZoom={5.5}
        maxZoom={11}
        zoomSnap={0.25}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        {/* pays un peu transparent : on voit toujours les petits points du fond */}
        <GeoJSON data={CONTOUR_SENEGAL} interactive={false}
          style={{ className: 'pays-senegal', color: '#0174ab', weight: 2, fillColor: '#d6ebf7', fillOpacity: 0.65, lineJoin: 'round' }} />
        <GeoJSON data={CONTOUR_GAMBIE} interactive={false}
          style={{ className: 'pays-gambie', color: '#8fc4e2', weight: 1.2, fillColor: '#ffffff', fillOpacity: 1, lineJoin: 'round' }} />

        {ETIQUETTES.map((e) => (
          <Marker key={e.nom} position={[e.lat, e.lng]} icon={etiquette(e)} interactive={false} />
        ))}
        <NomsDesVilles />

        <ZoomControl position="bottomright" />
        {children}
      </MapContainer>
    </div>
  )
}