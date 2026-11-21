import { heureCourte, infoType } from './types'

export default function LigneNotification({ n, choisie, cochee, onOuvrir, onCocher, onLire, nouvelle }) {
  const t = infoType(n.type)
  return (
    <div role="button" tabIndex={0} style={{ '--c': t.couleur }}
      className={`ligne-nt ${n.est_lu ? '' : 'nonlue'} ${choisie ? 'choisie' : ''} ${nouvelle ? 'nouvelle' : ''}`}
      onClick={onOuvrir} onKeyDown={(e) => e.key === 'Enter' && onOuvrir()}>
      <input type="checkbox" checked={cochee} aria-label="Sélectionner"
        onClick={(e) => e.stopPropagation()} onChange={(e) => onCocher(e.target.checked)} />
      <span className="barre-c" />
      <div className="txt">
        <span className="type">{t.libelle}</span>
        <b>{n.titre}</b>
        <p>{n.contenu}</p>
      </div>
      <time dateTime={n.cree_le}>{heureCourte(n.cree_le)}</time>
      {!n.est_lu && (
        <button type="button" className="lire" onClick={(e) => { e.stopPropagation(); onLire() }}>Marquer comme lu</button>
      )}
    </div>
  )
}