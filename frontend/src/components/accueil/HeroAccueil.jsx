import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDomaines, usePrestatairesApercu } from '../../api/visiteur'
import CarteAnimee from './CarteAnimee'


const motDe = (libelle) => libelle.split(/[&,]/)[0].trim().toLowerCase()

const TEXTES = {
  trouver: {
    titre: 'Trouvez les meilleurs pros du Sénégal en',
    points: [
      'Des prestataires vérifiés, près de chez vous',
      'Leurs vraies réalisations en photos avant / après',
      'Paiement par Wave, Orange Money ou carte',
    ],
  },
  proposer: {
    titre: 'Faites connaître votre savoir-faire en',
    points: [
      'Créez votre vitrine gratuitement',
      'Publiez vos réalisations avant / après',
      'Recevez les demandes de votre quartier',
    ],
  },
}


export default function HeroAccueil() {
  const naviguer = useNavigate()
  const { data: domaines = [] } = useDomaines()
  const { data: prestataires = [] } = usePrestatairesApercu()
  const [onglet, setOnglet] = useState('trouver')
  const [domaine, setDomaine] = useState('')
  const [ville, setVille] = useState('')


  const mots = useMemo(() => domaines.filter((d) => d.nombre_prestataires > 0).map((d) => motDe(d.libelle)), [domaines])
  const [i, setI] = useState(0)
  useEffect(() => {
    if (mots.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % mots.length), 3000)
    return () => clearInterval(t)
  }, [mots.length])

  const chercher = (e) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (domaine) p.set('domaine', domaine)
    if (ville.trim()) p.set('ville', ville.trim())
    naviguer(`/?${p}#trouver`)
    document.getElementById('trouver')?.scrollIntoView({ behavior: 'smooth' })
  }

  const texte = TEXTES[onglet]

  return (
    <section id="accueil" className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:px-10 lg:grid-cols-[1fr_.9fr] lg:gap-24 lg:pt-16">
      <div>
        {/* onglets */}
        <div className="inline-flex rounded-full bg-[#e8f1f8] p-1 text-xs font-bold tracking-wider sm:text-[13px] dark:bg-white/10">
          {[['trouver', 'TROUVER UN PRESTATAIRE'], ['proposer', 'PROPOSER MES SERVICES']].map(([cle, libelle]) => (
            <button key={cle} type="button" onClick={() => setOnglet(cle)}
              className={`rounded-full px-4 py-2.5 transition ${onglet === cle
                ? 'bg-white text-slate-900 shadow-[0_4px_12px_-6px_rgba(1,80,130,.4)] dark:bg-[#0174ab] dark:text-white'
                : 'text-[#5b7489] hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
              {libelle}
            </button>
          ))}
        </div>

        {/* titre avec le métier qui change */}
        <h1 className="mt-6 text-[40px] font-black leading-[1.03] tracking-tight text-slate-900 sm:text-6xl dark:text-white">
          {texte.titre}{' '}
          <span key={mots[i]} className="mot-accueil inline-block bg-gradient-to-r from-[#0174ab] to-[#38b4ea] bg-clip-text text-transparent">
            {mots[i] ?? '…'}
          </span>
        </h1>

        <ul className="mt-6 space-y-2.5">
          {texte.points.map((t) => (
            <li key={t} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#e3f1fa] text-[13px] font-extrabold text-[#0174ab] dark:bg-white/10 dark:text-[#7dd3fc]">✓</span>
              {t}
            </li>
          ))}
        </ul>

        {onglet === 'trouver' ? (
          <form onSubmit={chercher}
            className="mt-8 grid gap-1 rounded-3xl border border-white bg-white/85 p-2 shadow-[0_24px_50px_-28px_rgba(1,80,130,.55)] backdrop-blur-xl sm:grid-cols-[1fr_1fr_auto] dark:border-white/10 dark:bg-white/5">
            <label className="rounded-2xl px-4 py-2.5">
              <span className="block text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400">SERVICE</span>
              <select value={domaine} onChange={(e) => setDomaine(e.target.value)}
                className="mt-1 w-full cursor-pointer bg-transparent text-[15px] text-slate-800 outline-none dark:text-white">
                <option value="">Tous les métiers</option>
                {domaines.map((d) => <option key={d.id} value={d.id}>{d.libelle}</option>)}
              </select>
            </label>
            <label className="rounded-2xl px-4 py-2.5 sm:border-l sm:border-[#e2ebf2] dark:sm:border-white/10">
              <span className="block text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400">OÙ ?</span>
              <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Quartier ou ville"
                className="mt-1 w-full bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" />
            </label>
            <button type="submit"
              className="self-center rounded-full bg-gradient-to-r from-[#0174ab] to-[#1a8fd0] px-12 py-3 font-bold text-white shadow-[0_10px_24px_-10px_rgba(1,116,171,.9)] transition hover:brightness-110">
              Rechercher
            </button>
          </form>
        ) : (
          <Link to="/inscription"
            className="mt-8 inline-block rounded-full bg-gradient-to-r from-[#0174ab] to-[#1a8fd0] px-8 py-4 font-bold text-white shadow-[0_10px_24px_-10px_rgba(1,116,171,.9)] transition hover:-translate-y-0.5">
            Devenir prestataire
          </Link>
        )}
      </div>

      <CarteAnimee prestataires={prestataires} nbMetiers={domaines.length} />
    </section>
  )
}