import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BoutonMode from './BoutonMode'

const LIENS = [
  { href: '#accueil', libelle: 'Accueil' },
  { href: '#trouver', libelle: 'Trouver un prestataire' },
  { href: '#comment', libelle: 'Comment ça marche' },
]

// Barre de navigation du visiteur, sur toute la largeur :
// blanche à gauche, bandeau bleu en biais à droite
export default function BarreNavigation() {
  const [actif, setActif] = useState(() => window.location.hash || '#accueil')
  const [ouvert, setOuvert] = useState(false)

  // l'onglet suit l'ancre de l'adresse (#trouver, #comment…)
  useEffect(() => {
    const suivre = () => setActif(window.location.hash || '#accueil')
    window.addEventListener('hashchange', suivre)
    return () => window.removeEventListener('hashchange', suivre)
  }, [])

  return (
    <header className="sticky top-0 z-50">
      <nav className="relative flex h-[70px] w-full items-center bg-white pl-5 shadow-[0_10px_30px_-18px_rgba(1,80,130,.45)] transition-colors duration-500 sm:h-[78px] sm:pl-10 dark:bg-[#0b1a2e]">
        {/* logo */}
        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <img src="/favicon-512.png" alt="" className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-white">JefNet</span>
        </Link>

        {/* onglets */}
        <div className="relative z-10 ml-16 hidden gap-9 lg:flex">
          {LIENS.map((l) => (
            <a key={l.href} href={`/${l.href}`} onClick={() => setActif(l.href)}
              className={`relative py-2 text-[15px] transition-colors
                ${actif === l.href
                  ? 'font-bold text-slate-900 after:absolute after:inset-x-0 after:-bottom-1 after:h-[3px] after:rounded-full after:bg-[#0174ab] dark:text-white dark:after:bg-[#38bdf8]'
                  : 'font-medium text-slate-500 hover:text-slate-900 dark:text-[#8ea3ba] dark:hover:text-white'}`}>
              {l.libelle}
            </a>
          ))}
        </div>

        {/* bandeau bleu en biais, collé au bord droit de l'écran */}
        <div className="bande-nav ml-auto flex h-full items-center gap-3 pl-16 pr-4 sm:pl-24 sm:pr-10">
          <BoutonMode />
          <Link to="/connexion"
            className="hidden rounded-full border border-white/50 bg-white/15 px-5 py-2.5 text-[15px] font-semibold text-white backdrop-blur-md transition hover:bg-white/25 sm:block">
            Se connecter
          </Link>
          <Link to="/inscription"
            className="hidden rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-[#0174ab] shadow-[0_6px_16px_-8px_rgba(0,0,0,.4)] transition hover:-translate-y-0.5 sm:block">
            S'inscrire
          </Link>
          {/* menu sur téléphone et tablette */}
          <button type="button" onClick={() => setOuvert(!ouvert)} aria-label="Ouvrir le menu" aria-expanded={ouvert}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/50 bg-white/15 text-white backdrop-blur-md lg:hidden">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {ouvert ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {ouvert && (
        <div className="w-full border-t border-slate-100 bg-white p-3 shadow-[0_14px_30px_-20px_rgba(1,80,130,.45)] lg:hidden dark:border-white/10 dark:bg-[#0b1a2e]">
          {LIENS.map((l) => (
            <a key={l.href} href={`/${l.href}`} onClick={() => { setActif(l.href); setOuvert(false) }}
              className={`block rounded-xl px-4 py-3 font-medium ${actif === l.href ? 'bg-[#e3f1fa] text-[#0174ab] dark:bg-white/10 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
              {l.libelle}
            </a>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:hidden">
            <Link to="/connexion" className="rounded-full border border-slate-200 py-3 text-center font-semibold text-slate-800 dark:border-white/20 dark:text-white">Se connecter</Link>
            <Link to="/inscription" className="rounded-full bg-[#0174ab] py-3 text-center font-semibold text-white">S'inscrire</Link>
          </div>
        </div>
      )}
    </header>
  )
}