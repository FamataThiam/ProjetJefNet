import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const ICONES = {
  chercher: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  discuter: <path d="M4 5h16v11H9l-5 4z" />,
  reserver: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" /></>,
  profil: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  photo: <><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 8" /></>,
  cloche: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 21h4" /></>,
}

const ETAPES = {
  cherche: [
    { icone: 'chercher', titre: 'Cherchez près de vous', texte: 'Choisissez un métier et votre quartier, ou explorez la carte du Sénégal.', puces: ['Carte', 'Filtres par métier', 'Autour de moi'] },
    { icone: 'discuter', titre: 'Comparez et discutez', texte: 'Regardez les réalisations avant / après, les avis et le badge certifié. Écrivez-lui ou appelez-le en vidéo.', puces: ['Avis vérifiés', 'Messagerie', 'Appel vidéo'] },
    { icone: 'reserver', titre: 'Réservez et payez', texte: 'Choisissez un créneau, payez en ligne, puis signez le rapport et laissez votre avis.', puces: ['Wave', 'Orange Money', 'Carte bancaire'] },
  ],
  propose: [
    { icone: 'profil', titre: 'Créez votre profil pro', texte: 'Inscrivez-vous gratuitement, puis ajoutez vos services, vos tarifs et votre zone d’intervention.', puces: ['Gratuit', 'Services', 'Tarifs'] },
    { icone: 'photo', titre: 'Publiez vos réalisations', texte: 'Montrez votre travail en photos avant / après et demandez le badge certifié.', puces: ['Avant / après', 'Badge certifié'] },
    { icone: 'cloche', titre: 'Recevez des réservations', texte: 'Les clients de votre quartier vous trouvent, réservent et paient en ligne. Vos avis font votre réputation.', puces: ['Demandes proches', 'Paiement sécurisé', 'Avis'] },
  ],
}


export default function SectionComment() {
  const [onglet, setOnglet] = useState('cherche')
  const [visible, setVisible] = useState(false)
  const section = useRef(null)


  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.2 })
    if (section.current) obs.observe(section.current)
    return () => obs.disconnect()
  }, [])

  const allerALaCarte = () => document.getElementById('trouver')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="comment" ref={section} className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 text-center sm:px-10">
      <p className="text-[13px] font-bold uppercase tracking-[.16em] text-[#0174ab] dark:text-[#38bdf8]">Comment ça marche</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[46px] dark:text-white">
        {onglet === 'cherche' ? 'Trouver le bon pro en 3 étapes' : 'Proposer vos services en 3 étapes'}
      </h2>
      <p className="mt-3 text-[17px] text-slate-500 dark:text-slate-400">Simple, sûr et près de chez vous.</p>

      <div className="mt-7 inline-flex rounded-full bg-[#e8f1f8] p-1 text-sm font-bold dark:bg-white/10">
        {[['cherche', 'Je cherche un prestataire'], ['propose', 'Je propose mes services']].map(([cle, libelle]) => (
          <button key={cle} type="button" onClick={() => setOnglet(cle)}
            className={`rounded-full px-4 py-2.5 transition sm:px-5 ${onglet === cle
              ? 'bg-white text-slate-900 shadow-[0_4px_12px_-6px_rgba(1,80,130,.4)] dark:bg-[#0174ab] dark:text-white'
              : 'text-[#5b7489] hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
            {libelle}
          </button>
        ))}
      </div>

      <div className="relative mt-14">
        {/* ligne pointillée entre les numéros, avec un point qui voyage (ordinateur) */}
        <div className="ligne-etapes absolute left-[16.6%] right-[16.6%] top-[33px] hidden h-[3px] md:block">
          <span className="point-etapes" />
        </div>

        <div className="grid gap-8 md:grid-cols-3 md:gap-7">
          {ETAPES[onglet].map((e, i) => (
            <div key={`${onglet}-${i}`} className={`etape-comment flex flex-col ${visible ? 'etape-visible' : ''}`} style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="relative mx-auto grid h-[70px] w-[70px] place-items-center rounded-full border-[5px] border-[#f5f9fc] bg-gradient-to-br from-[#0174ab] to-[#38b4ea] text-[22px] font-black text-white shadow-[0_10px_24px_-8px_rgba(1,116,171,.8)] dark:border-[#06111f]">
                {i + 1}
              </div>
              <div className="mt-6 flex-1 rounded-[26px] border border-white bg-white/85 p-7 text-left shadow-[0_22px_50px_-32px_rgba(1,80,130,.55)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <span className="grid h-14 w-14 place-items-center rounded-[18px] bg-[#e3f1fa] text-[#0174ab] dark:bg-white/10 dark:text-[#7dd3fc]">
                  <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {ICONES[e.icone]}
                  </svg>
                </span>
                <b className="mt-5 block text-xl font-extrabold text-slate-900 dark:text-white">{e.titre}</b>
                <p className="mt-2.5 leading-relaxed text-slate-500 dark:text-slate-400">{e.texte}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {e.puces.map((p) => (
                    <span key={p} className="rounded-full bg-[#e3f1fa] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#0174ab] dark:bg-white/10 dark:text-[#7dd3fc]">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={allerALaCarte}
          className="rounded-full bg-[#0174ab] px-7 py-3.5 font-bold text-white shadow-[0_10px_24px_-10px_rgba(1,116,171,.9)] transition hover:bg-[#015d8a]">
          Trouver un prestataire
        </button>
        <Link to="/inscription"
          className="rounded-full border-2 border-[#0174ab] px-7 py-3 font-bold text-[#0174ab] transition hover:bg-[#e3f1fa] dark:border-[#38bdf8] dark:text-[#7dd3fc] dark:hover:bg-white/5">
          Devenir prestataire
        </Link>
      </div>
    </section>
  )
}