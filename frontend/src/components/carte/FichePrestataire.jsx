import { Link } from 'react-router-dom'
import { usePhotosRealisations, usePrestataire } from '../../api/visiteur'
import { initiales } from './icones'

const prix = (n) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/\u202f|\u00a0/g, ' ')} FCFA`
const km = (d) => (d < 1 ? `à ${Math.round(d * 1000)} m` : `à ${String(d).replace('.', ',')} km`)

// Badge bleu « certifié »
function Certifie() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#0174ab] dark:text-[#38bdf8]" aria-label="Prestataire certifié">
      <path fill="currentColor" d="M12 1.5l2.6 1.9 3.2-.1 1 3.1 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3.1-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3.1-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3.1 3.2.1z" />
      <path d="M8 12.2l2.6 2.6L16.2 9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Fiche du prestataire sélectionné sur la carte.
// `p` vient de la carte ; le quartier, la biographie et les photos sont chargés à part.
export default function FichePrestataire({ prestataire: p, afficherDistance, position, onPrecedent, onSuivant }) {
  const { data: profil } = usePrestataire(p?.id)
  const { data: photos = [], isPending: photosEnCours } = usePhotosRealisations(p?.id)

  if (!p) {
    return (
      <aside className="flex min-h-[300px] items-center justify-center rounded-[28px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-[#0b1a2e] dark:text-slate-400">
        Aucun prestataire trouvé ici pour l'instant. Essayez un autre métier ou « Tout le Sénégal ».
      </aside>
    )
  }

  const membre = profil?.prestataire?.membre
  const lieu = [membre?.localite, membre?.ville].filter(Boolean).join(', ')
  const vignettes = [...photos, null, null, null].slice(0, 3)

  return (
    <aside key={p.id} className="fiche-entree flex flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_50px_-30px_rgba(1,80,130,.5)] dark:border-white/10 dark:bg-[#0b1a2e]">
      {/* bandeau + photo */}
      <div className="relative h-24 shrink-0 bg-gradient-to-r from-[#e3f1fa] to-[#cfe8f7] dark:from-[#12304f] dark:to-[#0a4f7e]">
        {afficherDistance && (
          <span className="absolute right-4 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0174ab] shadow-sm dark:bg-[#0b1a2e] dark:text-[#7dd3fc]">
            {km(p.distance_km)}
          </span>
        )}
        <div className="absolute -bottom-10 left-6 grid h-20 w-20 place-items-center overflow-hidden rounded-full border-4 border-white text-2xl font-extrabold text-white dark:border-[#0b1a2e]"
          style={{ background: membre?.couleur_perso || '#0174ab' }}>
          {p.photo_url ? <img src={p.photo_url} alt="" className="h-full w-full object-cover" /> : initiales(p.nom)}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-14">
        <div>
          <h3 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {p.nom} {p.certifie && <Certifie />}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.titre}{lieu && ` · ${lieu}`}</p>
        </div>

        {profil?.biographie && (
          <p className="line-clamp-3 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{profil.biographie}</p>
        )}

        {/* note */}
        <div>
          <div className="flex justify-between text-sm">
            <span className="font-bold text-slate-900 dark:text-white">
              {p.nombre_avis > 0 ? `★ ${p.note_moyenne.toFixed(1).replace('.', ',')}` : 'Nouveau'}
            </span>
            <span className="text-slate-500 dark:text-slate-400">{p.nombre_avis} avis</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-[#0174ab] dark:bg-[#38bdf8]" style={{ width: `${(p.note_moyenne / 5) * 100}%` }} />
          </div>
        </div>

        {/* dernières réalisations */}
        <div className="grid grid-cols-3 gap-2">
          {vignettes.map((url, i) => (
            <div key={i} className="realisation relative aspect-[4/3] overflow-hidden rounded-xl">
              {url
                ? <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                : !photosEnCours && <span className="absolute bottom-1.5 left-2 text-[11px] text-slate-500 dark:text-slate-400">Réalisation</span>}
            </div>
          ))}
        </div>

        {p.prix_min != null && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">À partir de</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">{prix(p.prix_min)}</span>
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-3">
          <Link to={`/prestataires/${p.id}`}
            className="rounded-full border-2 border-[#0174ab] py-3 text-center font-bold text-[#0174ab] transition hover:bg-[#e3f1fa] dark:border-[#38bdf8] dark:text-[#7dd3fc] dark:hover:bg-white/5">
            Voir le profil
          </Link>
          <Link to={`/connexion?suite=${encodeURIComponent(`/prestataires/${p.id}#reserver`)}`}
            className="rounded-full bg-[#0174ab] py-3 text-center font-bold text-white transition hover:bg-[#015d8a]">
            Réserver
          </Link>
          <button type="button" onClick={onPrecedent}
            className="rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
            ← Précédent
          </button>
          <button type="button" onClick={onSuivant}
            className="rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
            Suivant →
          </button>
        </div>
        <p className="text-center text-xs text-slate-400">{position}</p>
      </div>
    </aside>
  )
}