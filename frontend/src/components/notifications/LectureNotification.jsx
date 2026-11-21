import { Link } from 'react-router-dom'
import { dateLongue, heureCourte, infoType, lienFront } from './types'


export default function LectureNotification({ n, user, memeType, onOuvrir, onBasculer, onRetour, position, total }) {
  if (!n) {
    return (
      <section className="verre-nt lecture-nt vide">
        <p>Choisis une notification pour la lire.</p>
      </section>
    )
  }
  const t = infoType(n.type)
  const lien = lienFront(n.lien, user)

  return (
    <section className="verre-nt lecture-nt" style={{ '--c': t.couleur }}>
      <div className="entete-nt">
        <button type="button" className="btn-nt sec retour-nt" onClick={onRetour}>Retour</button>
        <span className="etiquette-nt"><i />{t.libelle}</span>
        <h2>{n.titre}</h2>
        <div className="quand-nt">{n.il_y_a} · {dateLongue(n.cree_le)} · {n.est_lu ? 'Lue' : 'Non lue'}</div>
      </div>

      <div className="corps-nt">
        <p>{n.contenu}</p>

        {lien && (
          <div className="carte-lien-nt">
            <span className="rond">{t.libelle.charAt(0)}</span>
            <div><b>{t.ouvrir}</b><small>Ouvre la page concernée dans JefNet</small></div>
            <Link to={lien} className="btn-nt prim">Ouvrir</Link>
          </div>
        )}

        {memeType.length > 0 && (
          <div className="lies-nt">
            <h3>Dans la même catégorie</h3>
            {memeType.map((x) => (
              <button key={x.id} type="button" onClick={() => onOuvrir(x)} className={x.est_lu ? '' : 'nonlue'}>
                <i />{x.titre}<span>{heureCourte(x.cree_le)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pied-nt">
        <button type="button" className="btn-nt sec" onClick={onBasculer}>{n.est_lu ? 'Marquer comme non lue' : 'Marquer comme lue'}</button>
        {total > 0 && position > 0 && <span>Notification {position} sur {total}</span>}
      </div>
    </section>
  )
}