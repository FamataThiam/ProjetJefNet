import { Link } from 'react-router-dom'

export default function Bienvenue({ user }) {
  return (
    <section className="verre-dp bienvenue-dp">
      <div className="anneaux-dp"><i /><i /><i /><b>J</b></div>
      <h2>Bienvenue parmi les prestataires</h2>
      <p>Ta fiche est en ligne. Les clients de ta zone peuvent maintenant te trouver sur la carte et dans la recherche.</p>
      <div className="actions-dp">
        <Link to="/espace-prestataire" className="btn-dp prim">Ouvrir mon espace prestataire</Link>
        <Link to={`/prestataires/${user?.id}`} className="btn-dp sec">Voir mon profil public</Link>
      </div>
      <div className="suite-dp">
        <div><em>Ensuite</em><b>Mes disponibilités</b><span>Indique les jours où tu peux intervenir.</span></div>
        <div><em>Ensuite</em><b>Ma première publication</b><span>Montre une réalisation avec des photos avant / après.</span></div>
        <div><em>Facultatif</em><b>Badge certifié</b><span>Envoie un justificatif pour rassurer les clients.</span></div>
      </div>
    </section>
  )
}