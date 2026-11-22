import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { dateLongue, duree, medias, prix } from './format'

const ICONES = {
  realisations: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
  services: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5h6v2" /></>,
  avis: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  apropos: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
}

const etoiles = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n)

function BoutonPlus({ requete }) {
  if (!requete.hasNextPage) return null
  return (
    <button type="button" onClick={() => requete.fetchNextPage()} disabled={requete.isFetchingNextPage}
      className="mx-auto mt-6 block rounded-full border-2 border-[#0174ab] px-6 py-2.5 font-bold text-[#0174ab] transition hover:bg-[#e3f1fa] disabled:opacity-50 dark:border-[#38bdf8] dark:text-[#7dd3fc] dark:hover:bg-white/5">
      {requete.isFetchingNextPage ? 'Chargement…' : 'Voir plus'}
    </button>
  )
}

// Vignette verticale façon TikTok, qui s'incline au survol
function Vignette({ pub, epinglee, onOuvrir }) {
  const el = useRef(null)
  const liste = medias(pub)
  const couverture = liste.find((x) => x.type === 'IMAGE')
  const images = liste.filter((x) => x.type === 'IMAGE').length
  const avantApres = images >= 2 && /avant|apr[eè]s/i.test(pub.titre)

  const incliner = (e) => {
    const r = el.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.current.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`
  }

  return (
    <button ref={el} type="button" onClick={onOuvrir} onMouseMove={incliner} onMouseLeave={() => { el.current.style.transform = '' }}
      className="vignette-profil group relative aspect-[3/4] overflow-hidden rounded-[18px] text-left">
      {couverture
        ? <img src={couverture.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
        : <span className="absolute inset-0 bg-gradient-to-br from-[#0174ab] to-[#38b4ea] p-4 pt-12 text-sm font-semibold text-white/90">{pub.description}</span>}
      <span className="absolute inset-0 bg-gradient-to-b from-transparent from-45% to-[#03162c]/85" />

      <span className="absolute inset-x-2 top-2 z-10 flex justify-between gap-1.5">
        <span>
          {epinglee && <span className="etiquette-vignette !border-0 !bg-[#38b4ea]">Épinglé</span>}
          {!epinglee && avantApres && <span className="etiquette-vignette">AVANT / APRÈS</span>}
        </span>
        {liste.length > 0 && <span className="etiquette-vignette">▢ {liste.length}</span>}
      </span>

      <span className="bouton-verre absolute left-1/2 top-[45%] z-10 grid -translate-x-1/2 -translate-y-1/2 scale-75 opacity-0 transition group-hover:scale-100 group-hover:opacity-100">▶</span>

      <span className="absolute inset-x-2.5 bottom-2.5 z-10 text-white">
        <b className="line-clamp-2 text-[13px] leading-snug">{pub.titre}</b>
        <small className="mt-1 flex gap-2.5 text-[11.5px] text-white/85"><span>💬 {pub.nb_commentaires}</span><span>{pub.il_y_a}</span></small>
      </span>
    </button>
  )
}

// Onglets : Réalisations · Services · Avis · À propos
export default function OngletsProfil({ profil, publications, avis, lienConnexion, lienService, onOuvrirPublication }) {
  const [onglet, setOnglet] = useState('realisations')
  const barre = useRef(null)
  const [curseur, setCurseur] = useState({ left: 0, width: 0 })

  const pubs = publications.data?.pages.flatMap((p) => p.data) ?? []
  const listeAvis = avis.data?.pages.flatMap((p) => p.data) ?? []
  const totalPubs = publications.data?.pages[0]?.meta.total ?? 0

  const ONGLETS = [
    ['realisations', 'Réalisations', totalPubs],
    ['services', 'Services', profil.services?.length ?? 0],
    ['avis', 'Avis', profil.nombre_avis],
    ['apropos', 'À propos'],
  ]

  // le fond bleu glisse sous l'onglet choisi
  useLayoutEffect(() => {
    const placer = () => {
      const b = barre.current?.querySelector(`[data-onglet="${onglet}"]`)
      if (b) setCurseur({ left: b.offsetLeft, width: b.offsetWidth })
    }
    placer()
    addEventListener('resize', placer)
    return () => removeEventListener('resize', placer)
  }, [onglet, totalPubs])

  return (
    <div className="min-w-0">
      <div ref={barre} className="verre-profil relative flex w-full gap-1 overflow-x-auto rounded-[18px] p-1.5 [scrollbar-width:none] sm:w-fit">
        <span className="absolute bottom-1.5 top-1.5 rounded-[13px] bg-gradient-to-r from-[#0174ab] to-[#1a8fd0] shadow-[0_10px_22px_-10px_rgba(1,116,171,.9)] transition-all duration-300"
          style={curseur} />
        {ONGLETS.map(([cle, libelle, n]) => (
          <button key={cle} type="button" data-onglet={cle} onClick={() => setOnglet(cle)}
            className={`relative z-10 flex shrink-0 items-center gap-2 rounded-[13px] px-4 py-2.5 font-bold transition-colors sm:px-5 ${onglet === cle ? 'text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
            <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="2">{ICONES[cle]}</svg>
            {libelle}{n != null && <small className="font-semibold opacity-70">{n}</small>}
          </button>
        ))}
      </div>

      <div key={onglet} className="apparait mt-5">
        {onglet === 'realisations' && (
          pubs.length ? (
            <>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
                {pubs.map((p, i) => <Vignette key={p.id} pub={p} epinglee={i === 0} onOuvrir={() => onOuvrirPublication(pubs, i)} />)}
              </div>
              <BoutonPlus requete={publications} />
            </>
          ) : <p className="verre-profil rounded-[20px] p-8 text-center text-slate-500">Aucune réalisation publiée pour l'instant.</p>
        )}

        {onglet === 'services' && (
          <div className="flex flex-col gap-3">
            {profil.services?.map((s) => (
              <div key={s.id} className="verre-profil grid gap-x-5 gap-y-1.5 rounded-[20px] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <b className="text-slate-900 dark:text-white">{s.nom}</b>
                  {s.description && <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{s.description}</p>}
                </div>
                <div className="sm:text-right">
                  <b className="block text-xl font-black text-[#0174ab] dark:text-[#7dd3fc]">{prix(s.prix)}</b>
                  <small className="text-slate-500 dark:text-slate-400">{[s.unite_tarif, duree(s.duree)].filter(Boolean).join(' · ')}</small>
                  {lienService !== null && <Link to={lienService ? lienService(s.id) : lienConnexion} className="mt-2 block w-fit rounded-xl bg-gradient-to-r from-[#0174ab] to-[#1a8fd0] px-5 py-2 text-sm font-bold text-white sm:ml-auto">Réserver</Link>}
                </div>
              </div>
            ))}
            {!profil.services?.length && <p className="verre-profil rounded-[20px] p-8 text-center text-slate-500">Aucun service pour l'instant.</p>}
          </div>
        )}

        {onglet === 'avis' && (
          <>
            <div className="flex flex-col gap-3">
              {listeAvis.map((a) => (
                <div key={a.id} className="verre-profil rounded-[20px] px-5 py-4">
                  <span className="tracking-[2px] text-[#f5b301]">{etoiles(a.note)}</span>
                  {a.commentaire && <p className="mt-1.5 leading-relaxed text-slate-800 dark:text-slate-200">{a.commentaire}</p>}
                  <small className="mt-2 block text-[13px] text-slate-500 dark:text-slate-400">{a.auteur} · {dateLongue(a.date)}</small>
                </div>
              ))}
              {!listeAvis.length && !avis.isPending && <p className="verre-profil rounded-[20px] p-8 text-center text-slate-500">Aucun avis pour l'instant.</p>}
            </div>
            <BoutonPlus requete={avis} />
          </>
        )}

        {onglet === 'apropos' && (
          <div className="verre-profil rounded-[22px] p-6 leading-relaxed">
            <h3 className="titre-bloc">Biographie</h3>
            <p className="text-slate-700 dark:text-slate-300">{profil.biographie || 'Pas encore de biographie.'}</p>
            {profil.experience && (<><h3 className="titre-bloc mt-6">Expérience</h3><p className="text-slate-700 dark:text-slate-300">{profil.experience}</p></>)}
            {profil.domaines?.length > 0 && (<><h3 className="titre-bloc mt-6">Domaines</h3><p className="text-slate-700 dark:text-slate-300">{profil.domaines.join(', ')}</p></>)}
          </div>
        )}
      </div>
    </div>
  )
}

export { etoiles }