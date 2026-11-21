import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Marker } from 'react-leaflet'
import { useCarte, useDomaines } from '../../api/visiteur'
import Carte from '../carte/Carte'
import FichePrestataire from '../carte/FichePrestataire'
import { CENTRE_SENEGAL, RAYON_PROCHE_KM, RAYON_SENEGAL_KM, REGIONS, VUE_DEPART } from '../carte/constantes'
import { iconeMoi } from '../carte/icones'
import PointsCarte, { ZOOM_ECLATE, estDansUnGroupe } from '../carte/PointsCarte'

const sansAccents = (t = '') => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// Section « Trouver un prestataire » : filtres (vrais métiers) + fiche à gauche + carte à droite
// pleinePage : version de l'espace membre (page /carte) → pas de titre, carte sur toute la hauteur
export default function SectionCarte({ pleinePage = false }) {
  const [params, setParams] = useSearchParams()
  const domaine = params.get('domaine') ?? ''
  const ville = params.get('ville') ?? ''

  const { data: domaines = [] } = useDomaines()
  const [carte, setCarte] = useState(null)
  const [maPosition, setMaPosition] = useState(null)
  const [etatPosition, setEtatPosition] = useState('repos') // repos | recherche | refus
  const [certifiesSeuls, setCertifiesSeuls] = useState(false)
  const [actifId, setActifId] = useState(null)

  // ville tapée dans la recherche du haut → chef-lieu de région correspondant (sinon tout le Sénégal)
  const region = useMemo(() => REGIONS.find((r) => sansAccents(r.nom) === sansAccents(ville)), [ville])

  // centre et rayon de la recherche : ma position, sinon tout le pays
  const zone = maPosition
    ? { lat: maPosition[0], lng: maPosition[1], rayon: RAYON_PROCHE_KM }
    : { lat: CENTRE_SENEGAL.lat, lng: CENTRE_SENEGAL.lng, rayon: RAYON_SENEGAL_KM }
  const { data, isPending, isError } = useCarte({ ...zone, domaine })

  const visibles = useMemo(
    () => (data?.prestataires ?? []).filter((p) => !certifiesSeuls || p.certifie),
    [data, certifiesSeuls],
  )
  const actif = visibles.find((p) => p.id === actifId) ?? visibles[0]
  const rang = actif ? visibles.indexOf(actif) + 1 : 0

  // la carte va sur la ville cherchée dans le haut de page
  useEffect(() => {
    if (!carte) return
    if (region) carte.flyTo([region.lat, region.lng], 10, { duration: 1 })
    else if (!maPosition) carte.flyToBounds(VUE_DEPART, { duration: 1 })
  }, [carte, region]) // eslint-disable-line react-hooks/exhaustive-deps

  const choisir = (p) => {
    setActifId(p.id)
    if (!carte) return
    const ici = [p.position.lat, p.position.lng]
    // caché dans une bulle → on zoome pour l'ouvrir ; hors de la vue → on recentre
    if (estDansUnGroupe(carte, visibles, p)) carte.flyTo(ici, ZOOM_ECLATE, { duration: 0.8 })
    else if (!carte.getBounds().pad(-0.15).contains(ici)) carte.panTo(ici, { duration: 0.6 })
  }
  const voisin = (pas) => {
    if (!visibles.length) return
    choisir(visibles[(visibles.indexOf(actif) + pas + visibles.length) % visibles.length])
  }

  const changerDomaine = (id) => {
    const p = new URLSearchParams(params)
    if (id) p.set('domaine', id)
    else p.delete('domaine')
    setParams(p, { replace: true, preventScrollReset: true })
    setActifId(null)
  }

  const localiser = () => {
    if (!navigator.geolocation) { setEtatPosition('refus'); return }
    setEtatPosition('recherche')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const ici = [coords.latitude, coords.longitude]
        setMaPosition(ici)
        setEtatPosition('repos')
        setActifId(null)
        carte?.flyTo(ici, 11, { duration: 1 })
      },
      () => setEtatPosition('refus'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // /carte?moi=1 (bouton « Près de chez toi » du fil) : on cherche tout de suite autour du membre
  const autoMoi = params.get('moi') === '1'
  useEffect(() => {
    if (autoMoi && carte && !maPosition && etatPosition === 'repos') localiser()
  }, [autoMoi, carte]) // eslint-disable-line react-hooks/exhaustive-deps

  const toutLePays = () => {
    setMaPosition(null)
    setActifId(null)
    carte?.flyToBounds(VUE_DEPART, { duration: 1 })
  }

  const puce = (on) => `shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${on
    ? 'border-[#0174ab] bg-[#0174ab] text-white shadow-[0_8px_18px_-8px_rgba(1,116,171,.8)]'
    : 'border-slate-200 bg-white text-slate-700 hover:border-[#0174ab]/40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`

  return (
    <section id="trouver" className={pleinePage
      ? 'relative z-[1] mx-auto max-w-[1400px] px-4 py-4 sm:px-6'
      : 'mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-10'}>
      {!pleinePage && (
        <>
          <p className="text-[13px] font-bold uppercase tracking-[.16em] text-[#0174ab] dark:text-[#38bdf8]">Près de chez vous</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[44px] dark:text-white">
            Trouvez un prestataire sur la carte
          </h2>
        </>
      )}

      {/* filtres : les vrais métiers de la base */}
      <div className={`${pleinePage ? '' : 'mt-7 '}flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap`}>
        <button type="button" onClick={() => changerDomaine('')} className={puce(!domaine)}>Tous</button>
        {domaines.filter((d) => d.nombre_prestataires > 0).map((d) => (
          <button key={d.id} type="button" onClick={() => changerDomaine(String(d.id))} className={puce(domaine === String(d.id))}>
            {d.libelle}
            <span className={`ml-1.5 ${domaine === String(d.id) ? 'text-white/70' : 'text-slate-400'}`}>{d.nombre_prestataires}</span>
          </button>
        ))}
        <button type="button" onClick={() => { setCertifiesSeuls(!certifiesSeuls); setActifId(null) }}
          className={`${puce(certifiesSeuls)} border-dashed`}>
          ✓ Certifiés uniquement
        </button>
      </div>

      <div className={`${pleinePage ? 'mt-4' : 'mt-6'} grid gap-5 lg:grid-cols-[360px_1fr]`}>
        {/* fiche à gauche (sous la carte sur téléphone) */}
        <div className="order-2 lg:order-1">
          <FichePrestataire
            prestataire={actif}
            afficherDistance={Boolean(maPosition)}
            position={actif ? `${rang} sur ${visibles.length} prestataire${visibles.length > 1 ? 's' : ''}` : ''}
            onPrecedent={() => voisin(-1)}
            onSuivant={() => voisin(1)}
          />
        </div>

        {/* carte à droite */}
        <div className="relative isolate order-1 lg:order-2">
          <Carte surCarte={setCarte} className={`${pleinePage ? 'h-[420px] sm:h-[calc(100vh-215px)] sm:min-h-[460px]' : 'h-[420px] sm:h-[620px]'} border border-slate-200 dark:border-white/10`}>
            <PointsCarte prestataires={visibles} actifId={actif?.id} onChoisir={choisir} />
            {maPosition && <Marker position={maPosition} icon={iconeMoi} interactive={false} />}
          </Carte>

          {/* boutons en verre sur la carte */}
          <div className="absolute left-4 right-4 top-4 z-[500] flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/85 px-4 py-2 text-sm text-slate-600 shadow-sm backdrop-blur-md dark:bg-[#0b1a2e]/80 dark:text-slate-300">
              {isPending ? 'Chargement…' : isError ? 'Carte indisponible' : `${visibles.length} prestataire${visibles.length > 1 ? 's' : ''}${maPosition ? ' autour de vous' : ''}`}
            </span>
            <div className="ml-auto flex gap-2">
              {maPosition && (
                <button type="button" onClick={toutLePays}
                  className="rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white dark:bg-[#0b1a2e]/80 dark:text-slate-200">
                  Tout le Sénégal
                </button>
              )}
              <button type="button" onClick={localiser}
                className="flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-[#0174ab] shadow-sm backdrop-blur-md transition hover:bg-white dark:bg-[#0b1a2e]/80 dark:text-[#7dd3fc]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
                </svg>
                {etatPosition === 'recherche' ? 'Localisation…' : etatPosition === 'refus' ? 'Position refusée' : 'Autour de moi'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}