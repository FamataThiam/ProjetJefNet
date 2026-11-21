import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { Circle, Marker, useMapEvents } from 'react-leaflet'
import Carte from '../carte/Carte'
import { REGIONS } from '../carte/constantes'
import { RAYONS, dansLeSenegal } from './donnees'

const epingle = L.divIcon({ className: '', html: '<span class="epingle-dp"></span>', iconSize: [34, 42], iconAnchor: [17, 42] })


function ClicCarte({ onClic }) {
  useMapEvents({ click: (e) => onClic(e.latlng.lat, e.latlng.lng) })
  return null
}

const sansAccents = (t = '') => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function EtapeZone({ zone, changer, rayons, membre, erreurs }) {
  const carte = useRef(null)
  const [gps, setGps] = useState({ etat: '', message: '' })


  useEffect(() => {
    const m = carte.current
    if (!m) return
    if (zone.position) return void m.setView([zone.position.latitude, zone.position.longitude], 10)
    const ville = REGIONS.find((r) => sansAccents(r.nom) === sansAccents(membre?.ville))
    if (ville) m.setView([ville.lat, ville.lng], 9)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const placer = (lat, lng, source) => {
    if (!dansLeSenegal(lat, lng)) {
      setGps({ etat: 'erreur', message: 'Cette position est hors du Sénégal. Clique sur la carte pour te placer.' })
      return
    }
    changer({ position: { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) }, source })
    setGps({ etat: '', message: '' })
    carte.current?.flyTo([lat, lng], Math.max(carte.current.getZoom(), 10), { duration: 0.8 })
  }

  const maPosition = () => {
    if (!navigator.geolocation) return setGps({ etat: 'erreur', message: 'Ton navigateur ne donne pas la position. Clique sur la carte.' })
    setGps({ etat: 'recherche', message: 'Recherche de ta position…' })
    navigator.geolocation.getCurrentPosition(
      (p) => placer(p.coords.latitude, p.coords.longitude, 'gps'),
      () => setGps({ etat: 'erreur', message: 'Position refusée ou introuvable. Clique sur la carte pour te placer.' }),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  
  const sousTitre = { LOCALITE: membre?.localite, VILLE: membre?.ville, REGION: membre?.ville, PAYS: 'Partout' }
  const valeurs = rayons?.length ? rayons.map((r) => r.value) : Object.keys(RAYONS)
  const km = RAYONS[zone.rayon]?.km

  return (
    <div className="vue-dp">
      <h2>Ma zone d'intervention</h2>
      <p className="sous">Jusqu'où es-tu prêt·e à te déplacer ? Ta position te place sur la carte des clients.</p>

      <div className="rayons-dp">
        {valeurs.map((v, i) => (
          <button key={v} type="button" className={zone.rayon === v ? 'on' : ''} onClick={() => changer({ rayon: v })}>
            <span className="cercle"><i style={{ width: 16 + i * 8, height: 16 + i * 8 }} /></span>
            <b>{RAYONS[v]?.libelle ?? v}</b>
            <small>{sousTitre[v] || ' '}</small>
          </button>
        ))}
      </div>
      {erreurs.rayon && <p className="msg-erreur">{erreurs.rayon}</p>}

      <div className="carte-dp">
        <Carte className="h-[300px]" surCarte={carte}>
          <ClicCarte onClic={(lat, lng) => placer(lat, lng, 'carte')} />
          {zone.position && (
            <>
              {km && <Circle center={[zone.position.latitude, zone.position.longitude]} radius={km * 1000}
                pathOptions={{ color: '#0174ab', weight: 1.5, fillColor: '#0174ab', fillOpacity: 0.12 }} />}
              <Marker position={[zone.position.latitude, zone.position.longitude]} icon={epingle} />
            </>
          )}
        </Carte>
        <div className="outils-carte">
          <button type="button" className="btn-pos" onClick={maPosition} disabled={gps.etat === 'recherche'}>
            {gps.etat === 'recherche' ? 'Recherche…' : 'Utiliser ma position'}
          </button>
          <span>ou clique sur la carte</span>
        </div>
      </div>

      {gps.message ? <p className={gps.etat === 'erreur' ? 'msg-erreur' : 'etat-pos attente'}>{gps.message}</p>
        : zone.position ? <p className="etat-pos">{zone.source === 'gps' ? 'Position trouvée' : 'Position choisie sur la carte'}</p>
          : erreurs.position && <p className="msg-erreur">{erreurs.position}</p>}
    </div>
  )
}