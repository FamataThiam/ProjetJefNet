import { useState } from 'react'
import useSession from '../../hooks/useSession'
import Avatar from '../membre/Avatar'
import FenetrePublication from './FenetrePublication'


export default function RaccourciPublier() {
  const { user } = useSession()
  const [ouvert, setOuvert] = useState(false)
  if (!user?.est_prestataire) return null
  const nom = `${user.prenom} ${user.nom}`

  return (
    <>
      <div className="bloc ep-raccourci apparait">
        <Avatar nom={nom} photo={user.membre?.photo_url} couleur={user.membre?.couleur_perso} px={42} />
        <button type="button" className="champ" onClick={() => setOuvert(true)}>Montre ton dernier travail, {user.prenom}…</button>
        <button type="button" className="publier" onClick={() => setOuvert(true)}>Publier</button>
      </div>
      {ouvert && <FenetrePublication onFermer={() => setOuvert(false)} />}
    </>
  )
}