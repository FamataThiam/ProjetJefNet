import Avatar from '../membre/Avatar'
import { RAYONS, UNITES, fcfa } from './donnees'


export default function FicheApercu({ user, metier, services, zone, domaines }) {
  const nom = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim()
  const m = user?.membre
  const doms = [...new Set(services.map((s) => s.domaine_id).filter(Boolean))]
    .map((id) => domaines.find((d) => d.id === id)?.libelle).filter(Boolean)
  const prix = services.map((s) => Number(s.prix)).filter((p) => p > 0)

  return (
    <div className="verre-dp fiche-dp">
      <div className="bandeau-fiche" />
      <div className="corps-fiche">
        <Avatar nom={nom} photo={m?.photo_url} couleur="#0E9F6E" taille="a84" />
        <h3>{nom}</h3>
        <div key={metier.titre_professionnel} className="titre-fiche">{metier.titre_professionnel || <span className="vide-dp">Ton métier</span>}</div>
        <div className="lieu-fiche">@{m?.username}{m?.ville && ` · ${[m.localite, m.ville].filter(Boolean).join(', ')}`}</div>
        <div className="tags-fiche">
          {doms.map((d) => <i key={d}>{d}</i>)}
          {metier.experience && <i className="gris">{metier.experience} d'expérience</i>}
          {zone.rayon && <i className="gris">{RAYONS[zone.rayon]?.libelle}</i>}
        </div>
        <p className="bio-fiche">{metier.biographie || <span className="vide-dp">Ta présentation apparaîtra ici.</span>}</p>
        <div className="prix-fiche"><span>À partir de</span><b>{prix.length ? fcfa(Math.min(...prix)) : '—'}</b></div>
        <ul className="services-fiche">
          {services.filter((s) => s.nom.trim()).map((s, i) => (
            <li key={i}><b>{s.nom}</b><span>{s.prix ? `${fcfa(s.prix)} · ` : ''}{UNITES[s.unite_tarif]}</span></li>
          ))}
        </ul>
      </div>
    </div>
  )
}