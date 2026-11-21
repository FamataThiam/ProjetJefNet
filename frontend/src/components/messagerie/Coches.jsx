
export default function Coches({ m }) {
  if (m.echec) return <span className="echec-msg" title="Non envoyé">!</span>
  if (m.temporaire) {
    return <svg viewBox="0 0 24 24" className="coches"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>
  }
  return (
    <svg viewBox="0 0 24 24" className={`coches ${m.est_lu ? 'lu' : ''}`}>
      {m.est_lu ? <path d="M2 13l4 4 8-9M10 15l2 2 9-10" /> : <path d="M5 13l4 4 10-11" />}
    </svg>
  )
}