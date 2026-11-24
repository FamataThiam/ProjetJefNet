import { useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCertifsEnAttente } from '../api/admin'
import '../components/admin/admin.css'
import '../components/demandes/demandes.css'
import '../components/espace-pro/espace-pro.css'
import Avatar from '../components/membre/Avatar'
import '../components/membre/membre.css'
import '../components/reservations/reservations.css'
import BoutonMode from '../components/visiteur/BoutonMode'
import '../components/visiteur/visiteur.css'
import useSession from '../hooks/useSession'
import { NIVEAUX } from '../components/admin/outils'

// Espace d'administration : menu à gauche, page à droite. Réservé aux administrateurs.
export default function LayoutAdmin() {
  const { user, chargement, fermer } = useSession()
  const lieu = useLocation()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const enAttente = useCertifsEnAttente()

  if (chargement) return null
  if (!user) return <Navigate to={`/connexion?suite=${encodeURIComponent(lieu.pathname)}`} replace />
  if (!user.est_administrateur) return <Navigate to="/fil" replace />

  const nom = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim()
  const deconnecter = async () => { await fermer(); navigate('/', { replace: true }) }
  const lien = (to, libelle, extra) => (
    <NavLink to={to} end={to === '/admin'} onClick={() => setMenu(false)}>{libelle}{extra}</NavLink>
  )

  return (
    <div className="mb adm" style={{ '--perso': '#0174ab' }}>
      <aside className={`adm-menu ${menu ? 'ouvert' : ''}`}>
        <div className="adm-logo"><b>J</b><span>JefNet<small>Administration</small></span></div>
        <span className="grp">Pilotage</span>
        {lien('/admin', 'Tableau de bord')}
        <span className="grp">Décisions</span>
        {lien('/admin/certifications', 'Certifications', enAttente.data > 0 && <i>{enAttente.data}</i>)}
        {lien('/admin/membres', 'Membres')}
        {lien('/admin/moderation', 'Modération')}
        <span className="grp">Catalogue</span>
        {lien('/admin/domaines', 'Domaines')}
        {lien('/admin/listes', 'Listes de valeurs')}
        <div className="adm-bas">
          <div className="adm-moi">
            <Avatar nom={nom} px={38} couleur="#0174ab" />
            <div><b>{nom}</b><small>{NIVEAUX[user.niveau_acces] ?? 'Administrateur'}</small></div>
          </div>
          <div className="adm-outils">
            <BoutonMode />
            <button type="button" onClick={deconnecter}>Se déconnecter</button>
          </div>
        </div>
      </aside>
      {menu && <div className="adm-voile" onClick={() => setMenu(false)} aria-hidden="true" />}

      <div className="adm-page">
        <div className="adm-barre-tel">
          <button type="button" onClick={() => setMenu(true)} aria-label="Ouvrir le menu">Menu</button>
          <b>JefNet · Administration</b>
        </div>
        <Outlet />
      </div>
    </div>
  )
}