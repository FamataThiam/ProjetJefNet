import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useSession from '../hooks/useSession'
import { accueilDe, profilDe } from '../lib/espace'


export function RouteInvite() {
  const { utilisateur } = useSession()
  if (utilisateur) return <Navigate to={accueilDe(utilisateur)} replace />
  return <Outlet />
}


export function RouteProtegee({ profils, profilComplet = true }) {
  const { utilisateur } = useSession()
  const ici = useLocation()

  if (!utilisateur) return <Navigate to="/connexion" replace state={{ depuis: ici.pathname }} />

  const profil = profilDe(utilisateur)
  
  if (profils && !profils.includes(profil)) return <Navigate to={accueilDe(utilisateur)} replace />


  if (profil !== 'admin' && profilComplet) {
    if (!utilisateur.est_email_verifie) return <Navigate to="/verifier-email" replace />
    if (!utilisateur.profil_complete) return <Navigate to="/completer-profil" replace />
  }

  return <Outlet />
}