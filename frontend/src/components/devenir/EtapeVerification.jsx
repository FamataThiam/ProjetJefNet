import { DUREES, RAYONS, UNITES, fcfa } from './donnees'

export default function EtapeVerification({ metier, services, zone, domaines, accord, setAccord, erreur }) {
  const nomDomaine = (id) => domaines.find((d) => d.id === id)?.libelle ?? ''
  const duree = (v) => DUREES.find((d) => d.valeur === v)?.libelle ?? `${v} min`

  return (
    <div className="vue-dp">
      <h2>Vérification</h2>
      <p className="sous">Relis avant de valider. Tout reste modifiable ensuite.</p>

      <dl className="recap-dp">
        <div><dt>Titre</dt><dd>{metier.titre_professionnel}</dd></div>
        <div><dt>Expérience</dt><dd>{metier.experience || 'Non précisée'}</dd></div>
        <div><dt>Zone</dt><dd>{RAYONS[zone.rayon]?.libelle}</dd></div>
        <div><dt>Position</dt><dd>{zone.source === 'gps' ? 'Ma position actuelle' : 'Choisie sur la carte'}</dd></div>
      </dl>

      <h3 className="titre-recap">{services.length} service{services.length > 1 ? 's' : ''}</h3>
      <ul className="services-recap">
        {services.map((s, i) => (
          <li key={i}>
            <div><b>{s.nom}</b><small>{nomDomaine(s.domaine_id)} · {duree(s.duree)}</small></div>
            <strong>{fcfa(s.prix)} <span>/ {UNITES[s.unite_tarif]}</span></strong>
          </li>
        ))}
      </ul>

      <label className="accord-dp">
        <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
        Je m'engage à proposer des prix honnêtes et à respecter les rendez-vous pris avec les clients.
      </label>
      {erreur && <p className="msg-erreur">{erreur}</p>}
    </div>
  )
}