import useSession from '../hooks/useSession'
import LayoutMembre from './LayoutMembre'
import LayoutVisiteur from './LayoutVisiteur'


export default function LayoutSelonSession() {
  const { user, chargement } = useSession()
  if (chargement) return null
  const membre = user && (user.profil_complete || user.est_administrateur)
  return membre ? <LayoutMembre /> : <LayoutVisiteur />
}