import { useEffect, useRef } from 'react'
import { moisAnnee } from '../profil/format'


function etinceler(carte, cible) {
  if (!carte || !cible) return
  const c = carte.getBoundingClientRect()
  const r = cible.getBoundingClientRect()
  for (let k = 0; k < 6; k++) {
    const s = document.createElement('i')
    s.className = 'etincelle-cm'
    s.style.left = `${r.left - c.left + 20 + Math.random() * 60}px`
    s.style.top = `${r.top - c.top + r.height / 2}px`
    s.style.setProperty('--dx', `${Math.random() * 80 - 40}px`)
    s.style.setProperty('--dy', `${Math.random() * -50 - 10}px`)
    carte.appendChild(s)
    setTimeout(() => s.remove(), 800)
  }
}

// Une ligne de la carte : floue tant qu'elle est vide, puis elle apparaît avec des étincelles
function Case({ pleine, carte, className = '', children }) {
  const ref = useRef(null)
  const avant = useRef(pleine)
  useEffect(() => {
    if (pleine && !avant.current) etinceler(carte.current, ref.current)
    avant.current = pleine
  }, [pleine, carte])
  return <div ref={ref} className={`slot ${pleine ? 'rempli' : ''} ${className}`}>{children}</div>
}

const ROLES = { client: 'Client', prestataire: 'Prestataire' }
const telAffiche = (t) => [t.slice(0, 2), t.slice(2, 5), t.slice(5, 7), t.slice(7, 9)].filter(Boolean).join(' ')

// Colonne de gauche : la carte JefNet du membre, qui se remplit pendant qu'il tape
export default function CarteMembre({ f, photoUrl, role, telValide, pourcentage, astuce, creeLe }) {
  const carte = useRef(null)
  const initiales = `${f.prenom.trim()[0] ?? ''}${f.nom.trim()[0] ?? ''}`.toUpperCase() || '?'
  const tel = f.telephone.replace(/\D/g, '')
  const tour = 339.3

  return (
    <section className="vitrine vitrine-membre">
      <div className="nuages-fond" aria-hidden="true"><i className="n1" /><i className="n2" /><i className="n3" /></div>
      <p className="sur-titre">Ta carte JefNet</p>

      <div ref={carte} className="carte-membre">
        <div className="cm-reflet" />
        <div className="cm-haut">
          <div className="cm-photo">
            <svg className="anneau-prog" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" />
              <circle id="prog" cx="60" cy="60" r="54" style={{ strokeDashoffset: tour * (1 - pourcentage / 100) }} />
            </svg>
            <div className="cm-rond">{photoUrl ? <img src={photoUrl} alt="" /> : <span>{initiales}</span>}</div>
          </div>
          <div className="cm-id">
            <Case carte={carte} pleine={Boolean(f.prenom.trim() && f.nom.trim())}>
              <b>{f.prenom.trim() || f.nom.trim() ? `${f.prenom} ${f.nom}`.trim() : 'Ton nom'}</b>
            </Case>
            <Case carte={carte} pleine={f.username.length >= 3}>
              <span className="cm-user">@{f.username || 'ton_pseudo'}</span>
            </Case>
            <span className="cm-role">{ROLES[role] ?? 'Membre'}</span>
          </div>
        </div>

        <div className="cm-lignes">
          <Case carte={carte} pleine={telValide} className="ligne">
            <i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg></i>
            <span>{tel ? `+221 ${telAffiche(tel)}` : '+221 •• ••• •• ••'}</span>
          </Case>
          <Case carte={carte} pleine={Boolean(f.ville.trim() && f.localite.trim())} className="ligne">
            <i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg></i>
            <span>{f.ville.trim() || f.localite.trim() ? [f.localite.trim(), f.ville.trim()].filter(Boolean).join(', ') : 'Ta ville, ton quartier'}</span>
          </Case>
          <div className="ligne">
            <i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 9h18M8 2v4M16 2v4" /></svg></i>
            <span>Membre depuis {moisAnnee(creeLe || new Date())}</span>
          </div>
        </div>
        <div className="cm-bas"><span>JEFNET</span><span>{pourcentage} % complété</span></div>
      </div>

      <p className="astuce">{astuce}</p>
    </section>
  )
}