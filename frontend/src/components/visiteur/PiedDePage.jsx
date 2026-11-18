import { Link } from 'react-router-dom'

const COLONNES = [
  {
    titre: 'Plateforme',
    liens: [
      { vers: '/#accueil', libelle: 'Accueil' },
      { vers: '/#trouver', libelle: 'Trouver un prestataire' },
      { vers: '/#comment', libelle: 'Comment ça marche' },
      { vers: '/inscription', libelle: 'Devenir prestataire' },
    ],
  },
  {
    titre: 'Mon compte',
    liens: [
      { vers: '/connexion', libelle: 'Se connecter' },
      { vers: '/inscription', libelle: "S'inscrire" },
      { vers: '/mot-de-passe-oublie', libelle: 'Mot de passe oublié' },
    ],
  },
  {
    titre: 'Aide',
    liens: [{ vers: '/#faq', libelle: 'Questions fréquentes' }],
  },
]

const PAIEMENTS = ['Wave', 'Orange Money', 'Carte bancaire']
const STYLE_LIEN = 'text-slate-500 transition hover:text-[#0174ab] dark:text-[#8ea3ba] dark:hover:text-[#38bdf8]'

// Pied de page du visiteur : bandeau bleu en biais + liens + copyright
export default function PiedDePage() {
  const remonter = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className="mt-20 bg-white transition-colors duration-500 dark:bg-[#0b1a2e]">
      {/* haut : logo + bandeau « Devenir prestataire » */}
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <Link to="/" className="flex items-center gap-3 px-5 py-8 sm:px-10">
          <img src="/favicon-512.png" alt="" className="h-12 w-12 rounded-xl object-contain" />
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">JefNet</span>
        </Link>

        <div className="bande-nav bande-pied ml-auto flex w-full flex-col gap-4 px-5 py-7 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:w-[62%] lg:pl-32">
          <div className="relative">
            <p className="text-xl font-extrabold tracking-tight sm:text-2xl">Vous avez un savoir-faire ?</p>
            <p className="mt-1 text-sm text-white/85">Créez votre vitrine gratuitement et recevez les demandes de votre quartier.</p>
          </div>
          <Link to="/inscription"
            className="relative w-fit shrink-0 rounded-full bg-white px-6 py-3 font-bold text-[#0174ab] shadow-[0_8px_20px_-10px_rgba(0,0,0,.5)] transition hover:-translate-y-0.5">
            Devenir prestataire
          </Link>
        </div>
      </div>

      {/* milieu : présentation + colonnes de liens */}
      <div className="grid gap-10 px-5 py-12 sm:px-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="max-w-sm leading-relaxed text-slate-500 dark:text-[#8ea3ba]">
            La plateforme qui rapproche les clients et les prestataires indépendants du Sénégal :
            recherche près de chez vous, réservation et paiement en ligne.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {PAIEMENTS.map((p) => (
              <span key={p} className="rounded-lg bg-[#e3f1fa] px-3 py-1.5 text-xs font-bold text-[#0174ab] dark:bg-white/10 dark:text-[#7dd3fc]">
                {p}
              </span>
            ))}
          </div>
        </div>

        {COLONNES.map((c) => (
          <div key={c.titre}>
            <p className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{c.titre}</p>
            <ul className="space-y-3">
              {c.liens.map((l) => (
                <li key={l.libelle}>
                  {/* une section de l'accueil (/#faq) : simple ancre ; une autre page : lien du routeur */}
                  {l.vers.startsWith('/#') ? (
                    <a href={l.vers} className={STYLE_LIEN}>{l.libelle}</a>
                  ) : (
                    <Link to={l.vers} className={STYLE_LIEN}>{l.libelle}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* bas : copyright + haut de page */}
      <div className="mx-5 flex flex-col items-start justify-between gap-4 border-t border-slate-200 py-6 text-sm text-slate-400 sm:mx-10 sm:flex-row sm:items-center dark:border-white/10">
        <span>© {new Date().getFullYear()} JefNet · Projet de fin d'études, ISI Dakar</span>
        <button type="button" onClick={remonter}
          className="flex items-center gap-2 font-semibold text-[#0174ab] dark:text-[#7dd3fc]">
          Haut de page
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e3f1fa] transition hover:-translate-y-0.5 dark:bg-white/10">↑</span>
        </button>
      </div>
    </footer>
  )
}