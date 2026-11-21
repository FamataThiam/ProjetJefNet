import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useConversations } from '../../api/messagerie'
import Avatar from '../membre/Avatar'
import { heureListe } from './temps'

const FILTRES = [['toutes', 'Toutes'], ['non_lues', 'Non lues'], ['prestataires', 'Prestataires'], ['archivees', 'Archivées']]
const sansAccents = (t = '') => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()


export default function ListeConversations({ uuidOuvert }) {
  const [filtre, setFiltre] = useState('toutes')
  const [cherche, setCherche] = useState('')
  const liste = useConversations(filtre === 'archivees')

  const conversations = useMemo(() => {
    const toutes = liste.data?.pages.flatMap((p) => p.data) ?? []
    const q = sansAccents(cherche.trim())
    return toutes.filter((c) => (filtre !== 'non_lues' || c.non_lus > 0)
      && (filtre !== 'prestataires' || c.interlocuteur?.est_prestataire)
      && (!q || sansAccents(`${c.interlocuteur?.nom} ${c.interlocuteur?.username}`).includes(q)))
  }, [liste.data, filtre, cherche])

  return (
    <aside className="liste-msg">
      <div className="liste-haut">
        <h1>Messages</h1>
        <label className="cherche-msg">
          <svg viewBox="0 0 24 24" className="ic"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          <input type="search" value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder="Rechercher une discussion" />
        </label>
      </div>
      <div className="filtres-msg">
        {FILTRES.map(([v, l]) => (
          <button key={v} type="button" className={filtre === v ? 'on' : ''} onClick={() => setFiltre(v)}>{l}</button>
        ))}
      </div>

      <div className="convs">
        {liste.isPending ? [0, 1, 2, 3, 4].map((i) => <div key={i} className="sq-conv"><i /><span /></div>)
          : conversations.length === 0 ? (
            <p className="vide-msg">
              {cherche ? 'Aucune discussion avec ce nom.' : filtre === 'archivees' ? 'Aucune discussion archivée.'
                : 'Aucune discussion pour le moment. Ouvre le profil d’un prestataire et clique sur « Écrire ».'}
            </p>
          ) : conversations.map((c) => {
            const p = c.interlocuteur ?? {}
            const d = c.dernier_message
            return (
              <Link key={c.uuid} to={`/messages/${c.uuid}`} className={`conv ${c.uuid === uuidOuvert ? 'on' : ''} ${c.non_lus ? 'nl' : ''}`}>
                <Avatar nom={p.nom} photo={p.photo_url} taille="a50" />
                <div className="txt">
                  <div className="l1"><b>{p.nom}</b><time>{heureListe(d?.envoye_le)}</time></div>
                  <div className="l2">
                    {d?.de_moi && <span className="vous">Vous :</span>}
                    <span className="ap">{d?.apercu ?? 'Nouvelle discussion'}</span>
                    {p.est_prestataire && p.titre && <span className="metier">{p.titre}</span>}
                    {c.non_lus > 0 && <em>{c.non_lus}</em>}
                  </div>
                </div>
              </Link>
            )
          })}
        {liste.hasNextPage && (
          <button type="button" className="plus-msg" onClick={() => liste.fetchNextPage()} disabled={liste.isFetchingNextPage}>
            {liste.isFetchingNextPage ? 'Chargement…' : 'Voir plus'}
          </button>
        )}
      </div>
    </aside>
  )
}