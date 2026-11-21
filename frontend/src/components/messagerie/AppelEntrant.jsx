import Avatar from '../membre/Avatar'


export default function AppelEntrant({ interlocuteur, onDecrocher, onRefuser }) {
  return (
    <div className="voile-appel" role="dialog" aria-label={`Appel vidéo de ${interlocuteur?.nom}`}>
      <div className="carte-entrant">
        <div className="ondes-appel"><i /><i /><Avatar nom={interlocuteur?.nom} photo={interlocuteur?.photo_url} taille="a100" /></div>
        <h3>{interlocuteur?.nom}</h3>
        <p>Appel vidéo entrant…</p>
        <div className="choix-appel">
          <button type="button" className="non" onClick={onRefuser}><span><IconeTel raccroche /></span>Refuser</button>
          <button type="button" className="oui" onClick={onDecrocher}><span><IconeCamera /></span>Décrocher</button>
        </div>
      </div>
    </div>
  )
}

export function IconeTel({ raccroche }) {
  return (
    <svg viewBox="0 0 24 24" className="ic-appel" style={raccroche ? { transform: 'rotate(135deg)' } : undefined}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  )
}

export function IconeCamera({ barre }) {
  return (
    <svg viewBox="0 0 24 24" className="ic-appel">
      <rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" />
      {barre && <path d="M3 3l18 18" />}
    </svg>
  )
}

export function IconeMicro({ barre }) {
  return (
    <svg viewBox="0 0 24 24" className="ic-appel">
      <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      {barre && <path d="M3 3l18 18" />}
    </svg>
  )
}