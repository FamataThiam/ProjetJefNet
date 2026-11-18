import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

const DUREE = 5000 // temps d'une photo (ms)

// Plein écran vertical façon statut WhatsApp / TikTok.
// elements = [{ url, type: 'IMAGE' | 'VIDEO' | 'TEXTE', titre, texte, heure }]
export default function Visionneuse({ elements, depart = 0, auteur, nom, lienReserver, onFermer, onPrecedente, onSuivante }) {
  const [i, setI] = useState(depart)
  const [pause, setPause] = useState(false)
  const minuteur = useRef(null)
  const el = elements[i]

  const aller = useCallback((n) => {
    if (n >= elements.length) { if (onSuivante) onSuivante(); else onFermer(); return }
    if (n < 0) { if (onPrecedente) onPrecedente(); else setI(0); return }
    setI(n)
  }, [elements.length, onFermer, onPrecedente, onSuivante])


  useEffect(() => {
    clearTimeout(minuteur.current)
    if (pause || el?.type === 'VIDEO') return
    minuteur.current = setTimeout(() => aller(i + 1), DUREE)
    return () => clearTimeout(minuteur.current)
  }, [i, pause, el, aller])

 
  useEffect(() => {
    const touche = (e) => {
      if (e.key === 'Escape') onFermer()
      if (e.key === 'ArrowRight') aller(i + 1)
      if (e.key === 'ArrowLeft') aller(i - 1)
    }
    addEventListener('keydown', touche)
    document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', touche); document.body.style.overflow = '' }
  }, [i, aller, onFermer])

  if (!el) return null

  return createPortal(
    <div className="visionneuse fixed inset-0 z-[120] flex items-center justify-center bg-[#030e1c]/90 backdrop-blur-xl" onClick={onFermer}>
      {onPrecedente && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onPrecedente() }} aria-label="Publication précédente"
          className="bouton-verre absolute left-[calc(50%-290px)] top-1/2 hidden -translate-y-1/2 md:grid">‹</button>
      )}
      {onSuivante && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onSuivante() }} aria-label="Publication suivante"
          className="bouton-verre absolute right-[calc(50%-290px)] top-1/2 hidden -translate-y-1/2 md:grid">›</button>
      )}

      <div onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => { if (!e.target.closest('button,a')) setPause(true) }}
        onPointerUp={() => setPause(false)} onPointerLeave={() => setPause(false)}
        className={`ecran-visionneuse relative aspect-[9/16] max-h-[92vh] w-[min(400px,94vw)] overflow-hidden rounded-[26px] bg-black shadow-[0_40px_90px_-30px_#000] ${pause ? 'en-pause' : ''}`}>
        {el.type === 'VIDEO' ? (
          <video key={el.url} src={el.url} autoPlay playsInline className="absolute inset-0 h-full w-full object-contain"
            onEnded={() => aller(i + 1)} ref={(v) => v && (pause ? v.pause() : v.play().catch(() => {}))} />
        ) : el.type === 'TEXTE' ? (
          <span key={i} className="apparition-tuile absolute inset-0 bg-gradient-to-br from-[#0174ab] via-[#1a8fd0] to-[#38b4ea]" />
        ) : (
          <img key={el.url} src={el.url} alt="" className="apparition-tuile absolute inset-0 h-full w-full object-cover" />
        )}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#03162c]/90 to-transparent" />

        {/* barres de progression */}
        <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
          {elements.map((_, k) => (
            <i key={k} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
              <b key={`${k}-${i}`} className={`block h-full bg-white ${k < i ? 'w-full' : k === i ? (el.type === 'VIDEO' ? 'w-full' : 'barre-statut') : 'w-0'}`} />
            </i>
          ))}
        </div>

        {/* auteur */}
        <div className="absolute inset-x-3.5 top-7 z-10 flex items-center gap-2.5 text-white">
          {auteur}
          <div className="min-w-0">
            {nom && <b className="block truncate text-sm">{nom}</b>}
            {el.heure && <small className="block truncate text-xs text-white/80">{el.heure}</small>}
          </div>
          <button type="button" onClick={onFermer} aria-label="Fermer" className="ml-auto text-2xl leading-none">✕</button>
        </div>

        {/* zones pour avancer / reculer */}
        <button type="button" aria-label="Précédent" onClick={() => aller(i - 1)} className="absolute bottom-24 left-0 top-20 z-[5] w-2/5" />
        <button type="button" aria-label="Suivant" onClick={() => aller(i + 1)} className="absolute bottom-24 right-0 top-20 z-[5] w-2/5" />

        <div className="absolute inset-x-[18px] bottom-20 z-10 text-white">
          <b className="text-lg">{el.titre}</b>
          {el.texte && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-white/85">{el.texte}</p>}
        </div>

        <div className="absolute inset-x-3.5 bottom-4 z-10 flex gap-2">
          <Link to={lienReserver} className="flex-1 rounded-full border border-white/50 px-4 py-3 text-sm text-white/85 backdrop-blur-md">
            Écrire au prestataire…
          </Link>
          <Link to={lienReserver} className="rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#0174ab]">Réserver</Link>
        </div>
      </div>
    </div>,
    document.body,
  )
}