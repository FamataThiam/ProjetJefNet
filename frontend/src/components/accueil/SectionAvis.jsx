import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccueil } from '../../api/visiteur'

const initiales = (nom = '') => nom.replace('.', '').split(' ').filter(Boolean).slice(0, 2).map((m) => m[0].toUpperCase()).join('')
const dateLongue = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
const virgule = (n) => n.toFixed(1).replace('.', ',')
const DECALAGES = ['lg:ml-0', 'lg:ml-24', 'lg:ml-10'] 


function Etoiles({ note, className = '' }) {
  return (
    <span className={`relative inline-block tracking-[3px] ${className}`} aria-label={`${virgule(note)} sur 5`}>
      <span className="opacity-30">★★★★★</span>
      <span className="absolute inset-0 overflow-hidden whitespace-nowrap" style={{ width: `${(note / 5) * 100}%` }}>★★★★★</span>
    </span>
  )
}

// Section « Ce que disent nos clients » : vraie note moyenne, vrais chiffres, 3 derniers avis 5 étoiles
export default function SectionAvis() {
  const { data } = useAccueil()
  const section = useRef(null)
  const [visible, setVisible] = useState(false)
  const [compte, setCompte] = useState(0)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.25 })
    if (section.current) obs.observe(section.current)
    return () => obs.disconnect()
  }, [data])

  // la note compte de 0 jusqu'à la vraie moyenne
  const cible = data?.chiffres?.note_moyenne ?? 0
  useEffect(() => {
    if (!visible || !cible) return
    let debut
    let anim
    const pas = (t) => {
      debut ??= t
      const p = Math.min(1, (t - debut) / 1200)
      setCompte(cible * (1 - (1 - p) ** 3))
      if (p < 1) anim = requestAnimationFrame(pas)
    }
    anim = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(anim)
  }, [visible, cible])

  if (!data?.avis?.length) return null
  const { avis, chiffres } = data

  return (
    <section ref={section} className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
      <div>
        <p className="text-[13px] font-bold uppercase tracking-[.16em] text-[#0174ab] dark:text-[#38bdf8]">Ils ont réservé</p>
        <h2 className="mt-2 text-3xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-[44px] dark:text-white">
          Ce que disent<br />nos clients
        </h2>

        {/* note moyenne */}
        <div className="relative mt-8 flex items-center gap-5 overflow-hidden rounded-[28px] bg-[linear-gradient(110deg,#0174ab,#1a8fd0_60%,#38b4ea)] px-7 py-6 text-white shadow-[0_24px_50px_-28px_rgba(1,116,171,.8)] dark:bg-[linear-gradient(110deg,#03314f,#0a4f7e_60%,#0174ab)]">
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(220px_90px_at_20%_0%,rgba(255,255,255,.35),transparent_70%)]" />
          <b className="relative text-6xl font-black leading-none tracking-tighter">{virgule(compte)}</b>
          <span className="relative">
            <Etoiles note={cible} className="text-xl text-[#ffd54a]" />
            <small className="mt-1 block text-[15px] text-white/90">Note moyenne sur {chiffres.avis} avis</small>
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {[[chiffres.prestataires, 'prestataires'], [chiffres.avis, 'avis de clients']].map(([n, libelle]) => (
            <div key={libelle} className="rounded-[20px] border border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-white/5">
              <b className="text-[26px] font-black text-[#0174ab] dark:text-[#7dd3fc]">{n}</b>
              <span className="block text-sm text-slate-500 dark:text-slate-400">{libelle}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e3f1fa] text-xs font-extrabold text-[#0174ab] dark:bg-white/10 dark:text-[#7dd3fc]">✓</span>
          Seuls les clients qui ont réservé peuvent laisser un avis.
        </p>
      </div>

      {/* les 3 derniers avis */}
      <div className="flex flex-col gap-4">
        {avis.map((a, i) => (
          <article key={a.id}
            className={`carte-avis relative max-w-xl rounded-[26px] border border-white bg-white/90 px-6 py-5 shadow-[0_26px_56px_-30px_rgba(1,80,130,.55)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 ${DECALAGES[i % 3]} ${visible ? 'avis-visible' : ''}`}
            style={{ transitionDelay: `${i * 160}ms` }}>
            <span className="pointer-events-none absolute right-6 top-2 font-serif text-[80px] leading-none text-[#d6ebf7] dark:text-white/10">“</span>
            <Etoiles note={a.note} className="text-base text-[#f5b301]" />
            <p className="relative mt-2 leading-relaxed text-slate-800 dark:text-slate-200">{a.commentaire}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3.5 dark:border-white/10">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e3f1fa] text-[13px] font-extrabold text-[#0174ab] dark:bg-white/10 dark:text-[#7dd3fc]">
                {initiales(a.auteur)}
              </span>
              <span>
                <b className="block text-sm text-slate-900 dark:text-white">{a.auteur}</b>
                <small className="text-[12.5px] text-slate-500 dark:text-slate-400">{dateLongue(a.date)}</small>
              </span>
              {a.prestataire && (
                <Link to={`/prestataires/${a.prestataire.id}`}
                  className="ml-auto flex items-center gap-2 rounded-full bg-[#f1f7fb] py-1 pl-1 pr-3 text-xs font-semibold text-slate-900 transition hover:bg-[#e3f1fa] dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                  <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full text-[10px] font-extrabold text-white"
                    style={{ background: a.prestataire.membre?.couleur_perso || '#0174ab' }}>
                    {a.prestataire.membre?.photo_url
                      ? <img src={a.prestataire.membre.photo_url} alt="" className="h-full w-full object-cover" />
                      : initiales(a.prestataire.nom)}
                  </span>
                  {a.prestataire.nom} · {a.prestataire.titre}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}