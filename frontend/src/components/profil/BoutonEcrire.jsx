import { Link, useNavigate } from 'react-router-dom'
import { useDemarrerConversation } from '../../api/messagerie'
import useSession from '../../hooks/useSession'


export default function BoutonEcrire({ uuidPrestataire, lienConnexion, className }) {
  const { user } = useSession()
  const navigate = useNavigate()
  const demarrer = useDemarrerConversation()

  if (!user?.profil_complete) return <Link to={lienConnexion} className={className}>Écrire</Link>
  if (user.id === uuidPrestataire) return null 

  const ouvrir = () => demarrer.mutate(uuidPrestataire, { onSuccess: (c) => navigate(`/messages/${c.uuid}`) })

  return (
    <button type="button" className={className} onClick={ouvrir} disabled={demarrer.isPending}>
      {demarrer.isPending ? 'Ouverture…' : 'Écrire'}
    </button>
  )
}