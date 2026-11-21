import { Link } from 'react-router-dom'
import Avatar from '../membre/Avatar'

const POSITIONS = [[22, 28], [70, 22], [62, 66], [30, 70], [80, 50], [15, 55]]

// Colonne de droite : à découvrir + près de chez toi
export default function ColonneDroite({ recommandations }) {
  const liste = recommandations?.recommandations ?? []
  return (
    <aside className="col-d">
      {liste.length > 0 && (
        <div className="bloc apparait" style={{ animationDelay: '.1s' }}>
          <h3>À découvrir</h3>
          {liste.slice(0, 3).map((r) => (
            <Link key={r.id} to={r.uuid ? `/prestataires/${r.uuid}` : '/carte'} className="reco reco-lien" title="Voir le profil">
              <Avatar nom={r.nom} photo={r.photo_url} taille="a44" />
              <div style={{ minWidth: 0 }}><b>{r.nom}{r.certifie && ' ✓'}</b><small>{[r.titre, r.distance_km != null ? `${String(r.distance_km).replace('.', ',')} km` : r.ville].filter(Boolean).join(' · ')}</small></div>
              <span className="plus" aria-hidden="true">+</span>
            </Link>
          ))}
        </div>
      )}
      <div className="bloc apparait" style={{ animationDelay: '.16s' }}>
        <h3>Près de chez toi</h3>
        <Link to="/carte?moi=1" className="pres-moi">
          <span className="moi-point" />
          {liste.slice(0, 6).map((r, k) => (
            <span key={r.id} className="p" style={{ left: `${POSITIONS[k][0]}%`, top: `${POSITIONS[k][1]}%`, animationDelay: `${0.3 + k * 0.15}s`, background: '#0174ab' }}>
              {r.photo_url && <img src={r.photo_url} alt="" />}
            </span>
          ))}
          <small>Voir les prestataires sur la carte →</small>
        </Link>
      </div>
      <p className="liens-bas apparait" style={{ animationDelay: '.2s' }}>À propos · Aide · Conditions · Confidentialité<br />JefNet © {new Date().getFullYear()}</p>
    </aside>
  )
}