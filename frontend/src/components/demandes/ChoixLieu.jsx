import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { Marker, useMapEvents } from 'react-leaflet'
import Carte from '../carte/Carte'
import { REGIONS } from '../carte/constantes'
import { dansLeSenegal } from '../devenir/donnees'

const epingle = L.divIcon({ className: '', html: '<span class="dm-epingle"></span>', iconSize: [32, 40], iconAnchor: [16, 40] })
const sansAccents = (t = '') => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function ClicCarte({ onClic }) {
  useMapEvents({ click: (e) => onClic(e.latlng.lat, e.latlng.lng) })
  return null
}


export default function ChoixLieu({ position, ville, onChange, erreur }) {
  const carte = useRef(null)
  const [gps, setGps] = useState({ etat: '', message: '' })

  useEffect(() => {
    const m = carte.current
    if (!m) return
    if (position) return void m.setView([position.latitude, position.longitude], 10)
    const r = REGIONS.find((x) => sansAccents(x.nom) === sansAccents(ville))
    if (r) m.flyTo([r.lat, r.lng], 9, { duration: 0.6 })
  }, [ville]) 

  const placer = (lat, lng, source) => {
    if (!dansLeSenegal(lat, lng)) {
      setGps({ etat: 'erreur', message: 'Ce point est hors du Sénégal. Clique sur la carte pour le placer.' })
      return
    }
    onChange({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)), source })
    setGps({ etat: '', message: '' })
    carte.current?.flyTo([lat, lng], Math.max(carte.current.getZoom(), 10), { duration: 0.6 })
  }

  const maPosition = () => {
    if (!navigator.geolocation) return setGps({ etat: 'erreur', message: 'Ton navigateur ne donne pas la position. Clique sur la carte.' })
    setGps({ etat: 'recherche', message: '' })
    navigator.geolocation.getCurrentPosition(
      (p) => placer(p.coords.latitude, p.coords.longitude, 'gps'),
      () => setGps({ etat: 'erreur', message: 'Position refusée ou introuvable. Clique sur la carte pour placer le point.' }),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <>
      <div className="dm-carte">
        <Carte className="h-[260px]" surCarte={carte}>
          <ClicCarte onClic={(lat, lng) => placer(lat, lng, 'carte')} />
          {position && <Marker position={[position.latitude, position.longitude]} icon={epingle} />}
        </Carte>
        <div className="dm-outils">
          <button type="button" onClick={maPosition} disabled={gps.etat === 'recherche'}>{gps.etat === 'recherche' ? 'Recherche…' : 'Utiliser ma position'}</button>
          <span>ou clique sur la carte</span>
        </div>
      </div>
      {gps.message ? <p className="rs-champ-err">{gps.message}</p>
        : position ? <p className="dm-etat-pos">{position.source === 'gps' ? 'Position trouvée' : 'Point placé sur la carte'}</p>
          : <p className={erreur ? 'rs-champ-err' : 'rs-aide'}>{erreur || 'Place le point du lieu : il sert à montrer ta demande aux prestataires proches.'}</p>}
    </>
  )
}