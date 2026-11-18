import { useEffect, useMemo, useState } from 'react'
import senegal from '../carte/senegal.json'


const versXY = ([lng, lat]) => [(lng + 17.6) * 92, (16.75 - lat) * 100]
const pourcent = ([x, y]) => ({ left: `${(x / 580) * 100}%`, top: `${(y / 445) * 100}%` })

function chemin(geometrie) {
  const polygones = geometrie.type === 'Polygon' ? [geometrie.coordinates] : geometrie.coordinates
  return polygones
    .map((p) => 'M' + p[0].map((c) => versXY(c).map((v) => v.toFixed(1)).join(',')).join(' L') + 'Z')
    .join(' ')
}

const PAYS = chemin(senegal.contour.geometry)
const GAMBIE = chemin(senegal.gambie.geometry)

const VILLES = Object.fromEntries(senegal.regions.map((r) => [r.nom.toLowerCase(), [r.lng, r.lat]]))

const nomDe = (p) => `${p.prestataire.prenom} ${p.prestataire.nom}`
const initiales = (p) => `${p.prestataire.prenom[0] ?? ''}${p.prestataire.nom[0] ?? ''}`.toUpperCase()


export default function CarteAnimee({ prestataires = [], nbMetiers }) {

  const epingles = useMemo(() => {
    const villes = new Map()
    for (const p of prestataires) {
      const ville = p.prestataire?.membre?.ville?.toLowerCase()
      if (!VILLES[ville]) continue
      if (!villes.has(ville)) villes.set(ville, { p, nombre: 0, xy: versXY(VILLES[ville]) })
      villes.get(ville).nombre += 1
    }
    return [...villes.values()].slice(0, 6)
  }, [prestataires])

 
  const [vu, setVu] = useState(0)
  useEffect(() => {
    if (prestataires.length < 2) return
    const t = setInterval(() => setVu((i) => (i + 1) % prestataires.length), 3000)
    return () => clearInterval(t)
  }, [prestataires.length])
  const enAvant = prestataires[vu]

  const trajet = epingles.map((e) => e.xy.map((v) => v.toFixed(1)).join(',')).join(' L')

  return (
    <div className="carte-animee relative aspect-[10/11] w-full sm:aspect-[10/9] overflow-hidden rounded-[32px] border border-[#e3eef6] dark:border-white/10">
      {/* étiquettes du haut */}
      <div className="verre-carte absolute left-5 top-5 z-10 flex items-center gap-2.5" style={{ animationDelay: '.2s' }}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e3f1fa] text-[#0174ab] dark:bg-white/10 dark:text-[#7dd3fc]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5L16 10" /></svg>
        </span>
        <span>
          <b className="block text-[13.5px] text-slate-900 dark:text-white">Prestataires vérifiés</b>
          <small className="text-xs text-slate-500 dark:text-slate-400">Justificatifs contrôlés</small>
        </span>
      </div>
      {nbMetiers > 0 && (
        <div className="verre-carte absolute right-5 top-5 z-10 hidden sm:block" style={{ animationDelay: '.5s' }}>
          <b className="block text-xl font-extrabold text-[#0174ab] dark:text-[#7dd3fc]">{nbMetiers}</b>
          <small className="text-xs text-slate-500 dark:text-slate-400">métiers disponibles</small>
        </div>
      )}

      {/* le pays en relief */}
      <div className="scene-carte">
        <div className="plan-carte">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <svg key={i} viewBox="0 0 580 445" className="couche-carte" style={{ transform: `translateZ(-${i * 3}px)` }}>
              <path d={PAYS} />
            </svg>
          ))}
          <svg viewBox="0 0 580 445" className="dessus-carte">
            <path className="pays" pathLength="1" d={PAYS} />
            <path className="gambie" d={GAMBIE} />
            {epingles.length > 1 && (
              <>
                <path className="liens" d={`M${trajet}`} />
                <circle className="comete" r="5">
                  <animateMotion dur={`${epingles.length}s`} repeatCount="indefinite" path={`M${trajet}`} />
                </circle>
              </>
            )}
          </svg>

          {epingles.map(({ p, xy, nombre }, i) => (
            <div key={p.id} className="epingle-carte" style={{ ...pourcent(xy), '--d': `${0.3 + i * 0.25}s` }}>
              <span className="sol" />
              <span className="onde" />
              <div className="debout">
                <span className="tige" />
                <span className="tete" style={{ background: p.prestataire.membre?.couleur_perso || '#0174ab' }} title={nomDe(p)}>
                  {p.prestataire.membre?.photo_url
                    ? <img src={p.prestataire.membre.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
                    : initiales(p)}
                  {nombre > 1 && <span className="nombre">+{nombre - 1}</span>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* étiquette du bas : les prestataires défilent */}
      {enAvant && (
        <div className="verre-carte absolute bottom-5 right-5 z-10 max-w-[calc(100%-40px)]" style={{ animationDelay: '2.2s' }}>
          <div key={enAvant.id} className="defile-carte flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-extrabold text-white"
              style={{ background: enAvant.prestataire.membre?.couleur_perso || '#0174ab' }}>
              {enAvant.prestataire.membre?.photo_url
                ? <img src={enAvant.prestataire.membre.photo_url} alt="" className="h-full w-full object-cover" />
                : initiales(enAvant)}
            </span>
            <span className="min-w-0">
              <b className="block truncate text-[13.5px] text-slate-900 dark:text-white">
                {nomDe(enAvant)} · {enAvant.titre_professionnel}
              </b>
              <small className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {[enAvant.prestataire.membre?.localite, enAvant.prestataire.membre?.ville].filter(Boolean).join(', ')}
                {enAvant.nombre_avis > 0 && ` · ★ ${Number(enAvant.note_moyenne).toFixed(1).replace('.', ',')}`}
              </small>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}