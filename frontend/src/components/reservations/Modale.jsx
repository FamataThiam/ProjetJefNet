import { useEffect } from 'react'
import { createPortal } from 'react-dom'


export default function Modale({ titre, sousTitre, large, onFermer, children }) {
  useEffect(() => {
    const echap = (e) => e.key === 'Escape' && onFermer()
    addEventListener('keydown', echap)
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', echap); document.body.style.overflow = avant }
  }, [onFermer])

  return createPortal(
    <div className="rs-voile" onMouseDown={(e) => e.target === e.currentTarget && onFermer()}>
      <div className={`rs-modale ${large ? 'large' : ''}`} role="dialog" aria-modal="true" aria-label={titre}>
        <div className="rs-modale-haut">
          <div>
            <h2>{titre}</h2>
            {sousTitre && <p>{sousTitre}</p>}
          </div>
          <button type="button" className="rs-fermer" onClick={onFermer} aria-label="Fermer">×</button>
        </div>
        {children}
      </div>
    </div>,
    document.querySelector('.mb') || document.body,
  )
}