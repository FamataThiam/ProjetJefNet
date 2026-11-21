import { Link } from 'react-router-dom'
import { useChiffresClient } from '../../api/fil'
import { usePrestataire, usePublicationsPrestataire } from '../../api/visiteur'
import Avatar from '../membre/Avatar'

const IC = {
  reservations: <><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  carte: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  outil: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />,
  profil: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  tableau: <><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></>,
}

function Chiffres({ user }) {
  const presta = Boolean(user.est_prestataire)
  const client = useChiffresClient(!presta)
  const profil = usePrestataire(presta ? user.id : null)
  const pubs = usePublicationsPrestataire(presta ? user.id : null)
  const [a, b] = presta
    ? [[pubs.data?.pages[0]?.meta.total, 'réalisations'], [profil.data?.nombre_avis, 'avis']]
    : [[client.reservations, 'réservations'], [client.demandes, 'demandes']]
  return (
    <div className="stats-mb">
      <div><b>{a[0] ?? '–'}</b><br />{a[1]}</div>
      <div><b>{b[0] ?? '–'}</b><br />{b[1]}</div>
    </div>
  )
}

// Colonne de gauche : mini-carte du membre + raccourcis
export default function ColonneGauche({ user }) {
  const m = user.membre
  const presta = Boolean(user.est_prestataire)
  const liens = presta
    ? [['/prestataire', 'tableau', 'Mon tableau de bord'], [`/prestataires/${user.id}`, 'profil', 'Mon profil public'], ['/prestataire/publications', 'plus', 'Publier une réalisation'], ['/prestataire/demandes', 'reservations', 'Demandes disponibles']]
    : [['/reservations', 'reservations', 'Mes réservations'], ['/demandes/nouvelle', 'plus', 'Publier une demande'], ['/carte', 'carte', 'Carte des prestataires'], ['/devenir-prestataire', 'outil', 'Devenir prestataire']]

  return (
    <aside className="col-g">
      <div className="bloc mini-profil apparait">
        <div className="couverture" />
        <Avatar nom={`${user.prenom} ${user.nom}`} photo={m?.photo_url} couleur={m?.couleur_perso} taille="a72" />
        <b>{user.prenom} {user.nom}</b>
        <small>{[m?.username && `@${m.username}`, [m?.localite, m?.ville].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</small><br />
        <span className="role-puce">{presta ? 'Prestataire' : 'Client'}</span>
        <Chiffres user={user} />
      </div>
      <nav className="bloc raccourcis apparait" style={{ animationDelay: '.08s' }}>
        {liens.map(([to, ic, libelle]) => (
          <Link key={to} to={to}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{IC[ic]}</svg>{libelle}</Link>
        ))}
      </nav>
    </aside>
  )
}