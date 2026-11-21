
const COULEURS = ['#0E9F6E', '#0174ab', '#c2410c', '#7c3aed', '#0369a1', '#be185d', '#15803d', '#b45309']

export function couleurDe(nom = '') {
  let h = 0
  for (const c of nom) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return COULEURS[h % COULEURS.length]
}

export const initialesDe = (nom = '') => nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase() || '?'


export default function Avatar({ nom, photo, couleur, taille = 'a44', px, className = '' }) {
  const style = { background: couleur || couleurDe(nom), borderRadius: '50%', display: 'grid', placeItems: 'center', overflow: 'hidden', color: '#fff', fontWeight: 800, flexShrink: 0 }
  if (px) Object.assign(style, { width: px, height: px, fontSize: Math.round(px / 3), border: '2px solid #fff' })
  return (
    <span className={`av ${px ? '' : taille} ${className}`} style={style}>
      {photo ? <img src={photo} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initialesDe(nom)}
    </span>
  )
}