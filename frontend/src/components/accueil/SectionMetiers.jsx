import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarte, useDomaines } from '../../api/visiteur'
import { videoDuDomaine } from '../../lib/videosMetiers'
import { CENTRE_SENEGAL, RAYON_SENEGAL_KM } from '../carte/constantes'

const calme = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`

function Fleche({ grande }) {
  return (
    <span className={`ml-auto grid shrink-0 place-items-center rounded-full font-extrabold transition group-hover:translate-x-1
      ${grande ? 'h-13 w-13 bg-white text-[#0174ab]' : 'h-10 w-10 border border-white/40 bg-white/20 backdrop-blur-md'}`}>
      →
    </span>
  )
}


function TuileMetier({ domaine, large, onOuvrir }) {
  const video = useRef(null)
  const jouer = () => { if (!calme) video.current?.play().catch(() => {}) }
  const arreter = () => { if (video.current) { video.current.pause(); video.current.currentTime = 0 } }

  return (
    <button type="button" onClick={onOuvrir} onMouseEnter={jouer} onMouseLeave={arreter} onFocus={jouer} onBlur={arreter}
      className={`tuile-metier group ${large ? 'col-span-2' : ''}`}>
      {domaine.video ? (
        <video ref={video} src={domaine.video.src} poster={domaine.video.poster} muted loop playsInline preload="none"
          className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <img src={domaine.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <span className="etiquette-tuile">{domaine.video ? '▶ Vidéo' : 'Photo'}</span>
      <span className="absolute inset-x-4 bottom-4 z-10 flex items-end gap-3 text-left">
        <span>
          <b className="block text-lg font-bold">{domaine.libelle}</b>
          <small className="mt-1 block text-[13px] text-white/85">{pluriel(domaine.nombre_prestataires, 'prestataire')}</small>
        </span>
        <Fleche />
      </span>
    </button>
  )
}


export default function SectionMetiers() {
  const naviguer = useNavigate()
  const { data: domaines = [] } = useDomaines()

  const { data: carte } = useCarte({ lat: CENTRE_SENEGAL.lat, lng: CENTRE_SENEGAL.lng, rayon: RAYON_SENEGAL_KM, domaine: '' })

  const metiers = useMemo(
    () => domaines.filter((d) => d.nombre_prestataires > 0).map((d) => ({ ...d, video: videoDuDomaine(d.libelle) })),
    [domaines],
  )
  const avecVideo = metiers.filter((m) => m.video)


  const [rang, setRang] = useState(0)
  const [avance, setAvance] = useState(0)
  const vedette = avecVideo.length ? avecVideo[rang % avecVideo.length] : metiers[0]
  const autres = metiers.filter((m) => m.id !== vedette?.id)


  const cases = autres.length + 2 
  const aElargir = (4 - (cases % 4)) % 4

  const ouvrir = (id) => {
    naviguer(id ? `/?domaine=${id}#trouver` : '/#trouver', { preventScrollReset: true })
    setTimeout(() => document.getElementById('trouver')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  if (!vedette) return null

  return (
    <section id="metiers" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[.16em] text-[#0174ab] dark:text-[#38bdf8]">Les métiers en action</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[44px] dark:text-white">Chaque métier, en mouvement</h2>
        </div>
        <p className="max-w-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Survolez un métier pour le voir en vidéo, puis cliquez pour trouver ses prestataires sur la carte.
        </p>
      </div>

      <div className="mt-9 grid auto-rows-[200px] grid-cols-2 gap-4 lg:auto-rows-[230px] lg:grid-cols-4">
        {/* grand métier : sa vidéo joue toute seule */}
        <button type="button" onClick={() => ouvrir(vedette.id)} className="tuile-metier group col-span-2 row-span-2">
          {vedette.video ? (
            <video key={vedette.id} src={vedette.video.src} poster={vedette.video.poster} muted playsInline autoPlay={!calme}
              loop={avecVideo.length < 2}
              onTimeUpdate={(e) => setAvance(e.target.currentTime / (e.target.duration || 1))}
              onEnded={() => { setAvance(0); setRang((r) => r + 1) }}
              className="apparition-tuile absolute inset-0 h-full w-full object-cover" />
          ) : (
            <img src={vedette.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span className="etiquette-tuile !bg-white/90 !text-[#0174ab]">● En lecture</span>
          <span key={`texte-${vedette.id}`} className="apparition-tuile absolute inset-x-6 bottom-8 z-10 flex items-end gap-4 text-left sm:inset-x-7">
            <span>
              <b className="block text-2xl font-extrabold tracking-tight sm:text-3xl">{vedette.libelle}</b>
              <span className="mt-2 hidden max-w-md leading-relaxed text-white/90 sm:block">{vedette.description}</span>
              <small className="mt-1.5 block text-[13px] text-white/85">{pluriel(vedette.nombre_prestataires, 'prestataire')}</small>
            </span>
            <Fleche grande />
          </span>
          <span className="absolute inset-x-0 bottom-0 z-10 h-1 bg-white/25">
            <span className="block h-full bg-white transition-[width] duration-300" style={{ width: `${avance * 100}%` }} />
          </span>
        </button>

        {autres.map((m, i) => (
          <TuileMetier key={m.id} domaine={m} large={i >= autres.length - aElargir} onOuvrir={() => ouvrir(m.id)} />
        ))}

        {/* carte bleue de fin : les vrais chiffres */}
        <div className="relative col-span-2 flex flex-col justify-between overflow-hidden rounded-[26px] bg-[linear-gradient(110deg,#0174ab,#1a8fd0_60%,#38b4ea)] p-7 text-white dark:bg-[linear-gradient(110deg,#03314f,#0a4f7e_60%,#0174ab)]">
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(200px_90px_at_20%_0%,rgba(255,255,255,.35),transparent_70%)]" />
          <div className="relative">
            <b className="block text-2xl font-extrabold tracking-tight">
              {pluriel(metiers.length, 'métier')}{carte ? `, ${pluriel(carte.total, 'prestataire')}` : ''}
            </b>
            <p className="mt-1.5 text-white/85">Voyez-les tous sur la carte du Sénégal.</p>
          </div>
          <button type="button" onClick={() => ouvrir(null)}
            className="relative w-fit rounded-full bg-white px-6 py-3 font-bold text-[#0174ab] transition hover:-translate-y-0.5">
            Voir la carte →
          </button>
        </div>
      </div>
    </section>
  )
}