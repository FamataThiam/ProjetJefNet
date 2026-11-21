import { useParams } from 'react-router-dom'
import Discussion from '../../components/messagerie/Discussion'
import ListeConversations from '../../components/messagerie/ListeConversations'
import '../../components/messagerie/messagerie.css'


export default function Messages() {
  const { uuid } = useParams()
  return (
    <main className={`page-msg ${uuid ? 'ouverte' : ''}`}>
      <div className="app-msg">
        <ListeConversations uuidOuvert={uuid} />
        {uuid ? <Discussion key={uuid} uuid={uuid} /> : (
          <section className="discussion accueil-msg">
            <div>
              <b>JefNet Messages</b>
              <p>Choisis une discussion à gauche. Pour écrire à un prestataire, ouvre son profil et clique sur « Écrire ».</p>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}