import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccueil } from '../../api/visiteur'

const initiales = (nom = '') => nom.split(' ').filter(Boolean).slice(0, 2).map((m) => m[0].toUpperCase()).join('')


function Comparateur({ avant, apres }) {
  const zone = useRef(null)
  const [pos, setPos] = useState(50)

  const suivre = (e) => {
    const r = zone.current.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)))
  }

  return (
    <div ref={zone}
      className="relative h-[320px] cursor-ew-resize touch-none select-none overflow-hidden rounded-[30px] bg-slate-200 shadow-[0_34px_70px_-34px_rgba(1,60,100,.6)] sm:h-[480px] dark:bg-white/5"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); suivre(e) }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) suivre(e) }}>
      <img src={avant} alt="Avant" draggable="false" className="absolute inset-0 h-full w-full object-cover" />
      <img src={apres} alt="Après" draggable="false" className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }} />

      <span className="absolute left-4 top-4 rounded-full bg-slate-900/70 px-3.5 py-2 text-xs font-extrabold tracking-wider text-white backdrop-blur-md">AVANT</span>
      <span className="absolute right-4 top-4 rounded-full bg-[#0174ab]/85 px-3.5 py-2 text-xs font-extrabold tracking-wider text-white backdrop-blur-md">APRÈS</span>

      {/* ligne + poignée en verre */}
      <span className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,.35)]" style={{ left: `${pos}%` }} />
      <span className="pointer-events-none absolute top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white bg-white/25 text-lg font-extrabold text-white shadow-[0_8px_20px_rgba(0,0,0,.3)] backdrop-blur-md"
        style={{ left: `${pos}%` }}>
        ‹ ›
      </span>

      {/* même réglage au clavier (accessibilité) */}
      <input type="range" min="0" max="100" value={Math.round(pos)} onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Comparer avant et après" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  )
}


export default function SectionAvantApres() {
  const { data } = useAccueil()
  const [choix, setChoix] = useState(0)
  const realisations = data?.realisations ?? []
  if (!realisations.length) return null

  const r = realisations[Math.min(choix, realisations.length - 1)]
  const p = r.prestataire
  const lieu = [p.membre?.localite, p.membre?.ville].filter(Boolean).join(', ')

  return (
    <section className="bg-gradient-to-b from-[#eaf3fa] to-transparent py-20 dark:from-[#0b1a2e]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[.16em] text-[#0174ab] dark:text-[#38bdf8]">Avant / après</p>
          <h2 className="mt-2 text-3xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-[46px] dark:text-white">
            Jugez sur pièce,<br />pas sur promesse.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-slate-600 dark:text-slate-400">
            De vraies réalisations publiées par nos prestataires. Faites glisser le curseur pour voir la transformation.
          </p>

          {/* la réalisation affichée */}
          <div key={r.id} className="apparition-tuile mt-7 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-26px_rgba(1,80,130,.5)] dark:border-white/10 dark:bg-white/5">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{r.titre}</h3>
            {r.description && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{r.description}</p>}
            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full font-extrabold text-white"
                style={{ background: p.membre?.couleur_perso || '#0174ab' }}>
                {p.membre?.photo_url ? <img src={p.membre.photo_url} alt="" className="h-full w-full object-cover" /> : initiales(p.nom)}
              </span>
              <span className="min-w-0">
                <b className="flex items-center gap-1.5 text-sm text-slate-900 dark:text-white">
                  {p.nom}
                  {p.certifie && <span className="grid h-4 w-4 place-items-center rounded-full bg-[#0174ab] text-[9px] text-white" title="Certifié">✓</span>}
                </b>
                <small className="block truncate text-[13px] text-slate-500 dark:text-slate-400">
                  {[p.titre, lieu, r.il_y_a].filter(Boolean).join(' · ')}
                </small>
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/connexion?suite=${encodeURIComponent(`/prestataires/${p.id}#reserver`)}`}
              className="rounded-full bg-[#0174ab] px-6 py-3.5 font-bold text-white shadow-[0_10px_24px_-10px_rgba(1,116,171,.9)] transition hover:bg-[#015d8a]">
              Je veux le même
            </Link>
            <Link to={`/prestataires/${p.id}`}
              className="rounded-full border-2 border-[#0174ab] px-6 py-3 font-bold text-[#0174ab] transition hover:bg-[#e3f1fa] dark:border-[#38bdf8] dark:text-[#7dd3fc] dark:hover:bg-white/5">
              Voir le profil
            </Link>
          </div>
        </div>

        <div>
          <Comparateur key={r.id} avant={r.avant} apres={r.apres} />

          {/* miniatures : changer de réalisation */}
          {realisations.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {realisations.map((x, i) => (
                <button key={x.id} type="button" onClick={() => setChoix(i)} aria-label={x.titre}
                  className={`relative h-16 overflow-hidden rounded-2xl transition sm:h-20 ${i === choix
                    ? 'outline outline-3 outline-offset-2 outline-[#0174ab]'
                    : 'opacity-60 hover:opacity-100'}`}>
                  <img src={x.apres} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1 pt-4 text-left text-[11px] font-bold text-white">
                    {x.prestataire.titre}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-[13px] text-slate-500 dark:text-slate-400">↔ Glissez le curseur · cliquez sur une miniature pour changer de réalisation</p>
        </div>
      </div>
    </section>
  )
}