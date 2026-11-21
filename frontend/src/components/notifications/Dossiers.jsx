import { TYPES } from './types'


export default function Dossiers({ type, setType, parType, nonLues, onToutLire, enCours }) {
  const total = Object.values(parType ?? {}).reduce((t, c) => t + c.total, 0)
  const categories = Object.keys(TYPES).filter((t) => parType?.[t]?.total)

  return (
    <aside className="verre-nt dossiers-nt">
      <h1>Notifications</h1>
      <div className="resume-nt">
        <b>{nonLues}</b>
        <span>non lue{nonLues > 1 ? 's' : ''}{total ? ` sur ${total}` : ''}</span>
        {nonLues > 0
          ? <button type="button" onClick={onToutLire} disabled={enCours}>{enCours ? 'Un instant…' : 'Tout marquer comme lu'}</button>
          : <p>Tout est lu</p>}
      </div>

      <button type="button" className={`dos-nt ${!type ? 'on' : ''}`} onClick={() => setType('')}>
        Toutes<span className="n">{nonLues || ''}</span>
      </button>

      {categories.length > 0 && <small>Par catégorie</small>}
      {categories.map((t) => (
        <button key={t} type="button" className={`dos-nt ${type === t ? 'on' : ''}`} style={{ '--c': TYPES[t].couleur }} onClick={() => setType(t)}>
          <span className="pt" />{TYPES[t].libelle}<span className="n">{parType[t].non_lues || ''}</span>
        </button>
      ))}
    </aside>
  )
}