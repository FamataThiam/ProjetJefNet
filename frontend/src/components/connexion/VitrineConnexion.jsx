import { useAccueil } from '../../api/visiteur'

const ICONES = {
  plomberie: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  electricite: <path d="M13 2 4 14h7l-1 8 9-12h-7z" strokeLinejoin="round" />,
  peinture: <><rect x="3" y="3" width="15" height="6" rx="2" /><path d="M18 6h3v5h-9v4" /><rect x="10" y="15" width="4" height="6" rx="1" /></>,
  mecanique: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  menage: <path d="M14 3 9 14M6 14h8l2 7H4z" />,
}

function Metier({ nom, titre, x, y }) {
  return (
    <span className="metier" style={{ left: x, top: y }} title={titre}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{ICONES[nom]}</svg>
    </span>
  )
}

// Colonne de gauche : les métiers qui tournent autour du logo + les vrais chiffres de JefNet
export default function VitrineConnexion({
  titre = <>Tous les métiers,<br /><em>à côté de chez toi.</em></>,
  texte = 'Retrouve tes réservations, tes messages et tes prestataires préférés.',
}) {
  const { data } = useAccueil()
  const c = data?.chiffres

  return (
    <section className="vitrine">
      <h2>{titre}</h2>
      <p>{texte}</p>

      <div className="systeme" aria-hidden="true">
        <span className="anneau a3" /><span className="anneau a2" /><span className="anneau a1" />
        <div className="orbite o1">
          <Metier nom="plomberie" titre="Plomberie" x="50%" y="0" />
          <span className="bille" style={{ left: '50%', top: '100%' }} />
        </div>
        <div className="orbite o2">
          <Metier nom="electricite" titre="Électricité" x="100%" y="50%" />
          <Metier nom="peinture" titre="Peinture" x="0" y="50%" />
          <span className="bille" style={{ left: '50%', top: 0 }} />
        </div>
        <div className="orbite o3">
          <Metier nom="mecanique" titre="Mécanique" x="15%" y="85%" />
          <Metier nom="menage" titre="Ménage" x="85%" y="15%" />
          <span className="bille" style={{ left: '85%', top: '85%' }} />
        </div>
        <div className="coeur"><img src="/favicon-512.png" alt="" className="h-12 w-12 rounded-xl" /></div>
      </div>

      {c && (
        <div className="chiffres">
          <div><b>{c.prestataires}</b><span>prestataires</span></div>
          <div><b>{c.avis}</b><span>avis</span></div>
          <div><b>{String(c.note_moyenne).replace('.', ',')} ★</b><span>note moyenne</span></div>
        </div>
      )}
    </section>
  )
}