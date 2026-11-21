import { useEffect, useRef, useState } from 'react'
import { messageErreur } from '../../api/auth'
import { useCommentaires, useCommenter, useSupprimerCommentaire } from '../../api/commentaires'
import useSession from '../../hooks/useSession'
import Avatar from '../membre/Avatar'

const MAX = 1000

// Champ d'écriture qui grandit avec le texte + bouton d'envoi
function ChampCommentaire({ petit, placeholder, autoFocus, onEnvoyer }) {
  const { user } = useSession()
  const [texte, setTexte] = useState('')
  const zone = useRef(null)

  useEffect(() => { if (autoFocus) zone.current?.focus() }, [autoFocus])

  const grandir = (el) => { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 140)}px` }
  const envoyer = () => {
    const t = texte.trim()
    if (!t) return
    onEnvoyer(t, (garder) => { setTexte(garder ?? ''); if (zone.current) zone.current.style.height = 'auto' })
  }

  return (
    <div className="ecrire" style={petit ? { marginLeft: 46 } : undefined}>
      <Avatar nom={`${user?.prenom ?? ''} ${user?.nom ?? ''}`} photo={user?.membre?.photo_url} couleur={user?.membre?.couleur_perso} px={petit ? 30 : 36} />
      <div className="zone">
        <textarea ref={zone} rows={1} placeholder={placeholder} maxLength={MAX} value={texte}
          onChange={(e) => { setTexte(e.target.value); grandir(e.target) }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() } }} />
        {texte.length > 0 && <span className="compteur">{texte.length} / {MAX}</span>}
        <button type="button" className="envoyer-c" title="Publier" disabled={!texte.trim()} onClick={envoyer}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>
        </button>
      </div>
    </div>
  )
}

// Un commentaire (ou une réponse)
function Commentaire({ c, petit, auteurPublication, onRepondre, onSupprimer }) {
  const [part, setPart] = useState(false)
  return (
    <div className={`com ${c.nouveau ? 'nouveau' : ''} ${c.envoi ? 'en-envoi' : ''} ${part ? 'supprime' : ''}`}>
      <Avatar nom={c.auteur.nom} photo={c.auteur.photo_url} px={petit ? 30 : 36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="bulle">
          <div className="qui">
            {c.auteur.nom}
            {auteurPublication && c.auteur.membre_id === auteurPublication && <span className="badge-auteur">Auteur</span>}
            <small>· {c.envoi ? 'envoi…' : c.nouveau ? "à l'instant" : c.il_y_a}</small>
          </div>
          <p>{c.contenu}</p>
        </div>
        {!c.envoi && <div className="com-actions">
          <button type="button" onClick={onRepondre}>Répondre</button>
          {c.peut_supprimer && (
            <button type="button" className="suppr" onClick={() => { setPart(true); setTimeout(onSupprimer, 400) }}>Supprimer</button>
          )}
        </div>}
      </div>
    </div>
  )
}

// Zone des commentaires d'une publication (ouverte sous la publication, dans le fil)
export default function Commentaires({ pub, total, onChangementTotal }) {
  const liste = useCommentaires(pub.id, true)
  const commenter = useCommenter(pub.id)
  const supprimer = useSupprimerCommentaire(pub.id)
  const [reponseA, setReponseA] = useState(null) // { id, nom }
  const [deplies, setDeplies] = useState(() => new Set())
  const commentaires = liste.data?.pages.flatMap((p) => p.data) ?? []
  const auteurPublication = pub.prestataire.membre_id

  const { user } = useSession()
  const moi = { membre_id: null, nom: `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim(), photo_url: user?.membre?.photo_url ?? null }

  // le commentaire s'affiche tout de suite ; s'il échoue, il disparaît et le texte revient dans le champ
  const publier = (contenu, parent, vider) => {
    vider()
    onChangementTotal(1)
    if (parent) { setDeplies((d) => new Set(d).add(parent)); setReponseA(null) }
    commenter.mutate({ contenu, parent_id: parent ?? undefined, auteur: moi }, {
      onError: () => { onChangementTotal(-1); if (!parent) vider(contenu) },
    })
  }
  const effacer = (id) => supprimer.mutate(id, { onSuccess: () => onChangementTotal(-1) })
  const erreur = commenter.isError ? messageErreur(commenter.error) : supprimer.isError ? messageErreur(supprimer.error) : null

  return (
    <div className="commentaires">
      <ChampCommentaire placeholder="Écrire un commentaire…" autoFocus onEnvoyer={(t, vider) => publier(t, null, vider)} />
      {erreur && <p className="msg-com">{erreur}</p>}

      {total > 0 && <div className="tri"><span>Les plus récents</span><span>{total} commentaire{total > 1 ? 's' : ''}</span></div>}

      {liste.isPending && [1, 2].map((k) => (
        <div key={k} className="com"><div className="sq rond" style={{ width: 36, height: 36 }} /><div className="sq" style={{ flex: 1, height: 58, borderRadius: '4px 18px 18px 18px' }} /></div>
      ))}

      {liste.isSuccess && !commentaires.length && <p className="aucun-com">Sois le premier à commenter cette réalisation.</p>}

      {commentaires.map((c) => {
        const reponses = c.reponses ?? []
        const ouvert = deplies.has(c.id) || reponses.length <= 1
        return (
          <div key={c.id}>
            <Commentaire c={c} auteurPublication={auteurPublication}
              onRepondre={() => setReponseA({ id: c.id, nom: c.auteur.nom })} onSupprimer={() => effacer(c.id)} />

            {reponses.length > 0 && (ouvert ? (
              <div className="reponses">
                {reponses.map((r) => (
                  <Commentaire key={r.id} c={r} petit auteurPublication={auteurPublication}
                    onRepondre={() => setReponseA({ id: c.id, nom: r.auteur.nom })} onSupprimer={() => effacer(r.id)} />
                ))}
              </div>
            ) : (
              <button type="button" className="voir-reponses" onClick={() => setDeplies((d) => new Set(d).add(c.id))}>
                ↳ Voir {reponses.length} réponses
              </button>
            ))}

            {reponseA?.id === c.id && (
              <>
                <div className="repondre-a"><span>Réponse à {reponseA.nom}</span><button type="button" onClick={() => setReponseA(null)}>Annuler</button></div>
                <ChampCommentaire petit autoFocus placeholder="Écrire une réponse…" onEnvoyer={(t, vider) => publier(t, c.id, vider)} />
              </>
            )}
          </div>
        )
      })}

      {liste.hasNextPage && (
        <button type="button" className="voir-plus-c" disabled={liste.isFetchingNextPage} onClick={() => liste.fetchNextPage()}>
          {liste.isFetchingNextPage ? 'Chargement…' : 'Voir plus de commentaires ▾'}
        </button>
      )}
    </div>
  )
}