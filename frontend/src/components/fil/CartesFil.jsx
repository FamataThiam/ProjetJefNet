import { Link } from 'react-router-dom'
import Avatar from '../membre/Avatar'

const virgule = (n) => Number(n).toFixed(1).replace('.', ',')
const lienPresta = (p) => (p.uuid ? `/prestataires/${p.uuid}` : '/carte')

// Ligne de prestataires recommandés, glissée dans le fil
export function CarteRecommandes({ recommandations }) {
  const liste = recommandations?.recommandations ?? []
  if (!liste.length) return null
  return (
    <div className="bloc carte-fil apparait">
      <h3>Prestataires recommandés pour toi <Link to="/carte">Tout voir</Link></h3>
      <div className="defile">
        {liste.slice(0, 8).map((r) => (
          <Link key={r.id} to={lienPresta(r)} className="presta">
            <div className="bande" />
            <Avatar nom={r.nom} photo={r.photo_url} taille="a48" />
            <b>{r.nom}{r.certifie && ' ✓'}</b>
            <small>{[r.titre, r.ville].filter(Boolean).join(' · ')}</small>
            {r.nombre_avis > 0 && <div className="note">★ {virgule(r.note_moyenne)} ({r.nombre_avis})</div>}
            {r.raisons?.[0] && <div className="raison">{r.raisons[0]}</div>}
          </Link>
        ))}
      </div>
    </div>
  )
}

// « Prestations réussies » : les derniers bons avis (cartes renvoyées par /fil)
export function CartePrestationsReussies({ avis }) {
  if (!avis?.length) return null
  return (
    <div className="bloc carte-fil apparait">
      <h3>Prestations réussies cette semaine</h3>
      {avis.map((a) => (
        <div key={a.avis_id} className="avis-reussi">
          <span className="icone">✓</span>
          <div>
            <p><b>{a.client}</b> a fait appel à <Link to={lienPresta(a.prestataire)}><b>{a.prestataire.nom}</b></Link>{a.service && <> pour « {a.service} »</>}</p>
            <span className="etoiles">{'★★★★★'.slice(0, a.note)}{'☆☆☆☆☆'.slice(0, 5 - a.note)}</span>
            {a.commentaire && <p style={{ marginTop: 4 }}>« {a.commentaire} »</p>}
            <small>{[a.prestataire.titre, a.prestataire.ville, a.il_y_a].filter(Boolean).join(' · ')}</small>
          </div>
        </div>
      ))}
    </div>
  )
}

// « Nouveaux certifiés » : prestataires certifiés récemment
export function CarteNouveauxCertifies({ profils }) {
  if (!profils?.length) return null
  return (
    <div className="bloc carte-fil apparait">
      <h3>Nouveaux prestataires certifiés</h3>
      {profils.map((p) => (
        <Link key={p.profil_id} to={lienPresta(p)} className="reco">
          <Avatar nom={p.nom} taille="a44" />
          <div><b>{p.nom} ✓</b><small>{[p.titre, p.ville, p.il_y_a].filter(Boolean).join(' · ')}</small></div>
        </Link>
      ))}
    </div>
  )
}